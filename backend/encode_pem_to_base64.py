#!/usr/bin/env python3
"""
Кодирует PEM ключи в base64 для использования в переменных окружения
"""

import base64

# Ваш сгенерированный приватный ключ
private_key_pem = """-----BEGIN PRIVATE KEY-----
MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgHW/oqfHZbDr3g94Q
PC9lUlGBKb6EwS5DHsCgEqqg33GhRANCAAQTYWFE865c+XpUvLblTAT0MenqZLWz
C8wqG+fHjI93KnzA1pvoPIZSup0arhrZ5oKQcK6ohcpb708HMDtgdgoW
-----END PRIVATE KEY-----"""

public_key = "BBNhYUTzrlz5elS8tuVMBPQx6epktbMLzCob58eMj3cqfMDWm-g8hlK6nRquGtnmgpBwrqiFylvvTwcwO2B2ChY"

# Кодируем приватный ключ в base64
private_key_b64 = base64.urlsafe_b64encode(private_key_pem.encode('utf-8')).decode('ascii').rstrip('=')

print("🔑 VAPID ключи в base64 формате для .env:")
print("=" * 70)
print(f"VAPID_PRIVATE_KEY={private_key_b64}")
print(f"VAPID_PUBLIC_KEY={public_key}")
print("=" * 70)
print("\n📝 Обновите docker-compose.yml с этими ключами")
print("⚠️  Приватный ключ теперь в base64, сервис автоматически декодирует его") 