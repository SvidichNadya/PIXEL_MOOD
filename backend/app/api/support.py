from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.support import SupportRequest

router = APIRouter(prefix="/support", tags=["support"])

class SupportRequestCreate(BaseModel):
    message: str

@router.post("/")
async def create_support_request(
    payload: SupportRequestCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if not payload.message.strip():
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Message cannot be empty")

    request = SupportRequest(
        user_id=current_user.id,
        username=current_user.username,
        email=current_user.email,
        message=payload.message
    )
    db.add(request)
    await db.commit()
    await db.refresh(request)
    return {"detail": "Ваше сообщение сохранено. Мы ответим вам в ближайшее время."}