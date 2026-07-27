/**
 * Определяет платформу, на которой запущено приложение.
 * Возвращает: 'vk' | 'telegram' | 'web'
 */
export const getPlatform = () => {
  if (typeof window === 'undefined') return 'web';

  // Проверка на VK Mini App
  if (window.VKWebApp) {
    return 'vk';
  }

  // Проверка на Telegram WebApp
  if (window.Telegram?.WebApp) {
    return 'telegram';
  }

  // Проверка через URL параметры (для обратной совместимости и тестирования)
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const platformParam = urlParams.get('platform');
    if (platformParam === 'vk') return 'vk';
    if (platformParam === 'telegram') return 'telegram';
  } catch (e) {
    // ignore
  }

  return 'web';
};

/**
 * Проверяет, запущено ли приложение внутри VK
 */
export const isVK = () => getPlatform() === 'vk';

/**
 * Проверяет, запущено ли приложение внутри Telegram
 */
export const isTelegram = () => getPlatform() === 'telegram';

/**
 * Проверяет, запущено ли приложение в обычном браузере (web)
 */
export const isWeb = () => getPlatform() === 'web';

/**
 * Возвращает объект с настройками для конкретной платформы
 * (например, цвета, стили, поведение)
 */
export const getPlatformConfig = () => {
  const platform = getPlatform();
  switch (platform) {
    case 'vk':
      return {
        platform,
        theme: 'vk',
        backButton: true,
        shareButton: true,
        defaultShareText: 'Поделиться в VK',
        color: '#4a76a8',
      };
    case 'telegram':
      return {
        platform,
        theme: 'telegram',
        backButton: true,
        shareButton: true,
        defaultShareText: 'Поделиться в Telegram',
        color: '#0088cc',
      };
    default:
      return {
        platform,
        theme: 'web',
        backButton: false,
        shareButton: true,
        defaultShareText: 'Поделиться',
        color: '#4f8cf7',
      };
  }
};

/**
 * Получает цвет темы для текущей платформы
 */
export const getPlatformColor = () => {
  const config = getPlatformConfig();
  return config.color;
};

/**
 * Проверяет, доступен ли API конкретной платформы
 */
export const isPlatformApiAvailable = () => {
  const platform = getPlatform();
  if (platform === 'vk') {
    return typeof window.VK !== 'undefined' && window.VK.Widgets;
  }
  if (platform === 'telegram') {
    return typeof window.Telegram !== 'undefined' && window.Telegram.WebApp;
  }
  return true; // для web всегда доступно
};

/**
 * Инициализирует платформу (например, Telegram WebApp)
 * Возвращает промис, который разрешается после инициализации
 */
export const initializePlatform = async () => {
  const platform = getPlatform();
  if (platform === 'telegram') {
    try {
      if (window.Telegram && window.Telegram.WebApp) {
        // Расширяем WebApp
        window.Telegram.WebApp.expand();
        window.Telegram.WebApp.ready();
        return true;
      }
      // если не загрузилось — ждём
      return new Promise((resolve) => {
        const check = () => {
          if (window.Telegram && window.Telegram.WebApp) {
            window.Telegram.WebApp.expand();
            window.Telegram.WebApp.ready();
            resolve(true);
          } else {
            setTimeout(check, 100);
          }
        };
        check();
      });
    } catch (e) {
      console.warn('Telegram WebApp init error:', e);
      return false;
    }
  }
  return true;
};

/**
 * Получает данные пользователя из Telegram WebApp (если доступно)
 */
export const getTelegramUser = () => {
  if (isTelegram() && window.Telegram?.WebApp?.initDataUnsafe?.user) {
    return window.Telegram.WebApp.initDataUnsafe.user;
  }
  return null;
};

/**
 * Получает initData из Telegram WebApp
 */
export const getTelegramInitData = () => {
  if (isTelegram() && window.Telegram?.WebApp?.initData) {
    return window.Telegram.WebApp.initData;
  }
  return null;
};

/**
 * Вызывает нативное событие "поделиться" для текущей платформы
 */
export const shareContent = (text, url) => {
  const platform = getPlatform();
  if (platform === 'vk') {
    // VK Share (если доступен)
    if (window.VK && window.VK.Widgets) {
      // VK имеет свой виджет шаринга, можно вызвать
      return;
    }
  }
  if (platform === 'telegram') {
    // В Telegram можно использовать WebApp.openTelegramLink или просто скопировать ссылку
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`);
      return;
    }
  }
  // Fallback: обычный web share
  if (navigator.share) {
    navigator.share({ title: text, text: text, url: url });
  } else {
    // Копирование ссылки в буфер
    navigator.clipboard?.writeText(url || text);
  }
};