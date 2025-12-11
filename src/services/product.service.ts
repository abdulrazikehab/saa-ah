import { apiClient } from './core/api-client';
import type { 
  Product, 
  CreateProductData, 
  Category, 
  CreateCategoryData, 
  ProductVariant, 
  CreateVariantData,
  ProductQueryParams 
} from './types';

export const productService = {
  // Products
  getProducts: async (params?: ProductQueryParams): Promise<Product[]> => {
    const url = `${apiClient.coreUrl}/products?${new URLSearchParams(params as Record<string, string>)}`;
    const response = await apiClient.fetch(url, {
      requireAuth: true,
    });
    // Backend returns { data: [...], meta: {...} } or just [...]
    // After central unwrapping, response is already the data object
    return (response as { data: Product[] })?.data || (response as Product[]) || [];
  },

  getProduct: async (id: string): Promise<Product> => {
    return apiClient.fetch(`${apiClient.coreUrl}/products/${id}`, {
      requireAuth: true,
    });
  },

  createProduct: async (data: CreateProductData, upsert?: boolean): Promise<Product> => {
    const url = `${apiClient.coreUrl}/products${upsert ? '?upsert=true' : ''}`;
    return apiClient.fetch(url, {
      method: 'POST',
      body: JSON.stringify(data),
      requireAuth: true,
    });
  },

  updateProduct: async (id: string, data: Partial<CreateProductData>): Promise<Product> => {
    return apiClient.fetch(`${apiClient.coreUrl}/products/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
      requireAuth: true,
    });
  },

  deleteProduct: async (id: string): Promise<void> => {
    await apiClient.fetch(`${apiClient.coreUrl}/products/${id}`, {
      method: 'DELETE',
      requireAuth: true,
    });
  },

  // Categories
  getCategories: async (): Promise<Category[]> => {
    const response = await apiClient.fetch(`${apiClient.coreUrl}/categories`, {
      requireAuth: true,
    });
    // Backend returns { categories: [...] }
    // After central unwrapping, response is { categories: [...] }
    return (response as { categories: Category[] })?.categories || (response as Category[]) || [];
  },

  getCategory: async (id: string): Promise<Category> => {
    return apiClient.fetch(`${apiClient.coreUrl}/categories/${id}`);
  },

  createCategory: async (data: CreateCategoryData): Promise<Category> => {
    return apiClient.fetch(`${apiClient.coreUrl}/categories`, {
      method: 'POST',
      body: JSON.stringify(data),
      requireAuth: true,
    });
  },

  updateCategory: async (id: string, data: Partial<CreateCategoryData>): Promise<Category> => {
    return apiClient.fetch(`${apiClient.coreUrl}/categories/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
      requireAuth: true,
    });
  },

  deleteCategory: async (id: string): Promise<void> => {
    await apiClient.fetch(`${apiClient.coreUrl}/categories/${id}`, {
      method: 'DELETE',
      requireAuth: true,
    });
  },

  // Variants
  getVariants: async (productId: string): Promise<ProductVariant[]> => {
    return apiClient.fetch(`${apiClient.coreUrl}/products/${productId}/variants`);
  },

  createVariant: async (productId: string, data: CreateVariantData): Promise<ProductVariant> => {
    return apiClient.fetch(`${apiClient.coreUrl}/products/${productId}/variants`, {
      method: 'POST',
      body: JSON.stringify(data),
      requireAuth: true,
    });
  },

  updateVariantInventory: async (variantId: string, quantity: number): Promise<void> => {
    await apiClient.fetch(`${apiClient.coreUrl}/products/variants/${variantId}/inventory`, {
      method: 'PATCH',
      body: JSON.stringify({ quantity }),
      requireAuth: true,
    });
  },

  // Collections
  updateCollection: async (id: string, data: Record<string, unknown>): Promise<void> => {
    await apiClient.fetch(`${apiClient.coreUrl}/collections/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      requireAuth: true,
    });
  },

  deleteCollection: async (id: string): Promise<void> => {
    await apiClient.fetch(`${apiClient.coreUrl}/collections/${id}`, {
      method: 'DELETE',
      requireAuth: true,
    });
  },
};
