import api from './api';
import { mockTaskApi } from './mockData';

const mockEnabled = import.meta.env.VITE_USE_MOCK === 'true';

// Get all tasks with optional filters
export const getTasks = async (filters = {}) => {
  const params = new URLSearchParams();
  
  if (filters.status) params.append('status', filters.status);
  if (filters.priority) params.append('priority', filters.priority);
  if (filters.assignee) params.append('assignee', filters.assignee);
  if (filters.project) params.append('project', filters.project);
  if (filters.search) params.append('search', filters.search);
  
  if (mockEnabled) {
    return mockTaskApi.getTasks(Object.fromEntries(params));
  }
  const response = await api.get(`/tasks?${params.toString()}`);
  return response.data;
};

// Get task by ID
export const getTaskById = async (taskId) => {
  if (mockEnabled) {
    return mockTaskApi.getTaskById(taskId);
  }
  const response = await api.get(`/tasks/${taskId}`);
  return response.data;
};

// Create new task
export const createTask = async (taskData) => {
  if (mockEnabled) {
    return mockTaskApi.createTask(taskData);
  }
  const response = await api.post('/tasks', taskData);
  return response.data;
};

// Update task
export const updateTask = async (taskId, taskData) => {
  if (mockEnabled) {
    return mockTaskApi.updateTask(taskId, taskData);
  }
  const response = await api.put(`/tasks/${taskId}`, taskData);
  return response.data;
};

// Delete task
export const deleteTask = async (taskId) => {
  if (mockEnabled) {
    return mockTaskApi.deleteTask(taskId);
  }
  const response = await api.delete(`/tasks/${taskId}`);
  return response.data;
};

// Update task status
export const updateTaskStatus = async (taskId, status) => {
  if (mockEnabled) {
    return mockTaskApi.updateTaskStatus(taskId, status);
  }
  const response = await api.patch(`/tasks/${taskId}/status`, { status });
  return response.data;
};

// Assign task to user
export const assignTask = async (taskId, userId) => {
  if (mockEnabled) {
    return mockTaskApi.assignTask(taskId, userId);
  }
  const response = await api.patch(`/tasks/${taskId}/assign`, { userId });
  return response.data;
};

// Complete task
export const completeTask = async (taskId) => {
  if (mockEnabled) {
    return mockTaskApi.completeTask(taskId);
  }
  const response = await api.post(`/tasks/${taskId}/complete`);
  return response.data;
};

// Get my tasks
export const getMyTasks = async () => {
  if (mockEnabled) {
    return mockTaskApi.getMyTasks();
  }
  const response = await api.get('/tasks/my-tasks');
  return response.data;
};
