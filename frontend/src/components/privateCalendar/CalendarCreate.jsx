import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import client from '../../api/client';
import { ENDPOINTS } from '../../api/endpoints';

const calendarSchema = z.object({
  name: z.string().min(1, 'Название обязательно').max(100, 'Максимум 100 символов'),
  description: z.string().max(500, 'Максимум 500 символов').optional(),
});

const CalendarCreate = ({ onClose, onSuccess }) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(calendarSchema),
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      // Создаём календарь без участников (владелец добавится автоматически)
      const payload = {
        name: data.name,
        description: data.description || '',
        member_ids: [], // владелец будет добавлен на бекенде
      };

      const response = await client.post(ENDPOINTS.CALENDARS.LIST, payload);
      const newCalendar = response.data;

      toast.success(`Календарь "${newCalendar.name}" создан!`);
      reset();
      if (onSuccess) onSuccess(newCalendar);
      if (onClose) onClose();
      // Если хотим перейти на страницу календаря
      navigate(`/calendar/${newCalendar.id}`);
    } catch (error) {
      const msg = error.response?.data?.detail || 'Ошибка создания календаря';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div
        className="bg-surface rounded-2xl border border-border max-w-md w-full p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-text-primary">Создать приватный календарь</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-surfaceLight transition-colors"
          >
            <svg className="w-5 h-5 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-text-secondary mb-1">
              Название календаря <span className="text-accent-red">*</span>
            </label>
            <input
              id="name"
              type="text"
              placeholder="Например: Семья"
              className={`w-full ${errors.name ? 'input-error' : ''}`}
              {...register('name')}
              disabled={isLoading}
            />
            {errors.name && <p className="error-text">{errors.name.message}</p>}
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-text-secondary mb-1">
              Описание
            </label>
            <textarea
              id="description"
              rows={3}
              placeholder="Краткое описание календаря"
              className="w-full resize-none"
              {...register('description')}
              disabled={isLoading}
            />
            {errors.description && <p className="error-text">{errors.description.message}</p>}
          </div>

          <div className="bg-surfaceLight/50 rounded-lg p-3 text-sm text-text-secondary">
            <p>Вы будете владельцем календаря. Позже вы сможете добавить участников.</p>
          </div>

          <div className="flex space-x-3 pt-2">
            <button
              type="submit"
              className="btn-primary flex-1"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Создание...
                </span>
              ) : (
                'Создать'
              )}
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={isLoading}
            >
              Отмена
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CalendarCreate;