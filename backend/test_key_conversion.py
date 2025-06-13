#!/usr/bin/env python3
"""
Тестовый скрипт для проверки конвертации VAPID ключей
"""

import base64
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.backends import default_backend

def test_key_conversion():
    """Тестирует конвертацию PEM ключа в формат pywebpush"""
    
    # Ваш текущий PEM ключ
    pem_key = """-----BEGIN PRIVATE KEY-----
MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQguTZYw06dfc8DKWas
6SGffWI4cZINgWiz3CL/5o4jmG6hRANCAAS/2PxOpMGZC6iRs3S6RtchF+hb2ygQ
ibLtClEuhkp1fsAgm6SJBj3MY8cLErNxWDK6jDYb0KbmlwQ+BV3pQcL3
-----END PRIVATE KEY-----"""
    
    print("🔄 Тестирование конвертации VAPID ключа...")
    
    try:
        # 1. Загружаем PEM ключ
        print("\n1. Загружаем PEM ключ...")
        private_key = serialization.load_pem_private_key(
            pem_key.encode(),
            password=None,
            backend=default_backend()
        )
        print("✅ PEM ключ загружен успешно")
        
        # 2. Конвертируем в DER
        print("\n2. Конвертируем в DER формат...")
        der_key = private_key.private_bytes(
            encoding=serialization.Encoding.DER,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=serialization.NoEncryption()
        )
        print(f"✅ DER ключ создан, размер: {len(der_key)} байт")
        
        # 3. Кодируем в base64url
        print("\n3. Кодируем в base64url...")
        base64url_key = base64.urlsafe_b64encode(der_key).decode('utf-8').rstrip('=')
        print(f"✅ Base64url ключ создан, длина: {len(base64url_key)} символов")
        
        # 4. Тестируем с pywebpush
        print("\n4. Тестируем с pywebpush...")
        try:
            from pywebpush import webpush
            from py_vapid import Vapid
            
            # Пробуем загрузить через py_vapid
            vapid = Vapid.from_string(private_key=base64url_key)
            print("✅ Ключ совместим с pywebpush")
            
            print(f"\n📋 Конвертированный ключ для pywebpush:")
            print(f"{base64url_key}")
            
        except ImportError:
            print("⚠️  pywebpush не установлен")
        except Exception as e:
            print(f"❌ Ошибка pywebpush: {e}")
            
        print("\n✅ Конвертация завершена успешно!")
        
        return base64url_key
        
    except Exception as e:
        print(f"❌ Ошибка конвертации: {e}")
        return None

if __name__ == "__main__":
    test_key_conversion() 