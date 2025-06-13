#!/usr/bin/env python3
"""
Скрипт для генерации VAPID ключей для push-уведомлений
"""

import base64
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.backends import default_backend

def generate_vapid_keys():
    """Генерирует пару VAPID ключей"""
    
    # Генерируем приватный ключ
    private_key = ec.generate_private_key(ec.SECP256R1(), default_backend())
    
    # Получаем публичный ключ
    public_key = private_key.public_key()
    
    # Сериализуем приватный ключ в PEM формат
    private_pem = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption()
    )
    
    # Сериализуем публичный ключ для веб-push
    public_der = public_key.public_bytes(
        encoding=serialization.Encoding.X962,
        format=serialization.PublicFormat.UncompressedPoint
    )
    
    # Убираем первый байт (0x04) и кодируем в base64url
    public_b64 = base64.urlsafe_b64encode(public_der[1:]).decode('utf-8').rstrip('=')
    
    return {
        'private_key': private_pem.decode('utf-8'),
        'public_key': public_b64
    }

def main():
    print("🔑 Генерация VAPID ключей...")
    
    keys = generate_vapid_keys()
    
    print("\n" + "="*60)
    print("📋 VAPID ключи сгенерированы!")
    print("="*60)
    
    print("\n🔐 Приватный ключ (VAPID_PRIVATE_KEY):")
    print("-" * 40)
    print(keys['private_key'])
    
    print("\n🔓 Публичный ключ (VAPID_PUBLIC_KEY):")
    print("-" * 40)
    print(keys['public_key'])
    
    print("\n💡 Инструкция по использованию:")
    print("1. Скопируйте ключи в ваш docker-compose.yml")
    print("2. Обновите переменные окружения:")
    print("   - VAPID_PRIVATE_KEY")
    print("   - VAPID_PUBLIC_KEY") 
    print("   - NEXT_PUBLIC_VAPID_PUBLIC_KEY")
    print("3. Перезапустите контейнеры")
    
    print("\n⚠️  Важно:")
    print("- Храните приватный ключ в безопасности")
    print("- Не изменяйте ключи после того, как пользователи подписались")
    print("- Публичный ключ используется в frontend для подписки")

if __name__ == "__main__":
    main() 