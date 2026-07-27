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
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-light text-center mb-2 tracking-wider">{t('home.title')}</h1>
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
            {t('home.already_left')}
          </div>
        )}

        {selectedMood && (
          <MoodCard
            mood={selectedMood}
            onClose={handleCloseMoodCard}
            onReveal={() => toast.success('Автор раскрыт!')}
          />
        )}

        {showOnboarding && (
          <Onboarding onComplete={handleOnboardingComplete} />
        )}
      </div>
    </div>
  );
};

export default Home;