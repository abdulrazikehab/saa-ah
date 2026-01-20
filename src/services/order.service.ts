import { apiClient } from './core/api-client';
import type { Order, CreateOrderData } from './types';

export const orderService = {
  createOrder: (data: CreateOrderData): Promise<Order> =>
    apiClient.fetch(`${apiClient.coreUrl}/orders`, {
      method: 'POST',
      body: JSON.stringify(data),
      requireAuth: true,
    }),

  getOrders: async (params?: { page?: number; limit?: number; status?: string }): Promise<Order[] | { data: Order[]; meta: { total: number; page: number; limit: number; totalPages: number } }> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.set('page', params.page.toString());
    if (params?.limit) queryParams.set('limit', params.limit.toString());
    if (params?.status) queryParams.set('status', params.status);
    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
    
    const response = await apiClient.fetch(`${apiClient.coreUrl}/orders${queryString}`, {
      requireAuth: true,
    });
    
    // Handle paginated response
    if (response && typeof response === 'object' && 'data' in response && 'meta' in response) {
      return response as { data: Order[]; meta: { total: number; page: number; limit: number; totalPages: number } };
    }
    
    // Legacy array response
    return (response as Order[]) || [];
  },

  getOrder: (id: string): Promise<Order> =>
    apiClient.fetch(`${apiClient.coreUrl}/orders/${id}`, {
      requireAuth: true,
    }),

  updateOrderStatus: (id: string, status: string): Promise<Order> =>
    apiClient.fetch(`${apiClient.coreUrl}/orders/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
      requireAuth: true,
    }),

  rejectOrder: (id: string, reason?: string): Promise<Order> =>
    apiClient.fetch(`${apiClient.coreUrl}/orders/${id}/reject`, {
      method: 'PUT',
      body: JSON.stringify({ reason }),
      requireAuth: true,
    }),

  getCardOrder: (id: string): Promise<Order & { items: unknown[] }> =>
    apiClient.fetch(`${apiClient.coreUrl}/card-orders/${id}`, {
      requireAuth: true,
    }),

  getMyCardOrders: (params?: { page?: number; limit?: number; status?: string }): Promise<{ data: unknown[]; meta: unknown }> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.set('page', params.page.toString());
    if (params?.limit) queryParams.set('limit', params.limit.toString());
    if (params?.status) queryParams.set('status', params.status);
    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
    return apiClient.fetch(`${apiClient.coreUrl}/card-orders/my-orders${queryString}`, {
      requireAuth: true,
    });
  },

  downloadCardOrderFiles: (id: string): Promise<{ excel: string; text: string; fileName: string }> =>
    apiClient.fetch(`${apiClient.coreUrl}/card-orders/${id}/download-files`, {
      requireAuth: true,
    }),
};
