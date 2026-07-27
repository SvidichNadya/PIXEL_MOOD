import uuid
import json
from datetime import date, datetime
from typing import Dict, List, Any
from collections import Counter
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from redis.asyncio import Redis

from app.models.mood import Mood
from app.models.user import User
from app.models.calendar import Calendar
from app.schemas.stats import DailyStats, TopAuthor, StatsResponse
from app.config import settings


class StatsService:
    def __init__(self, db: AsyncSession, redis: Optional[Redis] = None):
        self.db = db
        self.redis = redis
        self.cache_ttl = 3600  # 1 час

    async def get_global_stats(self, date_str: str) -> StatsResponse:
        """Получить статистику по глобальному календарю за указанную дату."""
        target_date = self._parse_date(date_str)

        # Пытаемся получить из кеша
        cache_key = f"stats:global:{target_date.isoformat()}"
        if self.redis:
            cached = await self.redis.get(cache_key)
            if cached:
                data = json.loads(cached)
                return StatsResponse(**data)

        # Запрос к БД
        stmt = select(Mood).where(
            and_(
                Mood.calendar_id.is_(None),
                Mood.date == target_date
            )
        )
        result = await self.db.execute(stmt)
        moods = result.scalars().all()

        total = len(moods)
        color_counter = Counter(m.color for m in moods)
        color_distribution = dict(color_counter)

        # Топ авторов (не анонимных)
        author_counts = {}
        for m in moods:
            if not m.is_anonymous:
                author_counts[m.user_id] = author_counts.get(m.user_id, 0) + 1

        sorted_authors = sorted(author_counts.items(), key=lambda x: x[1], reverse=True)[:10]
        top_authors = []
        for user_id, count in sorted_authors:
            stmt_user = select(User).where(User.id == user_id)
            res_user = await self.db.execute(stmt_user)
            user = res_user.scalar_one_or_none()
            if user:
                top_authors.append(TopAuthor(
                    user_id=str(user.id),
                    username=user.display_name,
                    count=count
                ))

        daily = DailyStats(
            date=target_date,
            total_pixels=total,
            color_distribution=color_distribution
        )

        response = StatsResponse(daily=daily, top_authors=top_authors)

        # Сохраняем в кеш
        if self.redis:
            await self.redis.setex(
                cache_key,
                self.cache_ttl,
                json.dumps(response.dict(), default=str)
            )

        return response

    async def get_calendar_stats(
        self, calendar_id: uuid.UUID, date_str: str, user_id: uuid.UUID
    ) -> StatsResponse:
        """Получить статистику по приватному календарю (только для участников)."""
        # Проверка доступа
        stmt_cal = select(Calendar).where(Calendar.id == calendar_id)
        res_cal = await self.db.execute(stmt_cal)
        calendar = res_cal.scalar_one_or_none()
        if not calendar:
            raise ValueError("Calendar not found")
        if user_id not in calendar.member_ids:
            raise PermissionError("You are not a member of this calendar")

        target_date = self._parse_date(date_str)

        # Кеш с учётом календаря
        cache_key = f"stats:calendar:{calendar_id}:{target_date.isoformat()}"
        if self.redis:
            cached = await self.redis.get(cache_key)
            if cached:
                data = json.loads(cached)
                return StatsResponse(**data)

        stmt = select(Mood).where(
            and_(
                Mood.calendar_id == calendar_id,
                Mood.date == target_date
            )
        )
        result = await self.db.execute(stmt)
        moods = result.scalars().all()

        total = len(moods)
        color_counter = Counter(m.color for m in moods)
        color_distribution = dict(color_counter)

        author_counts = {}
        for m in moods:
            if not m.is_anonymous:
                author_counts[m.user_id] = author_counts.get(m.user_id, 0) + 1

        sorted_authors = sorted(author_counts.items(), key=lambda x: x[1], reverse=True)[:10]
        top_authors = []
        for user_id, count in sorted_authors:
            stmt_user = select(User).where(User.id == user_id)
            res_user = await self.db.execute(stmt_user)
            user = res_user.scalar_one_or_none()
            if user:
                top_authors.append(TopAuthor(
                    user_id=str(user.id),
                    username=user.display_name,
                    count=count
                ))

        daily = DailyStats(
            date=target_date,
            total_pixels=total,
            color_distribution=color_distribution
        )

        response = StatsResponse(daily=daily, top_authors=top_authors)

        if self.redis:
            await self.redis.setex(
                cache_key,
                self.cache_ttl,
                json.dumps(response.dict(), default=str)
            )

        return response

    @staticmethod
    def _parse_date(date_str: str) -> date:
        try:
            return datetime.strptime(date_str, "%Y-%m-%d").date()
        except ValueError:
            raise ValueError("Invalid date format, use YYYY-MM-DD")