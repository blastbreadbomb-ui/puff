# ── Stage 1: Build frontend ──
FROM node:20-alpine AS frontend-build
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy source and build
COPY index.html tsconfig.json tsconfig.node.json tailwind.config.js postcss.config.js vite.web.config.ts ./
COPY src/ ./src/
RUN npx vite build --config vite.web.config.ts

# ── Stage 2: Runtime ──
FROM python:3.11-slim
WORKDIR /app

# Install Python dependencies
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend/ ./backend/

# Copy built frontend from stage 1
COPY --from=frontend-build /app/dist-web ./dist-web

# Create data directory for SQLite
RUN mkdir -p /app/backend/data

WORKDIR /app/backend
EXPOSE 8899

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8899"]
