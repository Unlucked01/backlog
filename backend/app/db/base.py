from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from ..core.config import get_settings

# Создаем свежий экземпляр настроек для получения правильного URL
print("🔍 Creating database engine in base.py...")
settings = get_settings()
database_url = settings.get_database_url()
print(f"🔍 base.py using database URL: {database_url}")
engine = create_engine(database_url)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base() 