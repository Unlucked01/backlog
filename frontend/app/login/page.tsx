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