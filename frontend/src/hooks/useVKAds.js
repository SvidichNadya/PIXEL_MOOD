// frontend/src/hooks/useVKAds.js
import { useEffect, useRef, useState } from 'react';
import bridge from '@vkontakte/vk-bridge';

/**
 * Хук для управления баннерной рекламой в VK Mini Apps.
 * @param {string} position - 'top' или 'bottom' (по умолчанию 'bottom')
 * @param {string} heightType - 'regular' или 'compact' (по умолчанию 'regular')
 */
export const useVKAds = (position = 'bottom', heightType = 'regular') => {
  const [isAdLoaded, setIsAdLoaded] = useState(false);
  const [isAdShown, setIsAdShown] = useState(false);
  const [error, setError] = useState(null);
  const containerRef = useRef(null);

  useEffect(() => {
    // Проверяем, что мы находимся внутри VK Mini App
    if (typeof bridge === 'undefined') {
      console.warn('VK Bridge is not available. Are you inside a VK Mini App?');
      return;
    }

    const showBanner = async () => {
      try {
        // Показываем баннерную рекламу
        // Документация: https://dev.vk.com/ru/bridge/VKWebAppShowBannerAd
        const result = await bridge.send('VKWebAppShowBannerAd', {
          banner_location: position, // 'top' или 'bottom'[reference:1]
          height_type: heightType,   // 'regular' или 'compact'[reference:2]
          layout_type: 'resize',     // экран уменьшится под размер баннера[reference:3]
        });

        if (result.result) {
          console.log('Banner ad shown successfully');
          setIsAdLoaded(true);
          setIsAdShown(true);
        } else {
          console.warn('Banner ad could not be shown');
          setIsAdLoaded(false);
          setIsAdShown(false);
        }
      } catch (err) {
        console.error('Failed to show banner ad:', err);
        setError(err);
        setIsAdLoaded(false);
        setIsAdShown(false);
      }
    };

    showBanner();

    // При размонтировании скрываем баннер
    return () => {
      if (typeof bridge !== 'undefined' && isAdShown) {
        bridge.send('VKWebAppHideBannerAd', {})
          .catch((err) => console.warn('Failed to hide banner:', err));
      }
    };
  }, [position, heightType]);

  return { containerRef, isAdLoaded, isAdShown, error };
};