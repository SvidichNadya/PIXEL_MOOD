import React, { createContext, useContext, useState, useEffect } from 'react';
import client from '../api/client';
import { ENDPOINTS } from '../api/endpoints';

// ============================================================
// Создание контекста
// ============================================================
const AuthContext = createContext(null);

// ============================================================
// Провайдер для оборачивания приложения
// ============================================================
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Загрузка пользователя при старте, если есть токен
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, []);

  // Функция для получения данных пользователя
  const fetchUser = async () => {
    try {
      const response = await client.get(ENDPOINTS.AUTH.ME);
      setUser(response.data);
    } catch (error) {
      console.error('Failed to fetch user:', error);
      // Если токен невалидный — удаляем его
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    } finally {
      setLoading(false);
    }
  };

  // Функция входа
  const login = async (email, password) => {
    try {
      const response = await client.post(ENDPOINTS.AUTH.LOGIN, { email, password });
      const { access_token, refresh_token, user: userData } = response.data;
      localStorage.setItem('access_token', access_token);
      if (refresh_token) {
        localStorage.setItem('refresh_token', refresh_token);
      }
      setUser(userData);
      return { success: true, user: userData };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Ошибка входа'
      };
    }
  };

  // Функция выхода
  const logout = async () => {
    try {
      await client.post(ENDPOINTS.AUTH.LOGOUT);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      setUser(null);
    }
  };

  // Функция обновления данных пользователя (например, после смены профиля)
  const updateUser = (data) => {
    setUser(prev => ({ ...prev, ...data }));
  };

  // Значения, которые будут доступны через контекст
  const value = {
    user,
    loading,
    login,
    logout,
    updateUser,
    isAuthenticated: !!user,
  };

  // ✅ Возвращаем провайдер с контекстом (это критически важно)
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// ============================================================
// Хук для использования контекста в компонентах
// ============================================================
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};