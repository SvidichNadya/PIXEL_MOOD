from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from uuid import UUID
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

from app.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.calendar import Calendar
from app.models.mood import Mood
from app.models.notification import Notification
from app.schemas.calendar import CalendarCreate, CalendarUpdate, CalendarOut
from app.schemas.mood import MoodOut

router = APIRouter(prefix="/calendars", tags=["calendars"])

# ============================================================
# search-users должен быть первым, чтобы не конфликтовать с /{calendar_id}
# ============================================================
@router.get("/search-users")
async def search_users(
    query: Optional[str] = Query(None, description="Поиск по username или email"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if not query or not query.strip():
        return []

    stmt = select(User).where(
        (User.username.ilike(f"%{query}%")) | (User.email.ilike(f"%{query}%"))
    ).limit(10)
    result = await db.execute(stmt)
    users = result.scalars().all()
    return [
        {
            "id": str(u.id),
            "username": u.username,
            "display_name": u.display_name,
            "email": u.email,
            "avatar_url": u.avatar_url
        }
        for u in users if u.id != current_user.id
    ]

# ============================================================
# Основные эндпоинты
# ============================================================

@router.post("/", response_model=CalendarOut, status_code=status.HTTP_201_CREATED)
async def create_calendar(
    payload: CalendarCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if payload.member_ids:
        stmt = select(User).where(User.id.in_(payload.member_ids))
        result = await db.execute(stmt)
        existing_users = result.scalars().all()
        if len(existing_users) != len(payload.member_ids):
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "One or more member IDs are invalid")

    calendar = Calendar(
        name=payload.name,
        description=payload.description,
        owner_id=current_user.id,
        member_ids=[current_user.id] + (payload.member_ids or [])
    )
    db.add(calendar)
    await db.commit()
    await db.refresh(calendar)
    return calendar

@router.get("/", response_model=List[CalendarOut])
async def list_calendars(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100)
):
    stmt = (
        select(Calendar)
        .where(Calendar.member_ids.contains([current_user.id]))
        .offset(skip)
        .limit(limit)
        .order_by(Calendar.created_at.desc())
    )
    result = await db.execute(stmt)
    calendars = result.scalars().all()
    return calendars

@router.get("/{calendar_id}", response_model=CalendarOut)
async def get_calendar(
    calendar_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Calendar).where(Calendar.id == calendar_id)
    result = await db.execute(stmt)
    calendar = result.scalar_one_or_none()
    if not calendar:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Calendar not found")
    if current_user.id not in calendar.member_ids:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "You are not a member of this calendar")
    return calendar

@router.put("/{calendar_id}", response_model=CalendarOut)
async def update_calendar(
    calendar_id: UUID,
    payload: CalendarUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Calendar).where(Calendar.id == calendar_id)
    result = await db.execute(stmt)
    calendar = result.scalar_one_or_none()
    if not calendar:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Calendar not found")
    if calendar.owner_id != current_user.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Only the owner can update this calendar")

    if payload.name is not None:
        calendar.name = payload.name
    if payload.description is not None:
        calendar.description = payload.description
    if payload.member_ids is not None:
        if payload.member_ids:
            stmt = select(User).where(User.id.in_(payload.member_ids))
            result = await db.execute(stmt)
            existing_users = result.scalars().all()
            if len(existing_users) != len(payload.member_ids):
                raise HTTPException(status.HTTP_400_BAD_REQUEST, "One or more member IDs are invalid")
        unique_members = set(payload.member_ids) | {calendar.owner_id}
        calendar.member_ids = list(unique_members)

    await db.commit()
    await db.refresh(calendar)
    return calendar

@router.delete("/{calendar_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_calendar(
    calendar_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Calendar).where(Calendar.id == calendar_id)
    result = await db.execute(stmt)
    calendar = result.scalar_one_or_none()
    if not calendar:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Calendar not found")
    if calendar.owner_id != current_user.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Only the owner can delete this calendar")
    await db.delete(calendar)
    await db.commit()

@router.get("/{calendar_id}/moods", response_model=List[MoodOut])
async def get_calendar_moods(
    calendar_id: UUID,
    date: str = Query(..., description="YYYY-MM-DD"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Calendar).where(Calendar.id == calendar_id)
    result = await db.execute(stmt)
    calendar = result.scalar_one_or_none()
    if not calendar:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Calendar not found")
    if current_user.id not in calendar.member_ids:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "You are not a member of this calendar")

    try:
        target_date = datetime.strptime(date, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid date format, use YYYY-MM-DD")

    stmt = (
        select(Mood)
        .where(Mood.calendar_id == calendar_id, Mood.date == target_date)
        .order_by(Mood.created_at)
        .options(selectinload(Mood.user))  # подгружаем пользователя для получения имени
    )
    result = await db.execute(stmt)
    moods = result.scalars().all()
    return moods


class InviteRequest(BaseModel):
    user_ids: List[UUID]

@router.post("/{calendar_id}/invite")
async def invite_to_calendar(
    calendar_id: UUID,
    payload: InviteRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Calendar).where(Calendar.id == calendar_id)
    result = await db.execute(stmt)
    calendar = result.scalar_one_or_none()
    if not calendar:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Calendar not found")
    if calendar.owner_id != current_user.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Only the owner can invite")

    stmt = select(User).where(User.id.in_(payload.user_ids))
    result = await db.execute(stmt)
    users = result.scalars().all()
    if len(users) != len(payload.user_ids):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "One or more users not found")

    existing_members = set(calendar.member_ids)
    new_user_ids = [uid for uid in payload.user_ids if uid not in existing_members]

    new_members = list(set(calendar.member_ids + payload.user_ids))
    calendar.member_ids = new_members

    # Создаём уведомления для новых участников (кроме владельца)
    if new_user_ids:
        for uid in new_user_ids:
            if uid != current_user.id:
                notification = Notification(
                    user_id=uid,
                    type='calendar_invite',
                    title='Вас добавили в календарь',
                    message=f'{current_user.display_name} добавил(а) вас в календарь "{calendar.name}"',
                    link=f'/calendar/{calendar_id}'
                )
                db.add(notification)
        await db.commit()

    await db.commit()
    await db.refresh(calendar)
    return {"detail": "Users invited successfully", "member_ids": calendar.member_ids}

@router.delete("/{calendar_id}/leave")
async def leave_calendar(
    calendar_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Выйти из календаря (только если пользователь не владелец)."""
    stmt = select(Calendar).where(Calendar.id == calendar_id)
    result = await db.execute(stmt)
    calendar = result.scalar_one_or_none()
    if not calendar:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Calendar not found")
    if current_user.id == calendar.owner_id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Owner cannot leave, only delete the calendar")
    if current_user.id not in calendar.member_ids:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "You are not a member of this calendar")
    
    calendar.member_ids = [uid for uid in calendar.member_ids if uid != current_user.id]
    await db.commit()
    return {"detail": "You have left the calendar"}