'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { tokenUtils, authAPI, tasksAPI, type User, type Task, type TaskStats } from '@/lib/api';
import { dateUtils, taskUtils } from '@/lib/utils';
import { 
  CalendarDaysIcon,
  CalendarIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  PlusIcon,
  UserIcon,
  Cog6ToothIcon,
  ArrowRightIcon,
  ArrowRightOnRectangleIcon,
  ChartBarIcon,
  FireIcon,
  TrophyIcon,
  StarIcon,
  FlagIcon,
  ListBulletIcon,
  AcademicCapIcon,
  BookOpenIcon,
  ComputerDesktopIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { 
  TrophyIcon as TrophyIconSolid
} from '@heroicons/react/24/solid';

const getTaskTypeIcon = (type: string) => {
  const iconClass = "h-4 w-4";
  switch (type) {
    case 'coursework': return <AcademicCapIcon className={iconClass} />;
    case 'exam': return <BookOpenIcon className={iconClass} />;
    case 'laboratory': return <ComputerDesktopIcon className={iconClass} />;
    case 'project': return <DocumentTextIcon className={iconClass} />;
    default: return <DocumentTextIcon className={iconClass} />;
  }
};

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<TaskStats | null>(null);
  const [upcomingTasks, setUpcomingTasks] = useState<Task[]>([]);
  const [overdueTasks, setOverdueTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tokenUtils.isAuthenticated()) {
      router.push('/login');
      return;
    }

    loadDashboardData();
  }, [router]);

  const loadDashboardData = async () => {
    try {
      const [userResponse, statsResponse, upcomingResponse, overdueResponse] = await Promise.all([
        authAPI.getCurrentUser(),
        tasksAPI.getTaskStats(),
        tasksAPI.getUpcomingTasks(7),
        tasksAPI.getOverdueTasks(),
      ]);

      setUser(userResponse);
      setStats(statsResponse);
      setUpcomingTasks(upcomingResponse);
      setOverdueTasks(overdueResponse);
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
    } finally {
      setLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Доброе утро';
    if (hour < 17) return 'Добрый день';
    return 'Добрый вечер';
  };

  const getMotivationalMessage = () => {
    if (!stats) return '';
    const completionRate = stats.total_tasks > 0 ? (stats.completed_tasks / stats.total_tasks) * 100 : 0;
    
    if (completionRate >= 80) return 'Отличная работа! Продолжайте в том же духе! 🔥';
    if (completionRate >= 60) return 'Хорошие результаты! Ещё немного усилий! 💪';
    if (completionRate >= 40) return 'Неплохо! Давайте ускорим темп! ⚡';
    if (completionRate >= 20) return 'Начало положено! Время активных действий! 🚀';
    return 'Время начинать! Вы справитесь! ✨';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
          <p className="text-blue-600 font-medium">Загрузка панели управления...</p>
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
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                  <TrophyIcon className="h-6 w-6 text-white" />
                </div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Студенческий планировщик
                </h1>
              </div>
            </div>
            <nav className="flex items-center space-x-1">
              <Link 
                href="/tasks" 
                className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-lg transition-all duration-200"
                title="Задачи"
              >
                <ListBulletIcon className="h-5 w-5" />
                <span className="hidden sm:block">Задачи</span>
              </Link>
              <Link 
                href="/calendar" 
                className="flex items-center space-x-2 text-gray-600 hover:text-green-600 hover:bg-green-50 px-3 py-2 rounded-lg transition-all duration-200"
                title="Календарь"
              >
                <CalendarIcon className="h-5 w-5" />
                <span className="hidden sm:block">Календарь</span>
              </Link>
              <Link 
                href="/profile" 
                className="flex items-center space-x-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 px-3 py-2 rounded-lg transition-all duration-200"
                title="Профиль"
              >
                <UserIcon className="h-5 w-5" />
                <span className="hidden sm:block">Профиль</span>
              </Link>
              <button
                onClick={() => {
                  tokenUtils.removeToken();
                  router.push('/login');
                }}
                className="flex items-center space-x-2 text-gray-600 hover:text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg transition-all duration-200"
                title="Выход"
              >
                <ArrowRightOnRectangleIcon className="h-5 w-5" />
                <span className="hidden sm:block">Выход</span>
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-2xl shadow-lg mb-4">
            <StarIcon className="h-5 w-5" />
            <span className="font-medium">{getGreeting()}, {user?.full_name || user?.email?.split('@')[0]}!</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {dateUtils.format(new Date(), 'dd MMMM yyyy')}
          </h2>
          <p className="text-lg text-gray-600 mb-4">
            {getMotivationalMessage()}
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          <Link
            href="/tasks/new"
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center space-x-2"
          >
            <PlusIcon className="h-5 w-5" />
            <span>Добавить задачу</span>
          </Link>
          
          <Link
            href="/calendar"
            className="bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center space-x-2"
          >
            <CalendarIcon className="h-5 w-5" />
            <span>Открыть календарь</span>
          </Link>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 gap-6 mb-8">
            <div className="relative overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-xl group hover:shadow-2xl transition-all duration-300">
              <div className="absolute top-0 right-0 -mt-6 -mr-6 h-24 w-24 bg-white/10 rounded-full group-hover:scale-110 transition-transform duration-300"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-3">
                  <ChartBarIcon className="h-8 w-8 text-blue-100" />
                  <span className="text-3xl font-bold">{stats.total_tasks}</span>
                </div>
                <h3 className="font-semibold text-lg">Всего задач</h3>
                <p className="text-blue-100 text-sm">в вашем планировщике</p>
              </div>
            </div>
            
            <div className="relative overflow-hidden bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-xl group hover:shadow-2xl transition-all duration-300">
              <div className="absolute top-0 right-0 -mt-6 -mr-6 h-24 w-24 bg-white/10 rounded-full group-hover:scale-110 transition-transform duration-300"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-3">
                  <CheckCircleIcon className="h-8 w-8 text-green-100" />
                  <span className="text-3xl font-bold">{stats.completed_tasks}</span>
                </div>
                <h3 className="font-semibold text-lg">Выполнено</h3>
                <p className="text-green-100 text-sm">отличная работа!</p>
              </div>
            </div>
            
            <div className="relative overflow-hidden bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-6 text-white shadow-xl group hover:shadow-2xl transition-all duration-300">
              <div className="absolute top-0 right-0 -mt-6 -mr-6 h-24 w-24 bg-white/10 rounded-full group-hover:scale-110 transition-transform duration-300"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-3">
                  <ExclamationTriangleIcon className="h-8 w-8 text-red-100" />
                  <span className="text-3xl font-bold">{stats.overdue_tasks}</span>
                </div>
                <h3 className="font-semibold text-lg">Просрочено</h3>
                <p className="text-red-100 text-sm">требует внимания</p>
              </div>
            </div>
            
            <div className="relative overflow-hidden bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 text-white shadow-xl group hover:shadow-2xl transition-all duration-300">
              <div className="absolute top-0 right-0 -mt-6 -mr-6 h-24 w-24 bg-white/10 rounded-full group-hover:scale-110 transition-transform duration-300"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-3">
                  <FireIcon className="h-8 w-8 text-orange-100" />
                  <span className="text-3xl font-bold">{stats.yearly_debts + stats.semester_debts}</span>
                </div>
                <h3 className="font-semibold text-lg">Долги</h3>
                <p className="text-orange-100 text-sm">нужно закрыть</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upcoming Tasks */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                  <ClockIcon className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Ближайшие задачи</h3>
              </div>
              <Link href="/tasks" className="text-blue-600 hover:text-blue-700 text-sm font-medium bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-lg transition-all">
                Все задачи →
              </Link>
            </div>
            
            {upcomingTasks.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircleIcon className="h-8 w-8 text-blue-600" />
                </div>
                <p className="text-gray-500 mb-4">Нет ближайших задач</p>
                <Link href="/tasks/new" className="text-blue-600 hover:text-blue-700 font-medium">
                  Создать новую задачу
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingTasks.slice(0, 5).map((task) => (
                  <div key={task.id} className="group bg-white/80 backdrop-blur-sm border border-white/30 rounded-xl p-4 hover:bg-white hover:shadow-md transition-all duration-200">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                        {getTaskTypeIcon(task.task_type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                          {task.title}
                        </h4>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${taskUtils.getPriorityColor(task.priority)}`}>
                            {taskUtils.getPriorityLabel(task.priority)}
                          </span>
                          <span className="text-sm text-gray-500">
                            {dateUtils.formatRelative(task.deadline)}
                          </span>
                        </div>
                      </div>
                      <div 
                        className="w-3 h-3 rounded-full shadow-sm" 
                        style={{ backgroundColor: task.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Overdue Tasks */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-br from-red-500 to-pink-600 rounded-lg">
                  <ExclamationTriangleIcon className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Просроченные задачи</h3>
              </div>
              <Link href="/tasks?status=overdue" className="text-red-600 hover:text-red-700 text-sm font-medium bg-red-50 hover:bg-red-100 px-3 py-1 rounded-lg transition-all">
                Все долги →
              </Link>
            </div>
            
            {overdueTasks.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircleIcon className="h-8 w-8 text-green-600" />
                </div>
                <p className="text-green-600 font-medium mb-2">Отлично!</p>
                <p className="text-gray-500">Нет просроченных задач</p>
              </div>
            ) : (
              <div className="space-y-3">
                {overdueTasks.slice(0, 5).map((task) => (
                  <div key={task.id} className="group bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-xl p-4 hover:shadow-md transition-all duration-200">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-gradient-to-br from-red-500 to-pink-600 rounded-lg">
                        {getTaskTypeIcon(task.task_type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 group-hover:text-red-600 transition-colors">
                          {task.title}
                        </h4>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${taskUtils.getPriorityColor(task.priority)}`}>
                            {taskUtils.getPriorityLabel(task.priority)}
                          </span>
                          <span className="text-sm text-red-600 font-medium">
                            Просрочено на {Math.abs(taskUtils.getDaysUntilDeadline(task.deadline))} дн.
                          </span>
                        </div>
                      </div>
                      <div 
                        className="w-3 h-3 rounded-full shadow-sm" 
                        style={{ backgroundColor: task.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
} 