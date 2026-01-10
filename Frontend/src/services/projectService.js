import api from './api';
import { mockProjectApi } from './mockData';

const mockEnabled = import.meta.env.VITE_USE_MOCK === 'true';

// Get all projects
export const getProjects = async () => {
  if (mockEnabled) {
    return mockProjectApi.getProjects();
  }
  const response = await api.get('/projects');
  return response.data;
};

// Get project by ID
export const getProjectById = async (projectId) => {
  if (mockEnabled) {
    return mockProjectApi.getProjectById(projectId);
  }
  const response = await api.get(`/projects/${projectId}`);
  return response.data;
};

// Create new project
export const createProject = async (projectData) => {
  if (mockEnabled) {
    return mockProjectApi.createProject(projectData);
  }
  const response = await api.post('/projects', projectData);
  return response.data;
};

// Update project
export const updateProject = async (projectId, projectData) => {
  if (mockEnabled) {
    return mockProjectApi.updateProject(projectId, projectData);
  }
  const response = await api.put(`/projects/${projectId}`, projectData);
  return response.data;
};

// Delete project
export const deleteProject = async (projectId) => {
  if (mockEnabled) {
    return mockProjectApi.deleteProject(projectId);
  }
  const response = await api.delete(`/projects/${projectId}`);
  return response.data;
};

// Get tasks in project
export const getProjectTasks = async (projectId) => {
  if (mockEnabled) {
    return mockProjectApi.getProjectTasks(projectId);
  }
  const response = await api.get(`/projects/${projectId}/tasks`);
  return response.data;
};
