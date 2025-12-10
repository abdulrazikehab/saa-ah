import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { coreApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductCard } from '@/components/storefront/ProductCard';
import { Product } from '@/services/types';

interface Category {
  id: string;
  name: string;
  description?: string;
  image?: string;
  slug?: string;
}

export default function CategoryDetail() {
  const { id } = useParams();
  const { toast } = useToast();
  const [category, setCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCategoryAndProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadCategoryAndProducts = async () => {
    try {
      setLoading(true);
      
      // Load category details
      const categoryData = await coreApi.get(`/categories/${id}`);
      setCategory(categoryData);

      // Load products in this category
      console.log('Loading products for category:', id);
      const productsData = await coreApi.getProducts({ 
        categoryId: id,
        limit: 100 // Get more products to ensure we see all in the category
      });
      console.log('Products data received:', productsData);
      const productsList = Array.isArray(productsData) ? productsData : ((productsData as any).products || []);
      console.log('Products list:', productsList);
      setProducts(productsList);
    } catch (error) {
      console.error('Failed to load category:', error);
      toast({
        title: 'خطأ',
        description: 'فشل تحميل التصنيف',
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
        <div className="mb-6">
          <Link 
            to="/categories" 
            className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            العودة إلى التصنيفات
          </Link>
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
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-4">
            {products.length} {products.length === 1 ? 'منتج' : 'منتجات'}
          </p>
        </div>

        {/* Products Grid */}
        {products.length === 0 ? (
          <Card className="p-12 text-center">
            <Package className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold mb-2">لا توجد منتجات</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              لا توجد منتجات في هذا التصنيف حالياً
            </p>
            <Link to="/products">
              <Button>تصفح جميع المنتجات</Button>
            </Link>
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
  );
}
