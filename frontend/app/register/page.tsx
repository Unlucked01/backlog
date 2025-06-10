'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { authAPI, tokenUtils } from '@/lib/api';
import { validationUtils } from '@/lib/utils';

interface RegisterForm {
  email: string;
  password: string;
  confirmPassword: string;
  full_name: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterForm>();

  const password = watch('password');

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await authAPI.register(data.email, data.password, data.full_name);
      // Автоматически логиним после регистрации
      const loginResponse = await authAPI.login(data.email, data.password);
      tokenUtils.setToken(loginResponse.access_token);
      router.push('/');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка регистрации');
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
              Создание аккаунта
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Или{' '}
              <Link
                href="/login"
                className="font-medium text-primary-600 hover:text-primary-500"
              >
                войдите в существующий аккаунт
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
                <label htmlFor="full_name" className="sr-only">
                  Полное имя
                </label>
                <input
                  {...register('full_name', {
                    required: 'Имя обязательно',
                    minLength: {
                      value: 2,
                      message: 'Имя должно содержать минимум 2 символа'
                    }
                  })}
                  type="text"
                  autoComplete="name"
                  className="input"
                  placeholder="Полное имя"
                />
                {errors.full_name && (
                  <p className="mt-1 text-sm text-red-600">{errors.full_name.message}</p>
                )}
              </div>

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
                    validate: (value) =>
                      validationUtils.isStrongPassword(value) || 'Пароль должен содержать минимум 8 символов',
                  })}
                  type="password"
                  autoComplete="new-password"
                  className="input"
                  placeholder="Пароль"
                />
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="sr-only">
                  Подтверждение пароля
                </label>
                <input
                  {...register('confirmPassword', {
                    required: 'Подтверждение пароля обязательно',
                    validate: (value) =>
                      value === password || 'Пароли не совпадают',
                  })}
                  type="password"
                  autoComplete="new-password"
                  className="input"
                  placeholder="Подтверждение пароля"
                />
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
                )}
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full btn btn-primary"
                >
                  {isLoading ? 'Регистрация...' : 'Создать аккаунт'}
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
            <h1 className="text-4xl font-bold mb-4">
              Добро пожаловать!
            </h1>
            <p className="text-xl opacity-90 mb-8">
              Начните эффективно управлять своими учебными задачами уже сегодня
            </p>
            <div className="grid grid-cols-1 gap-4 text-left max-w-md">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">🎯</span>
                </div>
                <span>Отслеживание всех задач в одном месте</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">⏰</span>
                </div>
                <span>Никогда не пропустите дедлайн</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">📈</span>
                </div>
                <span>Визуализация прогресса</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">💪</span>
                </div>
                <span>Мотивация к достижению целей</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 