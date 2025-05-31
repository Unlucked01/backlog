import { format, formatDistanceToNow, isToday, isTomorrow, isYesterday } from 'date-fns';
import { ru } from 'date-fns/locale';
import clsx, { ClassValue } from 'clsx';

// Утилита для объединения классов
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

// Форматирование дат
export const dateUtils = {
  format: (date: string | Date, formatStr: string = 'dd.MM.yyyy'): string => {
    return format(new Date(date), formatStr, { locale: ru });
  },

  formatRelative: (date: string | Date): string => {
    const dateObj = new Date(date);
    
    if (isToday(dateObj)) {
      return 'Сегодня';
    }
    
    if (isTomorrow(dateObj)) {
      return 'Завтра';
    }
    
    if (isYesterday(dateObj)) {
      return 'Вчера';
    }
    
    return formatDistanceToNow(dateObj, { addSuffix: true, locale: ru });
  },

  formatDateTime: (date: string | Date): string => {
    return format(new Date(date), 'dd.MM.yyyy HH:mm', { locale: ru });
  },
};

// Утилиты для задач
export const taskUtils = {
  getPriorityLabel: (priority: string): string => {
    const labels: Record<string, string> = {
      yearly_debt: 'Годовой долг',
      semester_debt: 'Семестровый долг',
      current: 'Текущая',
    };
    return labels[priority] || priority;
  },

  getPriorityColor: (priority: string): string => {
    const colors: Record<string, string> = {
      yearly_debt: 'bg-red-100 text-red-800 border-red-200',
      semester_debt: 'bg-orange-100 text-orange-800 border-orange-200',
      current: 'bg-blue-100 text-blue-800 border-blue-200',
    };
    return colors[priority] || 'bg-gray-100 text-gray-800 border-gray-200';
  },

  getStatusLabel: (status: string): string => {
    const labels: Record<string, string> = {
      pending: 'Ожидает выполнения',
      in_progress: 'В процессе',
      completed: 'Выполнено',
      overdue: 'Просрочено',
    };
    return labels[status] || status;
  },

  getStatusColor: (status: string): string => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      in_progress: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      overdue: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  },

  getTypeLabel: (type: string): string => {
    const labels: Record<string, string> = {
      coursework: 'Курсовая работа',
      exam: 'Экзамен',
      laboratory: 'Лабораторная работа',
      lecture: 'Лекция',
      seminar: 'Семинар',
      project: 'Проект',
      homework: 'Домашнее задание',
      other: 'Другое',
    };
    return labels[type] || type;
  },

  isOverdue: (deadline: string): boolean => {
    return new Date(deadline) < new Date();
  },

  getDaysUntilDeadline: (deadline: string): number => {
    const today = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  },
};

// Утилиты для валидации
export const validationUtils = {
  isEmail: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  isStrongPassword: (password: string): boolean => {
    return password.length >= 8;
  },

  isEmpty: (value: string | null | undefined): boolean => {
    return !value || value.trim().length === 0;
  },
};

// Утилиты для уведомлений
export const notificationUtils = {
  requestPermission: async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  },

  showNotification: (title: string, options?: NotificationOptions): void => {
    if (Notification.permission === 'granted') {
      new Notification(title, {
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        ...options,
      });
    }
  },
};

// Константы
export const TASK_TYPES = [
  { value: 'coursework', label: 'Курсовая работа' },
  { value: 'exam', label: 'Экзамен' },
  { value: 'laboratory', label: 'Лабораторная работа' },
  { value: 'lecture', label: 'Лекция' },
  { value: 'seminar', label: 'Семинар' },
  { value: 'project', label: 'Проект' },
  { value: 'homework', label: 'Домашнее задание' },
  { value: 'other', label: 'Другое' },
];

export const TASK_PRIORITIES = [
  { value: 'yearly_debt', label: 'Годовой долг' },
  { value: 'semester_debt', label: 'Семестровый долг' },
  { value: 'current', label: 'Текущая' },
];

export const TASK_STATUSES = [
  { value: 'pending', label: 'Ожидает выполнения' },
  { value: 'in_progress', label: 'В процессе' },
  { value: 'completed', label: 'Выполнено' },
  { value: 'overdue', label: 'Просрочено' },
]; 