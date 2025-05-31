'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { authAPI, tokenUtils } from '@/lib/api';
import { validationUtils } from '@/lib/utils';

interface LoginForm {
  email: string;
  password: string;
}

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [oAuthLoading, setOAuthLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>();

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await authAPI.login(data.email, data.password);
      tokenUtils.setToken(response.access_token);
      router.push('/');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка входа');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthLogin = async (provider: string) => {
    setOAuthLoading(provider);
    setError(null);

    try {
      const response = await fetch(`http://localhost:8000/api/v1/auth/oauth/${provider}/url`);
      const data = await response.json();
      
      if (response.ok) {
        // Сохраняем state для проверки
        localStorage.setItem('oauth_state', data.state);
        // Перенаправляем на страницу авторизации
        window.location.href = data.auth_url;
      } else {
        setError(data.detail || `Ошибка авторизации через ${provider}`);
      }
    } catch (err: any) {
      setError(`Ошибка подключения к ${provider}`);
    } finally {
      setOAuthLoading(null);
    }
  };

  const handleTelegramLogin = () => {
    setError('Telegram авторизация будет добавлена позже');
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Form */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div>
            <h2 className="mt-6 text-3xl font-bold text-gray-900">
              Вход в аккаунт
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Или{' '}
              <Link
                href="/register"
                className="font-medium text-primary-600 hover:text-primary-500"
              >
                создайте новый аккаунт
              </Link>
            </p>
          </div>

          <div className="mt-8">
            <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="email" className="sr-only">
                  Email адрес
                </label>
                <input
                  {...register('email', {
                    required: 'Email обязателен',
                    validate: (value) =>
                      validationUtils.isEmail(value) || 'Некорректный email',
                  })}
                  type="email"
                  autoComplete="email"
                  className="input"
                  placeholder="Email адрес"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="password" className="sr-only">
                  Пароль
                </label>
                <input
                  {...register('password', {
                    required: 'Пароль обязателен',
                  })}
                  type="password"
                  autoComplete="current-password"
                  className="input"
                  placeholder="Пароль"
                />
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                )}
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full btn btn-primary"
                >
                  {isLoading ? 'Вход...' : 'Войти'}
                </button>
              </div>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Или войдите через</span>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                {/* Google OAuth */}
                <button
                  type="button"
                  onClick={() => handleOAuthLogin('google')}
                  disabled={oAuthLoading === 'google'}
                  className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  {oAuthLoading === 'google' ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-300 border-t-gray-600"></div>
                  ) : (
                    <>
                      <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      Войти через Google
                    </>
                  )}
                </button>

                {/* VK OAuth */}
                <button
                  type="button"
                  onClick={() => handleOAuthLogin('vk')}
                  disabled={oAuthLoading === 'vk'}
                  className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  {oAuthLoading === 'vk' ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-300 border-t-gray-600"></div>
                  ) : (
                    <>
                      <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="#4C75A3">
                        <path d="M12.785 16.241s.288-.032.435-.194c.135-.148.131-.427.131-.427s-.019-1.307.587-1.5c.597-.19 1.363.126 2.154.91.6.596 1.051.927 1.051.927l2.109-.03s1.103-.068.58-.936c-.043-.071-.305-.643-1.572-1.817-1.328-1.227-1.151-1.028.45-3.148.975-1.29 1.364-2.077 1.241-2.413-.117-.32-.842-.236-.842-.236l-2.375.015s-.176-.024-.306.054c-.124.075-.204.251-.204.251s-.366.974-.854 1.804c-1.027 1.749-1.437 1.84-1.605 1.732-.391-.251-.293-.01-.293-1.569 0-1.708.259-2.421-.504-2.607-.254-.062-.441-.103-1.091-.109-.833-.009-1.538.003-1.937.198-.266.13-.471.419-.346.435.154.02.502.094.687.345.238.323.229.048.229 1.336 0 .796-.143 1.419-.585 1.245-.303-.12-.68-.483-1.529-1.748-.433-.715-.76-1.506-.76-1.506s-.071-.171-.198-.263c-.155-.112-.372-.147-.372-.147l-2.257.015s-.339.009-.463.157c-.111.132-.009.404-.009.404s1.717 4.024 3.66 6.052c1.783 1.858 3.804 1.735 3.804 1.735z"/>
                      </svg>
                      Войти через VK
                    </>
                  )}
                </button>

                {/* Telegram (placeholder) */}
                <button
                  type="button"
                  onClick={handleTelegramLogin}
                  className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors opacity-50 cursor-not-allowed"
                >
                  <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="#0088cc">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 0 0-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.12.19.14.27-.01.06.01.24 0 .38z"/>
                  </svg>
                  Войти через Telegram (скоро)
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Branding */}
      <div className="hidden lg:block relative w-0 flex-1 bg-gradient-to-br from-primary-600 to-primary-800">
        <div className="absolute inset-0 flex items-center justify-center p-12">
          <div className="text-center text-white">
            <p className="text-xl opacity-90 mb-8">
              Управляйте учебными задачами и задолженностями эффективно
            </p>
            <div className="grid grid-cols-1 gap-4 text-left max-w-md">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">📅</span>
                </div>
                <span>Календарь задач и дедлайнов</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">🔔</span>
                </div>
                <span>Push-уведомления о дедлайнах</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">📊</span>
                </div>
                <span>Аналитика и статистика</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">🏆</span>
                </div>
                <span>Система достижений</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 