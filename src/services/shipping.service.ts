import { apiClient } from './core/api-client';
import type { ShippingZone, CreateShippingZoneData } from './types';

export const shippingService = {
  getShippingZones: (): Promise<ShippingZone[]> =>
    apiClient.fetch(`${apiClient.coreUrl}/shipping/zones`, {
      requireAuth: true,
    }),

  createShippingZone: (data: CreateShippingZoneData): Promise<ShippingZone> =>
    apiClient.fetch(`${apiClient.coreUrl}/shipping/zones`, {
      method: 'POST',
      body: JSON.stringify(data),
      requireAuth: true,
    }),

  updateShippingZone: (id: string, data: Partial<CreateShippingZoneData>): Promise<ShippingZone> =>
    apiClient.fetch(`${apiClient.coreUrl}/shipping/zones/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      requireAuth: true,
    }),

  deleteShippingZone: (id: string): Promise<void> =>
    apiClient.fetch(`${apiClient.coreUrl}/shipping/zones/${id}`, {
      method: 'DELETE',
      requireAuth: true,
    }),

  calculateShipping: (data: any): Promise<any> =>
    apiClient.fetch(`${apiClient.coreUrl}/shipping/calculate`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};
