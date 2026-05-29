# Architecture

The backend is a FastAPI service that accepts JSON transaction files, runs three rule-based fraud checks, persists flagged transactions to a database, and exposes endpoints to query results and statistics.

---

## Layer Diagram

```
HTTP Request
     │
     ▼
┌─────────────────────────────────┐
│  Router  (routers/fraud.py)     │  validates input, handles HTTP
└─────────────┬───────────────────┘
              │
              ▼
┌─────────────────────────────────┐
│  Fraud Engine                   │  pure detection logic, no side effects
│  (services/fraud_engine.py)     │
└─────────────┬───────────────────┘
              │
              ▼
┌─────────────────────────────────┐
│  ORM / Database                 │  persists and queries flagged records
│  (models.py + database.py)      │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│  Config  (config.py)            │  LRU-cached settings singleton
└─────────────────────────────────┘
     ↑ used by all layers
```

---

## Components

| File | Role |
|------|------|
| `app/main.py` | Creates the FastAPI app, registers CORS middleware, mounts the router at `/api/v1`, runs `init_db()` on startup |
| `app/config.py` | `Settings` class backed by pydantic-settings; reads from `.env` and environment variables; cached via `@lru_cache()` |
| `app/database.py` | Creates the SQLAlchemy engine (SQLite or PostgreSQL), `SessionLocal` factory, `get_db()` dependency, and `init_db()` |
| `app/models.py` | `FlaggedTransaction` ORM model; defines the `flagged_transactions` table and its indexes |
| `app/schemas.py` | Pydantic models for request validation (`TransactionIn`) and response serialization (`FlaggedTransactionOut`, `UploadSummary`, etc.) |
| `app/routers/fraud.py` | 4 HTTP endpoints; handles file upload, streaming parse, DB writes, and query responses |
| `app/services/fraud_engine.py` | `run_fraud_detection()` and `build_summary()`; stateless, deterministic, no database access |

---

## Fraud Engine Algorithm

`run_fraud_detection(transactions)` takes a list of validated `TransactionIn` objects and returns a list of flagged transaction dicts.

**Steps:**
1. Sort all transactions by timestamp ascending (single chronological pass).
2. Iterate once through the sorted list, evaluating all three rules per transaction.
3. Collect any transaction that triggers at least one rule.

**Time and space:** O(n) pass, O(n) state (one deque, one dict, and one float dict, all keyed by user).

### Rule 1 — RAPID_TRANSACTIONS

Data structure: `defaultdict(deque)` keyed by `userId`.

For each transaction, append the current unix timestamp to the user's deque, then evict timestamps older than `RAPID_TXN_WINDOW_SECONDS` from the left. If the deque length exceeds `RAPID_TXN_COUNT`, the transaction is flagged.

```
window=5, period=60s:
T+0, T+10, T+20, T+30, T+40  → deque len=5 → OK
T+50                          → deque len=6 → FLAG
T+70                          → T+0 evicted, deque len=6 → FLAG
```

### Rule 2 — DAILY_LIMIT_EXCEEDED

Data structure: `defaultdict(float)` keyed by `(userId, date)`.

For each transaction, add `amount` to the running daily total for that user and calendar date. If the total exceeds `DAILY_LIMIT_USD`, the transaction is flagged. All subsequent transactions by the same user on that date are also flagged (the daily total never resets intra-day).

### Rule 3 — IMPOSSIBLE_LOCATION_JUMP

Data structure: `dict` keyed by `userId`, storing `{ts_unix, location}` of the last seen transaction.

For each transaction, compare the current location against the stored previous location. If both are non-empty, the locations differ, and the time delta is within `LOCATION_JUMP_WINDOW_SECONDS`, the transaction is flagged. The first transaction per user is never flagged (no prior state).

---

## Database Schema

**Table:** `flagged_transactions`

| Column | Type | Nullable | Constraints | Description |
|--------|------|----------|-------------|-------------|
| `id` | Integer | No | Primary key, auto-increment | Internal ID |
| `transaction_id` | String(100) | No | Unique, indexed | Source transaction ID |
| `user_id` | String(100) | No | Indexed | User ID |
| `amount` | Float | No | — | Amount in USD |
| `timestamp` | DateTime | No | — | When the transaction occurred |
| `merchant` | String(255) | Yes | — | Merchant name |
| `location` | String(255) | Yes | — | Location |
| `reasons` | Text | No | — | Comma-separated rule names |
| `flagged_at` | DateTime(timezone) | No | Server default NOW, indexed | When this record was created |

**Indexes:**
- `ix_flagged_transactions_transaction_id` — unique index on `transaction_id`
- `ix_flagged_transactions_user_id` — index on `user_id`
- `ix_flagged_transactions_flagged_at` — index on `flagged_at`
- `ix_user_flagged_at` — composite index on `(user_id, flagged_at)` for range queries

The `reasons` column stores comma-separated strings (e.g. `"RAPID_TRANSACTIONS,DAILY_LIMIT_EXCEEDED"`). The `reasons_list()` method on the ORM model converts this back to a Python list.

---

## Key Design Decisions

**Streaming JSON parse (ijson):** The upload endpoint reads the file into a `BytesIO` buffer and streams it with `ijson.items(buffer, "item")`. This avoids loading the entire file into memory and supports large uploads.

**LRU-cached config:** `get_settings()` is decorated with `@lru_cache()`. The `Settings` object is created once per process and reused across all requests.

**Idempotent uploads:** The `transaction_id` column has a UNIQUE constraint. Re-uploading a file with previously seen IDs results in `IntegrityError` rollbacks, not duplicate records. The router handles this gracefully with a per-record fallback.

**Composite index:** The `(user_id, flagged_at)` index makes `GET /fraud-check` queries efficient — the database can filter by user and sort by time without a full table scan.

**SQLite / PostgreSQL dual support:** The engine is configured from `DATABASE_URL`. SQLite gets `check_same_thread=False`; PostgreSQL gets `pool_recycle=300` and `pool_pre_ping=True`. No other code differs between the two.

**Stateless fraud engine:** `run_fraud_detection()` takes a list and returns a list with no database access, no globals modified, and no external calls. This makes it easy to test in isolation and run outside a request context.
