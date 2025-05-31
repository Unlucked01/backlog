from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime
from ..db.models.task import TaskType, TaskPriority, TaskStatus


# Схемы для этапов задач
class TaskStepBase(BaseModel):
    title: str
    description: Optional[str] = None
    order: int = 0


class TaskStepCreate(TaskStepBase):
    pass


class TaskStepUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    is_completed: Optional[bool] = None
    order: Optional[int] = None


class TaskStep(TaskStepBase):
    id: int
    task_id: int
    is_completed: bool
    completed_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


# Схемы для задач
class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    task_type: TaskType
    priority: TaskPriority
    deadline: datetime
    is_recurring: bool = False
    recurrence_pattern: Optional[str] = None
    color: str = "#3B82F6"


class TaskCreate(TaskBase):
    steps: List[TaskStepCreate] = []


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    task_type: Optional[TaskType] = None
    priority: Optional[TaskPriority] = None
    status: Optional[TaskStatus] = None
    deadline: Optional[datetime] = None
    is_recurring: Optional[bool] = None
    recurrence_pattern: Optional[str] = None
    color: Optional[str] = None


class Task(TaskBase):
    id: int
    user_id: int
    status: TaskStatus
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    steps: List[TaskStep] = []

    class Config:
        from_attributes = True


# Схемы для фильтров и статистики
class TaskFilter(BaseModel):
    task_type: Optional[TaskType] = None
    priority: Optional[TaskPriority] = None
    status: Optional[TaskStatus] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None


class TaskStats(BaseModel):
    total_tasks: int
    completed_tasks: int
    pending_tasks: int
    overdue_tasks: int
    yearly_debts: int
    semester_debts: int 