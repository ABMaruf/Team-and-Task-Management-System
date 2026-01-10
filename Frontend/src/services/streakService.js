import api from './api';
import { mockStreakApi } from './mockData';

const mockEnabled = import.meta.env.VITE_USE_MOCK === 'true';

// Get user streak data
export const getUserStreak = async (userId) => {
  if (mockEnabled) {
    return mockStreakApi.getSummary(userId);
  }
  const response = await api.get(`/streaks/user/${userId}`);
  return response.data;
};

// Get streak history
export const getStreakHistory = async (userId, days = 30) => {
  if (mockEnabled) {
    return mockStreakApi.getHistory(days);
  }
  const response = await api.get(`/streaks/history/${userId}?days=${days}`);
  return response.data;
};

// Manually calculate streak (admin only)
export const calculateStreak = async () => {
  if (mockEnabled) {
    return mockStreakApi.calculateStreak();
  }
  const response = await api.post('/streaks/calculate');
  return response.data;
};

export const recordCompletion = async (userId, date) => {
  if (mockEnabled) {
    return mockStreakApi.recordCompletion(userId, date);
  }
  const response = await api.post('/streaks/complete', { userId, date });
  return response.data;
};
