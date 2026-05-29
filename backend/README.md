# Fraud Detection API

A FastAPI backend that processes financial transaction logs and flags suspicious activity using three behavioural rules.

**Repo:** https://github.com/harystyleseze/fraud-detection

---

## What it does

Upload a JSON file of transactions → the API detects fraud and stores flagged entries → query flagged transactions by user.

**Three detection rules:**

| Rule | Trigger |
|------|---------|
| Rapid transactions | More than 5 transactions by the same user within 60 seconds |
| Daily limit exceeded | Same user spends more than $10,000 in a calendar day |
| Impossible location jump | Same user transacts from a different location within 2 minutes |

---

## Tech stack

- **Python 3.12** + **FastAPI** — API framework
- **SQLAlchemy** — ORM (SQLite for dev, PostgreSQL for production)
- **Pydantic v2** — request/response validation
- **ijson** — streaming JSON parser (handles large files)
- **uvicorn** — ASGI server
- **pytest** — unit tests
- **Docker** — containerised builds

---

## Quick start (local)

### Prerequisites

- Python 3.12 (`python3.12 --version`)
- Git

### 1. Clone and navigate

```bash
git clone https://github.com/harystyleseze/fraud-detection.git
cd fraud-detection/backend
```

### 2. Create a virtual environment

```bash
python3.12 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
```

> **Important:** Use Python 3.12 specifically. Python 3.14 cannot build `pydantic-core` wheels.

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure environment

```bash
cp .env.example .env
```

The default `.env` uses SQLite — no database setup needed for local development.

### 5. Start the server

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API is now running at `http://localhost:8000`.

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

---

## Try it out

### Upload a transaction file

```bash
curl -X POST http://localhost:8000/api/v1/upload \
  -F "file=@../sample-data/transactions.json"
```

**Response:**
```json
{
  "total_transactions": 64,
  "flagged_count": 18,
  "clean_count": 46,
  "rule_breakdown": {
    "RAPID_TRANSACTIONS": 5,
    "DAILY_LIMIT_EXCEEDED": 10,
    "IMPOSSIBLE_LOCATION_JUMP": 5
  },
  "flagged_users": ["USR001", "USR002", ...],
  "processing_time_ms": 0.36
}
```

### Query a flagged user

```bash
curl "http://localhost:8000/api/v1/fraud-check?userId=USR001"
```

### Check a clean user

```bash
curl "http://localhost:8000/api/v1/fraud-check?userId=USR005"
# returns []
```

### View global stats

```bash
curl http://localhost:8000/api/v1/stats
```

---

## API endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/health` | Health check |
| `POST` | `/api/v1/upload` | Upload JSON transaction file, run detection |
| `GET` | `/api/v1/fraud-check?userId=X` | Get flagged transactions for a user |
| `GET` | `/api/v1/stats` | Aggregate rule counts across all flagged transactions |

**Pagination** on `/fraud-check`: add `?page=1&limit=20` (default) or up to `?limit=100`.

---

## Run tests

```bash
pytest -v
```

All 16 unit tests cover each fraud rule, boundary conditions, multi-rule triggers, and clean-transaction cases. No database or network required — pure logic tests.

---

## Docker

### Development (hot-reload)

```bash
docker compose up --build
```

Starts on `http://localhost:8000`. Source code is volume-mounted so edits reload instantly.

### Production (PostgreSQL)

```bash
docker compose --profile prod up --build
```

Starts on `http://localhost:8001`. Spins up a postgres:15 container alongside the optimised multi-stage image. The production service connects to PostgreSQL automatically.

---

## Project structure

```
backend/
├── app/
│   ├── main.py            # FastAPI app, CORS, lifespan hooks
│   ├── config.py          # Environment settings (pydantic-settings)
│   ├── database.py        # SQLAlchemy engine and session
│   ├── models.py          # FlaggedTransaction ORM model
│   ├── schemas.py         # Pydantic request/response models
│   ├── routers/
│   │   └── fraud.py       # HTTP endpoints
│   └── services/
│       └── fraud_engine.py  # Fraud detection logic (three rules)
├── tests/
│   └── test_fraud.py      # Unit tests
├── Dockerfile             # Production multi-stage build
├── Dockerfile.dev         # Development build with hot-reload
├── docker-compose.yml     # Dev + prod profiles
├── requirements.txt       # Pinned dependencies
└── .env.example           # Environment variable template
```

---

## Configuration

All thresholds are environment variables — no code changes needed to tune them:

| Variable | Default | Description |
|----------|---------|-------------|
| `RAPID_TXN_COUNT` | `5` | Max transactions before rapid-fire flag |
| `RAPID_TXN_WINDOW_SECONDS` | `60` | Rolling window in seconds |
| `DAILY_LIMIT_USD` | `10000.00` | Daily spending cap per user |
| `LOCATION_JUMP_WINDOW_SECONDS` | `120` | Window for impossible location check |
| `DATABASE_URL` | `sqlite:///./fraud.db` | Switch to `postgresql+psycopg://...` for production |

---

## Sample data

`../sample-data/transactions.json` contains 64 transactions across 12 users that exercise every rule, boundary condition, and clean case. Use it to verify detection results after setup.
