'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { tokenUtils, tasksAPI, type Task } from '@/lib/api';
import { dateUtils, taskUtils, TASK_TYPES, TASK_PRIORITIES, TASK_STATUSES } from '@/lib/utils';
import { 
  PlusIcon, 
  FunnelIcon,
  PencilIcon,
  TrashIcon,
  CheckIcon,
  HomeIcon,
  AcademicCapIcon,
  BookOpenIcon,
  ComputerDesktopIcon,
  DocumentTextIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

const getTaskTypeIcon = (type: string) => {
  const iconClass = "h-5 w-5";
  switch (type) {
    case 'coursework': return <AcademicCapIcon className={iconClass} />;
    case 'exam': return <BookOpenIcon className={iconClass} />;
    case 'laboratory': return <ComputerDesktopIcon className={iconClass} />;
    case 'project': return <DocumentTextIcon className={iconClass} />;
    default: return <DocumentTextIcon className={iconClass} />;
  }
};

export default function TasksPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    task_type: '',
    priority: '',
    status: ''
  });

  useEffect(() => {
    if (!tokenUtils.isAuthenticated()) {
      router.push('/login');
      return;
    }
    
    // Читаем параметры из URL при первой загрузке
    const urlFilters = {
      task_type: searchParams.get('task_type') || '',
      priority: searchParams.get('priority') || '',
      status: searchParams.get('status') || ''
    };
    
    // Если есть параметры в URL, устанавливаем их в фильтры
    if (urlFilters.task_type || urlFilters.priority || urlFilters.status) {
      setFilters(urlFilters);
    }
  }, [router, searchParams]);

  useEffect(() => {
    if (!tokenUtils.isAuthenticated()) return;
    loadTasks();
  }, [filters]);

  const loadTasks = async () => {
    try {
      const tasksData = await tasksAPI.getTasks(filters);
      setTasks(tasksData);
    } catch (error) {
      console.error('Ошибка загрузки задач:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (taskId: number, newStatus: string) => {
    try {
      await tasksAPI.updateTask(taskId, { status: newStatus as any });
      loadTasks();
    } catch (error) {
      console.error('Ошибка обновления статуса:', error);
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    if (confirm('Вы уверены, что хотите удалить эту задачу?')) {
      try {
        await tasksAPI.deleteTask(taskId);
        loadTasks();
      } catch (error) {
        console.error('Ошибка удаления задачи:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
          <p className="text-blue-600 font-medium">Загрузка задач...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-lg border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/" className="text-gray-600 hover:text-blue-600 transition-colors p-2 rounded-lg hover:bg-blue-50">
                <HomeIcon className="h-6 w-6" />
              </Link>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-r from-green-500 to-blue-600 rounded-lg">
                  <CheckCircleIcon className="h-6 w-6 text-white" />
                </div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                  Мои задачи
                </h1>
              </div>
            </div>
            <Link href="/tasks/new" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center space-x-2">
              <PlusIcon className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 mb-8">
          <div className="flex items-center space-x-4 mb-6">
            <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg">
              <FunnelIcon className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Фильтры</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">Тип задачи</label>
              <select
                value={filters.task_type}
                onChange={(e) => setFilters({...filters, task_type: e.target.value})}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                <option value="">Все типы</option>
                {TASK_TYPES.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">Приоритет</label>
              <select
                value={filters.priority}
                onChange={(e) => setFilters({...filters, priority: e.target.value})}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                <option value="">Все приоритеты</option>
                {TASK_PRIORITIES.map(priority => (
                  <option key={priority.value} value={priority.value}>{priority.label}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">Статус</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({...filters, status: e.target.value})}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                <option value="">Все статусы</option>
                {TASK_STATUSES.map(status => (
                  <option key={status.value} value={status.value}>{status.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Tasks Grid */}
        <div className="space-y-4">
          {tasks.length === 0 ? (
            <div className="text-center py-16 bg-white/50 backdrop-blur-sm rounded-2xl border border-white/20">
              <div className="max-w-md mx-auto">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircleIcon className="h-12 w-12 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Задач не найдено</h3>
                <p className="text-gray-600 mb-6">Создайте свою первую задачу, чтобы начать планирование</p>
                <Link href="/tasks/new" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 shadow-lg">
                  Создать задачу
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {tasks.map((task) => {
                const isOverdue = new Date(task.deadline) < new Date() && task.status !== 'completed';
                const isUrgent = task.priority === 'yearly_debt' || task.priority === 'semester_debt';
                
                return (
                  <Link href={`/tasks/${task.id}`} key={task.id}>
                    <div className={`group bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border transition-all duration-300 hover:shadow-xl hover:scale-[1.02] cursor-pointer ${
                      isOverdue ? 'border-red-300 bg-gradient-to-br from-red-50 to-red-100' :
                      isUrgent ? 'border-orange-300 bg-gradient-to-br from-orange-50 to-orange-100' :
                      'border-white/30 hover:border-blue-300'
                    } p-6`}>
                      
                      {/* Task Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                            {getTaskTypeIcon(task.task_type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-gray-900 text-lg leading-tight group-hover:text-blue-600 transition-colors">
                              {task.title}
                            </h3>
                            <p className="text-sm text-gray-600 mt-1">
                              {taskUtils.getTypeLabel(task.task_type)}
                            </p>
                          </div>
                        </div>
                        
                        <div 
                          className="w-4 h-4 rounded-full shadow-sm flex-shrink-0" 
                          style={{ backgroundColor: task.color }}
                        />
                      </div>

                      {/* Description */}
                      {task.description && (
                        <p className="text-gray-700 text-sm mb-4 line-clamp-2">
                          {task.description}
                        </p>
                      )}

                      {/* Badges */}
                      <div className="flex flex-wrap items-center gap-2 mb-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${taskUtils.getPriorityColor(task.priority)}`}>
                          {taskUtils.getPriorityLabel(task.priority)}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${taskUtils.getStatusColor(task.status)}`}>
                          {task.status === 'completed' && <CheckIcon className="inline h-3 w-3 mr-1" />}
                          {taskUtils.getStatusLabel(task.status)}
                        </span>
                      </div>

                      {/* Steps Progress */}
                      {task.steps && task.steps.length > 0 && (
                        <div className="mb-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">Прогресс</span>
                            <span className="text-sm text-gray-500">
                              {task.steps.filter(s => s.is_completed).length}/{task.steps.length}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all duration-300"
                              style={{ 
                                width: `${(task.steps.filter(s => s.is_completed).length / task.steps.length) * 100}%` 
                              }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Deadline */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-2 text-sm">
                          <ClockIcon className="h-4 w-4 text-gray-400" />
                          <span className={`font-medium ${isOverdue ? 'text-red-600' : 'text-gray-600'}`}>
                            {isOverdue ? 'Просрочено' : dateUtils.formatRelative(task.deadline)}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {dateUtils.format(task.created_at)}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-between pt-4 border-t border-gray-200" onClick={(e) => e.preventDefault()}>
                        <select
                          value={task.status}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleStatusChange(task.id, e.target.value);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          {TASK_STATUSES.map(status => (
                            <option key={status.value} value={status.value}>{status.label}</option>
                          ))}
                        </select>
                        
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              router.push(`/tasks/${task.id}`);
                            }}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                            title="Просмотр"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </button>
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              router.push(`/tasks/${task.id}?edit=true`);
                            }}
                            className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all"
                            title="Редактировать"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              handleDeleteTask(task.id);
                            }}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            title="Удалить"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
} 