import { apiClient } from './core/api-client';
import type { TaxRate, CreateTaxRateData, TaxCalculationParams } from './types';

export const taxService = {
  calculateTax: (params: TaxCalculationParams): Promise<{ amount: number; rate: number }> =>
    apiClient.fetch(`${apiClient.coreUrl}/tax/calculate?${new URLSearchParams(params as unknown as Record<string, string>)}`, {
      requireAuth: false,
    }),

  getTaxRates: (): Promise<TaxRate[]> =>
    apiClient.fetch(`${apiClient.coreUrl}/tax/rates`, {
      requireAuth: true,
    }),

  createTaxRate: (data: CreateTaxRateData): Promise<TaxRate> =>
    apiClient.fetch(`${apiClient.coreUrl}/tax/rates`, {
      method: 'POST',
      body: JSON.stringify(data),
      requireAuth: true,
    }),

  updateTaxRate: (id: string, data: Partial<CreateTaxRateData>): Promise<TaxRate> =>
    apiClient.fetch(`${apiClient.coreUrl}/tax/rates/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      requireAuth: true,
    }),

  deleteTaxRate: (id: string): Promise<void> =>
    apiClient.fetch(`${apiClient.coreUrl}/tax/rates/${id}`, {
      method: 'DELETE',
      requireAuth: true,
    }),
};
