from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from datetime import datetime
from ..db.models.task import Task, TaskStep, TaskStatus
from ..schemas.task import TaskCreate, TaskUpdate, TaskFilter, TaskStepCreate


def get_task(db: Session, task_id: int, user_id: int) -> Optional[Task]:
    return db.query(Task).filter(
        and_(Task.id == task_id, Task.user_id == user_id)
    ).first()


def get_tasks(
    db: Session, 
    user_id: int, 
    skip: int = 0, 
    limit: int = 100,
    filters: Optional[TaskFilter] = None
) -> List[Task]:
    query = db.query(Task).filter(Task.user_id == user_id)
    
    if filters:
        if filters.task_type:
            query = query.filter(Task.task_type == filters.task_type)
        if filters.priority:
            query = query.filter(Task.priority == filters.priority)
        if filters.status:
            # Специальная обработка для статуса "overdue"
            if filters.status == "overdue":
                query = query.filter(
                    or_(
                        Task.is_overdue == True,
                        and_(
                            Task.status.in_([TaskStatus.pending, TaskStatus.in_progress]),
                            Task.deadline < datetime.utcnow()
                        )
                    )
                )
            else:
                query = query.filter(Task.status == filters.status)
        if filters.start_date:
            query = query.filter(Task.deadline >= filters.start_date)
        if filters.end_date:
            query = query.filter(Task.deadline <= filters.end_date)
    
    return query.offset(skip).limit(limit).all()


def create_task(db: Session, task: TaskCreate, user_id: int) -> Task:
    db_task = Task(
        user_id=user_id,
        title=task.title,
        description=task.description,
        task_type=task.task_type,
        priority=task.priority,
        deadline=task.deadline,
        is_recurring=task.is_recurring,
        recurrence_pattern=task.recurrence_pattern,
        color=task.color
    )
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    
    # Создаем этапы задачи
    for step_data in task.steps:
        create_task_step(db, step_data, db_task.id)
    
    db.refresh(db_task)
    return db_task


def update_task(db: Session, task_id: int, user_id: int, task_update: TaskUpdate) -> Optional[Task]:
    db_task = get_task(db, task_id, user_id)
    if not db_task:
        return None
    
    update_data = task_update.dict(exclude_unset=True)
    
    # Если статус меняется на "выполнено", устанавливаем время завершения
    if update_data.get("status") == TaskStatus.completed and db_task.status != TaskStatus.completed:
        update_data["completed_at"] = datetime.utcnow()
    
    for field, value in update_data.items():
        setattr(db_task, field, value)
    
    db.commit()
    db.refresh(db_task)
    return db_task


def delete_task(db: Session, task_id: int, user_id: int) -> bool:
    db_task = get_task(db, task_id, user_id)
    if not db_task:
        return False
    
    db.delete(db_task)
    db.commit()
    return True


def get_upcoming_tasks(db: Session, user_id: int, days: int = 7) -> List[Task]:
    """Получить задачи на ближайшие N дней"""
    from datetime import timedelta
    end_date = datetime.utcnow() + timedelta(days=days)
    
    return db.query(Task).filter(
        and_(
            Task.user_id == user_id,
            Task.status != TaskStatus.completed,
            Task.deadline <= end_date,
            Task.deadline >= datetime.utcnow()
        )
    ).order_by(Task.deadline).all()


def get_overdue_tasks(db: Session, user_id: int) -> List[Task]:
    """Получить просроченные задачи"""
    # Используем новое поле is_overdue для более точной фильтрации
    return db.query(Task).filter(
        and_(
            Task.user_id == user_id,
            or_(
                Task.is_overdue == True,
                and_(
                    Task.status.in_([TaskStatus.pending, TaskStatus.in_progress]),
                    Task.deadline < datetime.utcnow()
                )
            )
        )
    ).all()


# CRUD для этапов задач
def create_task_step(db: Session, step: TaskStepCreate, task_id: int) -> TaskStep:
    db_step = TaskStep(
        task_id=task_id,
        title=step.title,
        description=step.description,
        order=step.order
    )
    db.add(db_step)
    db.commit()
    db.refresh(db_step)
    return db_step


def update_task_step(db: Session, step_id: int, is_completed: bool) -> Optional[TaskStep]:
    db_step = db.query(TaskStep).filter(TaskStep.id == step_id).first()
    if not db_step:
        return None
    
    db_step.is_completed = is_completed
    if is_completed:
        db_step.completed_at = datetime.utcnow()
    else:
        db_step.completed_at = None
    
    db.commit()
    db.refresh(db_step)
    return db_step


def get_task_stats(db: Session, user_id: int) -> dict:
    """Получить статистику по задачам пользователя"""
    total = db.query(Task).filter(Task.user_id == user_id).count()
    completed = db.query(Task).filter(
        and_(Task.user_id == user_id, Task.status == TaskStatus.completed)
    ).count()
    pending = db.query(Task).filter(
        and_(Task.user_id == user_id, Task.status.in_([TaskStatus.pending, TaskStatus.in_progress]))
    ).count()
    overdue = len(get_overdue_tasks(db, user_id))
    
    from ..db.models.task import TaskPriority
    yearly_debts = db.query(Task).filter(
        and_(Task.user_id == user_id, Task.priority == TaskPriority.yearly_debt)
    ).count()
    semester_debts = db.query(Task).filter(
        and_(Task.user_id == user_id, Task.priority == TaskPriority.semester_debt)
    ).count()
    
    return {
        "total_tasks": total,
        "completed_tasks": completed,
        "pending_tasks": pending,
        "overdue_tasks": overdue,
        "yearly_debts": yearly_debts,
        "semester_debts": semester_debts
    } 