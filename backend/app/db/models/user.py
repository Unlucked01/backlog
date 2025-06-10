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
    
    # OAuth fields removed as per PRD requirements
    # Only email/password authentication is supported
    
    # Notification settings - only WebPush and Email
    email_notifications = Column(Boolean, default=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    tasks = relationship("Task", back_populates="user")
    goals = relationship("Goal", back_populates="user")
    achievements = relationship("UserAchievement", back_populates="user")
    push_subscription_data = relationship("PushSubscription", back_populates="user", uselist=False)
    notifications = relationship("Notification", back_populates="user") 