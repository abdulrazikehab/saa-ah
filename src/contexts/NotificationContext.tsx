import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createNotificationsSocket } from '@/lib/socket';
import { coreApi } from '@/lib/api';
import { Socket } from 'socket.io-client';
import { toast } from 'sonner';

interface Notification {
  id: string;
  type: 'ORDER' | 'CUSTOMER' | 'INVENTORY' | 'MARKETING';
  titleEn: string;
  titleAr?: string;
  bodyEn: string;
  bodyAr?: string;
  data?: any;
  readAt: string | null;
  createdAt: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, token } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);

  const fetchNotifications = useCallback(async () => {
    if (!token) return;
    try {
      const data = await coreApi.get('/notifications', { requireAuth: true });
      if (Array.isArray(data)) {
        setNotifications(data);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  }, [token]);

  useEffect(() => {
    if (token && user) {
      fetchNotifications();

      const newSocket = createNotificationsSocket(token);
      
      newSocket.on('connect', () => {
        console.log('Connected to notifications socket');
      });

      newSocket.on('notification', (notification: Notification) => {
        setNotifications(prev => [notification, ...prev]);
        
        // Show toast for new notification
        const title = i18next.language === 'ar' ? notification.titleAr || notification.titleEn : notification.titleEn;
        const body = i18next.language === 'ar' ? notification.bodyAr || notification.bodyEn : notification.bodyEn;
        
        toast(title, {
          description: body,
          action: {
            label: i18next.language === 'ar' ? 'عرض' : 'View',
            onClick: () => {
              // Handle navigation based on type
              if (notification.type === 'ORDER') window.location.href = '/dashboard/orders';
              if (notification.type === 'CUSTOMER') window.location.href = '/dashboard/customers';
              if (notification.type === 'INVENTORY') window.location.href = '/dashboard/products';
            }
          }
        });
      });

      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
      };
    }
  }, [token, user, fetchNotifications]);

  const markAsRead = async (id: string) => {
    try {
      await coreApi.put(`/notifications/${id}/read`, {}, { requireAuth: true });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, readAt: new Date().toISOString() } : n));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await coreApi.put('/notifications/read-all', {}, { requireAuth: true });
      setNotifications(prev => prev.map(n => ({ ...n, readAt: new Date().toISOString() })));
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const unreadCount = notifications.filter(n => !n.readAt).length;

  return (
    <NotificationContext.Provider value={{ 
      notifications, 
      unreadCount, 
      markAsRead, 
      markAllAsRead, 
      refreshNotifications: fetchNotifications 
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

import i18next from 'i18next';
