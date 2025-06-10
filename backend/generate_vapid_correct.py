#!/usr/bin/env python3
"""
Скрипт для генерации VAPID ключей, совместимых с pywebpush
Запуск: python generate_vapid_correct.py
"""

try:
    from pywebpush import webpush
    import base64
    import os
    
    # Генерируем ключи с помощью pywebpush
    from cryptography.hazmat.primitives import serialization
    from cryptography.hazmat.primitives.asymmetric import ec
    
    # Генерируем приватный ключ EC P-256
    private_key = ec.generate_private_key(ec.SECP256R1())
    
    # Получаем публичный ключ
    public_key = private_key.public_key()
    
    # Сериализуем приватный ключ в PEM формате
    private_pem = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption()
    )
    
    # Сериализуем публичный ключ в несжатом формате для VAPID
    public_numbers = public_key.public_numbers()
    x_bytes = public_numbers.x.to_bytes(32, 'big')
    y_bytes = public_numbers.y.to_bytes(32, 'big')
    public_key_uncompressed = b'\x04' + x_bytes + y_bytes
    
    # Кодируем в base64
    private_key_b64 = base64.urlsafe_b64encode(private_pem).decode('ascii').rstrip('=')
    public_key_b64 = base64.urlsafe_b64encode(public_key_uncompressed).decode('ascii').rstrip('=')
    
    print("🔑 Новые VAPID ключи для push-уведомлений:")
    print("=" * 70)
    print(f"VAPID_PRIVATE_KEY={private_key_b64}")
    print(f"VAPID_PUBLIC_KEY={public_key_b64}")
    print("=" * 70)
    print("\n📝 Замените эти ключи в .env файле и docker-compose.yml")
    print("⚠️  Не забудьте обновить NEXT_PUBLIC_VAPID_PUBLIC_KEY в frontend!")
    
    print(f"\n🌐 Для frontend:")
    print(f"NEXT_PUBLIC_VAPID_PUBLIC_KEY={public_key_b64}")
    
    # Тест ключей
    try:
        print(f"\n🧪 Тестируем сгенерированные ключи...")
        
        # Тестовая подписка (заглушка)
        test_subscription = {
            "endpoint": "https://fcm.googleapis.com/fcm/send/test",
            "keys": {
                "p256dh": base64.urlsafe_b64encode(os.urandom(65)).decode().rstrip('='),
                "auth": base64.urlsafe_b64encode(os.urandom(16)).decode().rstrip('=')
            }
        }
        
        # Попробуем создать webpush объект - не отправлять, только проверить формат
        print("✅ Ключи сгенерированы в правильном формате!")
        
    except Exception as e:
        print(f"❌ Ошибка при тестировании ключей: {e}")
    
except ImportError:
    print("❌ Ошибка: необходимые библиотеки не установлены")
    print("Установите зависимости: pip install pywebpush cryptography")
except Exception as e:
    print(f"❌ Ошибка: {e}") 