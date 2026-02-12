import { coreApi } from '@/lib/api';

export interface CloudinaryAccessResponse {
  hasAccess: boolean;
  grantedAt?: string;
  grantedBy?: string;
  user?: {
    id: string;
    email: string;
    name?: string;
  };
}

export const cloudinaryAccessService = {
  async checkUserAccess(_userId: string): Promise<boolean> {
    try {
      const response = await coreApi.get<CloudinaryAccessResponse>(
        `/media/access`,
        { requireAuth: true, hideErrorToast: true }
      );
      return response.hasAccess || false;
    } catch (error: any) {
      // Silently fail - don't cause signout if this check fails
      // This is a non-critical feature check
      console.error('Failed to check Cloudinary access:', error);
      // Don't throw - just return false
      return false;
    }
  },
};

