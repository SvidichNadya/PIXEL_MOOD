#!/bin/bash
set -e

echo "🚀 Starting nginx..."
nginx -g "daemon off;" &
NGINX_PID=$!

echo "🚀 Starting FastAPI backend..."
cd /app/backend
uvicorn app.main:app --host 0.0.0.0 --port 8000

# Если uvicorn упал — убиваем nginx
kill $NGINX_PID