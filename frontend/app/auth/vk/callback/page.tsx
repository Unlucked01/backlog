'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { tokenUtils } from '@/lib/api';

export default function VKCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Обработка авторизации...');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const savedState = localStorage.getItem('oauth_state');

        if (!code) {
          throw new Error('Код авторизации не получен');
        }

        if (state !== savedState) {
          throw new Error('Нарушена безопасность авторизации');
        }

        // Очищаем сохраненный state
        localStorage.removeItem('oauth_state');

        // Обмениваем код на токен
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const response = await fetch(`${apiBaseUrl}/api/v1/auth/oauth/vk/callback`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            provider: 'vk',
            code: code,
            state: state,
          }),
        });

        const data = await response.json();

        if (response.ok) {
          // Сохраняем токен и перенаправляем
          tokenUtils.setToken(data.access_token);
          setStatus('success');
          setMessage('Авторизация успешна! Перенаправление...');
          
          // Небольшая задержка для показа сообщения
          setTimeout(() => {
            router.push('/');
          }, 1500);
        } else {
          throw new Error(data.detail || 'Ошибка авторизации');
        }
      } catch (error: any) {
        setStatus('error');
        setMessage(error.message || 'Произошла ошибка при авторизации');
        
        // Перенаправляем на страницу входа через 3 секунды
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      }
    };

    handleCallback();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        {status === 'loading' && (
          <>
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-6"></div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Обработка авторизации</h2>
            <p className="text-gray-600">{message}</p>
          </>
        )}
        
        {status === 'success' && (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-green-900 mb-2">Успешно!</h2>
            <p className="text-green-700">{message}</p>
          </>
        )}
        
        {status === 'error' && (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-red-900 mb-2">Ошибка</h2>
            <p className="text-red-700 mb-4">{message}</p>
            <button
              onClick={() => router.push('/login')}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Вернуться к входу
            </button>
          </>
        )}
      </div>
    </div>
  );
} 