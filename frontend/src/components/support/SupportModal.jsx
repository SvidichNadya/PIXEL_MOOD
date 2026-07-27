import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import client from '../../api/client';
import { ENDPOINTS } from '../../api/endpoints';

const SupportModal = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) {
      toast.error(t('support.error_empty') || 'Напишите сообщение');
      return;
    }
    setSending(true);
    try {
      await client.post(ENDPOINTS.SUPPORT.SEND, { message: message.trim() });
      toast.success(t('support.success'));
      setMessage('');
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.detail || t('support.error'));
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div
        className="bg-surface rounded-2xl border border-border max-w-md w-full p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-text-primary">{t('support.title')}</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-surfaceLight transition-colors"
          >
            <svg className="w-5 h-5 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-sm text-text-secondary">
            {t('support.description')}
          </p>
          <textarea
            rows={5}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={t('support.message_placeholder')}
            className="w-full resize-none"
            required
            disabled={sending}
          />
          <button
            type="submit"
            className="btn-primary w-full"
            disabled={sending}
          >
            {sending ? t('support.sending') : t('support.send')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SupportModal;