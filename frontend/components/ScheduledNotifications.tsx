'use client';

import { useState, useEffect } from 'react';
import { BellIcon, ClockIcon, CalendarDaysIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { authAPI } from '@/lib/api';

interface ScheduledNotification {
  id: number;
  title: string;
  message: string;
  scheduledFor: string;
  type: 'deadline' | 'reminder' | 'daily' | 'weekly';
  isActive: boolean;
  recurring?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    days?: number[]; // 0-6 для дней недели
    time: string; // HH:mm
  };
}

interface NotificationSchedule {
  type: 'task_deadline' | 'daily_summary' | 'weekly_review' | 'custom';
  enabled: boolean;
  time: string;
  days?: number[];
}

const defaultSchedules: NotificationSchedule[] = [
  {
    type: 'task_deadline',
    enabled: true,
    time: '09:00',
  },
  {
    type: 'daily_summary',
    enabled: false,
    time: '20:00',
  },
  {
    type: 'weekly_review',
    enabled: false,
    time: '10:00',
    days: [1], // Понедельник
  },
];

const scheduleTypeNames = {
  task_deadline: 'Напоминания о дедлайнах',
  daily_summary: 'Ежедневная сводка',
  weekly_review: 'Недельный обзор',
  custom: 'Пользовательское',
};

const dayNames = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

