# ─────────────────────────────────────────────────────────────────────────────
# Backend — Production Image (Multi-stage build)
#
# Stage 1 (builder): installs Python dependencies with build tools
# Stage 2 (runtime): copies only the installed packages into a lean image
#
# Result: smaller image, fewer attack vectors, faster pulls
# ─────────────────────────────────────────────────────────────────────────────

# ── Stage 1: Builder ─────────────────────────────────────────────────────────
FROM python:3.12-slim AS builder

WORKDIR /install

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

# Install packages into a custom prefix (/deps) so we can copy just them
RUN pip install --prefix=/deps --no-cache-dir -r requirements.txt


# ── Stage 2: Runtime ─────────────────────────────────────────────────────────
FROM python:3.12-slim AS runtime

WORKDIR /app

# Copy only the installed packages from the builder stage
COPY --from=builder /deps /usr/local

# Copy the application source code
COPY app/ ./app/

# Create a non-root system user; grant ownership of workdir for SQLite writes
RUN addgroup --system appgroup \
    && adduser --system --ingroup appgroup appuser \
    && chown -R appuser:appgroup /app
USER appuser

EXPOSE 8000

# Docker health check: polls this URL every 30 seconds
# If it fails 3 times in a row, Docker marks the container as unhealthy
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD python -c \
    "import urllib.request; urllib.request.urlopen('http://localhost:8000/api/v1/health')"

# Production server settings:
# --workers 2: run 2 worker processes (use 2x CPU cores in real deployments)
# --no-access-log: reduce log noise (use a reverse proxy for access logs)
CMD ["uvicorn", "app.main:app", \
     "--host", "0.0.0.0", \
     "--port", "8000", \
     "--workers", "2", \
     "--no-access-log"]