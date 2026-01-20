import { apiClient } from './core/api-client';
import type { Coupon, CreateCouponData } from './types';

export const couponService = {
  getCoupons: (): Promise<Coupon[]> =>
    apiClient.fetch(`${apiClient.coreUrl}/coupons`, {
      requireAuth: true,
    }),

  getCoupon: (id: string): Promise<Coupon> =>
    apiClient.fetch(`${apiClient.coreUrl}/coupons/${id}`, {
      requireAuth: true,
    }),

  createCoupon: (data: CreateCouponData): Promise<Coupon> =>
    apiClient.fetch(`${apiClient.coreUrl}/coupons`, {
      method: 'POST',
      body: JSON.stringify(data),
      requireAuth: true,
    }),

  updateCoupon: (id: string, data: Partial<CreateCouponData>): Promise<Coupon> =>
    apiClient.fetch(`${apiClient.coreUrl}/coupons/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
      requireAuth: true,
    }),

  deleteCoupon: (id: string): Promise<void> =>
    apiClient.fetch(`${apiClient.coreUrl}/coupons/${id}`, {
      method: 'DELETE',
      requireAuth: true,
    }),

  validateCoupon: (code: string, amount: number): Promise<{ valid: boolean; discount: number }> =>
    apiClient.fetch(`${apiClient.coreUrl}/coupons/validate`, {
      method: 'POST',
      body: JSON.stringify({ code, amount }),
      requireAuth: false,
    }),
};
