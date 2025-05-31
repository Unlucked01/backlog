from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ....crud import goal as crud_goal
from ....db.session import get_db
from ....schemas.user import User
from ....schemas.goal import Goal, GoalCreate, GoalUpdate, GoalProgressUpdate
from .auth import get_current_user

router = APIRouter()


@router.get("/", response_model=List[Goal])
def read_goals(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Получить цели текущего пользователя
    """
    goals = crud_goal.get_user_goals(db, current_user.id, skip=skip, limit=limit)
    return goals


@router.post("/", response_model=Goal)
def create_goal(
    goal: GoalCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Создать новую цель
    """
    return crud_goal.create_goal(db, goal, current_user.id)


@router.get("/{goal_id}", response_model=Goal)
def read_goal(
    goal_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Получить конкретную цель
    """
    goal = crud_goal.get_goal(db, goal_id, current_user.id)
    if not goal:
        raise HTTPException(status_code=404, detail="Цель не найдена")
    return goal


@router.put("/{goal_id}", response_model=Goal)
def update_goal(
    goal_id: int,
    goal_update: GoalUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Обновить цель
    """
    goal = crud_goal.update_goal(db, goal_id, current_user.id, goal_update)
    if not goal:
        raise HTTPException(status_code=404, detail="Цель не найдена")
    return goal


@router.post("/{goal_id}/progress", response_model=Goal)
def update_goal_progress(
    goal_id: int,
    progress_update: GoalProgressUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Обновить прогресс цели
    """
    goal = crud_goal.update_goal_progress(db, goal_id, current_user.id, progress_update.increment)
    if not goal:
        raise HTTPException(status_code=404, detail="Цель не найдена")
    return goal


@router.delete("/{goal_id}")
def delete_goal(
    goal_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Удалить цель
    """
    if not crud_goal.delete_goal(db, goal_id, current_user.id):
        raise HTTPException(status_code=404, detail="Цель не найдена")
    return {"message": "Цель успешно удалена"} 