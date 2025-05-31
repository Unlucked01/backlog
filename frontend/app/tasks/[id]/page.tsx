'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { tasksAPI, tokenUtils, type Task, type TaskStep } from '@/lib/api';
import { validationUtils } from '@/lib/utils';
import TaskProgress from '@/components/TaskProgress';
import { 
  ArrowLeftIcon, 
  PencilIcon, 
  CheckIcon, 
  XMarkIcon,
  ClockIcon,
  CalendarDaysIcon,
  FlagIcon,
  TagIcon,
  PlayIcon,
  PauseIcon
} from '@heroicons/react/24/outline';

interface TaskForm {
  title: string;
  description: string;
  task_type: string;
  priority: string;
  deadline: string;
  color: string;
}

export default function TaskDetailPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const taskId = parseInt(params.id as string);
  const editMode = searchParams.get('edit') === 'true';
  
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(editMode);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [stepsLoading, setStepsLoading] = useState<Record<number, boolean>>({});

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<TaskForm>();

  useEffect(() => {
    if (!tokenUtils.isAuthenticated()) {
      router.push('/login');
      return;
    }
    loadTask();
  }, [taskId, router]);

  // Установка режима редактирования при загрузке, если есть параметр
  useEffect(() => {
    setIsEditing(editMode);
  }, [editMode]);

  const loadTask = async () => {
    try {
      setLoading(true);
      const taskData = await tasksAPI.getTask(taskId);
      setTask(taskData);
      reset({
        title: taskData.title,
        description: taskData.description || '',
        task_type: taskData.task_type,
        priority: taskData.priority,
        deadline: taskData.deadline.split('T')[0],
        color: taskData.color || '#3B82F6'
      });
    } catch (err: any) {
      setError('Задача не найдена');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: TaskForm) => {
    setError(null);
    setSuccess(null);
    
    try {
      // Создаем дату в локальном часовом поясе
      const localDate = new Date(data.deadline + 'T23:59:59');
      const deadlineISO = localDate.toISOString();
      
      console.log('Original date:', data.deadline);
      console.log('Local date object:', localDate);
      console.log('Sending deadline:', deadlineISO);
      
      const updatedTask = await tasksAPI.updateTask(taskId, {
        ...data,
        deadline: deadlineISO
      });
      setTask(updatedTask);
      setIsEditing(false);
      setSuccess('Задача успешно обновлена');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка обновления задачи');
    }
  };

  const toggleTaskStatus = async () => {
    if (!task) return;
    
    try {
      const newStatus = task.status === 'completed' ? 'pending' : 'completed';
      const updatedTask = await tasksAPI.updateTask(taskId, { status: newStatus });
      setTask(updatedTask);
      setSuccess(`Задача ${newStatus === 'completed' ? 'выполнена' : 'возвращена в работу'}`);
    } catch (err: any) {
      setError('Ошибка изменения статуса задачи');
    }
  };

  const toggleStepStatus = async (stepId: number, currentStatus: boolean) => {
    setStepsLoading({ ...stepsLoading, [stepId]: true });
    
    try {
      await tasksAPI.completeTaskStep(stepId, !currentStatus);
      // Перезагружаем задачу для обновления прогресса
      await loadTask();
      setSuccess(`Этап ${!currentStatus ? 'выполнен' : 'возвращен в работу'}`);
    } catch (err: any) {
      setError('Ошибка изменения статуса этапа');
    } finally {
      setStepsLoading({ ...stepsLoading, [stepId]: false });
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'yearly_debt': return 'bg-red-100 text-red-800 border-red-200';
      case 'semester_debt': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'current': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'yearly_debt': return 'Годовой долг';
      case 'semester_debt': return 'Семестровый долг';
      case 'current': return 'Текущая';
      default: return priority;
    }
  };

  const getTypeText = (type: string) => {
    const types: Record<string, string> = {
      coursework: 'Курсовая',
      exam: 'Экзамен',
      laboratory: 'Лабораторная',
      lecture: 'Лекция',
      seminar: 'Семинар',
      project: 'Проект',
      homework: 'Домашнее задание',
      other: 'Другое'
    };
    return types[type] || type;
  };

  const isOverdue = task && new Date(task.deadline) < new Date() && task.status !== 'completed';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Задача не найдена</h1>
          <Link href="/tasks" className="btn btn-primary">
            Вернуться к задачам
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/tasks" className="text-gray-600 hover:text-gray-900">
                <ArrowLeftIcon className="h-6 w-6" />
              </Link>
            </div>
            
            <div className="flex items-center space-x-3">
              {!isEditing && (
                <>
                  <button
                    onClick={toggleTaskStatus}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center ${
                      task.status === 'completed' 
                        ? 'bg-orange-100 text-orange-700 hover:bg-orange-200' 
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                  >
                    {task.status === 'completed' ? (
                      <>
                        <PauseIcon className="h-4 w-4 mr-2" />
                        Возобновить
                      </>
                    ) : (
                      <>
                        <CheckIcon className="h-4 w-4 mr-2" />
                        Завершить
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 rounded-lg font-medium transition-colors flex items-center bg-blue-100 text-blue-700 hover:bg-blue-200"
                  >
                    <PencilIcon className="h-4 w-4 mr-2" />
                    Редактировать
                  </button>
                </>
              )}
              
              {isEditing && (
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 rounded-lg font-medium transition-colors flex items-center bg-gray-100 text-gray-700 hover:bg-gray-200"
                >
                  <XMarkIcon className="h-4 w-4 mr-2" />
                  Отмена
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success/Error Messages */}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg flex items-center">
            <CheckIcon className="h-5 w-5 mr-2" />
            {success}
          </div>
        )}
        
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              {!isEditing ? (
                /* View Mode */
                <>
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">{task.title}</h2>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span className={`px-3 py-1 rounded-full border ${getPriorityColor(task.priority)}`}>
                          {getPriorityText(task.priority)}
                        </span>
                        <span className="flex items-center">
                          <TagIcon className="h-4 w-4 mr-1" />
                          {getTypeText(task.task_type)}
                        </span>
                      </div>
                    </div>
                    <div 
                      className="w-6 h-6 rounded-full border-2 border-gray-300"
                      style={{ backgroundColor: task.color }}
                    ></div>
                  </div>

                  {task.description && (
                    <div className="mb-6">
                      <h3 className="font-semibold text-gray-900 mb-2">Описание</h3>
                      <p className="text-gray-700 whitespace-pre-wrap">{task.description}</p>
                    </div>
                  )}
                </>
              ) : (
                /* Edit Mode */
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Название задачи
                    </label>
                    <input
                      {...register('title', { required: 'Название обязательно' })}
                      className="input"
                      placeholder="Введите название задачи"
                    />
                    {errors.title && (
                      <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Описание
                    </label>
                    <textarea
                      {...register('description')}
                      rows={4}
                      className="input"
                      placeholder="Введите описание задачи"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Тип задачи
                      </label>
                      <select {...register('task_type', { required: 'Тип обязателен' })} className="input">
                        <option value="coursework">Курсовая</option>
                        <option value="exam">Экзамен</option>
                        <option value="laboratory">Лабораторная</option>
                        <option value="lecture">Лекция</option>
                        <option value="seminar">Семинар</option>
                        <option value="project">Проект</option>
                        <option value="homework">Домашнее задание</option>
                        <option value="other">Другое</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Приоритет
                      </label>
                      <select {...register('priority', { required: 'Приоритет обязателен' })} className="input">
                        <option value="current">Текущая</option>
                        <option value="semester_debt">Семестровый долг</option>
                        <option value="yearly_debt">Годовой долг</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Дедлайн
                      </label>
                      <input
                        {...register('deadline', { required: 'Дедлайн обязателен' })}
                        type="date"
                        className="input"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Цвет
                      </label>
                      <input
                        {...register('color')}
                        type="color"
                        className="input h-12"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3">
                    <button type="submit" className="btn btn-primary">
                      Сохранить изменения
                    </button>
                  </div>
                </form>
              )}

              {/* Progress Section */}
              {!isEditing && task.steps && task.steps.length > 0 && (
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <TaskProgress 
                    steps={task.steps}
                    onStepToggle={toggleStepStatus}
                    stepsLoading={stepsLoading}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Информация о задаче</h3>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <CalendarDaysIcon className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Дедлайн</p>
                    <p className={`text-sm ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                      {new Date(task.deadline).toLocaleDateString('ru-RU', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                      {isOverdue && ' (просрочена)'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <FlagIcon className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Статус</p>
                    <p className={`text-sm ${
                      task.status === 'completed' ? 'text-green-600' : 
                      task.status === 'in_progress' ? 'text-blue-600' : 
                      'text-gray-600'
                    }`}>
                      {task.status === 'completed' ? 'Выполнена' : 
                       task.status === 'in_progress' ? 'В работе' : 
                       'Ожидает выполнения'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <ClockIcon className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Создана</p>
                    <p className="text-sm text-gray-600">
                      {new Date(task.created_at).toLocaleDateString('ru-RU')}
                    </p>
                  </div>
                </div>

                {task.steps && task.steps.length > 0 && (
                  <div className="flex items-center space-x-3">
                    <PlayIcon className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Этапы</p>
                      <p className="text-sm text-gray-600">
                        {task.steps.filter(s => s.is_completed).length} из {task.steps.length} выполнено
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 