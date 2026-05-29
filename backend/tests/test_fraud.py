"""
Tests for fraud_engine.run_fraud_detection().
"""

import pytest
from datetime import datetime, timedelta

from app.schemas import TransactionIn
from app.services.fraud_engine import (
    run_fraud_detection,
    RAPID_TRANSACTIONS,
    DAILY_LIMIT_EXCEEDED,
    IMPOSSIBLE_LOCATION_JUMP,
)


# Helper function
def make_txn(
    txn_id:   str,
    user_id:  str,
    amount:   float,
    dt:       datetime,
    location: str = "Lagos, NG",
    merchant: str = "TestMerchant",
) -> TransactionIn:
    """Build a TransactionIn"""
    return TransactionIn(
        transactionId=txn_id,
        userId=user_id,
        amount=amount,
        timestamp=dt.isoformat(),
        merchant=merchant,
        location=location,
    )


# Base datetime, all relative times branch from here
BASE = datetime(2025, 1, 15, 10, 0, 0)

class TestRule1RapidTransactions:

    def test_exactly_5_transactions_in_window_not_flagged(self):
        """5 transactions is the threshold — the 5th should NOT trigger the rule."""
        txns = [
            make_txn(f"T{i}", "USR1", 10.0, BASE + timedelta(seconds=i * 10))
            for i in range(5)
        ]
        result = run_fraud_detection(txns)
        assert result == [], "5 transactions should not be flagged"

    def test_6th_transaction_in_window_is_flagged(self):
        """The 6th transaction within 60 seconds must trigger RAPID_TRANSACTIONS."""
        txns = [
            make_txn(f"T{i}", "USR1", 10.0, BASE + timedelta(seconds=i * 8))
            for i in range(6)
        ]
        result = run_fraud_detection(txns)
        flagged_ids = [f["transaction_id"] for f in result]
        reasons     = [r for f in result for r in f["reasons"]]

        assert "T5" in flagged_ids, "The 6th transaction (T5) should be flagged"
        assert RAPID_TRANSACTIONS in reasons

    def test_7th_transaction_in_window_is_also_flagged(self):
        """Every transaction beyond the threshold in the same window is flagged."""
        txns = [
            make_txn(f"T{i}", "USR1", 10.0, BASE + timedelta(seconds=i * 7))
            for i in range(7)
        ]
        result = run_fraud_detection(txns)
        rapid  = [f for f in result if RAPID_TRANSACTIONS in f["reasons"]]
        assert len(rapid) >= 2, "T5 and T6 should both be flagged"

    def test_window_slides_and_old_transactions_are_evicted(self):
        """Transactions spaced 15s apart stay under the 60s window limit."""
        txns = [
            make_txn(f"T{i}", "USR1", 10.0, BASE + timedelta(seconds=i * 15))
            for i in range(6)
        ]
        result = run_fraud_detection(txns)
        rapid  = [f for f in result if RAPID_TRANSACTIONS in f["reasons"]]
        assert rapid == [], "Transactions spread 15s apart should not trigger rapid rule"

    def test_different_users_windows_are_independent(self):
        """User A's transactions should not count towards User B's window."""
        txns = []
        for i in range(3):
            txns.append(make_txn(f"TA{i}", "USR_A", 10.0, BASE + timedelta(seconds=i * 5)))
            txns.append(make_txn(f"TB{i}", "USR_B", 10.0, BASE + timedelta(seconds=i * 5)))

        result = run_fraud_detection(txns)
        assert result == [], "Different users' transactions must not share a window"


