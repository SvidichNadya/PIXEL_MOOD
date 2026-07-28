import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import CalendarList from '../components/privateCalendar/CalendarList';
import DonateButton from '../components/payments/DonateButton';
import Spinner from '../components/common/Spinner';
import toast from 'react-hot-toast';
import client from '../api/client';
import { ENDPOINTS } from '../api/endpoints';

const Profile = () => {
  const { t } = useTranslation();
  const { user, loading, logout, updateUser } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isAnonymousDefault, setIsAnonymousDefault] = useState(user?.is_anonymous_by_default ?? true);

  const handleToggleAnonymous = async () => {
    setIsUpdating(true);
    try {
      const newValue = !isAnonymousDefault;
      await client.put(ENDPOINTS.AUTH.ME, {
        is_anonymous_by_default: newValue,
      });
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
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Spinner label={t('common.loading')} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-text-secondary">{t('auth.login.title')}</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="bg-surface rounded-xl border border-border p-6">
        <div className="flex items-center space-x-4">
          {user.avatar_url ? (
            <img
              src={user.avatar_url}
              alt={user.display_name}
              className="w-16 h-16 rounded-full object-cover"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-accent-blue/20 flex items-center justify-center">
              <span className="text-2xl text-accent-blue font-medium">
                {user.display_name?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
          )}
          <div>
            <h2 className="text-xl font-semibold text-text-primary">{user.display_name}</h2>
            <p className="text-text-secondary text-sm">@{user.username}</p>
            {user.email && <p className="text-text-muted text-sm">{user.email}</p>}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div className="bg-surfaceLight rounded-lg p-3">
            <span className="text-text-muted">{t('profile.id')}</span>
            <p className="text-text-primary font-mono text-xs truncate">{user.id}</p>
          </div>
          <div className="bg-surfaceLight rounded-lg p-3 flex items-center justify-between">
            <span className="text-text-muted">{t('profile.anonymous_default')}</span>
            <button
              onClick={handleToggleAnonymous}
              disabled={isUpdating}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                isAnonymousDefault
                  ? 'bg-accent-blue/20 text-accent-blue hover:bg-accent-blue/30'
                  : 'bg-surfaceLight text-text-muted hover:bg-border'
              }`}
            >
              {isUpdating ? '...' : (isAnonymousDefault ? t('profile.on') : t('profile.off'))}
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          {/* <DonateButton amount={50} label={t('profile.donate')} variant="primary" /> */}
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
            <button onClick={logout} className="btn-danger text-sm px-4 py-2">
            {t('nav.logout')}
          </button>
        </div>
      </div>

      <div className="bg-surface rounded-xl border border-border p-6">
        <CalendarList userId={user.id} limit={10} />
      </div>
    </div>
  );
};

export default Profile;