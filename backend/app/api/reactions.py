from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from uuid import UUID
from typing import List

from app.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.mood import Mood
from app.models.reaction import Reaction
from app.models.notification import Notification
from app.schemas.reaction import ReactionCreate, ReactionOut

router = APIRouter(prefix="/moods/{mood_id}/reactions", tags=["reactions"])

@router.post("/", response_model=ReactionOut, status_code=status.HTTP_201_CREATED)
async def add_reaction(
    mood_id: UUID,
    payload: ReactionCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Добавить реакцию на настроение (тип – 'like', 'heart', 'laugh')."""
    stmt = select(Mood).where(Mood.id == mood_id)
    result = await db.execute(stmt)
    mood = result.scalar_one_or_none()
    if not mood:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Mood not found")

    stmt = select(Reaction).where(
        and_(
            Reaction.mood_id == mood_id,
            Reaction.user_id == current_user.id,
            Reaction.type == payload.type
        )
    )
    result = await db.execute(stmt)
    existing = result.scalar_one_or_none()
    if existing:
        raise HTTPException(status.HTTP_409_CONFLICT, f"You already reacted with {payload.type}")

    reaction = Reaction(
        mood_id=mood_id,
        user_id=current_user.id,
        type=payload.type
    )
    db.add(reaction)
    await db.commit()
    await db.refresh(reaction)

    # Уведомление владельцу пикселя (если это не сам владелец)
    if mood.user_id != current_user.id:
        notification = Notification(
            user_id=mood.user_id,
            type='reaction',
            title='Новая реакция',
            message=f'{current_user.display_name} поставил(а) реакцию {payload.type} на ваш пиксель',
            link=f'/moods/{mood_id}'
        )
        db.add(notification)
        await db.commit()

    return reaction

@router.delete("/{reaction_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_reaction(
    mood_id: UUID,
    reaction_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Reaction).where(
        and_(
            Reaction.id == reaction_id,
            Reaction.mood_id == mood_id,
            Reaction.user_id == current_user.id
        )
    )
    result = await db.execute(stmt)
    reaction = result.scalar_one_or_none()
    if not reaction:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Reaction not found or you don't own it")
    await db.delete(reaction)
    await db.commit()

@router.get("/", response_model=List[ReactionOut])
async def get_reactions(
    mood_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Reaction).where(Reaction.mood_id == mood_id).order_by(Reaction.created_at)
    result = await db.execute(stmt)
    reactions = result.scalars().all()
    return reactions