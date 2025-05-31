#!/bin/bash

echo "🎓 Настройка студенческого планировщика..."

# Создание .env файла для backend
echo "📝 Создание файла конфигурации backend..."
cat > backend/.env << EOF
# Database
DATABASE_URL=postgresql://postgres:password@postgres:5432/student_planner

# JWT
SECRET_KEY=$(openssl rand -hex 32)
ACCESS_TOKEN_EXPIRE_MINUTES=30

# CORS
BACKEND_CORS_ORIGINS=["http://localhost:3000"]

# App
PROJECT_NAME=Student Planner API
VERSION=1.0.0
DEBUG=true

# WebPush (optional - для push-уведомлений)
VAPID_PRIVATE_KEY=
VAPID_PUBLIC_KEY=
VAPID_SUBJECT=mailto:admin@studentplanner.ru

# Telegram (optional - для Telegram бота)
TELEGRAM_BOT_TOKEN=
EOF

echo "✅ Файл backend/.env создан"

# Создание иконок для PWA (заглушки)
echo "🎨 Создание папки для иконок PWA..."
mkdir -p frontend/public/icons

echo "✅ Папка для иконок создана (добавьте реальные иконки позже)"

echo ""
echo "🚀 Готово! Теперь запустите:"
echo "   docker-compose up --build"
echo ""
echo "📖 После запуска:"
echo "   Frontend: http://localhost:3000"
echo "   Backend API: http://localhost:8000/docs"
echo ""
echo "💡 Первый запуск может занять несколько минут..." 