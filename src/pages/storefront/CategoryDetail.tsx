import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { coreApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, Package, FolderOpen, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductCard } from '@/components/storefront/ProductCard';
import { Badge } from '@/components/ui/badge';
import { Product } from '@/services/types';
import { useTranslation } from 'react-i18next';
import { BRAND_NAME_AR, BRAND_NAME_EN } from '@/config/logo.config';

import { StorefrontLoading } from '@/components/storefront/StorefrontLoading';

interface Category {
  id: string;
  name: string;
  description?: string;
  image?: string;
  slug?: string;
  parentId?: string | null;
  productCount?: number;
}

export default function CategoryDetail() {
  const { id } = useParams();
  const { toast } = useToast();
  const { t, i18n } = useTranslation();
  const [category, setCategory] = useState<Category | null>(null);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCategoryAndProducts();
    
    // Listen for product updates
    const handleProductsUpdate = () => {
      loadCategoryAndProducts();
    };
    
    window.addEventListener('productsUpdated', handleProductsUpdate);
    
    return () => {
      window.removeEventListener('productsUpdated', handleProductsUpdate);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadCategoryAndProducts = async () => {
    try {
      setLoading(true);
      
      // Load category details and all categories
      const [categoryData, allCategoriesData] = await Promise.all([
        coreApi.get(`/categories/${id}`),
        coreApi.getCategories()
      ]);
      
      setCategory(categoryData);
      
      // Find subcategories and parent
      const allCats: Category[] = Array.isArray(allCategoriesData) ? allCategoriesData : ((allCategoriesData as { categories?: Category[] })?.categories || []);
      setAllCategories(allCats);
      
      const childCategories = allCats.filter((cat: Category) => cat.parentId === id);
      setSubcategories(childCategories);
      
      // Load products in this category
      console.log('🔍 [Storefront] Loading products for category:', id);
      
      // First, try to get all products to see what we have
      const allProductsData = await coreApi.getProducts({ 
        limit: 1000
      });
      
      console.log('🔍 [Storefront] All products response:', allProductsData);
      
      const allProductsList = Array.isArray(allProductsData) 
        ? allProductsData 
        : ((allProductsData as any)?.data || (allProductsData as any)?.products || []);
      
      console.log('🔍 [Storefront] All products list:', allProductsList.length, 'products');
      
      // Log first product's categories structure
      if (allProductsList.length > 0) {
        console.log('🔍 [Storefront] First product sample:', {
          id: allProductsList[0].id,
          name: allProductsList[0].name,
          categories: allProductsList[0].categories,
          categoriesType: typeof allProductsList[0].categories,
          isArray: Array.isArray(allProductsList[0].categories),
          categoryId: (allProductsList[0] as any).categoryId,
          isAvailable: (allProductsList[0] as any).isAvailable,
          isPublished: (allProductsList[0] as any).isPublished
        });
      }
      
      // Now try with category filter
      const productsData = await coreApi.getProducts({ 
        categoryId: id,
        limit: 1000
      });
      
      console.log('🔍 [Storefront] Filtered products response (categoryId):', productsData);
      
      const productsList = Array.isArray(productsData) 
        ? productsData 
        : ((productsData as any)?.data || (productsData as any)?.products || []);
      
      console.log('🔍 [Storefront] Filtered products list:', productsList.length, 'products');
      
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
          ...p,
          categories: normalizedCategories,
          price: Number(p.price) || 0,
          compareAtPrice: p.compareAtPrice ? Number(p.compareAtPrice) : undefined,
          isAvailable: (p.isAvailable !== false && p.isAvailable !== undefined) ? true : false,
          isPublished: (p.isPublished !== false && p.isPublished !== undefined) ? true : false,
        };
      });
      
      // Filter products that belong to this category and are available and published
      const filteredProducts = processedProducts.filter((p: any) => {
        // Check if product is available and published
        if (!p.isAvailable || !p.isPublished) {
          return false;
        }
        
        // Check if product belongs to this category
        const hasCategory = p.categories?.some((cat: any) => {
          const catId = cat.categoryId || cat.id || cat.category?.id;
          return catId === id;
        }) || p.categoryId === id;
        
        if (hasCategory) {
          console.log('✅ [Storefront] Product belongs to category:', p.name, 'categories:', p.categories);
        }
        
        return hasCategory;
      });
      
      console.log('🔍 [Storefront] Final filtered products for category', id, ':', filteredProducts.length, 'products');
      setProducts(filteredProducts);
    } catch (error) {
      console.error('Failed to load category:', error);
      toast({
        title: 'تعذر تحميل التصنيف',
        description: 'حدث خطأ أثناء تحميل بيانات التصنيف. يرجى المحاولة مرة أخرى.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getBreadcrumbs = () => {
    if (!category) return [];
    
    const path = [];
    let currentId = category.parentId;
    
    // Safety break to avoid infinite loops
    let depth = 0;
    while (currentId && depth < 10) {
      const cat = allCategories.find(c => c.id === currentId);
      if (cat) {
        path.unshift(cat);
        currentId = cat.parentId;
      } else {
        break;
      }
      depth++;
    }
    
    return path;
  };

  if (loading) {
    return <StorefrontLoading />;
  }

  if (!category) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container py-20">
          <Card className="p-12 text-center border-0 shadow-lg">
            <Package className="h-20 w-20 mx-auto text-gray-400 mb-4" />
            <h2 className="text-2xl font-bold mb-2">التصنيف غير موجود</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              عذراً، لم نتمكن من العثور على هذا التصنيف
            </p>
            <Link to="/categories">
              <Button>العودة إلى التصنيفات</Button>
            </Link>
          </Card>
        </div>
      </div>
    );
  }

  const breadcrumbs = getBreadcrumbs();
  const isRtl = i18n.language === 'ar';
  const SeparatorIcon = isRtl ? ChevronLeft : ChevronRight;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container py-8">
        {/* Breadcrumb */}
        <div className="mb-6 flex items-center flex-wrap gap-2 text-sm">
          <Link 
            to="/" 
            className="text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors font-medium"
          >
            {isRtl ? BRAND_NAME_AR : BRAND_NAME_EN}
          </Link>
          
          <SeparatorIcon className="h-4 w-4 text-gray-400" />
          
          <Link 
            to="/categories" 
            className="text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors"
          >
            {t('nav.categories', 'التصنيفات')}
          </Link>

          <SeparatorIcon className="h-4 w-4 text-gray-400" />

          {breadcrumbs.map((cat) => (
            <div key={cat.id} className="flex items-center gap-2">
              <Link 
                to={`/categories/${cat.id}`}
                className="text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors"
              >
                {cat.name}
              </Link>
              <SeparatorIcon className="h-4 w-4 text-gray-400" />
            </div>
          ))}
          
          <span className="text-primary font-medium">{category.name}</span>
        </div>

        {/* Category Header */}
        <div className="mb-12">
          {category.image && (
            <div className="w-full h-64 mb-6 rounded-2xl overflow-hidden">
              <img
                src={category.image}
                alt={category.name}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            {category.name}
          </h1>
          {category.description && (
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl">
              {category.description}
            </p>
          )}
          <div className="flex items-center gap-4 mt-4">
            <p className="text-sm text-gray-500 dark:text-gray-500">
              {products.length} {products.length === 1 ? 'منتج' : 'منتجات'}
            </p>
            {subcategories.length > 0 && (
              <Badge variant="outline">
                {subcategories.length} تصنيف فرعي
              </Badge>
            )}
          </div>
        </div>

        {/* Subcategories Section */}
        {subcategories.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <FolderOpen className="h-6 w-6 text-primary" />
              التصنيفات الفرعية
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {subcategories.map((subcat) => (
                <Link
                  key={subcat.id}
                  to={`/categories/${subcat.id}`}
                  className="group"
                >
                  <Card className="overflow-hidden hover:shadow-lg hover:border-primary/50 transition-all duration-300">
                    <div className="flex items-center p-4 gap-4">
                      <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0 overflow-hidden">
                        {subcat.image ? (
                          <img
                            src={subcat.image}
                            alt={subcat.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <FolderOpen className="h-8 w-8 text-primary/40" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold group-hover:text-primary transition-colors truncate">
                          {subcat.name}
                        </h3>
                        {subcat.productCount !== undefined && (
                          <p className="text-xs text-muted-foreground">
                            {subcat.productCount} منتج
                          </p>
                        )}
                      </div>
                      <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0" />
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Products Grid */}
        <div>
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <Package className="h-6 w-6 text-primary" />
            المنتجات
          </h2>
          
          {products.length === 0 ? (
            <Card className="p-12 text-center">
              <CardContent>
                <Package className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold mb-2">لا توجد منتجات</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  {subcategories.length > 0 
                    ? 'تصفح التصنيفات الفرعية للعثور على المنتجات'
                    : 'لا توجد منتجات في هذا التصنيف حالياً'}
                </p>
                <Link to="/products">
                  <Button>تصفح جميع المنتجات</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