class TestRule2DailyLimit:

    def test_exactly_10000_is_not_flagged(self):
        """$10,000 exactly is the threshold — not over it, so should not flag."""
        txns = [
            make_txn("T1", "USR2", 5000.0, BASE),
            make_txn("T2", "USR2", 5000.0, BASE + timedelta(hours=2)),
        ]
        result = run_fraud_detection(txns)
        daily  = [f for f in result if DAILY_LIMIT_EXCEEDED in f["reasons"]]
        assert daily == [], "$10,000 exactly should not exceed the limit"

    def test_one_cent_over_10000_is_flagged(self):
        """$10,000.01 should trigger the rule."""
        txns = [
            make_txn("T1", "USR2", 5000.00, BASE),
            make_txn("T2", "USR2", 5000.01, BASE + timedelta(hours=2)),
        ]
        result = run_fraud_detection(txns)
        assert any(DAILY_LIMIT_EXCEEDED in f["reasons"] for f in result)

    def test_daily_total_resets_on_new_calendar_day(self):
        """$6000 on day 1 and $6000 on day 2 should both be clean."""
        txns = [
            make_txn("T1", "USR2", 6000.0, datetime(2025, 1, 15, 23, 0, 0)),
            make_txn("T2", "USR2", 6000.0, datetime(2025, 1, 16,  1, 0, 0)),
        ]
        result = run_fraud_detection(txns)
        daily  = [f for f in result if DAILY_LIMIT_EXCEEDED in f["reasons"]]
        assert daily == [], "Limit should reset at midnight"

    def test_all_transactions_after_limit_breach_are_flagged(self):
        """Once the limit is breached, every subsequent transaction that day is also flagged."""
        txns = [
            make_txn("T1", "USR2", 10001.0, BASE),
            make_txn("T2", "USR2",   100.0, BASE + timedelta(hours=1)),
            make_txn("T3", "USR2",    50.0, BASE + timedelta(hours=2)),
        ]
        result = run_fraud_detection(txns)
        daily  = [f for f in result if DAILY_LIMIT_EXCEEDED in f["reasons"]]
        assert len(daily) == 3, "T1, T2, and T3 should all be flagged"

class TestRule3LocationJump:

    def test_same_location_not_flagged(self):
        """Two transactions in the same city seconds apart should be clean."""
        txns = [
            make_txn("T1", "USR3", 100.0, BASE,                          location="Lagos, NG"),
            make_txn("T2", "USR3", 200.0, BASE + timedelta(seconds=30),  location="Lagos, NG"),
        ]
        assert run_fraud_detection(txns) == []

    def test_different_location_within_2_minutes_is_flagged(self):
        """Lagos → London in 90 seconds is physically impossible — must flag."""
        txns = [
            make_txn("T1", "USR3", 100.0, BASE,                          location="Lagos, NG"),
            make_txn("T2", "USR3", 200.0, BASE + timedelta(seconds=90),  location="London, UK"),
        ]
        result = run_fraud_detection(txns)
        assert any(IMPOSSIBLE_LOCATION_JUMP in f["reasons"] for f in result)
        assert any(f["transaction_id"] == "T2" for f in result)

    def test_different_location_after_2_minutes_is_not_flagged(self):
        """After 121 seconds, a new location is acceptable (could be a legitimate trip)."""
        txns = [
            make_txn("T1", "USR3", 100.0, BASE,                           location="Lagos, NG"),
            make_txn("T2", "USR3", 200.0, BASE + timedelta(seconds=121),  location="London, UK"),
        ]
        result = run_fraud_detection(txns)
        loc    = [f for f in result if IMPOSSIBLE_LOCATION_JUMP in f["reasons"]]
        assert loc == [], "After the window, location change is acceptable"

    def test_first_transaction_never_location_flagged(self):
        """There is no previous transaction to compare the first one to."""
        txns = [make_txn("T1", "USR3", 500.0, BASE, location="Mars, SOL")]
        assert run_fraud_detection(txns) == []

    def test_missing_location_does_not_flag(self):
        """If location is None or empty, Rule 3 should be skipped."""
        txns = [
            make_txn("T1", "USR3", 100.0, BASE,                         location=""),
            make_txn("T2", "USR3", 200.0, BASE + timedelta(seconds=10), location="Lagos, NG"),
        ]
        result = run_fraud_detection(txns)
        loc    = [f for f in result if IMPOSSIBLE_LOCATION_JUMP in f["reasons"]]
        assert loc == [], "Empty location should not trigger location jump"

class TestMultipleRules:

    def test_single_transaction_can_trigger_multiple_rules(self):
        """A transaction can breach both the rapid window and the daily limit."""
        txns = [
            make_txn(f"T{i}", "USR_MULTI", 2000.0, BASE + timedelta(seconds=i * 8))
            for i in range(6)
        ]
        result = run_fraud_detection(txns)
        multi  = [f for f in result if len(f["reasons"]) > 1]
        assert len(multi) >= 1, "At least one transaction should trigger 2+ rules"

    def test_clean_transactions_not_returned(self):
        """Transactions that trigger no rules must not appear in the results."""
        txns = [
            make_txn("C1", "CLEAN", 50.0, BASE),
            make_txn("C2", "CLEAN", 75.0, BASE + timedelta(hours=2)),
        ]
        assert run_fraud_detection(txns) == []