// Service Worker для push-уведомлений и запланированных напоминаний
const CACHE_NAME = 'student-planner-v2';
const urlsToCache = [
  '/',
  '/tasks',
  '/calendar',
  '/profile'
];

// Хранилище для запланированных уведомлений
let scheduledNotifications = [];
let notificationSchedules = [];
let scheduledIntervals = new Map();

// Установка Service Worker
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .catch(error => {
        console.error('Cache add failed:', error);
      })
  );
  self.skipWaiting(); // Активируем новый SW немедленно
});

// Активация Service Worker
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker activated');
      // Инициализируем запланированные уведомления при активации
      initializeScheduledNotifications();
      return self.clients.claim(); // Берем контроль над всеми клиентами
    })
  );
});

// Обработка fetch запросов (offline поддержка)
self.addEventListener('fetch', (event) => {
  // Пропускаем запросы к API для избежания проблем с CORS
  if (event.request.url.includes('/api/')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Возвращаем кешированную версию или делаем сетевой запрос
        if (response) {
          return response;
        }
        return fetch(event.request).catch(() => {
          // Если сеть недоступна, возвращаем основную страницу для SPA
          if (event.request.destination === 'document') {
            return caches.match('/');
          }
        });
      })
  );
});

// Обработка сообщений от главного потока
self.addEventListener('message', (event) => {
  console.log('Service Worker received message:', event.data);
  
  if (event.data && event.data.type === 'SCHEDULE_NOTIFICATIONS') {
    scheduleNotifications(event.data.schedules);
  } else if (event.data && event.data.type === 'SCHEDULE_CUSTOM_NOTIFICATION') {
    scheduleCustomNotification(event.data.notification);
  } else if (event.data && event.data.type === 'GET_SCHEDULED_NOTIFICATIONS') {
    // Отправляем текущие запланированные уведомления обратно
    event.ports[0].postMessage({
      type: 'SCHEDULED_NOTIFICATIONS_RESPONSE',
      notifications: scheduledNotifications
    });
  } else if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Инициализация запланированных уведомлений
function initializeScheduledNotifications() {
  console.log('Initializing scheduled notifications...');
  
  // Очищаем существующие интервалы
  scheduledIntervals.forEach((interval) => {
    clearInterval(interval);
  });
  scheduledIntervals.clear();
  
  try {
    // Основной интервал для проверки уведомлений
    const checkInterval = setInterval(() => {
      checkScheduledNotifications();
    }, 60000); // Проверяем каждую минуту
    
    scheduledIntervals.set('main_check', checkInterval);
    console.log('Scheduled notifications initialized');
  } catch (error) {
    console.error('Error initializing scheduled notifications:', error);
  }
}

// Планирование уведомлений на основе расписания
function scheduleNotifications(schedules) {
  console.log('Scheduling notifications for:', schedules);
  notificationSchedules = schedules;
  
  // Очищаем существующие интервалы для этих типов уведомлений
  schedules.forEach(schedule => {
    const existingInterval = scheduledIntervals.get(schedule.type);
    if (existingInterval) {
      clearInterval(existingInterval);
    }
    
    if (schedule.enabled) {
      setupScheduleInterval(schedule);
    }
  });
}

// Настройка интервала для конкретного расписания
function setupScheduleInterval(schedule) {
  console.log('Setting up interval for schedule:', schedule);
  
  const checkInterval = setInterval(() => {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    // Проверяем, нужно ли отправить уведомление
    if (shouldSendNotification(schedule, now, currentTime)) {
      sendScheduledNotification(schedule);
    }
  }, 60000); // Проверяем каждую минуту
  
  scheduledIntervals.set(schedule.type, checkInterval);
}

// Проверка, нужно ли отправить уведомление
function shouldSendNotification(schedule, now, currentTime) {
  if (schedule.time !== currentTime) {
    return false;
  }
  
  switch (schedule.type) {
    case 'task_deadline':
      // Уведомления о дедлайнах отправляем ежедневно
      return true;
      
    case 'daily_summary':
      // Ежедневная сводка отправляется каждый день
      return true;
      
    case 'weekly_review':
      // Недельный обзор отправляется в указанные дни недели
      const dayOfWeek = now.getDay();
      return schedule.days && schedule.days.includes(dayOfWeek);
      
    default:
      return false;
  }
}

// Отправка запланированного уведомления
function sendScheduledNotification(schedule) {
  let notificationData = getNotificationDataForSchedule(schedule);
  
  console.log('Sending scheduled notification:', notificationData);
  
  const notificationOptions = {
    body: notificationData.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    tag: schedule.type,
    data: {
      url: notificationData.url,
      type: 'scheduled',
      scheduleType: schedule.type
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
    requireInteraction: false,
    silent: false
  };
  
  self.registration.showNotification(notificationData.title, notificationOptions);
}

// Получение данных уведомления для конкретного типа расписания
function getNotificationDataForSchedule(schedule) {
  switch (schedule.type) {
    case 'task_deadline':
      return {
        title: '📅 Напоминание о дедлайнах',
        body: 'Проверьте ваши предстоящие дедлайны и задачи',
        url: '/tasks'
      };
      
    case 'daily_summary':
      return {
        title: '📊 Ежедневная сводка',
        body: 'Посмотрите статистику выполнения задач за сегодня',
        url: '/analytics'
      };
      
    case 'weekly_review':
      return {
        title: '📈 Недельный обзор',
        body: 'Время подвести итоги недели и спланировать следующую',
        url: '/analytics'
      };
      
    default:
      return {
        title: '🔔 Напоминание',
        body: 'У вас есть запланированное напоминание',
        url: '/'
      };
  }
}

// Планирование пользовательского уведомления
function scheduleCustomNotification(notification) {
  console.log('Scheduling custom notification:', notification);
  
  if (notification.recurring) {
    scheduleRecurringNotification(notification);
  } else {
    scheduleOneTimeNotification(notification);
  }
}

// Планирование повторяющегося уведомления
function scheduleRecurringNotification(notification) {
  const intervalId = setInterval(() => {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    if (notification.recurring.time === currentTime) {
      let shouldSend = false;
      
      if (notification.recurring.frequency === 'daily') {
        shouldSend = true;
      } else if (notification.recurring.frequency === 'weekly') {
        const dayOfWeek = now.getDay();
        shouldSend = notification.recurring.days && notification.recurring.days.includes(dayOfWeek);
      }
      
      if (shouldSend) {
        const notificationOptions = {
          body: notification.message,
          icon: '/icons/icon-192x192.png',
          badge: '/icons/icon-72x72.png',
          tag: `custom-${notification.id}`,
          data: {
            url: '/',
            type: 'custom',
            notificationId: notification.id
          },
          requireInteraction: false
        };
        
        self.registration.showNotification(notification.title, notificationOptions);
      }
    }
  }, 60000); // Проверяем каждую минуту
  
  scheduledIntervals.set(`custom-${notification.id}`, intervalId);
}

// Планирование одноразового уведомления
function scheduleOneTimeNotification(notification) {
  const scheduledTime = new Date(notification.scheduledFor);
  const now = new Date();
  const delay = scheduledTime.getTime() - now.getTime();
  
  if (delay > 0) {
    const timeoutId = setTimeout(() => {
      const notificationOptions = {
        body: notification.message,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        tag: `custom-${notification.id}`,
        data: {
          url: '/',
          type: 'custom',
          notificationId: notification.id
        },
        requireInteraction: true
      };
      
      self.registration.showNotification(notification.title, notificationOptions);
    }, delay);
    
    scheduledIntervals.set(`custom-${notification.id}`, timeoutId);
  }
}

// Проверка запланированных уведомлений
function checkScheduledNotifications() {
  // Здесь можно добавить дополнительную логику для проверки
  // уведомлений, которые нужно отправить
  console.log('Checking scheduled notifications...');
}

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
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
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
