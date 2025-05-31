'use client';

import { CheckIcon } from '@heroicons/react/24/outline';
import { type TaskStep } from '@/lib/api';

interface TaskProgressProps {
  steps: TaskStep[];
  onStepToggle?: (stepId: number, currentStatus: boolean) => void;
  stepsLoading?: Record<number, boolean>;
  readonly?: boolean;
  className?: string;
}

export default function TaskProgress({ 
  steps, 
  onStepToggle, 
  stepsLoading = {}, 
  readonly = false,
  className = '' 
}: TaskProgressProps) {
  const calculateProgress = (): number => {
    if (steps.length === 0) return 0;
    const completedSteps = steps.filter(step => step.is_completed).length;
    return Math.round((completedSteps / steps.length) * 100);
  };

  const progress = calculateProgress();

  if (steps.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Progress Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Прогресс выполнения</h3>
        <span className="text-sm font-medium text-gray-600">{progress}%</span>
      </div>
      
      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-3">
        <div 
          className={`h-3 rounded-full transition-all duration-300 ${
            progress === 100 
              ? 'bg-gradient-to-r from-green-500 to-green-600' 
              : 'bg-gradient-to-r from-blue-500 to-purple-600'
          }`}
          style={{ width: `${progress}%` }}
        ></div>
      </div>

      {/* Steps List */}
      <div className="space-y-3">
        {steps.map((step) => (
          <div 
            key={step.id} 
            onClick={() => !readonly && onStepToggle?.(step.id, step.is_completed)}
            className={`flex items-center justify-between p-3 rounded-lg border transition-all duration-200 ${
              step.is_completed 
                ? 'bg-green-50 border-green-200' 
                : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
            } ${
              readonly 
                ? 'cursor-default' 
                : stepsLoading[step.id] 
                ? 'opacity-50 cursor-not-allowed' 
                : 'cursor-pointer hover:shadow-sm'
            }`}
          >
            <div className="flex items-center space-x-3">
              <div
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                  step.is_completed
                    ? 'bg-green-500 border-green-500 text-white'
                    : readonly
                    ? 'border-gray-300'
                    : 'border-gray-300 hover:border-blue-500'
                } ${
                  stepsLoading[step.id] 
                    ? 'opacity-50' 
                    : ''
                }`}
              >
                {stepsLoading[step.id] ? (
                  <div className="animate-spin rounded-full h-3 w-3 border border-white border-t-transparent"></div>
                ) : step.is_completed ? (
                  <CheckIcon className="h-3 w-3" />
                ) : null}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className={`font-medium ${
                  step.is_completed 
                    ? 'text-green-800 line-through' 
                    : 'text-gray-900'
                }`}>
                  {step.title}
                </p>
                {step.description && (
                  <p className={`text-sm mt-1 ${
                    step.is_completed 
                      ? 'text-green-600' 
                      : 'text-gray-600'
                  }`}>
                    {step.description}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="flex items-center justify-between text-sm text-gray-600 pt-3 border-t border-gray-200">
        <span>
          {steps.filter(s => s.is_completed).length} из {steps.length} этапов выполнено
        </span>
        {progress === 100 && (
          <span className="text-green-600 font-medium flex items-center">
            <CheckIcon className="h-4 w-4 mr-1" />
            Все этапы завершены!
          </span>
        )}
      </div>
    </div>
  );
} 