import { useState, useEffect } from 'react';
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
}

export default function HierarchicalManager() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [brandsData, categoriesData, productsData] = await Promise.all([
        coreApi.get('/brands').catch(() => []),
        coreApi.getCategories(),
        coreApi.getProducts({ limit: '1000' } as any).catch(() => []),
      ]);

      setBrands(Array.isArray(brandsData) ? brandsData : []);
      
      const categoriesList = Array.isArray(categoriesData) 
        ? categoriesData 
        : ((categoriesData as any).categories || []);
      setCategories(categoriesList.map((c: any) => ({
        id: c.id,
        name: c.name,
        nameAr: c.nameAr || c.name,
        parentId: c.parentId,
      })));

      const productsList = Array.isArray(productsData) 
        ? productsData 
        : ((productsData as any).products || []);
      setProducts(productsList.map((p: any) => ({
        id: p.id,
        name: p.name,
        nameAr: p.nameAr || p.name,
      })));
    } catch (error) {
      console.error('Failed to load data:', error);
      toast({
        title: 'خطأ',
        description: 'فشل تحميل البيانات',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          المستكشف الهرمي
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          إدارة العلامات التجارية والفئات والمنتجات بشكل هرمي
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>المستكشف الهرمي</CardTitle>
          <CardDescription>
            المسار: العلامة التجارية → الفئة → الفئة الفرعية → ... → المنتج
          </CardDescription>
        </CardHeader>
        <CardContent>
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
              onCategorySelect={(categoryId) => {
                if (!selectedCategoryIds.includes(categoryId)) {
                  setSelectedCategoryIds([...selectedCategoryIds, categoryId]);
                }
              }}
              loadProductsByCategory={async (categoryId: string) => {
                try {
                  const productsData = await coreApi.getProducts({ categoryId, limit: '1000' } as any);
                  const productsList = Array.isArray(productsData) 
                    ? productsData 
                    : ((productsData as any).products || []);
                  return productsList.map((p: any) => ({
                    id: p.id,
                    name: p.name,
                    nameAr: p.nameAr || p.name,
                  }));
                } catch (error) {
                  console.error('Failed to load products by category:', error);
                  return [];
                }
              }}
              onCreateCategory={async (categoryData) => {
                try {
                  const newCategory = await coreApi.createCategory({
                    name: categoryData.name,
                    description: categoryData.description,
                    parentId: categoryData.parentId,
                  } as any);
                  await loadData();
                  return {
                    id: newCategory.id || (newCategory as any).category?.id,
                    name: newCategory.name || (newCategory as any).category?.name,
                    nameAr: categoryData.nameAr,
                    parentId: categoryData.parentId,
                  };
                } catch (error) {
                  console.error('Failed to create category:', error);
                  throw error;
                }
              }}
              onCreateBrand={async (brandData) => {
                try {
                  const newBrand = await coreApi.post('/brands', brandData);
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
                  const newProduct = await coreApi.createProduct({
                    name: productData.name,
                    nameAr: productData.nameAr,
                    description: productData.description,
                    price: productData.price || 0,
                    categoryIds: productData.categoryId ? [productData.categoryId] : [],
                    brandId: productData.brandId,
                    isAvailable: true,
                    isPublished: true,
                    variants: [{
                      name: 'Default',
                      price: productData.price || 0,
                      inventoryQuantity: 0,
                    }],
                  });
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
        </CardContent>
      </Card>
    </div>
  );
}

