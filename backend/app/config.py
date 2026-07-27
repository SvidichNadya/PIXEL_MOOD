from typing import Optional, List, Union
from pydantic_settings import BaseSettings
from pydantic import field_validator, Field
import json

class Settings(BaseSettings):
    # Database
    DATABASE_URL: str

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # JWT
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7

    # VK
    VK_APP_ID: Optional[int] = Field(default=None)
    VK_SECRET: Optional[str] = Field(default=None)

    # Telegram
    TG_BOT_TOKEN: Optional[str] = Field(default=None)
    TG_BOT_SECRET: Optional[str] = Field(default=None)

    # Payments
    YOOKASSA_SHOP_ID: Optional[str] = Field(default=None)
    YOOKASSA_SECRET_KEY: Optional[str] = Field(default=None)
    REVEAL_PRICE_RUB: int = 49
    DONATE_AMOUNTS: List[int] = [50, 100, 200]

    # CORS
    ALLOWED_ORIGINS: Union[str, List[str]] = Field(
        default=["http://localhost", "http://localhost:5173"]
    )

    @field_validator('VK_APP_ID', mode='before')
    @classmethod
    def parse_vk_app_id(cls, v):
        if v == '' or v is None:
            return None
        try:
            return int(v)
        except (ValueError, TypeError):
            return None

    @field_validator('ALLOWED_ORIGINS', mode='before')
    @classmethod
    def parse_allowed_origins(cls, v):
        if isinstance(v, str):
            v = v.strip()
            if not v:
                return []
            if v.startswith('[') and v.endswith(']'):
                try:
                    return json.loads(v)
                except json.JSONDecodeError:
                    pass
            items = [x.strip() for x in v.split(',') if x.strip()]
            return items
        return v

    class Config:
        env_file = ".env"
        extra = "ignore"
        env_parse_none_str = ""

settings = Settings()
if isinstance(settings.ALLOWED_ORIGINS, str):
    settings.ALLOWED_ORIGINS = [settings.ALLOWED_ORIGINS]