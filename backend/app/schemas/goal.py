from typing import Optional
from pydantic import BaseModel
from datetime import datetime
from ..db.models.goal import GoalType


class GoalBase(BaseModel):
    title: str
    description: Optional[str] = None
    goal_type: GoalType
    target_value: int
    start_date: datetime
    end_date: datetime
    is_active: bool = True


class GoalCreate(GoalBase):
    pass


class GoalUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    goal_type: Optional[GoalType] = None
    target_value: Optional[int] = None
    current_value: Optional[int] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    is_completed: Optional[bool] = None
    is_active: Optional[bool] = None


class Goal(GoalBase):
    id: int
    user_id: int
    current_value: int
    is_completed: bool
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class GoalProgressUpdate(BaseModel):
    increment: int = 1 