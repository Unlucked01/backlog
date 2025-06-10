import asyncio
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .core.config import settings
from .api.v1 import api_router
from .services.background_tasks import BackgroundTaskService

# Настройка логирования
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Управление жизненным циклом приложения"""
    # Запуск
    logger.info("Запуск приложения...")
    
    # Запускаем фоновые задачи только если VAPID ключи настроены
    if settings.VAPID_PRIVATE_KEY and settings.VAPID_PUBLIC_KEY:
        task = asyncio.create_task(BackgroundTaskService.start_background_scheduler())
        logger.info("Планировщик фоновых задач запущен")
    else:
        logger.warning("VAPID ключи не настроены, фоновые уведомления отключены")
        task = None
    
    yield
    
    # Завершение
    logger.info("Завершение работы приложения...")
    if task:
        task.cancel()
        try:
            await task
        except asyncio.CancelledError:
            logger.info("Планировщик фоновых задач остановлен")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"/api/v1/openapi.json",
    lifespan=lifespan
)

# Set all CORS enabled origins
if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.BACKEND_CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

app.include_router(api_router, prefix="/api/v1")


@app.get("/")
def read_root():
    return {
        "message": "Добро пожаловать в API студенческого планировщика!",
        "version": settings.VERSION,
        "docs": "/docs",
        "features": {
            "oauth_enabled": False,  # OAuth disabled as per PRD requirements
            "push_notifications": bool(settings.VAPID_PRIVATE_KEY),
            "telegram_bot": False  # Telegram integration disabled as per PRD requirements
        }
    } 