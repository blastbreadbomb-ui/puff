# ─── Stage 1: Build frontend ───
FROM node:20-alpine AS frontend-build
WORKDIR /app

# Install dependencies (with layer caching)
COPY package.json package-lock.json ./
RUN npm ci --prefer-offline --no-audit

# Copy config and source
COPY index.html tsconfig.json tsconfig.node.json tailwind.config.js postcss.config.js vite.web.config.ts ./
COPY src/ ./src/
RUN npx vite build --config vite.web.config.ts

# ─── Stage 2: Runtime ───
FROM python:3.11-slim
WORKDIR /app

# System dependencies
RUN apt-get update -qq && \
    apt-get install -y --no-install-recommends curl && \
    rm -rf /var/lib/apt/lists/*

# Python dependencies
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend
COPY backend/ ./backend/

# Copy built frontend from stage 1
COPY --from=frontend-build /app/dist-web ./dist-web

# Create non-root user
RUN useradd -m -s /bin/bash appuser && \
    mkdir -p /app/backend/data && \
    chown -R appuser:appuser /app

USER appuser

# Health check
HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD curl -sf http://localhost:${PORT:-8899}/api/health || exit 1

WORKDIR /app/backend
EXPOSE 8899

CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8899} --workers 1 --log-level info
