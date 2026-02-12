import { apiClient } from './core/api-client';
import type { Plugin } from './types';

export const pluginService = {
  getPlugins: (): Promise<Plugin[]> =>
    apiClient.fetch(`${apiClient.coreUrl}/plugins`, {
      requireAuth: true,
    }),

  togglePlugin: (id: string): Promise<Plugin> =>
    apiClient.fetch(`${apiClient.coreUrl}/plugins/${id}/toggle`, {
      method: 'POST',
      requireAuth: true,
    }),
};
