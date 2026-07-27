import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import client from '../../api/client';
import { ENDPOINTS } from '../../api/endpoints';
import { useAuth } from '../../hooks/useAuth';

const registerSchema = z
  .object({
    username: z
      .string()
      .min(3, 'Имя пользователя должно содержать минимум 3 символа')
      .max(32, 'Имя пользователя не должно превышать 32 символа')
      .regex(/^[a-zA-Z0-9_\-]+$/, 'Допустимы только буквы, цифры, underscore и дефис'),
    email: z.string().email('Введите корректный email'),
    display_name: z.string().max(64, 'Отображаемое имя не должно превышать 64 символа').optional(),
    password: z
      .string()
      .min(6, 'Пароль должен содержать минимум 6 символов')
      .max(64, 'Пароль не должен превышать 64 символа'),
    confirm_password: z.string().min(6, 'Подтвердите пароль'),
    consent_to_reveal: z.boolean().default(true),
  })
  .refine((data) => data.password === data.confirm_password, {
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
    <div className="w-full max-w-md">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-text-secondary mb-1">
            {t('auth.register.username')} <span className="text-accent-red">*</span>
          </label>
          <input
            id="username"
            type="text"
            placeholder={t('auth.register.username_placeholder')}
            className={`w-full ${errors.username ? 'input-error' : ''}`}
            {...register('username')}
            disabled={isLoading}
          />
          {errors.username && <p className="error-text">{errors.username.message}</p>}
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-text-secondary mb-1">
            {t('auth.register.email')} <span className="text-accent-red">*</span>
          </label>
          <input
            id="email"
            type="email"
            placeholder={t('auth.register.email_placeholder')}
            className={`w-full ${errors.email ? 'input-error' : ''}`}
            {...register('email')}
            disabled={isLoading}
          />
          {errors.email && <p className="error-text">{errors.email.message}</p>}
        </div>

        <div>
          <label htmlFor="display_name" className="block text-sm font-medium text-text-secondary mb-1">
            {t('auth.register.display_name')}
          </label>
          <input
            id="display_name"
            type="text"
            placeholder={t('auth.register.display_name_placeholder')}
            className={`w-full ${errors.display_name ? 'input-error' : ''}`}
            {...register('display_name')}
            disabled={isLoading}
          />
          {errors.display_name && <p className="error-text">{errors.display_name.message}</p>}
          <p className="text-xs text-text-muted mt-1">{t('auth.register.display_name_hint') || 'Если не указано, будет использовано имя пользователя'}</p>
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-text-secondary mb-1">
            {t('auth.register.password')} <span className="text-accent-red">*</span>
          </label>
          <input
            id="password"
            type="password"
            placeholder={t('auth.register.password_placeholder')}
            className={`w-full ${errors.password ? 'input-error' : ''}`}
            {...register('password')}
            disabled={isLoading}
          />
          {errors.password && <p className="error-text">{errors.password.message}</p>}
        </div>

        <div>
          <label htmlFor="confirm_password" className="block text-sm font-medium text-text-secondary mb-1">
            {t('auth.register.confirm_password')} <span className="text-accent-red">*</span>
          </label>
          <input
            id="confirm_password"
            type="password"
            placeholder={t('auth.register.confirm_password_placeholder')}
            className={`w-full ${errors.confirm_password ? 'input-error' : ''}`}
            {...register('confirm_password')}
            disabled={isLoading}
          />
          {errors.confirm_password && <p className="error-text">{errors.confirm_password.message}</p>}
        </div>

        {errors.consent_to_reveal && <p className="error-text">{errors.consent_to_reveal.message}</p>}

        <button type="submit" className="btn-primary w-full" disabled={isLoading}>
          {isLoading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              {t('auth.register.submit')}...
            </span>
          ) : (
            t('auth.register.submit')
          )}
        </button>

        <div className="text-center text-sm text-text-secondary">
          {t('auth.register.have_account')}{' '}
          <Link to="/login" className="text-accent-blue hover:text-accent-purple font-medium">
            {t('auth.register.login_link')}
          </Link>
        </div>
      </form>
    </div>
  );
};

export default RegisterForm;