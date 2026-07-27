import { useState, useEffect, useCallback, useRef } from 'react';
import client from '../../api/client';       // поднимаемся на два уровня
import { ENDPOINTS } from '../../api/endpoints';

/**
 * Хук для управления состоянием канваса календаря
 */
export const useCanvas = (options = {}) => {
  const {
    date = new Date().toISOString().split('T')[0],
    calendarId = null,
    autoLoad = true,
  } = options;

  const [pixels, setPixels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPixel, setSelectedPixel] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [totalPixels, setTotalPixels] = useState(0);
  const [myMood, setMyMood] = useState(null);
  const mountedRef = useRef(true);

  // Загрузка пикселей
  const loadPixels = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let response;
      if (calendarId) {
        response = await client.get(ENDPOINTS.CALENDARS.MOODS(calendarId, date));
      } else {
        response = await client.get(`${ENDPOINTS.MOODS.GLOBAL}?date=${date}`);
      }
      if (mountedRef.current) {
        const data = response.data || [];
        setPixels(data);
        setTotalPixels(data.length);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err.response?.data?.detail || 'Ошибка загрузки пикселей');
        setPixels([]);
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [date, calendarId]);

  // Проверка, есть ли у пользователя настроение сегодня
  const checkMyMood = useCallback(async () => {
    try {
      let response;
      if (calendarId) {
        response = await client.get(ENDPOINTS.MOODS.CALENDAR_TODAY(calendarId));
      } else {
        response = await client.get(ENDPOINTS.MOODS.GLOBAL_TODAY);
      }
      if (mountedRef.current) setMyMood(response.data || null);
    } catch (err) {
      if (err.response?.status === 404) setMyMood(null);
    }
  }, [calendarId]);

  // Создание нового пикселя
  const createMood = useCallback(
    async (color, message = '', isAnonymous = true, position = null) => {
      try {
        const payload = { color, message, is_anonymous: isAnonymous, date, position };
        let response;
        if (calendarId) {
          response = await client.post(ENDPOINTS.MOODS.CALENDAR(calendarId), payload);
        } else {
          response = await client.post(ENDPOINTS.MOODS.GLOBAL, payload);
        }
        const newMood = response.data;
        if (mountedRef.current) {
          setPixels(prev => {
            const updated = [...prev];
            if (position !== null && position !== undefined) {
              // Если пиксель уже есть по этой позиции – заменяем, иначе добавляем
              const existingIdx = updated.findIndex(p => p.position === position);
              if (existingIdx !== -1) {
                updated[existingIdx] = { ...newMood, isNew: true };
              } else {
                updated[position] = { ...newMood, isNew: true };
              }
            } else {
              updated.push({ ...newMood, isNew: true });
            }
            return updated;
          });
          setMyMood(newMood);
          setTotalPixels(prev => prev + 1);
        }
        return newMood;
      } catch (err) {
        throw new Error(err.response?.data?.detail || 'Ошибка создания настроения');
      }
    },
    [calendarId, date]
  );

  // Обработка клика по пикселю
  const handlePixelClick = useCallback((pixel, index) => {
    setSelectedPixel(pixel);
    setSelectedIndex(index);
  }, []);

  // Сброс выбранного пикселя
  const clearSelected = useCallback(() => {
    setSelectedPixel(null);
    setSelectedIndex(null);
  }, []);

  // Обновление пикселя (после реакции и т.д.)
  const updatePixel = useCallback((index, updates) => {
    setPixels(prev => {
      const updated = [...prev];
      if (index >= 0 && index < updated.length) {
        updated[index] = { ...updated[index], ...updates };
      }
      return updated;
    });
  }, []);

  // Загрузка при монтировании
  useEffect(() => {
    mountedRef.current = true;
    if (autoLoad) {
      loadPixels();
      checkMyMood();
    }
    return () => { mountedRef.current = false; };
  }, [autoLoad, loadPixels, checkMyMood]);

  return {
    pixels,
    loading,
    error,
    selectedPixel,
    selectedIndex,
    totalPixels,
    myMood,
    loadPixels,
    createMood,
    handlePixelClick,
    clearSelected,
    updatePixel,
    setPixels,
  };
};

export default useCanvas;