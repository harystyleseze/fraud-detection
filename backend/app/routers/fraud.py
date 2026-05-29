"""
routers/fraud.py — HTTP endpoints for the fraud detection API.
"""

import time
from io import BytesIO
from typing import Optional

import ijson
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, Query, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import FlaggedTransaction
from app.schemas import (
    FlaggedTransactionOut,
    UploadSummary,
    HealthResponse,
    TransactionIn,
)
from app.services.fraud_engine import run_fraud_detection, build_summary
from app.config import get_settings

settings = get_settings()
router  = APIRouter()


# health check endpoint

@router.get(
    "/health",
    response_model=HealthResponse,
    tags=["System"],
    summary="Health check",
)
def health_check():
    """
    Docker health checks
    """
    return HealthResponse(
        status="ok",
        version=settings.APP_VERSION,
        env=settings.APP_ENV,
    )

# file upload endpoint

@router.post(
    "/upload",
    response_model=UploadSummary,
    tags=["Fraud Detection"],
    summary="Upload a JSON transaction file and run fraud detection",
    status_code=status.HTTP_200_OK,
)
async def upload_transactions(
    file: UploadFile = File(
        ...,
        description="JSON file — must be an array of transaction objects",
    ),
    db: Session = Depends(get_db),
):
    """
    Accepts a multipart file upload, runs all three fraud detection rules,
    persists flagged results to the database, and returns a summary.
    """

    # validate file extension
    if not file.filename or not file.filename.lower().endswith(".json"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only .json files are accepted. Please upload a JSON file.",
        )

    # read file content 
    # read all bytes into a BytesIO buffer for ijson to stream-parse
    content = await file.read()

    if not content:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The uploaded file is empty.",
        )

    # stream-parse the JSON 
    # ijson.items(buffer, "item") yields each element of the top-level array one by one
    buffer = BytesIO(content)
    raw_transactions: list[dict] = []

    try:
        for item in ijson.items(buffer, "item"):
            raw_transactions.append(item)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=(
                "Could not parse the JSON file. "
                "Make sure it is a valid JSON array of transaction objects."
            ),
        )

    if not raw_transactions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The file was parsed successfully but contains no transactions.",
        )

    # validate each transaction
    transactions: list[TransactionIn] = []
    skipped_count = 0

    for idx, raw in enumerate(raw_transactions):
        try:
            transactions.append(TransactionIn(**raw))
        except Exception as exc:
            skipped_count += 1
            print(f"[WARN] Row {idx + 1} failed validation and was skipped: {exc}")

    # If every single row failed validation, abort with a clear error
    if not transactions:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=(
                f"All {len(raw_transactions)} transactions failed validation. "
                "Check that required fields (transactionId, userId, amount, timestamp) "
                "are present and correctly formatted."
            ),
        )

    # run fraud detection 
    start_time = time.monotonic()
    flagged    = run_fraud_detection(transactions)
    elapsed_ms = (time.monotonic() - start_time) * 1000

    # persist to database
    # rely on the UNIQUE constraint on transaction_id rather than a full table scan
    new_records = [
        FlaggedTransaction(
            transaction_id=f["transaction_id"],
            user_id=       f["user_id"],
            amount=        f["amount"],
            timestamp=     f["timestamp"],
            merchant=      f["merchant"],
            location=      f["location"],
            reasons=       ",".join(f["reasons"]),
        )
        for f in flagged
    ]

    if new_records:
        try:
            db.bulk_save_objects(new_records)
            db.commit()
        except IntegrityError:
            db.rollback()
            for rec in new_records:
                try:
                    db.add(rec)
                    db.commit()
                except IntegrityError:
                    db.rollback()

    return build_summary(
        total=len(transactions),
        flagged=flagged,
        processing_time_ms=elapsed_ms,
    )


# query flagged transactions for a user
@router.get(
    "/fraud-check",
    response_model=list[FlaggedTransactionOut],
    tags=["Fraud Detection"],
    summary="Get all flagged transactions for a specific user",
)
def fraud_check(
    userId: str = Query(
        ...,
        min_length=1,
        description="The user ID to look up",
        examples=["USR001"],
    ),
    page:  int = Query(1,  ge=1,       description="Page number (1-based)"),
    limit: int = Query(20, ge=1, le=100, description="Results per page (max 100)"),
    db: Session = Depends(get_db),
):
    """
    Returns all flagged transactions for the given userId, sorted by timestamp
    descending (most recent first), with pagination.

    Returns an empty list — not a 404 — when the user has no flagged transactions.
    This is intentional: a clean user is a valid and expected outcome.
    """
    offset = (page - 1) * limit

    records = (
        db.query(FlaggedTransaction)
        .filter(FlaggedTransaction.user_id == userId)
        .order_by(FlaggedTransaction.timestamp.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )

    # Convert each ORM record to the response schema.
    # Specifically, split the comma-string reasons into a proper Python list.
    return [
        FlaggedTransactionOut(
            id=             r.id,
            transaction_id= r.transaction_id,
            user_id=        r.user_id,
            amount=         r.amount,
            timestamp=      r.timestamp,
            merchant=       r.merchant,
            location=       r.location,
            reasons=        r.reasons_list(),
            flagged_at=     r.flagged_at,
        )
        for r in records
    ]


# stats endpoint for aggregate insights

@router.get(
    "/stats",
    tags=["Fraud Detection"],
    summary="Global statistics across all flagged transactions",
)
def get_stats(db: Session = Depends(get_db)):
    """
    Returns aggregate counts
    """
    total_flagged = db.query(FlaggedTransaction).count()
    unique_users  = db.query(FlaggedTransaction.user_id).distinct().count()

    # Count how many times each rule was triggered
    all_reasons_rows = db.query(FlaggedTransaction.reasons).all()
    rule_counts: dict[str, int] = {
        "RAPID_TRANSACTIONS":       0,
        "DAILY_LIMIT_EXCEEDED":     0,
        "IMPOSSIBLE_LOCATION_JUMP": 0,
    }
    for (reasons_str,) in all_reasons_rows:
        for reason in reasons_str.split(","):
            reason = reason.strip()
            if reason in rule_counts:
                rule_counts[reason] += 1

    return {
        "total_flagged_transactions": total_flagged,
        "unique_flagged_users":       unique_users,
        "rule_breakdown":             rule_counts,
    }