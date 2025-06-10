#!/usr/bin/env python3
"""
Скрипт для генерации VAPID ключей для push-уведомлений
Запуск: python generate_vapid_keys.py
"""

try:
    from pywebpush import webpush
    from cryptography.hazmat.primitives import serialization
    from cryptography.hazmat.primitives.asymmetric import ec
    import base64
    
    # Генерируем ключи EC P-256
    private_key = ec.generate_private_key(ec.SECP256R1())
    public_key = private_key.public_key()
    
    # Сериализуем приватный ключ в PEM формате
    private_pem = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption()
    )
    private_key_b64 = base64.urlsafe_b64encode(private_pem).decode('ascii').rstrip('=')
    
    # Сериализуем публичный ключ
    public_raw = public_key.public_numbers().x.to_bytes(32, 'big') + \
                 public_key.public_numbers().y.to_bytes(32, 'big')
    public_key_b64 = base64.urlsafe_b64encode(b'\x04' + public_raw).decode('ascii').rstrip('=')
    
    print("🔑 VAPID ключи для push-уведомлений:")
    print("=" * 50)
    print(f"VAPID_PRIVATE_KEY={private_key_b64}")
    print(f"VAPID_PUBLIC_KEY={public_key_b64}")
    print("=" * 50)
    print("\n📝 Добавьте эти ключи в ваш .env файл")
    print("⚠️  Храните приватный ключ в безопасности!")
    
    # Также выводим для frontend
    print(f"\n🌐 Для frontend (components/PushNotifications.tsx):")
    print(f"const VAPID_PUBLIC_KEY = '{public_key_b64}';")
    
except ImportError:
    print("❌ Ошибка: необходимые библиотеки не установлены")
    print("Установите зависимости: pip install pywebpush cryptography")
except Exception as e:
    print(f"❌ Ошибка генерации ключей: {e}") 