import api from './api';
import { mockCommentApi } from './mockData';

const mockEnabled = import.meta.env.VITE_USE_MOCK === 'true';

const normalizePayload = (payload) => {
  if (typeof payload === 'string') {
    return { comment: payload };
  }
  return payload || {};
};

// Get comments for task
export const getTaskComments = async (taskId) => {
  if (mockEnabled) {
    return mockCommentApi.getTaskComments(taskId);
  }
  const response = await api.get(`/comments/task/${taskId}`);
  return response.data;
};

// Add comment to task
export const addComment = async (taskId, payload) => {
  const body = normalizePayload(payload);
  if (mockEnabled) {
    return mockCommentApi.addComment(taskId, body);
  }
  const response = await api.post(`/comments/task/${taskId}`, { comment: body.comment });
  return response.data;
};

// Update comment
export const updateComment = async (commentId, payload) => {
  const body = normalizePayload(payload);
  if (mockEnabled) {
    return mockCommentApi.updateComment(commentId, body);
  }
  const response = await api.put(`/comments/${commentId}`, { comment: body.comment });
  return response.data;
};

// Delete comment
export const deleteComment = async (commentId) => {
  if (mockEnabled) {
    return mockCommentApi.deleteComment(commentId);
  }
  const response = await api.delete(`/comments/${commentId}`);
  return response.data;
};
