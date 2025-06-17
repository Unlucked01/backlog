import json
import logging
import os
from typing import Optional, Dict, Any

from pywebpush import webpush, WebPushException
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
        try:
            logger.info(f"Отправка уведомления пользователю {user_id}: {title}")

            with next(get_db()) as db:
                subscription = db.query(PushSubscription).filter(
                    PushSubscription.user_id == user_id
                ).first()

                if not subscription:
                    logger.warning(f"Подписка для пользователя {user_id} не найдена")
                    return False

                subscription_info = {
                    'endpoint': subscription.endpoint,
                    'keys': {
                        'p256dh': subscription.p256dh_key,
                        'auth': subscription.auth_key
                    }
                }

            payload = {
                'title': title,
                'body': body,
                'icon': '/icons/icon-192x192.png',
                'badge': '/icons/icon-72x72.png',
                'tag': 'notification',
                'requireInteraction': False,
                'data': data or {}
            }

            response = webpush(
                subscription_info=subscription_info,
                data=json.dumps(payload),
                vapid_private_key=self.vapid_private_key,
                vapid_claims={
                    "sub": self.vapid_subject,
                    "aud": "https://fcm.googleapis.com"
                }
            )

            logger.info(f"pywebpush ответ: {response}")
            return True

        except WebPushException as e:
            logger.error(f"WebPushException: {e}", exc_info=True)
            return False
        except Exception as e:
            logger.error(f"Ошибка pywebpush отправки: {e}", exc_info=True)
            return False

    async def send_test_notification(self, user_id: int) -> bool:
        return await self.send_notification(
            user_id=user_id,
            title="🧪 Тестовое уведомление",
            body="Система push-уведомлений работает корректно!",
            data={'test': True}
        )

# Singleton
push_service = PushNotificationService()
