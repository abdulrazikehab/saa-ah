import { apiClient } from './core/api-client';

export interface SetupMarketData {
  name: string;
  description?: string;
  subdomain: string;
  customDomain?: string;
  template?: string;
}

export interface PlanLimits {
  products: number;
  storage: number;
  users: number;
  bandwidth: number;
}

export interface TenantData {
  id: string;
  name: string;
  subdomain: string;
  customDomain?: string;
  isActive: boolean;
  createdAt: string;
  plan?: string;
  subscriptionPlan?: {
    code: string;
    name: string;
    features: string[];
    featuresAr?: string[];
    limits?: PlanLimits;
  };
}

export const tenantService = {
  async setupMarket(data: SetupMarketData): Promise<TenantData> {
    return apiClient.fetch(`${apiClient.coreUrl}/tenants/setup`, {
      method: 'POST',
      body: JSON.stringify(data),
      requireAuth: true,
    });
  },

  async getTenant(id: string): Promise<TenantData> {
    return apiClient.fetch(`${apiClient.coreUrl}/tenants/${id}`, {
      requireAuth: true,
    });
  },

  async getCurrentUserTenant(): Promise<TenantData | null> {
    try {
      return await apiClient.fetch(`${apiClient.coreUrl}/tenants/me`, {
        requireAuth: true,
      });
    } catch (error) {
      return null;
    }
  },

  async updateCurrentUserTenant(data: { name?: string; subdomain?: string }): Promise<TenantData> {
    return apiClient.fetch(`${apiClient.coreUrl}/tenants/update-me`, {
      method: 'POST',
      body: JSON.stringify(data),
      requireAuth: true,
    });
  },

  async updateTenant(id: string, data: Partial<SetupMarketData>): Promise<TenantData> {
    return apiClient.fetch(`${apiClient.coreUrl}/tenants/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
      requireAuth: true,
    });
  },
};
