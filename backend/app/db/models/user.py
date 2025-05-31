from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..base import Base


class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    avatar_url = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    
    # OAuth fields
    google_id = Column(String, nullable=True)
    vk_id = Column(String, nullable=True)
    telegram_id = Column(String, nullable=True)
    telegram_username = Column(String, nullable=True)
    
    # Notification settings
    push_subscription = Column(Text, nullable=True)  # JSON for web push
    telegram_notifications = Column(Boolean, default=False)
    email_notifications = Column(Boolean, default=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    tasks = relationship("Task", back_populates="user")
    goals = relationship("Goal", back_populates="user")
    achievements = relationship("UserAchievement", back_populates="user") 