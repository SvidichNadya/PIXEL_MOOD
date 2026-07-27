from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from sqlalchemy.orm import selectinload
from uuid import UUID
from datetime import datetime, date
from typing import List, Optional

from app.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.mood import Mood
from app.models.calendar import Calendar
from app.schemas.mood import MoodCreate, MoodUpdate, MoodOut

router = APIRouter(prefix="/moods", tags=["moods"])

@router.post("/global", response_model=MoodOut, status_code=status.HTTP_201_CREATED)
async def create_global_mood(
    payload: MoodCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if payload.calendar_id:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Use /calendars endpoint for private moods")

    if payload.date:
        try:
            mood_date = datetime.strptime(payload.date, "%Y-%m-%d").date()
        except ValueError:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid date format, use YYYY-MM-DD")
    else:
        mood_date = date.today()

    # Проверка на дубликат пикселя на этой позиции (если указана)
    if payload.position is not None:
        stmt = select(Mood).where(
            and_(
                Mood.calendar_id.is_(None),
                Mood.date == mood_date,
                Mood.position == payload.position
            )
        )
        result = await db.execute(stmt)
        if result.scalar_one_or_none():
            raise HTTPException(status.HTTP_409_CONFLICT, "This pixel is already taken")

    stmt = select(Mood).where(
        and_(
            Mood.user_id == current_user.id,
            Mood.calendar_id.is_(None),
            Mood.date == mood_date
        )
    )
    result = await db.execute(stmt)
    existing = result.scalar_one_or_none()
    if existing:
        raise HTTPException(status.HTTP_409_CONFLICT, "You already left a mood today in the global calendar")

    mood = Mood(
        user_id=current_user.id,
        color=payload.color,
        message=payload.message,
        is_anonymous=payload.is_anonymous,
        date=mood_date,
        calendar_id=None,
        is_global=True,
        position=payload.position  # если не указан, останется None
    )
    db.add(mood)
    await db.commit()
    await db.refresh(mood)
    await db.refresh(mood, attribute_names=['user'])
    return mood

@router.post("/calendar/{calendar_id}", response_model=MoodOut, status_code=status.HTTP_201_CREATED)
async def create_calendar_mood(
    calendar_id: UUID,
    payload: MoodCreate,
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

    if payload.date:
        try:
            mood_date = datetime.strptime(payload.date, "%Y-%m-%d").date()
        except ValueError:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid date format, use YYYY-MM-DD")
    else:
        mood_date = date.today()

    if payload.position is not None:
        stmt = select(Mood).where(
            and_(
                Mood.calendar_id == calendar_id,
                Mood.date == mood_date,
                Mood.position == payload.position
            )
        )
        result = await db.execute(stmt)
        if result.scalar_one_or_none():
            raise HTTPException(status.HTTP_409_CONFLICT, "This pixel is already taken")

    stmt = select(Mood).where(
        and_(
            Mood.user_id == current_user.id,
            Mood.calendar_id == calendar_id,
            Mood.date == mood_date
        )
    )
    result = await db.execute(stmt)
    existing = result.scalar_one_or_none()
    if existing:
        raise HTTPException(status.HTTP_409_CONFLICT, "You already left a mood today in this calendar")

    mood = Mood(
        user_id=current_user.id,
        color=payload.color,
        message=payload.message,
        is_anonymous=payload.is_anonymous,
        date=mood_date,
        calendar_id=calendar_id,
        is_global=False,
        position=payload.position
    )
    db.add(mood)
    await db.commit()
    await db.refresh(mood)
    await db.refresh(mood, attribute_names=['user'])
    return mood

@router.get("/global", response_model=List[MoodOut])
async def get_global_moods(
    date: str = Query(..., description="YYYY-MM-DD"),
    db: AsyncSession = Depends(get_db)
):
    try:
        mood_date = datetime.strptime(date, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid date format, use YYYY-MM-DD")

    stmt = (
        select(Mood)
        .where(Mood.calendar_id.is_(None), Mood.date == mood_date)
        .order_by(Mood.position.asc().nulls_last(), Mood.created_at)  # сортировка по позиции
        .options(selectinload(Mood.user))
    )
    result = await db.execute(stmt)
    moods = result.scalars().all()
    return moods

@router.get("/today/global", response_model=Optional[MoodOut])
async def get_today_global_mood(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    today = date.today()
    stmt = select(Mood).where(
        and_(
            Mood.user_id == current_user.id,
            Mood.calendar_id.is_(None),
            Mood.date == today
        )
    ).options(selectinload(Mood.user))
    result = await db.execute(stmt)
    mood = result.scalar_one_or_none()
    return mood

@router.get("/calendar/{calendar_id}/today", response_model=Optional[MoodOut])
async def get_today_calendar_mood(
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

    today = date.today()
    stmt = select(Mood).where(
        and_(
            Mood.user_id == current_user.id,
            Mood.calendar_id == calendar_id,
            Mood.date == today
        )
    ).options(selectinload(Mood.user))
    result = await db.execute(stmt)
    mood = result.scalar_one_or_none()
    return mood

@router.get("/{mood_id}", response_model=MoodOut)
async def get_mood(
    mood_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Mood).where(Mood.id == mood_id).options(selectinload(Mood.user))
    result = await db.execute(stmt)
    mood = result.scalar_one_or_none()
    if not mood:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Mood not found")
    if mood.calendar_id:
        stmt_cal = select(Calendar).where(Calendar.id == mood.calendar_id)
        res_cal = await db.execute(stmt_cal)
        calendar = res_cal.scalar_one_or_none()
        if not calendar or current_user.id not in calendar.member_ids:
            raise HTTPException(status.HTTP_403_FORBIDDEN, "You don't have access to this mood")
    return mood

@router.put("/{mood_id}", response_model=MoodOut)
async def update_mood(
    mood_id: UUID,
    payload: MoodUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Mood).where(Mood.id == mood_id)
    result = await db.execute(stmt)
    mood = result.scalar_one_or_none()
    if not mood:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Mood not found")
    if mood.user_id != current_user.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "You can only edit your own mood")

    if payload.message is not None:
        mood.message = payload.message
    if payload.color is not None:
        mood.color = payload.color
    if payload.is_anonymous is not None:
        mood.is_anonymous = payload.is_anonymous

    await db.commit()
    await db.refresh(mood)
    await db.refresh(mood, attribute_names=['user'])
    return mood

@router.delete("/{mood_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_mood(
    mood_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Mood).where(Mood.id == mood_id)
    result = await db.execute(stmt)
    mood = result.scalar_one_or_none()
    if not mood:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Mood not found")
    if mood.user_id != current_user.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "You can only delete your own mood")
    await db.delete(mood)
    await db.commit()