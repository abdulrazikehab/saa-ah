import { apiClient } from './core/api-client';

export interface CloudinaryImage {
  public_id: string;
  secure_url: string;
  url: string;
  format: string;
  width: number;
  height: number;
  bytes: number;
  created_at: string;
  resource_type: string;
  folder?: string;
}

export interface GetImagesResponse {
  success: boolean;
  folder?: string;
  folders?: string[];
  count: number;
  image_count: number;
  total_image_count: number;
  data: CloudinaryImage[];
  next_cursor?: string;
  next_cursors?: Record<string, string>;
}

export interface ListFoldersResponse {
  success: boolean;
  root?: string;
  folders: string[];
}

export interface GetImagesParams {
  folder?: string;
  folders?: string[];
  resource_type?: string;
  limit?: number;
  next_cursor?: string;
  next_cursors?: Record<string, string>;
  sort?: 'asc' | 'desc';
  fields?: string[];
}

export const mediaService = {
  /**
   * Get images from Cloudinary folders
   */
  async getImages(params: GetImagesParams): Promise<GetImagesResponse> {
    const queryParams = new URLSearchParams();

    if (params.folder !== undefined) {
      queryParams.append('folder', params.folder);
    } else if (params.folders && params.folders.length > 0) {
      queryParams.append('folders', params.folders.join(','));
    }

    if (params.resource_type) {
      queryParams.append('resource_type', params.resource_type);
    }

    if (params.limit) {
      queryParams.append('limit', params.limit.toString());
    }

    if (params.next_cursor) {
      queryParams.append('next_cursor', params.next_cursor);
    }

    if (params.next_cursors) {
      queryParams.append('next_cursors', encodeURIComponent(JSON.stringify(params.next_cursors)));
    }

    if (params.sort) {
      queryParams.append('sort', params.sort);
    }

    if (params.fields && params.fields.length > 0) {
      queryParams.append('fields', params.fields.join(','));
    }

    const url = `${apiClient.coreUrl}/media/images?${queryParams.toString()}`;
    return apiClient.fetch<GetImagesResponse>(url, {
      requireAuth: true,
    });
  },

  /**
   * List available folders/subfolders
   */
  async listFolders(root?: string): Promise<ListFoldersResponse> {
    const queryParams = new URLSearchParams();
    if (root) {
      queryParams.append('root', root);
    }

    const url = `${apiClient.coreUrl}/media/folders${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return apiClient.fetch<ListFoldersResponse>(url, {
      requireAuth: true,
    });
  },

  /**
   * Get images from a single folder (convenience method)
   */
  async getImagesFromFolder(
    folder: string,
    options?: {
      limit?: number;
      nextCursor?: string;
      sort?: 'asc' | 'desc';
    }
  ): Promise<GetImagesResponse> {
    return this.getImages({
      folder,
      next_cursor: options?.nextCursor,
      limit: options?.limit,
      sort: options?.sort,
    });
  },

  /**
   * Get images from multiple folders (convenience method)
   */
  async getImagesFromFolders(
    folders: string[],
    options?: {
      limit?: number;
      nextCursors?: Record<string, string>;
      sort?: 'asc' | 'desc';
    }
  ): Promise<GetImagesResponse> {
    return this.getImages({
      folders,
      next_cursors: options?.nextCursors,
      limit: options?.limit,
      sort: options?.sort,
    });
  },
};

export default mediaService;

