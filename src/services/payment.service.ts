import { apiClient } from './core/api-client';

export interface PaymentInitialization {
  orderId: string;
  method?: string;
  amount?: number; // Frontend seems to send this, though backend might not strictly need it if it looks up the order
}

export interface PaymentResponse {
  redirectUrl?: string;
  transactionId?: string;
  status: string;
}

export interface AvailablePaymentMethod {
  id: string;
  provider: string;
  name: string;
  isActive: boolean;
}

export const paymentService = {
  initializePayment: (data: PaymentInitialization): Promise<PaymentResponse> =>
    apiClient.fetch(`${apiClient.coreUrl}/payment/initialize`, {
      method: 'POST',
      body: JSON.stringify({
        orderId: data.orderId,
        paymentMethod: data.method,
      }),
      requireAuth: true,
    }),

  getPaymentStatus: (orderId: string): Promise<unknown> =>
    apiClient.fetch(`${apiClient.coreUrl}/payment/status/${orderId}`, {
      requireAuth: true,
    }),

  getPaymentMethods: (): Promise<AvailablePaymentMethod[]> =>
    apiClient.fetch(`${apiClient.coreUrl}/payment/methods`, {
      requireAuth: false, // Public endpoint for checkout
    }),

  getPaymentSettings: (): Promise<unknown> =>
    apiClient.fetch(`${apiClient.coreUrl}/payment/settings`, {
      requireAuth: true,
    }),

  updatePaymentSettings: (data: Record<string, unknown>): Promise<unknown> =>
    apiClient.fetch(`${apiClient.coreUrl}/payment/settings`, {
      method: 'PUT',
      body: JSON.stringify(data),
      requireAuth: true,
    }),
};

