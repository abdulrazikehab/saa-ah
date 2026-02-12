import { apiClient } from './core/api-client';
import type { AppNotification, NotificationSettings } from './types';

export const notificationService = {
  getNotifications: async (): Promise<AppNotification[]> => {
    return apiClient.fetch(`${apiClient.coreUrl}/notifications`, {
      requireAuth: true,
    });
  },

  markAsRead: async (id: string): Promise<AppNotification> => {
    return apiClient.fetch(`${apiClient.coreUrl}/notifications/${id}/read`, {
      method: 'PUT',
      requireAuth: true,
    });
  },

  markAllAsRead: async (): Promise<{ count: number }> => {
    return apiClient.fetch(`${apiClient.coreUrl}/notifications/read-all`, {
      method: 'PUT',
      requireAuth: true,
    });
  },

  getSettings: async (): Promise<NotificationSettings> => {
    return apiClient.fetch(`${apiClient.coreUrl}/notifications/settings`, {
      requireAuth: true,
    });
  },

  updateSettings: async (settings: Partial<NotificationSettings>): Promise<NotificationSettings> => {
    return apiClient.fetch(`${apiClient.coreUrl}/notifications/settings`, {
      method: 'PUT',
      body: JSON.stringify(settings),
      requireAuth: true,
    });
  },
};
