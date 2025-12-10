import { apiClient } from './core/api-client';
import type { Cart, AddToCartData } from './types';

export const cartService = {
  getCart: (sessionId?: string): Promise<Cart> =>
    apiClient.fetch(`${apiClient.coreUrl}/cart`, {
      sessionId,
      requireAuth: true,
    }),

  addToCart: (data: AddToCartData, sessionId?: string): Promise<Cart> =>
    apiClient.fetch(`${apiClient.coreUrl}/cart/items`, {
      method: 'POST',
      body: JSON.stringify(data),
      sessionId,
      requireAuth: true,
    }),

  updateCartItem: (itemId: string, quantity: number, sessionId?: string): Promise<Cart> =>
    apiClient.fetch(`${apiClient.coreUrl}/cart/items/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify({ quantity }),
      sessionId,
      requireAuth: true,
    }),

  removeFromCart: (itemId: string, sessionId?: string): Promise<Cart> =>
    apiClient.fetch(`${apiClient.coreUrl}/cart/items/${itemId}`, {
      method: 'DELETE',
      sessionId,
      requireAuth: true,
    }),

  clearCart: (sessionId?: string): Promise<void> =>
    apiClient.fetch(`${apiClient.coreUrl}/cart`, {
      method: 'DELETE',
      sessionId,
      requireAuth: true,
    }),
};
