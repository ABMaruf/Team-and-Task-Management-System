import api from './api';
import { mockNotificationApi } from './mockData';

const mockEnabled = import.meta.env.VITE_USE_MOCK === 'true';

// Get all notifications
export const getNotifications = async () => {
  if (mockEnabled) {
    return mockNotificationApi.getNotifications();
  }
  const response = await api.get('/notifications');
  return response.data;
};

// Get unread notifications
export const getUnreadNotifications = async () => {
  if (mockEnabled) {
    return mockNotificationApi.getUnreadNotifications();
  }
  const response = await api.get('/notifications/unread');
  return response.data;
};

// Mark notification as read
export const markAsRead = async (notificationId) => {
  if (mockEnabled) {
    return mockNotificationApi.markAsRead(notificationId);
  }
  const response = await api.patch(`/notifications/${notificationId}/read`);
  return response.data;
};

// Mark all notifications as read
export const markAllAsRead = async () => {
  if (mockEnabled) {
    return mockNotificationApi.markAllAsRead();
  }
  const response = await api.patch('/notifications/read-all');
  return response.data;
};

// Delete notification
export const deleteNotification = async (notificationId) => {
  if (mockEnabled) {
    return mockNotificationApi.deleteNotification(notificationId);
  }
  const response = await api.delete(`/notifications/${notificationId}`);
  return response.data;
};
