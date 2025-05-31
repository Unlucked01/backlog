from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum
from ..base import Base


class GoalType(str, enum.Enum):
    semester = "semester"  # семестровая цель
    monthly = "monthly"  # месячная цель
    weekly = "weekly"  # недельная цель
    custom = "custom"  # пользовательская цель


class Goal(Base):
    __tablename__ = "goals"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    goal_type = Column(Enum(GoalType), nullable=False)
    
    target_value = Column(Integer, nullable=False)  # целевое значение
    current_value = Column(Integer, default=0)  # текущий прогресс
    
    start_date = Column(DateTime(timezone=True), nullable=False)
    end_date = Column(DateTime(timezone=True), nullable=False)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    
    is_completed = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationship
    user = relationship("User", back_populates="goals")


class Achievement(Base):
    __tablename__ = "achievements"
    
    id = Column(Integer, primary_key=True, index=True)
    
    name = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    icon = Column(String, nullable=True)  # emoji или URL иконки
    
    # Условия получения
    condition_type = Column(String, nullable=False)  # "tasks_completed", "streak_days", etc.
    condition_value = Column(Integer, nullable=False)
    
    points = Column(Integer, default=10)  # очки за достижение
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationship
    user_achievements = relationship("UserAchievement", back_populates="achievement")


class UserAchievement(Base):
    __tablename__ = "user_achievements"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    achievement_id = Column(Integer, ForeignKey("achievements.id"), nullable=False)
    
    earned_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="achievements")
    achievement = relationship("Achievement", back_populates="user_achievements") 