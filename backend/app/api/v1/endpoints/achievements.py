from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ....crud import achievement as crud_achievement
from ....db.session import get_db
from ....schemas.user import User
from ....schemas.achievement import Achievement, UserAchievement, UserStats
from .auth import get_current_user

router = APIRouter()


@router.get("/", response_model=List[Achievement])
def read_achievements(
    db: Session = Depends(get_db)
) -> Any:
    """
    Получить все доступные достижения
    """
    return crud_achievement.get_all_achievements(db)


@router.get("/user", response_model=List[UserAchievement])
def read_user_achievements(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Получить достижения текущего пользователя
    """
    return crud_achievement.get_user_achievements(db, current_user.id)


@router.get("/stats", response_model=UserStats)
def read_user_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Получить статистику пользователя
    """
    stats = crud_achievement.get_user_stats(db, current_user.id)
    return UserStats(**stats)


@router.post("/check")
def check_achievements(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Проверить и присвоить новые достижения
    """
    new_achievements = crud_achievement.check_and_award_achievements(db, current_user.id)
    return {
        "message": f"Проверка завершена. Получено новых достижений: {len(new_achievements)}",
        "new_achievements": new_achievements
    } 