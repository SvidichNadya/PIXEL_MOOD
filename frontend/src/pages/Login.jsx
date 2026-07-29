// frontend/src/pages/Login.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import LoginForm from '../components/auth/LoginForm';
// import VKBridgeAuth from '../components/auth/VKBridgeAuth'; // ← Удалите этот импорт, если он есть

const Login = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
          Вход в PIXEL Mood
        </h2>
        <LoginForm />
        <div className="text-center">
          <Link to="/register" className="text-blue-500 hover:text-blue-600">
            Нет аккаунта? Зарегистрируйтесь
          </Link>
        </div>
        {/* Компонент VKBridgeAuth здесь НЕ нужен */}
      </div>
    </div>
  );
};

export default Login;