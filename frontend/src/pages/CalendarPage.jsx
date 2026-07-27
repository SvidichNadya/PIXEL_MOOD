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

  const {
    pixels,
    loading,
    error,
    myMood,
    createMood,
    handlePixelClick,
    clearSelected,
  } = useCanvas({
    date: new Date().toISOString().split('T')[0],
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
  }, [calendarId]);

  const handleMoodSubmit = async (color, message, isAnonymous) => {
    if (!isAuthenticated) {
      toast.error(t('home.login_to_leave'));
      return;
    }
    try {
      await createMood(color, message, isAnonymous, selectedIndex);
      toast.success(t('calendar.create_success') || 'Ваш след в календаре сохранён!');
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
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-accent-blue border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!calendar) {
    return (
      <div className="text-center py-12">
        <p className="text-text-secondary">{t('calendar.not_found') || 'Календарь не найден'}</p>
        <Link to="/profile" className="text-accent-blue hover:text-accent-purple mt-4 inline-block">
          {t('calendar.back')}
        </Link>
      </div>
    );
  }

  const isOwner = user?.id === calendar.owner_id;

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between mb-4 gap-2">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-semibold text-text-primary break-words">{calendar.name}</h1>
            {calendar.description && (
              <p className="text-text-secondary text-sm break-all overflow-wrap-anywhere">{calendar.description}</p>
            )}
            <p className="text-xs text-text-muted mt-1">
              {t('calendar.participants')}: {calendar.member_ids?.length || 1}
              {isOwner && <span className="ml-2 text-accent-blue">({t('calendar.owner')})</span>}
            </p>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <Link
              to="/profile"
              className="text-sm text-text-muted hover:text-text-primary transition-colors"
            >
              ← {t('calendar.back')}
            </Link>
            {!isOwner && (
              <button
                onClick={handleLeaveCalendar}
                className="text-sm text-accent-red hover:text-red-400 transition-colors"
              >
                {t('calendar.leave')}
              </button>
            )}
          </div>
        </div>

        <p className="text-center text-text-secondary text-sm mb-6">
          {new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
          {' · '}
          {pixels.length} {t('home.pixels_today')}
        </p>

        <div className="bg-surface rounded-xl p-2 sm:p-4 border border-border shadow-xl">
        <CalendarCanvas
          pixels={pixels}
          width={600}
          height={600}
          onPixelClick={handlePixelSelect}
          loading={loading}
          interactive={true}
          selectedPixelIndex={selectedIndex}
        />
        </div>

        {!myMood && isAuthenticated && !showPicker && (
          <div className="mt-4 text-center text-text-secondary text-sm bg-surface/50 rounded-lg p-3 border border-border">
            {t('home.click_to_leave')}
          </div>
        )}

        {showPicker && (
          <MoodPicker
            onSubmit={handleMoodSubmit}
            onCancel={() => { setShowPicker(false); clearSelected(); }}
          />
        )}

        {myMood && !showPicker && (
          <div className="mt-4 text-center text-green-400 text-sm bg-surface/50 rounded-lg p-3 border border-border">
            {t('calendar.already_left') || '✨ Ты уже оставил свой след в этом календаре сегодня'}
          </div>
        )}

        {!isAuthenticated && (
          <div className="mt-4 text-center text-text-secondary text-sm bg-surface/50 rounded-lg p-3 border border-border">
            {t('home.login_to_leave')}
          </div>
        )}

        {selectedMood && (
          <MoodCard
            mood={selectedMood}
            onClose={handleCloseMoodCard}
            onReveal={() => toast.success('Автор раскрыт!')}
          />
        )}
      </div>
    </div>
  );
};

export default CalendarPage;