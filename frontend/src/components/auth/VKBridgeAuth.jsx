// frontend/src/components/auth/VKBridgeAuth.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import bridge from '@vkontakte/vk-bridge';
import toast from 'react-hot-toast';
import client from '../../api/client';
import { ENDPOINTS } from '../../api/endpoints';
import { useAuth } from '../../hooks/useAuth';

const VKBridgeAuth = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Проверяем, запущено ли приложение внутри VK
    const isVKPlatform = window.VKWebApp !== undefined;
    if (!isVKPlatform) return;

    const authViaBridge = async () => {
      setIsLoading(true);
      try {
        // 1. Получаем параметры запуска от VK
        const launchParams = await bridge.send('VKWebAppGetLaunchParams');
        console.log('VK Launch Params:', launchParams);

        // 2. Отправляем vk_user_id и sign на бэкенд
        const response = await client.post(ENDPOINTS.AUTH.VK_BRIDGE, {
          vk_user_id: launchParams.vk_user_id,
          sign: launchParams.sign,
          vk_ts: launchParams.vk_ts,
        });

        const { access_token, refresh_token } = response.data;
        localStorage.setItem('access_token', access_token);
        if (refresh_token) {
          localStorage.setItem('refresh_token', refresh_token);
        }

        // 3. Обновляем состояние авторизации
        await login();
        toast.success('Добро пожаловать!');
        navigate('/');
      } catch (error) {
        console.error('VK Bridge auth error:', error);
        toast.error(error.response?.data?.detail || 'Ошибка авторизации через VK');
      } finally {
        setIsLoading(false);
      }
    };

    // Запускаем авторизацию автоматически
    authViaBridge();
  }, []);

  if (isLoading) {
    return (
      <div className="text-center py-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto" />
        <p className="mt-2 text-gray-600">Авторизация через VK...</p>
      </div>
    );
  }

  return null;
};

export default VKBridgeAuth;