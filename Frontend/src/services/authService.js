import api from './api';
import { mockAuthApi } from './mockData';

const mockEnabled = import.meta.env.VITE_USE_MOCK === 'true';

// Register new user
export const register = async (userData) => {
  if (mockEnabled) {
    return mockAuthApi.register(userData);
  }
  const response = await api.post('/auth/register', userData);
  return response.data;
};

// Login user
export const login = async (email, password) => {
  if (mockEnabled) {
    return mockAuthApi.login(email, password);
  }
  const response = await api.post('/auth/login', { email, password });
  return response.data;
};

// Logout user
export const logout = async () => {
  if (mockEnabled) {
    return mockAuthApi.logout();
  }
  const response = await api.post('/auth/logout');
  return response.data;
};

// Get current user
export const getCurrentUser = async () => {
  if (mockEnabled) {
    return mockAuthApi.getCurrentUser();
  }
  const response = await api.get('/auth/me');
  return response.data;
};

// Refresh token
export const refreshToken = async (refreshTokenValue) => {
  if (mockEnabled) {
    return mockAuthApi.refreshToken(refreshTokenValue);
  }
  const payload = refreshTokenValue ? { refreshToken: refreshTokenValue } : undefined;
  const response = await api.post('/auth/refresh-token', payload);
  return response.data;
};
