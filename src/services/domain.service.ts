import { apiClient } from './core/api-client';

export interface CustomDomain {
  id: string;
  domain: string;
  status: 'PENDING' | 'ACTIVE' | 'VERIFICATION_FAILED' | 'SUSPENDED';
  sslStatus: 'PENDING' | 'ACTIVE' | 'FAILED' | 'EXPIRED';
  verified: boolean;
  verifiedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TenantWithDomain {
  id: string;
  subdomain: string;
  customDomain?: string;
  verified?: boolean;
  verifiedAt?: string;
}

export const domainService = {
  getDomain: async (): Promise<TenantWithDomain> => {
    try {
      const [tenant, domains] = await Promise.all([
        apiClient.fetch(`${apiClient.coreUrl}/tenants/me`, { requireAuth: true }),
        apiClient.fetch(`${apiClient.coreUrl}/domains`, { requireAuth: true }),
      ]);

      const customDomain = domains && domains.length > 0 ? domains[0] : null;

      return {
        id: tenant.id,
        subdomain: tenant.subdomain,
        customDomain: customDomain?.domain,
        verified: customDomain?.status === 'ACTIVE',
        verifiedAt: customDomain?.verifiedAt,
      };
    } catch (error) {
      console.error('Failed to fetch domain info:', error);
      throw error;
    }
  },

  addCustomDomain: (domain: string): Promise<CustomDomain> =>
    apiClient.fetch(`${apiClient.coreUrl}/domains`, {
      method: 'POST',
      body: JSON.stringify({ domain }),
      requireAuth: true,
    }),

  verifyDomain: (domainId: string): Promise<CustomDomain> =>
    apiClient.fetch(`${apiClient.coreUrl}/domains/${domainId}/verify`, {
      method: 'POST',
      requireAuth: true,
    }),

  deleteDomain: (domainId: string): Promise<void> =>
    apiClient.fetch(`${apiClient.coreUrl}/domains/${domainId}`, {
      method: 'DELETE',
      requireAuth: true,
    }),
};