export default function ScheduledNotifications() {
  const [schedules, setSchedules] = useState<NotificationSchedule[]>(defaultSchedules);
  const [notifications, setNotifications] = useState<ScheduledNotification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newNotification, setNewNotification] = useState({
    title: '',
    message: '',
    type: 'reminder' as const,
    scheduledFor: '',
    recurring: false,
    frequency: 'daily' as 'daily' | 'weekly',
    time: '09:00',
    days: [] as number[],
  });

  useEffect(() => {
    loadSchedules();
    loadNotifications();
  }, []);

  const loadSchedules = async () => {
    try {
      // В реальном приложении загружаем с сервера
      const savedSchedules = localStorage.getItem('notification_schedules');
      if (savedSchedules) {
        setSchedules(JSON.parse(savedSchedules));
      }
    } catch (error) {
      console.error('Ошибка загрузки расписаний:', error);
    }
  };

  const loadNotifications = async () => {
    try {
      // В реальном приложении загружаем с сервера
      const savedNotifications = localStorage.getItem('scheduled_notifications');
      if (savedNotifications) {
        setNotifications(JSON.parse(savedNotifications));
      }
    } catch (error) {
      console.error('Ошибка загрузки уведомлений:', error);
    }
  };

  const saveSchedules = async (newSchedules: NotificationSchedule[]) => {
    try {
      localStorage.setItem('notification_schedules', JSON.stringify(newSchedules));
      setSchedules(newSchedules);
      
      // Запланировать новые Service Worker задачи
      await scheduleServiceWorkerNotifications(newSchedules);
    } catch (error) {
      console.error('Ошибка сохранения расписаний:', error);
    }
  };

  const scheduleServiceWorkerNotifications = async (schedules: NotificationSchedule[]) => {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      
      // Отправляем расписания в Service Worker
      registration.active?.postMessage({
        type: 'SCHEDULE_NOTIFICATIONS',
        schedules: schedules.filter(s => s.enabled),
      });
    }
  };

  const toggleSchedule = async (index: number) => {
    const newSchedules = [...schedules];
    newSchedules[index].enabled = !newSchedules[index].enabled;
    await saveSchedules(newSchedules);
  };

  const updateScheduleTime = async (index: number, time: string) => {
    const newSchedules = [...schedules];
    newSchedules[index].time = time;
    await saveSchedules(newSchedules);
  };

  const updateScheduleDays = async (index: number, days: number[]) => {
    const newSchedules = [...schedules];
    newSchedules[index].days = days;
    await saveSchedules(newSchedules);
  };

  const addCustomNotification = async () => {
    if (!newNotification.title || !newNotification.message) {
      alert('Заполните название и текст уведомления');
      return;
    }

    setIsLoading(true);
    try {
      const notification: ScheduledNotification = {
        id: Date.now(),
        title: newNotification.title,
        message: newNotification.message,
        type: newNotification.type,
        scheduledFor: newNotification.recurring 
          ? 'recurring' 
          : newNotification.scheduledFor,
        isActive: true,
        recurring: newNotification.recurring ? {
          frequency: newNotification.frequency,
          time: newNotification.time,
          days: newNotification.days,
        } : undefined,
      };

      const newNotifications = [...notifications, notification];
      setNotifications(newNotifications);
      localStorage.setItem('scheduled_notifications', JSON.stringify(newNotifications));

      // Сбрасываем форму
      setNewNotification({
        title: '',
        message: '',
        type: 'reminder',
        scheduledFor: '',
        recurring: false,
        frequency: 'daily',
        time: '09:00',
        days: [],
      });
      setShowAddForm(false);

      // Планируем уведомление
      await scheduleCustomNotification(notification);
      
    } catch (error) {
      console.error('Ошибка добавления уведомления:', error);
      alert('Ошибка при добавлении уведомления');
    } finally {
      setIsLoading(false);
    }
  };

  const scheduleCustomNotification = async (notification: ScheduledNotification) => {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      
      registration.active?.postMessage({
        type: 'SCHEDULE_CUSTOM_NOTIFICATION',
        notification,
      });
    }
  };

  const removeNotification = async (id: number) => {
    const newNotifications = notifications.filter(n => n.id !== id);
    setNotifications(newNotifications);
    localStorage.setItem('scheduled_notifications', JSON.stringify(newNotifications));
  };

  const sendTestNotification = async () => {
    try {
      // Отправляем запрос на backend для отправки push-уведомления
      const response = await authAPI.sendTestNotification();
      console.log('Test notification sent:', response);
      
      // Дополнительно показываем локальное уведомление для подтверждения через Service Worker
      // if ('serviceWorker' in navigator && 'PushManager' in window) {
      //   if (Notification.permission === 'granted') {
      //     try {
      //       const registration = await navigator.serviceWorker.ready;
      //       registration.showNotification('🔔 Тестовое уведомление отправлено', {
      //         body: 'Проверьте получение push-уведомления',
      //         icon: '/icons/icon-192x192.png',
      //         badge: '/icons/icon-72x72.png',
      //         tag: 'test-scheduled',
      //         requireInteraction: false,
      //       });
      //     } catch (error) {
      //       console.error('Ошибка показа уведомления через Service Worker:', error);
      //     }
      //   }
      // }
    } catch (error) {
      console.error('Ошибка отправки тестового уведомления:', error);
      alert('Ошибка отправки тестового уведомления');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg">
              <ClockIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Расписание уведомлений</h3>
              <p className="text-sm text-gray-600">Настройте автоматические напоминания</p>
            </div>
          </div>
          <button
            onClick={sendTestNotification}
            className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium"
          >
            Тест
          </button>
        </div>

        <div className="space-y-4">
          {schedules.map((schedule, index) => (
            <div 
              key={schedule.type}
              className="p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
            >
              {/* Mobile Layout */}
              <div className="block sm:hidden">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      checked={schedule.enabled}
                      onChange={() => toggleSchedule(index)}
                      className="h-5 w-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500 mt-0.5"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 text-sm">
                        {scheduleTypeNames[schedule.type]}
                      </h4>
                      <p className="text-xs text-gray-600">
                        {schedule.type === 'weekly_review' && schedule.days ? 
                          `${schedule.days.map(d => dayNames[d]).join(', ')}, ` : ''}
                        {schedule.time}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <label className="text-sm font-medium text-gray-700 min-w-0 flex-shrink-0">Время:</label>
                    <input
                      type="time"
                      value={schedule.time}
                      onChange={(e) => updateScheduleTime(index, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      disabled={!schedule.enabled}
                    />
                  </div>
                  
                  {schedule.type === 'weekly_review' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Дни недели:</label>
                      <div className="flex flex-wrap gap-2">
                        {dayNames.map((day, dayIndex) => (
                          <button
                            key={dayIndex}
                            onClick={() => {
                              const currentDays = schedule.days || [];
                              const newDays = currentDays.includes(dayIndex)
                                ? currentDays.filter(d => d !== dayIndex)
                                : [...currentDays, dayIndex];
                              updateScheduleDays(index, newDays);
                            }}
                            disabled={!schedule.enabled}
                            className={`min-w-[32px] h-8 rounded-full text-xs font-medium transition-colors touch-manipulation ${
                              schedule.days?.includes(dayIndex)
                                ? 'bg-purple-600 text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            } ${!schedule.enabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            {day}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Desktop Layout */}
              <div className="hidden sm:flex sm:items-center sm:justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={schedule.enabled}
                      onChange={() => toggleSchedule(index)}
                      className="h-5 w-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">
                      {scheduleTypeNames[schedule.type]}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {schedule.type === 'weekly_review' && schedule.days ? 
                        `${schedule.days.map(d => dayNames[d]).join(', ')}, ` : ''}
                      {schedule.time}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <input
                    type="time"
                    value={schedule.time}
                    onChange={(e) => updateScheduleTime(index, e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    disabled={!schedule.enabled}
                  />
                  
                  {schedule.type === 'weekly_review' && (
                    <div className="flex flex-wrap gap-1">
                      {dayNames.map((day, dayIndex) => (
                        <button
                          key={dayIndex}
                          onClick={() => {
                            const currentDays = schedule.days || [];
                            const newDays = currentDays.includes(dayIndex)
                              ? currentDays.filter(d => d !== dayIndex)
                              : [...currentDays, dayIndex];
                            updateScheduleDays(index, newDays);
                          }}
                          disabled={!schedule.enabled}
                          className={`w-8 h-8 rounded-full text-xs font-medium transition-colors ${
                            schedule.days?.includes(dayIndex)
                              ? 'bg-purple-600 text-white'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          } ${!schedule.enabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          {day}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Пользовательские уведомления */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-green-500 to-teal-600 rounded-lg">
              <BellIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Пользовательские напоминания</h3>
              <p className="text-sm text-gray-600">Создайте собственные уведомления</p>
            </div>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm font-medium"
          >
            {showAddForm ? 'Скрыть' : 'Добавить'}
          </button>
        </div>

        {showAddForm && (
          <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Название
                </label>
                <input
                  type="text"
                  value={newNotification.title}
                  onChange={(e) => setNewNotification(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Например: Выполнить домашнее задание"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Сообщение
                </label>
                <input
                  type="text"
                  value={newNotification.message}
                  onChange={(e) => setNewNotification(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Не забудьте выполнить задание по математике"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Повторяющееся уведомление
                </label>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newNotification.recurring}
                    onChange={(e) => setNewNotification(prev => ({ ...prev, recurring: e.target.checked }))}
                    className="h-4 w-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                  />
                  <span className="ml-2 text-sm text-gray-600">Повторять регулярно</span>
                </div>
              </div>

              {newNotification.recurring ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Частота
                    </label>
                    <select
                      value={newNotification.frequency}
                      onChange={(e) => setNewNotification(prev => ({ ...prev, frequency: e.target.value as 'daily' | 'weekly' }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="daily">Ежедневно</option>
                      <option value="weekly">Еженедельно</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Время
                    </label>
                    <input
                      type="time"
                      value={newNotification.time}
                      onChange={(e) => setNewNotification(prev => ({ ...prev, time: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>

                  {newNotification.frequency === 'weekly' && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Дни недели
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {dayNames.map((day, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => {
                              const newDays = newNotification.days.includes(index)
                                ? newNotification.days.filter(d => d !== index)
                                : [...newNotification.days, index];
                              setNewNotification(prev => ({ ...prev, days: newDays }));
                            }}
                            className={`min-w-[36px] px-3 py-2 rounded-lg text-sm font-medium transition-colors touch-manipulation ${
                              newNotification.days.includes(index)
                                ? 'bg-green-600 text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            {day}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Дата и время
                  </label>
                  <input
                    type="datetime-local"
                    value={newNotification.scheduledFor}
                    onChange={(e) => setNewNotification(prev => ({ ...prev, scheduledFor: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 mt-4">
              <button
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={addCustomNotification}
                disabled={isLoading}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {isLoading ? '...' : 'Добавить'}
              </button>
            </div>
          </div>
        )}

        {/* Список пользовательских уведомлений */}
        {notifications.length > 0 && (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <div 
                key={notification.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className={`w-3 h-3 rounded-full ${
                    notification.isActive ? 'bg-green-500' : 'bg-gray-300'
                  }`}></div>
                  <div>
                    <h4 className="font-medium text-gray-900">{notification.title}</h4>
                    <p className="text-sm text-gray-600">{notification.message}</p>
                    <p className="text-xs text-gray-500">
                      {notification.recurring ? (
                        `${notification.recurring.frequency === 'daily' ? 'Ежедневно' : 'Еженедельно'} в ${notification.recurring.time}`
                      ) : (
                        new Date(notification.scheduledFor).toLocaleString('ru-RU')
                      )}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => removeNotification(notification.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {notifications.length === 0 && !showAddForm && (
          <div className="text-center py-8 text-gray-500">
            <CalendarDaysIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Нет запланированных уведомлений</p>
            <p className="text-sm">Нажмите "Добавить" чтобы создать напоминание</p>
          </div>
        )}
      </div>
    </div>
  );
} 