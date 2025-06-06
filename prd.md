# PRD: Сервис для планирования и контроля учебных задач студентов

## 1. Цель продукта
Создание современного, минималистичного PWA-приложения, которое помогает студентам планировать учебные задачи, отслеживать академические долги, получать напоминания и повышать мотивацию с помощью системы целей и достижений.

## 2. Целевая аудитория
- Студенты университетов и колледжей
- Цель — поддержка в управлении текущими задачами и задолженностями

## 3. Основной функционал

### 3.1 Регистрация и авторизация
- Вход через соцсети (Google, VK, Telegram)
- Регистрация через email/пароль
- Подтверждение email
- Страница логина/регистрации с названием сервиса сбоку

### 3.2 Профиль пользователя
- Просмотр и редактирование профиля
- Загрузка аватара
- Смена пароля
- Привязка Telegram-аккаунта

### 3.3 Календарь
- Просмотр задач и долгов в формате календаря (день / неделя / месяц)
- Добавление задач с дедлайнами
- Поддержка повторяющихся задач
- Разделение задач на этапы
- Цветовая маркировка по типу и приоритету

### 3.4 Задачи и задолженности
- Список всех задач
- Фильтры:
  - Приоритет (годовой долг / семестровый / текущая)
  - Тип задачи (курсовая, экзамен, лабораторная и т.п.)
  - Статус (выполнено / не выполнено)
- Сортировка:
  - По дате
  - По приоритету
- Добавление новой задачи:
  - Название
  - Описание (опционально)
  - Дата дедлайна
  - Тип
  - Приоритет
  - Отметка "Выполнено"

### 3.5 Панель управления (Dashboard)
- Приветствие пользователя
- Ближайшая задача
- Статистика: количество задач и долгов, текущая дата

### 3.6 Аналитика (опционально)
- Графики:
  - Выполненные / невыполненные задачи
  - Распределение задач по приоритетам и типам

### 3.7 Уведомления
- Push-уведомления о дедлайнах (через PWA)
- Telegram-уведомления (опционально)

### 3.8 Мотивация
- Цели на семестр
- Система ачивок:
  - За выполнение задач
  - За своевременную сдачу
  - За прогресс в целях

## 4. UI/UX
- Язык интерфейса: **русский**
- Стиль: **минималистичный, современный**
- Поддержка мобильных и десктопных устройств
- Светлая тема (опционально тёмная)

## 5. Технологический стек

### Фронтенд
- **Next.js**
- PWA с offline-режимом и push-уведомлениями

### Бэкенд
- **FastAPI (Python)**
- REST API
- Поддержка OAuth 2.0
- WebPush-уведомления

### База данных
- **PostgreSQL**
- Основные таблицы:
  - Users
  - Tasks
  - TaskSteps
  - Achievements
  - Goals
  - CalendarEvents
  - Notifications

## 6. Архитектура
- SPA с серверным рендерингом
- PWA-манифест
- Offline-кэш
- Возможность хостинга: Vercel / Render / Railway

## 7. MVP-функции
- Регистрация / авторизация
- Личный кабинет
- Календарь
- Список задач
- Push-напоминания
- Панель управления

## 8. Расширения (будущее)
- Интеграция с LMS или API расписаний вузов
- Синхронизация с Google Calendar
- Командная работа над проектами
- AI-помощник для управления задачами


# Структура
```
student-planner/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── v1/
│   │   │   │   ├── endpoints/
│   │   │   │   │   ├── auth.py
│   │   │   │   │   ├── tasks.py
│   │   │   │   │   ├── calendar.py
│   │   │   │   │   ├── analytics.py
│   │   │   │   │   └── users.py
│   │   │   │   └── __init__.py
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   ├── security.py
│   │   ├── crud/
│   │   │   ├── task.py
│   │   │   ├── user.py
│   │   │   └── __init__.py
│   │   ├── db/
│   │   │   ├── base.py
│   │   │   ├── models/
│   │   │   │   ├── user.py
│   │   │   │   ├── task.py
│   │   │   │   ├── calendar_event.py
│   │   │   │   └── __init__.py
│   │   │   ├── session.py
│   │   ├── schemas/
│   │   │   ├── user.py
│   │   │   ├── task.py
│   │   │   └── __init__.py
│   │   ├── services/
│   │   │   ├── notifications.py
│   │   │   └── telegram.py
│   │   ├── main.py
│   │   └── __init__.py
│   ├── alembic/
│   └── requirements.txt
│
├── frontend/
│   ├── public/
│   ├── app/                       # Next.js App Router
│   │   ├── layout.tsx
│   │   ├── page.tsx              # Dashboard
│   │   ├── login/
│   │   ├── profile/
│   │   ├── calendar/
│   │   ├── tasks/
│   │   ├── analytics/
│   ├── components/
│   │   ├── TaskCard.tsx
│   │   ├── CalendarView.tsx
│   │   ├── Sidebar.tsx
│   │   ├── Header.tsx
│   │   └── NotificationBell.tsx
│   ├── lib/
│   │   ├── api.ts
│   │   └── utils.ts
│   ├── styles/
│   │   └── globals.css
│   ├── pwa/
│   │   ├── service-worker.ts
│   │   └── manifest.json
│   ├── next.config.js
│   ├── tsconfig.json
│   └── package.json
│
├── .gitignore
├── README.md
└── docker-compose.yml
```