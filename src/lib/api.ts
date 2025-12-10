export * from '../services/core/api-client';
export * from '../services/auth.service';
export * from '../services/product.service';
export * from '../services/cart.service';
export * from '../services/order.service';
export * from '../services/theme.service';
export * from '../services/plugin.service';
export * from '../services/coupon.service';
export * from '../services/page.service';
export * from '../services/analytics.service';
export * from '../services/shipping.service';
export * from '../services/tax.service';
export * from '../services/tenant.service';
export * from '../services/domain.service';
export * from '../services/payment.service';
export * from '../services/staff.service';
export * from '../services/transaction.service';
export * from '../services/report.service';
export * from '../services/public.service';

// Re-export legacy API object for backward compatibility
import { apiClient } from '../services/core/api-client';
import { authService } from '../services/auth.service';
import { productService } from '../services/product.service';
import { cartService } from '../services/cart.service';
import { orderService } from '../services/order.service';
import { themeService } from '../services/theme.service';
import { pluginService } from '../services/plugin.service';
import { couponService } from '../services/coupon.service';
import { pageService } from '../services/page.service';
import { analyticsService } from '../services/analytics.service';
import { shippingService } from '../services/shipping.service';
import { taxService } from '../services/tax.service';
import { tenantService } from '../services/tenant.service';
import { domainService } from '../services/domain.service';
import { paymentService } from '../services/payment.service';
import { staffService } from '../services/staff.service';
import { transactionService } from '../services/transaction.service';
import { reportService } from '../services/report.service';

export const api = {
  ...authService,
  ...productService,
  ...cartService,
  ...orderService,
  ...themeService,
  ...pluginService,
  ...couponService,
  ...pageService,
  ...analyticsService,
  ...shippingService,
  ...taxService,
  ...tenantService,
  ...paymentService,
  ...staffService,
  ...transactionService,
  ...reportService,
};

// Export aliases for backward compatibility
export const authApi = authService;
export const coreApi = {
  ...productService,
  ...cartService,
  ...orderService,
  ...themeService,
  ...pluginService,
  ...couponService,
  ...pageService,
  ...analyticsService,
  ...shippingService,
  ...taxService,
  ...tenantService,
  ...domainService,
  ...paymentService,
  ...staffService,
  ...transactionService,
  ...reportService,
  // Generic methods for custom endpoints
  get: async (url: string, config?: any) => {
    return await apiClient.get(url, config);
  },
  post: async (url: string, data?: any, config?: any) => {
    return await apiClient.post(url, data, config);
  },
  put: async (url: string, data?: any, config?: any) => {
    return await apiClient.put(url, data, config);
  },
  delete: async (url: string, config?: any) => {
    return await apiClient.delete(url, config);
  },
  patch: async (url: string, data?: any, config?: any) => {
    return await apiClient.patch(url, data, config);
  },
};
