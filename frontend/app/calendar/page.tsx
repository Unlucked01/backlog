'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { tokenUtils, tasksAPI, type Task } from '@/lib/api';
import { dateUtils, taskUtils } from '@/lib/utils';
import { 
  HomeIcon,
  CalendarIcon,
  PlusIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  AcademicCapIcon,
  BookOpenIcon,
  ComputerDesktopIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

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

export default function CalendarPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedView, setSelectedView] = useState<'week' | 'month'>('week');

  useEffect(() => {
    if (!tokenUtils.isAuthenticated()) {
      router.push('/login');
      return;
    }
    loadTasks();
  }, [router]);

  const loadTasks = async () => {
    try {
      const tasksData = await tasksAPI.getTasks();
      setTasks(tasksData);
    } catch (error) {
      console.error('Ошибка загрузки задач:', error);
    } finally {
      setLoading(false);
    }
  };

  // Группировка задач по дням
  const groupTasksByDate = (tasks: Task[]) => {
    const grouped: { [key: string]: Task[] } = {};
    
    tasks.forEach(task => {
      const date = new Date(task.deadline).toDateString();
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(task);
    });
    
    return grouped;
  };

  // Получение дней для отображения
  const getDaysToShow = () => {
    const days = [];
    const daysCount = selectedView === 'week' ? 7 : 30;
    for (let i = 0; i < daysCount; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      days.push(date);
    }
    return days;
  };

  const groupedTasks = groupTasksByDate(tasks);
  const daysToShow = getDaysToShow();

  const overdueTasks = tasks.filter(task => 
    new Date(task.deadline) < new Date() && task.status !== 'completed'
  );

  const todayTasks = groupedTasks[new Date().toDateString()] || [];
  const weekTasks = daysToShow.slice(0, 7).reduce((count, date) => {
    return count + (groupedTasks[date.toDateString()]?.length || 0);
  }, 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
          <p className="text-blue-600 font-medium">Загрузка календаря...</p>
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
                <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                  <CalendarIcon className="h-6 w-6 text-white" />
                </div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Календарь задач
                </h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {/* View Toggle */}
              <div className="bg-gray-100 p-1 rounded-lg">
                <button
                  onClick={() => setSelectedView('week')}
                  className={`px-3 py-1 rounded text-sm font-medium transition-all ${
                    selectedView === 'week' 
                      ? 'bg-white text-blue-600 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Неделя
                </button>
                <button
                  onClick={() => setSelectedView('month')}
                  className={`px-3 py-1 rounded text-sm font-medium transition-all ${
                    selectedView === 'month' 
                      ? 'bg-white text-blue-600 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Месяц
                </button>
              </div>
              
              <Link href="/tasks/new" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center space-x-2">
                <PlusIcon className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="relative overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-xl">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 bg-white/10 rounded-full"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-2">
                <ClockIcon className="h-8 w-8 text-blue-100" />
                <span className="text-3xl font-bold">{todayTasks.length}</span>
              </div>
              <h3 className="text-lg font-semibold">Сегодня</h3>
              <p className="text-blue-100">задач на сегодня</p>
            </div>
          </div>
          
          <div className="relative overflow-hidden bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 text-white shadow-xl">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 bg-white/10 rounded-full"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-2">
                <CalendarIcon className="h-8 w-8 text-orange-100" />
                <span className="text-3xl font-bold">{weekTasks}</span>
              </div>
              <h3 className="text-lg font-semibold">На неделе</h3>
              <p className="text-orange-100">задач запланировано</p>
            </div>
          </div>
          
          <div className="relative overflow-hidden bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-6 text-white shadow-xl">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 bg-white/10 rounded-full"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-2">
                <ExclamationTriangleIcon className="h-8 w-8 text-red-100" />
                <span className="text-3xl font-bold">{overdueTasks.length}</span>
              </div>
              <h3 className="text-lg font-semibold">Просрочено</h3>
              <p className="text-red-100">требует внимания</p>
            </div>
          </div>
        </div>

        {/* Calendar View */}
        <div className="bg-white/70 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-900">
              {selectedView === 'week' ? 'Эта неделя' : 'Этот месяц'}
            </h2>
            <div className="text-sm text-gray-500">
              {dateUtils.format(new Date(), 'MMMM yyyy')}
            </div>
          </div>
          
          <div className={`grid gap-4 ${selectedView === 'week' ? 'grid-cols-1 lg:grid-cols-7' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
            {daysToShow.map((date, index) => {
              const dateKey = date.toDateString();
              const dayTasks = groupedTasks[dateKey] || [];
              const isToday = dateKey === new Date().toDateString();
              const isPast = date < new Date() && !isToday;
              const isWeekend = date.getDay() === 0 || date.getDay() === 6;

              return (
                <div 
                  key={dateKey} 
                  className={`group transition-all duration-300 hover:scale-[1.02] ${
                    selectedView === 'week' ? 'min-h-[200px]' : 'min-h-[150px]'
                  } ${
                    isToday 
                      ? 'bg-gradient-to-br from-blue-100 to-purple-100 border-2 border-blue-300 shadow-lg' 
                      : isPast 
                        ? 'bg-gray-50 border border-gray-200' 
                        : isWeekend
                          ? 'bg-gradient-to-br from-green-50 to-green-100 border border-green-200'
                          : 'bg-white border border-gray-200 hover:border-blue-300'
                  } rounded-2xl p-4 shadow-md hover:shadow-lg`}
                >
                  {/* Date Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className={`font-bold text-lg ${
                        isToday ? 'text-blue-700' : isPast ? 'text-gray-500' : 'text-gray-900'
                      }`}>
                        {date.getDate()}
                      </h3>
                      <p className={`text-sm ${
                        isToday ? 'text-blue-600' : isPast ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {dateUtils.format(date, 'EEEE')}
                      </p>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {isToday && (
                        <span className="px-2 py-1 bg-blue-500 text-white text-xs font-semibold rounded-full animate-pulse">
                          Сегодня
                        </span>
                      )}
                      {dayTasks.length > 0 && (
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          isToday 
                            ? 'bg-blue-200 text-blue-800' 
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {dayTasks.length}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Tasks */}
                  <div className="space-y-1.5 overflow-hidden">
                    {dayTasks.length === 0 ? (
                      <p className="text-gray-400 text-sm text-center py-4">
                        {isPast ? 'Задач не было' : 'Задач нет'}
                      </p>
                    ) : (
                      <>
                        {dayTasks.slice(0, selectedView === 'week' ? 3 : 2).map((task) => (
                          <Link href={`/tasks/${task.id}`} key={task.id}>
                            <div 
                              className="group/task bg-white/80 backdrop-blur-sm border border-white/30 rounded-lg p-2 transition-all duration-200 hover:bg-white hover:shadow-md cursor-pointer"
                            >
                              <div className="flex items-center space-x-2">
                                <div 
                                  className="w-2.5 h-2.5 rounded-full shadow-sm flex-shrink-0" 
                                  style={{ backgroundColor: task.color }}
                                />
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-medium text-gray-900 text-xs leading-tight group-hover/task:text-blue-600 transition-colors truncate">
                                    {task.title}
                                  </h4>
                                  <div className="flex items-center space-x-1 mt-0.5">
                                    <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${taskUtils.getPriorityColor(task.priority)}`}>
                                      {taskUtils.getPriorityLabel(task.priority).slice(0, 3)}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      {dateUtils.format(new Date(task.deadline), 'HH:mm')}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </Link>
                        ))}
                        
                        {dayTasks.length > (selectedView === 'week' ? 3 : 2) && (
                          <Link 
                            href={`/tasks?date=${dateKey}`}
                            className="block text-center text-blue-600 hover:text-blue-700 text-xs font-medium py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                          >
                            +{dayTasks.length - (selectedView === 'week' ? 3 : 2)} еще
                          </Link>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Upcoming Highlights */}
        {overdueTasks.length > 0 && (
          <div className="mt-8 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-2xl p-6">
            <div className="flex items-center space-x-3 mb-4">
              <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
              <h3 className="text-lg font-semibold text-red-800">Просроченные задачи</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {overdueTasks.slice(0, 6).map((task) => (
                <Link href={`/tasks/${task.id}`} key={task.id}>
                  <div className="bg-white rounded-xl p-4 border border-red-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                    <div className="flex items-center space-x-2 mb-2">
                      {getTaskTypeIcon(task.task_type)}
                      <h4 className="font-medium text-gray-900">{task.title}</h4>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${taskUtils.getPriorityColor(task.priority)}`}>
                        {taskUtils.getPriorityLabel(task.priority)}
                      </span>
                      <span className="text-red-600 font-medium">
                        -{Math.abs(Math.floor((new Date().getTime() - new Date(task.deadline).getTime()) / (1000 * 60 * 60 * 24)))} дн.
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
} 