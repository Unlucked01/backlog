// Service Worker для push-уведомлений
const CACHE_NAME = 'student-planner-v1';
const urlsToCache = [
  '/',
  '/tasks',
  '/calendar',
  '/profile'
];

// Установка Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

// Активация Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Обработка fetch запросов (offline поддержка)
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Возвращаем кешированную версию или делаем сетевой запрос
        return response || fetch(event.request);
      }
    )
  );
});

// Обработка push-уведомлений
self.addEventListener('push', (event) => {
  console.log('Push event received:', event);
  
  let notificationData = {
    title: 'Новое уведомление',
    body: 'У вас есть новое уведомление',
    url: '/',
    tag: 'general'
  };

  if (event.data) {
    try {
      notificationData = event.data.json();
    } catch (e) {
      console.error('Ошибка парсинга данных push-уведомления:', e);
    }
  }

  const notificationOptions = {
    body: notificationData.body,
    tag: notificationData.tag,
    data: {
      url: notificationData.url
    },
    actions: [
      {
        action: 'view',
        title: 'Просмотреть'
      },
      {
        action: 'dismiss',
        title: 'Скрыть'
      }
    ],
    requireInteraction: true
  };

  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationOptions)
  );
});

// Обработка кликов по уведомлениям
self.addEventListener('notificationclick', (event) => {
  console.log('Notification click received:', event);
  
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  // Открываем приложение при клике на уведомление
  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then((clientList) => {
      // Проверяем, есть ли уже открытое окно с приложением
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(urlToOpen);
          return client.focus();
        }
      }
      
      // Если нет открытого окна, открываем новое
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Обработка закрытия уведомлений
self.addEventListener('notificationclose', (event) => {
  console.log('Notification closed:', event);
  // Здесь можно добавить аналитику или другую логику
}); 