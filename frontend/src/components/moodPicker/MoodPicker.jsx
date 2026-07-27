import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import { MOOD_COLORS } from './colors';

const MoodPicker = ({ onSubmit, onCancel, isLoading = false, defaultColor = '#4f8cf7', defaultMessage = '', defaultAnonymous = true }) => {
  const { t } = useTranslation();
  const [selectedColor, setSelectedColor] = useState(defaultColor);
  const [message, setMessage] = useState(defaultMessage);
  const [isAnonymous, setIsAnonymous] = useState(defaultAnonymous);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedColor) {
      toast.error('Выберите цвет настроения');
      return;
    }
    setIsSubmitting(true);
    try {
      await onSubmit(selectedColor, message.trim(), isAnonymous);
      setMessage('');
      setIsAnonymous(true);
    } catch (error) {
      // ошибка уже обработана в родителе
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-surface rounded-xl border border-border p-5 mt-4 animate-slide-up">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">{t('mood.pick_color')}</label>
          <div className="grid grid-cols-7 gap-2">
            {MOOD_COLORS.map((color) => (
              <button
                key={color.value}
                type="button"
                className={clsx(
                  'w-full aspect-square rounded-lg transition-all duration-200 transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface relative group',
                  selectedColor === color.value ? 'ring-2 ring-white scale-110' : 'hover:ring-1 hover:ring-border'
                )}
                style={{ backgroundColor: color.value }}
                onClick={() => setSelectedColor(color.value)}
                aria-label={`Цвет ${color.label}`}
                title={color.label}
              >
                <span className="absolute bottom-0 left-0 right-0 text-[8px] text-white bg-black/60 px-1 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity truncate">
                  {color.label}
                </span>
              </button>
            ))}
          </div>
        </div>
        <div>
          <label htmlFor="message" className="block text-sm font-medium text-text-secondary mb-1">{t('mood.message')}</label>
          <textarea
            id="message"
            rows={3}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={t('mood.message')}
            className="w-full resize-none"
            maxLength={500}
            disabled={isSubmitting || isLoading}
          />
          <div className="flex justify-between text-xs text-text-muted mt-1">
            <span>{t('mood.max_chars')}</span>
            <span>{message.length}/500</span>
          </div>
        </div>
        <div className="flex items-center">
          <input
            id="anonymous"
            type="checkbox"
            checked={isAnonymous}
            onChange={(e) => setIsAnonymous(e.target.checked)}
            className="w-4 h-4 bg-surface border-border rounded text-accent-blue focus:ring-accent-blue"
            disabled={isSubmitting || isLoading}
          />
          <label htmlFor="anonymous" className="ml-2 text-sm text-text-secondary">{t('mood.anonymous')}</label>
        </div>
        <div className="flex space-x-3">
          <button type="submit" className="btn-primary flex-1" disabled={isSubmitting || isLoading}>
            {isSubmitting || isLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                {t('mood.send')}
              </span>
            ) : (
              t('mood.send')
            )}
          </button>
          {onCancel && (
            <button type="button" className="btn-secondary" onClick={onCancel} disabled={isSubmitting || isLoading}>
              {t('mood.cancel')}
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default MoodPicker;