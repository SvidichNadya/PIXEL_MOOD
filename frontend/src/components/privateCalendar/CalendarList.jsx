import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import toast from 'react-hot-toast';
import client from '../../api/client';
import { ENDPOINTS } from '../../api/endpoints';
import Spinner from '../common/Spinner';
import CalendarCreate from './CalendarCreate';

const CalendarList = ({ userId, limit = 10 }) => {
  const { t } = useTranslation();
  const [calendars, setCalendars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedCalendar, setSelectedCalendar] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [isInviting, setIsInviting] = useState(false);

  const loadCalendars = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await client.get(ENDPOINTS.CALENDARS.LIST, {
        params: { skip: 0, limit: 100 },
      });
      setCalendars(response.data || []);
    } catch (err) {
      const msg = err.response?.data?.detail || t('errors.generic');
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadCalendars();
  }, [loadCalendars]);

  const handleDelete = async (calendarId, calendarName) => {
    if (!confirm(t('calendar.delete_confirm', { name: calendarName }))) return;
    try {
      await client.delete(ENDPOINTS.CALENDARS.BY_ID(calendarId));
      setCalendars((prev) => prev.filter((c) => c.id !== calendarId));
      toast.success(t('calendar.delete_success'));
    } catch (err) {
      toast.error(err.response?.data?.detail || t('errors.generic'));
    }
  };

  const handleLeave = async (calendarId, calendarName) => {
    if (!confirm(t('calendar.leave_confirm'))) return;
    try {
      await client.delete(ENDPOINTS.CALENDARS.LEAVE(calendarId));
      setCalendars((prev) => prev.filter((c) => c.id !== calendarId));
      toast.success(t('calendar.leave_success'));
    } catch (err) {
      toast.error(err.response?.data?.detail || t('errors.generic'));
    }
  };

  const handleCreateSuccess = (newCalendar) => {
    setCalendars((prev) => [newCalendar, ...prev]);
    setShowCreateModal(false);
  };

  const openInviteModal = (calendar) => {
    setSelectedCalendar(calendar);
    setShowInviteModal(true);
    setSearchQuery('');
    setSearchResults([]);
    setSelectedUsers([]);
  };

  const searchUsers = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    try {
      const response = await client.get(ENDPOINTS.CALENDARS.SEARCH_USERS(searchQuery));
      setSearchResults(response.data || []);
    } catch (err) {
      toast.error(t('calendar.search_error') || 'Ошибка поиска пользователей');
    }
  };

  const toggleUserSelection = (user) => {
    setSelectedUsers((prev) =>
      prev.some((u) => u.id === user.id)
        ? prev.filter((u) => u.id !== user.id)
        : [...prev, user]
    );
  };

  const handleInvite = async () => {
    if (!selectedCalendar || selectedUsers.length === 0) return;
    setIsInviting(true);
    try {
      const userIds = selectedUsers.map((u) => u.id);
      await client.post(ENDPOINTS.CALENDARS.INVITE(selectedCalendar.id), { user_ids: userIds });
      toast.success(t('calendar.invite_success'));
      setShowInviteModal(false);
      setSelectedUsers([]);
      setSearchResults([]);
      loadCalendars();
    } catch (err) {
      toast.error(err.response?.data?.detail || t('errors.generic'));
    } finally {
      setIsInviting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner label={t('common.loading')} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-accent-red">{error}</p>
        <button onClick={loadCalendars} className="btn-secondary mt-4">
          {t('common.retry') || 'Повторить'}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-text-primary">{t('calendar.my_calendars')}</h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary text-sm px-4 py-2"
        >
          + {t('calendar.create')}
        </button>
      </div>

      {calendars.length === 0 ? (
        <div className="text-center py-12 bg-surface rounded-xl border border-border">
          <p className="text-text-secondary">{t('calendar.no_calendars')}</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary mt-4"
          >
            {t('calendar.create_first')}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {calendars.slice(0, limit).map((calendar) => {
            const isOwner = calendar.owner_id === userId;
            return (
              <div
                key={calendar.id}
                className="bg-surface border border-border rounded-xl p-4 hover:border-accent-blue transition-colors duration-200 group"
              >
                <div className="flex flex-col h-full">
                  <Link to={`/calendar/${calendar.id}`} className="flex-1 block">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-md font-medium text-text-primary truncate">
                          {calendar.name}
                        </h3>
                        {calendar.description && (
                          <p className="text-sm text-text-secondary break-all overflow-wrap-anywhere mt-1">
                            {calendar.description}
                          </p>
                        )}
                        <div className="flex items-center mt-2 text-xs text-text-muted">
                          <span>{t('calendar.created')}: {format(new Date(calendar.created_at), 'd MMM yyyy', { locale: ru })}</span>
                        </div>
                        <div className="mt-2 text-xs text-text-muted">
                          {t('calendar.participants')}: {calendar.member_ids?.length || 1}
                        </div>
                      </div>
                      {isOwner && (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleDelete(calendar.id, calendar.name);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-surfaceLight transition-all"
                          aria-label="Удалить"
                        >
                          <svg className="w-4 h-4 text-text-muted hover:text-accent-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </Link>
                  <div className="flex items-center justify-between mt-3">
                    {isOwner && (
                      <button
                        onClick={() => openInviteModal(calendar)}
                        className="text-xs text-accent-blue hover:text-accent-purple transition-colors"
                      >
                        + {t('calendar.invite')}
                      </button>
                    )}
                    {!isOwner && (
                      <button
                        onClick={() => handleLeave(calendar.id, calendar.name)}
                        className="text-xs text-accent-red hover:text-red-400 transition-colors"
                      >
                        {t('calendar.leave')}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {calendars.length > limit && (
        <div className="text-center">
          <Link to="/profile" className="text-accent-blue hover:text-accent-purple text-sm">
            {t('calendar.show_all') || 'Показать все календари'}
          </Link>
        </div>
      )}

      {showCreateModal && (
        <CalendarCreate
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleCreateSuccess}
        />
      )}

      {showInviteModal && selectedCalendar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div
            className="bg-surface rounded-2xl border border-border max-w-md w-full p-6 shadow-2xl max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-text-primary">
                {t('calendar.invite')} "{selectedCalendar.name}"
              </h3>
              <button
                onClick={() => setShowInviteModal(false)}
                className="p-1 rounded-lg hover:bg-surfaceLight transition-colors"
              >
                <svg className="w-5 h-5 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex gap-2 mb-3">
              <input
                type="text"
                placeholder={t('calendar.search_users')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
                onKeyDown={(e) => e.key === 'Enter' && searchUsers()}
              />
              <button onClick={searchUsers} className="btn-secondary px-4">
                {t('calendar.find')}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto max-h-48 space-y-1 mb-3">
              {searchResults.length === 0 && searchQuery.trim() && (
                <p className="text-sm text-text-muted text-center py-2">{t('calendar.no_users_found')}</p>
              )}
              {searchResults.map((user) => (
                <div
                  key={user.id}
                  onClick={() => toggleUserSelection(user)}
                  className={`p-2 rounded cursor-pointer flex items-center justify-between transition-colors ${
                    selectedUsers.some((u) => u.id === user.id)
                      ? 'bg-accent-blue/20 border border-accent-blue'
                      : 'bg-surfaceLight hover:bg-border'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {user.avatar_url ? (
                      <img src={user.avatar_url} alt={user.display_name} className="w-6 h-6 rounded-full object-cover" />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-accent-blue/20 flex items-center justify-center text-xs">
                        {user.display_name?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                    )}
                    <span className="text-sm text-text-primary">{user.display_name}</span>
                    <span className="text-xs text-text-muted">@{user.username}</span>
                  </div>
                  {selectedUsers.some((u) => u.id === user.id) && (
                    <span className="text-accent-blue text-sm">✓</span>
                  )}
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-border">
              <span className="text-sm text-text-muted">
                {t('calendar.selected')}: {selectedUsers.length}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="btn-secondary text-sm px-4 py-2"
                >
                  {t('calendar.cancel')}
                </button>
                <button
                  onClick={handleInvite}
                  disabled={isInviting || selectedUsers.length === 0}
                  className="btn-primary text-sm px-4 py-2 disabled:opacity-50"
                >
                  {isInviting ? t('calendar.sending') : t('calendar.invite_send')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarList;