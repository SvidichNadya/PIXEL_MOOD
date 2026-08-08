// frontend/src/pages/CalendarPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCanvas } from '../components/calendarCanvas/useCanvas';
import CalendarCanvas from '../components/calendarCanvas/CalendarCanvas';
import MoodPicker from '../components/moodPicker/MoodPicker';
import MoodCard from '../components/moodCard/MoodCard';
import { useAuth } from '../hooks/useAuth';
import { useVKAds } from '../hooks/useVKAds'; // Импортируем хук
import toast from 'react-hot-toast';
import client from '../api/client';
import { ENDPOINTS } from '../api/endpoints';

const CalendarPage = () => {
  const { t } = useTranslation();
  const { id: calendarId } = useParams();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  // Подключаем VK Ads
  const { showBannerAd, hideBannerAd, isAdVisible } = useVKAds();

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

  // Показываем баннер после загрузки календаря
  useEffect(() => {
    if (!loadingCalendar && calendar) {
      // ID рекламного блока из рекламного кабинета VK
      // Замените на ваш реальный placement_id
      const placementId = import.meta.env.VITE_VK_ADS_PLACEMENT_ID || 'YOUR_PLACEMENT_ID';
      showBannerAd(placementId);
    }

    // Скрываем баннер при уходе со страницы
    return () => {
      hideBannerAd();
    };
  }, [loadingCalendar, calendar, showBannerAd, hideBannerAd]);

  // ... остальные ваши хуки и функции (fetchCalendar, handleMoodSubmit, handlePixelSelect и т.д.)
  // Они остаются без изменений

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
    return <div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>;
  }

  if (!calendar) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
            {t('calendar.not_found') || 'Календарь не найден'}
          </h2>
          <Link to="/profile" className="text-blue-500 hover:underline mt-4 inline-block">
            {t('calendar.back')}
          </Link>
        </div>
      </div>
    );
  }

  const isOwner = user?.id === calendar.owner_id;

  return (
    <div className="container mx-auto px-4 py-4 max-w-6xl">
      {/* Верхняя панель: название календаря, дата, выбор даты */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            {calendar.name}
          </h1>
          {isOwner && (
            <span className="text-sm bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">
              {t('calendar.owner')}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={currentDate}
            onChange={(e) => setCurrentDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
          <Link
            to="/profile"
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition"
          >
            ← {t('calendar.back')}
          </Link>
          {!isOwner && (
            <button
              onClick={handleLeaveCalendar}
              className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition"
            >
              {t('calendar.leave')}
            </button>
          )}
        </div>
      </div>

      {/* Описание календаря */}
      {calendar.description && (
        <div className="mb-4 text-gray-600 dark:text-gray-400">
          {calendar.description}
        </div>
      )}

      <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        {t('calendar.participants')}: {calendar.member_ids?.length || 1}
      </div>

      {/* Основное содержимое: Canvas */}
      <div className="relative">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="text-center py-10 text-red-500">{error}</div>
        ) : (
          <>
            {!myMood && isAuthenticated && !showPicker && (
              <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                {t('home.click_to_leave')}
              </div>
            )}
            {showPicker && (
              <MoodPicker
                onClose={() => {
                  setShowPicker(false);
                  clearSelected();
                }}
                onSubmit={handleMoodSubmit}
              />
            )}
            {myMood && !showPicker && (
              <div className="text-center py-4 text-green-500 dark:text-green-400">
                {t('calendar.already_left') || '✨ Ты уже оставил свой след в этом календаре сегодня'}
              </div>
            )}
            {!isAuthenticated && (
              <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                {t('home.login_to_leave')}
              </div>
            )}
            {selectedMood && (
              <MoodCard
                mood={selectedMood}
                onClose={handleCloseMoodCard}
                onUpdate={loadPixels}
              />
            )}
          </>
        )}
      </div>

      {/* === ГОРИЗОНТАЛЬНЫЙ БАННЕР ВНИЗУ СТРАНИЦЫ === */}
      {isAdVisible && (
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div 
            id="vk-ads-banner"
            className="w-full overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800 min-h-[50px] flex items-center justify-center"
          >
            {/* Баннер будет отображаться через VK Bridge */}
            <div className="text-xs text-gray-400 dark:text-gray-500">
              {t('ads.banner_label', 'Реклама')}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarPage;