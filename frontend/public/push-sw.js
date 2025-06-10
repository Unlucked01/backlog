// Service Worker для push-уведомлений
'use strict';

console.log('Push Service Worker loaded');

// Установка Service Worker
self.addEventListener('install', function(event) {
  console.log('Push Service Worker installed');
  self.skipWaiting();
});

// Активация Service Worker
self.addEventListener('activate', function(event) {
  console.log('Push Service Worker activated');
  event.waitUntil(self.clients.claim());
});

// Обработка push-уведомлений
self.addEventListener('push', function(event) {
  console.log('Push event received:', event);
  
  let notification = {
    title: 'Уведомление',
    body: 'У вас новое уведомление',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    tag: 'general',
    requireInteraction: false,
    vibrate: [200, 100, 200]
  };

  if (event.data) {
    try {
      const data = event.data.json();
      console.log('Push data received:', data);
      
      notification.title = data.title || notification.title;
      notification.body = data.body || notification.body;
      notification.tag = data.tag || notification.tag;
      notification.icon = data.icon || notification.icon;
      notification.data = {
        url: data.url || '/',
        ...data
      };
    } catch (e) {
      console.error('Error parsing push data:', e);
      notification.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(notification.title, notification)
  );
});

// Обработка клика по уведомлению
self.addEventListener('notificationclick', function(event) {
  console.log('Notification clicked:', event.notification);
  
  event.notification.close();
  
  const url = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      // Ищем открытое окно приложения
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          if (url !== '/') {
            client.navigate(url);
          }
          return;
        }
      }
      
      // Если нет открытого окна, открываем новое
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

// Обработка закрытия уведомления
self.addEventListener('notificationclose', function(event) {
  console.log('Notification closed:', event.notification);
});

console.log('Push Service Worker setup complete'); 