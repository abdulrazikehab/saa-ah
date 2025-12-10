import { apiClient } from './core/api-client';

export interface ProductReportItem {
  id: string;
  name: string;
  sku: string | null;
  stock: number;
  salesCount: number;
  revenue: number;
}

export interface CustomerReportItem {
  email: string;
  name: string;
  orders: number;
  totalSpent: number;
}

export interface PaymentReportItem {
  provider: string;
  transactions: number;
  volume: number;
  fees: number;
  net: number;
}

export const reportService = {
  getOverview: () => apiClient.get('/reports/overview', { requireAuth: true }),
  getProductReport: (): Promise<ProductReportItem[]> => apiClient.get('/reports/products', { requireAuth: true }),
  getCustomerReport: (): Promise<CustomerReportItem[]> => apiClient.get('/reports/customers', { requireAuth: true }),
  getPaymentReport: (): Promise<PaymentReportItem[]> => apiClient.get('/reports/payments', { requireAuth: true }),
};
