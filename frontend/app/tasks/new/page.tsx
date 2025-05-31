'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm, useFieldArray } from 'react-hook-form';
import { tasksAPI } from '@/lib/api';
import { TASK_TYPES, TASK_PRIORITIES } from '@/lib/utils';
import { 
  ArrowLeftIcon,
  PlusIcon,
  TrashIcon
} from '@heroicons/react/24/outline';

interface TaskForm {
  title: string;
  description: string;
  task_type: string;
  priority: string;
  deadline: string;
  color: string;
  steps: { title: string; description: string; order: number }[];
}

export default function NewTaskPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<TaskForm>({
    defaultValues: {
      title: '',
      description: '',
      task_type: 'homework',
      priority: 'current',
      deadline: '',
      color: '#3B82F6',
      steps: []
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'steps'
  });

  const onSubmit = async (data: TaskForm) => {
    setIsLoading(true);
    setError(null);

    try {
      const taskData = {
        ...data,
        deadline: new Date(data.deadline).toISOString(),
        steps: data.steps.map((step, index) => ({
          ...step,
          order: index
        }))
      };

      await tasksAPI.createTask(taskData);
      router.push('/tasks');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка создания задачи');
    } finally {
      setIsLoading(false);
    }
  };

  const addStep = () => {
    append({ title: '', description: '', order: fields.length });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Link href="/tasks" className="mr-4 text-gray-600 hover:text-gray-900">
              <ArrowLeftIcon className="h-6 w-6" />
            </Link>
            <h1 className="text-xl font-semibold text-gray-900">Новая задача</h1>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  Название задачи *
                </label>
                <input
                  {...register('title', { required: 'Название обязательно' })}
                  type="text"
                  className="input"
                  placeholder="Например: Подготовить курсовую работу"
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Описание
                </label>
                <textarea
                  {...register('description')}
                  rows={3}
                  className="input"
                  placeholder="Дополнительная информация о задаче..."
                />
              </div>

              <div>
                <label htmlFor="task_type" className="block text-sm font-medium text-gray-700 mb-2">
                  Тип задачи *
                </label>
                <select
                  {...register('task_type', { required: 'Тип задачи обязателен' })}
                  className="input"
                >
                  {TASK_TYPES.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
                {errors.task_type && (
                  <p className="mt-1 text-sm text-red-600">{errors.task_type.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-2">
                  Приоритет *
                </label>
                <select
                  {...register('priority', { required: 'Приоритет обязателен' })}
                  className="input"
                >
                  {TASK_PRIORITIES.map(priority => (
                    <option key={priority.value} value={priority.value}>{priority.label}</option>
                  ))}
                </select>
                {errors.priority && (
                  <p className="mt-1 text-sm text-red-600">{errors.priority.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="deadline" className="block text-sm font-medium text-gray-700 mb-2">
                  Дедлайн *
                </label>
                <input
                  {...register('deadline', { required: 'Дедлайн обязателен' })}
                  type="datetime-local"
                  className="input"
                />
                {errors.deadline && (
                  <p className="mt-1 text-sm text-red-600">{errors.deadline.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="color" className="block text-sm font-medium text-gray-700 mb-2">
                  Цвет
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    {...register('color')}
                    type="color"
                    className="h-10 w-20 border border-gray-300 rounded cursor-pointer"
                  />
                  <span className="text-sm text-gray-500">Для отображения в календаре</span>
                </div>
              </div>
            </div>

            {/* Task Steps */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Этапы выполнения</h3>
                <button
                  type="button"
                  onClick={addStep}
                  className="btn btn-secondary flex items-center space-x-2"
                >
                  <PlusIcon className="h-4 w-4" />
                  <span>Добавить этап</span>
                </button>
              </div>

              {fields.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>Этапы не добавлены</p>
                  <p className="text-sm">Разбейте задачу на подзадачи для лучшего контроля</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {fields.map((field, index) => (
                    <div key={field.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="text-sm font-medium text-gray-700">Этап {index + 1}</h4>
                        <button
                          type="button"
                          onClick={() => remove(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                      
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Название этапа *
                          </label>
                          <input
                            {...register(`steps.${index}.title`, { required: 'Название этапа обязательно' })}
                            type="text"
                            className="input"
                            placeholder="Что нужно сделать?"
                          />
                          {errors.steps?.[index]?.title && (
                            <p className="mt-1 text-sm text-red-600">{errors.steps[index]?.title?.message}</p>
                          )}
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Описание этапа
                          </label>
                          <textarea
                            {...register(`steps.${index}.description`)}
                            rows={2}
                            className="input"
                            placeholder="Дополнительная информация..."
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submit Buttons */}
            <div className="flex items-center justify-end space-x-3 pt-6 border-t">
              <Link href="/tasks" className="btn btn-secondary">
                Отмена
              </Link>
              <button
                type="submit"
                disabled={isLoading}
                className="btn btn-primary"
              >
                {isLoading ? 'Создание...' : 'Создать задачу'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
} 