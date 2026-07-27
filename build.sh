#!/bin/bash
set -e

echo "=========================================="
echo "🚀 Начало сборки PIXEL Mood API"
echo "=========================================="

# Переходим в папку бекенда
cd /app/backend

echo ""
echo "📦 Установка Python-зависимостей..."
pip install --no-cache-dir -r requirements.txt

echo ""
echo "📦 Проверка наличия Alembic..."
alembic --version

echo ""
echo "📦 Применение миграций Alembic..."
echo "Текущая версия миграций:"
alembic current || echo "⚠️ Миграции ещё не применены"

echo "Применяем все миграции..."
alembic upgrade head

echo "✅ Миграции применены успешно!"

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
    print('🔄 Подключение к базе данных...')
    engine = create_async_engine(settings.DATABASE_URL)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        # Проверяем, существует ли пользователь с username 'admin'
        stmt = select(User).where(User.username == os.environ.get('ADMIN_USERNAME', 'admin'))
        result = await session.execute(stmt)
        user = result.scalar_one_or_none()
        
        if user:
            print('✅ Администратор уже существует')
            return
        
        # Создаём администратора
        admin_username = os.environ.get('ADMIN_USERNAME', 'admin')
        admin_email = os.environ.get('ADMIN_EMAIL', 'admin@example.com')
        admin_password = os.environ.get('ADMIN_PASSWORD', 'Turedy123')
        
        admin = User(
            username=admin_username,
            email=admin_email,
            display_name='Admin',
            is_admin=True,
            is_anonymous_by_default=False,
            allow_paid_reveal=True,
            onboarding_completed=True
        )
        # Хешируем пароль
        admin.password_hash = AuthService.hash_password(admin_password)
        
        session.add(admin)
        await session.commit()
        print(f'✅ Администратор создан успешно!')
        print(f'   👤 Username: {admin_username}')
        print(f'   📧 Email: {admin_email}')
        print(f'   🔑 Пароль: {admin_password}')

asyncio.run(create_admin())
"

echo ""
echo "=========================================="
echo "✅ Сборка завершена успешно!"
echo "=========================================="