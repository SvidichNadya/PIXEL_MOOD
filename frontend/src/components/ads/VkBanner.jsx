// frontend/src/components/ads/VkBanner.jsx
import React from 'react';
import { useVKAds } from '../../hooks/useVKAds';

/**
 * Компонент для отображения горизонтального рекламного баннера VK.
 * @param {string} position - 'top' или 'bottom' (по умолчанию 'bottom')
 * @param {string} heightType - 'regular' или 'compact' (по умолчанию 'regular')
 */
const VkBanner = ({ position = 'bottom', heightType = 'regular' }) => {
  const { containerRef, isAdLoaded, isAdShown, error } = useVKAds(position, heightType);

  if (error) {
    // В случае ошибки ничего не показываем (баннер не отобразится)
    return null;
  }

  if (!isAdLoaded) {
    // Показываем заглушку, пока баннер загружается
    return (
      <div className="w-full h-[60px] bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center text-gray-400 text-sm">
        Загрузка рекламы...
      </div>
    );
  }

  // VK Bridge сам вставляет баннер в переданный контейнер.
  // Контейнер нужен для корректной работы layout_type: 'resize'
  return <div ref={containerRef} className="w-full" />;
};

export default VkBanner;