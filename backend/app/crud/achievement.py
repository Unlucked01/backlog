from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import and_, desc, func, distinct
from ..db.models.goal import Achievement, UserAchievement, Goal
from ..db.models.task import Task, TaskStatus
from ..db.models.user import User
from datetime import datetime, timedelta


def get_all_achievements(db: Session) -> List[Achievement]:
    """Получить все доступные достижения"""
    return db.query(Achievement).order_by(Achievement.points).all()


def get_user_achievements(db: Session, user_id: int) -> List[UserAchievement]:
    """Получить достижения пользователя"""
    return db.query(UserAchievement).filter(
        UserAchievement.user_id == user_id
    ).order_by(desc(UserAchievement.earned_at)).all()


def award_achievement(db: Session, user_id: int, achievement_id: int) -> UserAchievement:
    """Присвоить достижение пользователю"""
    # Проверяем, есть ли уже это достижение у пользователя
    existing = db.query(UserAchievement).filter(
        and_(
            UserAchievement.user_id == user_id,
            UserAchievement.achievement_id == achievement_id
        )
    ).first()
    
    if existing:
        return existing
    
    user_achievement = UserAchievement(
        user_id=user_id,
        achievement_id=achievement_id,
        earned_at=datetime.now()
    )
    db.add(user_achievement)
    db.commit()
    db.refresh(user_achievement)
    return user_achievement


def get_user_stats(db: Session, user_id: int) -> Dict[str, Any]:
    """Получить статистику пользователя для достижений"""
    # Базовая статистика задач
    total_tasks = db.query(Task).filter(Task.user_id == user_id).count()
    completed_tasks = db.query(Task).filter(
        and_(Task.user_id == user_id, Task.status == TaskStatus.completed)
    ).count()
    pending_tasks = db.query(Task).filter(
        and_(Task.user_id == user_id, Task.status == TaskStatus.pending)
    ).count()
    overdue_tasks = db.query(Task).filter(
        and_(Task.user_id == user_id, Task.status == TaskStatus.overdue)
    ).count()
    
    # Статистика целей
    completed_goals = db.query(Goal).filter(
        and_(Goal.user_id == user_id, Goal.is_completed == True)
    ).count()
    
    # Подсчет очков
    user_achievements = db.query(UserAchievement).filter(
        UserAchievement.user_id == user_id
    ).all()
    
    total_points = 0
    for ua in user_achievements:
        achievement = db.query(Achievement).filter(Achievement.id == ua.achievement_id).first()
        if achievement:
            total_points += achievement.points
    
    # Расчет completion_rate
    completion_rate = (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0
    
    # Подсчет streak (упрощенная версия - количество выполненных задач за последние 7 дней)
    week_ago = datetime.now() - timedelta(days=7)
    recent_completed = db.query(Task).filter(
        and_(
            Task.user_id == user_id,
            Task.status == TaskStatus.completed,
            Task.completed_at >= week_ago
        )
    ).count()
    
    return {
        "total_tasks": total_tasks,
        "completed_tasks": completed_tasks,
        "pending_tasks": pending_tasks,
        "overdue_tasks": overdue_tasks,
        "completion_rate": round(completion_rate, 1),
        "current_streak": recent_completed,  # Упрощенная версия streak
        "total_points": total_points,
        "achievements_count": len(user_achievements),
        "completed_goals": completed_goals
    }


def check_and_award_achievements(db: Session, user_id: int) -> List[UserAchievement]:
    """Проверить и присвоить новые достижения пользователю"""
    new_achievements = []
    stats = get_user_stats(db, user_id)
    
    # Получаем все достижения
    all_achievements = get_all_achievements(db)
    
    # Получаем уже полученные достижения
    earned_achievement_ids = {ua.achievement_id for ua in get_user_achievements(db, user_id)}
    
    for achievement in all_achievements:
        if achievement.id in earned_achievement_ids:
            continue
            
        should_award = False
        
        # Проверяем условия для каждого типа достижения
        if achievement.condition_type == "tasks_completed" and stats["completed_tasks"] >= achievement.condition_value:
            should_award = True
        elif achievement.condition_type == "tasks_created" and stats["total_tasks"] >= achievement.condition_value:
            should_award = True
        elif achievement.condition_type == "streak_days" and stats["current_streak"] >= achievement.condition_value:
            should_award = True
        elif achievement.condition_type == "goals_completed" and stats["completed_goals"] >= achievement.condition_value:
            should_award = True
            
        if should_award:
            new_achievement = award_achievement(db, user_id, achievement.id)
            new_achievements.append(new_achievement)
    
    return new_achievements 