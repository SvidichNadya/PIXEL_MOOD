# backend/app/database.py
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import sessionmaker
from typing import AsyncGenerator, Optional

from app.config import settings
from app.models.base import Base  # импортируем Base из отдельного файла

_engine = None
_async_session_local = None

def get_engine():
    """Ленивое создание асинхронного движка."""
    global _engine
    if _engine is None:
        _engine = create_async_engine(
            settings.DATABASE_URL,
            echo=False,
            future=True,
            pool_size=20,
            max_overflow=40,
            pool_pre_ping=True,
            pool_recycle=3600,
            connect_args={"ssl": False},  # <-- ОТКЛЮЧАЕМ SSL
        )
    return _engine

def get_async_session_local():
    """Ленивое создание фабрики сессий."""
    global _async_session_local
    if _async_session_local is None:
        engine = get_engine()
        _async_session_local = async_sessionmaker(
            engine,
            class_=AsyncSession,
            expire_on_commit=False,
            autocommit=False,
            autoflush=False,
        )
    return _async_session_local

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Зависимость FastAPI для получения сессии БД."""
    async_session_local = get_async_session_local()
    async with async_session_local() as session:
        try:
            yield session
        finally:
            await session.close()

# Для обратной совместимости (если где-то используется engine напрямую)
# Лучше использовать get_engine(), но оставим для совместимости
@property
def engine():
    return get_engine()