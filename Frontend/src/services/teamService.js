import api from './api';
import { mockTeamApi } from './mockData';
import { unwrapResponse } from './unwrapResponse';

const mockEnabled = import.meta.env.VITE_USE_MOCK === 'true';

const withFallback = async (request, fallback) => {
  try {
    const response = await request();
    return unwrapResponse(response.data);
  } catch (error) {
    console.warn('Team API unavailable, using mock data.', error);
    return fallback();
  }
};

export const getTeamMembers = async () => {
  if (mockEnabled) {
    return mockTeamApi.getTeamMembers();
  }
  return withFallback(
    () => api.get('/team/members'),
    () => mockTeamApi.getTeamMembers()
  );
};

export const inviteMember = async (inviteData) => {
  if (mockEnabled) {
    return mockTeamApi.inviteMember(inviteData);
  }
  return withFallback(
    () => api.post('/team/members', inviteData),
    () => mockTeamApi.inviteMember(inviteData)
  );
};

export const updateUserRole = async (userId, role) => {
  if (mockEnabled) {
    return mockTeamApi.updateUserRole(userId, role);
  }
  return withFallback(
    () => api.patch(`/team/members/${userId}/role`, { role }),
    () => mockTeamApi.updateUserRole(userId, role)
  );
};

export const removeTeamMember = async (userId) => {
  if (mockEnabled) {
    return mockTeamApi.removeTeamMember(userId);
  }
  return withFallback(
    () => api.delete(`/team/members/${userId}`),
    () => mockTeamApi.removeTeamMember(userId)
  );
};

export const getTeamSettings = async () => {
  if (mockEnabled) {
    return mockTeamApi.getTeamSettings();
  }
  return withFallback(
    () => api.get('/team/settings'),
    () => mockTeamApi.getTeamSettings()
  );
};

export const updateTeamSettings = async (settings) => {
  if (mockEnabled) {
    return mockTeamApi.updateTeamSettings(settings);
  }
  return withFallback(
    () => api.put('/team/settings', settings),
    () => mockTeamApi.updateTeamSettings(settings)
  );
};

export const adjustMemberStats = async (userId, payload) => {
  if (mockEnabled) {
    return mockTeamApi.adjustMemberStats(userId, payload);
  }
  return withFallback(
    () => api.patch(`/team/members/${userId}/stats`, payload),
    () => mockTeamApi.adjustMemberStats(userId, payload)
  );
};
