# Product

---

## What It Does

The Fraud Detection API accepts JSON files containing financial transaction logs, analyses them using three behavioural rules, stores any flagged transactions in a database, and provides endpoints to query flagged records and view statistics.

---

## Fraud Rules

All three rules run on every upload. A single transaction can trigger more than one rule.

### Rule 1 — Rapid Transactions

**What it detects:** A user making more than 5 transactions within any 60-second window.

**How it works:** A sliding deque tracks transaction timestamps per user. When the count inside the window exceeds the threshold, the triggering transaction is flagged. Old timestamps fall out of the window as time advances.

**Rule name in output:** `RAPID_TRANSACTIONS`

**Configurable thresholds:**
- `RAPID_TXN_COUNT` (default: 5)
- `RAPID_TXN_WINDOW_SECONDS` (default: 60)

---

### Rule 2 — Daily Limit Exceeded

**What it detects:** A user spending more than $10,000 in a single calendar day.

**How it works:** Cumulative spending is tracked per user per calendar date. The first transaction that pushes the running total past the limit is flagged, and every subsequent transaction by that user on the same day is also flagged.

**Rule name in output:** `DAILY_LIMIT_EXCEEDED`

**Configurable threshold:**
- `DAILY_LIMIT_USD` (default: 10000.00)

---

### Rule 3 — Impossible Location Jump

**What it detects:** A user appearing in two different locations within 120 seconds — a physically impossible travel speed.

**How it works:** The most recent transaction location per user is stored. If the next transaction occurs from a different, non-empty location within the time window, it is flagged. The first transaction for any user is never flagged (no baseline to compare). Transactions with missing or empty locations skip this rule.

**Rule name in output:** `IMPOSSIBLE_LOCATION_JUMP`

**Configurable threshold:**
- `LOCATION_JUMP_WINDOW_SECONDS` (default: 120)

---

## Upload Flow

1. Client sends a `POST /api/v1/upload` request with a `.json` file.
2. The router validates the file extension and reads the bytes.
3. `ijson` streams through the JSON array; invalid rows are skipped.
4. Each valid row is validated against the `TransactionIn` schema.
5. The fraud engine runs all three rules in a single chronological pass.
6. Flagged transactions are bulk-saved to the database. Duplicate `transaction_id` values are silently skipped.
7. The endpoint returns an `UploadSummary` with counts, rule breakdown, flagged users, and processing time.

---

## Query Flow

1. Client sends `GET /api/v1/fraud-check?userId=USR001`.
2. The router queries `flagged_transactions` filtered by `user_id`, sorted by `timestamp` descending.
3. Returns a paginated list of `FlaggedTransactionOut` objects.
4. Returns an empty list if the user has no flagged records (not a 404).
