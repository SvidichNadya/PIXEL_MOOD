// frontend/src/pages/Home.jsx
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useCanvas } from '../components/calendarCanvas/useCanvas';
import CalendarCanvas from '../components/calendarCanvas/CalendarCanvas';
import MoodPicker from '../components/moodPicker/MoodPicker';
import MoodCard from '../components/moodCard/MoodCard';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';
import Onboarding from '../components/onboarding/Onboarding';

const Home = () => {
  const { t } = useTranslation();
  const { user, isAuthenticated } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);
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
    calendarId: null,
    autoLoad: true,
  });

  useEffect(() => {
    if (isAuthenticated && user && !user.onboarding_completed) {
      setShowOnboarding(true);
    }
  }, [isAuthenticated, user]);

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

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
        {t('home.title')}
      </h1>

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
                {t('home.already_left') || '✨ Ты уже оставил свой след в этом календаре сегодня'}
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

      {showOnboarding && <Onboarding onComplete={handleOnboardingComplete} />}
    </div>
  );
};

export default Home;