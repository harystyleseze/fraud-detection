"""
schemas.py — Pydantic models for request validation and API responses.
"""

from pydantic import BaseModel, Field, field_validator
from datetime import datetime
from typing import Optional

# INPUT SCHEMAS

class TransactionIn(BaseModel):
    """
    Represents one transaction from the uploaded JSON file.

    Example valid input:
    {
        "transactionId": "TXN-1001",
        "userId": "USR001",
        "amount": 150.00,
        "timestamp": "2025-01-15T10:00:00",
        "merchant": "Shoprite Lagos",
        "location": "Lagos, NG"
    }
    """
    transactionId: str   = Field(
        ...,
        min_length=1,
        description="Unique identifier for this transaction",
    )
    userId: str          = Field(
        ...,
        min_length=1,
        description="ID of the user who made the transaction",
    )
    amount: float        = Field(
        ...,
        gt=0,
        description="Amount in USD — must be greater than zero",
    )
    timestamp: str       = Field(
        ...,
        description="When the transaction occurred, e.g. 2025-01-15T10:00:00",
    )
    merchant: Optional[str] = Field(None, description="Merchant or vendor name")
    location: Optional[str] = Field(None, description="City/country of transaction")

    @field_validator("timestamp")
    @classmethod
    def timestamp_must_be_valid_iso(cls, value: str) -> str:
        """
        Rejects any timestamp that is not a valid ISO 8601 datetime.
        This runs automatically before the fraud engine receives the data.
        """
        try:
            datetime.fromisoformat(value)
        except ValueError:
            raise ValueError(
                f"'{value}' is not a valid ISO 8601 datetime. "
                "Expected format: 2025-01-15T10:00:00"
            )
        return value

    @field_validator("amount")
    @classmethod
    def amount_must_be_positive(cls, value: float) -> float:
        if value <= 0:
            raise ValueError("Amount must be greater than zero")
        return round(value, 2)

# RESPONSE SCHEMAS
class FlaggedTransactionOut(BaseModel):
    """
    One flagged transaction as returned by GET /fraud-check.
    """
    id:             int
    transaction_id: str
    user_id:        str
    amount:         float
    timestamp:      datetime
    merchant:       Optional[str]
    location:       Optional[str]
    reasons:        list[str]
    flagged_at:     datetime

    # from_attributes=True allows Pydantic to build this from an ORM model object
    model_config = {"from_attributes": True}

class UploadSummary(BaseModel):
    """
    Returned by POST /upload after processing is complete.
    """
    total_transactions: int   = Field(..., description="Total rows in the uploaded file")
    flagged_count:      int   = Field(..., description="Number of transactions that triggered a rule")
    clean_count:        int   = Field(..., description="Number of transactions with no flags")
    rule_breakdown:     dict  = Field(..., description="Count of flags per rule")
    flagged_users:      list[str] = Field(..., description="User IDs that were flagged")
    processing_time_ms: float = Field(..., description="How long detection took in milliseconds")


class HealthResponse(BaseModel):
    status:  str
    version: str
    env:     str


class ErrorResponse(BaseModel):
    """Standard error shape returned on 4xx/5xx responses."""
    detail: str