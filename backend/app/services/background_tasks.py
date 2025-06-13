import asyncio
import logging
from datetime import datetime, timedelta, timezone
from typing import List
from sqlalchemy.orm import Session

from ..db.session import SessionLocal
from ..db.models.task import Task
from ..db.models.user import User
from .notifications import notification_service
from .task_status import TaskStatusService

logger = logging.getLogger(__name__)


class BackgroundTaskService:
    
    @staticmethod
    def get_db():
        """Получить сессию базы данных для фоновых задач"""
        db = SessionLocal()
        try:
            return db
        finally:
            pass  # Не закрываем здесь, закроем в finally каждой задачи
    
    @staticmethod
    async def check_deadline_reminders():
        """Проверяет и отправляет напоминания о дедлайнах"""
        db = BackgroundTaskService.get_db()
        try:
            # Используем UTC для всех операций со временем
            now = datetime.now(timezone.utc)
            
            # Напоминания за 1 день
            tomorrow = now + timedelta(days=1)
            tasks_tomorrow = db.query(Task).filter(
                Task.deadline <= tomorrow,
                Task.deadline > now,
                Task.status != 'completed'
            ).all()
            
            # Напоминания за 1 час
            one_hour_later = now + timedelta(hours=1)
            tasks_one_hour = db.query(Task).filter(
                Task.deadline <= one_hour_later,
                Task.deadline > now,
                Task.status != 'completed'
            ).all()
            
            # Напоминания за 30 минут
            thirty_min_later = now + timedelta(minutes=30)
            tasks_thirty_min = db.query(Task).filter(
                Task.deadline <= thirty_min_later,
                Task.deadline > now,
                Task.status != 'completed'
            ).all()
            
            sent_count = 0
            
            # Собираем все задачи в один список, чтобы избежать дублирования
            tasks_to_notify = list(set(tasks_tomorrow + tasks_one_hour + tasks_thirty_min))

            # Отправляем напоминания
            for task in tasks_to_notify:
                try:
                    success = await notification_service.send_deadline_notification(
                        task.user_id, task.title, task.deadline
                    )
                    if success:
                        sent_count += 1
                except Exception as e:
                    logger.error(f"Ошибка отправки напоминания о дедлайне для задачи {task.id}: {e}")
            
            if sent_count > 0:
                logger.info(f"Отправлено {sent_count} напоминаний о дедлайнах")
            
        except Exception as e:
            logger.error(f"Ошибка при отправке напоминаний о дедлайнах: {e}", exc_info=True)
        finally:
            db.close()
    
    @staticmethod
    async def check_overdue_tasks():
        """Проверяет и отправляет уведомления о просроченных задачах"""
        db = BackgroundTaskService.get_db()
        try:
            now = datetime.now(timezone.utc)
            
            # Задачи просроченные на 1 день или более
            overdue_tasks = db.query(Task).filter(
                Task.deadline < now,
                Task.status != 'completed'
            ).all()
            
            sent_count = 0
            
            for task in overdue_tasks:
                # Убедимся, что у дедлайна есть таймзона
                deadline = task.deadline
                if deadline.tzinfo is None:
                    deadline = deadline.replace(tzinfo=timezone.utc)

                days_overdue = (now - deadline).days
                if days_overdue > 0:  # Только если прошел минимум 1 день
                    try:
                        # Отправляем уведомление о просроченной задаче
                        title = f"⚠️ Задача просрочена на {days_overdue} дн."
                        body = f"{task.title} - проверьте статус выполнения"
                        data = {'type': 'overdue', 'task_id': task.id, 'days_overdue': days_overdue}
                        
                        success = await notification_service.send_push_notification(
                            task.user_id, title, body, data
                        )
                        if success:
                            sent_count += 1
                    except Exception as e:
                        logger.error(f"Ошибка отправки уведомления о просрочке для задачи {task.id}: {e}")
            
            if sent_count > 0:
                logger.info(f"Отправлено {sent_count} напоминаний о просроченных задачах")
            
        except Exception as e:
            logger.error(f"Ошибка при отправке напоминаний о просроченных задачах: {e}", exc_info=True)
        finally:
            db.close()
    
    @staticmethod
    async def send_daily_summaries():
        """Отправляет ежедневные сводки пользователям"""
        db = BackgroundTaskService.get_db()
        try:
            # Получаем всех активных пользователей с push-подписками
            users = db.query(User).filter(
                User.is_active == True,
                User.push_subscription != None
            ).all()
            
            sent_count = 0
            
            for user in users:
                # Получаем статистику задач пользователя
                now = datetime.now(timezone.utc)
                today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
                today_end = today_start + timedelta(days=1)
                
                total_tasks = db.query(Task).filter(
                    Task.user_id == user.id,
                    Task.deadline >= today_start,
                    Task.deadline < today_end
                ).count()
                
                completed_tasks = db.query(Task).filter(
                    Task.user_id == user.id,
                    Task.deadline >= today_start,
                    Task.deadline < today_end,
                    Task.status == 'completed'
                ).count()
                
                overdue_tasks = db.query(Task).filter(
                    Task.user_id == user.id,
                    Task.deadline < now,
                    Task.status != 'completed'
                ).count()
                
                try:
                    success = await notification_service.send_daily_summary(
                        user.id, total_tasks, completed_tasks
                    )
                    if success:
                        sent_count += 1
                except Exception as e:
                    logger.error(f"Ошибка отправки ежедневной сводки для пользователя {user.id}: {e}")
            
            if sent_count > 0:
                logger.info(f"Отправлено {sent_count} ежедневных сводок")
            
        except Exception as e:
            logger.error(f"Ошибка при отправке ежедневных сводок: {e}", exc_info=True)
        finally:
            db.close()
    
    @staticmethod
    async def start_background_scheduler():
        """Запускает планировщик фоновых задач"""
        logger.info("Запуск планировщика фоновых задач")
        
        while True:
            try:
                # Обновляем статусы просроченных задач каждые 15 минут
                updated_count = TaskStatusService.update_overdue_tasks()
                if updated_count > 0:
                    logger.info(f"Обновлено статусов просрочки: {updated_count}")
                
                # Проверяем напоминания о дедлайнах каждые 15 минут
                await BackgroundTaskService.check_deadline_reminders()
                
                # Проверяем просроченные задачи каждый час
                current_minute = datetime.now(timezone.utc).minute
                if current_minute == 0:  # Каждый час в :00
                    await BackgroundTaskService.check_overdue_tasks()
                
                # Отправляем ежедневные сводки в 9:00 UTC
                current_time = datetime.now(timezone.utc).time()
                if current_time.hour == 9 and current_time.minute == 0:
                    await BackgroundTaskService.send_daily_summaries()
                
                # Ждем 1 минуту до следующей проверки
                await asyncio.sleep(60)
                
            except Exception as e:
                logger.error(f"Ошибка в планировщике фоновых задач: {e}", exc_info=True)
                await asyncio.sleep(60)  # При ошибке ждем 1 минуту 