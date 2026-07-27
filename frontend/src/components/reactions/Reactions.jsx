import React, { useState, useEffect, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import client from '../../api/client';
import { ENDPOINTS } from '../../api/endpoints';
import { useAuth } from '../../hooks/useAuth';

const REACTION_TYPES = [
  { type: 'like', emoji: '👍', label: 'Нравится' },
  { type: 'heart', emoji: '❤️', label: 'Сердце' },
  { type: 'laugh', emoji: '😂', label: 'Смех' },
  { type: 'wow', emoji: '😮', label: 'Удивление' },
  { type: 'sad', emoji: '😢', label: 'Печаль' },
];

const Reactions = ({
  moodId,
  onReact,
  initialReactions = [],
  count: initialCount = 0,
  className = '',
}) => {
  const { user } = useAuth();
  const [reactions, setReactions] = useState(initialReactions);
  const [totalCount, setTotalCount] = useState(initialCount);
  const [userReactions, setUserReactions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const loadedRef = useRef(false);

  const loadReactions = useCallback(async () => {
    if (!moodId || loadedRef.current) return;
    try {
      const response = await client.get(ENDPOINTS.REACTIONS.BY_MOOD(moodId));
      const data = response.data || [];
      setReactions(data);
      setTotalCount(data.length);
      if (user) {
        const myReactions = data.filter((r) => r.user_id === user.id).map((r) => r.type);
        setUserReactions(myReactions);
      }
      loadedRef.current = true;
    } catch (error) {
      console.error('Failed to load reactions:', error);
    }
  }, [moodId, user]);

  useEffect(() => {
    if (initialReactions && initialReactions.length > 0) {
      setReactions(initialReactions);
      setTotalCount(initialReactions.length);
      if (user) {
        const myReactions = initialReactions.filter((r) => r.user_id === user.id).map((r) => r.type);
        setUserReactions(myReactions);
      }
      loadedRef.current = true;
    } else {
      loadReactions();
    }
  }, [moodId, user, initialReactions, loadReactions]);

  const handleReact = async (type) => {
    if (!user) {
      toast.error('Войдите, чтобы ставить реакции');
      return;
    }
    // Убедимся, что type – строка из списка
    const reactionType = String(type);
    if (!REACTION_TYPES.some((t) => t.type === reactionType)) {
      console.error('Invalid reaction type:', reactionType);
      toast.error('Некорректный тип реакции');
      return;
    }
    setIsLoading(true);
    try {
      // Проверяем, есть ли уже такая реакция у пользователя
      const existing = reactions.find((r) => r.user_id === user.id && r.type === reactionType);
      if (existing) {
        // Удаляем реакцию
        await client.delete(ENDPOINTS.REACTIONS.BY_ID(moodId, existing.id));
        setReactions((prev) => prev.filter((r) => r.id !== existing.id));
        setTotalCount((prev) => prev - 1);
        setUserReactions((prev) => prev.filter((t) => t !== reactionType));
        if (onReact) onReact(moodId, reactionType, false);
        toast.success(`Реакция "${reactionType}" убрана`);
      } else {
        // Добавляем реакцию
        const response = await client.post(ENDPOINTS.REACTIONS.BY_MOOD(moodId), { type: reactionType });
        const newReaction = response.data;
        setReactions((prev) => [...prev, newReaction]);
        setTotalCount((prev) => prev + 1);
        setUserReactions((prev) => [...prev, reactionType]);
        if (onReact) onReact(moodId, reactionType, true);
        toast.success(`Реакция "${reactionType}" добавлена`);
      }
    } catch (error) {
      const msg = error.response?.data?.detail || 'Ошибка при реакции';
      toast.error(msg);
      console.error('Reaction error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getCountByType = (type) => {
    return reactions.filter((r) => r.type === type).length;
  };

  const hasUserReacted = (type) => {
    return userReactions.includes(type);
  };

  return (
    <div className={clsx('flex items-center flex-wrap gap-2', className)}>
      {REACTION_TYPES.map(({ type, emoji, label }) => {
        const count = getCountByType(type);
        const active = hasUserReacted(type);
        return (
          <button
            key={type}
            onClick={() => handleReact(type)}
            disabled={isLoading}
            className={clsx(
              'flex items-center space-x-1 px-3 py-1.5 rounded-full border transition-all duration-200 text-sm',
              active
                ? 'bg-accent-blue/20 border-accent-blue text-accent-blue'
                : 'bg-surfaceLight border-transparent text-text-secondary hover:bg-border hover:text-text-primary'
            )}
            aria-label={label}
            title={label}
          >
            <span className="text-base">{emoji}</span>
            {count > 0 && <span className="text-xs font-medium">{count}</span>}
          </button>
        );
      })}
      {totalCount > 0 && (
        <span className="text-xs text-text-muted ml-1">
          {totalCount} {totalCount === 1 ? 'реакция' : 'реакций'}
        </span>
      )}
    </div>
  );
};

export default Reactions;