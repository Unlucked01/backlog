#!/usr/bin/env python3
"""
Исправление VAPID ключей для push-уведомлений
"""

import subprocess
import sys

try:
    # Запускаем команду для генерации VAPID ключей через Docker
    print("🔄 Генерация новых VAPID ключей...")
    
    result = subprocess.run([
        'docker', 'exec', 'backlog_backend', 'python', '-c', '''
from py_vapid import Vapid
import base64

# Генерируем новые ключи
vapid = Vapid()
vapid.generate_keys()

# Получаем ключи в правильном формате
private_key_pem = vapid.private_key.private_bytes(
    encoding=serialization.Encoding.PEM,
    format=serialization.PrivateFormat.PKCS8,
    encryption_algorithm=serialization.NoEncryption()
).decode("utf-8")

# Публичный ключ в base64url без padding
public_key_b64 = vapid.public_key

print("🔑 Новые VAPID ключи:")
print("=" * 60)
print(f"PRIVATE_KEY_PEM:")
print(private_key_pem)
print(f"PUBLIC_KEY: {public_key_b64}")
print("=" * 60)
'''
    ], capture_output=True, text=True)
    
    if result.returncode == 0:
        print(result.stdout)
    else:
        print("❌ Ошибка через Docker, пробуем локально...")
        print(result.stderr)
        
        # Альтернативный способ без Docker
        print("\n🔄 Генерация ключей локально...")
        
        # Генерируем через cryptography
        from cryptography.hazmat.primitives import serialization
        from cryptography.hazmat.primitives.asymmetric import ec
        import base64
        
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
        
        print("🔑 Новые VAPID ключи (локальная генерация):")
        print("=" * 70)
        print("VAPID_PRIVATE_KEY:")
        print(private_pem)
        print(f"VAPID_PUBLIC_KEY: {public_key_b64}")
        print("=" * 70)
        print("\n📝 Обновите docker-compose.yml с этими ключами")
        print("⚠️  Замените \\n на настоящие переносы строк в docker-compose.yml")
        
        # Также для frontend
        print(f"\n🌐 Для frontend (.env.local):")
        print(f"NEXT_PUBLIC_VAPID_PUBLIC_KEY={public_key_b64}")
        
except Exception as e:
    print(f"❌ Ошибка: {e}")
    import traceback
    traceback.print_exc() 