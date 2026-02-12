import { apiClient } from './core/api-client';

export interface UploadResponse {
  url: string;
  secureUrl?: string;
  publicId: string;
  format: string;
  width: number;
  height: number;
}

export const uploadService = {
  async uploadImage(file: File): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('files', file);

    const response = await apiClient.fetch(`${apiClient.coreUrl}/upload/images`, {
      method: 'POST',
      body: formData,
      requireAuth: true,
    }) as { message: string; files: UploadResponse[] };
    
    const data = (response as { data?: unknown }).data || response;
    const typedData = data as { files?: UploadResponse[] };
    const files = typedData.files || (Array.isArray(data) ? data : []);
    
    if (!files || files.length === 0) {
      throw new Error('Invalid upload response: No files returned');
    }

    return files[0];
  },

  async uploadImages(files: File[]): Promise<UploadResponse[]> {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });

    const response = await apiClient.fetch(`${apiClient.coreUrl}/upload/images`, {
      method: 'POST',
      body: formData,
      requireAuth: true,
    }) as { message: string; files: UploadResponse[] };
    
    const data = (response as { data?: unknown }).data || response;
    const typedData = data as { files?: UploadResponse[] };
    return typedData.files || (Array.isArray(data) ? data : []);
  },
};
