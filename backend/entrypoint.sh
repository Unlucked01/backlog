#!/bin/bash

set -e

echo "🚀 Запуск студенческого планировщика..."

# Функция для проверки доступности базы данных
wait_for_db() {
    echo "⏳ Ожидание подключения к базе данных..."
    
    # Используем Python для проверки подключения с теми же настройками, что и приложение
    until python -c "
import os
import psycopg2
import time

host = os.environ.get('POSTGRES_HOST', 'localhost')
port = os.environ.get('POSTGRES_PORT', '5433')
user = os.environ.get('POSTGRES_USER', 'backlog_user')
password = os.environ.get('POSTGRES_PASSWORD', 'backlog_super_secure_password_2024')
database = os.environ.get('POSTGRES_DB', 'student_planner')

try:
    conn = psycopg2.connect(
        host=host,
        port=port,
        user=user,
        password=password,
        database=database,
        connect_timeout=5
    )
    conn.close()
    print(f'✅ Успешно подключился к {host}:{port}')
    exit(0)
except Exception as e:
    print(f'❌ Ошибка подключения к {host}:{port}: {e}')
    exit(1)
" 2>/dev/null; do
        echo "База данных недоступна, ожидание..."
        sleep 2
    done
    echo "✅ База данных доступна"
}

# Генерация VAPID ключей если они не установлены
generate_vapid_keys() {
    if [ -z "$VAPID_PRIVATE_KEY" ] || [ -z "$VAPID_PUBLIC_KEY" ]; then
        echo "🔑 VAPID ключи не найдены, генерируем новые..."
        python generate_vapid_keys.py
        echo ""
        echo "⚠️  Добавьте сгенерированные VAPID ключи в ваш .env файл для постоянного использования"
        echo "💡 Или установите переменные окружения VAPID_PRIVATE_KEY и VAPID_PUBLIC_KEY"
        echo ""
    else
        echo "✅ VAPID ключи найдены в переменных окружения"
    fi
}

# Ожидание базы данных
wait_for_db

# Генерация VAPID ключей
generate_vapid_keys

# Выполнение миграций
echo "📊 Выполнение миграций базы данных..."
alembic upgrade head

# Заполнение тестовыми данными
echo "🌱 Заполнение тестовыми данными..."
python -c "
import sys
sys.path.append('/app')

try:
    from sqlalchemy.orm import Session
    from app.db.session import SessionLocal
    from app.crud import user as crud_user
    from app.schemas.user import UserCreate
    from app.db.models.user import User
    
    # Создание сессии
    db = SessionLocal()
    
    try:
        # Проверяем, есть ли уже пользователи
        existing_user = db.query(User).first()
        if not existing_user:
            print('Создание тестового пользователя...')
            test_user = UserCreate(
                email='test@example.com',
                password='password123',
                full_name='Тестовый Студент'
            )
            crud_user.create_user(db=db, user=test_user)
            print('✅ Тестовый пользователь создан: test@example.com / password123')
        else:
            print('🔄 Тестовые данные уже существуют')
            
    except Exception as e:
        print(f'⚠️ Ошибка при создании тестовых данных: {e}')
        print('Продолжаем запуск сервера...')
    finally:
        db.close()
        
except Exception as e:
    print(f'❌ Критическая ошибка при инициализации: {e}')
    print('Продолжаем запуск сервера без тестовых данных...')
"

echo "🎯 Запуск сервера..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload 