import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import client from '../../api/client';
import { ENDPOINTS } from '../../api/endpoints';
import { useAuth } from '../../hooks/useAuth';

// Схема валидации для формы логина
const loginSchema = z.object({
  email: z.string().email('Введите корректный email'),
  password: z.string().min(6, 'Пароль должен содержать минимум 6 символов'),
});

const LoginForm = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const response = await client.post(ENDPOINTS.AUTH.LOGIN, data);
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
      await login();

      toast.success('Добро пожаловать!');
      navigate('/');
    } catch (error) {
      const message = error.response?.data?.detail || 'Ошибка входа. Проверьте email и пароль.';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-text-secondary mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            placeholder="your@email.com"
            className={`w-full ${errors.email ? 'input-error' : ''}`}
            {...register('email')}
            disabled={isLoading}
          />
          {errors.email && <p className="error-text">{errors.email.message}</p>}
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-text-secondary mb-1">
            Пароль
          </label>
          <input
            id="password"
            type="password"
            placeholder="••••••••"
            className={`w-full ${errors.password ? 'input-error' : ''}`}
            {...register('password')}
            disabled={isLoading}
          />
          {errors.password && <p className="error-text">{errors.password.message}</p>}
        </div>

        <button
          type="submit"
          className="btn-primary w-full"
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Вход...
            </span>
          ) : (
            'Войти'
          )}
        </button>

        <div className="text-center text-sm text-text-secondary">
          Нет аккаунта?{' '}
          <Link to="/register" className="text-accent-blue hover:text-accent-purple font-medium">
            Зарегистрироваться
          </Link>
        </div>
      </form>
    </div>
  );
};

export default LoginForm;