import api from './api';
import { mockDashboardApi } from './mockData';

const mockEnabled = import.meta.env.VITE_USE_MOCK === 'true';

// Get overall statistics
export const getStatistics = async () => {
  if (mockEnabled) {
    return mockDashboardApi.getStatistics();
  }
  const response = await api.get('/dashboard/stats');
  return response.data;
};

// Get chart data
export const getChartData = async (period = '7days') => {
  if (mockEnabled) {
    return mockDashboardApi.getChartData(period);
  }
  const response = await api.get(`/dashboard/charts?period=${period}`);
  return response.data;
};

// Get leaderboard
export const getLeaderboard = async (limit = 10) => {
  if (mockEnabled) {
    return mockDashboardApi.getLeaderboard(limit);
  }
  const response = await api.get(`/dashboard/leaderboard?limit=${limit}`);
  return response.data;
};

// Get personal analytics
export const getMyAnalytics = async () => {
  if (mockEnabled) {
    return mockDashboardApi.getMyAnalytics();
  }
  const response = await api.get('/dashboard/my-analytics');
  return response.data;
};

// Get recent activity
export const getRecentActivity = async (limit = 10) => {
  if (mockEnabled) {
    return mockDashboardApi.getRecentActivity(limit);
  }
  const response = await api.get(`/dashboard/activity?limit=${limit}`);
  return response.data;
};
