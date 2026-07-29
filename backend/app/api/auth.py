from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, EmailStr
from typing import Optional
import hmac
import hashlib
import httpx
from datetime import datetime  # <-- ДОБАВЛЕН ИМПОРТ

from app.database import get_db
from app.models.user import User
from app.services.auth_service import AuthService
from app.schemas.auth import UserLogin, UserRegister, Token, UserOut
from app.config import settings

router = APIRouter(prefix="/auth", tags=["auth"])


class VKBridgeAuth(BaseModel):
    vk_user_id: int
    sign: str
    vk_ts: int
    vk_app_id: Optional[int] = None
    vk_is_app_user: Optional[int] = None
    vk_viewer_id: Optional[int] = None


@router.post("/login", response_model=Token)
async def login(
    payload: UserLogin,
    db: AsyncSession = Depends(get_db)
):
    service = AuthService(db)
    user = await service.authenticate_email(payload.email, payload.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверный email или пароль",
        )
    return service.create_token(user)


@router.post("/register", response_model=Token)
async def register(
    payload: UserRegister,
    db: AsyncSession = Depends(get_db)
):
    service = AuthService(db)
    user = await service.register_email(payload)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Пользователь с таким email или username уже существует",
        )
    return service.create_token(user)


@router.post("/vk-bridge", response_model=Token)
async def auth_vk_bridge(
    payload: VKBridgeAuth,
    db: AsyncSession = Depends(get_db)
):
    """
    Авторизация через VK Bridge (для мобильного приложения VK).
    Проверяет подпись и создаёт/обновляет пользователя.
    """
    # 1. Проверка наличия секретного ключа
    if not settings.VK_SECRET:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="VK_SECRET не настроен на сервере"
        )

    # 2. Собираем параметры для проверки подписи (без sign)
    params = payload.dict()
    sorted_params = sorted([
        (k, v) for k, v in params.items()
        if k in ('vk_user_id', 'vk_ts') and v is not None
    ])
    params_string = "&".join([f"{k}={v}" for k, v in sorted_params])

    # 3. Вычисляем ожидаемую подпись
    expected_sign = hmac.new(
        key=bytes(settings.VK_SECRET, "utf-8"),
        msg=bytes(params_string, "utf-8"),
        digestmod=hashlib.sha256
    ).hexdigest()

    if payload.sign != expected_sign:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверная подпись VK"
        )

    # 4. Получаем или создаём пользователя
    service = AuthService(db)

    user = await service.get_user_by_vk_id(str(payload.vk_user_id))
    if user:
        return service.create_token(user)

    # 5. Если пользователь не найден, получаем его данные через VK API
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                "https://api.vk.com/method/users.get",
                params={
                    "user_ids": payload.vk_user_id,
                    "v": "5.131",
                    "fields": "photo_50,first_name,last_name"
                }
            )
            data = resp.json()
            if "error" in data:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Ошибка VK API: {data['error']['error_msg']}"
                )
            vk_user_data = data["response"][0] if data.get("response") else None
            if not vk_user_data:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Пользователь VK не найден"
                )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка получения данных из VK: {str(e)}"
        )

    # 6. Создаём нового пользователя
    import secrets
    username = f"vk_{payload.vk_user_id}"
    display_name = f"{vk_user_data.get('first_name', '')} {vk_user_data.get('last_name', '')}".strip()
    if not display_name:
        display_name = f"User {payload.vk_user_id}"

    random_password = secrets.token_urlsafe(20)

    new_user = User(
        username=username,
        email=f"{payload.vk_user_id}@vk.com",
        display_name=display_name,
        vk_id=str(payload.vk_user_id),
        avatar_url=vk_user_data.get("photo_50"),
        password_hash=AuthService.hash_password(random_password),
        consent_to_reveal_given_at=datetime.utcnow(),
        allow_paid_reveal=True,
        is_anonymous_by_default=True,
        onboarding_completed=False,
    )

    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    return service.create_token(new_user)


# ============================================================
# Эндпоинты /me, /logout, /refresh с корректной зависимостью
# ============================================================

@router.get("/me", response_model=UserOut)
async def get_current_user(
    db: AsyncSession = Depends(get_db),
    token: str = Depends(lambda: None)  # временно, нужно передавать токен через заголовок
):
    """
    Возвращает данные текущего пользователя.
    Токен должен быть передан в заголовке Authorization: Bearer <token>
    """
    # ВАЖНО: в реальном коде токен извлекается из заголовка.
    # Здесь используется упрощённая версия — передавайте токен через Depends.
    # Правильная реализация — через fastapi.security.OAuth2PasswordBearer.
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Используйте защищённый роут с Depends(AuthService.get_current_user_with_db)"
    )


# ВАЖНО: ЭТОТ ЭНДПОИНТ НУЖНО ПЕРЕПИСАТЬ, ИСПОЛЬЗУЯ fastapi.security
# Ниже — правильная реализация с OAuth2PasswordBearer:

from fastapi.security import OAuth2PasswordBearer

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

@router.get("/me", response_model=UserOut)
async def get_current_user_secure(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
):
    """Возвращает данные текущего пользователя (защищённый эндпоинт)."""
    user = await AuthService.get_current_user(token, db)
    return user


@router.post("/logout")
async def logout(
    current_user: User = Depends(lambda: None)  # временно
):
    # Для JWT logout просто удаляем токен на клиенте
    return {"detail": "OK"}


@router.post("/refresh", response_model=Token)
async def refresh_token(
    refresh_token: str,
    db: AsyncSession = Depends(get_db)
):
    # Реализация обновления токена (если нужна)
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Refresh token not implemented yet"
    )