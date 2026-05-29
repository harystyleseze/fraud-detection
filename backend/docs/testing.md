# Testing

---

## Running the Tests

From the `backend/` directory:

```bash
pytest -v
```

All dependencies required to run the tests are already in `requirements.txt` (`pytest==8.4.0`, `httpx==0.28.1`). No extra installation is needed.

---

## Test File

`tests/test_fraud.py` — 16 unit tests

All tests call `run_fraud_detection()` directly. There is no database, no HTTP server, and no external dependencies involved.

---

## Test Helper

```python
def make_txn(txn_id, user_id, amount, dt, location="Lagos, NG", merchant="TestMerchant")
```

Builds a `TransactionIn` object. All tests use this helper with a base datetime:

```python
BASE = datetime(2025, 1, 15, 10, 0, 0)
```

Relative timestamps are expressed as `BASE + timedelta(seconds=N)`.

---

## What Is Tested

### Rule 1 — Rapid Transactions (5 tests)

| Test | What it verifies |
|------|-----------------|
| `test_exactly_5_transactions_in_window_not_flagged` | The 5th transaction at the threshold is not flagged |
| `test_6th_transaction_in_window_is_flagged` | The 6th transaction within 60s triggers the rule |
| `test_7th_transaction_in_window_is_also_flagged` | Every transaction beyond the threshold in the same window is flagged |
| `test_window_slides_and_old_transactions_are_evicted` | Transactions spaced 15s apart stay below the 60s window limit |
| `test_different_users_windows_are_independent` | One user's count does not affect another user's window |

### Rule 2 — Daily Limit (4 tests)

| Test | What it verifies |
|------|-----------------|
| `test_exactly_10000_is_not_flagged` | $10,000 exactly does not exceed the limit |
| `test_one_cent_over_10000_is_flagged` | $10,000.01 triggers the rule |
| `test_daily_total_resets_on_new_calendar_day` | Totals are independent across calendar days |
| `test_all_transactions_after_limit_breach_are_flagged` | Every subsequent transaction on the same day after a breach is also flagged |

### Rule 3 — Impossible Location Jump (5 tests)

| Test | What it verifies |
|------|-----------------|
| `test_same_location_not_flagged` | Same location within the window is not flagged |
| `test_different_location_within_2_minutes_is_flagged` | Different location within 90s triggers the rule |
| `test_different_location_after_2_minutes_is_not_flagged` | Different location after 121s is acceptable |
| `test_first_transaction_never_location_flagged` | First transaction per user has no baseline and is never flagged |
| `test_missing_location_does_not_flag` | Empty or missing location skips the rule |

### Multiple Rules (2 tests)

| Test | What it verifies |
|------|-----------------|
| `test_single_transaction_can_trigger_multiple_rules` | One transaction can carry more than one reason |
| `test_clean_transactions_not_returned` | Transactions that trigger no rules are excluded from results |