#!/bin/bash
set -e

echo "=========================================="
echo "📦 Установка Python-зависимостей (build stage)..."
echo "=========================================="

cd /app/backend
pip install --no-cache-dir -r requirements.txt

echo ""
echo "✅ Зависимости установлены."
echo "=========================================="