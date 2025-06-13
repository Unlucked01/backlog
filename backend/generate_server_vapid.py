#!/usr/bin/env python3
"""
Генерация VAPID ключей внутри backend контейнера
Запуск: docker exec backlog_backend python generate_server_vapid.py
"""

import sys
import os
import json

# Добавляем путь к приложению
sys.path.append('/app')

try:
    from pywebpush import webpush
    from cryptography.hazmat.primitives import serialization
    from cryptography.hazmat.primitives.asymmetric import ec
    import base64
    
    print("🔄 Генерация VAPID ключей на сервере...")
    
    # Генерируем приватный ключ
    private_key = ec.generate_private_key(ec.SECP256R1())
    
    # Приватный ключ в PEM формате
    private_pem = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption()
    ).decode('utf-8')
    
    # Публичный ключ в несжатом формате
    public_key = private_key.public_key()
    public_numbers = public_key.public_numbers()
    x_bytes = public_numbers.x.to_bytes(32, 'big')
    y_bytes = public_numbers.y.to_bytes(32, 'big')
    public_key_bytes = b'\x04' + x_bytes + y_bytes
    public_key_b64 = base64.urlsafe_b64encode(public_key_bytes).decode('ascii').rstrip('=')
    
    print("✅ VAPID ключи успешно сгенерированы на сервере!")
    print("=" * 70)
    print("ПРИВАТНЫЙ КЛЮЧ:")
    print(private_pem)
    print(f"ПУБЛИЧНЫЙ КЛЮЧ: {public_key_b64}")
    print("=" * 70)
    
    # Тестируем ключи с pywebpush
    print("\n🧪 Тестирование ключей с pywebpush...")
    try:
        # Создаем тестовую подписку
        test_subscription = {
            "endpoint": "https://fcm.googleapis.com/fcm/send/test",
            "keys": {
                "p256dh": "test",
                "auth": "test"
            }
        }
        
        # Пробуем создать webpush объект - НЕ отправляем, только проверяем формат
        from py_vapid import Vapid
        vapid = Vapid.from_string(private_key=private_pem)
        print("✅ Ключи совместимы с pywebpush!")
        
    except Exception as e:
        print(f"❌ Ошибка тестирования: {e}")
    
    # Сохраняем в файл для удобства
    keys_data = {
        "private_key": private_pem,
        "public_key": public_key_b64,
        "generated_on_server": True,
        "instructions": {
            "docker_compose": f"VAPID_PRIVATE_KEY={private_pem.replace(chr(10), '\\n')}",
            "frontend_env": f"NEXT_PUBLIC_VAPID_PUBLIC_KEY={public_key_b64}"
        }
    }
    
    with open('/app/vapid_keys.json', 'w') as f:
        json.dump(keys_data, f, indent=2)
    
    print(f"\n💾 Ключи сохранены в /app/vapid_keys.json")
    print(f"\n📝 Для обновления docker-compose.yml:")
    print(f"VAPID_PRIVATE_KEY={private_pem.replace(chr(10), '\\n')}")
    print(f"VAPID_PUBLIC_KEY={public_key_b64}")
    
except ImportError as e:
    print(f"❌ Ошибка импорта: {e}")
    print("Убедитесь что все зависимости установлены в контейнере")
except Exception as e:
    print(f"❌ Общая ошибка: {e}")
    import traceback
    traceback.print_exc() 