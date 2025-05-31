from typing import List, Optional, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from ....crud import task as crud_task
from ....db.session import get_db
from ....schemas.user import User
from ....schemas.task import Task, TaskCreate, TaskUpdate, TaskFilter, TaskStats, TaskStep
from .auth import get_current_user

router = APIRouter()


@router.get("/", response_model=List[Task])
def read_tasks(
    skip: int = 0,
    limit: int = 100,
    task_type: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Получить список задач пользователя с фильтрацией
    """
    filters = TaskFilter()
    if task_type:
        filters.task_type = task_type
    if priority:
        filters.priority = priority
    if status:
        filters.status = status
    
    tasks = crud_task.get_tasks(
        db=db, user_id=current_user.id, skip=skip, limit=limit, filters=filters
    )
    return tasks


@router.post("/", response_model=Task)
def create_task(
    task: TaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Создать новую задачу
    """
    return crud_task.create_task(db=db, task=task, user_id=current_user.id)


@router.get("/{task_id}", response_model=Task)
def read_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Получить задачу по ID
    """
    task = crud_task.get_task(db=db, task_id=task_id, user_id=current_user.id)
    if not task:
        raise HTTPException(status_code=404, detail="Задача не найдена")
    return task


@router.put("/{task_id}", response_model=Task)
def update_task(
    task_id: int,
    task_update: TaskUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Обновить задачу
    """
    task = crud_task.update_task(
        db=db, task_id=task_id, user_id=current_user.id, task_update=task_update
    )
    if not task:
        raise HTTPException(status_code=404, detail="Задача не найдена")
    return task


@router.delete("/{task_id}")
def delete_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Удалить задачу
    """
    success = crud_task.delete_task(db=db, task_id=task_id, user_id=current_user.id)
    if not success:
        raise HTTPException(status_code=404, detail="Задача не найдена")
    return {"message": "Задача удалена"}


@router.get("/upcoming/list", response_model=List[Task])
def read_upcoming_tasks(
    days: int = Query(7, description="Количество дней вперед"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Получить ближайшие задачи
    """
    return crud_task.get_upcoming_tasks(db=db, user_id=current_user.id, days=days)


@router.get("/overdue/list", response_model=List[Task])
def read_overdue_tasks(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Получить просроченные задачи
    """
    return crud_task.get_overdue_tasks(db=db, user_id=current_user.id)


@router.get("/stats/summary", response_model=TaskStats)
def read_task_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Получить статистику по задачам
    """
    stats = crud_task.get_task_stats(db=db, user_id=current_user.id)
    return TaskStats(**stats)


@router.put("/steps/{step_id}/complete")
def complete_task_step(
    step_id: int,
    is_completed: bool,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Отметить этап задачи как выполненный/невыполненный
    """
    step = crud_task.update_task_step(db=db, step_id=step_id, is_completed=is_completed)
    if not step:
        raise HTTPException(status_code=404, detail="Этап задачи не найден")
    return {"message": "Статус этапа обновлен"} 