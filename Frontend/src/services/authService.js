import api from './api';
import { mockAuthApi } from './mockData';
import { unwrapResponse } from './unwrapResponse';

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

export const loginWithGoogle = async (credential) => {
  if (mockEnabled) {
    return mockAuthApi.login({ email: 'google@example.com', password: 'mock' });
  }
  const response = await api.post('/auth/google', { credential });
  return response.data;
};

export const exchangeGithubCode = async (code) => {
  if (mockEnabled) {
    return mockAuthApi.login({ email: 'github@example.com', password: 'mock' });
  }
  const response = await api.post('/auth/github/exchange', { code });
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
  return unwrapResponse(response.data);
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

export const verifyEmail = async (token) => {
  const response = await api.get(`/auth/verify-email?token=${encodeURIComponent(token)}`);
  return response.data;
};

export const resendVerificationEmail = async (email) => {
  const response = await api.post('/auth/resend-verification', { email });
  return response.data;
};
