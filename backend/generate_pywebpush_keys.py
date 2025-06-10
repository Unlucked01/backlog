#!/usr/bin/env python3
"""
Генерация VAPID ключей с помощью pywebpush
"""

import subprocess
import sys
import os

try:
    # Выполняем команду pywebpush для генерации ключей
    result = subprocess.run(['python', '-c', '''
from pywebpush import webpush
import json

# Генерируем ключи
vapid_private_key, vapid_public_key = webpush.generate_vapid_keys()

print("🔑 VAPID ключи для push-уведомлений:")
print("=" * 60)
print(f"VAPID_PRIVATE_KEY={vapid_private_key}")
print(f"VAPID_PUBLIC_KEY={vapid_public_key}")
print("=" * 60)
print()
print("📝 Обновите эти ключи в:")
print("1. docker-compose.yml")
print("2. .env файле")
print("3. NEXT_PUBLIC_VAPID_PUBLIC_KEY в frontend")
'''], capture_output=True, text=True)
    
    if result.returncode == 0:
        print(result.stdout)
    else:
        print("❌ Ошибка генерации ключей:")
        print(result.stderr)
        
        # Попробуем альтернативный способ
        print("\n🔄 Пробуем альтернативный способ...")
        
        from cryptography.hazmat.primitives import serialization
        from cryptography.hazmat.primitives.asymmetric import ec
        import base64
        
        # Генерируем ключ EC P-256
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
        
        print("🔑 Альтернативные VAPID ключи:")
        print("=" * 60)
        print(f"VAPID_PRIVATE_KEY={private_pem}")
        print(f"VAPID_PUBLIC_KEY={public_key_b64}")
        print("=" * 60)

except Exception as e:
    print(f"❌ Ошибка: {e}")
    sys.exit(1) 