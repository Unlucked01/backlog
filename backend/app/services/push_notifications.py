import json
import logging
import base64
import httpx
import socket
import dns.resolver
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
        
        # Логируем статус VAPID ключей при инициализации
        logger.info(f"VAPID ключи: приватный={'✅ найден' if self.vapid_private_key else '❌ отсутствует'}, публичный={'✅ найден' if self.vapid_public_key else '❌ отсутствует'}")
        
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
            
            # Проверяем сетевое подключение
            network_ok = await self._check_network_connectivity()
            if not network_ok:
                logger.error("Сетевое подключение недоступно")
                return False
            
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
            
            # Пробуем только pywebpush (более надежный метод)
            success = await self._send_via_pywebpush(subscription_info, payload)
            if success:
                logger.info("Уведомление успешно отправлено через pywebpush")
                return True
            
            logger.error("Отправка уведомления не удалась")
            return False
            
        except Exception as e:
            logger.error(f"Ошибка отправки уведомления: {e}", exc_info=True)
            return False
    
    async def _check_network_connectivity(self) -> bool:
        """Проверяем сетевое подключение к внешним серверам"""
        try:
            # Проверяем DNS разрешение
            try:
                dns.resolver.resolve('google.com', 'A')
                logger.info("✅ DNS разрешение работает")
            except Exception as e:
                logger.error(f"❌ DNS разрешение не работает: {e}")
                return False
            
            # Проверяем HTTP подключение
            async with httpx.AsyncClient(timeout=10.0) as client:
                try:
                    response = await client.get('https://httpbin.org/get')
                    if response.status_code == 200:
                        logger.info("✅ HTTP подключение к внешним серверам работает")
                        return True
                    else:
                        logger.error(f"❌ HTTP подключение вернуло статус: {response.status_code}")
                        return False
                except Exception as e:
                    logger.error(f"❌ HTTP подключение не работает: {e}")
                    return False
                    
        except Exception as e:
            logger.error(f"❌ Ошибка проверки сетевого подключения: {e}")
            return False
    
    async def _send_via_pywebpush(self, subscription_info: Dict, payload: Dict) -> bool:
        """Отправка через pywebpush (основной метод)"""
        try:
            from pywebpush import webpush, WebPushException
            
            logger.info("Попытка отправки через pywebpush")
            logger.info(f"Endpoint: {subscription_info['endpoint'][:50]}...")
            logger.info(f"VAPID subject: {self.vapid_subject}")
            
            # Проверяем формат приватного ключа
            if not self.vapid_private_key.startswith('-----BEGIN PRIVATE KEY-----'):
                logger.error("❌ VAPID приватный ключ не в PEM формате")
                return False
            
            # Подготавливаем VAPID claims
            vapid_claims = {
                "sub": self.vapid_subject
            }
            
            logger.info(f"Отправляем payload: {json.dumps(payload, ensure_ascii=False)[:100]}...")
            
            # Отправляем уведомление
            response = webpush(
                subscription_info=subscription_info,
                data=json.dumps(payload),
                vapid_private_key=self.vapid_private_key,
                vapid_claims=vapid_claims,
                timeout=30
            )
            
            logger.info(f"✅ pywebpush ответ: {response}")
            return True
            
        except WebPushException as e:
            logger.error(f"❌ WebPushException: {e}", exc_info=True)
            
            # Подробная диагностика ошибок WebPush
            if hasattr(e, 'response') and e.response:
                logger.error(f"WebPush response status: {e.response.status_code}")
                logger.error(f"WebPush response text: {e.response.text}")
            
            return False
        except Exception as e:
            logger.error(f"❌ Ошибка pywebpush отправки: {e}", exc_info=True)
            
            # Проверяем конкретные типы ошибок
            error_str = str(e)
            if "Could not deserialize key data" in error_str:
                logger.error("🔑 Проблема с форматом VAPID ключей - проверьте их корректность")
            elif "header too long" in error_str:
                logger.error("📏 Проблема с длиной заголовка VAPID ключа")
            elif "Connection" in error_str:
                logger.error("🌐 Сетевая проблема - проверьте интернет-соединение")
            
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
                logger.info("✅ VAPID приватный ключ успешно загружен")
            except Exception as e:
                logger.error(f"❌ Ошибка загрузки VAPID ключа: {e}")
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
            
            logger.info("✅ VAPID токен успешно создан")
            return token
            
        except Exception as e:
            logger.error(f"❌ Ошибка создания VAPID токена: {e}", exc_info=True)
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