// Frontend service for Template API calls
import { apiClient } from './core/api-client';
import { Section } from '@/components/builder/PageBuilder';

export interface TemplateContent {
  sections: Section[];
  backgroundColor?: string;
  isDarkMode?: boolean;
}

export interface Template {
  id: string;
  name: string;
  category: string;
  description?: string;
  thumbnail?: string;
  preview?: string;
  content: TemplateContent;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TemplateFilter {
  category?: string;
  isDefault?: boolean;
  search?: string;
}

export const templateService = {
  async getTemplates(filter?: TemplateFilter): Promise<Template[]> {
    const params = new URLSearchParams();
    if (filter?.category) params.append('category', filter.category);
    if (filter?.isDefault !== undefined) params.append('isDefault', filter.isDefault.toString());
    if (filter?.search) params.append('search', filter.search);

    return apiClient.fetch(`${apiClient.coreUrl}/templates?${params.toString()}`);
  },

  async getTemplateById(id: string): Promise<Template> {
    // Properly encode the ID to handle special characters like + in base64 IDs
    return apiClient.fetch(`${apiClient.coreUrl}/templates/${encodeURIComponent(id)}`);
  },

  async applyTemplate(pageId: string, templateId: string): Promise<unknown> {
    // Properly encode IDs to handle special characters like + in base64 IDs
    return apiClient.fetch(`${apiClient.coreUrl}/templates/apply/${encodeURIComponent(templateId)}/to-page/${encodeURIComponent(pageId)}`, {
      method: 'POST',
      requireAuth: true,
    });
  },
};
