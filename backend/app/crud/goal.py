from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_
from ..db.models.goal import Goal
from ..schemas.goal import GoalCreate, GoalUpdate
from datetime import datetime


def get_user_goals(db: Session, user_id: int, skip: int = 0, limit: int = 100) -> List[Goal]:
    """Получить цели пользователя"""
    return db.query(Goal).filter(
        and_(Goal.user_id == user_id, Goal.is_active == True)
    ).offset(skip).limit(limit).all()


def get_goal(db: Session, goal_id: int, user_id: int) -> Optional[Goal]:
    """Получить конкретную цель пользователя"""
    return db.query(Goal).filter(
        and_(Goal.id == goal_id, Goal.user_id == user_id, Goal.is_active == True)
    ).first()


def create_goal(db: Session, goal: GoalCreate, user_id: int) -> Goal:
    """Создать новую цель"""
    db_goal = Goal(
        user_id=user_id,
        title=goal.title,
        description=goal.description,
        goal_type=goal.goal_type,
        target_value=goal.target_value,
        current_value=0,
        start_date=goal.start_date,
        end_date=goal.end_date,
        is_active=goal.is_active,
        is_completed=False
    )
    db.add(db_goal)
    db.commit()
    db.refresh(db_goal)
    return db_goal


def update_goal(db: Session, goal_id: int, user_id: int, goal_update: GoalUpdate) -> Optional[Goal]:
    """Обновить цель"""
    db_goal = get_goal(db, goal_id, user_id)
    if not db_goal:
        return None
    
    update_data = goal_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_goal, field, value)
    
    # Проверяем, достигнута ли цель
    if 'current_value' in update_data or 'target_value' in update_data:
        if db_goal.current_value >= db_goal.target_value and not db_goal.is_completed:
            db_goal.is_completed = True
            db_goal.completed_at = datetime.now()
        elif db_goal.current_value < db_goal.target_value and db_goal.is_completed:
            db_goal.is_completed = False
            db_goal.completed_at = None
    
    db_goal.updated_at = datetime.now()
    db.commit()
    db.refresh(db_goal)
    return db_goal


def update_goal_progress(db: Session, goal_id: int, user_id: int, increment: int) -> Optional[Goal]:
    """Обновить прогресс цели"""
    db_goal = get_goal(db, goal_id, user_id)
    if not db_goal:
        return None
    
    db_goal.current_value = max(0, db_goal.current_value + increment)
    
    # Проверяем, достигнута ли цель
    if db_goal.current_value >= db_goal.target_value and not db_goal.is_completed:
        db_goal.is_completed = True
        db_goal.completed_at = datetime.now()
    elif db_goal.current_value < db_goal.target_value and db_goal.is_completed:
        db_goal.is_completed = False
        db_goal.completed_at = None
    
    db_goal.updated_at = datetime.now()
    db.commit()
    db.refresh(db_goal)
    return db_goal


def delete_goal(db: Session, goal_id: int, user_id: int) -> bool:
    """Удалить цель (мягкое удаление)"""
    db_goal = get_goal(db, goal_id, user_id)
    if not db_goal:
        return False
    
    db_goal.is_active = False
    db_goal.updated_at = datetime.now()
    db.commit()
    return True


def get_completed_goals_count(db: Session, user_id: int) -> int:
    """Получить количество выполненных целей пользователя"""
    return db.query(Goal).filter(
        and_(Goal.user_id == user_id, Goal.is_completed == True)
    ).count() 