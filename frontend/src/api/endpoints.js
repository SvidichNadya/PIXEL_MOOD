// Все пути относительные, префикс /api добавляется в client.js
export const ENDPOINTS = {
  // Auth
  AUTH: {
    REGISTER: '/auth/register',
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    ME: '/auth/me',
    VK: '/auth/vk',
    TG: '/auth/tg',
  },

  // Moods (глобальные и приватные)
  MOODS: {
    GLOBAL: '/moods/global',
    GLOBAL_TODAY: '/moods/today/global',
    CALENDAR: (calendarId) => `/moods/calendar/${calendarId}`,
    CALENDAR_TODAY: (calendarId) => `/moods/calendar/${calendarId}/today`,
    BY_ID: (moodId) => `/moods/${moodId}`,
  },

  // Calendars (приватные)
  CALENDARS: {
    LIST: '/calendars',
    BY_ID: (calendarId) => `/calendars/${calendarId}`,
    MOODS: (calendarId, date) =>
      `/calendars/${calendarId}/moods?date=${date}`,
    INVITE: (calendarId) => `/calendars/${calendarId}/invite`,
    SEARCH_USERS: (query) => `/calendars/search-users?query=${encodeURIComponent(query)}`,
    LEAVE: (calendarId) => `/calendars/${calendarId}/leave`, // <-- ДОБАВЛЕНО
  },

  // Reactions – добавлен завершающий слэш для избежания редиректов
  REACTIONS: {
    BY_MOOD: (moodId) => `/moods/${moodId}/reactions/`,
    BY_ID: (moodId, reactionId) =>
      `/moods/${moodId}/reactions/${reactionId}`,
  },

  // Payments
  PAYMENTS: {
    DONATE: '/payments/donate',
    REVEAL: '/payments/reveal',
    WEBHOOK: '/payments/webhook',
  },

  // Stats
  STATS: {
    GLOBAL: (date) => `/stats/global?date=${date}`,
    CALENDAR: (calendarId, date) =>
      `/stats/calendar/${calendarId}?date=${date}`,
  },

  NOTIFICATIONS: {
    LIST: '/notifications',
    UNREAD_COUNT: '/notifications/unread-count',
    MARK_READ: (id) => `/notifications/${id}/read`,
    MARK_ALL_READ: '/notifications/read-all',
  },

  SUPPORT: {
    SEND: '/support',
  },

  ADMIN: {
    SUPPORT_REQUESTS: '/admin/support-requests',
    SUPPORT_REQUEST_DETAIL: (id) => `/admin/support-requests/${id}`,
    RESOLVE_REQUEST: (id) => `/admin/support-requests/${id}/resolve`,
  },
};