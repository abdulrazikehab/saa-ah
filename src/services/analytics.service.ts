import { apiClient } from './core/api-client';
import type { DashboardStats, SalesReport, ProductStats, SalesReportParams } from './types';

export const analyticsService = {
  getDashboardStats: (): Promise<DashboardStats> =>
    apiClient.fetch(`${apiClient.coreUrl}/analytics/dashboard`, {
      requireAuth: true,
    }),

  getSalesReport: (params?: SalesReportParams): Promise<SalesReport[]> =>
    apiClient.fetch(`${apiClient.coreUrl}/analytics/sales?${new URLSearchParams(params as Record<string, string>)}`, {
      requireAuth: true,
    }),

  getProductStats: (): Promise<ProductStats[]> =>
    apiClient.fetch(`${apiClient.coreUrl}/analytics/products`, {
      requireAuth: true,
    }),

  getCustomerStats: (): Promise<Record<string, unknown>> =>
    apiClient.fetch(`${apiClient.coreUrl}/analytics/customers`, {
      requireAuth: true,
    }),

  getOrderStats: (): Promise<Record<string, unknown>> =>
    apiClient.fetch(`${apiClient.coreUrl}/analytics/orders`, {
      requireAuth: true,
    }),

  getTrafficStats: (): Promise<Record<string, unknown>> =>
    apiClient.fetch(`${apiClient.coreUrl}/analytics/traffic`, {
      requireAuth: true,
    }),

  getRevenueStats: (): Promise<Record<string, unknown>> =>
    apiClient.fetch(`${apiClient.coreUrl}/analytics/revenue`, {
      requireAuth: true,
    }),
};
