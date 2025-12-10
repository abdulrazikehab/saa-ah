import { apiClient } from './core/api-client';

export interface ChatMessage {
  message: string;
  context?: {
    currentPage?: string;
    currentSection?: string;
    userAction?: string;
  };
}

export interface ChatResponse {
  response: string;
}

export interface SuggestionsResponse {
  suggestions: string[];
}

export const aiService = {
  async chat(chatMessage: ChatMessage): Promise<ChatResponse> {
    return apiClient.fetch(`${apiClient.coreUrl}/ai/chat`, {
      method: 'POST',
      body: JSON.stringify(chatMessage),
      requireAuth: true,
    });
  },

  async getSuggestions(sectionType: string): Promise<SuggestionsResponse> {
    return apiClient.fetch(`${apiClient.coreUrl}/ai/suggestions?sectionType=${encodeURIComponent(sectionType)}`, {
      method: 'POST',
      requireAuth: true,
    });
  },
};
