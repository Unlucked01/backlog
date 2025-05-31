'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { goalsAPI, Goal } from '@/lib/api';
import { 
  HomeIcon,
  FlagIcon,
  CheckIcon,
  ClockIcon,
  PlusIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { 
  CheckCircleIcon,
  FireIcon
} from '@heroicons/react/24/solid';

export default function GoalsPage() {
  const router = useRouter();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = async () => {
    try {
      setLoading(true);
      const goalsData = await goalsAPI.getGoals();
      setGoals(goalsData);
    } catch (err: any) {
      setError('Ошибка загрузки целей');
    } finally {
      setLoading(false);
    }
  };

  const updateGoalProgress = async (goalId: number, increment: number = 1) => {
    try {
      const updatedGoal = await goalsAPI.updateGoalProgress(goalId, increment);
      setGoals(goals.map(goal => goal.id === goalId ? updatedGoal : goal));
    } catch (err: any) {
      setError('Ошибка обновления прогресса цели');
    }
  };

  const getGoalTypeLabel = (type: string): string => {
    switch (type) {
      case 'semester': return 'Семестр';
      case 'monthly': return 'Месяц';
      case 'weekly': return 'Неделя';
      case 'custom': return 'Персональная';
      default: return type;
    }
  };

  const getGoalTypeColor = (type: string): string => {
    switch (type) {
      case 'semester': return 'bg-purple-100 text-purple-800';
      case 'monthly': return 'bg-blue-100 text-blue-800';
      case 'weekly': return 'bg-green-100 text-green-800';
      case 'custom': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getProgressPercentage = (goal: Goal): number => {
    return Math.min(100, Math.round((goal.current_value / goal.target_value) * 100));
  };

  const isGoalExpired = (goal: Goal): boolean => {
    return new Date(goal.end_date) < new Date() && !goal.is_completed;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-sm border-b border-green-100 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center h-16">
              <Link href="/" className="mr-4 text-gray-600 hover:text-green-600 transition-colors">
                <HomeIcon className="h-6 w-6" />
              </Link>
              <FlagIcon className="h-6 w-6 text-green-600 mr-3" />
              <h1 className="text-xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                Цели
              </h1>
            </div>
          </div>
        </header>
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-4 border-green-200 border-t-green-600 mx-auto mb-4"></div>
            <p className="text-green-600 font-medium">Загрузка целей...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-green-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="mr-4 text-gray-600 hover:text-green-600 transition-colors">
                <HomeIcon className="h-6 w-6" />
              </Link>
              <FlagIcon className="h-6 w-6 text-green-600 mr-3" />
              <h1 className="text-xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                Цели
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <button className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                <PlusIcon className="h-5 w-5 mr-2" />
                Новая цель
              </button>
            </div>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 flex items-center">
                <FlagIcon className="h-10 w-10 text-green-600 mr-4" />
                Мои цели
              </h1>
              <p className="text-lg text-gray-600 mt-2">
                Ставьте цели и отслеживайте свой прогресс
              </p>
            </div>
            
            <div className="text-right">
              <div className="text-3xl font-bold text-green-600">{goals.filter(g => g.is_completed).length}</div>
              <div className="text-sm text-gray-600">выполнено</div>
              <div className="text-sm text-gray-500">
                из {goals.length} целей
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Goals Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {goals.map((goal) => {
            const progressPercentage = getProgressPercentage(goal);
            const expired = isGoalExpired(goal);
            
            return (
              <div
                key={goal.id}
                className={`relative group bg-white rounded-2xl p-6 border-2 transition-all duration-300 hover:shadow-xl ${
                  goal.is_completed 
                    ? 'border-green-300 bg-gradient-to-br from-green-50 to-emerald-50' 
                    : expired
                    ? 'border-red-300 bg-gradient-to-br from-red-50 to-pink-50'
                    : 'border-gray-200 hover:border-green-300'
                }`}
              >
                {/* Status Badge */}
                <div className="absolute top-4 right-4">
                  {goal.is_completed ? (
                    <div className="bg-green-500 text-white rounded-full p-2">
                      <CheckCircleIcon className="h-4 w-4" />
                    </div>
                  ) : expired ? (
                    <div className="bg-red-500 text-white rounded-full p-2">
                      <ClockIcon className="h-4 w-4" />
                    </div>
                  ) : (
                    <div className="bg-blue-500 text-white rounded-full p-2">
                      <FireIcon className="h-4 w-4" />
                    </div>
                  )}
                </div>

                <div className="mb-4">
                  {/* Goal Type */}
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getGoalTypeColor(goal.goal_type)}`}>
                    {getGoalTypeLabel(goal.goal_type)}
                  </span>
                  
                  {/* Title */}
                  <h3 className={`text-xl font-bold mt-3 mb-2 ${
                    goal.is_completed ? 'text-green-800' : expired ? 'text-red-800' : 'text-gray-900'
                  }`}>
                    {goal.title}
                  </h3>
                  
                  {/* Description */}
                  <p className={`text-sm mb-4 ${
                    goal.is_completed ? 'text-green-700' : expired ? 'text-red-700' : 'text-gray-600'
                  }`}>
                    {goal.description}
                  </p>
                </div>
                
                {/* Progress */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Прогресс</span>
                    <span>{goal.current_value} / {goal.target_value}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className={`h-3 rounded-full transition-all duration-300 ${
                        goal.is_completed 
                          ? 'bg-gradient-to-r from-green-500 to-emerald-600' 
                          : expired
                          ? 'bg-gradient-to-r from-red-500 to-pink-600'
                          : 'bg-gradient-to-r from-blue-500 to-green-600'
                      }`}
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                  <div className="text-center mt-2">
                    <span className={`text-sm font-semibold ${
                      goal.is_completed ? 'text-green-600' : expired ? 'text-red-600' : 'text-blue-600'
                    }`}>
                      {progressPercentage}%
                    </span>
                  </div>
                </div>
                
                {/* Dates */}
                <div className="text-xs text-gray-500 mb-4">
                  <div className="flex justify-between">
                    <span>Начало: {new Date(goal.start_date).toLocaleDateString('ru-RU')}</span>
                    <span>Конец: {new Date(goal.end_date).toLocaleDateString('ru-RU')}</span>
                  </div>
                </div>
                
                {/* Actions */}
                {!goal.is_completed && !expired && (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => updateGoalProgress(goal.id, 1)}
                      className="flex-1 px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                    >
                      +1
                    </button>
                    <button
                      onClick={() => updateGoalProgress(goal.id, -1)}
                      className="flex-1 px-3 py-2 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      -1
                    </button>
                  </div>
                )}
                
                {/* Completed Badge */}
                {goal.is_completed && (
                  <div className="text-center">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-200 text-green-800">
                      <CheckIcon className="h-4 w-4 mr-1" />
                      Выполнено!
                    </span>
                  </div>
                )}
                
                {/* Expired Badge */}
                {expired && (
                  <div className="text-center">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-200 text-red-800">
                      <ClockIcon className="h-4 w-4 mr-1" />
                      Просрочено
                    </span>
                  </div>
                )}
                
                {/* Hover Effect */}
                <div className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
                  goal.is_completed 
                    ? 'bg-gradient-to-r from-green-200/20 to-emerald-200/20'
                    : expired
                    ? 'bg-gradient-to-r from-red-200/20 to-pink-200/20'
                    : 'bg-gradient-to-r from-blue-200/20 to-green-200/20'
                }`}></div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {goals.length === 0 && (
          <div className="text-center py-16">
            <FlagIcon className="h-24 w-24 mx-auto mb-6 text-gray-300" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">Пока нет целей</h3>
            <p className="text-gray-500 max-w-md mx-auto mb-6">
              Создайте свою первую цель и начните отслеживать прогресс к достижению ваших планов!
            </p>
            <button className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
              Создать первую цель
            </button>
          </div>
        )}

        {/* Summary */}
        {goals.length > 0 && (
          <div className="mt-12 bg-white rounded-2xl p-8 border border-gray-200">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">Статистика целей</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{goals.length}</div>
                <div className="text-sm text-gray-600">Всего целей</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{goals.filter(g => g.is_completed).length}</div>
                <div className="text-sm text-gray-600">Выполнено</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600">{goals.filter(g => !g.is_completed && !isGoalExpired(g)).length}</div>
                <div className="text-sm text-gray-600">В процессе</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-red-600">{goals.filter(g => isGoalExpired(g)).length}</div>
                <div className="text-sm text-gray-600">Просрочено</div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
} 