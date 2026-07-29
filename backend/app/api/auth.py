from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from typing import Optional
import hmac
import hashlib
import httpx
from datetime import datetime
from fastapi.security import OAuth2PasswordBearer

from app.database import get_db
from app.models.user import User
from app.services.auth_service import AuthService
from app.schemas.auth import UserLogin, UserRegister, Token, UserOut
from app.config import settings

router = APIRouter(prefix="/auth", tags=["auth"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

# ============================================================
# Модель для VK Bridge авторизации
# ============================================================
class VKBridgeAuth(BaseModel):
    vk_user_id: int
    sign: str
    vk_ts: int
    vk_app_id: Optional[int] = None
    vk_is_app_user: Optional[int] = None
    vk_viewer_id: Optional[int] = None


# ============================================================
# Эндпоинт для входа по email и паролю
# ============================================================
@router.post("/login", response_model=Token)
async def login(
    payload: UserLogin,
    db: AsyncSession = Depends(get_db)
):
    """
    Авторизация пользователя по email и паролю.
    Возвращает JWT-токен.
    """
    service = AuthService(db)
    user = await service.authenticate_email(payload.email, payload.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверный email или пароль",
        )
    return service.create_token(user)


# ============================================================
# Эндпоинт для регистрации нового пользователя
# ============================================================
@router.post("/register", response_model=Token)
async def register(
    payload: UserRegister,
    db: AsyncSession = Depends(get_db)
):
    """
    Регистрация нового пользователя.
    Возвращает JWT-токен.
    """
    service = AuthService(db)
    try:
        user = await service.register_email(payload)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    return service.create_token(user)


# ============================================================
# Эндпоинт для авторизации через VK Bridge (мобильное приложение)
# ============================================================
@router.post("/vk-bridge", response_model=Token)
async def auth_vk_bridge(
    payload: VKBridgeAuth,
    db: AsyncSession = Depends(get_db)
):
    """
    Авторизация через VK Bridge для мобильного приложения VK.
    Проверяет подпись sign, получает данные пользователя из VK API,
    создаёт пользователя в БД и возвращает JWT-токен.
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

    # 4. Сравниваем подписи
    if payload.sign != expected_sign:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверная подпись VK"
        )

    service = AuthService(db)

    # 5. Ищем пользователя по VK ID
    user = await service.get_user_by_vk_id(str(payload.vk_user_id))
    if user:
        return service.create_token(user)

    # 6. Если пользователь не найден — получаем данные из VK API
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

    # 7. Создаём нового пользователя
    import secrets
    username = f"vk_{payload.vk_user_id}"
    display_name = f"{vk_user_data.get('first_name', '')} {vk_user_data.get('last_name', '')}".strip()
    if not display_name:
        display_name = f"User {payload.vk_user_id}"

    new_user = User(
        username=username,
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

    return service.create_token(new_user)


# ============================================================
# Эндпоинт для получения данных текущего пользователя (защищённый)
# ============================================================
@router.get("/me", response_model=UserOut)
async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
):
    """
    Возвращает данные авторизованного пользователя.
    Требуется JWT-токен в заголовке Authorization: Bearer <token>
    """
    user = await AuthService.get_current_user(token, db)
    return user


# ============================================================
# Эндпоинт для выхода (удаление токена на клиенте)
# ============================================================
@router.post("/logout")
async def logout():
    """
    Выход из аккаунта.
    Токен должен быть удалён на клиенте.
    """
    return {"detail": "OK"}


# ============================================================
# Эндпоинт для обновления JWT-токена (если нужен refresh)
# ============================================================
@router.post("/refresh", response_model=Token)
async def refresh_token(
    refresh_token: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Обновление JWT-токена по refresh-токену.
    (Пока не реализовано, можно добавить позже)
    """
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Refresh token not implemented yet"
    )