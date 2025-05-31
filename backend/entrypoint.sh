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

host = os.environ.get('POSTGRES_HOST', 'postgres')
port = os.environ.get('POSTGRES_PORT', '5432')
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


# Ожидание базы данных
wait_for_db

# Выполнение миграций
echo "📊 Выполнение миграций базы данных..."
echo "🔍 Database configuration:"
echo "  POSTGRES_HOST: $POSTGRES_HOST"
echo "  POSTGRES_PORT: $POSTGRES_PORT"
echo "  POSTGRES_USER: $POSTGRES_USER"
echo "  POSTGRES_DB: $POSTGRES_DB"
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
    from app.db.models.task import Task, TaskStep, TaskType, TaskPriority, TaskStatus
    from datetime import datetime, timedelta
    import random
    
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
            user = crud_user.create_user(db=db, user=test_user)
            print('✅ Тестовый пользователь создан: test@example.com / password123')
        else:
            user = existing_user
            print('🔄 Тестовый пользователь уже существует')
            
        # Проверяем, есть ли уже задачи
        existing_tasks = db.query(Task).filter(Task.user_id == user.id).count()
        if existing_tasks == 0:
            print('Создание демонстрационных задач...')
            
            # Определяем цвета для разных типов задач
            colors = {
                TaskType.coursework: '#8B5CF6',     # фиолетовый
                TaskType.exam: '#EF4444',           # красный
                TaskType.laboratory: '#10B981',     # зеленый
                TaskType.lecture: '#3B82F6',        # синий
                TaskType.seminar: '#F59E0B',        # желтый
                TaskType.project: '#EC4899',        # розовый
                TaskType.homework: '#6B7280',       # серый
                TaskType.other: '#14B8A6'           # бирюзовый
            }
            
            # Создаем разнообразные задачи
            mock_tasks = [
                {
                    'title': 'Курсовая работа по базам данных',
                    'description': 'Разработать систему управления библиотекой с использованием PostgreSQL. Включает проектирование схемы БД, создание таблиц и написание запросов.',
                    'task_type': TaskType.coursework,
                    'priority': TaskPriority.yearly_debt,
                    'status': TaskStatus.in_progress,
                    'deadline': datetime.now() + timedelta(days=45),
                    'steps': [
                        {'title': 'Анализ требований', 'description': 'Изучить техническое задание и выделить основные сущности', 'is_completed': True, 'order': 1},
                        {'title': 'Проектирование схемы БД', 'description': 'Создать ER-диаграмму и нормализовать таблицы', 'is_completed': True, 'order': 2},
                        {'title': 'Создание таблиц', 'description': 'Написать SQL-скрипты для создания структуры БД', 'is_completed': False, 'order': 3},
                        {'title': 'Разработка приложения', 'description': 'Создать веб-интерфейс для работы с данными', 'is_completed': False, 'order': 4},
                        {'title': 'Тестирование и отладка', 'description': 'Проверить корректность работы всех функций', 'is_completed': False, 'order': 5},
                        {'title': 'Подготовка документации', 'description': 'Написать пояснительную записку и руководство пользователя', 'is_completed': False, 'order': 6}
                    ]
                },
                {
                    'title': 'Экзамен по математическому анализу',
                    'description': 'Подготовка к экзамену: повторение теории пределов, производных, интегралов и дифференциальных уравнений.',
                    'task_type': TaskType.exam,
                    'priority': TaskPriority.semester_debt,
                    'status': TaskStatus.pending,
                    'deadline': datetime.now() + timedelta(days=12),
                    'steps': [
                        {'title': 'Теория пределов', 'description': 'Повторить определения и основные теоремы о пределах', 'is_completed': False, 'order': 1},
                        {'title': 'Производные и дифференцирование', 'description': 'Изучить правила дифференцирования и их применение', 'is_completed': False, 'order': 2},
                        {'title': 'Интегралы', 'description': 'Неопределенные и определенные интегралы, методы интегрирования', 'is_completed': False, 'order': 3},
                        {'title': 'Дифференциальные уравнения', 'description': 'Основные типы ДУ и методы их решения', 'is_completed': False, 'order': 4},
                        {'title': 'Решение задач', 'description': 'Проработать типовые задачи из экзаменационных билетов', 'is_completed': False, 'order': 5}
                    ]
                },
                {
                    'title': 'Лабораторная работа №3 по физике',
                    'description': 'Изучение законов оптики: измерение показателя преломления стекла и определение фокусного расстояния линзы.',
                    'task_type': TaskType.laboratory,
                    'priority': TaskPriority.current,
                    'status': TaskStatus.completed,
                    'deadline': datetime.now() - timedelta(days=3),
                    'completed_at': datetime.now() - timedelta(days=1),
                    'steps': [
                        {'title': 'Изучение теории', 'description': 'Прочитать методические указания к лабораторной работе', 'is_completed': True, 'order': 1},
                        {'title': 'Проведение эксперимента', 'description': 'Выполнить измерения в лаборатории', 'is_completed': True, 'order': 2},
                        {'title': 'Обработка результатов', 'description': 'Рассчитать погрешности и построить графики', 'is_completed': True, 'order': 3},
                        {'title': 'Написание отчета', 'description': 'Оформить отчет согласно требованиям', 'is_completed': True, 'order': 4}
                    ]
                },
                {
                    'title': 'Проект по разработке мобильного приложения',
                    'description': 'Командный проект по созданию мобильного приложения для планирования задач с использованием React Native.',
                    'task_type': TaskType.project,
                    'priority': TaskPriority.current,
                    'status': TaskStatus.in_progress,
                    'deadline': datetime.now() + timedelta(days=30),
                    'steps': [
                        {'title': 'Планирование архитектуры', 'description': 'Определить основные компоненты и их взаимодействие', 'is_completed': True, 'order': 1},
                        {'title': 'Дизайн интерфейса', 'description': 'Создать макеты экранов в Figma', 'is_completed': True, 'order': 2},
                        {'title': 'Настройка проекта', 'description': 'Инициализировать React Native проект и настроить зависимости', 'is_completed': True, 'order': 3},
                        {'title': 'Разработка основных экранов', 'description': 'Реализовать главный экран и экран списка задач', 'is_completed': False, 'order': 4},
                        {'title': 'Интеграция с API', 'description': 'Подключить приложение к серверной части', 'is_completed': False, 'order': 5},
                        {'title': 'Тестирование', 'description': 'Провести тестирование на различных устройствах', 'is_completed': False, 'order': 6}
                    ]
                },
                {
                    'title': 'Домашнее задание по программированию',
                    'description': 'Реализовать алгоритмы сортировки (быстрая сортировка, сортировка слиянием) на языке Python с анализом временной сложности.',
                    'task_type': TaskType.homework,
                    'priority': TaskPriority.current,
                    'status': TaskStatus.pending,
                    'deadline': datetime.now() + timedelta(days=5),
                    'steps': [
                        {'title': 'Изучение алгоритмов', 'description': 'Разобрать принципы работы алгоритмов сортировки', 'is_completed': False, 'order': 1},
                        {'title': 'Реализация быстрой сортировки', 'description': 'Написать код алгоритма QuickSort', 'is_completed': False, 'order': 2},
                        {'title': 'Реализация сортировки слиянием', 'description': 'Написать код алгоритма MergeSort', 'is_completed': False, 'order': 3},
                        {'title': 'Анализ сложности', 'description': 'Провести временной анализ и сравнить производительность', 'is_completed': False, 'order': 4}
                    ]
                },
                {
                    'title': 'Семинар по микроэкономике',
                    'description': 'Подготовка к семинару: изучение теории потребительского выбора и рыночного равновесия.',
                    'task_type': TaskType.seminar,
                    'priority': TaskPriority.current,
                    'status': TaskStatus.pending,
                    'deadline': datetime.now() + timedelta(days=2),
                    'steps': [
                        {'title': 'Прочитать главы учебника', 'description': 'Изучить материал по теории потребителя', 'is_completed': False, 'order': 1},
                        {'title': 'Решить задачи', 'description': 'Проработать типовые задачи на оптимизацию', 'is_completed': False, 'order': 2},
                        {'title': 'Подготовить вопросы', 'description': 'Сформулировать вопросы для обсуждения', 'is_completed': False, 'order': 3}
                    ]
                },
                {
                    'title': 'Лекция по истории России',
                    'description': 'Посещение лекции и ведение конспекта по теме \"Реформы Петра I и их влияние на развитие государства\".',
                    'task_type': TaskType.lecture,
                    'priority': TaskPriority.current,
                    'status': TaskStatus.completed,
                    'deadline': datetime.now() - timedelta(days=1),
                    'completed_at': datetime.now() - timedelta(days=1),
                    'steps': [
                        {'title': 'Подготовиться к лекции', 'description': 'Повторить предыдущий материал', 'is_completed': True, 'order': 1},
                        {'title': 'Посетить лекцию', 'description': 'Присутствовать на лекции и вести записи', 'is_completed': True, 'order': 2},
                        {'title': 'Обработать конспект', 'description': 'Дополнить записи и структурировать материал', 'is_completed': True, 'order': 3}
                    ]
                },
                {
                    'title': 'Подготовка к конференции по ИИ',
                    'description': 'Подготовить доклад для студенческой конференции по искусственному интеллекту на тему \"Применение машинного обучения в медицине\".',
                    'task_type': TaskType.other,
                    'priority': TaskPriority.current,
                    'status': TaskStatus.pending,
                    'deadline': datetime.now() + timedelta(days=20),
                    'steps': [
                        {'title': 'Исследование темы', 'description': 'Изучить современные работы по применению ИИ в медицине', 'is_completed': False, 'order': 1},
                        {'title': 'Структура доклада', 'description': 'Составить план презентации', 'is_completed': False, 'order': 2},
                        {'title': 'Создание презентации', 'description': 'Подготовить слайды в PowerPoint', 'is_completed': False, 'order': 3},
                        {'title': 'Репетиция', 'description': 'Отрепетировать выступление', 'is_completed': False, 'order': 4}
                    ]
                }
            ]
            
            # Создаем задачи в базе данных
            for task_data in mock_tasks:
                # Создаем задачу
                db_task = Task(
                    user_id=user.id,
                    title=task_data['title'],
                    description=task_data['description'],
                    task_type=task_data['task_type'],
                    priority=task_data['priority'],
                    status=task_data['status'],
                    deadline=task_data['deadline'],
                    completed_at=task_data.get('completed_at'),
                    color=colors.get(task_data['task_type'], '#3B82F6')
                )
                db.add(db_task)
                db.commit()
                db.refresh(db_task)
                
                # Создаем этапы задачи
                for step_data in task_data['steps']:
                    db_step = TaskStep(
                        task_id=db_task.id,
                        title=step_data['title'],
                        description=step_data['description'],
                        is_completed=step_data['is_completed'],
                        order=step_data['order'],
                        completed_at=datetime.now() if step_data['is_completed'] else None
                    )
                    db.add(db_step)
                
                db.commit()
                print(f'  ✅ Создана задача: {task_data[\"title\"]}')
            
            print(f'✅ Создано {len(mock_tasks)} демонстрационных задач с этапами')
        else:
            print(f'🔄 Демонстрационные задачи уже существуют ({existing_tasks} шт.)')
            
        # Создаем демонстрационные цели
        from app.db.models.goal import Goal, GoalType, Achievement, UserAchievement
        
        existing_goals = db.query(Goal).filter(Goal.user_id == user.id).count()
        if existing_goals == 0:
            print('Создание демонстрационных целей...')
            
            mock_goals = [
                {
                    'title': 'Завершить все курсовые работы',
                    'description': 'Цель на семестр: успешно сдать все курсовые проекты с хорошими оценками',
                    'goal_type': GoalType.semester,
                    'target_value': 4,
                    'current_value': 1,
                    'start_date': datetime.now() - timedelta(days=60),
                    'end_date': datetime.now() + timedelta(days=30),
                },
                {
                    'title': 'Выполнить 15 лабораторных работ',
                    'description': 'Месячная цель по выполнению лабораторных работ по различным предметам',
                    'goal_type': GoalType.monthly,
                    'target_value': 15,
                    'current_value': 8,
                    'start_date': datetime.now() - timedelta(days=20),
                    'end_date': datetime.now() + timedelta(days=10),
                },
                {
                    'title': 'Посетить все лекции на неделе',
                    'description': 'Еженедельная цель по посещаемости: не пропускать ни одной лекции',
                    'goal_type': GoalType.weekly,
                    'target_value': 12,
                    'current_value': 9,
                    'start_date': datetime.now() - timedelta(days=5),
                    'end_date': datetime.now() + timedelta(days=2),
                },
                {
                    'title': 'Изучить React Native',
                    'description': 'Персональная цель: освоить фреймворк для разработки мобильных приложений',
                    'goal_type': GoalType.custom,
                    'target_value': 20,
                    'current_value': 12,
                    'start_date': datetime.now() - timedelta(days=30),
                    'end_date': datetime.now() + timedelta(days=30),
                },
                {
                    'title': 'Подготовиться к сессии',
                    'description': 'Завершить все долги и подготовиться к экзаменационной сессии',
                    'goal_type': GoalType.semester,
                    'target_value': 8,
                    'current_value': 5,
                    'start_date': datetime.now() - timedelta(days=45),
                    'end_date': datetime.now() + timedelta(days=15),
                }
            ]
            
            for goal_data in mock_goals:
                db_goal = Goal(
                    user_id=user.id,
                    title=goal_data['title'],
                    description=goal_data['description'],
                    goal_type=goal_data['goal_type'],
                    target_value=goal_data['target_value'],
                    current_value=goal_data['current_value'],
                    start_date=goal_data['start_date'],
                    end_date=goal_data['end_date'],
                    is_completed=goal_data['current_value'] >= goal_data['target_value'],
                    completed_at=datetime.now() if goal_data['current_value'] >= goal_data['target_value'] else None
                )
                db.add(db_goal)
                db.commit()
                print(f'  ✅ Создана цель: {goal_data[\"title\"]}')
            
            print(f'✅ Создано {len(mock_goals)} демонстрационных целей')
        else:
            print(f'🔄 Демонстрационные цели уже существуют ({existing_goals} шт.)')
            
        # Создаем базовые достижения
        existing_achievements = db.query(Achievement).count()
        if existing_achievements == 0:
            print('Создание системы достижений...')
            
            mock_achievements = [
                {
                    'name': 'Первые шаги',
                    'description': 'Создайте свою первую задачу',
                    'icon': '🎯',
                    'condition_type': 'tasks_created',
                    'condition_value': 1,
                    'points': 10
                },
                {
                    'name': 'Отличный старт',
                    'description': 'Выполните 5 задач',
                    'icon': '⭐',
                    'condition_type': 'tasks_completed',
                    'condition_value': 5,
                    'points': 25
                },
                {
                    'name': 'Продуктивный студент',
                    'description': 'Выполните 20 задач',
                    'icon': '🏆',
                    'condition_type': 'tasks_completed',
                    'condition_value': 20,
                    'points': 50
                },
                {
                    'name': 'Мастер планирования',
                    'description': 'Выполните 50 задач',
                    'icon': '👑',
                    'condition_type': 'tasks_completed',
                    'condition_value': 50,
                    'points': 100
                },
                {
                    'name': 'Постоянство',
                    'description': 'Выполняйте задачи 7 дней подряд',
                    'icon': '🔥',
                    'condition_type': 'streak_days',
                    'condition_value': 7,
                    'points': 30
                },
                {
                    'name': 'Целеустремленность',
                    'description': 'Достигните первой цели',
                    'icon': '🎪',
                    'condition_type': 'goals_completed',
                    'condition_value': 1,
                    'points': 40
                }
            ]
            
            for achievement_data in mock_achievements:
                db_achievement = Achievement(
                    name=achievement_data['name'],
                    description=achievement_data['description'],
                    icon=achievement_data['icon'],
                    condition_type=achievement_data['condition_type'],
                    condition_value=achievement_data['condition_value'],
                    points=achievement_data['points']
                )
                db.add(db_achievement)
                db.commit()
                
            # Добавляем несколько достижений пользователю
            achievements_to_award = db.query(Achievement).filter(
                Achievement.condition_type.in_(['tasks_created', 'tasks_completed'])
            ).limit(2).all()
            
            for achievement in achievements_to_award:
                user_achievement = UserAchievement(
                    user_id=user.id,
                    achievement_id=achievement.id,
                    earned_at=datetime.now() - timedelta(days=random.randint(1, 10))
                )
                db.add(user_achievement)
            
            db.commit()
            print(f'✅ Создано {len(mock_achievements)} достижений')
            print(f'✅ Пользователю присвоено {len(achievements_to_award)} достижений')
        else:
            print(f'🔄 Система достижений уже существует ({existing_achievements} шт.)')
            
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