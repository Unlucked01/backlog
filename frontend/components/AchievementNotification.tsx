'use client';

import { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { TrophyIcon as TrophyIconSolid } from '@heroicons/react/24/solid';
import { Achievement } from '@/lib/api';

interface AchievementNotificationProps {
  achievement: Achievement | null;
  onClose: () => void;
}

export default function AchievementNotification({ achievement, onClose }: AchievementNotificationProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (achievement) {
      setIsVisible(true);
      // Автоматически скрыть через 5 секунд
      const timer = setTimeout(() => {
        handleClose();
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [achievement]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300); // Задержка для анимации
  };

  if (!achievement) return null;

  return (
    <div className={`fixed top-4 right-4 z-50 transition-all duration-300 transform ${
      isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
    }`}>
      <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white p-6 rounded-2xl shadow-2xl max-w-sm border border-yellow-300">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="text-4xl animate-bounce">
              {achievement.icon}
            </div>
            <div>
              <div className="flex items-center space-x-2 mb-1">
                <TrophyIconSolid className="h-5 w-5" />
                <h3 className="font-bold text-lg">Новое достижение!</h3>
              </div>
              <h4 className="font-semibold text-base">{achievement.name}</h4>
              <p className="text-sm text-yellow-100 mt-1">{achievement.description}</p>
              <div className="mt-2">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-yellow-200 text-yellow-800">
                  +{achievement.points} очков
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-yellow-200 hover:text-white transition-colors"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
} 