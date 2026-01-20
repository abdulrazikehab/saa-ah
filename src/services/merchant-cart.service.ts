import { apiClient } from './core/api-client';

export interface MerchantCartItem {
  id: string;
  productId: string;
  productName: string;
  productNameAr?: string;
  productImage?: string;
  qty: number;
  effectiveUnitPrice: number;
  lineTotal: number;
  minQty: number;
  maxQty: number;
  availableStock: number;
  metadata?: Record<string, unknown>;
}

export interface MerchantCart {
  cartId: string;
  currency: string;
  items: MerchantCartItem[];
  totals: {
    subtotal: number;
    discountTotal: number;
    feesTotal: number;
    taxTotal: number;
    total: number;
  };
}

export const merchantCartService = {
  getCart: (): Promise<MerchantCart> =>
    apiClient.fetch(`${apiClient.coreUrl}/merchant/cart`, {
      requireAuth: true,
    }),

  addItem: (productId: string, qty: number, metadata?: Record<string, unknown>): Promise<MerchantCart> =>
    apiClient.fetch(`${apiClient.coreUrl}/merchant/cart/items`, {
      method: 'POST',
      body: JSON.stringify({ productId, qty, metadata }),
      requireAuth: true,
    }),

  updateItem: (itemId: string, qty: number): Promise<MerchantCart> =>
    apiClient.fetch(`${apiClient.coreUrl}/merchant/cart/items/${itemId}`, {
      method: 'PATCH',
      body: JSON.stringify({ qty }),
      requireAuth: true,
    }),

  removeItem: (itemId: string): Promise<MerchantCart> =>
    apiClient.fetch(`${apiClient.coreUrl}/merchant/cart/items/${itemId}`, {
      method: 'DELETE',
      requireAuth: true,
    }),

  clearCart: (): Promise<{ ok: boolean }> =>
    apiClient.fetch(`${apiClient.coreUrl}/merchant/cart`, {
      method: 'DELETE',
      requireAuth: true,
    }),
};
