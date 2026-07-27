#!/bin/bash
set -e

echo "🚀 Проверка содержимого /usr/share/nginx/html:"
ls -la /usr/share/nginx/html

echo "🚀 Проверка наличия index.html:"
if [ -f /usr/share/nginx/html/index.html ]; then
    echo "✅ index.html найден"
else
    echo "❌ index.html НЕ НАЙДЕН! Создаём заглушку..."
    echo "<h1>Mood Pixel</h1><p>Index не найден, но приложение работает.</p>" > /usr/share/nginx/html/index.html
fi

echo "🚀 Проверка конфигурации nginx:"
nginx -t

echo "🚀 Запуск nginx..."
nginx -g "daemon off;" &
NGINX_PID=$!

echo "🚀 Запуск FastAPI бекенда..."
cd /app/backend
uvicorn app.main:app --host 0.0.0.0 --port 8000

# Если uvicorn упал — убиваем nginx
kill $NGINX_PID