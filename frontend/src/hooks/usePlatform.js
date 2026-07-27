import { useState, useEffect } from 'react';

/**
 * Хук для определения платформы запуска приложения
 * Возвращает: 'vk' | 'telegram' | 'web'
 */
export const usePlatform = () => {
  const [platform, setPlatform] = useState('web');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const detectPlatform = () => {
      if (typeof window === 'undefined') return 'web';

      // Проверка на VK Mini App
      if (window.VKWebApp) {
        return 'vk';
      }

      // Проверка на Telegram WebApp
      if (window.Telegram?.WebApp) {
        return 'telegram';
      }

      // Проверка через URL параметры (для обратной совместимости)
      const urlParams = new URLSearchParams(window.location.search);
      const platformParam = urlParams.get('platform');
      if (platformParam === 'vk') return 'vk';
      if (platformParam === 'telegram') return 'telegram';

      return 'web';
    };

    setPlatform(detectPlatform());
    setIsReady(true);
  }, []);

  return {
    platform,
    isReady,
    isVK: platform === 'vk',
    isTelegram: platform === 'telegram',
    isWeb: platform === 'web',
  };
};

export default usePlatform;