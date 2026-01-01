import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { coreApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { HierarchicalExplorer } from '@/components/dashboard/HierarchicalExplorer';

interface Brand {
  id: string;
  name: string;
  nameAr?: string;
  code?: string;
}

interface Category {
  id: string;
  name: string;
  nameAr?: string;
  parentId?: string;
}

interface Product {
  id: string;
  name: string;
  nameAr?: string;
  brandId?: string;
  categories?: Array<{ 
    categoryId?: string; 
    category?: { id: string; name: string; nameAr?: string }; 
    id?: string;
  }>;
  description?: string;
  descriptionAr?: string;
  price?: number;
  cost?: number;
  sku?: string;
  barcode?: string;
  stock?: number;
  status?: 'ACTIVE' | 'DRAFT' | 'ARCHIVED';
  images?: string[];
  featured?: boolean;
  path?: string;
}

export default function HierarchicalManager({ isFullScreen = false }: { isFullScreen?: boolean }) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      // Use authenticated API calls since this is a dashboard page
      const [brandsData, categoriesData, productsData] = await Promise.all([
        coreApi.getBrands(true).catch(() => []), // Require auth for dashboard
        coreApi.getCategories(undefined, true).catch(() => []), // Require auth for dashboard
        coreApi.getProducts({ limit: '10000' } as any, true).catch(() => []), // Require auth for dashboard
      ]);

      setBrands(Array.isArray(brandsData) ? brandsData : []);
      
      const categoriesList = Array.isArray(categoriesData) 
        ? categoriesData 
        : ((categoriesData as any).categories || []);
      setCategories(categoriesList.map((c: any) => ({
        id: c.id,
        name: c.name,
        nameAr: c.nameAr || c.name,
        parentId: typeof c.parentId === 'object' ? c.parentId?.id : c.parentId,
      })));

      const productsList = Array.isArray(productsData) 
        ? productsData 
        : ((productsData as any).data || (productsData as any).products || []);
      
      const processedProducts = productsList.map((p: any) => {
        // Normalize categories - handle both formats
        let normalizedCategories: any[] = [];
        if (p.categories && Array.isArray(p.categories)) {
          const categoryMap = new Map<string, any>();
          p.categories.forEach((cat: any) => {
            const categoryId = typeof cat === 'string' 
              ? cat 
              : (cat.categoryId || cat.id || cat.category?.id);
            
            if (categoryId && !categoryMap.has(categoryId)) {
              if (typeof cat === 'string') {
                categoryMap.set(categoryId, { categoryId: cat });
              } else {
                categoryMap.set(categoryId, {
                  categoryId: cat.categoryId || cat.id || cat.category?.id,
                  category: cat.category,
                  id: cat.id,
                });
              }
            }
          });
          normalizedCategories = Array.from(categoryMap.values());
        }
        
        return {
          id: p.id,
          name: p.name,
          nameAr: p.nameAr || p.name,
          brandId: p.brandId || p.brand?.id,
          categories: normalizedCategories,
          description: p.description,
          descriptionAr: p.descriptionAr,
          price: typeof p.price === 'string' ? parseFloat(p.price) : p.price,
          cost: p.costPerItem || p.cost || p.variants?.[0]?.cost,
          sku: p.sku,
          barcode: p.barcode,
          stock: p.variants?.[0]?.inventoryQuantity || 0,
          status: p.isAvailable ? 'ACTIVE' : 'DRAFT',
          images: p.images?.map((img: any) => typeof img === 'string' ? img : img.url) || [],
          featured: p.featured,
          path: p.slug || p.path,
        };
      });

      // Deduplicate products by ID (most important)
      const uniqueById = Array.from(new Map(processedProducts.map((p: any) => [p.id, p])).values());
      
      // Additional deduplication by normalized name to catch any edge cases
      const uniqueProducts = Array.from(new Map(uniqueById.map((p: any) => {
        const name = (p.nameAr || p.name || '').toString().trim().toLowerCase();
        return [name, p];
      })).values());
      
      setProducts(uniqueProducts as Product[]);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast({
        title: t('common.error'),
        description: t('dashboard.products.hierarchical.loadError'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast, t]);

  useEffect(() => {
    loadData();
    
    // Listen for product updates from other pages
    const handleProductsUpdate = () => {
      loadData();
    };
    
    // Also reload when page becomes visible (user returns from another tab/page)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadData();
      }
    };
    
    window.addEventListener('productsUpdated', handleProductsUpdate);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      window.removeEventListener('productsUpdated', handleProductsUpdate);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [loadData]);

  return (
    <div className={isFullScreen ? "flex flex-col h-full" : "space-y-6"}>
      <div className={isFullScreen ? "flex-none mb-2 px-2" : ""}>
        <h1 className={isFullScreen ? "text-xl font-bold text-gray-900 dark:text-white" : "text-3xl font-bold text-gray-900 dark:text-white"}>
          {t('dashboard.products.hierarchical.title')}
        </h1>
        <p className={isFullScreen ? "text-xs text-gray-500 mt-0.5" : "text-sm text-gray-500 mt-1"}>
          {t('dashboard.products.hierarchical.description')}
        </p>
      </div>

      <div className={isFullScreen ? "flex-1 min-h-0" : "mt-6"}>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
            </div>
          ) : (
            <HierarchicalExplorer
              brands={brands}
              categories={categories}
              products={products}
              selectedCategoryIds={selectedCategoryIds}
              isFullScreen={isFullScreen}
              onCategorySelect={(categoryId) => {
                if (!selectedCategoryIds.includes(categoryId)) {
                  setSelectedCategoryIds([...selectedCategoryIds, categoryId]);
                }
              }}
              loadProductsByCategory={async (categoryId: string) => {
                try {
                  console.log('🔍 Loading products for category:', categoryId);
                  
                  // First, try to get all products (without category filter) to see what we have
                  const allProductsData = await coreApi.getProducts({ 
                    limit: '1000'
                  } as any);
                  
                  const allProductsList = Array.isArray(allProductsData) 
                    ? allProductsData 
                    : ((allProductsData as any)?.data || (allProductsData as any)?.products || []);
                  
                  // Process all products and filter by category
                  const processedProducts = allProductsList.map((p: any) => {
                    // Normalize categories - handle both formats
                    let normalizedCategories: any[] = [];
                    if (p.categories && Array.isArray(p.categories)) {
                      normalizedCategories = p.categories.map((cat: any) => {
                        if (typeof cat === 'string') {
                          return { categoryId: cat };
                        }
                        return {
                          categoryId: cat.categoryId || cat.id || cat.category?.id,
                          category: cat.category,
                          id: cat.id,
                        };
                      });
                    }
                    
                    return {
                      id: p.id,
                      name: p.name,
                      nameAr: p.nameAr || p.name,
                      brandId: p.brandId || p.brand?.id,
                      categories: normalizedCategories,
                      // Include slug as path for HierarchicalExplorer
                      path: p.slug || p.path,
                      // Include availability and published status
                      isAvailable: (p.isAvailable !== false && p.isAvailable !== undefined) ? true : false,
                      isPublished: (p.isPublished !== false && p.isPublished !== undefined) ? true : false,
                    };
                  });
                  
                  // Filter products that belong to this category
                  const categoryProducts = processedProducts.filter((p: any) => {
                    return p.categories?.some((cat: any) => {
                      const catId = cat.categoryId || cat.id || cat.category?.id;
                      return catId === categoryId;
                    });
                  });
                  
                  return categoryProducts;
                } catch (error) {
                  console.error('❌ Failed to load products by category:', error);
                  return [];
                }
              }}
              onCreateCategory={async (categoryData) => {
                try {
                  const newCategory = await coreApi.createCategory({
                    name: categoryData.name,
                    nameAr: categoryData.nameAr,
                    description: categoryData.description,
                    parentId: categoryData.parentId,
                    image: categoryData.image,
                  } as any);
                  
                  // Return normalized category object
                  const createdCategory = {
                    id: (newCategory as any).category?.id || (newCategory as any).id,
                    name: (newCategory as any).category?.name || (newCategory as any).name,
                    nameAr: (newCategory as any).category?.nameAr || (newCategory as any).nameAr || (newCategory as any).category?.name || (newCategory as any).name,
                    parentId: typeof (newCategory as any).category?.parentId === 'object' ? (newCategory as any).category?.parentId?.id : ((newCategory as any).category?.parentId || (newCategory as any).parentId),
                  };
                  
                  // Add to local state immediately for instant UI update
                  setCategories(prev => [...prev, createdCategory]);
                  
                  // Reload all data in background to ensure consistency
                  loadData().catch(error => {
                    console.error('Failed to reload data after creating category:', error);
                  });
                  
                  return createdCategory;
                } catch (error) {
                  console.error('Failed to create category:', error);
                  throw error;
                }
              }}
              onCreateBrand={async (brandData) => {
                try {
                  // Use dedicated createBrand API so auth headers & tenant context are handled correctly
                  const newBrand = await coreApi.createBrand(brandData as any);
                  await loadData();
                  return {
                    id: newBrand.id,
                    name: newBrand.name,
                    nameAr: brandData.nameAr,
                    code: brandData.code,
                  };
                } catch (error) {
                  console.error('Failed to create brand:', error);
                  throw error;
                }
              }}
              onCreateProduct={async (productData) => {
                try {
                  // Pass all data from HierarchicalExplorer's prepareProductData
                  const newProduct = await coreApi.createProduct({
                    ...productData,
                    isAvailable: true,
                    isPublished: true,
                    // Ensure variants are created if not present
                    variants: (productData as any).variants || [{
                      name: 'Default',
                      price: productData.price || 0,
                      inventoryQuantity: (productData as any).stockCount || 0,
                    }],
                  } as any);
                  
                  await loadData();
                  return {
                    id: newProduct.id,
                    name: newProduct.name,
                    nameAr: newProduct.nameAr,
                  };
                } catch (error) {
                  console.error('Failed to create product:', error);
                  throw error;
                }
              }}
              onCategoriesUpdate={loadData}
              onBrandsUpdate={loadData}
              onProductsUpdate={loadData}
            />
          )}
      </div>
    </div>
  );
}
