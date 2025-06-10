'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { achievementsAPI, Achievement, UserAchievement, UserStats } from '@/lib/api';
import { 
  TrophyIcon as TrophyIconSolid,
  CheckIcon,
  LockClosedIcon,
  InformationCircleIcon,
  HomeIcon
} from '@heroicons/react/24/solid';

export default function AchievementsPage() {
  const router = useRouter();
  const [allAchievements, setAllAchievements] = useState<Achievement[]>([]);
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [achievements, userAch, userStats] = await Promise.all([
        achievementsAPI.getAllAchievements(),
        achievementsAPI.getUserAchievements(),
        achievementsAPI.getUserStats(),
      ]);
      setAllAchievements(achievements);
      setUserAchievements(userAch);
      setStats(userStats);
    } catch (err: any) {
      setError('Ошибка загрузки достижений');
    } finally {
      setLoading(false);
    }
  };

  const getProgressValue = (achievement: Achievement): number => {
    if (!stats) return 0;
    
    switch (achievement.condition_type) {
      case 'tasks_completed':
        return stats.completed_tasks;
      case 'tasks_created':
        return stats.total_tasks;
      case 'streak_days':
        return stats.current_streak;
      case 'goals_completed':
        return stats.completed_goals;
      default:
        return 0;
    }
  };

  const getConditionDescription = (achievement: Achievement): string => {
    switch (achievement.condition_type) {
      case 'tasks_completed':
        return `Выполните ${achievement.condition_value} задач`;
      case 'tasks_created':
        return `Создайте ${achievement.condition_value} задач`;
      case 'streak_days':
        return `Выполняйте задачи ${achievement.condition_value} дней подряд`;
      case 'goals_completed':
        return `Достигните ${achievement.condition_value} целей`;
      default:
        return achievement.description;
    }
  };

  const isEarned = (achievementId: number): boolean => {
    return userAchievements.some(ua => ua.achievement.id === achievementId);
  };

  const getProgressPercentage = (achievement: Achievement): number => {
    const current = getProgressValue(achievement);
    const target = achievement.condition_value;
    return Math.min(100, Math.round((current / target) * 100));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-sm border-b border-indigo-100 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center h-16">
              <Link href="/" className="mr-4 text-gray-600 hover:text-indigo-600 transition-colors">
                <HomeIcon className="h-6 w-6" />
              </Link>
              <TrophyIconSolid className="h-6 w-6 text-yellow-500 mr-3" />
              <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Достижения
              </h1>
            </div>
          </div>
        </header>
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
            <p className="text-blue-600 font-medium">Загрузка достижений...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-indigo-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Link href="/" className="mr-4 text-gray-600 hover:text-indigo-600 transition-colors">
              <HomeIcon className="h-6 w-6" />
            </Link>
            <TrophyIconSolid className="h-6 w-6 text-yellow-500 mr-3" />
            <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Достижения
            </h1>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div>
              <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 flex items-center">
                <TrophyIconSolid className="h-6 w-6 sm:h-10 sm:w-10 text-yellow-500 mr-2 sm:mr-4" />
                Достижения
              </h1>
              <p className="text-sm sm:text-lg text-gray-600 mt-2">
                Выполняйте задачи и получайте награды за свои успехи
              </p>
            </div>
            
            {stats && (
              <div className="text-left sm:text-right">
                <div className="text-2xl sm:text-3xl font-bold text-purple-600">{stats.total_points}</div>
                <div className="text-sm text-gray-600">очков опыта</div>
                <div className="text-sm text-gray-500">
                  {stats.achievements_count} из {allAchievements.length} достижений
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Experience Points Info */}
        <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-2xl p-4 sm:p-6 mb-8 text-white">
          <div className="flex items-start space-x-3 sm:space-x-4">
            <InformationCircleIcon className="h-6 w-6 sm:h-8 sm:w-8 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2">Как получать очки опыта?</h3>
              <ul className="space-y-1 text-purple-100 text-sm sm:text-base">
                <li>• Выполняйте задачи и достигайте целей</li>
                <li>• Получайте достижения за различные активности</li>
                <li>• Поддерживайте активность и регулярность</li>
                <li>• Более сложные задачи дают больше очков</li>
              </ul>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Achievements Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {allAchievements.map((achievement) => {
            const earned = isEarned(achievement.id);
            const progressValue = getProgressValue(achievement);
            const progressPercentage = getProgressPercentage(achievement);
            
            return (
              <div
                key={achievement.id}
                className={`relative group bg-white rounded-2xl p-6 border-2 transition-all duration-300 hover:shadow-xl ${
                  earned 
                    ? 'border-yellow-300 bg-gradient-to-br from-yellow-50 to-orange-50' 
                    : 'border-gray-200 hover:border-indigo-300'
                }`}
              >
                {/* Earned Badge */}
                {earned && (
                  <div className="absolute top-4 right-4">
                    <div className="bg-green-500 text-white rounded-full p-2">
                      <CheckIcon className="h-4 w-4" />
                    </div>
                  </div>
                )}
                
                {/* Lock for not yet achievable */}
                {!earned && progressPercentage === 0 && (
                  <div className="absolute top-4 right-4">
                    <LockClosedIcon className="h-6 w-6 text-gray-400" />
                  </div>
                )}

                <div className="text-center">
                  {/* Icon */}
                  <div className={`text-4xl sm:text-6xl mb-4 ${earned ? '' : 'grayscale opacity-60'}`}>
                    {achievement.icon}
                  </div>
                  
                  {/* Title */}
                  <h3 className={`text-lg sm:text-xl font-bold mb-2 ${earned ? 'text-yellow-800' : 'text-gray-900'}`}>
                    {achievement.name}
                  </h3>
                  
                  {/* Description */}
                  <p className={`text-xs sm:text-sm mb-4 ${earned ? 'text-yellow-700' : 'text-gray-600'}`}>
                    {achievement.description}
                  </p>
                  
                  {/* Condition */}
                  <p className="text-xs text-gray-500 mb-4">
                    {getConditionDescription(achievement)}
                  </p>
                  
                  {/* Progress */}
                  {!earned && (
                    <div className="mb-4">
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>Прогресс</span>
                        <span>{progressValue} / {achievement.condition_value}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${progressPercentage}%` }}
                        />
                      </div>
                    </div>
                  )}
                  
                  {/* Points */}
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                    earned 
                      ? 'bg-yellow-200 text-yellow-800' 
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    +{achievement.points} очков
                  </div>
                  
                  {/* Earned Date */}
                  {earned && (
                    <div className="mt-3 text-xs text-yellow-600">
                      Получено: {new Date(
                        userAchievements.find(ua => ua.achievement.id === achievement.id)?.earned_at || ''
                      ).toLocaleDateString('ru-RU')}
                    </div>
                  )}
                </div>
                
                {/* Hover Effect */}
                <div className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
                  earned 
                    ? 'bg-gradient-to-r from-yellow-200/20 to-orange-200/20'
                    : 'bg-gradient-to-r from-indigo-200/20 to-purple-200/20'
                }`}></div>
              </div>
            );
          })}
        </div>

        {/* Summary */}
        {stats && (
          <div className="mt-12 bg-white rounded-2xl p-8 border border-gray-200">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">Ваша статистика</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-indigo-600">{stats.total_tasks}</div>
                <div className="text-sm text-gray-600">Создано задач</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{stats.completed_tasks}</div>
                <div className="text-sm text-gray-600">Выполнено задач</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600">{stats.current_streak}</div>
                <div className="text-sm text-gray-600">Активная неделя</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">{stats.achievements_count}</div>
                <div className="text-sm text-gray-600">Достижений получено</div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
} 