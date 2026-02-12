import { coreApi } from './api';
import { Product } from '../services/types';

export interface EmergencyInventoryItem {
  id: string;
  tenantId: string;
  productId: string;
  reason: string;
  notes?: string;
  createdAt: string;
  product: Product;
}

export interface InventorySetupItem {
  id: string;
  name: string;
  globalActive: boolean;
  inventoryActive: boolean;
  hasOverride: boolean;
  // For products
  sku?: string;
  // For categories/brands
  isActive?: boolean;
}

export const inventoryApi = {
  getEmergencyInventory: async (page = 1, limit = 20, search?: string) => {
    const query = new URLSearchParams({ 
      page: page.toString(), 
      limit: limit.toString(),
      ...(search ? { search } : {}) 
    });
    return coreApi.get(`/admin/inventory/emergency?${query.toString()}`, { requireAuth: true });
  },

  upsertEmergencyItems: async (items: { productId: string; reason: string; notes?: string }[]) => {
    return coreApi.post(`/admin/inventory/emergency/bulk`, { items }, { requireAuth: true });
  },

  removeEmergencyItem: async (productId: string) => {
    return coreApi.delete(`/admin/inventory/emergency/${productId}`, { requireAuth: true });
  },

  autoAddCostGtPrice: async () => {
    return coreApi.post(`/admin/inventory/emergency/auto-add-cost-gt-price`, {}, { requireAuth: true });
  },

  autoAddNeeded: async () => {
    return coreApi.post(`/admin/inventory/emergency/auto-add-needed`, {}, { requireAuth: true });
  },

  getSetup: async (inventoryType: 'DEFAULT' | 'EMERGENCY', entityType: 'CATEGORY' | 'BRAND' | 'PRODUCT', page = 1, limit = 50, search?: string) => {
    const query = new URLSearchParams({
      inventoryType,
      entityType,
      page: page.toString(),
      limit: limit.toString(),
      ...(search ? { search } : {})
    });
    return coreApi.get(`/admin/inventory/setup?${query.toString()}`, { 
        requireAuth: true 
    });
  },

  updateVisibility: async (inventoryType: 'DEFAULT' | 'EMERGENCY', changes: { entityType: 'CATEGORY' | 'BRAND' | 'PRODUCT', entityId: string, isActive: boolean }[]) => {
    return coreApi.put(`/admin/inventory/visibility`, { inventoryType, changes }, { requireAuth: true });
  },

  // Card Inventory Emergency Methods
  getCardEmergencyInventory: async (page = 1, limit = 50, search?: string) => {
    const query = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(search ? { search } : {})
    });
    return coreApi.get(`/card-inventory/emergency?${query.toString()}`, { requireAuth: true });
  },

  moveCardsToEmergency: async (cardIds: string[]) => {
    return coreApi.post(`/card-inventory/emergency/move`, { cardIds }, { requireAuth: true });
  },

  recoverCardsFromEmergency: async (cardIds: string[]) => {
    return coreApi.post(`/card-inventory/emergency/recover`, { cardIds }, { requireAuth: true });
  },

  getAllCardInventory: async (page = 1, limit = 50, search?: string, status?: string, categoryId?: string, brandId?: string) => {
    const query = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(search ? { search } : {}),
      ...(status ? { status } : {}),
      ...(categoryId ? { categoryId } : {}),
      ...(brandId ? { brandId } : {})
    });
    return coreApi.get(`/card-inventory/all-cards?${query.toString()}`, { requireAuth: true });
  }
};
