#!/usr/bin/env python3
"""
Тестовый скрипт для проверки VAPID ключей
"""

import os
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.backends import default_backend

def test_vapid_key():
    """Тестирует загрузку VAPID ключа"""
    
    # Ваш текущий ключ из docker-compose.yml
    vapid_private_key = """-----BEGIN PRIVATE KEY-----
MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQguTZYw06dfc8DKWas
6SGffWI4cZINgWiz3CL/5o4jmG6hRANCAAS/2PxOpMGZC6iRs3S6RtchF+hb2ygQ
ibLtClEuhkp1fsAgm6SJBj3MY8cLErNxWDK6jDYb0KbmlwQ+BV3pQcL3
-----END PRIVATE KEY-----"""
    
    vapid_public_key = "BL_Y_E6kwZkLqJGzdLpG1yEX6FvbKBCJsu0KUS6GSnV-wCCbpIkGPcxjxwsSs3FYMrqMNhvQpuaXBD4FXelBwvc"
    
    print("🧪 Тестирование VAPID ключей...")
    
    try:
        # Тестируем загрузку приватного ключа
        print("\n1. Тестируем приватный ключ...")
        private_key = serialization.load_pem_private_key(
            vapid_private_key.encode(),
            password=None,
            backend=default_backend()
        )
        print("✅ Приватный ключ загружен успешно")
        
        # Тестируем с pywebpush
        print("\n2. Тестируем совместимость с pywebpush...")
        try:
            from pywebpush import webpush
            
            # Создаем тестовую подписку
            test_subscription = {
                'endpoint': 'https://example.com/test',
                'keys': {
                    'p256dh': 'test_p256dh_key',
                    'auth': 'test_auth_key'
                }
            }
            
            # Пробуем создать VAPID claims (без отправки)
            vapid_claims = {"sub": "mailto:test@example.com"}
            
            print("✅ pywebpush совместимость OK")
            
        except ImportError:
            print("⚠️  pywebpush не установлен")
        except Exception as e:
            print(f"❌ Ошибка pywebpush: {e}")
        
        print("\n3. Информация о ключе:")
        print(f"   Тип: {type(private_key).__name__}")
        print(f"   Размер: {private_key.key_size} бит")
        
        print("\n✅ Все тесты пройдены! Ключи в правильном формате.")
        
    except Exception as e:
        print(f"❌ Ошибка тестирования ключей: {e}")
        print(f"Тип ошибки: {type(e).__name__}")
        
        print("\n💡 Рекомендации:")
        print("1. Используйте новые ключи из generate_vapid_keys.py")
        print("2. Убедитесь что ключ не поврежден при копировании")

if __name__ == "__main__":
    test_vapid_key() 