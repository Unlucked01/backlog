from typing import List
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from ..db.models.task import Task, TaskStatus
from ..db.session import SessionLocal


class TaskStatusService:
    """Сервис для управления статусами задач"""
    
    @staticmethod
    def update_overdue_tasks() -> int:
        """
        Обновляет статусы просроченных задач.
        Возвращает количество обновленных задач.
        """
        db = SessionLocal()
        try:
            now = datetime.now(timezone.utc)
            
            # Находим задачи, которые просрочены, но еще не помечены как просроченные
            overdue_tasks = db.query(Task).filter(
                Task.deadline < now,
                Task.status.in_([TaskStatus.pending, TaskStatus.in_progress]),
                Task.is_overdue == False
            ).all()
            
            updated_count = 0
            for task in overdue_tasks:
                task.is_overdue = True
                task.status = TaskStatus.overdue
                updated_count += 1
            
            if updated_count > 0:
                db.commit()
                
            return updated_count
            
        except Exception as e:
            db.rollback()
            raise e
        finally:
            db.close()
    
    @staticmethod
    def get_overdue_tasks_by_user(db: Session, user_id: int) -> List[Task]:
        """Получить просроченные задачи пользователя"""
        return db.query(Task).filter(
            Task.user_id == user_id,
            Task.is_overdue == True,
            Task.status == TaskStatus.overdue
        ).all()
    
    @staticmethod
    def mark_task_as_completed(db: Session, task_id: int, user_id: int) -> bool:
        """Отметить задачу как выполненную"""
        task = db.query(Task).filter(
            Task.id == task_id,
            Task.user_id == user_id
        ).first()
        
        if not task:
            return False
            
        task.status = TaskStatus.completed
        task.completed_at = datetime.now(timezone.utc)
        task.is_overdue = False  # Сбрасываем флаг просрочки
        
        db.commit()
        return True 