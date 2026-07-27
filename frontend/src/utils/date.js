import { format, parseISO, isValid, differenceInDays, addDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, isToday, isYesterday, isTomorrow, formatDistanceToNow, formatDistance } from 'date-fns';
import { ru } from 'date-fns/locale';

/**
 * Форматирует дату в строку YYYY-MM-DD
 */
export const formatDateKey = (date) => {
  if (!date) return null;
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(d)) return null;
  return format(d, 'yyyy-MM-dd');
};

/**
 * Форматирует дату для отображения (например, "15 января 2025")
 */
export const formatDisplayDate = (date, formatStr = 'd MMMM yyyy') => {
  if (!date) return '';
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(d)) return '';
  return format(d, formatStr, { locale: ru });
};

/**
 * Форматирует время для отображения (например, "14:30")
 */
export const formatDisplayTime = (date) => {
  if (!date) return '';
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(d)) return '';
  return format(d, 'HH:mm', { locale: ru });
};

/**
 * Форматирует относительное время (например, "3 дня назад")
 */
export const formatRelativeTime = (date) => {
  if (!date) return '';
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(d)) return '';
  return formatDistanceToNow(d, { addSuffix: true, locale: ru });
};

/**
 * Проверяет, является ли дата сегодняшней
 */
export const isDateToday = (date) => {
  if (!date) return false;
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(d)) return false;
  return isToday(d);
};

/**
 * Проверяет, является ли дата вчерашней
 */
export const isDateYesterday = (date) => {
  if (!date) return false;
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(d)) return false;
  return isYesterday(d);
};

/**
 * Проверяет, является ли дата завтрашней
 */
export const isDateTomorrow = (date) => {
  if (!date) return false;
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(d)) return false;
  return isTomorrow(d);
};

/**
 * Проверяет, совпадают ли две даты (по дню)
 */
export const isSameDate = (date1, date2) => {
  if (!date1 || !date2) return false;
  const d1 = typeof date1 === 'string' ? parseISO(date1) : date1;
  const d2 = typeof date2 === 'string' ? parseISO(date2) : date2;
  if (!isValid(d1) || !isValid(d2)) return false;
  return isSameDay(d1, d2);
};

/**
 * Получает начало недели для указанной даты (понедельник)
 */
export const getWeekStart = (date = new Date()) => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(d)) return null;
  return startOfWeek(d, { weekStartsOn: 1 });
};

/**
 * Получает конец недели для указанной даты (воскресенье)
 */
export const getWeekEnd = (date = new Date()) => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(d)) return null;
  return endOfWeek(d, { weekStartsOn: 1 });
};

/**
 * Получает массив дней в неделе для указанной даты
 */
export const getWeekDays = (date = new Date()) => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(d)) return [];
  const start = startOfWeek(d, { weekStartsOn: 1 });
  const end = endOfWeek(d, { weekStartsOn: 1 });
  return eachDayOfInterval({ start, end });
};

/**
 * Получает количество дней между двумя датами
 */
export const getDaysDifference = (date1, date2) => {
  const d1 = typeof date1 === 'string' ? parseISO(date1) : date1;
  const d2 = typeof date2 === 'string' ? parseISO(date2) : date2;
  if (!isValid(d1) || !isValid(d2)) return null;
  return differenceInDays(d1, d2);
};

/**
 * Добавляет указанное количество дней к дате
 */
export const addDaysToDate = (date, days) => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(d)) return null;
  return addDays(d, days);
};

/**
 * Получает человеко-читаемое описание даты (сегодня, вчера, 15 января)
 */
export const getHumanReadableDate = (date) => {
  if (!date) return '';
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(d)) return '';

  if (isToday(d)) return 'Сегодня';
  if (isYesterday(d)) return 'Вчера';
  if (isTomorrow(d)) return 'Завтра';

  return format(d, 'd MMMM', { locale: ru });
};

/**
 * Преобразует строку даты в объект Date (с проверкой валидности)
 */
export const parseDate = (dateStr) => {
  if (!dateStr) return null;
  const d = parseISO(dateStr);
  if (!isValid(d)) return null;
  return d;
};

/**
 * Получает текущую дату в формате YYYY-MM-DD
 */
export const getTodayKey = () => {
  return formatDateKey(new Date());
};

/**
 * Проверяет, является ли строка валидной датой в формате YYYY-MM-DD
 */
export const isValidDateKey = (dateStr) => {
  if (!dateStr) return false;
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateStr)) return false;
  const d = parseISO(dateStr);
  return isValid(d);
};