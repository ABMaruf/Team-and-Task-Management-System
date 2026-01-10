import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'react-toastify';
import { getAccessToken, subscribe as sessionSubscribe } from '../services/sessionService';

export const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const { user } = useAuth();
  const mockEnabled = import.meta.env.VITE_USE_MOCK === 'true';
  const [sessionVersion, setSessionVersion] = useState(0);

  useEffect(() => {
    if (mockEnabled) return undefined;
    const unsubscribe = sessionSubscribe(() => {
      setSessionVersion((prev) => prev + 1);
    });
    return unsubscribe;
  }, [mockEnabled]);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setConnected(false);
      setSocket(null);
      return;
    }

    if (mockEnabled) {
      setSocket(null);
      setConnected(false);
      setNotifications([
        {
          id: 'mock-socket-1',
          message: 'Design review starts in 30 minutes.',
          created_at: new Date().toISOString(),
          is_read: false
        },
        {
          id: 'mock-socket-2',
          message: 'You reached a 6 day streak. Keep it going!',
          created_at: new Date(Date.now() - 3600 * 1000).toISOString(),
          is_read: false
        }
      ]);
      return;
    }

    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
    const newSocket = io(socketUrl, {
      auth: {
        token: getAccessToken()
      }
    });

    newSocket.on('connect', () => {
      console.log('Socket connected');
      setConnected(true);
      newSocket.emit('join', user.id);
    });

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
      setConnected(false);
    });

    newSocket.on('notification', (data) => {
      console.log('Received notification:', data);
      setNotifications((prev) => [data, ...prev]);
      toast.info(data.message, {
        onClick: () => {
          if (data.taskId) {
            console.log('Navigate to task:', data.taskId);
          }
        }
      });
    });

    newSocket.on('streak_updated', (data) => {
      console.log('Streak updated:', data);
      toast.success(`?? Streak updated: ${data.currentStreak} days!`);
    });

    newSocket.on('task_updated', (data) => {
      console.log('Task updated:', data);
    });

    newSocket.on('comment_added', (data) => {
      console.log('Comment added:', data);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [user, mockEnabled, sessionVersion]);


  // Emit task assigned event
  const emitTaskAssigned = (taskData) => {
    if (socket && connected) {
      socket.emit('task_assigned', taskData);
    }
  };

  // Emit task completed event
  const emitTaskCompleted = (taskData) => {
    if (socket && connected) {
      socket.emit('task_completed', taskData);
    }
  };

  // Emit new comment event
  const emitNewComment = (commentData) => {
    if (socket && connected) {
      socket.emit('new_comment', commentData);
    }
  };

  // Mark notification as read
  const markNotificationRead = (notificationId) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId 
          ? { ...notif, is_read: true }
          : notif
      )
    );
  };

  // Clear all notifications
  const clearNotifications = () => {
    setNotifications([]);
  };

  const value = {
    socket,
    connected,
    notifications,
    emitTaskAssigned,
    emitTaskCompleted,
    emitNewComment,
    markNotificationRead,
    clearNotifications
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider');
  }
  return context;
};
