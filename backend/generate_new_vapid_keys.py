#!/usr/bin/env python3
"""
Генерация новых VAPID ключей для исправления проблемы
Запуск: docker exec -it backlog_backend python /app/generate_new_vapid_keys.py
"""

import base64
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import ec

print("🔧 Генерация новых VAPID ключей...")

# Генерируем новый приватный ключ EC P-256
private_key = ec.generate_private_key(ec.SECP256R1())
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

# Кодируем в base64 для переменных окружения
private_key_b64 = base64.urlsafe_b64encode(private_pem).decode('ascii').rstrip('=')
public_key_b64 = base64.urlsafe_b64encode(public_key_uncompressed).decode('ascii').rstrip('=')

print("\n🔑 Новые VAPID ключи для docker-compose.yml:")
print("=" * 80)
print(f"VAPID_PRIVATE_KEY={private_key_b64}")
print(f"VAPID_PUBLIC_KEY={public_key_b64}")
print("=" * 80)

print("\n📋 Скопируйте эти строки в docker-compose.yml:")
print(f"      - VAPID_PRIVATE_KEY={private_key_b64}")
print(f"      - VAPID_PUBLIC_KEY={public_key_b64}")

print("\n🌐 И обновите frontend:")
print(f"        NEXT_PUBLIC_VAPID_PUBLIC_KEY: {public_key_b64}")

print("\n🔄 После обновления выполните:")
print("docker-compose restart backend frontend")

print("\n✅ Готово! Новые ключи должны исправить проблему с уведомлениями.") 