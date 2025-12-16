import { apiClient } from './core/api-client';
import type { Page, CreatePageData, PageHistory } from './types';

// Helper to safely encode ID for URL (handles special characters like + and /)
const encodeId = (id: string): string => encodeURIComponent(id);

export const pageService = {
  getPages: async (): Promise<Page[]> => {
    const response = await apiClient.fetch(`${apiClient.coreUrl}/pages`, {
      requireAuth: true,
    });
    // After central unwrapping, response is the array of pages
    return Array.isArray(response) ? response : [];
  },

  getPage: async (id: string): Promise<Page> => {
    return apiClient.fetch(`${apiClient.coreUrl}/pages/${encodeId(id)}`, {
      requireAuth: true,
    });
  },

  getPageBySlug: async (slug: string): Promise<Page> => {
    try {
      return await apiClient.fetch(`${apiClient.coreUrl}/pages/slug/${encodeURIComponent(slug)}`, {
        requireAuth: false, // Public endpoint for viewing pages on subdomains
      });
    } catch (error: any) {
      // If 404, return null instead of throwing (page doesn't exist)
      if (error?.status === 404) {
        return null as any;
      }
      throw error;
    }
  },

  createPage: async (data: CreatePageData): Promise<Page> => {
    return apiClient.fetch(`${apiClient.coreUrl}/pages`, {
      method: 'POST',
      body: JSON.stringify(data),
      requireAuth: true,
    });
  },

  updatePage: async (id: string, data: Partial<CreatePageData>): Promise<Page> => {
    return apiClient.fetch(`${apiClient.coreUrl}/pages/${encodeId(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
      requireAuth: true,
    });
  },

  deletePage: async (id: string): Promise<void> => {
    await apiClient.fetch(`${apiClient.coreUrl}/pages/${encodeId(id)}`, {
      method: 'DELETE',
      requireAuth: true,
    });
  },

  getHistory: async (id: string): Promise<PageHistory[]> => {
    const response = await apiClient.fetch(`${apiClient.coreUrl}/pages/${encodeId(id)}/history`, {
      requireAuth: true,
    });
    return Array.isArray(response) ? response : [];
  },

  restoreVersion: async (id: string, historyId: string): Promise<Page> => {
    return apiClient.fetch(`${apiClient.coreUrl}/pages/${encodeId(id)}/restore/${encodeId(historyId)}`, {
      method: 'POST',
      requireAuth: true,
    });
  },
};
