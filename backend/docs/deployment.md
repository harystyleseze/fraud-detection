# Deployment

---

## Prerequisites

- Docker and Docker Compose (for containerised setup)
- Python 3.12+ and pip (for running without Docker)

---

## Local Development (Docker)

1. Copy the environment file:
   ```bash
   cp .env.example .env
   ```

2. Start the API:
   ```bash
   docker compose up --build
   ```

3. The API is available at `http://localhost:8000`.
   - Swagger UI: `http://localhost:8000/docs`
   - ReDoc: `http://localhost:8000/redoc`

The dev setup uses `Dockerfile.dev` which mounts the source directory into the container at `/app` and runs uvicorn with `--reload`. Code changes take effect immediately without rebuilding.

Database: SQLite file at `./fraud.db` (created automatically on first run).

---

## Production (Docker + PostgreSQL)

1. Start with the `prod` profile:
   ```bash
   docker compose --profile prod up --build
   ```

2. The API is available at `http://localhost:8001`.

The prod setup uses the multi-stage `Dockerfile`, runs uvicorn with 2 workers, and connects to a PostgreSQL 15 container. The API service waits for PostgreSQL to pass its health check before starting.

---

## Without Docker

```bash
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Ensure `DATABASE_URL` in `.env` points to a reachable database (SQLite by default).

---

## Environment Variables

All variables are read from `.env` at startup. Copy `.env.example` as a starting point.

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `APP_ENV` | string | `development` | Environment label (`development` or `production`) |
| `APP_NAME` | string | `Fraud Detection API` | API display name shown in docs and logs |
| `APP_VERSION` | string | `1.0.0` | Version string returned by `/api/v1/health` |
| `DATABASE_URL` | string | `sqlite:///./fraud.db` | SQLAlchemy connection string |
| `CORS_ORIGINS` | string | `http://localhost:5173,http://localhost:3000` | Comma-separated list of allowed frontend origins |
| `RAPID_TXN_COUNT` | integer | `5` | Max transactions per user before rapid-transaction rule fires |
| `RAPID_TXN_WINDOW_SECONDS` | integer | `60` | Rolling window size for rapid-transaction check (seconds) |
| `DAILY_LIMIT_USD` | float | `10000.00` | Daily spending cap per user in USD |
| `LOCATION_JUMP_WINDOW_SECONDS` | integer | `120` | Window for impossible-location check (seconds) |

**PostgreSQL connection string format:**
```
DATABASE_URL=postgresql+psycopg://user:password@host:5432/dbname
```

---

## Docker Services

| Service | Profile | Image | Port | Description |
|---------|---------|-------|------|-------------|
| `api` | default (dev) | `Dockerfile.dev` | 8000 | Dev server with hot-reload, SQLite |
| `db` | `prod` | `postgres:15-alpine` | 5432 | PostgreSQL with persistent volume |
| `api-prod` | `prod` | `Dockerfile` | 8001 → 8000 | Production server, 2 uvicorn workers |

The `db` service runs a health check (`pg_isready`) every 10 seconds. `api-prod` only starts once `db` is healthy.

---

## Production Dockerfile Notes

The production `Dockerfile` uses a two-stage build:

- **Stage 1 (builder):** Python 3.12-slim with build tools; installs all dependencies to `/deps`.
- **Stage 2 (runtime):** Clean Python 3.12-slim; copies installed packages and app source only. Runs as a non-root user (`appuser`).

Built-in health check polls `GET /api/v1/health` every 30 seconds with a threshold of 3 failures.

---

## Database Initialisation

Tables are created automatically on startup via `init_db()` in the lifespan hook (`main.py`). No migration commands are needed for a fresh deployment.

Alembic is included in `requirements.txt` for schema migrations if needed in future.
