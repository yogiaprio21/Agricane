
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Notification } from '../types';
import { notificationService } from '../services/notification.service';
import { websocketService } from '../services/websocket.service';
import { useAuth } from '../hooks/useAuth';

interface NotificationContextData {
  notifications: Notification[];
  unreadCount: number;
  loadNotifications: () => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextData | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadInitialData();
      const token = localStorage.getItem('accessToken');
      if (token) {
        const socket = websocketService.connect(token);
        const handleNewNotification = (notification: Notification) => {
          setNotifications((prev) => [notification, ...prev]);
          if (!notification.isRead) {
            setUnreadCount((prev) => prev + 1);
          }
        };

        socket.on('new_notification', handleNewNotification);

        return () => {
          socket.off('new_notification', handleNewNotification);
        };
      }
    }
  }, [user]);

  const loadInitialData = async () => {
    await loadNotifications();
    await loadUnreadCount();
  };

  const loadNotifications = async () => {
    try {
      const data = await notificationService.getAll();
      setNotifications(data);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  };

  const loadUnreadCount = async () => {
    try {
      const { unreadCount: count } = await notificationService.getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error('Failed to load unread count:', error);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await notificationService.markAsRead(id);
      loadInitialData();
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      loadInitialData();
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await notificationService.delete(id);
      loadInitialData();
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loadNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = (): NotificationContextData => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};
