# 🚀 Production Deployment Guide

Руководство по развертыванию Backlog App на сервере с доменом `unl-backlog.duckdns.org`.

## 📋 Предварительные требования

### На сервере должны быть установлены:
- Docker и Docker Compose
- Nginx
- Certbot (для SSL)
- Git

### Проверка установки:
```bash
docker --version
docker-compose --version
nginx -v
certbot --version
```

## 🛠️ Процесс развертывания

### 1. Клонирование репозитория
```bash
cd /var/www
sudo git clone https://github.com/your-username/backlog.git
cd backlog
sudo chown -R $USER:$USER .
```

### 2. Настройка переменных окружения
```bash
# Создайте .env файл из примера
cp env.production.example .env

# Отредактируйте переменные
nano .env
```

**Обязательно измените:**
- `POSTGRES_PASSWORD` - надежный пароль для БД
- `SECRET_KEY` - случайная строка 64+ символов
- `VK_CLIENT_ID` и `VK_CLIENT_SECRET` - если используете VK OAuth

### 3. Обновление Google OAuth redirect URI

В [Google Cloud Console](https://console.cloud.google.com/):
1. Перейдите в **APIs & Services** → **Credentials**
2. Найдите ваш OAuth 2.0 Client
3. Добавьте в **Authorized redirect URIs**:
   ```
   https://unl-backlog.duckdns.org/auth/google/callback
   ```

### 4. Автоматический деплой
```bash
# Запустите скрипт автоматического развертывания
./deploy.sh
```

### 5. Ручное развертывание (альтернатива)

Если предпочитаете ручное развертывание:

#### 5.1 Nginx конфигурация
```bash
# Копируем конфиг
sudo cp nginx.conf /etc/nginx/sites-available/unl-backlog.duckdns.org

# Создаем символическую ссылку
sudo ln -s /etc/nginx/sites-available/unl-backlog.duckdns.org /etc/nginx/sites-enabled/

# Проверяем конфигурацию
sudo nginx -t
```

#### 5.2 SSL сертификат
```bash
# Получаем SSL сертификат
sudo certbot --nginx -d unl-backlog.duckdns.org --non-interactive --agree-tos --email admin@unl-backlog.duckdns.org

# Настраиваем автообновление
echo "0 12 * * * /usr/bin/certbot renew --quiet" | crontab -
```

#### 5.3 Запуск приложения
```bash
# Останавливаем существующие контейнеры
docker-compose down

# Собираем и запускаем в продакшн режиме
docker-compose up --build -d

# Перезапускаем nginx
sudo nginx -s reload
```

## 🔍 Проверка работоспособности

### Проверка сервисов
```bash
# Статус контейнеров
docker-compose ps

# Логи приложения
docker-compose logs -f

# Проверка портов
ss -tlnp | grep -E "(3001|8001|5433)"
```

### Проверка веб-доступности
```bash
# Проверка frontend
curl -I http://localhost:3001

# Проверка backend API
curl -I http://localhost:8001/api/v1/health

# Проверка HTTPS
curl -I https://unl-backlog.duckdns.org
```

## 🔧 Управление приложением

### Основные команды
```bash
# Просмотр логов
docker-compose logs -f [service_name]

# Перезапуск сервиса
docker-compose restart [service_name]

# Остановка приложения
docker-compose down

# Запуск приложения
docker-compose up -d

# Обновление приложения
git pull
docker-compose down
docker-compose up --build -d
```

### Резервное копирование БД
```bash
# Создание бэкапа
docker-compose exec postgres pg_dump -U postgres student_planner > backup_$(date +%Y%m%d_%H%M%S).sql

# Восстановление из бэкапа
docker-compose exec -T postgres psql -U postgres student_planner < backup_file.sql
```

## 🔐 Безопасность

### Настройка файрволла
```bash
# Разрешаем только необходимые порты
sudo ufw allow 22/tcp      # SSH
sudo ufw allow 80/tcp      # HTTP
sudo ufw allow 443/tcp     # HTTPS
sudo ufw enable
```

### Регулярные обновления
```bash
# Обновление системы
sudo apt update && sudo apt upgrade -y

# Обновление Docker образов
docker-compose pull
docker-compose up -d
```

## 📊 Мониторинг

### Логи nginx
```bash
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Мониторинг ресурсов
```bash
# Использование CPU/RAM контейнерами
docker stats

# Место на диске
df -h
docker system df
```

## 🆘 Устранение неполадок

### Проблемы с SSL
```bash
# Проверка сертификата
sudo certbot certificates

# Принудительное обновление
sudo certbot renew --force-renewal
```

### Проблемы с Docker
```bash
# Очистка неиспользуемых ресурсов
docker system prune -a

# Пересборка без кэша
docker-compose build --no-cache
```

### Проблемы с базой данных
```bash
# Подключение к БД
docker-compose exec postgres psql -U postgres student_planner

# Проверка таблиц
\dt

# Выход
\q
```

## 📞 Поддержка

При возникновении проблем:
1. Проверьте логи: `docker-compose logs -f`
2. Проверьте статус сервисов: `docker-compose ps`
3. Проверьте конфигурацию nginx: `sudo nginx -t`
4. Проверьте SSL сертификаты: `sudo certbot certificates`

## 🔄 CI/CD (Опционально)

Для автоматического деплоя при пуше в репозиторий:

1. Настройте GitHub Actions или GitLab CI
2. Используйте webhook для автоматического обновления
3. Настройте мониторинг статуса деплоя 