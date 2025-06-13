import json
import logging
import base64
import httpx
from typing import Optional, Dict, Any
from cryptography.hazmat.primitives import serialization, hashes
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.backends import default_backend
from jwt import encode as jwt_encode
from datetime import datetime, timedelta, timezone
import os

from ..db.session import get_db
from ..db.models.user import User
from ..db.models.push_subscription import PushSubscription

logger = logging.getLogger(__name__)

class PushNotificationService:
    def __init__(self):
        self.vapid_private_key = os.getenv('VAPID_PRIVATE_KEY', '')
        self.vapid_public_key = os.getenv('VAPID_PUBLIC_KEY', '')
        self.vapid_subject = os.getenv('VAPID_SUBJECT', 'mailto:admin@example.com')
        
    async def send_notification(self, user_id: int, title: str, body: str, data: Optional[Dict[str, Any]] = None) -> bool:
        """Отправка push-уведомления пользователю"""
        try:
            logger.info(f"Отправка уведомления пользователю {user_id}: {title}")
            
            # Получаем подписку пользователя
            with next(get_db()) as db:
                subscription = db.query(PushSubscription).filter(
                    PushSubscription.user_id == user_id
                ).first()
                
                if not subscription:
                    logger.warning(f"Подписка для пользователя {user_id} не найдена")
                    return False
                
                logger.info(f"Найдена подписка для пользователя {user_id}: endpoint={subscription.endpoint[:50]}...")
                
                subscription_info = {
                    'endpoint': subscription.endpoint,
                    'keys': {
                        'p256dh': subscription.p256dh_key,
                        'auth': subscription.auth_key
                    }
                }
            
            # Подготавливаем payload
            payload = {
                'title': title,
                'body': body,
                'icon': '/icons/icon-192x192.png',
                'badge': '/icons/icon-72x72.png',
                'tag': 'notification',
                'requireInteraction': False,
                'data': data or {}
            }
            
            # Используем только pywebpush для всех типов уведомлений
            success = await self._send_via_pywebpush(subscription_info, payload)
            if success:
                logger.info("Уведомление успешно отправлено через pywebpush")
                return True
            
            logger.error("Не удалось отправить уведомление")
            return False
            
        except Exception as e:
            logger.error(f"Ошибка отправки уведомления: {e}", exc_info=True)
            return False

    async def _send_via_pywebpush(self, subscription_info: Dict, payload: Dict) -> bool:
        """Отправка через pywebpush"""
        try:
            from pywebpush import webpush, WebPushException
            
            logger.info("Попытка отправки через pywebpush")
            
            # Проверяем наличие VAPID ключей
            if not self.vapid_private_key or not self.vapid_public_key:
                logger.error("VAPID ключи не настроены")
                return False
            
            # Подготавливаем VAPID claims
            vapid_claims = {
                "sub": self.vapid_subject
            }
            
            # Отправляем уведомление
            response = webpush(
                subscription_info=subscription_info,
                data=json.dumps(payload),
                vapid_private_key=self.vapid_private_key,
                vapid_claims=vapid_claims
            )
            
            logger.info(f"pywebpush ответ: {response}")
            return True
            
        except WebPushException as e:
            logger.error(f"WebPushException: {e}", exc_info=True)
            return False
        except Exception as e:
            logger.error(f"Ошибка pywebpush отправки: {e}", exc_info=True)
            return False
    
    def _create_vapid_token(self, audience: str) -> Optional[str]:
        """Создание VAPID JWT токена"""
        try:
            if not self.vapid_private_key:
                logger.error("VAPID private key не задан")
                return None
            
            # Очищаем ключ от экранированных символов
            clean_key = self.vapid_private_key.replace('\\n', '\n')
            
            # Загружаем приватный ключ
            try:
                private_key = serialization.load_pem_private_key(
                    clean_key.encode(),
                    password=None,
                    backend=default_backend()
                )
            except Exception as e:
                logger.error(f"Ошибка загрузки VAPID ключа: {e}")
                return None
            
            # Создаем claims
            now = datetime.now(timezone.utc)
            claims = {
                'aud': audience,
                'exp': int((now + timedelta(hours=12)).timestamp()),
                'sub': self.vapid_subject
            }
            
            # Создаем JWT токен
            token = jwt_encode(
                claims,
                private_key,
                algorithm='ES256'
            )
            
            return token
            
        except Exception as e:
            logger.error(f"Ошибка создания VAPID токена: {e}", exc_info=True)
            return None
    
    async def send_test_notification(self, user_id: int) -> bool:
        """Отправка тестового уведомления"""
        return await self.send_notification(
            user_id=user_id,
            title="🧪 Тестовое уведомление",
            body="Система push-уведомлений работает корректно!",
            data={'test': True}
        )

# Singleton instance
push_service = PushNotificationService() 