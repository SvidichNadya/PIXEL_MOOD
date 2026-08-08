// frontend/src/hooks/useVKAds.js
import { useEffect, useState } from 'react';
import bridge from '@vkontakte/vk-bridge';

export const useVKAds = () => {
  const [isAdVisible, setIsAdVisible] = useState(false);
  const [isBridgeReady, setIsBridgeReady] = useState(false);

  useEffect(() => {
    // Инициализация VK Bridge
    const initBridge = async () => {
      try {
        await bridge.send('VKWebAppInit');
        setIsBridgeReady(true);
      } catch (error) {
        console.warn('VK Bridge not available:', error);
        setIsBridgeReady(false);
      }
    };

    initBridge();
  }, []);

  /**
   * Показать баннерную рекламу
   * @param {string} placementId - ID рекламного блока (из рекламного кабинета VK)
   */
  const showBannerAd = async (placementId) => {
    if (!isBridgeReady) {
      console.warn('VK Bridge not ready');
      return false;
    }

    try {
      // Проверяем поддержку метода
      const supports = await bridge.supports('VKWebAppShowBannerAd');
      if (!supports) {
        console.warn('VKWebAppShowBannerAd not supported');
        return false;
      }

      // Показываем баннер
      const result = await bridge.send('VKWebAppShowBannerAd', {
        placement_id: placementId,
        orientation: 'horizontal', // Горизонтальный баннер
        height_type: 'adaptive',   // Адаптивная высота
      });

      console.log('Banner ad shown:', result);
      setIsAdVisible(true);
      return true;
    } catch (error) {
      console.error('Failed to show banner ad:', error);
      return false;
    }
  };

  /**
   * Скрыть баннерную рекламу
   */
  const hideBannerAd = async () => {
    if (!isBridgeReady) {
      return false;
    }

    try {
      await bridge.send('VKWebAppHideBannerAd', {});
      setIsAdVisible(false);
      return true;
    } catch (error) {
      console.error('Failed to hide banner ad:', error);
      return false;
    }
  };

  return {
    showBannerAd,
    hideBannerAd,
    isAdVisible,
    isBridgeReady,
  };
};