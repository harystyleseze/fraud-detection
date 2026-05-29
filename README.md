# Fraud Detection

Analyse financial transaction logs and flag suspicious activity using three behavioural rules.

**Repo:** https://github.com/harystyleseze/fraud-detection

---

## What it does

Upload a JSON file of transactions — the backend detects fraud and stores flagged records. The frontend provides a dashboard to upload files, view flagged users, browse results, and visualise transactions on a heatmap.

---

## Tech stack

| Layer | Stack |
|-------|-------|
| Backend | Python 3.12, FastAPI, SQLAlchemy, SQLite (dev) / PostgreSQL (prod), uvicorn |
| Frontend | React 19, Vite 8, React Router, Leaflet |

---

## Quick start

Start the backend first — the frontend proxies all API calls to it.

### Backend

```bash
git clone https://github.com/harystyleseze/fraud-detection.git
cd fraud-detection/backend
```

```bash
python3.12 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
```

> Use Python 3.12 specifically. `pydantic-core` wheels do not build on 3.14.

```bash
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

API running at `http://localhost:8000` — docs at `/docs`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

App running at `http://localhost:5173`.

---

## Docker (backend)

```bash
# Development — SQLite, hot-reload
docker compose up --build

# Production — PostgreSQL
docker compose --profile prod up --build
```

Dev runs on port `8000`, prod on `8001`.

---

## API endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/health` | Health check |
| `POST` | `/api/v1/upload` | Upload JSON transaction file, run detection |
| `GET` | `/api/v1/fraud-check?userId=X` | Paginated flagged transactions for a user |
| `GET` | `/api/v1/stats` | Aggregate rule counts across all flagged transactions |

Full API reference: [`backend/docs/api.md`](backend/docs/api.md)

---

## Tests

```bash
cd backend
pytest -v
```

16 unit tests — all fraud rules, boundary conditions, multi-rule triggers.

---

## Project structure

```
fraud-detection/
├── backend/          # FastAPI app, fraud engine, Docker
│   ├── app/
│   ├── tests/
│   ├── docs/         # api.md, architecture.md, deployment.md, product.md, testing.md
│   └── README.md
├── frontend/         # React + Vite dashboard
│   └── src/
└── sample-data/      # 64 sample transactions covering all rules
```
