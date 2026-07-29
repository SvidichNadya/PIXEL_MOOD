// frontend/src/components/common/PrivateRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

/**
 * Компонент для защиты маршрутов, требующих авторизации.
 * Если пользователь не авторизован — перенаправляет на /login.
 */
const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();

  // Пока идет проверка авторизации, ничего не рендерим (или можно показать спиннер)
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Если пользователь не авторизован — редирект на логин
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Если авторизован — рендерим дочерние компоненты
  return children;
};

export default PrivateRoute;