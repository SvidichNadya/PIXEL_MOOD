// frontend/src/components/notifications/NotificationsDropdown.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import client from '../../api/client';
import { ENDPOINTS } from '../../api/endpoints';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';

const NotificationsDropdown = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);

  const fetchUnreadCount = async () => {
    try {
      const response = await client.get(ENDPOINTS.NOTIFICATIONS.UNREAD_COUNT);
      setUnreadCount(response.data.count);
    } catch (err) {
      // ignore
    }
  };

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await client.get(ENDPOINTS.NOTIFICATIONS.LIST, {
        params: { limit: 20, unread_only: false },
      });
      setNotifications(response.data);
    } catch (err) {
      toast.error(t('errors.fetch_notifications'));
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = () => {
    if (!isOpen) {
      fetchNotifications();
    }
    setIsOpen(!isOpen);
  };

  const handleMarkAsRead = async (id) => {
    try {
      await client.put(ENDPOINTS.NOTIFICATIONS.MARK_READ(id));
      setNotifications(notifications.map(n =>
        n.id === id ? { ...n, read: true } : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      toast.error(t('errors.mark_read'));
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await client.put(ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ);
      setNotifications(notifications.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
      toast.success(t('notifications.all_read'));
    } catch (err) {
      toast.error(t('errors.mark_read'));
    }
  };

  // Закрываем при клике вне
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) &&
          buttonRef.current && !buttonRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Обновляем счетчик при монтировании и каждые 30 секунд
  useEffect(() => {
    if (user) {
      fetchUnreadCount();
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  if (!user) return null;

  return (
    <div className="relative inline-block">
      {/* Кнопка-колокольчик */}
      <button
        ref={buttonRef}
        onClick={handleOpen}
        className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        aria-label={t('notifications.title')}
      >
        <svg className="w-6 h-6 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Выпадающее окно */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="fixed sm:absolute inset-x-4 sm:inset-x-auto top-20 sm:top-auto sm:right-0 sm:mt-2 w-auto sm:w-96 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50 max-h-[80vh] flex flex-col"
          style={{
            // На мобильных экранах оставляем отступы, на десктопе позиционируем справа
            maxWidth: 'min(calc(100vw - 2rem), 28rem)',
            marginLeft: 'auto',
            marginRight: 'auto',
            // Для десктопа сбрасываем фиксацию
            '@media (min-width: 640px)': {
              position: 'absolute',
              top: '100%',
              left: 'auto',
              right: 0,
              marginLeft: 0,
              marginRight: 0,
            }
          }}
        >
          {/* Заголовок */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t('notifications.title')}
            </h3>
            <div className="flex items-center gap-2">
              {notifications.some(n => !n.read) && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-sm text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  {t('notifications.mark_all_read')}
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Список уведомлений */}
          <div className="overflow-y-auto flex-1 p-2">
            {loading ? (
              <div className="flex justify-center items-center h-20">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                {t('notifications.no_notifications')}
              </div>
            ) : (
              <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                {notifications.map((notification) => (
                  <li key={notification.id} className={`py-3 px-2 rounded-lg ${!notification.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {notification.title}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-300 truncate">
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-400 dark:text-gray-500">
                            {new Date(notification.created_at).toLocaleDateString('ru-RU', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          {!notification.read && (
                            <button
                              onClick={() => handleMarkAsRead(notification.id)}
                              className="text-xs text-blue-500 hover:text-blue-600 dark:text-blue-400"
                            >
                              {t('notifications.mark_read')}
                            </button>
                          )}
                        </div>
                      </div>
                      {notification.link && (
                        <Link
                          to={notification.link}
                          onClick={() => setIsOpen(false)}
                          className="flex-shrink-0 text-blue-500 hover:text-blue-600 dark:text-blue-400"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsDropdown;