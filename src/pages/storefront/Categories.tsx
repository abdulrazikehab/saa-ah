import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { coreApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { Loader2, FolderOpen, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Categories() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const data = await coreApi.getCategories();
      setCategories(Array.isArray(data) ? data : (data.categories || []));
    } catch (error) {
      console.error('Failed to load categories:', error);
      toast({
        title: t('common.error'),
        description: 'فشل تحميل الفئات',
        variant: 'destructive',
      });
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            {t('categories.title')}
          </h1>
          <p className="text-muted-foreground text-lg">تسوق حسب الفئة</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        ) : categories.length === 0 ? (
          <Card className="text-center py-16">
            <CardContent>
              <FolderOpen className="h-20 w-20 mx-auto text-muted-foreground/50 mb-6" />
              <h3 className="text-2xl font-semibold mb-3">لا توجد فئات</h3>
              <p className="text-muted-foreground text-lg mb-6">
                لا توجد فئات متاحة حالياً
              </p>
              <Link to="/products">
                <Button>تصفح جميع المنتجات</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {categories.map((category) => (
              <Link
                key={category.id}
                to={`/categories/${category.id}`}
                className="group"
              >
                <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 h-full">
                  <div className="aspect-video bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 flex items-center justify-center relative overflow-hidden">
                    {category.image ? (
                      <img
                        src={category.image}
                        alt={category.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    ) : (
                      <FolderOpen className="h-16 w-16 text-primary/40 group-hover:scale-110 transition-transform duration-300" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <h2 className="text-xl font-bold group-hover:text-primary transition-colors">
                        {category.name}
                      </h2>
                      <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </div>
                    <p className="text-muted-foreground text-sm line-clamp-2">
                      {category.description || 'اكتشف مجموعتنا'}
                    </p>
                    {category.productCount !== undefined && (
                      <p className="text-xs text-muted-foreground mt-3">
                        {category.productCount} منتج
                      </p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
