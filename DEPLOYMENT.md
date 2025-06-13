# 🚀 Deployment Guide - Student Backlog Planner

Это руководство поможет вам развернуть приложение на домене `unl-backlog.duckdns.org` с SSL сертификатами.

## 📋 Предварительные требования

1. **Сервер** с установленным Docker и Docker Compose
2. **Домен** `unl-backlog.duckdns.org` должен указывать на IP вашего сервера
3. **Открытые порты**:
   - `8080` (HTTP)
   - `8443` (HTTPS)
   - `5433` (PostgreSQL, опционально для внешнего доступа)

## 🔧 Настройка портов

Приложение использует следующие порты (изменены для избежания конфликтов):

- **HTTP**: `8080` (вместо стандартного 80)
- **HTTPS**: `8443` (вместо стандартного 443)
- **PostgreSQL**: `5433` (вместо стандартного 5432)

## 📦 Быстрый деплой

### 1. Клонирование репозитория
```bash
git clone <repository-url>
cd backlog
```

### 2. Настройка окружения
```bash
# Скопируйте пример конфигурации
cp .env.example .env

# Отредактируйте .env файл
nano .env
```

Пример `.env` файла:
```env
POSTGRES_PASSWORD=your_super_secure_password_here
SECRET_KEY=your-super-secret-jwt-key-change-this-in-production
SSL_EMAIL=your-email@example.com
DOMAIN=unl-backlog.duckdns.org
```

### 3. Запуск деплоя
```bash
# Сделайте скрипты исполняемыми
chmod +x scripts/*.sh

# Запустите деплой
./scripts/deploy.sh
```

## 🔐 Ручная настройка SSL

Если автоматическая настройка SSL не сработала:

### 1. Запуск без SSL
```bash
# Запустите сервисы без nginx
docker-compose up -d postgres backend frontend

# Запустите nginx с временной конфигурацией
docker-compose up -d nginx
```

### 2. Получение SSL сертификата
```bash
# Запустите инициализацию SSL
./scripts/init-ssl.sh
```

### 3. Переключение на SSL конфигурацию
```bash
# Отключите временную конфигурацию
mv nginx/conf.d/backlog-init.conf nginx/conf.d/backlog-init.conf.disabled

# Перезапустите nginx
docker-compose restart nginx
```

## 🛠️ Управление сервисами

### Основные команды
```bash
# Просмотр статуса сервисов
docker-compose ps

# Просмотр логов
docker-compose logs -f

# Просмотр логов конкретного сервиса
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f nginx

# Перезапуск сервисов
docker-compose restart

# Остановка сервисов
docker-compose down

# Полная пересборка
docker-compose build --no-cache
docker-compose up -d
```

### SSL управление
```bash
# Обновление SSL сертификатов
docker-compose exec certbot certbot renew

# Проверка статуса сертификатов
docker-compose exec certbot certbot certificates

# Принудительное обновление сертификата
docker-compose run --rm certbot certbot renew --force-renewal
```

## 🌐 Доступ к приложению

После успешного деплоя приложение будет доступно по адресам:

- **HTTP**: http://unl-backlog.duckdns.org:8080
- **HTTPS**: https://unl-backlog.duckdns.org:8443

> **Примечание**: HTTP автоматически перенаправляется на HTTPS

## 🔍 Диагностика проблем

### Проверка DNS
```bash
# Проверьте, что домен указывает на ваш сервер
nslookup unl-backlog.duckdns.org
dig unl-backlog.duckdns.org
```

### Проверка портов
```bash
# Проверьте, что порты открыты
netstat -tlnp | grep :8080
netstat -tlnp | grep :8443
```

### Проверка SSL сертификата
```bash
# Проверьте SSL сертификат
openssl s_client -connect unl-backlog.duckdns.org:8443 -servername unl-backlog.duckdns.org
```

### Логи для диагностики
```bash
# Логи nginx
docker-compose logs nginx

# Логи certbot
docker-compose logs certbot

# Логи backend
docker-compose logs backend

# Логи всех сервисов
docker-compose logs
```

## 🔧 Настройка firewall

### Ubuntu/Debian (ufw)
```bash
sudo ufw allow 8080/tcp
sudo ufw allow 8443/tcp
sudo ufw allow 5433/tcp  # Если нужен внешний доступ к БД
```

### CentOS/RHEL (firewalld)
```bash
sudo firewall-cmd --permanent --add-port=8080/tcp
sudo firewall-cmd --permanent --add-port=8443/tcp
sudo firewall-cmd --permanent --add-port=5433/tcp
sudo firewall-cmd --reload
```

## 📊 Мониторинг

### Проверка здоровья сервисов
```bash
# Проверка API
curl -k https://unl-backlog.duckdns.org:8443/api/v1/health

# Проверка frontend
curl -k https://unl-backlog.duckdns.org:8443/

# Проверка базы данных
docker-compose exec postgres pg_isready -U backlog_user
```

### Мониторинг ресурсов
```bash
# Использование ресурсов контейнерами
docker stats

# Использование дискового пространства
docker system df
```

## 🔄 Обновление приложения

```bash
# Остановите сервисы
docker-compose down

# Обновите код
git pull

# Пересоберите и запустите
docker-compose build --no-cache
docker-compose up -d
```

## 🆘 Восстановление

### Бэкап базы данных
```bash
# Создание бэкапа
docker-compose exec postgres pg_dump -U backlog_user student_planner > backup.sql

# Восстановление из бэкапа
docker-compose exec -T postgres psql -U backlog_user student_planner < backup.sql
```

### Сброс SSL сертификатов
```bash
# Удалите существующие сертификаты
sudo rm -rf certbot/conf/live/unl-backlog.duckdns.org
sudo rm -rf certbot/conf/archive/unl-backlog.duckdns.org
sudo rm -rf certbot/conf/renewal/unl-backlog.duckdns.org.conf

# Запустите инициализацию SSL заново
./scripts/init-ssl.sh
```

## 📞 Поддержка

При возникновении проблем:

1. Проверьте логи сервисов
2. Убедитесь, что DNS настроен правильно
3. Проверьте, что порты открыты
4. Убедитесь, что SSL сертификаты действительны

Для получения помощи создайте issue с подробным описанием проблемы и логами. 