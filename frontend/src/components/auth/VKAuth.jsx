import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import client from '../../api/client';
import { ENDPOINTS } from '../../api/endpoints';
import { useAuth } from '../../hooks/useAuth';
import { isVK } from '../../utils/platform';

const VKAuth = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const vkButtonRef = useRef(null);
  const widgetInitialized = useRef(false);

  // Проверка, запущено ли приложение внутри VK
  const isVKPlatform = isVK();

  // Инициализация VK Widgets
  useEffect(() => {
    if (!isVKPlatform || widgetInitialized.current) return;

    // Загружаем VK API
    const loadVKApi = () => {
      if (window.VK) {
        initVKWidget();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://vk.com/js/api/openapi.js?169';
      script.async = true;
      script.onload = () => {
        if (window.VK) {
          initVKWidget();
        }
      };
      document.head.appendChild(script);
    };

    const initVKWidget = () => {
      try {
        window.VK.Widgets.Auth(
          vkButtonRef.current,
          {
            onAuth: (user) => {
              handleVKAuth(user);
            },
            onAuthError: (error) => {
              console.error('VK auth error:', error);
              toast.error('Ошибка авторизации через VK');
            },
          },
          {
            lang: 'ru',
            width: '100%',
            onAuth: true,
          }
        );
        widgetInitialized.current = true;
      } catch (error) {
        console.error('VK Widget initialization error:', error);
      }
    };

    loadVKApi();

    return () => {
      // Очистка при размонтировании
      widgetInitialized.current = false;
    };
  }, [isVKPlatform]);

  const handleVKAuth = async (user) => {
    setIsLoading(true);
    try {
      // Получаем access_token из VK
      const vkAccessToken = user?.access_token || user?.session?.access_token;

      if (!vkAccessToken) {
        throw new Error('Не удалось получить токен доступа VK');
      }

      const response = await client.post(ENDPOINTS.AUTH.VK, {
        vk_access_token: vkAccessToken,
      });

      const { access_token, refresh_token, expires_at } = response.data;

      // Сохраняем токены
      localStorage.setItem('access_token', access_token);
      if (refresh_token) {
        localStorage.setItem('refresh_token', refresh_token);
      }
      if (expires_at) {
        localStorage.setItem('expires_at', expires_at);
      }

      // Обновляем состояние авторизации
      login();

      toast.success('Добро пожаловать через VK!');
      navigate('/');
    } catch (error) {
      const message = error.response?.data?.detail || 'Ошибка авторизации через VK';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  // Если не VK платформа — не показываем кнопку
  if (!isVKPlatform) {
    return null;
  }

  return (
    <div className="w-full">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-background text-text-muted">Или через</span>
        </div>
      </div>

      <div className="mt-4">
        <div ref={vkButtonRef} className="vk-auth-button" />
        {isLoading && (
          <div className="mt-2 text-center text-text-secondary text-sm">
            <span className="flex items-center justify-center">
              <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Авторизация через VK...
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default VKAuth;