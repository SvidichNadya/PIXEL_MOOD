#!/bin/bash
set -e

echo "=========================================="
echo "🚀 Запуск PIXEL Mood"
echo "=========================================="

# ==============================================
# 1. ПАРСИМ DATABASE_URL ДЛЯ ПРОВЕРКИ
# ==============================================
echo ""
echo "🔍 Парсинг DATABASE_URL..."
DB_HOST=$(python -c "import os; from urllib.parse import urlparse; u=urlparse(os.environ['DATABASE_URL']); print(u.hostname or '')")
DB_PORT=$(python -c "import os; from urllib.parse import urlparse; u=urlparse(os.environ['DATABASE_URL']); print(u.port or 5432)")
DB_USER=$(python -c "import os; from urllib.parse import urlparse; u=urlparse(os.environ['DATABASE_URL']); print(u.username or '')")
DB_NAME=$(python -c "import os; from urllib.parse import urlparse; u=urlparse(os.environ['DATABASE_URL']); print(u.path.lstrip('/') or '')")

echo "🔍 Хост: $DB_HOST, Порт: $DB_PORT, База: $DB_NAME"

# ==============================================
# 2. ЖДЁМ БАЗУ ДАННЫХ С ПОМОЩЬЮ pg_isready
# ==============================================
echo ""
echo "⏳ Ожидание готовности PostgreSQL (pg_isready)..."

MAX_RETRIES=30
RETRY_COUNT=0

until pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" >/dev/null 2>&1; do
    RETRY_COUNT=$((RETRY_COUNT + 1))
    if [ $RETRY_COUNT -ge $MAX_RETRIES ]; then
        echo "❌ Не удалось подключиться к PostgreSQL после $MAX_RETRIES попыток."
        echo "Последняя ошибка pg_isready:"
        pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME"
        exit 1
    fi
    echo "⏳ Ожидание БД... (попытка $RETRY_COUNT/$MAX_RETRIES)"
    sleep 2
done

echo "✅ PostgreSQL готов!"

# ==============================================
# 3. ПРИМЕНЯЕМ МИГРАЦИИ
# ==============================================
echo ""
echo "📦 Применение миграций Alembic..."
cd /app/backend
alembic current || echo "⚠️ Миграций пока нет"
alembic upgrade head
echo "✅ Миграции применены успешно!"

# ==============================================
# 4. СОЗДАЁМ АДМИНИСТРАТОРА
# ==============================================
echo ""
echo "👤 Создание администратора..."
python -c "
import os
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select
from app.models.user import User
from app.config import settings
from app.services.auth_service import AuthService

async def create_admin():
    engine = create_async_engine(settings.DATABASE_URL, connect_args={'ssl': True})
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with async_session() as session:
        stmt = select(User).where(User.username == os.environ.get('ADMIN_USERNAME', 'admin'))
        result = await session.execute(stmt)
        user = result.scalar_one_or_none()
        if user:
            print('✅ Администратор уже существует')
            return
        admin = User(
            username=os.environ.get('ADMIN_USERNAME', 'admin'),
            email=os.environ.get('ADMIN_EMAIL', 'admin@example.com'),
            display_name='Admin',
            is_admin=True,
            is_anonymous_by_default=False,
            allow_paid_reveal=True,
            onboarding_completed=True
        )
        admin.password_hash = AuthService.hash_password(os.environ.get('ADMIN_PASSWORD', 'Turedy123'))
        session.add(admin)
        await session.commit()
        print('✅ Администратор создан успешно!')

asyncio.run(create_admin())
"

# ==============================================
# 5. ПРОВЕРКА ФРОНТЕНДА
# ==============================================
echo ""
echo "📦 Проверка фронтенда..."
if [ -f /usr/share/nginx/html/index.html ]; then
    echo "✅ index.html найден"
else
    echo "⚠️ index.html не найден, создаём заглушку"
    echo "<h1>Mood Pixel</h1><p>Приложение запускается...</p>" > /usr/share/nginx/html/index.html
fi

# ==============================================
# 6. ЗАПУСК NGINX
# ==============================================
echo ""
echo "🚀 Проверка конфигурации nginx..."
nginx -t

echo ""
echo "🚀 Запуск nginx..."
nginx -g "daemon off;" &
NGINX_PID=$!

# ==============================================
# 7. ЗАПУСК БЕКЕНДА
# ==============================================
echo ""
echo "🚀 Запуск FastAPI бекенда..."
cd /app/backend
uvicorn app.main:app --host 0.0.0.0 --port 8000

# Если uvicorn упал, убиваем nginx
kill $NGINX_PID