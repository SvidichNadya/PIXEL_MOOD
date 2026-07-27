import React, { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import client from '../api/client';
import { ENDPOINTS } from '../api/endpoints';
import usePlatform from '../hooks/usePlatform';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { platform } = usePlatform();
  const navigate = useNavigate();

  // Функция получения профиля текущего пользователя
  const fetchUser = useCallback(async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await client.get(ENDPOINTS.AUTH.ME);
      const userData = response.data;
      setUser(userData);
      setIsAuthenticated(true);
    } catch (error) {
      // Если токен невалидный или истек — чистим
      if (error.response?.status === 401) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('expires_at');
        setUser(null);
        setIsAuthenticated(false);
      } else {
        console.error('Failed to fetch user:', error);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Загрузка пользователя при монтировании
  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  // Вход в систему (после успешной аутентификации на бекенде)
  const login = useCallback(async () => {
    await fetchUser();
    navigate('/');
  }, [fetchUser, navigate]);

  const register = useCallback(async () => {
    await fetchUser();
    navigate('/');
  }, [fetchUser, navigate]);

  // Выход
  const logout = useCallback(async () => {
    try {
      // Попытка вызвать logout на бекенде (опционально)
      await client.post(ENDPOINTS.AUTH.LOGOUT);
    } catch (error) {
      // Игнорируем ошибки, главное — очистить локальное состояние
      console.error('Logout API error:', error);
    } finally {
      // Очищаем все локальные данные
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('expires_at');
      setUser(null);
      setIsAuthenticated(false);
      navigate('/login');
    }
  }, [navigate]);

  // Обновление пользовательских данных (после редактирования профиля)
  const updateUser = useCallback((updatedData) => {
    setUser((prev) => ({
      ...prev,
      ...updatedData,
    }));
  }, []);

  // Проверка, истек ли токен (по expires_at)
  const isTokenExpired = useCallback(() => {
    const expiresAt = localStorage.getItem('expires_at');
    if (!expiresAt) return true;
    return new Date(expiresAt) < new Date();
  }, []);

  // Обновление токена (вызывается из перехватчика client)
  const refreshToken = useCallback(async () => {
    const refreshTokenValue = localStorage.getItem('refresh_token');
    if (!refreshTokenValue) {
      throw new Error('No refresh token');
    }
    try {
      const response = await client.post(ENDPOINTS.AUTH.REFRESH, {
        refresh_token: refreshTokenValue,
      });
      const { access_token, refresh_token: newRefreshToken, expires_at } = response.data;
      localStorage.setItem('access_token', access_token);
      if (newRefreshToken) {
        localStorage.setItem('refresh_token', newRefreshToken);
      }
      if (expires_at) {
        localStorage.setItem('expires_at', expires_at);
      }
      return access_token;
    } catch (error) {
      // Если обновление не удалось — выходим
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('expires_at');
      setUser(null);
      setIsAuthenticated(false);
      navigate('/login');
      throw error;
    }
  }, [navigate]);

  // Вход через социальную сеть (VK/Telegram)
  const socialLogin = useCallback(async (provider, accessToken) => {
    try {
      let endpoint;
      let payload;
      if (provider === 'vk') {
        endpoint = ENDPOINTS.AUTH.VK;
        payload = { vk_access_token: accessToken };
      } else if (provider === 'telegram') {
        endpoint = ENDPOINTS.AUTH.TG;
        payload = { init_data: accessToken };
      } else {
        throw new Error('Unsupported provider');
      }

      const response = await client.post(endpoint, payload);
      const { access_token, refresh_token, expires_at } = response.data;
      localStorage.setItem('access_token', access_token);
      if (refresh_token) {
        localStorage.setItem('refresh_token', refresh_token);
      }
      if (expires_at) {
        localStorage.setItem('expires_at', expires_at);
      }
      await fetchUser();
      navigate('/');
      toast.success(`Добро пожаловать через ${provider}!`);
    } catch (error) {
      const msg = error.response?.data?.detail || `Ошибка входа через ${provider}`;
      toast.error(msg);
      throw error;
    }
  }, [fetchUser, navigate]);

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated,
      platform,
      login,
      register,
      logout,
      updateUser,
      fetchUser,
      isTokenExpired,
      refreshToken,
      socialLogin,
    }),
    [
      user,
      loading,
      isAuthenticated,
      platform,
      login,
      register,
      logout,
      updateUser,
      fetchUser,
      isTokenExpired,
      refreshToken,
      socialLogin,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;