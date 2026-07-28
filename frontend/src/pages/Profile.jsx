// frontend/src/pages/Profile.jsx
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import CalendarList from '../components/privateCalendar/CalendarList';
import DonateButton from '../components/payments/DonateButton';
import Spinner from '../components/common/Spinner';
import toast from 'react-hot-toast';
import client from '../api/client';
import { ENDPOINTS } from '../api/endpoints';
import VkBanner from '../components/ads/VkBanner';

const Profile = () => {
  const { t } = useTranslation();
  const { user, loading, logout, updateUser } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isAnonymousDefault, setIsAnonymousDefault] = useState(
    user?.is_anonymous_by_default ?? true
  );

  const handleToggleAnonymous = async () => {
    setIsUpdating(true);
    try {
      const newValue = !isAnonymousDefault;
      await client.put(ENDPOINTS.AUTH.ME, { is_anonymous_by_default: newValue });
      setIsAnonymousDefault(newValue);
      updateUser({ is_anonymous_by_default: newValue });
      toast.success('Настройки обновлены');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Ошибка обновления');
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) {
    return <Spinner />;
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-400">
          {t('auth.login.title')}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Блок с аватаром и именем */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <div className="flex items-center space-x-4">
          {user.avatar_url ? (
            <img
              src={user.avatar_url}
              alt={user.display_name}
              className="w-16 h-16 rounded-full object-cover"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center">
              <span className="text-2xl font-medium text-blue-500">
                {user.display_name?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
          )}
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {user.display_name}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              @{user.username}
            </p>
            {user.email && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {user.email}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Настройки анонимности */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between">
          <span className="text-gray-700 dark:text-gray-300">
            {t('profile.anonymous_default')}
          </span>
          <button
            onClick={handleToggleAnonymous}
            disabled={isUpdating}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              isAnonymousDefault
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300'
            }`}
          >
            {isUpdating ? '...' : (isAnonymousDefault ? t('profile.on') : t('profile.off'))}
          </button>
        </div>
      </div>

      {/* Список календарей */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {t('profile.my_calendars')}
        </h3>
        <CalendarList />
      </div>

      {/* Кнопка доната */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <DonateButton />
      </div>

      {/* Кнопка выхода */}
      <button
        onClick={logout}
        className="w-full py-3 text-center text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
      >
        {t('nav.logout')}
      </button>

      {/* ============================================
          БАННЕР РЕКЛАМЫ (в самом низу, под всеми блоками)
          ============================================ */}
      <div className="mt-4">
        <VkBanner position="bottom" heightType="regular" />
      </div>
    </div>
  );
};

export default Profile;