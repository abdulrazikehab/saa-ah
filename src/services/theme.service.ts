import { apiClient } from './core/api-client';
import type { Theme, CreateThemeData } from './types';

export const themeService = {
  getThemes: (): Promise<Theme[]> =>
    apiClient.fetch(`${apiClient.coreUrl}/themes`, {
      requireAuth: false,
    }),

  getTheme: (id: string): Promise<Theme> =>
    apiClient.fetch(`${apiClient.coreUrl}/themes/${id}`, {
      requireAuth: false,
    }),

  createTheme: (data: CreateThemeData): Promise<Theme> =>
    apiClient.fetch(`${apiClient.coreUrl}/themes`, {
      method: 'POST',
      body: JSON.stringify(data),
      requireAuth: true,
    }),

  updateTheme: (id: string, data: Partial<CreateThemeData>): Promise<Theme> =>
    apiClient.fetch(`${apiClient.coreUrl}/themes/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
      requireAuth: true,
    }),

  deleteTheme: (id: string): Promise<void> =>
    apiClient.fetch(`${apiClient.coreUrl}/themes/${id}`, {
      method: 'DELETE',
      requireAuth: true,
    }),

  installTheme: (id: string): Promise<void> =>
    apiClient.fetch(`${apiClient.coreUrl}/themes/${id}/install`, {
      method: 'POST',
      requireAuth: true,
    }),

  activateTheme: (id: string): Promise<void> =>
    apiClient.fetch(`${apiClient.coreUrl}/themes/${id}/activate`, {
      method: 'POST',
      requireAuth: true,
    }),
};
