from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from sqlalchemy.ext.hybrid import hybrid_property
import enum
from datetime import datetime
from ..base import Base


class TaskType(str, enum.Enum):
    coursework = "coursework"  # курсовая
    exam = "exam"  # экзамен
    laboratory = "laboratory"  # лабораторная
    lecture = "lecture"  # лекция
    seminar = "seminar"  # семинар
    project = "project"  # проект
    homework = "homework"  # домашнее задание
    other = "other"  # другое


class TaskPriority(str, enum.Enum):
    yearly_debt = "yearly_debt"  # годовой долг
    semester_debt = "semester_debt"  # семестровый долг
    current = "current"  # текущая


class TaskStatus(str, enum.Enum):
    pending = "pending"  # ожидает выполнения
    in_progress = "in_progress"  # в процессе
    completed = "completed"  # выполнено
    overdue = "overdue"  # просрочено


class Task(Base):
    __tablename__ = "tasks"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    
    task_type = Column(Enum(TaskType), nullable=False)
    priority = Column(Enum(TaskPriority), nullable=False)
    status = Column(Enum(TaskStatus), default=TaskStatus.pending)
    
    deadline = Column(DateTime(timezone=True), nullable=False)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Поле для хранения статуса просрочки
    is_overdue = Column(Boolean, default=False, index=True)
    
    # Repetition settings
    is_recurring = Column(Boolean, default=False)
    recurrence_pattern = Column(String, nullable=True)  # "daily", "weekly", "monthly"
    
    # Color for calendar
    color = Column(String(7), default="#3B82F6")  # hex color
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="tasks")
    steps = relationship("TaskStep", back_populates="task", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="task")
    
    @hybrid_property
    def is_actually_overdue(self):
        """Динамическое определение просрочки"""
        if self.status == TaskStatus.completed:
            return False
        return datetime.utcnow() > self.deadline


class TaskStep(Base):
    __tablename__ = "task_steps"
    
    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("tasks.id"), nullable=False)
    
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    is_completed = Column(Boolean, default=False)
    order = Column(Integer, default=0)
    
    completed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationship
    task = relationship("Task", back_populates="steps") 