#!/bin/bash
set -e

echo "=========================================="
echo "🚀 Запуск PIXEL Mood"
echo "=========================================="

# ==============================================
# 1. УСТАНАВЛИВАЕМ ЗАВИСИМОСТИ (если не сделано в build)
# ==============================================
echo ""
echo "📦 Проверка зависимостей..."
cd /app/backend
pip install --no-cache-dir -r requirements.txt

# ==============================================
# 2. ЖДЁМ БАЗУ ДАННЫХ
# ==============================================
echo ""
echo "⏳ Ожидание готовности PostgreSQL..."

# Пробуем подключиться к БД с помощью pg_isready (если есть) или через Python
MAX_RETRIES=30
RETRY_COUNT=0

# Функция проверки БД через Python
check_db() {
    python -c "
import asyncio
from sqlalchemy import text
from app.database import AsyncSessionLocal

async def check():
    try:
        async with AsyncSessionLocal() as session:
            await session.execute(text('SELECT 1'))
        return True
    except Exception:
        return False

print(asyncio.run(check()))
" 2>/dev/null
}

until check_db | grep -q "True"; do
    RETRY_COUNT=$((RETRY_COUNT + 1))
    if [ $RETRY_COUNT -ge $MAX_RETRIES ]; then
        echo "❌ Не удалось подключиться к PostgreSQL после $MAX_RETRIES попыток."
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
    engine = create_async_engine(settings.DATABASE_URL)
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