"""
fraud_engine.py — Core fraud detection logic.

Takes a list of validated transactions and returns a list of flagged ones.
"""

from collections import defaultdict, deque
from datetime import datetime
from typing import Any

from app.config import get_settings
from app.schemas import TransactionIn

settings = get_settings()

# Fraud rule name constants 
RAPID_TRANSACTIONS       = "RAPID_TRANSACTIONS"
DAILY_LIMIT_EXCEEDED     = "DAILY_LIMIT_EXCEEDED"
IMPOSSIBLE_LOCATION_JUMP = "IMPOSSIBLE_LOCATION_JUMP"


def _to_datetime(timestamp_str: str) -> datetime:
    """Parse an ISO timestamp string to a datetime object."""
    return datetime.fromisoformat(timestamp_str)


def run_fraud_detection(transactions: list[TransactionIn]) -> list[dict[str, Any]]:
    """
    Process a list of transactions and return only those that triggered a rule.
    """

    # Sort by timestamp ascending 
    sorted_txns = sorted(
        transactions,
        key=lambda t: _to_datetime(t.timestamp)
    )

    # State containers for each rule

    # Rule 1 - rapid transactions: maps userId → deque of unix timestamps within the current window
    # defaultdict(deque) automatically creates an empty deque for new user IDs
    user_windows: dict[str, deque] = defaultdict(deque)

    # Rule 2 - daily spending limit: maps (userId, date) → cumulative amount for that day
    # defaultdict(float) automatically starts new entries at 0.0
    daily_totals: dict[tuple, float] = defaultdict(float)

    # Rule 3 - impossible location jump: maps userId → { "ts_unix": float, "location": str }
    # Stores the most recent transaction seen for each user
    last_seen: dict[str, dict] = {}

    # Result collector
    flagged: list[dict[str, Any]] = []

    # Next, Single pass through all transactions in chronological order
    for txn in sorted_txns:
        ts_dt   = _to_datetime(txn.timestamp)
        ts_unix = ts_dt.timestamp()         
        txn_date = ts_dt.date()              
        location = txn.location or ""

        reasons: list[str] = []

        # RULE 1: Rapid Transactions
        # Example with RAPID_TXN_COUNT=5, RAPID_TXN_WINDOW_SECONDS=60:
        #   Transactions at T+0, T+10, T+20, T+30, T+40  -- deque has 5 items = OK
        #   Transaction at T+50                          -- deque has 6 items = FLAG
        #   Transaction at T+70                          -- deque has 5 items (T+0 evicted) = OK
        window = user_windows[txn.userId]
        window.append(ts_unix)

        # Evict timestamps that have fallen outside the rolling window
        while window and (ts_unix - window[0]) > settings.RAPID_TXN_WINDOW_SECONDS:
            window.popleft()

        if len(window) > settings.RAPID_TXN_COUNT:
            reasons.append(RAPID_TRANSACTIONS)

        # RULE 2: Daily Spending Limit
        # Example with DAILY_LIMIT_USD=10000:
        #   USR002 spends $3500, $4200, $2800 on the same day
        #   Running totals: $3500, $7700, $10500
        #   TXN pushing total past $10000 is flagged. All subsequent ones too.

        daily_key = (txn.userId, txn_date)
        daily_totals[daily_key] += txn.amount

        if daily_totals[daily_key] > settings.DAILY_LIMIT_USD:
            reasons.append(DAILY_LIMIT_EXCEEDED)

        # RULE 3: Impossible Location Jump
        # Example with LOCATION_JUMP_WINDOW_SECONDS=120:
        #   USR003 at 08:00:00 in "Lagos, NG"
        #   USR003 at 08:01:30 in "London, UK"  -- 90 seconds later, different location = FLAG
        #
        # The first transaction for a user is never flagged
        if txn.userId in last_seen:
            prev = last_seen[txn.userId]
            time_diff = ts_unix - prev["ts_unix"]
            locations_differ = bool(location) and bool(prev["location"]) and location != prev["location"]
            within_window = time_diff <= settings.LOCATION_JUMP_WINDOW_SECONDS

            if locations_differ and within_window:
                reasons.append(IMPOSSIBLE_LOCATION_JUMP)

        last_seen[txn.userId] = {
            "ts_unix":  ts_unix,
            "location": location,
        }

        # Collect if any rule fired 
        if reasons:
            flagged.append({
                "transaction_id": txn.transactionId,
                "user_id":        txn.userId,
                "amount":         txn.amount,
                "timestamp":      ts_dt,
                "merchant":       txn.merchant,
                "location":       txn.location,
                "reasons":        reasons,
            })

    return flagged


def build_summary(
    total: int,
    flagged: list[dict[str, Any]],
    processing_time_ms: float,
) -> dict[str, Any]:
    """
    Build the summary statistics object returned after file processing
    """
    rule_breakdown: dict[str, int] = {
        RAPID_TRANSACTIONS:       0,
        DAILY_LIMIT_EXCEEDED:     0,
        IMPOSSIBLE_LOCATION_JUMP: 0,
    }
    flagged_users: set[str] = set()

    for txn in flagged:
        flagged_users.add(txn["user_id"])
        for reason in txn["reasons"]:
            if reason in rule_breakdown:
                rule_breakdown[reason] += 1

    return {
        "total_transactions":  total,
        "flagged_count":       len(flagged),
        "clean_count":         total - len(flagged),
        "rule_breakdown":      rule_breakdown,
        "flagged_users":       sorted(flagged_users),
        "processing_time_ms":  round(processing_time_ms, 2),
    }