import { apiClient } from './core/api-client';
import type { RegisterData, LoginData, UserProfile, KycData } from './types';

import { getDeviceFingerprint } from '@/lib/fingerprint';

export const authService = {


  login: async (data: LoginData): Promise<{ id: string; email: string; role: string; tenantId: string; avatar?: string | null; accessToken: string; refreshToken: string }> => {
    const fingerprint = await getDeviceFingerprint();
    // authUrl already includes /auth from nginx proxy, so just use /login
    const url = apiClient.authUrl.endsWith('/auth') 
      ? `${apiClient.authUrl}/login` 
      : `${apiClient.authUrl}/auth/login`;
    return apiClient.fetch(url, {
      method: 'POST',
      body: JSON.stringify({ ...data, fingerprint }),
    });
  },

  signup: async (data: RegisterData): Promise<{ id: string; email: string; recoveryId?: string; emailVerified?: boolean; verificationCodeSent?: boolean }> => {
    const fingerprint = await getDeviceFingerprint();
    // authUrl already includes /auth from nginx proxy, so just use /signup
    const url = apiClient.authUrl.endsWith('/auth') 
      ? `${apiClient.authUrl}/signup` 
      : `${apiClient.authUrl}/auth/signup`;
    return apiClient.fetch(url, {
      method: 'POST',
      credentials: 'include', // Include cookies
      body: JSON.stringify({ ...data, fingerprint }),
    });
  },

  verifyEmail: async (email: string, code: string): Promise<{ valid: boolean; message: string; tokens?: { accessToken: string; refreshToken: string } }> => {
    const url = apiClient.authUrl.endsWith('/auth') 
      ? `${apiClient.authUrl}/verify-email` 
      : `${apiClient.authUrl}/auth/verify-email`;
    return apiClient.fetch(url, {
      method: 'POST',
      credentials: 'include',
      body: JSON.stringify({ email, code }),
    });
  },

  resendVerificationCode: async (email: string): Promise<{ message: string; previewUrl?: string; code?: string }> => {
    const url = apiClient.authUrl.endsWith('/auth') 
      ? `${apiClient.authUrl}/resend-verification` 
      : `${apiClient.authUrl}/auth/resend-verification`;
    return apiClient.fetch(url, {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  // Login with recovery ID (for users who forgot their email)
  loginWithRecoveryId: async (recoveryId: string, password: string): Promise<{ id: string; email: string; role: string; tenantId: string; avatar?: string | null; accessToken: string; refreshToken: string }> => {
    const url = apiClient.authUrl.endsWith('/auth') 
      ? `${apiClient.authUrl}/login-recovery` 
      : `${apiClient.authUrl}/auth/login-recovery`;
    return apiClient.fetch(url, {
      method: 'POST',
      body: JSON.stringify({ recoveryId, password }),
    });
  },

  // Get masked email using recovery ID
  recoverEmail: async (recoveryId: string): Promise<{ success: boolean; maskedEmail: string; message: string }> => {
    const url = apiClient.authUrl.endsWith('/auth') 
      ? `${apiClient.authUrl}/recover-email` 
      : `${apiClient.authUrl}/auth/recover-email`;
    return apiClient.fetch(url, {
      method: 'POST',
      body: JSON.stringify({ recoveryId }),
    });
  },

  // Request password reset email
  forgotPassword: async (email: string): Promise<{ success: boolean; message: string }> => {
    const url = apiClient.authUrl.endsWith('/auth') 
      ? `${apiClient.authUrl}/forgot-password` 
      : `${apiClient.authUrl}/auth/forgot-password`;
    return apiClient.fetch(url, {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  // Verify password reset token
  verifyResetToken: async (token: string): Promise<{ valid: boolean; message: string; email?: string }> => {
    const url = apiClient.authUrl.endsWith('/auth') 
      ? `${apiClient.authUrl}/verify-reset-token?token=${encodeURIComponent(token)}` 
      : `${apiClient.authUrl}/auth/verify-reset-token?token=${encodeURIComponent(token)}`;
    return apiClient.fetch(url, {
      method: 'GET',
    });
  },

  // Verify password reset OTP code (legacy support)
  verifyResetCode: async (email: string, code: string): Promise<{ valid: boolean; message: string }> => {
    const url = apiClient.authUrl.endsWith('/auth') 
      ? `${apiClient.authUrl}/verify-reset-code` 
      : `${apiClient.authUrl}/auth/verify-reset-code`;
    return apiClient.fetch(url, {
      method: 'POST',
      body: JSON.stringify({ email, code }),
    });
  },

  // Request password reset email using recovery ID
  sendResetByRecoveryId: async (recoveryId: string): Promise<{ success: boolean; message: string }> => {
    const url = apiClient.authUrl.endsWith('/auth') 
      ? `${apiClient.authUrl}/send-reset-by-recovery` 
      : `${apiClient.authUrl}/auth/send-reset-by-recovery`;
    return apiClient.fetch(url, {
      method: 'POST',
      body: JSON.stringify({ recoveryId }),
    });
  },

  refreshToken: (): Promise<{ accessToken: string; refreshToken: string }> => {
    const url = apiClient.authUrl.endsWith('/auth') 
      ? `${apiClient.authUrl}/refresh` 
      : `${apiClient.authUrl}/auth/refresh`;
    return apiClient.fetch(url, {
      method: 'POST',
      credentials: 'include', // Include cookies
      body: JSON.stringify({}), // Token will come from cookie
    });
  },

  logout: (): Promise<{ message: string }> => {
    const url = apiClient.authUrl.endsWith('/auth') 
      ? `${apiClient.authUrl}/logout` 
      : `${apiClient.authUrl}/auth/logout`;
    return apiClient.fetch(url, {
      method: 'POST',
      requireAuth: true,
      credentials: 'include',
    });
  },

  me: (): Promise<{ user: UserProfile }> => {
    const url = apiClient.authUrl.endsWith('/auth') 
      ? `${apiClient.authUrl}/me` 
      : `${apiClient.authUrl}/auth/me`;
    return apiClient.fetch(url, {
      requireAuth: true,
    });
  },

  googleLogin: () => {
    const url = apiClient.authUrl.endsWith('/auth') 
      ? `${apiClient.authUrl}/oauth/google` 
      : `${apiClient.authUrl}/auth/oauth/google`;
    window.location.href = url;
  },

  getProfile: (): Promise<UserProfile> => {
    const url = apiClient.authUrl.endsWith('/auth') 
      ? `${apiClient.authUrl}/profile` 
      : `${apiClient.authUrl}/auth/profile`;
    return apiClient.fetch(url, {
      requireAuth: true,
    });
  },

  updateProfile: (data: Partial<UserProfile>): Promise<UserProfile> => {
    const url = apiClient.authUrl.endsWith('/auth') 
      ? `${apiClient.authUrl}/profile` 
      : `${apiClient.authUrl}/auth/profile`;
    return apiClient.fetch(url, {
      method: 'PUT',
      body: JSON.stringify(data),
      requireAuth: true,
    });
  },

  // KYC
  submitKyc: (data: KycData): Promise<{ verificationId: string; status: string }> => {
    const url = apiClient.authUrl.endsWith('/auth') 
      ? `${apiClient.authUrl}/kyc/submit` 
      : `${apiClient.authUrl}/auth/kyc/submit`;
    return apiClient.fetch(url, {
      method: 'POST',
      body: JSON.stringify(data),
      requireAuth: true,
    });
  },

  updateKycStatus: (verificationId: string, status: string, notes: string): Promise<void> => {
    const url = apiClient.authUrl.endsWith('/auth') 
      ? `${apiClient.authUrl}/kyc/${verificationId}/status` 
      : `${apiClient.authUrl}/auth/kyc/${verificationId}/status`;
    return apiClient.fetch(url, {
      method: 'PUT',
      body: JSON.stringify({ status, notes }),
      requireAuth: true,
    });
  },

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
  }>> => {
    const url = apiClient.authUrl.endsWith('/auth') 
      ? `${apiClient.authUrl}/markets` 
      : `${apiClient.authUrl}/auth/markets`;
    return apiClient.fetch(url, {
      requireAuth: true,
    });
  },

  switchStore: (tenantId: string): Promise<{ 
    success: boolean; 
    tenantId: string; 
    accessToken?: string;
    refreshToken?: string;
    tenantName?: string;
    tenantSubdomain?: string;
  }> => {
    const url = apiClient.authUrl.endsWith('/auth') 
      ? `${apiClient.authUrl}/markets/switch` 
      : `${apiClient.authUrl}/auth/markets/switch`;
    return apiClient.fetch(url, {
      method: 'POST',
      body: JSON.stringify({ tenantId }),
      requireAuth: true,
    });
  },

  canCreateMarket: (): Promise<{ allowed: boolean; currentCount: number; limit: number }> => {
    const url = apiClient.authUrl.endsWith('/auth') 
      ? `${apiClient.authUrl}/markets/can-create` 
      : `${apiClient.authUrl}/auth/markets/can-create`;
    return apiClient.fetch(url, {
      requireAuth: true,
    });
  },

  getMarketLimit: (): Promise<{ limit: number; currentCount: number }> => {
    const url = apiClient.authUrl.endsWith('/auth') 
      ? `${apiClient.authUrl}/markets/limit` 
      : `${apiClient.authUrl}/auth/markets/limit`;
    return apiClient.fetch(url, {
      requireAuth: true,
    });
  },

  // Reset password (supports both token-based and code-based)
  resetPasswordComplete: (data: { email?: string; code?: string; token?: string; newPassword: string }): Promise<{ success: boolean; message: string }> => {
    const url = apiClient.authUrl.endsWith('/auth') 
      ? `${apiClient.authUrl}/reset-password` 
      : `${apiClient.authUrl}/auth/reset-password`;
    return apiClient.fetch(url, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Generic methods for custom endpoints
  get: async (url: string, options?: { requireAuth?: boolean; adminApiKey?: string }) => {
    return apiClient.fetch(`${apiClient.authUrl}${url}`, { 
      requireAuth: options?.requireAuth ?? true,
      adminApiKey: options?.adminApiKey,
    });
  },

  put: async (url: string, data?: any, options?: { requireAuth?: boolean; adminApiKey?: string }) => {
    return apiClient.fetch(`${apiClient.authUrl}${url}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      requireAuth: options?.requireAuth ?? true,
      adminApiKey: options?.adminApiKey,
    });
  },
};

