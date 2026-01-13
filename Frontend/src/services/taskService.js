import api from './api';
import { mockTaskApi } from './mockData';
import { unwrapResponse } from './unwrapResponse';

const normalizeStatus = (status) => {
  if (!status) return status;
  const value = String(status).toLowerCase().trim();
  if (value === 'in progress' || value === 'in-progress') return 'in_progress';
  if (value === 'complete') return 'completed';
  if (value === 'to do') return 'todo';
  return value;
};

const mapTask = (task) => {
  if (!task || typeof task !== 'object') {
    return task;
  }

  return {
    ...task,
    status: normalizeStatus(task.status),
    assigneeId: task.assigneeId ?? task.assigned_to ?? task.assignee?.id ?? null,
    assignee: task.assignee ?? (task.assignee_name ? { name: task.assignee_name } : null),
    dueDate: task.dueDate ?? task.deadline ?? null,
    projectId: task.projectId ?? task.project_id ?? null,
    project: task.project ?? (task.project_name ? { name: task.project_name } : null)
  };
};

const mapTaskList = (payload) => {
  if (!Array.isArray(payload)) {
    return payload;
  }
  return payload.map(mapTask);
};

const normalizeTaskPayload = (payload) => {
  if (!payload || typeof payload !== 'object') {
    return payload;
  }

  const normalized = { ...payload };

  if ('assigneeId' in normalized && !('assigned_to' in normalized)) {
    normalized.assigned_to = normalized.assigneeId || null;
  }

  if ('projectId' in normalized && !('project_id' in normalized)) {
    normalized.project_id = normalized.projectId || null;
  }

  if ('dueDate' in normalized && !('deadline' in normalized)) {
    normalized.deadline = normalized.dueDate || null;
  }

  delete normalized.assigneeId;
  delete normalized.projectId;
  delete normalized.dueDate;

  return normalized;
};

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
  return mapTaskList(unwrapResponse(response.data));
};

// Get task by ID
export const getTaskById = async (taskId) => {
  if (mockEnabled) {
    return mockTaskApi.getTaskById(taskId);
  }
  const response = await api.get(`/tasks/${taskId}`);
  return mapTask(unwrapResponse(response.data));
};

// Create new task
export const createTask = async (taskData) => {
  if (mockEnabled) {
    return mockTaskApi.createTask(taskData);
  }
  const response = await api.post('/tasks', normalizeTaskPayload(taskData));
  return mapTask(unwrapResponse(response.data));
};

// Update task
export const updateTask = async (taskId, taskData) => {
  if (mockEnabled) {
    return mockTaskApi.updateTask(taskId, taskData);
  }
  const response = await api.put(`/tasks/${taskId}`, normalizeTaskPayload(taskData));
  return mapTask(unwrapResponse(response.data));
};

// Delete task
export const deleteTask = async (taskId) => {
  if (mockEnabled) {
    return mockTaskApi.deleteTask(taskId);
  }
  const response = await api.delete(`/tasks/${taskId}`);
  return unwrapResponse(response.data);
};

// Update task status
export const updateTaskStatus = async (taskId, status) => {
  if (mockEnabled) {
    return mockTaskApi.updateTaskStatus(taskId, status);
  }
  const response = await api.patch(`/tasks/${taskId}/status`, { status });
  return mapTask(unwrapResponse(response.data));
};

// Assign task to user
export const assignTask = async (taskId, userId) => {
  if (mockEnabled) {
    return mockTaskApi.assignTask(taskId, userId);
  }
  const response = await api.patch(`/tasks/${taskId}/assign`, { userId });
  return unwrapResponse(response.data);
};

// Complete task
export const completeTask = async (taskId) => {
  if (mockEnabled) {
    return mockTaskApi.completeTask(taskId);
  }
  const response = await api.post(`/tasks/${taskId}/complete`);
  return unwrapResponse(response.data);
};

// Get my tasks
export const getMyTasks = async () => {
  if (mockEnabled) {
    return mockTaskApi.getMyTasks();
  }
  const response = await api.get('/tasks/my-tasks');
  return mapTaskList(unwrapResponse(response.data));
};
