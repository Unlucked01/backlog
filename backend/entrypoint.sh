#!/bin/bash

set -e

echo "🚀 Запуск студенческого планировщика..."

# Функция для проверки доступности базы данных
wait_for_db() {
    echo "⏳ Ожидание подключения к базе данных..."
    while ! pg_isready -h postgres -p 5432 -U postgres; do
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