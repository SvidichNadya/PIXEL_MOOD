import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import client from '../api/client';
import { ENDPOINTS } from '../api/endpoints';
import Spinner from '../components/common/Spinner';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { MOOD_COLORS } from '../components/moodPicker/colors';

const colorNameMap = Object.fromEntries(
  MOOD_COLORS.map(({ value, label }) => [value.toLowerCase(), label])
);

const StatsPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const response = await client.get(ENDPOINTS.STATS.GLOBAL(date));
        setStats(response.data);
      } catch (error) {
        toast.error(error.response?.data?.detail || t('errors.generic'));
        setStats(null);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [date]);

  const handleDateChange = (e) => {
    setDate(e.target.value);
  };

  const formatDate = (dateStr) => {
    try {
      return format(new Date(dateStr), 'd MMMM yyyy', { locale: ru });
    } catch {
      return dateStr;
    }
  };

  const getColorName = (hex) => {
    if (!hex) return 'Неизвестно';
    const lowerHex = hex.toLowerCase();
    return colorNameMap[lowerHex] || hex;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-text-primary">{t('stats.title')}</h1>
        <input
          type="date"
          value={date}
          onChange={handleDateChange}
          className="bg-surface border border-border rounded-lg px-4 py-2 text-text-primary"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner label={t('common.loading')} />
        </div>
      ) : stats ? (
        <div className="space-y-6">
          <div className="bg-surface rounded-xl border border-border p-6">
            <h2 className="text-lg font-medium text-text-primary mb-4">
              {formatDate(stats.daily.date)}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-surfaceLight rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-accent-blue">{stats.daily.total_pixels}</p>
                <p className="text-sm text-text-muted">{t('stats.total_pixels')}</p>
              </div>
              <div className="bg-surfaceLight rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-accent-purple">
                  {Object.keys(stats.daily.color_distribution || {}).length}
                </p>
                <p className="text-sm text-text-muted">{t('stats.unique_colors')}</p>
              </div>
              <div className="bg-surfaceLight rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-green-400">
                  {stats.top_authors?.length || 0}
                </p>
                <p className="text-sm text-text-muted">{t('stats.top_authors')}</p>
              </div>
              <div className="bg-surfaceLight rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-accent-orange">
                  {stats.top_authors?.[0]?.count || 0}
                </p>
                <p className="text-sm text-text-muted">{t('stats.max_one')}</p>
              </div>
            </div>
          </div>

          <div className="bg-surface rounded-xl border border-border p-6">
            <h3 className="text-md font-medium text-text-primary mb-3">{t('stats.color_distribution')}</h3>
            <div className="space-y-2">
              {Object.entries(stats.daily.color_distribution || {})
                .sort((a, b) => b[1] - a[1])
                .slice(0, 10)
                .map(([color, count]) => {
                  const colorName = getColorName(color);
                  return (
                    <div key={color} className="flex items-center space-x-3">
                      <div
                        className="w-6 h-6 rounded-full flex-shrink-0 border border-border"
                        style={{ backgroundColor: color }}
                      />
                      <span className="text-sm text-text-secondary font-medium">
                        {colorName}
                      </span>
                      <div className="flex-1 h-2 bg-surfaceLight rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${(count / stats.daily.total_pixels) * 100}%`,
                            backgroundColor: color,
                          }}
                        />
                      </div>
                      <span className="text-sm text-text-muted">{count}</span>
                    </div>
                  );
                })}
              {Object.keys(stats.daily.color_distribution || {}).length === 0 && (
                <p className="text-text-muted text-sm">{t('stats.no_data')}</p>
              )}
            </div>
          </div>

          <div className="bg-surface rounded-xl border border-border p-6">
            <h3 className="text-md font-medium text-text-primary mb-3">{t('stats.top_authors')}</h3>
            {stats.top_authors?.length > 0 ? (
              <ul className="space-y-2">
                {stats.top_authors.map((author, index) => (
                  <li key={author.user_id} className="flex items-center justify-between p-2 bg-surfaceLight rounded-lg">
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-bold text-text-muted w-6">#{index + 1}</span>
                      <span className="text-sm text-text-primary">{author.username}</span>
                    </div>
                    <span className="text-sm text-accent-blue font-medium">{author.count} {t('stats.pixels') || 'пикселей'}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-text-muted text-sm">{t('stats.no_data')}</p>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-text-secondary">{t('errors.generic')}</p>
        </div>
      )}
    </div>
  );
};

export default StatsPage;