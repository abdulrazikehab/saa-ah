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
  getProducts: async (params?: ProductQueryParams, requireAuth = false): Promise<Product[] | { data: Product[]; meta: { total: number; page: number; limit: number; totalPages: number } }> => {
    const url = `${apiClient.coreUrl}/products?${new URLSearchParams(params as Record<string, string>)}`;
    const response = await apiClient.fetch(url, {
      requireAuth,
    });
    // Backend returns { data: [...], meta: {...} } for paginated or just [...] for non-paginated
    // After central unwrapping, response is already the data object
    if (response && typeof response === 'object' && 'data' in response && 'meta' in response) {
      // Paginated response
      return response as { data: Product[]; meta: { total: number; page: number; limit: number; totalPages: number } };
    }
    // Non-paginated response (backward compatibility)
    return (response as { data: Product[] })?.data || (response as Product[]) || [];
  },

  getProduct: async (id: string): Promise<Product> => {
    return apiClient.fetch(`${apiClient.coreUrl}/products/${id}`, {
      requireAuth: false, // Public access for storefront
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
    // Properly encode product ID to handle special characters like /, +, etc.
    const encodedId = encodeURIComponent(id);
    return apiClient.fetch(`${apiClient.coreUrl}/products/${encodedId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
      requireAuth: true,
    });
  },

  deleteProduct: async (id: string): Promise<void> => {
    // Properly encode product ID to handle special characters like /, +, etc.
    // Same approach as updateProduct for consistency
    const encodedId = encodeURIComponent(id);
    await apiClient.delete(`/products/${encodedId}`, {
      requireAuth: true,
    });
  },

  deleteProducts: async (
    ids: string[]
  ): Promise<{ deleted: number; failed: number; errors: string[] }> => {
    // Bulk delete products and return summary from backend
    return apiClient.fetch(`${apiClient.coreUrl}/products/bulk-delete`, {
      method: 'POST',
      body: JSON.stringify({ ids }),
      requireAuth: true,
    }) as Promise<{ deleted: number; failed: number; errors: string[] }>;
  },

  // Categories
  getCategories: async (params?: { page?: number; limit?: number; all?: boolean }): Promise<Category[] | { categories: Category[]; meta: any }> => {
    const queryString = params ? `?${new URLSearchParams(params as any)}` : '';
    const response = await apiClient.fetch(`${apiClient.coreUrl}/categories${queryString}`, {
      requireAuth: false, 
    });
    
    if (response && typeof response === 'object' && 'categories' in response && 'meta' in response) {
       return response as { categories: Category[]; meta: any };
    }

    return (response as { categories: Category[] })?.categories || (response as Category[]) || [];
  },

  getCategory: async (id: string): Promise<Category> => {
    return apiClient.fetch(`${apiClient.coreUrl}/categories/${id}`, {
      requireAuth: false, // Public access for storefront
    });
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

  deleteCategories: async (
    ids: string[]
  ): Promise<{ deleted: number; failed: number; errors?: string[]; message?: string }> => {
    // Bulk delete categories and return summary from backend
    return apiClient.fetch(`${apiClient.coreUrl}/categories/bulk-delete`, {
      method: 'POST',
      body: JSON.stringify({ ids }),
      requireAuth: true,
    }) as Promise<{ deleted: number; failed: number; errors?: string[]; message?: string }>;
  },

  // Variants
  getVariants: async (productId: string): Promise<ProductVariant[]> => {
    return apiClient.fetch(`${apiClient.coreUrl}/products/${productId}/variants`, {
      requireAuth: false, // Public access for storefront
    });
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

  // Brands
  getBrands: async (requireAuth = false): Promise<any[]> => {
    const response = await apiClient.fetch(`${apiClient.coreUrl}/brands`, {
      requireAuth,
    });
    // Handle paginated response { data: [...], meta: ... }
    if (response && typeof response === 'object' && 'data' in response) {
      return (response as { data: any[] }).data;
    }
    return Array.isArray(response) ? response : [];
  },

  getBrand: async (id: string): Promise<any> => {
    return apiClient.fetch(`${apiClient.coreUrl}/brands/${id}`, {
      requireAuth: false,
    });
  },

  createBrand: async (data: Record<string, unknown>): Promise<any> => {
    return apiClient.fetch(`${apiClient.coreUrl}/brands`, {
      method: 'POST',
      body: JSON.stringify(data),
      requireAuth: true,
    });
  },

  updateBrand: async (id: string, data: Record<string, unknown>): Promise<any> => {
    return apiClient.fetch(`${apiClient.coreUrl}/brands/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      requireAuth: true,
    });
  },

  deleteBrand: async (id: string): Promise<void> => {
    await apiClient.fetch(`${apiClient.coreUrl}/brands/${id}`, {
      method: 'DELETE',
      requireAuth: true,
    });
  },
};
