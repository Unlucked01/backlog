import axios, { AxiosResponse } from 'axios';
import Cookies from 'js-cookie';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor для добавления токена авторизации
api.interceptors.request.use((config) => {
  const token = Cookies.get('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor для обработки ошибок авторизации
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      Cookies.remove('access_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Типы данных
export interface User {
  id: number;
  email: string;
  full_name?: string;
  avatar_url?: string;
  is_verified: boolean;
  telegram_notifications: boolean;
  email_notifications: boolean;
  created_at: string;
}

export interface Task {
  id: number;
  title: string;
  description?: string;
  task_type: string;
  priority: string;
  status: string;
  deadline: string;
  color: string;
  created_at: string;
  steps: TaskStep[];
}

export interface TaskStep {
  id: number;
  title: string;
  description?: string;
  is_completed: boolean;
  order: number;
}

export interface TaskStats {
  total_tasks: number;
  completed_tasks: number;
  pending_tasks: number;
  overdue_tasks: number;
  yearly_debts: number;
  semester_debts: number;
}

export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface Achievement {
  id: number;
  name: string;
  description: string;
  icon: string;
  condition_type: string;
  condition_value: number;
  points: number;
  created_at: string;
}

export interface UserAchievement {
  id: number;
  achievement: Achievement;
  earned_at: string;
}

export interface UserStats {
  total_tasks: number;
  completed_tasks: number;
  pending_tasks: number;
  overdue_tasks: number;
  completion_rate: number;
  current_streak: number;
  total_points: number;
  achievements_count: number;
  completed_goals: number;
}

export interface Goal {
  id: number;
  title: string;
  description: string;
  goal_type: 'semester' | 'monthly' | 'weekly' | 'custom';
  target_value: number;
  current_value: number;
  start_date: string;
  end_date: string;
  is_completed: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// API методы для авторизации
export const authAPI = {
  async login(email: string, password: string): Promise<{ access_token: string; token_type: string }> {
    const response = await api.post('/api/v1/auth/login-json', { email, password });
    return response.data;
  },

  async register(email: string, password: string, full_name?: string): Promise<User> {
    const response = await api.post('/api/v1/auth/register', { email, password, full_name });
    return response.data;
  },

  async getCurrentUser(): Promise<User> {
    const response = await api.get('/api/v1/auth/me');
    return response.data;
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await api.post('/api/v1/auth/change-password', {
      current_password: currentPassword,
      new_password: newPassword,
    });
  },

  async savePushSubscription(subscription: PushSubscription): Promise<{ message: string }> {
    const response = await api.post('/api/v1/auth/push-subscription', subscription);
    return response.data;
  },

  async sendTestNotification(): Promise<{ message: string }> {
    const response = await api.post('/api/v1/auth/test-notification');
    return response.data;
  },
};

// API методы для задач
export const tasksAPI = {
  async getTasks(filters?: {
    task_type?: string;
    priority?: string;
    status?: string;
  }): Promise<Task[]> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
    }
    const response = await api.get(`/api/v1/tasks/?${params}`);
    return response.data;
  },

  async getTask(id: number): Promise<Task> {
    const response = await api.get(`/api/v1/tasks/${id}`);
    return response.data;
  },

  async createTask(task: {
    title: string;
    description?: string;
    task_type: string;
    priority: string;
    deadline: string;
    color?: string;
    steps?: { title: string; description?: string; order: number }[];
  }): Promise<Task> {
    const response = await api.post('/api/v1/tasks/', task);
    return response.data;
  },

  async updateTask(id: number, updates: Partial<Task>): Promise<Task> {
    const response = await api.put(`/api/v1/tasks/${id}`, updates);
    return response.data;
  },

  async deleteTask(id: number): Promise<void> {
    await api.delete(`/api/v1/tasks/${id}`);
  },

  async getUpcomingTasks(days: number = 7): Promise<Task[]> {
    const response = await api.get(`/api/v1/tasks/upcoming/list?days=${days}`);
    return response.data;
  },

  async getOverdueTasks(): Promise<Task[]> {
    const response = await api.get('/api/v1/tasks/overdue/list');
    return response.data;
  },

  async getTaskStats(): Promise<TaskStats> {
    const response = await api.get('/api/v1/tasks/stats/summary');
    return response.data;
  },

  async completeTaskStep(stepId: number, isCompleted: boolean): Promise<void> {
    await api.put(`/api/v1/tasks/steps/${stepId}/complete?is_completed=${isCompleted}`);
  },
};

// API методы для достижений и статистики
export const achievementsAPI = {
  async getUserAchievements(): Promise<UserAchievement[]> {
    const response = await api.get('/api/v1/achievements/user');
    return response.data;
  },

  async getAllAchievements(): Promise<Achievement[]> {
    const response = await api.get('/api/v1/achievements/');
    return response.data;
  },

  async getUserStats(): Promise<UserStats> {
    const response = await api.get('/api/v1/achievements/stats');
    return response.data;
  },
};

// API методы для целей
export const goalsAPI = {
  async getGoals(): Promise<Goal[]> {
    const response = await api.get('/api/v1/goals/');
    return response.data;
  },

  async getGoal(id: number): Promise<Goal> {
    const response = await api.get(`/api/v1/goals/${id}`);
    return response.data;
  },

  async createGoal(goal: Omit<Goal, 'id' | 'created_at' | 'updated_at' | 'current_value' | 'is_completed'>): Promise<Goal> {
    const response = await api.post('/api/v1/goals/', goal);
    return response.data;
  },

  async updateGoal(id: number, goal: Partial<Goal>): Promise<Goal> {
    const response = await api.put(`/api/v1/goals/${id}`, goal);
    return response.data;
  },

  async updateGoalProgress(id: number, increment: number = 1): Promise<Goal> {
    const response = await api.post(`/api/v1/goals/${id}/progress`, { increment });
    return response.data;
  },

  async deleteGoal(id: number): Promise<void> {
    await api.delete(`/api/v1/goals/${id}`);
  },
};

// Утилиты для работы с токенами
export const tokenUtils = {
  setToken(token: string): void {
    Cookies.set('access_token', token, { expires: 7 }); // 7 дней
  },

  getToken(): string | undefined {
    return Cookies.get('access_token');
  },

  removeToken(): void {
    Cookies.remove('access_token');
  },

  isAuthenticated(): boolean {
    return !!this.getToken();
  },
};

export default api; 