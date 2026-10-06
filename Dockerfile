FROM node:22-bookworm-slim AS frontend
WORKDIR /build
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM python:3.11-slim-bookworm
ENV PYTHONUNBUFFERED=1 TF_CPP_MIN_LOG_LEVEL=2 WILDROOT_DB=/data/wildroot.db WILDROOT_FRONTEND_DIST=/app/frontend/dist
WORKDIR /app/backend
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY backend/ ./
COPY --from=frontend /build/dist /app/frontend/dist
RUN mkdir -p /data
EXPOSE 8000
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
