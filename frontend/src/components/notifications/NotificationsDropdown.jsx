import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import toast from 'react-hot-toast';
import client from '../../api/client';
import { ENDPOINTS } from '../../api/endpoints';
import { useAuth } from '../../hooks/useAuth';

const NotificationsDropdown = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  const fetchUnreadCount = async () => {
    if (!user) return;
    try {
      const res = await client.get(ENDPOINTS.NOTIFICATIONS.UNREAD_COUNT);
      setUnreadCount(res.data.count);
    } catch (e) {
      console.error('Failed to fetch unread count:', e);
    }
  };

  const fetchNotifications = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await client.get(ENDPOINTS.NOTIFICATIONS.LIST, {
        params: { limit: 20, unread_only: false }
      });
      setNotifications(res.data);
    } catch (e) {
      toast.error(t('errors.generic'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      await client.put(ENDPOINTS.NOTIFICATIONS.MARK_READ(id));
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (e) {
      toast.error(t('errors.generic'));
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await client.put(ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ);
      setNotifications(prev =>
        prev.map(n => ({ ...n, read: true }))
      );
      setUnreadCount(0);
      toast.success(t('notifications.mark_all_read_success') || 'Все уведомления прочитаны');
    } catch (e) {
      toast.error(t('errors.generic'));
    }
  };

  if (!user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-surfaceLight transition-colors"
        aria-label={t('notifications.title')}
      >
        <svg className="w-6 h-6 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-accent-red text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-surface border border-border rounded-xl shadow-2xl z-50 max-h-96 overflow-y-auto">
          <div className="p-3 border-b border-border flex justify-between items-center sticky top-0 bg-surface z-10">
            <span className="font-medium text-text-primary">{t('notifications.title')}</span>
            {notifications.some(n => !n.read) && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-accent-blue hover:text-accent-purple"
              >
                {t('notifications.mark_all_read')}
              </button>
            )}
          </div>
          {loading ? (
            <div className="p-4 text-center text-text-muted">{t('notifications.loading')}</div>
          ) : notifications.length === 0 ? (
            <div className="p-4 text-center text-text-muted">{t('notifications.no_notifications')}</div>
          ) : (
            <ul className="divide-y divide-border">
              {notifications.map((n) => (
                <li key={n.id} className={`p-3 hover:bg-surfaceLight transition-colors ${!n.read ? 'bg-surfaceLight/50' : ''}`}>
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-text-primary font-medium">{n.title}</p>
                      <p className="text-xs text-text-secondary truncate">{n.message}</p>
                      <p className="text-xs text-text-muted mt-1">
                        {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: ru })}
                      </p>
                      {n.link && (
                        <Link
                          to={n.link}
                          className="text-xs text-accent-blue hover:text-accent-purple mt-1 inline-block"
                          onClick={() => handleMarkAsRead(n.id)}
                        >
                          {t('notifications.go_to') || 'Перейти'}
                        </Link>
                      )}
                    </div>
                    {!n.read && (
                      <button
                        onClick={() => handleMarkAsRead(n.id)}
                        className="ml-2 text-xs text-text-muted hover:text-accent-blue"
                      >
                        ✓
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationsDropdown;