from typing import Optional
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "postgresql://postgres:password@localhost:5432/student_planner"
    
    # JWT
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # CORS
    BACKEND_CORS_ORIGINS: list[str] = ["http://localhost:3000"]
    
    # App
    PROJECT_NAME: str = "Student Planner API"
    VERSION: str = "1.0.0"
    DEBUG: bool = True
    
    # WebPush
    VAPID_PRIVATE_KEY: Optional[str] = None
    VAPID_PUBLIC_KEY: Optional[str] = None
    VAPID_SUBJECT: str = "mailto:admin@studentplanner.ru"
    
    # Telegram
    TELEGRAM_BOT_TOKEN: Optional[str] = None
    
    # OAuth - Google
    GOOGLE_CLIENT_ID: Optional[str] = None
    GOOGLE_CLIENT_SECRET: Optional[str] = None
    GOOGLE_REDIRECT_URI: str = "http://localhost:3000/auth/google/callback"
    
    # OAuth - VK
    VK_CLIENT_ID: Optional[str] = None
    VK_CLIENT_SECRET: Optional[str] = None
    VK_REDIRECT_URI: str = "http://localhost:3000/auth/vk/callback"
    
    # OAuth - Telegram
    TELEGRAM_APP_ID: Optional[str] = None
    TELEGRAM_APP_HASH: Optional[str] = None
    
    # Base URLs
    FRONTEND_URL: str = "http://localhost:3000"
    BACKEND_URL: str = "http://localhost:8000"
    
    class Config:
        env_file = ".env"


settings = Settings() 