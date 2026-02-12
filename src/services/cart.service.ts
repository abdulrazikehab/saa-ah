import { apiClient } from './core/api-client';
import type { Cart, AddToCartData } from './types';

export const cartService = {
  getCart: (sessionId?: string): Promise<Cart> => {
    console.log('🛒 [SERVICE-CART-DEBUG] getCart called with sessionId:', sessionId);
    return apiClient.fetch(`${apiClient.coreUrl}/cart`, {
      sessionId,
      requireAuth: false, // Public endpoint
    });
  },

  addToCart: (data: AddToCartData, sessionId?: string): Promise<Cart> =>
    apiClient.fetch(`${apiClient.coreUrl}/cart/items`, {
      method: 'POST',
      body: JSON.stringify(data),
      sessionId,
      requireAuth: false, // Public endpoint - auth is optional
    }),

  updateCartItem: (itemId: string, quantity: number, sessionId?: string): Promise<Cart> =>
    apiClient.fetch(`${apiClient.coreUrl}/cart/items/${encodeURIComponent(itemId)}`, {
      method: 'PUT',
      body: JSON.stringify({ quantity }),
      sessionId,
      requireAuth: false, // Public endpoint
    }),

  removeFromCart: (itemId: string, sessionId?: string): Promise<Cart> =>
    apiClient.fetch(`${apiClient.coreUrl}/cart/items/${encodeURIComponent(itemId)}`, {
      method: 'DELETE',
      sessionId,
      requireAuth: false, // Public endpoint
    }),

  clearCart: (sessionId?: string): Promise<void> =>
    apiClient.fetch(`${apiClient.coreUrl}/cart`, {
      method: 'DELETE',
      sessionId,
      requireAuth: false, // Public endpoint
    }),
};
