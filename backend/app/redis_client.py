import json
from typing import Optional, Any
import redis.asyncio as redis
from redis.asyncio import Redis

from app.config import settings


class RedisClient:
    """
    Клиент для работы с Redis.
    Реализован как синглтон для повторного использования соединения.
    """

    def __init__(self):
        self._client: Optional[Redis] = None

    async def connect(self) -> None:
        """
        Устанавливает соединение с Redis.
        """
        if self._client is None:
            self._client = redis.from_url(
                settings.REDIS_URL,
                decode_responses=True,
                max_connections=10,
            )
            # Проверяем соединение
            await self._client.ping()

    async def close(self) -> None:
        """
        Закрывает соединение с Redis.
        """
        if self._client:
            await self._client.close()
            self._client = None

    async def get_client(self) -> Redis:
        """
        Возвращает клиент Redis. Если соединение не установлено — подключает.
        """
        if self._client is None:
            await self.connect()
        return self._client

    async def ping(self) -> bool:
        """
        Проверяет доступность Redis.
        """
        try:
            client = await self.get_client()
            return await client.ping()
        except Exception:
            return False

    # --- Основные операции ---

    async def get(self, key: str) -> Optional[str]:
        """
        Получить значение по ключу.
        """
        client = await self.get_client()
        return await client.get(key)

    async def set(self, key: str, value: str, ttl: Optional[int] = None) -> bool:
        """
        Установить значение по ключу с опциональным TTL (в секундах).
        """
        client = await self.get_client()
        if ttl:
            return await client.setex(key, ttl, value)
        return await client.set(key, value)

    async def delete(self, key: str) -> int:
        """
        Удалить ключ.
        """
        client = await self.get_client()
        return await client.delete(key)

    async def exists(self, key: str) -> bool:
        """
        Проверить существование ключа.
        """
        client = await self.get_client()
        return await client.exists(key) > 0

    async def incr(self, key: str) -> int:
        """
        Инкрементировать значение.
        """
        client = await self.get_client()
        return await client.incr(key)

    async def expire(self, key: str, ttl: int) -> bool:
        """
        Установить TTL для ключа.
        """
        client = await self.get_client()
        return await client.expire(key, ttl)

    # --- Работа с JSON ---

    async def get_json(self, key: str) -> Optional[Any]:
        """
        Получить и десериализовать JSON-значение.
        """
        value = await self.get(key)
        if value is None:
            return None
        try:
            return json.loads(value)
        except json.JSONDecodeError:
            return None

    async def set_json(self, key: str, value: Any, ttl: Optional[int] = None) -> bool:
        """
        Сериализовать и сохранить JSON-значение.
        """
        return await self.set(key, json.dumps(value, default=str), ttl)


# Создаём глобальный экземпляр клиента
redis_client = RedisClient()