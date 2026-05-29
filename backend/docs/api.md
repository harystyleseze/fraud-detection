# API Reference

Base URL: `http://localhost:8000`  
All fraud detection endpoints are prefixed with `/api/v1`.

Interactive docs: `/docs` (Swagger UI), `/redoc` (ReDoc)

---

## Endpoints

### GET /

Root info. Confirms the API is reachable.

**Response 200**
```json
{
  "name": "Fraud Detection API",
  "version": "1.0.0",
  "docs": "/docs",
  "health": "/api/v1/health"
}
```

---

### GET /api/v1/health

Health check used by Docker and load balancers.

**Response 200**
```json
{
  "status": "ok",
  "version": "1.0.0",
  "env": "development"
}
```

---

### POST /api/v1/upload

Upload a JSON transaction file and run all three fraud detection rules. Flagged transactions are persisted to the database.

**Request**

Content-Type: `multipart/form-data`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | file | Yes | `.json` file containing an array of transaction objects |

The file must be a JSON array. Each element is validated against `TransactionIn` (see Schemas). Invalid rows are skipped with a warning; if every row fails validation the request returns 422.

**Example file content**
```json
[
  {
    "transactionId": "TXN-1001",
    "userId": "USR001",
    "amount": 150.00,
    "timestamp": "2025-01-15T10:00:00",
    "merchant": "Shoprite Lagos",
    "location": "Lagos, NG"
  }
]
```

**Response 200 — `UploadSummary`**
```json
{
  "total_transactions": 100,
  "flagged_count": 12,
  "clean_count": 88,
  "rule_breakdown": {
    "RAPID_TRANSACTIONS": 5,
    "DAILY_LIMIT_EXCEEDED": 4,
    "IMPOSSIBLE_LOCATION_JUMP": 3
  },
  "flagged_users": ["USR002", "USR007"],
  "processing_time_ms": 14.32
}
```

**Errors**

| Status | Condition |
|--------|-----------|
| 400 | File is not `.json`, file is empty, or file contains no transactions after parsing |
| 422 | File is not valid JSON, or every row failed validation |

**Idempotency:** Re-uploading the same file is safe. Duplicate `transaction_id` values are silently skipped due to a UNIQUE constraint on the database column.

---

### GET /api/v1/fraud-check

Get all flagged transactions for a specific user, paginated, sorted by timestamp descending.

**Query Parameters**

| Parameter | Type | Required | Default | Constraints | Description |
|-----------|------|----------|---------|-------------|-------------|
| `userId` | string | Yes | — | min length 1 | User ID to look up |
| `page` | integer | No | 1 | ≥ 1 | Page number (1-based) |
| `limit` | integer | No | 20 | 1–100 | Results per page |

**Response 200 — `list[FlaggedTransactionOut]`**
```json
[
  {
    "id": 1,
    "transaction_id": "TXN-1001",
    "user_id": "USR001",
    "amount": 150.00,
    "timestamp": "2025-01-15T10:00:00",
    "merchant": "Shoprite Lagos",
    "location": "Lagos, NG",
    "reasons": ["RAPID_TRANSACTIONS"],
    "flagged_at": "2025-01-15T10:05:00+00:00"
  }
]
```

Returns an empty array `[]` when the user has no flagged transactions. This is not an error.

---

### GET /api/v1/stats

Aggregate statistics across all flagged transactions in the database.

**Response 200**
```json
{
  "total_flagged_transactions": 45,
  "unique_flagged_users": 8,
  "rule_breakdown": {
    "RAPID_TRANSACTIONS": 20,
    "DAILY_LIMIT_EXCEEDED": 15,
    "IMPOSSIBLE_LOCATION_JUMP": 10
  }
}
```

---

## Schemas

### TransactionIn

Input schema for each transaction in an uploaded file.

| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| `transactionId` | string | Yes | min length 1 | Unique transaction identifier |
| `userId` | string | Yes | min length 1 | ID of the user |
| `amount` | float | Yes | > 0, rounded to 2 dp | Amount in USD |
| `timestamp` | string | Yes | ISO 8601 | When the transaction occurred |
| `merchant` | string | No | — | Merchant or vendor name |
| `location` | string | No | — | City/country of the transaction |

---

### FlaggedTransactionOut

Returned by `GET /api/v1/fraud-check`.

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| `id` | integer | No | Internal database ID |
| `transaction_id` | string | No | Source transaction ID |
| `user_id` | string | No | User ID |
| `amount` | float | No | Amount in USD |
| `timestamp` | datetime | No | When the transaction occurred |
| `merchant` | string | Yes | Merchant name |
| `location` | string | Yes | Location |
| `reasons` | list[string] | No | Rule names that fired (see below) |
| `flagged_at` | datetime | No | When this record was created |

**Possible `reasons` values:**
- `RAPID_TRANSACTIONS`
- `DAILY_LIMIT_EXCEEDED`
- `IMPOSSIBLE_LOCATION_JUMP`

A single transaction can have more than one reason.

---

### UploadSummary

Returned by `POST /api/v1/upload`.

| Field | Type | Description |
|-------|------|-------------|
| `total_transactions` | integer | Total rows in the uploaded file (after skipping invalid) |
| `flagged_count` | integer | Number of transactions that triggered at least one rule |
| `clean_count` | integer | `total_transactions - flagged_count` |
| `rule_breakdown` | object | Count of how many times each rule fired |
| `flagged_users` | list[string] | Sorted list of user IDs that were flagged |
| `processing_time_ms` | float | Time the fraud engine took in milliseconds |

---

### HealthResponse

| Field | Type |
|-------|------|
| `status` | string |
| `version` | string |
| `env` | string |

---

### ErrorResponse

Returned on 4xx/5xx responses.

| Field | Type |
|-------|------|
| `detail` | string |
