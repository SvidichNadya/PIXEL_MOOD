import uuid
from typing import List, Optional, Set
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from sqlalchemy.orm import selectinload

from app.models.calendar import Calendar
from app.models.user import User
from app.models.mood import Mood
from app.schemas.calendar import CalendarCreate, CalendarUpdate


class CalendarService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_calendar(self, owner_id: uuid.UUID, payload: CalendarCreate) -> Calendar:
        """Создать приватный календарь с владельцем и участниками."""
        # Проверяем, что все указанные участники существуют (если есть)
        member_ids = list(set(payload.member_ids or []))
        if member_ids:
            stmt = select(User).where(User.id.in_(member_ids))
            result = await self.db.execute(stmt)
            existing_users = result.scalars().all()
            if len(existing_users) != len(member_ids):
                raise ValueError("One or more member IDs are invalid")

        # Владелец всегда добавляется в участники
        all_members = list(set([owner_id] + member_ids))

        calendar = Calendar(
            name=payload.name,
            description=payload.description,
            owner_id=owner_id,
            member_ids=all_members
        )
        self.db.add(calendar)
        await self.db.commit()
        await self.db.refresh(calendar)
        return calendar

    async def get_calendar(self, calendar_id: uuid.UUID, user_id: uuid.UUID) -> Optional[Calendar]:
        """Получить календарь, если пользователь является участником."""
        stmt = select(Calendar).where(Calendar.id == calendar_id)
        result = await self.db.execute(stmt)
        calendar = result.scalar_one_or_none()
        if not calendar:
            return None
        if user_id not in calendar.member_ids:
            return None
        return calendar

    async def get_user_calendars(
        self, user_id: uuid.UUID, skip: int = 0, limit: int = 20
    ) -> List[Calendar]:
        """Получить все календари, где пользователь – участник."""
        stmt = (
            select(Calendar)
            .where(Calendar.member_ids.contains([user_id]))
            .offset(skip)
            .limit(limit)
            .order_by(Calendar.created_at.desc())
        )
        result = await self.db.execute(stmt)
        return result.scalars().all()

    async def update_calendar(
        self, calendar_id: uuid.UUID, user_id: uuid.UUID, payload: CalendarUpdate
    ) -> Optional[Calendar]:
        """Обновить календарь, только если пользователь – владелец."""
        calendar = await self.get_calendar(calendar_id, user_id)
        if not calendar:
            return None
        if calendar.owner_id != user_id:
            raise PermissionError("Only the owner can update this calendar")

        if payload.name is not None:
            calendar.name = payload.name
        if payload.description is not None:
            calendar.description = payload.description
        if payload.member_ids is not None:
            # Проверить, что все участники существуют
            member_ids = list(set(payload.member_ids))
            if member_ids:
                stmt = select(User).where(User.id.in_(member_ids))
                result = await self.db.execute(stmt)
                existing_users = result.scalars().all()
                if len(existing_users) != len(member_ids):
                    raise ValueError("One or more member IDs are invalid")
            # Всегда добавляем владельца
            all_members = list(set(member_ids) | {calendar.owner_id})
            calendar.member_ids = all_members

        await self.db.commit()
        await self.db.refresh(calendar)
        return calendar

    async def delete_calendar(self, calendar_id: uuid.UUID, user_id: uuid.UUID) -> bool:
        """Удалить календарь, только если пользователь – владелец."""
        calendar = await self.get_calendar(calendar_id, user_id)
        if not calendar:
            return False
        if calendar.owner_id != user_id:
            raise PermissionError("Only the owner can delete this calendar")
        await self.db.delete(calendar)
        await self.db.commit()
        return True

    async def get_calendar_moods(
        self, calendar_id: uuid.UUID, date_str: str, user_id: uuid.UUID
    ) -> List[Mood]:
        """Получить настроения в календаре за дату, только для участников."""
        from datetime import datetime

        try:
            target_date = datetime.strptime(date_str, "%Y-%m-%d").date()
        except ValueError:
            raise ValueError("Invalid date format, use YYYY-MM-DD")

        # Проверка доступа
        calendar = await self.get_calendar(calendar_id, user_id)
        if not calendar:
            raise ValueError("Calendar not found or access denied")

        stmt = (
            select(Mood)
            .where(
                and_(
                    Mood.calendar_id == calendar_id,
                    Mood.date == target_date
                )
            )
            .order_by(Mood.created_at)
        )
        result = await self.db.execute(stmt)
        return result.scalars().all()