import { apiClient } from './core/api-client';
import type { Order, CreateOrderData } from './types';

export const orderService = {
  createOrder: (data: CreateOrderData): Promise<Order> =>
    apiClient.fetch(`${apiClient.coreUrl}/orders`, {
      method: 'POST',
      body: JSON.stringify(data),
      requireAuth: true,
    }),

  getOrders: (): Promise<Order[]> =>
    apiClient.fetch(`${apiClient.coreUrl}/orders`, {
      requireAuth: true,
    }),

  getOrder: (id: string): Promise<Order> =>
    apiClient.fetch(`${apiClient.coreUrl}/orders/${id}`, {
      requireAuth: true,
    }),

  updateOrderStatus: (id: string, status: string): Promise<Order> =>
    apiClient.fetch(`${apiClient.coreUrl}/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
      requireAuth: true,
    }),
};
