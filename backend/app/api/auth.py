from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from typing import Optional
import hmac
import hashlib
import httpx
import secrets
from datetime import datetime
from fastapi.security import OAuth2PasswordBearer

from app.database import get_db
from app.models.user import User
from app.services.auth_service import AuthService
from app.schemas.auth import UserLogin, UserRegister, Token, UserOut
from app.config import settings

router = APIRouter(prefix="/auth", tags=["auth"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

class VKBridgeAuth(BaseModel):
    vk_user_id: int
    sign: str
    vk_ts: int
    vk_app_id: Optional[int] = None
    vk_is_app_user: Optional[int] = None
    vk_viewer_id: Optional[int] = None

class UserUpdate(BaseModel):
    display_name: Optional[str] = None
    is_anonymous_by_default: Optional[bool] = None
    allow_paid_reveal: Optional[bool] = None
    avatar_url: Optional[str] = None

@router.post("/login", response_model=Token)
async def login(payload: UserLogin, db: AsyncSession = Depends(get_db)):
    service = AuthService(db)
    user = await service.authenticate_email(payload.email, payload.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверный email или пароль",
        )
    token_data = service.create_token(user)
    token_data["user"] = UserOut.model_validate(user)
    return token_data

@router.post("/register", response_model=Token)
async def register(payload: UserRegister, db: AsyncSession = Depends(get_db)):
    service = AuthService(db)
    try:
        user = await service.register_email(payload)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    token_data = service.create_token(user)
    token_data["user"] = UserOut.model_validate(user)
    return token_data

async def _handle_vk_auth(payload: VKBridgeAuth, db: AsyncSession) -> dict:
    if not settings.VK_SECRET:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="VK_SECRET не настроен на сервере",
        )

    # Простая проверка подписи (для production лучше расширить список параметров)
    params = payload.model_dump()
    sorted_params = sorted(
        [(k, v) for k, v in params.items() if k in ("vk_user_id", "vk_ts") and v is not None]
    )
    params_string = "&".join([f"{k}={v}" for k, v in sorted_params])

    expected_sign = hmac.new(
        key=settings.VK_SECRET.encode("utf-8"),
        msg=params_string.encode("utf-8"),
        digestmod=hashlib.sha256,
    ).hexdigest()

    if payload.sign != expected_sign:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Неверная подпись VK")

    service = AuthService(db)
    user = await service.get_user_by_vk_id(str(payload.vk_user_id))

    if user:
        token_data = service.create_token(user)
        token_data["user"] = UserOut.model_validate(user)
        return token_data

    # Создаём нового пользователя
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                "https://api.vk.com/method/users.get",
                params={
                    "user_ids": payload.vk_user_id,
                    "v": "5.131",
                    "fields": "photo_50,first_name,last_name",
                },
            )
            data = resp.json()
            if "error" in data:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Ошибка VK API: {data['error']['error_msg']}",
                )
            vk_user_data = data["response"][0] if data.get("response") else None
            if not vk_user_data:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Пользователь VK не найден")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка получения данных из VK: {str(e)}",
        )

    display_name = f"{vk_user_data.get('first_name', '')} {vk_user_data.get('last_name', '')}".strip()
    if not display_name:
        display_name = f"User {payload.vk_user_id}"

    new_user = User(
        username=f"vk_{payload.vk_user_id}",
        email=f"{payload.vk_user_id}@vk.com",
        display_name=display_name,
        vk_id=str(payload.vk_user_id),
        avatar_url=vk_user_data.get("photo_50"),
        password_hash=AuthService.hash_password(secrets.token_urlsafe(20)),
        consent_to_reveal_given_at=datetime.utcnow(),
        allow_paid_reveal=True,
        is_anonymous_by_default=True,
        onboarding_completed=False,
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    token_data = service.create_token(new_user)
    token_data["user"] = UserOut.model_validate(new_user)
    return token_data

@router.post("/vk", response_model=Token)
async def auth_vk(payload: VKBridgeAuth, db: AsyncSession = Depends(get_db)):
    """Алиас для совместимости с ENDPOINTS.AUTH.VK"""
    return await _handle_vk_auth(payload, db)

@router.post("/vk-bridge", response_model=Token)
async def auth_vk_bridge(payload: VKBridgeAuth, db: AsyncSession = Depends(get_db)):
    return await _handle_vk_auth(payload, db)

@router.get("/me", response_model=UserOut)
async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
):
    return await AuthService.get_current_user(token, db)

@router.put("/me", response_model=UserOut)
async def update_current_user(
    payload: UserUpdate,
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
):
    user = await AuthService.get_current_user(token, db)

    if payload.display_name is not None:
        user.display_name = payload.display_name
    if payload.is_anonymous_by_default is not None:
        user.is_anonymous_by_default = payload.is_anonymous_by_default
    if payload.allow_paid_reveal is not None:
        user.allow_paid_reveal = payload.allow_paid_reveal
    if payload.avatar_url is not None:
        user.avatar_url = payload.avatar_url

    await db.commit()
    await db.refresh(user)
    return user

@router.post("/logout")
async def logout():
    return {"detail": "OK"}

@router.post("/refresh", response_model=Token)
async def refresh_token(refresh_token: str, db: AsyncSession = Depends(get_db)):
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Refresh token not implemented yet",
    )