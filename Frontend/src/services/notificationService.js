import api from './api';
import { mockNotificationApi } from './mockData';
import { unwrapResponse } from './unwrapResponse';

const formatTitle = (type) => {
  if (!type) return 'Notification';
  return type
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const mapNotification = (notification) => {
  if (!notification || typeof notification !== 'object') {
    return notification;
  }

  return {
    ...notification,
    title: notification.title ?? formatTitle(notification.type)
  };
};

const mapNotificationList = (payload) => {
  if (!Array.isArray(payload)) {
    return payload;
  }
  return payload.map(mapNotification);
};

const mockEnabled = import.meta.env.VITE_USE_MOCK === 'true';

// Get all notifications
export const getNotifications = async () => {
  if (mockEnabled) {
    return mockNotificationApi.getNotifications();
  }
  const response = await api.get('/notifications');
  return mapNotificationList(unwrapResponse(response.data));
};

// Get unread notifications
export const getUnreadNotifications = async () => {
  if (mockEnabled) {
    return mockNotificationApi.getUnreadNotifications();
  }
  const response = await api.get('/notifications/unread');
  return mapNotificationList(unwrapResponse(response.data));
};

// Mark notification as read
export const markAsRead = async (notificationId) => {
  if (mockEnabled) {
    return mockNotificationApi.markAsRead(notificationId);
  }
  const response = await api.patch(`/notifications/${notificationId}/read`);
  return unwrapResponse(response.data);
};

// Mark all notifications as read
export const markAllAsRead = async () => {
  if (mockEnabled) {
    return mockNotificationApi.markAllAsRead();
  }
  const response = await api.patch('/notifications/read-all');
  return unwrapResponse(response.data);
};

// Delete notification
export const deleteNotification = async (notificationId) => {
  if (mockEnabled) {
    return mockNotificationApi.deleteNotification(notificationId);
  }
  const response = await api.delete(`/notifications/${notificationId}`);
  return unwrapResponse(response.data);
};
