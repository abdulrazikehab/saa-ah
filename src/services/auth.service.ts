import { apiClient } from './core/api-client';
import type { RegisterData, LoginData, UserProfile, KycData } from './types';

import { getDeviceFingerprint } from '@/lib/fingerprint';

export const authService = {


  login: async (data: LoginData): Promise<{ id: string; email: string; role: string; tenantId: string; avatar?: string | null; accessToken: string; refreshToken: string }> => {
    const fingerprint = await getDeviceFingerprint();
    console.log('🔐 Generated Device Fingerprint:', fingerprint);
    return apiClient.fetch(`${apiClient.authUrl}/auth/login`, {
      method: 'POST',
      body: JSON.stringify({ ...data, fingerprint }),
    });
  },

  signup: async (data: RegisterData): Promise<{ id: string; email: string; recoveryId?: string; accessToken: string; refreshToken: string }> => {
    const fingerprint = await getDeviceFingerprint();
    return apiClient.fetch(`${apiClient.authUrl}/auth/signup`, {
      method: 'POST',
      body: JSON.stringify({ ...data, fingerprint }),
    });
  },

  // Login with recovery ID (for users who forgot their email)
  loginWithRecoveryId: async (recoveryId: string, password: string): Promise<{ id: string; email: string; role: string; tenantId: string; avatar?: string | null; accessToken: string; refreshToken: string }> => {
    return apiClient.fetch(`${apiClient.authUrl}/auth/login-recovery`, {
      method: 'POST',
      body: JSON.stringify({ recoveryId, password }),
    });
  },

  // Get masked email using recovery ID
  recoverEmail: async (recoveryId: string): Promise<{ success: boolean; maskedEmail: string; message: string }> => {
    return apiClient.fetch(`${apiClient.authUrl}/auth/recover-email`, {
      method: 'POST',
      body: JSON.stringify({ recoveryId }),
    });
  },

  // Request password reset email
  forgotPassword: async (email: string): Promise<{ success: boolean; message: string }> => {
    return apiClient.fetch(`${apiClient.authUrl}/auth/forgot-password`, {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  // Request password reset email using recovery ID
  sendResetByRecoveryId: async (recoveryId: string): Promise<{ success: boolean; message: string }> => {
    return apiClient.fetch(`${apiClient.authUrl}/auth/send-reset-by-recovery`, {
      method: 'POST',
      body: JSON.stringify({ recoveryId }),
    });
  },

  refreshToken: (refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> =>
    apiClient.fetch(`${apiClient.authUrl}/auth/refresh`, {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    }),

  me: (): Promise<{ user: UserProfile }> =>
    apiClient.fetch(`${apiClient.authUrl}/auth/me`, {
      requireAuth: true,
    }),

  googleLogin: () => {
    window.location.href = `${apiClient.authUrl}/auth/oauth/google`;
  },

  getProfile: (): Promise<UserProfile> =>
    apiClient.fetch(`${apiClient.authUrl}/auth/profile`, {
      requireAuth: true,
    }),

  updateProfile: (data: Partial<UserProfile>): Promise<UserProfile> =>
    apiClient.fetch(`${apiClient.authUrl}/auth/profile`, {
      method: 'PUT',
      body: JSON.stringify(data),
      requireAuth: true,
    }),

  // KYC
  submitKyc: (data: KycData): Promise<{ verificationId: string; status: string }> =>
    apiClient.fetch(`${apiClient.authUrl}/auth/kyc/submit`, {
      method: 'POST',
      body: JSON.stringify(data),
      requireAuth: true,
    }),

  updateKycStatus: (verificationId: string, status: string, notes: string): Promise<void> =>
    apiClient.fetch(`${apiClient.authUrl}/auth/kyc/${verificationId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, notes }),
      requireAuth: true,
    }),
};

