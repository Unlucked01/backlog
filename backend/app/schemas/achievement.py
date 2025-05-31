from typing import Optional
from pydantic import BaseModel
from datetime import datetime


class AchievementBase(BaseModel):
    name: str
    description: str
    icon: Optional[str] = None
    condition_type: str
    condition_value: int
    points: int = 10


class Achievement(AchievementBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class UserAchievementBase(BaseModel):
    user_id: int
    achievement_id: int


class UserAchievementCreate(UserAchievementBase):
    pass


class UserAchievement(UserAchievementBase):
    id: int
    earned_at: datetime
    achievement: Achievement

    class Config:
        from_attributes = True


class UserStats(BaseModel):
    total_tasks: int
    completed_tasks: int
    pending_tasks: int
    overdue_tasks: int
    completion_rate: float
    current_streak: int
    total_points: int
    achievements_count: int
    completed_goals: int 