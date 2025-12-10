import { useEffect, useState } from 'react';
import { 
  ArrowRight, Loader2, FileText, Calendar, Eye,
  Sparkles, ShoppingBag, Package
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ProductCard } from '@/components/storefront/ProductCard';
import { coreApi } from '@/lib/api';
import { useTranslation } from 'react-i18next';
import { SectionRenderer } from '@/components/builder/SectionRenderer';
import { Page, Product } from '@/services/types';

export default function Home() {
  const { t } = useTranslation();
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [pages, setPages] = useState<Page[]>([]);
  const [homePage, setHomePage] = useState<Page | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Try to fetch 'home' page first
      try {
        const home = await coreApi.getPageBySlug('home');
        if (home && home.isPublished) {
          setHomePage(home);
        }
      } catch (e) {
        console.log('No custom home page found, using default layout');
      }

      const [productsData, pagesData] = await Promise.all([
        coreApi.getProducts({ limit: 8 }),
        coreApi.getPages()
      ]);
      
      const publishedPages = Array.isArray(pagesData) ? (pagesData as Page[]).filter((p) => p.isPublished) : [];
      
      const rawProducts = Array.isArray(productsData) ? productsData : ((productsData as { products: Product[] }).products || []);
      const validProducts = (rawProducts as Product[]).map((p) => ({
        ...p,
        price: Number(p.price) || 0,
        compareAtPrice: p.compareAtPrice ? Number(p.compareAtPrice) : undefined
      }));
      setFeaturedProducts(validProducts);
      setPages(publishedPages);
    } catch (error) {
      console.error('Failed to load data:', error);
      setFeaturedProducts([]);
      setPages([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-indigo-600" />
      </div>
    );
  }

  // If custom home page exists, render it
  if (homePage && homePage.content && Array.isArray(homePage.content.sections)) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {(homePage.content.sections as { id: string }[]).map((section) => (
          <SectionRenderer key={section.id} section={section} />
        ))}
      </div>
    );
  }

  // Fallback to default layout
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section - Simple, no demo text */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-secondary to-accent">
        <div className="absolute inset-0 bg-grid-pattern opacity-10" />
        <div className="absolute top-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        
        <div className="container relative py-20 md:py-32">
          <div className="mx-auto max-w-4xl text-center">
            {(pages.length > 0 || featuredProducts.length > 0) && (
              <>
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 text-white leading-tight">
                  مرحباً بك
                </h1>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
                  {featuredProducts.length > 0 && (
                    <Link to="/products">
                      <Button size="lg" className="bg-white text-primary hover:bg-gray-100 shadow-xl h-14 px-8 text-lg">
                        <ShoppingBag className="ml-2 h-5 w-5" />
                        المنتجات ({featuredProducts.length})
                      </Button>
                    </Link>
                  )}
                  {pages.length > 0 && (
                    <Link to={`/${pages[0].slug}`}>
                      <Button size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white/10 h-14 px-8 text-lg">
                        <FileText className="ml-2 h-5 w-5" />
                        الصفحات ({pages.length})
                      </Button>
                    </Link>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      <div className="container py-16 space-y-16">
        {/* User Created Pages Section */}
        {pages.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-8">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                    صفحاتك
                  </h2>
                  <Badge className="bg-primary/10 text-primary dark:bg-primary/30 dark:text-primary text-lg px-3 py-1">
                    {pages.length} {pages.length === 1 ? 'صفحة' : pages.length === 2 ? 'صفحتان' : 'صفحات'}
                  </Badge>
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-lg">
                  الصفحات التي قمت بإنشائها فقط
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pages.map((page) => (
                <Link key={page.id} to={`/${page.slug}`}>
                  <Card className="h-full border-0 shadow-md hover:shadow-xl transition-all duration-300 group cursor-pointer">
                    <CardHeader>
                      <div className="flex items-start justify-between mb-2">
                        <div className="p-3 rounded-xl bg-primary/10 dark:bg-primary/30 group-hover:bg-primary/20 dark:group-hover:bg-primary/50 transition-colors">
                          <FileText className="h-6 w-6 text-primary" />
                        </div>
                        <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                          منشورة
                        </Badge>
                      </div>
                      <CardTitle className="text-xl group-hover:text-primary transition-colors">
                        {page.title}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4" />
                        {new Date(page.createdAt).toLocaleDateString('ar-SA')}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          /{page.slug}
                        </span>
                        <Button variant="ghost" size="sm" className="group-hover:bg-primary/5 dark:group-hover:bg-primary/50">
                          <Eye className="h-4 w-4 ml-2" />
                          عرض
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Featured Products Section */}
        {featuredProducts.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  المنتجات
                </h2>
              </div>
              <Link to="/products">
                <Button variant="outline" size="lg" className="border-2">
                  عرض الكل
                  <ArrowRight className="mr-2 h-5 w-5" />
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        )}

        {/* Empty State */}
        {pages.length === 0 && featuredProducts.length === 0 && (
          <section className="py-20">
            <Card className="border-0 shadow-lg">
              <CardContent className="py-16 text-center">
                <Package className="h-20 w-20 mx-auto text-gray-400 mb-4" />
                <h3 className="text-2xl font-bold mb-2">لا يوجد محتوى بعد</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                  ابدأ بإضافة منتجات أو إنشاء صفحات لعرضها هنا
                </p>
              </CardContent>
            </Card>
          </section>
        )}
      </div>
    </div>
  );
}
