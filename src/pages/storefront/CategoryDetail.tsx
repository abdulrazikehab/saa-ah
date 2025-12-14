import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { coreApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, Package, FolderOpen, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductCard } from '@/components/storefront/ProductCard';
import { Badge } from '@/components/ui/badge';
import { Product } from '@/services/types';

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
  const [category, setCategory] = useState<Category | null>(null);
  const [parentCategory, setParentCategory] = useState<Category | null>(null);
  const [subcategories, setSubcategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCategoryAndProducts();
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
      const allCategories = Array.isArray(allCategoriesData) ? allCategoriesData : (allCategoriesData.categories || []);
      const childCategories = allCategories.filter((cat: Category) => cat.parentId === id);
      setSubcategories(childCategories);
      
      // Find parent category if exists
      if (categoryData.parentId) {
        const parent = allCategories.find((cat: Category) => cat.id === categoryData.parentId);
        setParentCategory(parent || null);
      } else {
        setParentCategory(null);
      }

      // Load products in this category
      console.log('Loading products for category:', id);
      const productsData = await coreApi.getProducts({ 
        categoryId: id,
        limit: 100
      });
      console.log('Products data received:', productsData);
      const productsList = Array.isArray(productsData) ? productsData : ((productsData as any).products || []);
      console.log('Products list:', productsList);
      setProducts(productsList);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container py-20">
          <div className="flex items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        </div>
      </div>
    );
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container py-8">
        {/* Breadcrumb */}
        <div className="mb-6 flex items-center gap-2 text-sm">
          <Link 
            to="/categories" 
            className="text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors"
          >
            التصنيفات
          </Link>
          {parentCategory && (
            <>
              <ArrowLeft className="h-4 w-4 text-gray-400" />
              <Link 
                to={`/categories/${parentCategory.id}`}
                className="text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors"
              >
                {parentCategory.name}
              </Link>
            </>
          )}
          <ArrowLeft className="h-4 w-4 text-gray-400" />
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
