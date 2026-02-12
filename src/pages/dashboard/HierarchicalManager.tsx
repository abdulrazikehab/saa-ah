import { useState, useEffect, useCallback, useRef } from 'react';
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
  logo?: string;
  parentCategoryId?: string;
}

interface Category {
  id: string;
  name: string;
  nameAr?: string;
  parentId?: string;
  image?: string;
  description?: string;
  descriptionAr?: string;
  slug?: string;
  isActive?: boolean;
}

interface ProductCategory {
  categoryId?: string;
  category?: { id: string; name: string; nameAr?: string; _id?: string };
  id?: string;
  _id?: string;
}

interface Product {
  id: string;
  name: string;
  nameAr?: string;
  brandId?: string;
  categories?: ProductCategory[];
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
  isAvailable?: boolean;
  isPublished?: boolean;
}

export default function HierarchicalManager({ isFullScreen = false }: { isFullScreen?: boolean }) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);

  // Robust ID normalization helper
  const toStr = (id: any): string => (id ? String(id).trim() : "");

  // Optimized helper to fetch all pages with parallel fetching after getting total count
  const fetchAllPages = useCallback(async (endpoint: string, baseParams: string = ''): Promise<any[]> => {
      const limit = 100; // Increased limit to reduce number of API calls
      let allItems: any[] = [];
      
      try {
          // First, fetch page 1 to get total count
          const firstPageQuery = `${endpoint}?page=1&limit=${limit}${baseParams}`;
          let firstRes: any = null;
          let retries = 5;
          
          while (retries > 0) {
              try {
                  firstRes = await coreApi.get(firstPageQuery);
                  break;
              } catch (err: any) {
                  const is429 = err.status === 429 || err?.response?.status === 429 ||
                               (typeof err.message === 'string' && err.message.includes('429'));
                  
                  if (is429) {
                      retries--;
                      if (retries > 0) {
                          const delay = 3000 * Math.pow(2, 5 - retries);
                          console.warn(`[HierarchicalManager] Rate limited on ${endpoint}, retrying in ${delay}ms...`);
                          await new Promise(resolve => setTimeout(resolve, delay));
                      } else {
                          throw err;
                      }
                  } else {
                      throw err;
                  }
              }
          }
          
          if (!firstRes) throw new Error(`Failed to fetch ${endpoint} first page`);

          // Extract items and meta from first page
          let items: any[] = [];
          let totalPages = 1;
          
          if (Array.isArray(firstRes)) {
              items = firstRes;
          } else if (firstRes.data && Array.isArray(firstRes.data)) {
              items = firstRes.data;
              if (firstRes.meta?.totalPages) {
                  totalPages = firstRes.meta.totalPages;
              }
          } else if (firstRes.products) {
              items = firstRes.products;
              if (firstRes.meta?.totalPages) {
                  totalPages = firstRes.meta.totalPages;
              }
          } else if (firstRes.categories) {
              items = firstRes.categories;
              if (firstRes.meta?.totalPages) {
                  totalPages = firstRes.meta.totalPages;
              }
          } else if (firstRes.brands) {
              items = firstRes.brands;
              if (firstRes.meta?.totalPages) {
                  totalPages = firstRes.meta.totalPages;
              }
          } else {
              const val = Object.values(firstRes).find(v => Array.isArray(v));
              if (val) items = val as any[];
              if (firstRes.meta?.totalPages) {
                  totalPages = firstRes.meta.totalPages;
              }
          }
          
          allItems = [...items];
          
          // If there are more pages, fetch them in parallel (in batches to avoid overwhelming the server)
          if (totalPages > 1) {
              const remainingPages = Array.from({ length: totalPages - 1 }, (_, i) => i + 2);
              
              // Fetch in batches of 5 to avoid overwhelming the server
              const batchSize = 5;
              for (let i = 0; i < remainingPages.length; i += batchSize) {
                  const batch = remainingPages.slice(i, i + batchSize);
                  
                  const batchPromises = batch.map(async (page) => {
                      const query = `${endpoint}?page=${page}&limit=${limit}${baseParams}`;
                      try {
                          const res = await coreApi.get(query);
                          
                          let pageItems: any[] = [];
                          if (Array.isArray(res)) {
                              pageItems = res;
                          } else if (res.data && Array.isArray(res.data)) {
                              pageItems = res.data;
                          } else if (res.products) {
                              pageItems = res.products;
                          } else if (res.categories) {
                              pageItems = res.categories;
                          } else if (res.brands) {
                              pageItems = res.brands;
                          } else {
                              const val = Object.values(res).find(v => Array.isArray(v));
                              if (val) pageItems = val as any[];
                          }
                          
                          return pageItems;
                      } catch (error) {
                          console.error(`Error fetching page ${page} of ${endpoint}:`, error);
                          return [];
                      }
                  });
                  
                  const batchResults = await Promise.all(batchPromises);
                  batchResults.forEach(pageItems => {
                      allItems = [...allItems, ...pageItems];
                  });
              }
          }
          
          return allItems;
      } catch (error) {
          console.error(`Error fetching ${endpoint}:`, error);
          return [];
      }
  }, []);

  // POWER BRAND MATCHING LOGIC - Prioritize Strict ID matching from Excel
  const resolveBrandId = useCallback((p: any, brandsList: Brand[]): string | undefined => {
    // 1. Direct ID fields (Matches the 'BrandID' column in Excel)
    let bid = p.brandId || 
              (typeof p.brand === 'object' ? (p.brand?.id || p.brand?._id) : undefined) ||
              p.BrandId || p.brand_id || p.Brand?.id || p.Brand?._id;
    
    const sBid = toStr(bid);
    if (sBid) {
        // Verify this ID exists in our processed brands
        const matched = brandsList.find(b => b.id === sBid || toStr((b as any)._id) === sBid || b.code === sBid);
        if (matched) return matched.id;
    }

    // 2. Exact Name matching as a fallback
    const pName = toStr(p.nameAr || p.name).toLowerCase();
    const clean = (s: string) => s.toLowerCase().replace(/[^a-z0-9\u0600-\u06FF]/g, '');
    const cpName = clean(pName);

    for (const b of brandsList) {
        const cbName = clean(toStr(b.name));
        const cbNameAr = clean(toStr(b.nameAr));
        
        // Match only if the name is distinct and part of the product title
        if (cbName.length > 3 && cpName.includes(cbName)) return b.id;
        if (cbNameAr.length > 3 && cpName.includes(cbNameAr)) return b.id;
    }

    return undefined;
  }, []);

  const normalizeProduct = useCallback((p: any, brandsList: Brand[]): Product => {
    const normalizedCategories: ProductCategory[] = (p.categories || []).map((c: any) => {
      const catId = c.categoryId || c.category?.id || c.category?._id || c.id || c._id;
      return {
        categoryId: catId ? toStr(catId) : undefined,
        category: c.category || (typeof c === 'object' && !c.categoryId ? c : undefined)
      };
    });

    return {
      ...p,
      id: toStr(p.id || p._id),
      name: p.name,
      nameAr: p.nameAr || p.name,
      brandId: resolveBrandId(p, brandsList),
      categories: normalizedCategories,
      description: p.description,
      descriptionAr: p.descriptionAr,
      price: typeof p.price === 'string' ? parseFloat(p.price) : p.price,
      cost: p.costPerItem || p.cost || p.variants?.[0]?.cost,
      sku: p.sku,
      barcode: p.barcode,
      stock: p.variants?.[0]?.inventoryQuantity || 0,
      status: p.isAvailable ? 'ACTIVE' : 'DRAFT',
      images: Array.isArray(p.images) ? p.images.map((img: any) => typeof img === 'string' ? img : img.url) : [],
      featured: p.featured,
      path: p.slug || p.path,
      isAvailable: p.isAvailable !== false,
      isPublished: p.isPublished !== false,
    };
  }, [resolveBrandId]);

  const isLoadingRef = useRef(false);

  const loadData = useCallback(async (showLoading = true) => {
    if (isLoadingRef.current) return; // Prevent concurrent fetches
    isLoadingRef.current = true;

    try {
      if (showLoading) setLoading(true);
      
      // Fetch all three endpoints in parallel for much faster loading
      const [brandsData, categoriesData, productsData] = await Promise.all([
          fetchAllPages('/brands'),
          fetchAllPages('/categories'),
          fetchAllPages('/products', '&includeBrand=true&includeCategories=true')
      ]);

      // Process Brands - Ensure parentCategoryId is strictly mapped (from 'ParentCategoryID' in Excel)
      const brandsRaw = Array.isArray(brandsData) ? brandsData : [];
      const processedBrands: Brand[] = brandsRaw.map((b: any) => {
        // Normalize parentCategoryId - handle both object and string formats
        let parentCatId = b.parentCategoryId || b.ParentCategoryID || b.parent_category_id;
        if (parentCatId && typeof parentCatId === 'object' && parentCatId !== null) {
          parentCatId = parentCatId.id || parentCatId._id || parentCatId;
        }
        
        return {
          ...b,
          id: toStr(b.id || b._id),
          name: b.name,
          nameAr: b.nameAr || b.name,
          code: b.code,
          logo: b.logo,
          parentCategoryId: toStr(parentCatId)
        };
      });
      setBrands(processedBrands);

      // Process Categories
      const categoriesRaw = Array.isArray(categoriesData) 
        ? categoriesData 
        : ((categoriesData as any).categories || []);

      const processedCategories: Category[] = categoriesRaw.map((c: any) => {
        let parentId = c.parentId || c.ParentID || c.parent_category_id;
        if (typeof parentId === 'object' && parentId !== null) {
          parentId = parentId.id || parentId._id;
        }
        
        return {
          ...c,
          id: toStr(c.id || c._id),
          parentId: parentId ? toStr(parentId) : undefined,
          name: c.name,
          nameAr: c.nameAr || c.name,
        };
      });
      setCategories(Array.from(new Map(processedCategories.map(c => [c.id, c])).values()));

      // Process Products using the resolved brands
      const productsRaw = Array.isArray(productsData) 
        ? productsData 
        : ((productsData as any).data || (productsData as any).products || []);
      
      const processedProducts = productsRaw.map((p: any) => normalizeProduct(p, processedBrands));
      const uniqueProducts = Array.from(new Map(processedProducts.map((p: any) => [p.id, p])).values()) as Product[];
      setProducts(uniqueProducts);
      
      console.log('[HierarchicalManager] Data Refresh:', { 
        brands: processedBrands.length, 
        categories: processedCategories.length, 
        products: uniqueProducts.length 
      });
      
    } catch (error) {
      console.error('Failed to load data:', error);
      toast({
        title: t('common.error'),
        description: t('dashboard.products.hierarchical.loadError'),
        variant: 'destructive',
      });
    } finally {
      isLoadingRef.current = false;
      if (showLoading) setLoading(false);
    }
  }, [toast, t, normalizeProduct]);

  useEffect(() => {
    loadData(true);
    
    const handleProductsUpdate = () => loadData(false);
    // Removed visibilitychange listener to prevent aggressive refreshing
    
    window.addEventListener('productsUpdated', handleProductsUpdate);
    
    return () => {
      window.removeEventListener('productsUpdated', handleProductsUpdate);
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
                  setSelectedCategoryIds(prev => [...prev, categoryId]);
                }
              }}
              loadProductsByCategory={async (categoryId: string) => {
                const raw = await fetchAllPages('/products', `&categoryId=${categoryId}&includeBrand=true&includeCategories=true`);
                return raw.map((p: any) => normalizeProduct(p, brands));
              }}
              onCreateCategory={async (data, options) => {
                const res = await coreApi.createCategory(data as any, options);
                
                // Handle different API response structures
                // API might return: {category: {id, name, nameAr, ...}} or {id, name, nameAr, ...} directly
                const category = (res as any).category || res;
                const created = {
                  id: toStr(category?.id || (res as any).id),
                  name: category?.name || (res as any).name,
                  nameAr: category?.nameAr || (res as any).nameAr || category?.name || (res as any).name,
                  parentId: (category?.parentId || (res as any).parentId) ? toStr(category?.parentId || (res as any).parentId) : undefined,
                };
                
                // Validate that we got a valid ID
                if (!created.id || created.id.trim() === '') {
                  console.error('[HierarchicalManager] Category creation failed - no ID returned:', res);
                  throw new Error('Category creation failed: No ID returned from API');
                }
                
                // OPTIMIZATION: Don't reload all data after each category - just add to state
                // Full data reload will happen once at the end via onSuccess callback
                setCategories(prev => {
                  // Check if category already exists to avoid duplicates
                  const exists = prev.some(c => c.id === created.id);
                  return exists ? prev : [...prev, created];
                });
                
                // DO NOT call loadData(false) here - it causes massive performance issues
                // loadData() fetches ALL brands, categories, and products (1949+ items)
                // Calling it after each category would mean 9 full reloads = several minutes wasted
                // Instead, onSuccess will trigger a single reload at the end
                
                return created;
              }}
              onCreateBrand={async (data, options) => {
                const res = await coreApi.createBrand(data as any, options);
                // OPTIMIZATION: Don't reload all data after each brand - just add to state
                // Full data reload will happen once at the end via onSuccess callback
                const created = { ...res, id: toStr(res.id) };
                setBrands(prev => {
                  const exists = prev.some(b => b.id === created.id);
                  return exists ? prev : [...prev, created as Brand];
                });
                return created;
              }}
              onCreateProduct={async (data, options) => {
                const res = await coreApi.createProduct({
                  ...data,
                  isAvailable: true,
                  isPublished: true,
                  variants: (data as any).variants || [{
                    name: 'Default',
                    price: data.price || 0,
                    inventoryQuantity: (data as any).stockCount || 0,
                  }],
                } as any, false, options);
                // OPTIMIZATION: Don't reload all data after each product
                // Full data reload will happen once at the end via onSuccess callback
                // Adding to state would be inefficient for 1949 products, so we skip it
                return normalizeProduct(res, brands);
              }}
              onCategoriesUpdate={() => {
                // Force full reload after import to refresh tree view
                // Reset selection state to ensure tree view refreshes properly
                setSelectedCategoryIds([]);
                setTimeout(() => loadData(true), 500);
              }}
              onBrandsUpdate={() => {
                // Force full reload after import to refresh tree view
                setTimeout(() => loadData(true), 500);
              }}
              onProductsUpdate={() => {
                // Force full reload after import to refresh tree view
                setTimeout(() => loadData(true), 500);
              }}
            />
          )}
      </div>
    </div>
  );
}
