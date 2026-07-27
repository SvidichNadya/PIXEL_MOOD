import uuid
from datetime import date, datetime
from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func

from app.models.mood import Mood
from app.models.calendar import Calendar
from app.models.user import User
from app.schemas.mood import MoodCreate, MoodUpdate


class MoodService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_global_mood(self, user_id: uuid.UUID, payload: MoodCreate) -> Mood:
        """Создать глобальное настроение (один пиксель в день на пользователя)."""
        if payload.calendar_id:
            raise ValueError("Use calendar endpoint for private moods")

        mood_date = self._parse_date(payload.date)

        # Проверка: есть ли уже настроение сегодня
        existing = await self._get_mood_for_date(user_id, None, mood_date)
        if existing:
            raise ValueError("You already left a mood today in the global calendar")

        mood = Mood(
            user_id=user_id,
            color=payload.color,
            message=payload.message,
            is_anonymous=payload.is_anonymous,
            date=mood_date,
            calendar_id=None,
            is_global=True
        )
        self.db.add(mood)
        await self.db.commit()
        await self.db.refresh(mood)
        return mood

    async def create_calendar_mood(
        self, user_id: uuid.UUID, calendar_id: uuid.UUID, payload: MoodCreate
    ) -> Mood:
        """Создать настроение в приватном календаре."""
        if payload.calendar_id and payload.calendar_id != calendar_id:
            raise ValueError("Calendar ID mismatch")

        # Проверка, что пользователь – участник календаря
        stmt = select(Calendar).where(Calendar.id == calendar_id)
        result = await self.db.execute(stmt)
        calendar = result.scalar_one_or_none()
        if not calendar:
            raise ValueError("Calendar not found")
        if user_id not in calendar.member_ids:
            raise PermissionError("You are not a member of this calendar")

        mood_date = self._parse_date(payload.date)

        # Проверка: есть ли уже настроение сегодня в этом календаре
        existing = await self._get_mood_for_date(user_id, calendar_id, mood_date)
        if existing:
            raise ValueError("You already left a mood today in this calendar")

        mood = Mood(
            user_id=user_id,
            color=payload.color,
            message=payload.message,
            is_anonymous=payload.is_anonymous,
            date=mood_date,
            calendar_id=calendar_id,
            is_global=False
        )
        self.db.add(mood)
        await self.db.commit()
        await self.db.refresh(mood)
        return mood

    async def get_global_moods(self, date_str: str) -> List[Mood]:
        """Получить все глобальные настроения за дату."""
        target_date = self._parse_date(date_str)
        stmt = (
            select(Mood)
            .where(
                and_(
                    Mood.calendar_id.is_(None),
                    Mood.date == target_date
                )
            )
            .order_by(Mood.created_at)
        )
        result = await self.db.execute(stmt)
        return result.scalars().all()

    async def get_today_global_mood(self, user_id: uuid.UUID) -> Optional[Mood]:
        """Получить сегодняшнее глобальное настроение пользователя."""
        today = date.today()
        return await self._get_mood_for_date(user_id, None, today)

    async def get_mood(self, mood_id: uuid.UUID, user_id: Optional[uuid.UUID] = None) -> Optional[Mood]:
        """
        Получить настроение по ID, с проверкой доступа для приватных.
        Если user_id не передан, возвращает только глобальные (или публичные) – но мы делаем проверку в API.
        """
        stmt = select(Mood).where(Mood.id == mood_id)
        result = await self.db.execute(stmt)
        mood = result.scalar_one_or_none()
        if not mood:
            return None
        # Если приватный – проверяем участие пользователя
        if mood.calendar_id and user_id:
            stmt_cal = select(Calendar).where(Calendar.id == mood.calendar_id)
            res_cal = await self.db.execute(stmt_cal)
            calendar = res_cal.scalar_one_or_none()
            if not calendar or user_id not in calendar.member_ids:
                return None
        return mood

    async def update_mood(
        self, mood_id: uuid.UUID, user_id: uuid.UUID, payload: MoodUpdate
    ) -> Optional[Mood]:
        """Обновить своё настроение."""
        mood = await self.get_mood(mood_id, user_id)
        if not mood:
            return None
        if mood.user_id != user_id:
            raise PermissionError("You can only edit your own mood")

        if payload.message is not None:
            mood.message = payload.message
        if payload.color is not None:
            mood.color = payload.color
        if payload.is_anonymous is not None:
            mood.is_anonymous = payload.is_anonymous

        await self.db.commit()
        await self.db.refresh(mood)
        return mood

    async def delete_mood(self, mood_id: uuid.UUID, user_id: uuid.UUID) -> bool:
        """Удалить своё настроение."""
        mood = await self.get_mood(mood_id, user_id)
        if not mood:
            return False
        if mood.user_id != user_id:
            raise PermissionError("You can only delete your own mood")
        await self.db.delete(mood)
        await self.db.commit()
        return True

    # Вспомогательные методы
    @staticmethod
    def _parse_date(date_str: Optional[str]) -> date:
        if date_str:
            try:
                return datetime.strptime(date_str, "%Y-%m-%d").date()
            except ValueError:
                raise ValueError("Invalid date format, use YYYY-MM-DD")
        return date.today()

    async def _get_mood_for_date(
        self, user_id: uuid.UUID, calendar_id: Optional[uuid.UUID], target_date: date
    ) -> Optional[Mood]:
        stmt = select(Mood).where(
            and_(
                Mood.user_id == user_id,
                Mood.calendar_id == calendar_id if calendar_id is not None else Mood.calendar_id.is_(None),
                Mood.date == target_date
            )
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()