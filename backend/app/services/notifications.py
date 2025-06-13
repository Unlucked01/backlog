import logging
from typing import Optional, Dict, Any
from datetime import datetime, timezone

from ..db.session import get_db
from ..db.models.user import User
from ..db.models.push_subscription import PushSubscription
from .push_notifications import push_service

logger = logging.getLogger(__name__)

class NotificationService:
    def __init__(self):
        self.push_service = push_service
    
    async def send_test_notification(self, user_id: int) -> bool:
        """Отправка тестового push-уведомления"""
        try:
            logger.info(f"Отправка тестового уведомления пользователю {user_id}")
            
            # Используем новый сервис push-уведомлений
            success = await self.push_service.send_test_notification(user_id)
            
            if success:
                logger.info(f"Тестовое уведомление успешно отправлено пользователю {user_id}")
            else:
                logger.error(f"Не удалось отправить тестовое уведомление пользователю {user_id}")
            
            return success
            
        except Exception as e:
            logger.error(f"Ошибка отправки тестового уведомления: {e}", exc_info=True)
            return False
    
    async def send_push_notification(self, user_id: int, title: str, body: str, data: Optional[Dict[str, Any]] = None) -> bool:
        """Отправка push-уведомления пользователю"""
        try:
            logger.info(f"Отправка уведомления пользователю {user_id}: {title}")
            
            success = await self.push_service.send_notification(
                user_id=user_id,
                title=title,
                body=body,
                data=data
            )
            
            if success:
                logger.info(f"Уведомление успешно отправлено пользователю {user_id}")
            else:
                logger.error(f"Не удалось отправить уведомление пользователю {user_id}")
            
            return success
            
        except Exception as e:
            logger.error(f"Ошибка отправки уведомления: {e}", exc_info=True)
            return False
    
    async def send_deadline_notification(self, user_id: int, task_title: str, deadline: datetime) -> bool:
        """Отправка уведомления о приближающемся дедлайне"""
        try:
            # Форматируем дату для отображения
            deadline_str = deadline.strftime("%d.%m.%Y %H:%M")
            
            title = "⏰ Приближается дедлайн!"
            body = f"Задача '{task_title}' должна быть выполнена до {deadline_str}"
            
            data = {
                'type': 'deadline',
                'task_title': task_title,
                'deadline': deadline.isoformat(),
                'url': '/tasks'
            }
            
            return await self.send_push_notification(user_id, title, body, data)
            
        except Exception as e:
            logger.error(f"Ошибка отправки уведомления о дедлайне: {e}", exc_info=True)
            return False
    
    async def send_daily_summary(self, user_id: int, tasks_count: int, completed_count: int) -> bool:
        """Отправка ежедневной сводки"""
        try:
            title = "📊 Ежедневная сводка"
            body = f"Сегодня у вас {tasks_count} задач, выполнено: {completed_count}"
            
            data = {
                'type': 'daily_summary',
                'tasks_count': tasks_count,
                'completed_count': completed_count,
                'url': '/dashboard'
            }
            
            return await self.send_push_notification(user_id, title, body, data)
            
        except Exception as e:
            logger.error(f"Ошибка отправки ежедневной сводки: {e}", exc_info=True)
            return False
    
    async def send_achievement_notification(self, user_id: int, achievement_name: str) -> bool:
        """Отправка уведомления о достижении"""
        try:
            title = "🏆 Новое достижение!"
            body = f"Поздравляем! Вы получили достижение: {achievement_name}"
            
            data = {
                'type': 'achievement',
                'achievement_name': achievement_name,
                'url': '/achievements'
            }
            
            return await self.send_push_notification(user_id, title, body, data)
            
        except Exception as e:
            logger.error(f"Ошибка отправки уведомления о достижении: {e}", exc_info=True)
            return False

# Singleton instance
notification_service = NotificationService() 