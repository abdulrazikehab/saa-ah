import { apiClient } from './core/api-client';
import type { RegisterData, LoginData, UserProfile, KycData } from './types';

import { getDeviceFingerprint } from '@/lib/fingerprint';

export const authService = {


  login: async (data: LoginData): Promise<{
    id: string;
    email: string;
    role: string;
    tenantId: string;
    avatar?: string | null;
    tenantName?: string;
    tenantSubdomain?: string;
    accessToken: string;
    refreshToken: string;
  }> => {
    const fingerprint = await getDeviceFingerprint();
    return apiClient.fetch(`${apiClient.authUrl}/login`, {
      method: 'POST',
      body: JSON.stringify({ ...data, fingerprint }),
    });
  },

  signup: async (data: RegisterData): Promise<{
    email: string;
    emailVerified?: boolean;
    verificationCodeSent?: boolean;
    verificationCode?: string;
    emailPreviewUrl?: string;
    isTestEmail?: boolean;
    emailWarning?: string;
    emailError?: string;
    recoveryId?: string;
  }> => {
    const fingerprint = await getDeviceFingerprint();
    return apiClient.fetch(`${apiClient.authUrl}/signup`, {
      method: 'POST',
      credentials: 'include', // Include cookies
      body: JSON.stringify({ ...data, fingerprint }),
    });
  },

  verifyEmail: async (email: string, code: string): Promise<{ valid: boolean; message: string; tokens?: { accessToken: string; refreshToken: string } }> => {
    return apiClient.fetch(`${apiClient.authUrl}/verify-email`, {
      method: 'POST',
      credentials: 'include',
      body: JSON.stringify({ email, code }),
    });
  },

  resendVerificationCode: async (email: string): Promise<{ message: string; previewUrl?: string; code?: string }> => {
    return apiClient.fetch(`${apiClient.authUrl}/resend-verification`, {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  // Login with recovery ID (for users who forgot their email)
  loginWithRecoveryId: async (recoveryId: string, password: string): Promise<{ id: string; email: string; role: string; tenantId: string; avatar?: string | null; accessToken: string; refreshToken: string }> => {
    return apiClient.fetch(`${apiClient.authUrl}/login-recovery`, {
      method: 'POST',
      body: JSON.stringify({ recoveryId, password }),
    });
  },

  // Get masked email using recovery ID
  recoverEmail: async (recoveryId: string): Promise<{ success: boolean; maskedEmail: string; message: string }> => {
    return apiClient.fetch(`${apiClient.authUrl}/recover-email`, {
      method: 'POST',
      body: JSON.stringify({ recoveryId }),
    });
  },

  // Request password reset email
  forgotPassword: async (email: string): Promise<{ success: boolean; message: string }> => {
    return apiClient.fetch(`${apiClient.authUrl}/forgot-password`, {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  // Verify password reset token
  verifyResetToken: async (token: string): Promise<{ valid: boolean; message: string; email?: string }> => {
    return apiClient.fetch(`${apiClient.authUrl}/verify-reset-token?token=${encodeURIComponent(token)}`, {
      method: 'GET',
    });
  },

  // Verify password reset OTP code (legacy support)
  verifyResetCode: async (email: string, code: string): Promise<{ valid: boolean; message: string }> => {
    return apiClient.fetch(`${apiClient.authUrl}/verify-reset-code`, {
      method: 'POST',
      body: JSON.stringify({ email, code }),
    });
  },

  // Request password reset email using recovery ID
  sendResetByRecoveryId: async (recoveryId: string): Promise<{ success: boolean; message: string }> => {
    return apiClient.fetch(`${apiClient.authUrl}/send-reset-by-recovery`, {
      method: 'POST',
      body: JSON.stringify({ recoveryId }),
    });
  },

  // Refresh tokens, using either HttpOnly cookies (if same-site)
  // or an explicit refreshToken passed from localStorage (cross-site SPA).
  refreshToken: (tokenOverride?: string): Promise<{ accessToken: string; refreshToken: string }> =>
    apiClient.fetch(`${apiClient.authUrl}/refresh`, {
      method: 'POST',
      credentials: 'include', // Include cookies where possible
      body: JSON.stringify(
        tokenOverride
          ? { refreshToken: tokenOverride }
          : {},
      ),
    }),

  logout: (): Promise<{ message: string }> =>
    apiClient.fetch(`${apiClient.authUrl}/logout`, {
      method: 'POST',
      requireAuth: true,
      credentials: 'include',
    }),

  me: (): Promise<{ user: UserProfile }> =>
    apiClient.fetch(`${apiClient.authUrl}/me`, {
      requireAuth: true,
    }),

  googleLogin: () => {
    window.location.href = `${apiClient.authUrl}/oauth/google`;
  },

  getProfile: (): Promise<UserProfile> =>
    apiClient.fetch(`${apiClient.authUrl}/profile`, {
      requireAuth: true,
    }),

  updateProfile: (data: Partial<UserProfile>): Promise<UserProfile> =>
    apiClient.fetch(`${apiClient.authUrl}/profile`, {
      method: 'PUT',
      body: JSON.stringify(data),
      requireAuth: true,
    }),

  // KYC
  submitKyc: (data: KycData): Promise<{ verificationId: string; status: string }> =>
    apiClient.fetch(`${apiClient.authUrl}/kyc/submit`, {
      method: 'POST',
      body: JSON.stringify(data),
      requireAuth: true,
    }),

  updateKycStatus: (verificationId: string, status: string, notes: string): Promise<void> =>
    apiClient.fetch(`${apiClient.authUrl}/kyc/${verificationId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, notes }),
      requireAuth: true,
    }),

  // Store/Market Management
  getUserMarkets: (): Promise<Array<{
    id: string;
    name: string;
    subdomain: string;
    plan: string;
    status: string;
    createdAt: string;
    isOwner: boolean;
    isActive: boolean;
  }>> =>
    apiClient.fetch(`${apiClient.authUrl}/markets`, {
      requireAuth: true,
    }),

  switchStore: (tenantId: string): Promise<{ 
    success: boolean; 
    tenantId: string; 
    accessToken?: string;
    refreshToken?: string;
    tenantName?: string;
    tenantSubdomain?: string;
  }> =>
    apiClient.fetch(`${apiClient.authUrl}/markets/switch`, {
      method: 'POST',
      body: JSON.stringify({ tenantId }),
      requireAuth: true,
    }),

  canCreateMarket: (): Promise<{ allowed: boolean; currentCount: number; limit: number }> =>
    apiClient.fetch(`${apiClient.authUrl}/markets/can-create`, {
      requireAuth: true,
    }),

  getMarketLimit: (): Promise<{ limit: number; currentCount: number }> =>
    apiClient.fetch(`${apiClient.authUrl}/markets/limit`, {
      requireAuth: true,
    }),

  deleteMarket: (tenantId: string): Promise<{ message: string }> =>
    apiClient.fetch(`${apiClient.coreUrl}/tenants/${tenantId}`, {
      method: 'DELETE',
      requireAuth: true,
    }),

  // Reset password (supports both token-based and code-based)
  resetPasswordComplete: (data: { email?: string; code?: string; token?: string; newPassword: string }): Promise<{ success: boolean; message: string }> =>
    apiClient.fetch(`${apiClient.authUrl}/reset-password`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Generic methods for custom endpoints
  get: async (url: string, options?: { requireAuth?: boolean; adminApiKey?: string }) => {
    return apiClient.fetch(`${apiClient.authUrl}${url}`, { 
      requireAuth: options?.requireAuth ?? true,
      adminApiKey: options?.adminApiKey,
    });
  },

  put: async (url: string, data?: Record<string, unknown>, options?: { requireAuth?: boolean; adminApiKey?: string }) => {
    return apiClient.fetch(`${apiClient.authUrl}${url}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      requireAuth: options?.requireAuth ?? true,
      adminApiKey: options?.adminApiKey,
    });
  },
};

