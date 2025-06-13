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
            
            # Пробуем несколько методов отправки
            success = False
            
            # Метод 1: Прямой HTTP запрос к FCM
            if subscription_info['endpoint'].startswith('https://fcm.googleapis.com'):
                success = await self._send_via_fcm_http(subscription_info, payload)
                if success:
                    logger.info("Уведомление успешно отправлено через FCM HTTP")
                    return True
            
            # Метод 2: pywebpush (резервный)
            success = await self._send_via_pywebpush(subscription_info, payload)
            if success:
                logger.info("Уведомление успешно отправлено через pywebpush")
                return True
            
            logger.error("Все методы отправки уведомления не удались")
            return False
            
        except Exception as e:
            logger.error(f"Ошибка отправки уведомления: {e}", exc_info=True)
            return False
    
    async def _send_via_fcm_http(self, subscription_info: Dict, payload: Dict) -> bool:
        """Отправка через прямой HTTP запрос к FCM"""
        try:
            # Извлекаем FCM token из endpoint
            endpoint = subscription_info['endpoint']
            if not endpoint.startswith('https://fcm.googleapis.com/fcm/send/'):
                return False
                
            fcm_token = endpoint.replace('https://fcm.googleapis.com/fcm/send/', '')
            
            # Создаем VAPID токен
            vapid_token = self._create_vapid_token(endpoint)
            if not vapid_token:
                logger.error("Не удалось создать VAPID токен")
                return False
            
            # Подготавливаем headers
            headers = {
                'Authorization': f'vapid t={vapid_token}, k={self.vapid_public_key}',
                'Content-Type': 'application/json',
                'TTL': '86400'
            }
            
            # Подготавливаем FCM payload
            fcm_payload = {
                'to': fcm_token,
                'notification': {
                    'title': payload['title'],
                    'body': payload['body'],
                    'icon': payload['icon'],
                    'badge': payload['badge'],
                    'tag': payload['tag']
                },
                'data': payload.get('data', {})
            }
            
            # Отправляем запрос
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    'https://fcm.googleapis.com/fcm/send',
                    json=fcm_payload,
                    headers=headers,
                    timeout=30.0
                )
                
                if response.status_code == 200:
                    logger.info(f"FCM HTTP ответ: {response.status_code}")
                    return True
                else:
                    logger.error(f"FCM HTTP ошибка: {response.status_code}, {response.text}")
                    return False
                    
        except Exception as e:
            logger.error(f"Ошибка FCM HTTP отправки: {e}", exc_info=True)
            return False
    
    async def _send_via_pywebpush(self, subscription_info: Dict, payload: Dict) -> bool:
        """Отправка через pywebpush (резервный метод)"""
        try:
            from pywebpush import webpush, WebPushException
            
            logger.info("Попытка отправки через pywebpush")
            
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