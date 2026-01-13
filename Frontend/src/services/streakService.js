import api from './api';
import { mockStreakApi } from './mockData';
import { unwrapResponse } from './unwrapResponse';

const mapStreakSummary = (payload) => {
  if (!payload || typeof payload !== 'object') {
    return payload;
  }

  return {
    ...payload,
    lastCompletedDate: payload.lastCompletedDate ?? payload.last_task_date ?? null,
    goal: payload.goal ?? 1
  };
};

const mapStreakHistory = (payload) => {
  if (!Array.isArray(payload)) {
    return payload;
  }

  return payload.map((entry) => ({
    ...entry,
    completed: entry.completed ?? entry.tasks_completed ?? 0
  }));
};

const mockEnabled = import.meta.env.VITE_USE_MOCK === 'true';

// Get user streak data
export const getUserStreak = async (userId) => {
  if (mockEnabled) {
    return mockStreakApi.getSummary(userId);
  }
  const response = await api.get(`/streaks/user/${userId}`);
  return mapStreakSummary(unwrapResponse(response.data));
};

// Get streak history
export const getStreakHistory = async (userId, days = 30) => {
  if (mockEnabled) {
    return mockStreakApi.getHistory(days);
  }
  const response = await api.get(`/streaks/history/${userId}?days=${days}`);
  return mapStreakHistory(unwrapResponse(response.data));
};

// Manually calculate streak (admin only)
export const calculateStreak = async () => {
  if (mockEnabled) {
    return mockStreakApi.calculateStreak();
  }
  const response = await api.post('/streaks/calculate');
  return unwrapResponse(response.data);
};

export const recordCompletion = async (userId, date) => {
  if (mockEnabled) {
    return mockStreakApi.recordCompletion(userId, date);
  }
  const response = await api.post('/streaks/complete', { userId, date });
  return unwrapResponse(response.data);
};
