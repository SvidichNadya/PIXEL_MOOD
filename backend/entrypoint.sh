#!/bin/sh
set -e

# Применяем миграции Alembic
echo "Applying Alembic migrations..."
alembic upgrade head

# Запускаем приложение
exec "$@"