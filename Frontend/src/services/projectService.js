import api from './api';
import { mockProjectApi } from './mockData';
import { unwrapResponse } from './unwrapResponse';

const mockEnabled = import.meta.env.VITE_USE_MOCK === 'true';

// Get all projects
export const getProjects = async () => {
  if (mockEnabled) {
    return mockProjectApi.getProjects();
  }
  const response = await api.get('/projects');
  return unwrapResponse(response.data);
};

// Get project by ID
export const getProjectById = async (projectId) => {
  if (mockEnabled) {
    return mockProjectApi.getProjectById(projectId);
  }
  const response = await api.get(`/projects/${projectId}`);
  return unwrapResponse(response.data);
};

// Create new project
export const createProject = async (projectData) => {
  if (mockEnabled) {
    return mockProjectApi.createProject(projectData);
  }
  const response = await api.post('/projects', projectData);
  return unwrapResponse(response.data);
};

// Update project
export const updateProject = async (projectId, projectData) => {
  if (mockEnabled) {
    return mockProjectApi.updateProject(projectId, projectData);
  }
  const response = await api.put(`/projects/${projectId}`, projectData);
  return unwrapResponse(response.data);
};

// Delete project
export const deleteProject = async (projectId) => {
  if (mockEnabled) {
    return mockProjectApi.deleteProject(projectId);
  }
  const response = await api.delete(`/projects/${projectId}`);
  return unwrapResponse(response.data);
};

// Get tasks in project
export const getProjectTasks = async (projectId) => {
  if (mockEnabled) {
    return mockProjectApi.getProjectTasks(projectId);
  }
  const response = await api.get(`/projects/${projectId}/tasks`);
  return unwrapResponse(response.data);
};

// Create project invite
export const createProjectInvite = async (projectId, payload) => {
  const response = await api.post(`/projects/${projectId}/invites`, payload);
  return unwrapResponse(response.data);
};

// Get invite info
export const getProjectInviteInfo = async (token) => {
  const response = await api.get(`/projects/invites/info?token=${encodeURIComponent(token)}`);
  return unwrapResponse(response.data);
};

// Accept invite
export const acceptProjectInvite = async (token) => {
  const response = await api.post('/projects/invites/accept', { token });
  return unwrapResponse(response.data);
};

// Get project members
export const getProjectMembers = async (projectId) => {
  const response = await api.get(`/projects/${projectId}/members`);
  return unwrapResponse(response.data);
};

// Add project member (owner only)
export const addProjectMember = async (projectId, payload) => {
  const response = await api.post(`/projects/${projectId}/members`, payload);
  return unwrapResponse(response.data);
};

// Update member role (owner only)
export const updateProjectMemberRole = async (projectId, userId, payload) => {
  const response = await api.patch(`/projects/${projectId}/members/${userId}`, payload);
  return unwrapResponse(response.data);
};

// Remove project member (owner/admin)
export const removeProjectMember = async (projectId, userId) => {
  const response = await api.delete(`/projects/${projectId}/members/${userId}`);
  return unwrapResponse(response.data);
};

// Get project chat messages
export const getProjectMessages = async (projectId) => {
  const response = await api.get(`/projects/${projectId}/messages`);
  return unwrapResponse(response.data);
};

// Add project chat message
export const addProjectMessage = async (projectId, payload) => {
  const response = await api.post(`/projects/${projectId}/messages`, payload);
  return unwrapResponse(response.data);
};
