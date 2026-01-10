import api from './api';
import { mockUserApi } from './mockData';

const mockEnabled = import.meta.env.VITE_USE_MOCK === 'true';

// Get all users
export const getUsers = async () => {
  if (mockEnabled) {
    return mockUserApi.getUsers();
  }
  const response = await api.get('/users');
  return response.data;
};

// Get user by ID
export const getUserById = async (userId) => {
  if (mockEnabled) {
    return mockUserApi.getUserById(userId);
  }
  const response = await api.get(`/users/${userId}`);
  return response.data;
};

// Update user profile
export const updateUserProfile = async (userId, userData) => {
  if (mockEnabled) {
    return mockUserApi.updateUserProfile(userId, userData);
  }
  const response = await api.put(`/users/${userId}`, userData);
  return response.data;
};

// Delete user
export const deleteUser = async (userId) => {
  if (mockEnabled) {
    return mockUserApi.deleteUser(userId);
  }
  const response = await api.delete(`/users/${userId}`);
  return response.data;
};

// Get user streak info
export const getUserStreak = async (userId) => {
  if (mockEnabled) {
    return mockUserApi.getUserStreak(userId);
  }
  const response = await api.get(`/users/${userId}/streak`);
  return response.data;
};

// Get user productivity stats
export const getUserProductivity = async (userId) => {
  if (mockEnabled) {
    return mockUserApi.getUserProductivity(userId);
  }
  const response = await api.get(`/users/${userId}/productivity`);
  return response.data;
};
