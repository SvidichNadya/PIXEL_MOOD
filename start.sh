#!/bin/bash
set -e

echo "=========================================="
echo "🚀 Запуск PIXEL Mood"
echo "=========================================="

# Проверяем, что фронтенд собран
if [ -f /usr/share/nginx/html/index.html ]; then
    echo "✅ index.html найден"
else
    echo "⚠️ index.html не найден, создаём заглушку"
    echo "<h1>Mood Pixel</h1><p>Приложение запускается...</p>" > /usr/share/nginx/html/index.html
fi

echo ""
echo "🚀 Проверка конфигурации nginx..."
nginx -t

echo ""
echo "🚀 Запуск nginx..."
nginx -g "daemon off;" &
NGINX_PID=$!

echo ""
echo "🚀 Запуск FastAPI бекенда..."
cd /app/backend
uvicorn app.main:app --host 0.0.0.0 --port 8000

# Если uvicorn упал, убиваем nginx
kill $NGINX_PID