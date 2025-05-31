import asyncio
import logging
from datetime import datetime, timedelta
from typing import List
from sqlalchemy.orm import Session

from ..db.session import SessionLocal
from ..db.models.task import Task
from ..db.models.user import User
from .notifications import NotificationService

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
    def check_deadline_reminders():
        """Проверяет и отправляет напоминания о дедлайнах"""
        db = BackgroundTaskService.get_db()
        try:
            now = datetime.now()
            
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
            
            # Отправляем напоминания
            for task in tasks_tomorrow:
                if NotificationService.send_deadline_reminder(
                    db, task.user_id, task.title, task.deadline, task.id
                ):
                    sent_count += 1
            
            for task in tasks_one_hour:
                if NotificationService.send_deadline_reminder(
                    db, task.user_id, task.title, task.deadline, task.id
                ):
                    sent_count += 1
            
            for task in tasks_thirty_min:
                if NotificationService.send_deadline_reminder(
                    db, task.user_id, task.title, task.deadline, task.id
                ):
                    sent_count += 1
            
            logger.info(f"Отправлено {sent_count} напоминаний о дедлайнах")
            
        except Exception as e:
            logger.error(f"Ошибка при отправке напоминаний о дедлайнах: {e}")
        finally:
            db.close()
    
    @staticmethod
    def check_overdue_tasks():
        """Проверяет и отправляет уведомления о просроченных задачах"""
        db = BackgroundTaskService.get_db()
        try:
            now = datetime.now()
            
            # Задачи просроченные на 1 день или более
            overdue_tasks = db.query(Task).filter(
                Task.deadline < now,
                Task.status != 'completed'
            ).all()
            
            sent_count = 0
            
            for task in overdue_tasks:
                days_overdue = (now - task.deadline).days
                if days_overdue > 0:  # Только если прошел минимум 1 день
                    if NotificationService.send_overdue_reminder(
                        db, task.user_id, task.title, days_overdue, task.id
                    ):
                        sent_count += 1
            
            logger.info(f"Отправлено {sent_count} напоминаний о просроченных задачах")
            
        except Exception as e:
            logger.error(f"Ошибка при отправке напоминаний о просроченных задачах: {e}")
        finally:
            db.close()
    
    @staticmethod
    def send_daily_summaries():
        """Отправляет ежедневные сводки пользователям"""
        db = BackgroundTaskService.get_db()
        try:
            # Получаем всех активных пользователей с push-подписками
            users = db.query(User).filter(
                User.is_active == True,
                User.push_subscription.is_not(None)
            ).all()
            
            sent_count = 0
            
            for user in users:
                # Получаем статистику задач пользователя
                now = datetime.now()
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
                
                if NotificationService.send_daily_summary(
                    db, user.id, total_tasks, completed_tasks, overdue_tasks
                ):
                    sent_count += 1
            
            logger.info(f"Отправлено {sent_count} ежедневных сводок")
            
        except Exception as e:
            logger.error(f"Ошибка при отправке ежедневных сводок: {e}")
        finally:
            db.close()
    
    @staticmethod
    async def start_background_scheduler():
        """Запускает планировщик фоновых задач"""
        logger.info("Запуск планировщика фоновых задач")
        
        while True:
            try:
                # Проверяем напоминания о дедлайнах каждые 15 минут
                BackgroundTaskService.check_deadline_reminders()
                
                # Проверяем просроченные задачи каждый час
                current_minute = datetime.now().minute
                if current_minute == 0:  # Каждый час в :00
                    BackgroundTaskService.check_overdue_tasks()
                
                # Отправляем ежедневные сводки в 9:00
                current_time = datetime.now().time()
                if current_time.hour == 9 and current_time.minute == 0:
                    BackgroundTaskService.send_daily_summaries()
                
                # Ждем 15 минут до следующей проверки
                await asyncio.sleep(15 * 60)
                
            except Exception as e:
                logger.error(f"Ошибка в планировщике фоновых задач: {e}")
                await asyncio.sleep(60)  # При ошибке ждем 1 минуту 