import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import client from '../../api/client';
import { ENDPOINTS } from '../../api/endpoints';
import { useAuth } from '../../hooks/useAuth';
import RevealButton from '../payments/RevealButton';
import Reactions from '../reactions/Reactions';

const MoodCard = ({
  mood,
  onClose,
  onReact,
  onReveal,
  isVisible = true,
  className = '',
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  if (!mood) {
    console.warn('MoodCard: mood is null/undefined');
    return null;
  }

  const isOwn = user?.id === mood.user_id;
  const isAnonymous = mood.is_anonymous;
  const canReveal = !isOwn && isAnonymous && mood.allow_paid_reveal !== false;

  const handleClose = () => {
    if (onClose) onClose();
  };

  const toggleExpand = () => setIsExpanded(!isExpanded);

  const authorName = isAnonymous
    ? t('mood.anonymous_badge')
    : mood.username || mood.user_id?.slice(0, 8) || t('mood.unknown');

  const handleReactionUpdate = (moodId, type, added) => {
    if (onReact) onReact(moodId, type, added);
  };

  return (
    <div
      className={clsx(
        'fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in',
        { hidden: !isVisible }
      )}
      onClick={handleClose}
    >
      <div
        className={clsx(
          'bg-surface rounded-2xl border border-border max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl',
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center space-x-3">
            <div
              className="w-4 h-4 rounded-full flex-shrink-0"
              style={{ backgroundColor: mood.color || '#2d2d44' }}
            />
            <span className="text-sm font-medium text-text-secondary">
              {mood.date ? formatDistanceToNow(new Date(mood.date), { addSuffix: true, locale: ru }) : 'Сегодня'}
            </span>
          </div>
          <button
            onClick={handleClose}
            className="p-1 rounded-lg hover:bg-surfaceLight transition-colors duration-200"
            aria-label={t('mood.close')}
          >
            <svg className="w-5 h-5 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-text-primary font-medium break-words">{authorName}</span>
              {isAnonymous && (
                <span className="text-xs bg-surfaceLight px-2 py-0.5 rounded-full text-text-muted">
                  {t('mood.anonymous_badge')}
                </span>
              )}
              {isOwn && (
                <span className="text-xs bg-accent-blue/20 px-2 py-0.5 rounded-full text-accent-blue">
                  {t('mood.you')}
                </span>
              )}
            </div>
            {canReveal && (
              <RevealButton
                moodId={mood.id}
                onSuccess={onReveal}
                className="text-xs"
                label={t('mood.reveal')}
              />
            )}
          </div>

          {mood.message && (
            <div>
              <p
                className={clsx(
                  'text-text-primary text-sm leading-relaxed whitespace-pre-wrap break-words overflow-wrap-anywhere transition-all duration-300',
                  !isExpanded && 'line-clamp-3'
                )}
              >
                {mood.message}
              </p>
              {mood.message.length > 100 && (
                <button
                  onClick={toggleExpand}
                  className="mt-1 text-xs text-accent-blue hover:text-accent-purple transition-colors"
                >
                  {isExpanded ? t('mood.show_less') : t('mood.show_more')}
                </button>
              )}
            </div>
          )}

          <Reactions
            moodId={mood.id}
            onReact={handleReactionUpdate}
            initialReactions={mood.reactions || []}
            count={mood.reaction_count || 0}
          />

          {isOwn && (
            <div className="flex items-center space-x-4 pt-2 border-t border-border">
              <button
                className="text-xs text-text-muted hover:text-accent-red transition-colors"
                onClick={async () => {
                  if (!confirm(t('mood.delete_confirm'))) return;
                  setIsLoading(true);
                  try {
                    await client.delete(ENDPOINTS.MOODS.BY_ID(mood.id));
                    toast.success(t('mood.delete_success'));
                    if (onClose) onClose();
                  } catch (error) {
                    toast.error(error.response?.data?.detail || t('mood.delete_error'));
                  } finally {
                    setIsLoading(false);
                  }
                }}
                disabled={isLoading}
              >
                {isLoading ? t('mood.deleting') : t('mood.delete')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MoodCard;