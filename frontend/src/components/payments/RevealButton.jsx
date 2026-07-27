import React, { useState } from 'react';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import client from '../../api/client';
import { ENDPOINTS } from '../../api/endpoints';

const RevealButton = ({
  moodId,
  onSuccess,
  onError,
  className = '',
  variant = 'primary',
  label = 'Раскрыть автора',
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleReveal = async () => {
    if (!moodId) {
      toast.error('ID настроения не указан');
      return;
    }

    setIsLoading(true);
    try {
      const response = await client.post(ENDPOINTS.PAYMENTS.REVEAL, { mood_id: moodId });
      const { payment_url } = response.data;

      if (payment_url) {
        // Открываем платёжную страницу в новом окне
        window.open(payment_url, '_blank');
        if (onSuccess) onSuccess(response.data);
        toast.success('Платёж для раскрытия инициирован');
      } else {
        throw new Error('Ссылка на оплату не получена');
      }
    } catch (error) {
      const msg = error.response?.data?.detail || 'Не удалось создать платёж для раскрытия';
      toast.error(msg);
      if (onError) onError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const variantClasses = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    outline: 'bg-transparent border border-border hover:bg-surfaceLight text-text-primary',
    ghost: 'bg-transparent hover:bg-surfaceLight text-text-secondary text-xs',
  };

  return (
    <button
      onClick={handleReveal}
      disabled={isLoading}
      className={clsx(
        'px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-50',
        variantClasses[variant] || variantClasses.primary,
        className
      )}
    >
      {isLoading ? (
        <span className="flex items-center justify-center">
          <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Обработка...
        </span>
      ) : (
        label
      )}
    </button>
  );
};

export default RevealButton;