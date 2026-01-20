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
  currency?: string; // Currency code for the payment
}

export interface ProductReportResponse {
  data: ProductReportItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const reportService = {
  getOverview: () => apiClient.get('/reports/overview', { requireAuth: true }),
  getProductReport: (params?: { page?: number; limit?: number; search?: string }): Promise<ProductReportResponse | ProductReportItem[]> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    const queryString = queryParams.toString();
    return apiClient.get(`/reports/products${queryString ? `?${queryString}` : ''}`, { requireAuth: true });
  },
  getCustomerReport: (): Promise<CustomerReportItem[]> => apiClient.get('/reports/customers', { requireAuth: true }),
  getPaymentReport: (): Promise<PaymentReportItem[]> => apiClient.get('/reports/payments', { requireAuth: true }),
};
