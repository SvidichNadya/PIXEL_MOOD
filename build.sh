#!/bin/bash
set -e

echo "📦 Installing Python dependencies..."
cd /app/backend
pip install --no-cache-dir -r requirements.txt

echo "📦 Running Alembic migrations..."
alembic upgrade head

echo "👤 Creating admin user..."
python -c "
import os
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select
from app.models.user import User
from app.config import settings

async def create_admin():
    engine = create_async_engine(settings.DATABASE_URL)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with async_session() as session:
        stmt = select(User).where(User.username == os.environ.get('ADMIN_USERNAME', 'admin'))
        result = await session.execute(stmt)
        user = result.scalar_one_or_none()
        if user:
            print('✅ Admin user already exists')
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
        # Хешируем пароль
        from app.services.auth_service import AuthService
        admin.password_hash = AuthService.hash_password(os.environ.get('ADMIN_PASSWORD', 'Turedy123'))
        session.add(admin)
        await session.commit()
        print('✅ Admin user created successfully')

asyncio.run(create_admin())
"

echo "✅ Build completed successfully."