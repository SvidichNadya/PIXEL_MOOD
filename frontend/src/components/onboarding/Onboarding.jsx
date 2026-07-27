import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import client from '../../api/client';
import { ENDPOINTS } from '../../api/endpoints';
import toast from 'react-hot-toast';

const Onboarding = ({ onComplete }) => {
  const { t } = useTranslation();
  const { user, updateUser } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);

  const steps = [
    { id: 'step1', icon: '🌍', title: t('onboarding.step1_title'), description: t('onboarding.step1_desc') },
    { id: 'step2', icon: '🎨', title: t('onboarding.step2_title'), description: t('onboarding.step2_desc') },
    { id: 'step3', icon: '🔍', title: t('onboarding.step3_title'), description: t('onboarding.step3_desc') },
    { id: 'step4', icon: '📅', title: t('onboarding.step4_title'), description: t('onboarding.step4_desc') },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) setCurrentStep(currentStep + 1);
    else handleFinish();
  };

  const handleSkip = () => {
    if (window.confirm('Вы можете пройти обучение позже в настройках. Пропустить?')) handleFinish();
  };

  const handleFinish = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await client.put(ENDPOINTS.AUTH.ME, { onboarding_completed: true });
      if (updateUser) updateUser({ onboarding_completed: true });
      toast.success('Добро пожаловать!');
      if (onComplete) onComplete();
    } catch (error) {
      toast.error('Ошибка сохранения. Попробуйте позже.');
    } finally {
      setLoading(false);
    }
  };

  const step = steps[currentStep];
  const isLast = currentStep === steps.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-surface rounded-2xl border border-border max-w-lg w-full p-6 shadow-2xl animate-fade-in">
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">{step.icon}</div>
          <h2 className="text-2xl font-bold text-text-primary">{step.title}</h2>
          <p className="text-text-secondary mt-2 text-sm leading-relaxed">{step.description}</p>
        </div>
        <div className="flex justify-center gap-2 mb-6">
          {steps.map((_, i) => (
            <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === currentStep ? 'w-8 bg-accent-blue' : 'w-4 bg-border'}`} />
          ))}
        </div>
        <div className="flex justify-between items-center">
          <button onClick={handleSkip} className="text-sm text-text-muted hover:text-text-secondary transition-colors" disabled={loading}>
            {t('onboarding.skip')}
          </button>
          <button onClick={handleNext} className="btn-primary px-6 py-2 text-sm" disabled={loading}>
            {loading ? t('onboarding.loading') : isLast ? t('onboarding.finish') : t('onboarding.next')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;