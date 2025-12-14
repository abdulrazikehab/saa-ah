import { apiClient } from './core/api-client';

export interface Partner {
  id: string;
  name: string;
  nameAr: string;
  logo: string;
  description: string;
  descriptionAr: string;
  website?: string;
}

export interface Plan {
  id: string;
  code: string;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  price: string;
  currency: string;
  billingCycle: string;
  features: string[];
  featuresAr: string[];
  limits: {
    products?: number;
    orders?: number;
    storage?: number;
    staff?: number;
    customDomains?: number;
  };
  isPopular: boolean;
  sortOrder: number;
}

export interface PaymentProvider {
  id: string;
  name: string;
  nameAr: string;
  logo: string;
  description?: string;
  descriptionAr?: string;
}

export interface PlatformStats {
  stores: string;
  orders: string;
  products: string;
  uptime: string;
  support: string;
}

export interface Testimonial {
  id: string;
  name: string;
  nameEn: string;
  role: string;
  roleEn: string;
  content: string;
  contentEn: string;
  rating: number;
}

/**
 * Public API Service
 * Fetches public data for the landing page (no authentication required)
 */
export const publicService = {
  /**
   * Get active partners for landing page
   */
  async getPartners(): Promise<Partner[]> {
    try {
      const response = await apiClient.get('/public/partners');
      return response?.partners || [];
    } catch (error) {
      // Error logged to backend
      return [];
    }
  },

  /**
   * Get active subscription plans
   */
  async getPlans(billingCycle?: string): Promise<Plan[]> {
    try {
      const url = billingCycle 
        ? `/public/plans?billingCycle=${billingCycle}` 
        : '/public/plans';
      const response = await apiClient.get(url);
      return response?.plans || [];
    } catch (error) {
      // Error logged to backend
      return [];
    }
  },

  /**
   * Get supported payment providers
   */
  async getPaymentProviders(): Promise<PaymentProvider[]> {
    try {
      const response = await apiClient.get('/public/payment-providers');
      return response?.providers || [];
    } catch (error) {
      // Error logged to backend
      return [];
    }
  },

  /**
   * Get platform statistics
   */
  async getStats(): Promise<PlatformStats | null> {
    try {
      const response = await apiClient.get('/public/stats');
      return response?.stats || null;
    } catch (error) {
      // Error logged to backend
      return null;
    }
  },

  /**
   * Get testimonials
   */
  async getTestimonials(limit: number = 6): Promise<Testimonial[]> {
    try {
      const response = await apiClient.get(`/public/testimonials?limit=${limit}`);
      return response?.testimonials || [];
    } catch (error) {
      // Error logged to backend
      return [];
    }
  },
};

export default publicService;
