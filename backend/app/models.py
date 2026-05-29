"""
models.py — SQLAlchemy ORM models (database table definitions)
"""

from sqlalchemy import Column, String, Float, DateTime, Integer, Text, Index
from sqlalchemy.sql import func
from app.database import Base


class FlaggedTransaction(Base):
    """
    Stores every transaction that triggered at least one fraud rule.
    """

    __tablename__ = "flagged_transactions"

    # Primary key 
    id = Column(
        Integer,
        primary_key=True,
        autoincrement=True,
        comment="Auto-incrementing internal ID",
    )

    # Original transaction fields
    transaction_id = Column(
        String(100),
        nullable=False,
        unique=True,    
        index=True,      
        comment="Unique ID from the source system",
    )
    user_id = Column(
        String(100),
        nullable=False,
        index=True,  
        comment="User who made the transaction",
    )
    amount = Column(
        Float,
        nullable=False,
        comment="Transaction amount in USD",
    )
    timestamp = Column(
        DateTime,
        nullable=False,
        comment="When the transaction occurred (from source data)",
    )
    merchant = Column(
        String(255),
        nullable=True, 
        comment="Merchant or vendor name",
    )
    location = Column(
        String(255),
        nullable=True,
        comment="City/country where the transaction occurred",
    )

    # Fraud metadata
    reasons = Column(
        Text,
        nullable=False,
        comment="Comma-separated fraud rule names that were triggered",
    )

    # Audit field
    flagged_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        index=True,
        comment="When this record was created by the fraud engine",
    )

    # Composite index 
    # for efficient queries of recent flagged transactions by user
    # Speeds up: SELECT * FROM flagged_transactions WHERE user_id = ? ORDER BY flagged_at
    __table_args__ = (
        Index("ix_user_flagged_at", "user_id", "flagged_at"),
    )

    def reasons_list(self) -> list[str]:
        """
        Converts the stored comma-string back to a Python list.

        e.g. "RAPID_TRANSACTIONS,DAILY_LIMIT_EXCEEDED"
          -> ["RAPID_TRANSACTIONS", "DAILY_LIMIT_EXCEEDED"]
        """
        return [r.strip() for r in self.reasons.split(",") if r.strip()]

    def __repr__(self) -> str:
        return (
            f"<FlaggedTransaction "
            f"txn_id={self.transaction_id!r} "
            f"user={self.user_id!r} "
            f"reasons={self.reasons!r}>"
        )