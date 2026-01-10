import api from './api';
import { mockTeamApi } from './mockData';

const mockEnabled = import.meta.env.VITE_USE_MOCK === 'true';

export const getTeamMembers = async () => {
  if (mockEnabled) {
    return mockTeamApi.getTeamMembers();
  }
  const response = await api.get('/team/members');
  return response.data;
};

export const inviteMember = async (inviteData) => {
  if (mockEnabled) {
    return mockTeamApi.inviteMember(inviteData);
  }
  const response = await api.post('/team/members', inviteData);
  return response.data;
};

export const updateUserRole = async (userId, role) => {
  if (mockEnabled) {
    return mockTeamApi.updateUserRole(userId, role);
  }
  const response = await api.patch(`/team/members/${userId}/role`, { role });
  return response.data;
};

export const removeTeamMember = async (userId) => {
  if (mockEnabled) {
    return mockTeamApi.removeTeamMember(userId);
  }
  const response = await api.delete(`/team/members/${userId}`);
  return response.data;
};

export const getTeamSettings = async () => {
  if (mockEnabled) {
    return mockTeamApi.getTeamSettings();
  }
  const response = await api.get('/team/settings');
  return response.data;
};

export const updateTeamSettings = async (settings) => {
  if (mockEnabled) {
    return mockTeamApi.updateTeamSettings(settings);
  }
  const response = await api.put('/team/settings', settings);
  return response.data;
};

export const adjustMemberStats = async (userId, payload) => {
  if (mockEnabled) {
    return mockTeamApi.adjustMemberStats(userId, payload);
  }
  const response = await api.patch(`/team/members/${userId}/stats`, payload);
  return response.data;
};
