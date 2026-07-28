// frontend/src/pages/CalendarPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCanvas } from '../components/calendarCanvas/useCanvas';
import CalendarCanvas from '../components/calendarCanvas/CalendarCanvas';
import MoodPicker from '../components/moodPicker/MoodPicker';
import MoodCard from '../components/moodCard/MoodCard';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';
import client from '../api/client';
import { ENDPOINTS } from '../api/endpoints';

const CalendarPage = () => {
  const { t } = useTranslation();
  const { id: calendarId } = useParams();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [calendar, setCalendar] = useState(null);
  const [loadingCalendar, setLoadingCalendar] = useState(true);
  const [selectedMood, setSelectedMood] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [showPicker, setShowPicker] = useState(false);
  const [currentDate, setCurrentDate] = useState(
    new Date().toISOString().split('T')[0]
  );

  const {
    pixels,
    loading,
    error,
    myMood,
    createMood,
    handlePixelClick,
    clearSelected,
    loadPixels,
  } = useCanvas({
    date: currentDate,
    calendarId: calendarId,
    autoLoad: true,
  });

  useEffect(() => {
    const fetchCalendar = async () => {
      setLoadingCalendar(true);
      try {
        const response = await client.get(ENDPOINTS.CALENDARS.BY_ID(calendarId));
        setCalendar(response.data);
      } catch (err) {
        toast.error(err.response?.data?.detail || t('errors.generic'));
      } finally {
        setLoadingCalendar(false);
      }
    };
    if (calendarId) {
      fetchCalendar();
    }
  }, [calendarId, t]);

  const handleMoodSubmit = async (color, message, isAnonymous) => {
    if (!isAuthenticated) {
      toast.error(t('home.login_to_leave'));
      return;
    }
    try {
      await createMood(color, message, isAnonymous, selectedIndex);
      // ✅ ИСПРАВЛЕНО: используем правильный ключ для сообщения
      toast.success(t('home.success') || 'Ваш след сохранён!');
      setShowPicker(false);
      clearSelected();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handlePixelSelect = (pixel, index) => {
    if (pixel) {
      setSelectedMood(pixel);
      setSelectedIndex(index);
      setShowPicker(false);
    } else {
      setSelectedIndex(index);
      setShowPicker(true);
      setSelectedMood(null);
    }
  };

  const handleCloseMoodCard = () => {
    setSelectedMood(null);
    setSelectedIndex(null);
    setShowPicker(false);
  };

  const handleLeaveCalendar = async () => {
    if (!confirm(t('calendar.leave_confirm'))) return;
    try {
      await client.delete(ENDPOINTS.CALENDARS.LEAVE(calendarId));
      toast.success(t('calendar.leave_success'));
      navigate('/profile');
    } catch (err) {
      toast.error(err.response?.data?.detail || t('errors.generic'));
    }
  };

  if (loadingCalendar) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!calendar) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6 text-center">
        <p className="text-gray-600 dark:text-gray-400">
          {t('calendar.not_found') || 'Календарь не найден'}
        </p>
        <Link to="/profile" className="text-blue-500 hover:text-blue-600 mt-4 inline-block">
          {t('calendar.back')}
        </Link>
      </div>
    );
  }

  const isOwner = user?.id === calendar.owner_id;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {calendar.name}
        </h1>
        <div className="flex items-center gap-3">
          <Link
            to="/profile"
            className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            ← {t('calendar.back')}
          </Link>
          {!isOwner && (
            <button
              onClick={handleLeaveCalendar}
              className="text-sm text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300"
            >
              {t('calendar.leave')}
            </button>
          )}
        </div>
      </div>

      {calendar.description && (
        <p className="text-gray-600 dark:text-gray-400 mb-4">{calendar.description}</p>
      )}

      <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        {t('calendar.participants')}: {calendar.member_ids?.length || 1}
        {isOwner && ` (${t('calendar.owner')})`}
      </div>

      {/* ✅ ИСПРАВЛЕНО: обёртка с отступами */}
      <div className="mb-4">
        <input
          type="date"
          className="bg-surface border border-border rounded-lg px-4 py-2 text-text-primary w-full sm:w-auto"
          value={currentDate}
          onChange={(e) => setCurrentDate(e.target.value)}
        />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="text-center text-red-500 py-8">{error}</div>
        ) : (
          <>
            <CalendarCanvas
              pixels={pixels}
              onPixelClick={handlePixelSelect}
              myMood={myMood}
              isAuthenticated={isAuthenticated}
            />
            
            <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
              {new Date(currentDate).toLocaleDateString('ru-RU', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })} {' · '} {pixels.length} {t('home.pixels_today')}
            </div>

            {!myMood && isAuthenticated && !showPicker && (
              <div className="mt-4 text-center text-gray-500 dark:text-gray-400">
                {t('home.click_to_leave')}
              </div>
            )}

            {showPicker && (
              <MoodPicker
                onSubmit={handleMoodSubmit}
                onCancel={() => {
                  setShowPicker(false);
                  clearSelected();
                }}
              />
            )}

            {myMood && !showPicker && (
              <div className="mt-4 text-center text-green-600 dark:text-green-400">
                {t('calendar.already_left') || '✨ Ты уже оставил свой след в этом календаре сегодня'}
              </div>
            )}

            {!isAuthenticated && (
              <div className="mt-4 text-center text-yellow-600 dark:text-yellow-400">
                {t('home.login_to_leave')}
              </div>
            )}

            {selectedMood && (
              <MoodCard
                mood={selectedMood}
                onClose={handleCloseMoodCard}
                onReactionUpdate={() => loadPixels()}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CalendarPage;