# syntax=docker/dockerfile:1.6
# ============================================================
# Stage 1 — Build the React / Vite frontend
# ============================================================
FROM node:20-alpine AS frontend-builder

WORKDIR /app/ui

# Install dependencies (npm cache mount speeds up repeated builds)
COPY ui/package.json ui/package-lock.json* ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --silent

# Copy source and produce an optimised production build
COPY ui/ ./
RUN npm run build


# ============================================================
# Stage 2 — Production image: Python backend + pre-built UI
# ============================================================
FROM python:3.11-slim AS final

# ── OCI image labels ───────────────────────────────────────
LABEL org.opencontainers.image.title="CodeSentinel" \
      org.opencontainers.image.description="AI-powered code review assistant" \
      org.opencontainers.image.base.name="python:3.11-slim"

# ── System dependencies ────────────────────────────────────
# curl  → used by the healthcheck probe
# tini  → PID-1 init: forwards signals and reaps zombie processes
RUN apt-get update \
 && apt-get install -y --no-install-recommends \
      curl \
      tini \
 && rm -rf /var/lib/apt/lists/*

# ── Non-root user with explicit UID/GID ───────────────────
RUN groupadd --system --gid 1001 appgroup \
 && useradd  --system --uid 1001 --gid appgroup --no-create-home appuser

WORKDIR /app

# ── Python dependencies (pip cache mount speeds up repeated builds) ──
COPY requirements.txt ./
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install --upgrade pip \
 && pip install -r requirements.txt

# ── Application source (owned by non-root user at copy time) ──
COPY --chown=appuser:appgroup main.py analyzer.py ./
COPY --chown=appuser:appgroup api/      ./api/
COPY --chown=appuser:appgroup core/     ./core/
COPY --chown=appuser:appgroup services/ ./services/

# ── Pre-built frontend assets from Stage 1 ────────────────
COPY --from=frontend-builder --chown=appuser:appgroup /app/ui/dist ./ui/dist

# ── Writable runtime directory ─────────────────────────────
RUN mkdir -p uploads \
 && chown appuser:appgroup uploads

# ── Drop to non-root ───────────────────────────────────────
USER appuser

# ── Runtime environment defaults ──────────────────────────
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8000

EXPOSE 8000

# tini as PID-1 ensures clean shutdown and proper signal forwarding
ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT} --workers 2"]
