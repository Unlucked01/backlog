'use client';

import { useState, useEffect } from 'react';
import { authAPI } from '@/lib/api';
import { BellIcon, BellSlashIcon } from '@heroicons/react/24/outline';

interface PushNotificationsProps {
  className?: string;
}

// Используем VAPID ключ из переменных окружения, а если не найден
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY

export default function PushNotifications({ className = '' }: PushNotificationsProps) {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    console.log('PushNotifications component mounted');
    
    if (typeof window !== 'undefined') {
      const supported = 'serviceWorker' in navigator && 'PushManager' in window;
      console.log('Push support check:', {
        hasWindow: typeof window !== 'undefined',
        hasServiceWorker: 'serviceWorker' in navigator,
        hasPushManager: 'PushManager' in window,
        supported,
        notificationPermission: Notification.permission
      });
      setIsSupported(supported);
      setPermission(Notification.permission);
      
      // Проверяем статус подписки только если поддержка есть
      if (supported) {
        checkSubscriptionStatus();
      }
    }
  }, []);

  const registerServiceWorker = async () => {
    console.log('Registering push service worker...');
    
    try {
      const registration = await navigator.serviceWorker.register('/push-sw.js', {
        scope: '/'
      });
      
      console.log('Push service worker registered:', registration);
      console.log('VAPID_KEY=', VAPID_PUBLIC_KEY)
      
      // Ждем активации
      if (registration.installing) {
        console.log('Service worker installing...');
        await new Promise(resolve => {
          registration.installing!.addEventListener('statechange', function() {
            if (this.state === 'activated') {
              resolve(undefined);
            }
          });
        });
      }
      
      return registration;
    } catch (error) {
      console.error('Failed to register push service worker:', error);
      throw error;
    }
  };

  const checkSubscriptionStatus = async () => {
    console.log('Checking subscription status...');

    try {
      // Сначала попробуем получить существующую регистрацию
      let registration = await navigator.serviceWorker.getRegistration('/');
      
      if (!registration) {
        console.log('No service worker registration found, registering new one...');
        registration = await registerServiceWorker();
      } else {
        console.log('Found existing service worker registration:', registration);
      }
      
      console.log('Getting existing subscription...');
      const subscription = await registration.pushManager.getSubscription();
      console.log('Existing subscription:', subscription);
      
      setIsSubscribed(!!subscription);
      console.log('Subscription status set to:', !!subscription);
    } catch (error) {
      console.error('Ошибка проверки подписки:', error);
      // Не блокируем работу, если service worker не готов
      setIsSubscribed(false);
    }
  };

  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const subscribeToPush = async () => {
    console.log('=== Starting push subscription process ===');
    if (!isSupported) {
      console.log('Push not supported, aborting subscription');
      return;
    }

    setIsLoading(true);
    console.log('Loading state set to true');
    
    try {
      // Запрашиваем разрешение на уведомления
      console.log('Requesting notification permission...');
      const permission = await Notification.requestPermission();
      console.log('Permission result:', permission);
      setPermission(permission);

      if (permission !== 'granted') {
        throw new Error('Разрешение на уведомления не предоставлено');
      }

      // Получаем или регистрируем service worker
      console.log('Getting service worker registration...');
      
      let registration = await navigator.serviceWorker.getRegistration('/');
      
      if (!registration) {
        console.log('No service worker found, registering new one...');
        registration = await registerServiceWorker();
      } else {
        console.log('Using existing service worker registration:', registration);
      }
      
      console.log('Registration scope:', registration.scope);
      console.log('Registration active:', registration.active);

      // Подписываемся на push уведомления
      console.log('Subscribing to push manager...');
      console.log('VAPID key:', VAPID_PUBLIC_KEY);
      
      const applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
      console.log('Converted VAPID key:', applicationServerKey);
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey
      });
      console.log('Push subscription created:', subscription);

      // Отправляем подписку на сервер
      const p256dhKey = subscription.getKey('p256dh');
      const authKey = subscription.getKey('auth');
      console.log('Subscription keys:', { p256dhKey, authKey });
      
      if (!p256dhKey || !authKey) {
        throw new Error('Не удалось получить ключи подписки');
      }

      const subscriptionData = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: btoa(String.fromCharCode(...Array.from(new Uint8Array(p256dhKey)))),
          auth: btoa(String.fromCharCode(...Array.from(new Uint8Array(authKey))))
        }
      };
      console.log('Subscription data to send:', subscriptionData);

      console.log('Sending subscription to server...');
      const response = await authAPI.savePushSubscription(subscriptionData);
      console.log('Server response:', response);

      setIsSubscribed(true);
      console.log('Subscription state updated to true');
      
      // Показываем уведомление об успехе через Service Worker
      if (Notification.permission === 'granted') {
        console.log('Showing success notification...');
        try {
          registration.showNotification('🎉 Уведомления включены!', {
            body: 'Теперь вы будете получать напоминания о дедлайнах',
            icon: '/icons/icon-192x192.png',
            badge: '/icons/icon-72x72.png',
          });
        } catch (error) {
          console.error('Ошибка показа уведомления об успехе:', error);
        }
        // Тестовое уведомление отправляется автоматически после успешной подписки
      }

      console.log('=== Push subscription completed successfully ===');

    } catch (error: any) {
      console.error('=== Push subscription failed ===');
      console.error('Error details:', error);
      console.error('Error stack:', error.stack);
      
      let errorMessage = 'Ошибка включения уведомлений';
      if (error.message) {
        errorMessage = error.message;
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.code === 'NetworkError') {
        errorMessage = 'Ошибка сети. Проверьте подключение к интернету.';
      }
      
      console.log('Showing error message:', errorMessage);
      alert(errorMessage);
    } finally {
      console.log('Setting loading state to false');
      setIsLoading(false);
    }
  };

  const unsubscribeFromPush = async () => {
    if (!isSupported) return;

    setIsLoading(true);
    try {
      const registration = await navigator.serviceWorker.getRegistration('/');
      if (!registration) {
        console.log('No service worker registration found');
        setIsSubscribed(false);
        return;
      }
      
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();
        
        // Уведомляем сервер об отписке
        try {
          await authAPI.savePushSubscription({
            endpoint: '',
            keys: { p256dh: '', auth: '' }
          });
        } catch (error) {
          console.error('Ошибка уведомления сервера об отписке:', error);
        }
      }

      setIsSubscribed(false);
    } catch (error) {
      console.error('Ошибка отписки от уведомлений:', error);
      alert('Ошибка отключения уведомлений');
    } finally {
      setIsLoading(false);
    }
  };



  if (!isSupported) {
    return (
      <div className={`p-4 bg-gray-50 rounded-lg ${className}`}>
        <div className="flex items-center space-x-3">
          <BellSlashIcon className="h-6 w-6 text-gray-400" />
          <div>
            <h3 className="font-medium text-gray-900">Push-уведомления недоступны</h3>
            <p className="text-sm text-gray-600">Ваш браузер не поддерживает push-уведомления</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-4 sm:p-6 bg-white rounded-2xl shadow-lg border border-gray-200 ${className}`}>
      {/* Мобильная версия */}
      <div className="block sm:hidden">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex-shrink-0">
              {isSubscribed ? (
                <BellIcon className="h-5 w-5 text-white" />
              ) : (
                <BellSlashIcon className="h-5 w-5 text-white" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-gray-900 text-sm truncate">Push-уведомления</h3>
              <p className="text-xs text-gray-600">
                {isSubscribed ? 'Включены' : 'Отключены'}
              </p>
            </div>
          </div>
        </div>
        
        <div className="space-y-2">
          <button
            onClick={isSubscribed ? unsubscribeFromPush : subscribeToPush}
            disabled={isLoading}
            className={`w-full px-4 py-3 rounded-lg font-medium transition-colors text-sm ${
              isSubscribed
                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                : 'bg-green-100 text-green-700 hover:bg-green-200'
            } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isLoading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent"></div>
                <span>Подождите...</span>
              </div>
            ) : isSubscribed ? (
              'Отключить уведомления'
            ) : (
              'Включить уведомления'
            )}
          </button>
        </div>
      </div>

      {/* Десктопная версия */}
      <div className="hidden sm:block">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
              {isSubscribed ? (
                <BellIcon className="h-6 w-6 text-white" />
              ) : (
                <BellSlashIcon className="h-6 w-6 text-white" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Push-уведомления</h3>
              <p className="text-sm text-gray-600">
                {isSubscribed ? 'Включены' : 'Отключены'}
              </p>
            </div>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={isSubscribed ? unsubscribeFromPush : subscribeToPush}
              disabled={isLoading}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                isSubscribed
                  ? 'bg-red-100 text-red-700 hover:bg-red-200'
                  : 'bg-green-100 text-green-700 hover:bg-green-200'
              } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent"></div>
              ) : isSubscribed ? (
                'Отключить'
              ) : (
                'Включить'
              )}
            </button>
          </div>
        </div>
      </div>

      {permission === 'denied' && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
          <p className="text-sm text-red-700">
            Уведомления заблокированы. Разрешите их в настройках браузера.
          </p>
        </div>
      )}

      {isSubscribed && (
        <div className="space-y-2 text-sm text-gray-600 mt-4">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></span>
            <span className="text-xs sm:text-sm">Напоминания о дедлайнах</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></span>
            <span className="text-xs sm:text-sm">Уведомления о просроченных задачах</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></span>
            <span className="text-xs sm:text-sm">Ежедневные сводки</span>
          </div>
        </div>
      )}
    </div>
  );
} 