'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { tokenUtils, authAPI, type User } from '@/lib/api';
import { validationUtils } from '@/lib/utils';
import PushNotifications from '@/components/PushNotifications';
import { 
  HomeIcon,
  UserIcon,
  KeyIcon,
  BellIcon,
  CheckIcon
} from '@heroicons/react/24/outline';

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
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');
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
    loadUser();
  }, [router]);

  const loadUser = async () => {
    try {
      const userData = await authAPI.getCurrentUser();
      setUser(userData);
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
      // В данном API нет update user endpoint, поэтому показываем заглушку
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Ошибка загрузки профиля</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Link href="/" className="mr-4 text-gray-600 hover:text-gray-900">
              <HomeIcon className="h-6 w-6" />
            </Link>
            <UserIcon className="h-6 w-6 text-primary-600 mr-3" />
            <h1 className="text-xl font-semibold text-gray-900">Профиль</h1>
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

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <nav className="bg-white rounded-lg shadow-sm border p-4">
              <ul className="space-y-2">
                <li>
                  <button
                    onClick={() => setActiveTab('profile')}
                    className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                      activeTab === 'profile' 
                        ? 'bg-primary-50 text-primary-700 font-medium' 
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <UserIcon className="h-5 w-5 inline mr-3" />
                    Основная информация
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveTab('password')}
                    className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                      activeTab === 'password' 
                        ? 'bg-primary-50 text-primary-700 font-medium' 
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <KeyIcon className="h-5 w-5 inline mr-3" />
                    Изменить пароль
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveTab('notifications')}
                    className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                      activeTab === 'notifications' 
                        ? 'bg-primary-50 text-primary-700 font-medium' 
                        : 'text-gray-600 hover:bg-gray-50'
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
            <div className="bg-white rounded-lg shadow-sm border p-6">
              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Основная информация</h2>
                  
                  <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Полное имя
                      </label>
                      <input
                        {...registerProfile('full_name', { required: 'Имя обязательно' })}
                        type="text"
                        className="input"
                        placeholder="Ваше полное имя"
                      />
                      {profileErrors.full_name && (
                        <p className="mt-1 text-sm text-red-600">{profileErrors.full_name.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email
                      </label>
                      <input
                        {...registerProfile('email', { 
                          required: 'Email обязателен',
                          validate: (value) => validationUtils.isEmail(value) || 'Некорректный email'
                        })}
                        type="email"
                        className="input"
                        placeholder="your@email.com"
                      />
                      {profileErrors.email && (
                        <p className="mt-1 text-sm text-red-600">{profileErrors.email.message}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Дата регистрации</p>
                        <p className="text-sm text-gray-600">
                          {new Date(user.created_at).toLocaleDateString('ru-RU')}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Статус</p>
                        <p className="text-sm text-gray-600">
                          {user.is_verified ? 'Подтвержден' : 'Не подтвержден'}
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button type="submit" className="btn btn-primary">
                        Сохранить изменения
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Password Tab */}
              {activeTab === 'password' && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Изменить пароль</h2>
                  
                  <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Текущий пароль
                      </label>
                      <input
                        {...registerPassword('current_password', { required: 'Текущий пароль обязателен' })}
                        type="password"
                        className="input"
                        placeholder="Введите текущий пароль"
                      />
                      {passwordErrors.current_password && (
                        <p className="mt-1 text-sm text-red-600">{passwordErrors.current_password.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Новый пароль
                      </label>
                      <input
                        {...registerPassword('new_password', { 
                          required: 'Новый пароль обязателен',
                          validate: (value) => validationUtils.isStrongPassword(value) || 'Пароль должен содержать минимум 8 символов'
                        })}
                        type="password"
                        className="input"
                        placeholder="Введите новый пароль"
                      />
                      {passwordErrors.new_password && (
                        <p className="mt-1 text-sm text-red-600">{passwordErrors.new_password.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Подтверждение нового пароля
                      </label>
                      <input
                        {...registerPassword('confirm_password', { 
                          required: 'Подтверждение пароля обязательно',
                          validate: (value) => value === newPassword || 'Пароли не совпадают'
                        })}
                        type="password"
                        className="input"
                        placeholder="Повторите новый пароль"
                      />
                      {passwordErrors.confirm_password && (
                        <p className="mt-1 text-sm text-red-600">{passwordErrors.confirm_password.message}</p>
                      )}
                    </div>

                    <div className="flex justify-end">
                      <button type="submit" className="btn btn-primary">
                        Изменить пароль
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Настройки уведомлений</h2>
                  
                  <div className="space-y-6">
                    {/* Push Notifications Component */}
                    <PushNotifications />

                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div>
                        <h3 className="font-medium text-gray-900">Email уведомления</h3>
                        <p className="text-sm text-gray-500">Получать уведомления о дедлайнах на email</p>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={user.email_notifications}
                          readOnly
                          className="h-4 w-4 text-primary-600 border-gray-300 rounded"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div>
                        <h3 className="font-medium text-gray-900">Telegram уведомления</h3>
                        <p className="text-sm text-gray-500">Получать уведомления в Telegram боте</p>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={user.telegram_notifications}
                          readOnly
                          className="h-4 w-4 text-primary-600 border-gray-300 rounded"
                        />
                      </div>
                    </div>

                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>Скоро:</strong> Интеграция с Telegram ботом, выбор времени уведомлений, настройка типов уведомлений.
                      </p>
                    </div>
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