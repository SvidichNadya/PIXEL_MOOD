# backend/app/api/__init__.py
from .auth import router as auth_router
from .moods import router as moods_router
from .calendars import router as calendars_router
from .reactions import router as reactions_router
from .payments import router as payments_router
from .stats import router as stats_router
from .support import router as support_router
from .admin import router as admin_router
from .notifications import router as notifications_router

__all__ = [
    "auth_router",
    "moods_router",
    "calendars_router",
    "reactions_router",
    "payments_router",
    "stats_router",
    "support_router",
    "admin_router",
    "notifications_router",
]