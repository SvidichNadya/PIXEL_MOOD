from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from datetime import datetime
from uuid import UUID
from typing import Dict, List
from collections import Counter

from app.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.mood import Mood
from app.models.calendar import Calendar
from app.schemas.stats import DailyStats, TopAuthor, StatsResponse

router = APIRouter(prefix="/stats", tags=["stats"])

@router.get("/global", response_model=StatsResponse)
async def get_global_stats(
    date: str = Query(..., description="YYYY-MM-DD"),
    db: AsyncSession = Depends(get_db)
):
    try:
        target_date = datetime.strptime(date, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid date format, use YYYY-MM-DD")

    stmt = select(Mood).where(
        and_(
            Mood.calendar_id.is_(None),
            Mood.date == target_date
        )
    )
    result = await db.execute(stmt)
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
        res_user = await db.execute(stmt_user)
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
        color_distribution=color_distribution or {}
    )

    return StatsResponse(daily=daily, top_authors=top_authors)

@router.get("/calendar/{calendar_id}")
async def get_calendar_stats(
    calendar_id: UUID,
    date: str = Query(..., description="YYYY-MM-DD"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt_cal = select(Calendar).where(Calendar.id == calendar_id)
    res_cal = await db.execute(stmt_cal)
    calendar = res_cal.scalar_one_or_none()
    if not calendar:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Calendar not found")
    if current_user.id not in calendar.member_ids:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "You are not a member of this calendar")

    try:
        target_date = datetime.strptime(date, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid date format, use YYYY-MM-DD")

    stmt = select(Mood).where(
        and_(
            Mood.calendar_id == calendar_id,
            Mood.date == target_date
        )
    )
    result = await db.execute(stmt)
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
        res_user = await db.execute(stmt_user)
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
        color_distribution=color_distribution or {}
    )

    return StatsResponse(daily=daily, top_authors=top_authors)