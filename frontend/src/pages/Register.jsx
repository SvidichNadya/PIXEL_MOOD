// frontend/src/pages/Register.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTranslation, Trans } from 'react-i18next';
import toast from 'react-hot-toast';
import client from '../api/client';
import { ENDPOINTS } from '../api/endpoints';
import Modal from '../components/Modal';

const Register = () => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    display_name: '',
    password: '',
    confirm_password: '',
    consent_to_reveal: false, // по умолчанию false
  });
  const [loading, setLoading] = useState(false);
  const { fetchUser } = useAuth();
  const navigate = useNavigate();

  // Состояния для модальных окон
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Валидация пароля
    if (formData.password !== formData.confirm_password) {
      toast.error(t('register.password_mismatch', 'Пароли не совпадают'));
      return;
    }

    // Проверка согласия
    if (!formData.consent_to_reveal) {
      toast.error(t('register.consent_required', 'Необходимо принять условия'));
      return;
    }

    setLoading(true);
    try {
      const payload = {
        username: formData.username,
        email: formData.email,
        display_name: formData.display_name?.trim() || undefined,
        password: formData.password,
        consent_to_reveal: formData.consent_to_reveal,
      };

      const response = await client.post(ENDPOINTS.AUTH.REGISTER, payload);
      const { access_token, refresh_token, expires_at, user: userFromResponse } = response.data;

      localStorage.setItem('access_token', access_token);
      if (refresh_token) localStorage.setItem('refresh_token', refresh_token);
      if (expires_at) localStorage.setItem('expires_at', expires_at);

      await fetchUser();
      toast.success(t('register.success', 'Регистрация успешна!'));
      navigate('/');
    } catch (error) {
      // Обработка ошибок валидации с бэкенда
      if (error.response?.data?.errors) {
        const errorMessages = error.response.data.errors;
        errorMessages.forEach((err) => {
          toast.error(err.message || t('register.validation_error', 'Ошибка валидации'));
        });
      } else if (error.response?.data?.detail) {
        const detail = error.response.data.detail;
        if (typeof detail === 'string') {
          toast.error(detail);
        } else if (Array.isArray(detail)) {
          detail.forEach((err) => {
            const field = err.loc?.join('.') || 'field';
            toast.error(`${field}: ${err.msg}`);
          });
        } else {
          toast.error(t('register.error', 'Ошибка регистрации'));
        }
      } else {
        toast.error(t('register.error', 'Ошибка регистрации'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
              {t('register.title', 'Регистрация')}
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
              {t('register.have_account', 'Уже есть аккаунт?')}{' '}
              <Link to="/login" className="font-medium text-blue-500 hover:text-blue-600">
                {t('register.login_link', 'Войдите')}
              </Link>
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="rounded-md shadow-sm -space-y-px">
              <div>
                <label htmlFor="username" className="sr-only">
                  {t('register.username_label', 'Имя пользователя')}
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  required
                  value={formData.username}
                  onChange={handleChange}
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm bg-white dark:bg-gray-800"
                  placeholder={t('register.username_placeholder', 'Имя пользователя')}
                />
              </div>
              <div>
                <label htmlFor="email" className="sr-only">
                  {t('register.email_label', 'Email')}
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm bg-white dark:bg-gray-800"
                  placeholder={t('register.email_placeholder', 'Email')}
                />
              </div>
              <div>
                <label htmlFor="display_name" className="sr-only">
                  {t('register.display_name_label', 'Отображаемое имя')}
                </label>
                <input
                  id="display_name"
                  name="display_name"
                  type="text"
                  autoComplete="name"
                  value={formData.display_name}
                  onChange={handleChange}
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm bg-white dark:bg-gray-800"
                  placeholder={t('register.display_name_placeholder', 'Отображаемое имя (необязательно)')}
                />
              </div>
              <div>
                <label htmlFor="password" className="sr-only">
                  {t('register.password_label', 'Пароль')}
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm bg-white dark:bg-gray-800"
                  placeholder={t('register.password_placeholder', 'Пароль')}
                />
              </div>
              <div>
                <label htmlFor="confirm_password" className="sr-only">
                  {t('register.confirm_password_label', 'Подтвердите пароль')}
                </label>
                <input
                  id="confirm_password"
                  name="confirm_password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={formData.confirm_password}
                  onChange={handleChange}
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm bg-white dark:bg-gray-800"
                  placeholder={t('register.confirm_password_placeholder', 'Подтвердите пароль')}
                />
              </div>
            </div>

            <div className="flex items-start">
              <input
                id="consent_to_reveal"
                name="consent_to_reveal"
                type="checkbox"
                checked={formData.consent_to_reveal}
                onChange={handleChange}
                className="mt-1 h-4 w-4 text-blue-500 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="consent_to_reveal" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                {t('register.consent_text_prefix', 'Я принимаю')}{' '}
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setShowTermsModal(true);
                  }}
                  className="text-blue-500 hover:underline font-medium"
                >
                  {t('register.terms_link', 'Пользовательское соглашение')}
                </a>
                {' '}{t('register.and', 'и')}{' '}
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setShowPrivacyModal(true);
                  }}
                  className="text-blue-500 hover:underline font-medium"
                >
                  {t('register.privacy_link', 'Политику конфиденциальности')}
                </a>
              </label>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading
                  ? t('register.loading', 'Регистрация...')
                  : t('register.submit', 'Зарегистрироваться')}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Модальное окно с Пользовательским соглашением */}
      <Modal
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
        title={t('terms.title', 'Пользовательское соглашение')}
      >
        <div className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">
          {t('terms.content')}
        </div>
      </Modal>

      {/* Модальное окно с Политикой конфиденциальности */}
      <Modal
        isOpen={showPrivacyModal}
        onClose={() => setShowPrivacyModal(false)}
        title={t('privacy.title', 'Политика конфиденциальности')}
      >
        <div className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">
          {t('privacy.content')}
        </div>
      </Modal>
    </>
  );
};

export default Register;