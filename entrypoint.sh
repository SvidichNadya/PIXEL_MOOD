#!/bin/sh
set -e

# Запускаем nginx в фоне
nginx -g "daemon off;" &
NGINX_PID=$!

# Переходим в папку бекенда и запускаем uvicorn
cd /app/backend

# Применяем миграции (Alembic)
echo "Applying Alembic migrations..."
alembic upgrade head

# Запускаем бекенд на 8000 порту
echo "Starting FastAPI backend..."
uvicorn app.main:app --host 0.0.0.0 --port 8000

# Если uvicorn упадёт, убиваем nginx
kill $NGINX_PID