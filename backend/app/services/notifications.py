import json
import logging
import base64
from datetime import datetime, timedelta, timezone
from typing import List, Optional
from pywebpush import webpush, WebPushException
from sqlalchemy.orm import Session
from cryptography.hazmat.primitives import serialization

from ..core.config import settings
from ..schemas.user import PushNotification
from ..crud import user as crud_user

logger = logging.getLogger(__name__)


class NotificationService:
    
    @staticmethod
    def send_push_notification(
        subscription_info: dict,
        notification_data: PushNotification
    ) -> bool:
        """Отправляет push-уведомление пользователю"""
        if not settings.VAPID_PRIVATE_KEY or not settings.VAPID_PUBLIC_KEY:
            logger.error("VAPID ключи не настроены")
            return False
        
        try:
            payload = {
                "title": notification_data.title,
                "body": notification_data.body,
                "icon": notification_data.icon or "/icon-192x192.png",
                "badge": "/icon-72x72.png",
                "url": notification_data.url or "/",
                "tag": notification_data.tag or "general",
                "timestamp": int(datetime.now().timestamp() * 1000),
                "requireInteraction": True,
                "actions": [
                    {
                        "action": "view",
                        "title": "Просмотреть"
                    },
                    {
                        "action": "dismiss", 
                        "title": "Скрыть"
                    }
                ]
            }
            
            # Новый подход: используем ключи без декодирования
            vapid_private_key = settings.VAPID_PRIVATE_KEY
            
            # Логируем информацию о ключе для диагностики
            logger.info(f"VAPID private key type: {type(vapid_private_key)}")
            logger.info(f"VAPID private key length: {len(vapid_private_key)}")
            logger.info(f"VAPID private key starts with: {vapid_private_key[:50]}...")
            
            # ИСПРАВЛЕНИЕ: заменяем экранированные \n на реальные переносы строк
            if '\\n' in vapid_private_key:
                vapid_private_key = vapid_private_key.replace('\\n', '\n')
                logger.info("Заменили экранированные \\n на реальные переносы строк")
                logger.info(f"Обновленный ключ starts with: {repr(vapid_private_key[:50])}")
            
            # Попытка 4: Использование объекта ключа через cryptography
            try:
                logger.info("Попытка 4: Создание объекта ключа через cryptography")
                
                # Создаем объект приватного ключа
                private_key_obj = serialization.load_pem_private_key(
                    vapid_private_key.encode('utf-8'),
                    password=None
                )
                
                # Пытаемся передать объект ключа
                webpush(
                    subscription_info=subscription_info,
                    data=json.dumps(payload),
                    vapid_private_key=private_key_obj,
                    vapid_claims={
                        "sub": settings.VAPID_SUBJECT
                    }
                )
                logger.info("✅ Успешно отправлено с объектом ключа!")
                return True
                
            except Exception as e4:
                logger.error(f"Попытка 4 неудачна: {e4}")
            
            # Пробуем разные варианты передачи ключа
            try:
                logger.info("Попытка 1: Использование ключа как есть")
                webpush(
                    subscription_info=subscription_info,
                    data=json.dumps(payload),
                    vapid_private_key=vapid_private_key,
                    vapid_claims={
                        "sub": settings.VAPID_SUBJECT
                    }
                )
                logger.info("Успешно отправлено с ключом как есть")
                return True
                
            except Exception as e1:
                logger.error(f"Попытка 1 неудачна: {e1}")
                
                # Попытка 2: декодирование base64 если ключ закодирован
                try:
                    logger.info("Попытка 2: Декодирование base64")
                    if not vapid_private_key.startswith('-----BEGIN'):
                        # Добавляем padding если нужен
                        padding = 4 - (len(vapid_private_key) % 4)
                        if padding != 4:
                            vapid_private_key += '=' * padding
                        
                        decoded_key = base64.urlsafe_b64decode(vapid_private_key.encode('utf-8'))
                        vapid_private_key = decoded_key.decode('utf-8')
                        logger.info(f"Декодированный ключ: {vapid_private_key[:100]}...")
                    
                    webpush(
                        subscription_info=subscription_info,
                        data=json.dumps(payload),
                        vapid_private_key=vapid_private_key,
                        vapid_claims={
                            "sub": settings.VAPID_SUBJECT
                        }
                    )
                    logger.info("Успешно отправлено с декодированным ключом")
                    return True
                    
                except Exception as e2:
                    logger.error(f"Попытка 2 неудачна: {e2}")
                    
                    # Попытка 3: альтернативный формат
                    try:
                        logger.info("Попытка 3: Использование только PEM части")
                        # Если ключ содержит extra символы, берем только PEM часть
                        if '-----BEGIN PRIVATE KEY-----' in vapid_private_key:
                            start = vapid_private_key.find('-----BEGIN PRIVATE KEY-----')
                            end = vapid_private_key.find('-----END PRIVATE KEY-----') + len('-----END PRIVATE KEY-----')
                            clean_key = vapid_private_key[start:end]
                            logger.info(f"Очищенный ключ: {clean_key}")
                            
                            webpush(
                                subscription_info=subscription_info,
                                data=json.dumps(payload),
                                vapid_private_key=clean_key,
                                vapid_claims={
                                    "sub": settings.VAPID_SUBJECT
                                }
                            )
                            logger.info("Успешно отправлено с очищенным ключом")
                            return True
                    except Exception as e3:
                        logger.error(f"Попытка 3 неудачна: {e3}")
                        
            return False
            
        except WebPushException as e:
            logger.error(f"Ошибка отправки push-уведомления: {e}")
            return False
        except Exception as e:
            logger.error(f"Неожиданная ошибка при отправке уведомления: {e}")
            return False
    
    @staticmethod
    def send_notification_to_user(
        db: Session,
        user_id: int,
        notification: PushNotification
    ) -> bool:
        """Отправляет уведомление конкретному пользователю"""
        logger.info(f"Отправка уведомления пользователю {user_id}: {notification.title}")
        
        user = crud_user.get_user(db, user_id)
        push_subscription = crud_user.get_push_subscription(db, user_id)
        
        if not user:
            logger.error(f"Пользователь {user_id} не найден")
            return False
            
        if not push_subscription:
            logger.error(f"Push-подписка для пользователя {user_id} не найдена")
            return False
        
        logger.info(f"Найдена подписка для пользователя {user_id}: endpoint={push_subscription.endpoint[:50]}...")
        
        try:
            subscription_info = {
                "endpoint": push_subscription.endpoint,
                "keys": {
                    "p256dh": push_subscription.p256dh_key,
                    "auth": push_subscription.auth_key
                }
            }
            result = NotificationService.send_push_notification(
                subscription_info, notification
            )
            logger.info(f"Результат отправки уведомления пользователю {user_id}: {result}")
            return result
        except Exception as e:
            logger.error(f"Ошибка формирования данных подписки для пользователя {user_id}: {e}")
            return False
    
    @staticmethod
    def send_deadline_reminder(
        db: Session,
        user_id: int,
        task_title: str,
        deadline: datetime,
        task_id: int
    ) -> bool:
        """Отправляет напоминание о дедлайне"""
        # Вычисляем сколько времени осталось, используя UTC
        if deadline.tzinfo is None:
            # Если у дедлайна нет таймзоны, считаем его как UTC
            deadline = deadline.replace(tzinfo=timezone.utc)
            
        time_left = deadline - datetime.now(timezone.utc)
        
        if time_left.total_seconds() <= 0:
            time_text = "уже наступил!"
        elif time_left.days > 0:
            time_text = f"через {time_left.days} дн."
        elif time_left.seconds > 3600:
            hours = time_left.seconds // 3600
            time_text = f"через {hours} ч."
        elif time_left.seconds > 60:
            minutes = time_left.seconds // 60
            time_text = f"через {minutes} мин."
        else:
            time_text = "прямо сейчас!"
        
        notification = PushNotification(
            title=f"📅 Дедлайн {time_text}",
            body=f"Задача: {task_title}",
            icon="/icon-192x192.png",
            url=f"/tasks/{task_id}",
            tag=f"deadline-{task_id}"
        )
        
        return NotificationService.send_notification_to_user(
            db, user_id, notification
        )
    
    @staticmethod
    def send_overdue_reminder(
        db: Session,
        user_id: int,
        task_title: str,
        days_overdue: int,
        task_id: int
    ) -> bool:
        """Отправляет уведомление о просроченной задаче"""
        notification = PushNotification(
            title=f"⚠️ Задача просрочена на {days_overdue} дн.",
            body=f"{task_title} - проверьте статус выполнения",
            icon="/icon-192x192.png",
            url=f"/tasks/{task_id}",
            tag=f"overdue-{task_id}"
        )
        
        return NotificationService.send_notification_to_user(
            db, user_id, notification
        )
    
    @staticmethod
    def send_achievement_notification(
        db: Session,
        user_id: int,
        achievement_title: str,
        achievement_description: str
    ) -> bool:
        """Отправляет уведомление о достижении"""
        notification = PushNotification(
            title=f"🏆 Новое достижение!",
            body=f"{achievement_title}: {achievement_description}",
            icon="/icon-192x192.png",
            url="/profile",
            tag="achievement"
        )
        
        return NotificationService.send_notification_to_user(
            db, user_id, notification
        )
    
    @staticmethod
    def send_daily_summary(
        db: Session,
        user_id: int,
        total_tasks: int,
        completed_tasks: int,
        overdue_tasks: int
    ) -> bool:
        """Отправляет ежедневную сводку"""
        if total_tasks == 0:
            body = "У вас нет задач на сегодня. Отличный день для отдыха! 😎"
        elif completed_tasks == total_tasks:
            body = f"Все {total_tasks} задач выполнены! Превосходно! 🎉"
        elif overdue_tasks > 0:
            body = f"Выполнено {completed_tasks}/{total_tasks}, просрочено: {overdue_tasks}"
        else:
            body = f"Выполнено {completed_tasks}/{total_tasks} задач. Продолжайте! 💪"
        
        notification = PushNotification(
            title="📊 Ежедневная сводка",
            body=body,
            icon="/icon-192x192.png",
            url="/",
            tag="daily-summary"
        )
        
        return NotificationService.send_notification_to_user(
            db, user_id, notification
        )
    
    @staticmethod
    def send_welcome_notification(
        db: Session,
        user_id: int,
        user_name: str
    ) -> bool:
        """Отправляет приветственное уведомление"""
        notification = PushNotification(
            title=f"👋 Добро пожаловать, {user_name}!",
            body="Ваш планировщик готов к работе. Создайте первую задачу!",
            icon="/icon-192x192.png",
            url="/tasks/new",
            tag="welcome"
        )
        
        return NotificationService.send_notification_to_user(
            db, user_id, notification
        ) 