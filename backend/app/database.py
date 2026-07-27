from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import declarative_base
from typing import AsyncGenerator

from app.config import settings

# Создаём асинхронный движок SQLAlchemy
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,  # В продакшене выключить, для отладки можно включить
    future=True,
    pool_size=20,
    max_overflow=40,
    pool_pre_ping=True,  # Проверка соединения перед использованием
    pool_recycle=3600,   # Пересоздавать соединения раз в час
)

# Фабрика сессий
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

# Базовый класс для моделей
Base = declarative_base()


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Зависимость FastAPI для получения сессии базы данных.
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()