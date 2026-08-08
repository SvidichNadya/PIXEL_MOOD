import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import client from '../../api/client';
import { ENDPOINTS } from '../../api/endpoints';
import { useAuth } from '../../hooks/useAuth';

const registerSchema = z.object({
  username: z.string()
    .min(3, 'Имя пользователя должно содержать минимум 3 символа')
    .max(32, 'Имя пользователя не должно превышать 32 символа')
    .regex(/^[a-zA-Z0-9_\-]+$/, 'Допустимы только буквы, цифры, underscore и дефис'),
  email: z.string().email('Введите корректный email'),
  display_name: z.string().max(64, 'Отображаемое имя не должно превышать 64 символа').optional(),
  password: z.string()
    .min(6, 'Пароль должен содержать минимум 6 символов')
    .max(64, 'Пароль не должен превышать 64 символа'),
  confirm_password: z.string().min(6, 'Подтвердите пароль'),
  consent_to_reveal: z.boolean().default(true),
}).refine((data) => data.password === data.confirm_password, {
  message: 'Пароли не совпадают',
  path: ['confirm_password'],
});

const RegisterForm = () => {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      consent_to_reveal: true,
    },
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const { confirm_password, ...payload } = data;
      const response = await client.post(ENDPOINTS.AUTH.REGISTER, payload);
      const { access_token, refresh_token, expires_at } = response.data;

      localStorage.setItem('access_token', access_token);
      if (refresh_token) localStorage.setItem('refresh_token', refresh_token);
      if (expires_at) localStorage.setItem('expires_at', expires_at);

      await login();
      toast.success(t('auth.register.success') || 'Регистрация успешна! Добро пожаловать в PIXEL Mood.');
      navigate('/');
    } catch (error) {
      const message = error.response?.data?.detail || t('errors.register');
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-6">
      <div className="rounded-md shadow-sm -space-y-px">
        <div>
          <label htmlFor="username" className="sr-only">{t('auth.register.username') || 'Имя пользователя'}</label>
          <input
            {...register('username')}
            id="username"
            type="text"
            autoComplete="username"
            className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm bg-white dark:bg-gray-800"
            placeholder={t('auth.register.username') || 'Имя пользователя'}
          />
          {errors.username && (
            <p className="mt-1 text-sm text-red-500">{errors.username.message}</p>
          )}
        </div>
        <div>
          <label htmlFor="email" className="sr-only">Email</label>
          <input
            {...register('email')}
            id="email"
            type="email"
            autoComplete="email"
            className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm bg-white dark:bg-gray-800"
            placeholder="Email"
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
          )}
        </div>
        <div>
          <label htmlFor="display_name" className="sr-only">{t('auth.register.display_name') || 'Отображаемое имя'}</label>
          <input
            {...register('display_name')}
            id="display_name"
            type="text"
            autoComplete="name"
            className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm bg-white dark:bg-gray-800"
            placeholder={t('auth.register.display_name') || 'Отображаемое имя (необязательно)'}
          />
          {errors.display_name && (
            <p className="mt-1 text-sm text-red-500">{errors.display_name.message}</p>
          )}
        </div>
        <div>
          <label htmlFor="password" className="sr-only">{t('auth.register.password') || 'Пароль'}</label>
          <input
            {...register('password')}
            id="password"
            type="password"
            autoComplete="new-password"
            className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm bg-white dark:bg-gray-800"
            placeholder={t('auth.register.password') || 'Пароль'}
          />
          {errors.password && (
            <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>
          )}
        </div>
        <div>
          <label htmlFor="confirm_password" className="sr-only">{t('auth.register.confirm_password') || 'Подтвердите пароль'}</label>
          <input
            {...register('confirm_password')}
            id="confirm_password"
            type="password"
            autoComplete="new-password"
            className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm bg-white dark:bg-gray-800"
            placeholder={t('auth.register.confirm_password') || 'Подтвердите пароль'}
          />
          {errors.confirm_password && (
            <p className="mt-1 text-sm text-red-500">{errors.confirm_password.message}</p>
          )}
        </div>
      </div>

      <div className="flex items-center">
        <input
          {...register('consent_to_reveal')}
          id="consent_to_reveal"
          type="checkbox"
          className="h-4 w-4 text-blue-500 focus:ring-blue-500 border-gray-300 rounded"
        />
        <label htmlFor="consent_to_reveal" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
          {t('auth.register.consent_to_reveal') || 'Я соглашаюсь с лицензионным соглашением и политикой конфиденциальности'}
        </label>
      </div>

      <div>
        <button
          type="submit"
          disabled={isLoading}
          className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Регистрация...' : 'Зарегистрироваться'}
        </button>
      </div>
    </form>
  );
};

export default RegisterForm;