from fastapi import FastAPI, APIRouter, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
import logging
from contextlib import asynccontextmanager

from app.config import settings
from app.database import engine
from app.redis_client import redis_client

# Прямые импорты роутеров (без посредника __init__.py)
from app.api.auth import router as auth_router
from app.api.moods import router as moods_router
from app.api.calendars import router as calendars_router
from app.api.reactions import router as reactions_router
from app.api.payments import router as payments_router
from app.api.stats import router as stats_router
from app.api.support import router as support_router
from app.api.admin import router as admin_router
from app.api.notifications import router as notifications_router

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting PIXEL Mood API")
    logger.info(f"ALLOWED_ORIGINS: {settings.ALLOWED_ORIGINS}")
    await redis_client.connect()
    logger.info("Redis connected")
    yield
    await redis_client.close()
    await engine.dispose()
    logger.info("Connections closed")

app = FastAPI(
    title="PIXEL Mood API",
    description="API for global and private mood calendars",
    version="1.0.0",
    lifespan=lifespan,
    # Редиректы включены по умолчанию – это правильно
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Глобальные обработчики ошибок
@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = []
    for error in exc.errors():
        field = ".".join(str(loc) for loc in error["loc"])
        errors.append({"field": field, "message": error["msg"]})
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": "Validation error", "errors": errors},
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Internal server error"},
    )

# ---- Подключаем роутеры ----
api_router = APIRouter(prefix="/api")
api_router.include_router(auth_router)
api_router.include_router(moods_router)
api_router.include_router(calendars_router)
api_router.include_router(reactions_router)
api_router.include_router(payments_router)
api_router.include_router(stats_router)
api_router.include_router(support_router)
api_router.include_router(admin_router)
api_router.include_router(notifications_router)
app.include_router(api_router)

# ---- Отладочный эндпоинт – посмотреть все зарегистрированные пути ----
@app.get("/debug/routes")
async def debug_routes():
    routes = []
    for route in app.routes:
        if hasattr(route, "path") and hasattr(route, "methods"):
            routes.append({
                "path": route.path,
                "methods": list(route.methods) if route.methods else []
            })
    return {"routes": routes}

# ---- Корневые эндпоинты ----
@app.get("/health")
async def health_check():
    redis_status = "ok" if await redis_client.ping() else "failed"
    return {"status": "ok", "redis": redis_status, "version": "1.0.0"}

@app.get("/")
async def root():
    return {
        "message": "Welcome to PIXEL Mood API",
        "docs": "/docs",
        "health": "/health",
    }