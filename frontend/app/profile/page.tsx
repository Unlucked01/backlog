'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { tokenUtils, authAPI, achievementsAPI, type User, type UserAchievement, type UserStats } from '@/lib/api';
import { validationUtils } from '@/lib/utils';
import PushNotifications from '@/components/PushNotifications';
import ScheduledNotifications from '@/components/ScheduledNotifications';
import { 
  HomeIcon,
  UserIcon,
  KeyIcon,
  BellIcon,
  CheckIcon,
  TrophyIcon,
  FireIcon,
  ChartBarIcon,
  StarIcon,
  CalendarDaysIcon,
  AcademicCapIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { 
  TrophyIcon as TrophyIconSolid,
  FireIcon as FireIconSolid,
  StarIcon as StarIconSolid 
} from '@heroicons/react/24/solid';

interface ProfileForm {
  full_name: string;
  email: string;
}

interface PasswordForm {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [achievements, setAchievements] = useState<UserAchievement[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors },
    reset: resetProfile
  } = useForm<ProfileForm>();

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    formState: { errors: passwordErrors },
    reset: resetPassword,
    watch: watchPassword
  } = useForm<PasswordForm>();

  const newPassword = watchPassword('new_password');

  useEffect(() => {
    if (!tokenUtils.isAuthenticated()) {
      router.push('/login');
      return;
    }
    loadData();
  }, [router]);

  const loadData = async () => {
    try {
      const [userData, userAchievements, userStats] = await Promise.all([
        authAPI.getCurrentUser(),
        achievementsAPI.getUserAchievements(),
        achievementsAPI.getUserStats()
      ]);
      
      setUser(userData);
      setAchievements(userAchievements);
      setStats(userStats);
      
      resetProfile({
        full_name: userData.full_name || '',
        email: userData.email
      });
    } catch (error) {
      console.error('Ошибка загрузки профиля:', error);
    } finally {
      setLoading(false);
    }
  };

  const onProfileSubmit = async (data: ProfileForm) => {
    setError(null);
    setSuccess(null);
    
    try {
      setSuccess('Профиль будет обновлен в следующих версиях');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка обновления профиля');
    }
  };

  const onPasswordSubmit = async (data: PasswordForm) => {
    setError(null);
    setSuccess(null);
    
    try {
      await authAPI.changePassword(data.current_password, data.new_password);
      setSuccess('Пароль успешно изменен');
      resetPassword();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка изменения пароля');
    }
  };

  const getCompletionRateColor = (rate: number) => {
    if (rate >= 80) return 'text-green-600';
    if (rate >= 60) return 'text-blue-600';
    if (rate >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getMotivationalMessage = () => {
    if (!stats) return '';
    const rate = stats.completion_rate;
    
    if (rate >= 80) return 'Невероятно! Вы на пике продуктивности! 🔥';
    if (rate >= 60) return 'Отличная работа! Продолжайте в том же духе! 💪';
    if (rate >= 40) return 'Хороший прогресс! Ещё немного усилий! ⚡';
    if (rate >= 20) return 'Начало положено! Время ускориться! 🚀';
    return 'Время действовать! Вы можете больше! ✨';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-200 border-t-indigo-600 mx-auto mb-4"></div>
          <p className="text-indigo-600 font-medium">Загрузка профиля...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <p className="text-gray-500">Ошибка загрузки профиля</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-indigo-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="mr-4 text-gray-600 hover:text-indigo-600 transition-colors">
                <HomeIcon className="h-6 w-6" />
              </Link>
              <UserIcon className="h-6 w-6 text-indigo-600 mr-3" />
              <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Профиль
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link 
                href="/achievements" 
                className="flex items-center text-gray-600 hover:text-yellow-600 transition-colors"
              >
                <TrophyIconSolid className="h-5 w-5 mr-1" />
                <span className="hidden sm:inline">Достижения</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success/Error Messages */}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-xl flex items-center shadow-sm">
            <CheckIcon className="h-5 w-5 mr-2" />
            {success}
          </div>
        )}
        
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl shadow-sm">
            {error}
          </div>
        )}

        {/* Profile Header */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-indigo-100 p-8 mb-8">
          <div className="flex items-center space-x-6">
            <div className="relative">
              <div className="w-24 h-24 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                {user.full_name ? user.full_name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
              </div>
              {stats && stats.current_streak > 0 && (
                <div className="absolute -bottom-1 -right-1 bg-orange-500 text-white rounded-full p-1">
                  <FireIconSolid className="h-4 w-4" />
                </div>
              )}
            </div>
            
            <div className="flex-1">
              <h2 className="text-3xl font-bold text-gray-900">
                {user.full_name || 'Студент'}
              </h2>
              <p className="text-gray-600 text-lg">{user.email}</p>
              <div className="flex items-center mt-2 space-x-4">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
                  <CalendarDaysIcon className="h-4 w-4 mr-1" />
                  {new Date(user.created_at).toLocaleDateString('ru-RU')}
                </span>
                {user.is_verified && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    <CheckIcon className="h-4 w-4 mr-1" />
                    Подтвержден
                  </span>
                )}
              </div>
            </div>

            {stats && (
              <div className="text-right">
                <div className="text-3xl font-bold text-purple-600">{stats.total_points}</div>
                <div className="text-sm text-gray-600">очков</div>
                <div className="flex items-center justify-end mt-2">
                  <TrophyIconSolid className="h-5 w-5 text-yellow-500 mr-1" />
                  <span className="text-lg font-semibold">{stats.achievements_count}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-indigo-100 shadow-lg">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-xl">
                  <ChartBarIcon className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Процент выполнения</p>
                  <p className={`text-2xl font-bold ${getCompletionRateColor(stats.completion_rate)}`}>
                    {stats.completion_rate}%
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-indigo-100 shadow-lg">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-xl">
                  <CheckIcon className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Выполнено задач</p>
                  <p className="text-2xl font-bold text-green-600">
                    {stats.completed_tasks}/{stats.total_tasks}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-indigo-100 shadow-lg">
              <div className="flex items-center">
                <div className="p-3 bg-orange-100 rounded-xl">
                  <FireIconSolid className="h-8 w-8 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Активная неделя</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.current_streak}</p>
                </div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-indigo-100 shadow-lg">
              <div className="flex items-center">
                <div className="p-3 bg-purple-100 rounded-xl">
                  <StarIconSolid className="h-8 w-8 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Очки опыта</p>
                  <p className="text-2xl font-bold text-purple-600">{stats.total_points}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Motivational Message */}
        {stats && (
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-6 mb-8 text-white">
            <div className="flex items-center">
              <SparklesIcon className="h-8 w-8 mr-3" />
              <div>
                <h3 className="text-lg font-semibold">Мотивация дня</h3>
                <p className="text-indigo-100">{getMotivationalMessage()}</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <nav className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-indigo-100 p-4 sticky top-24">
              <ul className="space-y-2">
                <li>
                  <button
                    onClick={() => setActiveTab('overview')}
                    className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-200 ${
                      activeTab === 'overview' 
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg transform scale-105' 
                        : 'text-gray-600 hover:bg-indigo-50 hover:text-indigo-700'
                    }`}
                  >
                    <AcademicCapIcon className="h-5 w-5 inline mr-3" />
                    Обзор
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveTab('achievements')}
                    className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-200 ${
                      activeTab === 'achievements' 
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg transform scale-105' 
                        : 'text-gray-600 hover:bg-indigo-50 hover:text-indigo-700'
                    }`}
                  >
                    <TrophyIcon className="h-5 w-5 inline mr-3" />
                    Достижения
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveTab('profile')}
                    className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-200 ${
                      activeTab === 'profile' 
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg transform scale-105' 
                        : 'text-gray-600 hover:bg-indigo-50 hover:text-indigo-700'
                    }`}
                  >
                    <UserIcon className="h-5 w-5 inline mr-3" />
                    Информация
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveTab('password')}
                    className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-200 ${
                      activeTab === 'password' 
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg transform scale-105' 
                        : 'text-gray-600 hover:bg-indigo-50 hover:text-indigo-700'
                    }`}
                  >
                    <KeyIcon className="h-5 w-5 inline mr-3" />
                    Безопасность
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveTab('notifications')}
                    className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-200 ${
                      activeTab === 'notifications' 
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg transform scale-105' 
                        : 'text-gray-600 hover:bg-indigo-50 hover:text-indigo-700'
                    }`}
                  >
                    <BellIcon className="h-5 w-5 inline mr-3" />
                    Уведомления
                  </button>
                </li>
              </ul>
            </nav>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-indigo-100 p-8">
              
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Обзор активности</h2>
                  
                  {/* Recent Achievements */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <TrophyIconSolid className="h-5 w-5 text-yellow-500 mr-2" />
                      Последние достижения
                    </h3>
                    
                    {achievements.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {achievements.slice(0, 4).map((userAchievement) => (
                          <div
                            key={userAchievement.id}
                            className="flex items-center p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl"
                          >
                            <div className="text-3xl mr-3">{userAchievement.achievement.icon}</div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900">{userAchievement.achievement.name}</h4>
                              <p className="text-sm text-gray-600">{userAchievement.achievement.description}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                {new Date(userAchievement.earned_at).toLocaleDateString('ru-RU')}
                              </p>
                            </div>
                            <div className="text-right">
                              <span className="text-sm font-semibold text-orange-600">
                                +{userAchievement.achievement.points}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <TrophyIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                        <p>Ваши достижения появятся здесь</p>
                        <p className="text-sm">Выполняйте задачи и достигайте целей!</p>
                      </div>
                    )}
                  </div>

                  {/* Quick Stats */}
                  {stats && (
                    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-100">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Краткая статистика</h3>
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <p className="text-sm text-gray-600">Всего задач</p>
                          <p className="text-2xl font-bold text-indigo-600">{stats.total_tasks}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Процент выполнения</p>
                          <p className={`text-2xl font-bold ${getCompletionRateColor(stats.completion_rate)}`}>
                            {stats.completion_rate}%
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Активных задач</p>
                          <p className="text-2xl font-bold text-blue-600">{stats.pending_tasks}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Просроченных</p>
                          <p className="text-2xl font-bold text-red-600">{stats.overdue_tasks}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Achievements Tab */}
              {activeTab === 'achievements' && (
                <div>
                  <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                      <TrophyIconSolid className="h-7 w-7 text-yellow-500 mr-3" />
                      Ваши достижения
                    </h2>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Всего очков</p>
                      <p className="text-2xl font-bold text-purple-600">{stats?.total_points || 0}</p>
                    </div>
                  </div>
                  
                  {achievements.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {achievements.map((userAchievement) => (
                        <div
                          key={userAchievement.id}
                          className="group relative bg-gradient-to-br from-white to-indigo-50 border-2 border-yellow-200 rounded-2xl p-6 hover:shadow-xl transition-all duration-300 hover:scale-105"
                        >
                          <div className="absolute top-4 right-4">
                            <span className="bg-yellow-100 text-yellow-800 text-xs font-semibold px-2 py-1 rounded-full">
                              +{userAchievement.achievement.points}
                            </span>
                          </div>
                          
                          <div className="text-center">
                            <div className="text-6xl mb-4">{userAchievement.achievement.icon}</div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">
                              {userAchievement.achievement.name}
                            </h3>
                            <p className="text-gray-600 text-sm mb-4">
                              {userAchievement.achievement.description}
                            </p>
                            <p className="text-xs text-gray-500">
                              Получено: {new Date(userAchievement.earned_at).toLocaleDateString('ru-RU')}
                            </p>
                          </div>
                          
                          <div className="absolute inset-0 bg-gradient-to-r from-yellow-200/20 to-orange-200/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-16">
                      <TrophyIcon className="h-24 w-24 mx-auto mb-6 text-gray-300" />
                      <h3 className="text-xl font-semibold text-gray-600 mb-2">Пока нет достижений</h3>
                      <p className="text-gray-500 max-w-md mx-auto">
                        Выполняйте задачи, достигайте целей и получайте награды за свои успехи!
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-8">Основная информация</h2>
                  
                  <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Полное имя
                      </label>
                      <input
                        {...registerProfile('full_name', { required: 'Имя обязательно' })}
                        type="text"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                        placeholder="Ваше полное имя"
                      />
                      {profileErrors.full_name && (
                        <p className="mt-2 text-sm text-red-600">{profileErrors.full_name.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Email
                      </label>
                      <input
                        {...registerProfile('email', { 
                          required: 'Email обязателен',
                          validate: (value) => validationUtils.isEmail(value) || 'Некорректный email'
                        })}
                        type="email"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                        placeholder="your@email.com"
                      />
                      {profileErrors.email && (
                        <p className="mt-2 text-sm text-red-600">{profileErrors.email.message}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-100">
                      <div>
                        <p className="text-sm font-semibold text-gray-700">Дата регистрации</p>
                        <p className="text-gray-600 mt-1">
                          {new Date(user.created_at).toLocaleDateString('ru-RU')}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-700">Статус аккаунта</p>
                        <div className="flex items-center mt-1">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                            user.is_verified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {user.is_verified ? (
                              <>
                                <CheckIcon className="h-4 w-4 mr-1" />
                                Подтвержден
                              </>
                            ) : (
                              'Не подтвержден'
                            )}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button type="submit" className="px-8 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-600 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 shadow-lg">
                        Сохранить изменения
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Password Tab */}
              {activeTab === 'password' && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-8">Изменение пароля</h2>
                  
                  <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Текущий пароль
                      </label>
                      <input
                        {...registerPassword('current_password', { required: 'Текущий пароль обязателен' })}
                        type="password"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                        placeholder="Введите текущий пароль"
                      />
                      {passwordErrors.current_password && (
                        <p className="mt-2 text-sm text-red-600">{passwordErrors.current_password.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Новый пароль
                      </label>
                      <input
                        {...registerPassword('new_password', { 
                          required: 'Новый пароль обязателен',
                          validate: (value) => validationUtils.isStrongPassword(value) || 'Пароль должен содержать минимум 8 символов'
                        })}
                        type="password"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                        placeholder="Введите новый пароль"
                      />
                      {passwordErrors.new_password && (
                        <p className="mt-2 text-sm text-red-600">{passwordErrors.new_password.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Подтверждение нового пароля
                      </label>
                      <input
                        {...registerPassword('confirm_password', { 
                          required: 'Подтверждение пароля обязательно',
                          validate: (value) => value === newPassword || 'Пароли не совпадают'
                        })}
                        type="password"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                        placeholder="Повторите новый пароль"
                      />
                      {passwordErrors.confirm_password && (
                        <p className="mt-2 text-sm text-red-600">{passwordErrors.confirm_password.message}</p>
                      )}
                    </div>

                    <div className="flex justify-end">
                      <button type="submit" className="px-8 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-600 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 shadow-lg">
                        Изменить пароль
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-8">Настройки уведомлений</h2>
                  
                  <div className="space-y-6">
                    {/* Push Notifications Component */}
                    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-100">
                      <PushNotifications />
                    </div>

                    {/* Scheduled Notifications Component */}
                    <ScheduledNotifications />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 