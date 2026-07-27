from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from datetime import datetime, timedelta
import jwt
from app.database import get_db
from app.schemas.auth import UserRegister, UserLogin, Token, VKAuth, TGAuth, UserOut
from app.services.auth_service import AuthService
from app.api.deps import get_current_user
from app.models.user import User
from app.config import settings

router = APIRouter(prefix="/auth", tags=["auth"])

class RefreshTokenRequest(BaseModel):
    refresh_token: str

class UpdateUserRequest(BaseModel):
    is_anonymous_by_default: Optional[bool] = None  # теперь опционально
    onboarding_completed: Optional[bool] = None

@router.post("/register", response_model=Token)
async def register(
    payload: UserRegister,
    db: AsyncSession = Depends(get_db)
):
    service = AuthService(db)
    try:
        user = await service.register_email(payload)
    except ValueError as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(e))
    return service.create_token(user)

@router.post("/login", response_model=Token)
async def login(
    payload: UserLogin,
    db: AsyncSession = Depends(get_db)
):
    service = AuthService(db)
    user = await service.authenticate_email(payload.email, payload.password)
    if not user:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid credentials")
    return service.create_token(user)

@router.post("/vk", response_model=Token)
async def auth_vk(
    payload: VKAuth,
    db: AsyncSession = Depends(get_db)
):
    service = AuthService(db)
    try:
        user = await service.authenticate_vk(payload.vk_access_token)
    except ValueError as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(e))
    return service.create_token(user)

@router.post("/tg", response_model=Token)
async def auth_tg(
    payload: TGAuth,
    db: AsyncSession = Depends(get_db)
):
    service = AuthService(db)
    try:
        user = await service.authenticate_telegram(payload.init_data)
    except ValueError as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(e))
    return service.create_token(user)

@router.get("/me", response_model=UserOut)
async def me(
    current_user: User = Depends(get_current_user)
):
    return current_user

@router.put("/me", response_model=UserOut)
async def update_me(
    payload: UpdateUserRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if payload.is_anonymous_by_default is not None:
        current_user.is_anonymous_by_default = payload.is_anonymous_by_default
    if payload.onboarding_completed is not None:
        current_user.onboarding_completed = payload.onboarding_completed
    await db.commit()
    await db.refresh(current_user)
    return current_user

@router.post("/refresh", response_model=Token)
async def refresh_token(
    payload: RefreshTokenRequest,
    db: AsyncSession = Depends(get_db)
):
    try:
        payload_data = jwt.decode(
            payload.refresh_token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        user_id = payload_data.get("sub")
        if not user_id:
            raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid refresh token")
    except jwt.PyJWTError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid refresh token")

    from sqlalchemy import select
    stmt = select(User).where(User.id == user_id)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "User not found")

    service = AuthService(db)
    return service.create_token(user)

@router.post("/logout")
async def logout(
    current_user: User = Depends(get_current_user)
):
    return {"detail": "Logged out"}