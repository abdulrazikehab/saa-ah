import { useEffect, useState } from 'react';
import { 
  ArrowRight, Loader2, FileText, Calendar, Eye,
  Sparkles, ShoppingBag, Package, FolderOpen, Tag
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ProductCard } from '@/components/storefront/ProductCard';
import { coreApi } from '@/lib/api';
import { useTranslation } from 'react-i18next';
import { SectionRenderer } from '@/components/builder/SectionRenderer';
import { Section } from '@/components/builder/PageBuilder';
import { Page, Product, Category } from '@/services/types';
import { getLogoUrl, BRAND_NAME_AR } from '@/config/logo.config';

interface Brand {
  id: string;
  name: string;
  nameAr?: string;
  code?: string;
}

export default function Home() {
  console.log('Rendering Storefront Home Page');
  const { t } = useTranslation();
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [pages, setPages] = useState<Page[]>([]);
  const [homePage, setHomePage] = useState<Page | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Try to fetch 'home' page first (silently fail if not found)
      try {
        const home = await coreApi.getPageBySlug('home');
        if (home && home.isPublished) {
          setHomePage(home);
        }
      } catch (e: any) {
        // Silently ignore errors for home page - it's optional
        // getPageBySlug now returns null for 404, so this catch is for other errors
        if (e?.status && e.status !== 404) {
          console.warn('Error loading home page:', e);
        }
      }

      const [productsData, pagesData, categoriesData, brandsData] = await Promise.all([
        coreApi.getProducts({ limit: 8 }),
        coreApi.getPages(),
        coreApi.getCategories().catch(() => []),
        coreApi.getBrands().catch(() => [])
      ]);
      
      // Validate pagesData
      const publishedPages = Array.isArray(pagesData) 
        ? (pagesData as Page[]).filter((p) => p && typeof p === 'object' && !('error' in p) && p.isPublished)
        : [];
      
      // Validate productsData
      let rawProducts: Product[] = [];
      if (productsData && typeof productsData === 'object' && !('error' in productsData) && !('statusCode' in productsData)) {
        if (Array.isArray(productsData)) {
          rawProducts = productsData.filter((p: any) => 
            p && typeof p === 'object' && p.id && !('error' in p) && !('statusCode' in p)
          );
        } else if (productsData.products && Array.isArray(productsData.products)) {
          rawProducts = productsData.products.filter((p: any) => 
            p && typeof p === 'object' && p.id && !('error' in p) && !('statusCode' in p)
          );
        }
      }
      
      const validProducts = rawProducts.map((p) => ({
        ...p,
        price: Number(p.price) || 0,
        compareAtPrice: p.compareAtPrice ? Number(p.compareAtPrice) : undefined
      }));
      
      // Validate categoriesData
      let rawCategories: Category[] = [];
      if (categoriesData && typeof categoriesData === 'object' && !('error' in categoriesData) && !('statusCode' in categoriesData)) {
        if (Array.isArray(categoriesData)) {
          rawCategories = categoriesData.filter((c: any) => 
            c && typeof c === 'object' && c.id && !('error' in c) && !('statusCode' in c)
          );
        } else if (categoriesData.categories && Array.isArray(categoriesData.categories)) {
          rawCategories = categoriesData.categories.filter((c: any) => 
            c && typeof c === 'object' && c.id && !('error' in c) && !('statusCode' in c)
          );
        }
      }
      const rootCategories = rawCategories.filter((cat: Category) => !cat.parentId);
      
      // Validate brandsData
      let validBrands: Brand[] = [];
      if (brandsData && typeof brandsData === 'object' && !('error' in brandsData) && !('statusCode' in brandsData)) {
        if (Array.isArray(brandsData)) {
          validBrands = brandsData.filter((b: any) => 
            b && typeof b === 'object' && b.id && !('error' in b) && !('statusCode' in b)
          );
        }
      }
      
      setFeaturedProducts(validProducts);
      setPages(publishedPages);
      setCategories(rootCategories.slice(0, 6));
      setBrands(validBrands.slice(0, 8));
    } catch (error) {
      console.error('Failed to load data:', error);
      setFeaturedProducts([]);
      setPages([]);
      setCategories([]);
      setBrands([]);
    } finally {
      setLoading(false);
    }
  };

  const logoUrl = getLogoUrl();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
            <div className="relative w-20 h-20 mx-auto rounded-xl overflow-hidden bg-card border border-border shadow-lg">
              <img src={logoUrl} alt={BRAND_NAME_AR} className="w-full h-full object-contain p-2" />
            </div>
          </div>
          <p className="text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  // If custom home page exists, render it
  if (homePage && homePage.content && Array.isArray(homePage.content.sections)) {
    return (
      <div className="min-h-screen bg-background">
        {(homePage.content.sections as Section[]).map((section) => (
          <SectionRenderer key={section.id} section={section} />
        ))}
      </div>
    );
  }

  // Fallback to default layout
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden gradient-primary">
        <div className="absolute inset-0 bg-grid-pattern opacity-10" />
        <div className="absolute top-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1.5s' }} />
        
        <div className="container relative py-20 md:py-32">
          <div className="mx-auto max-w-4xl text-center">
            {(pages.length > 0 || featuredProducts.length > 0) && (
              <>
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-heading font-bold tracking-tight mb-6 text-white leading-tight animate-slide-up">
                  مرحباً بك
                </h1>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                  {featuredProducts.length > 0 && (
                    <Link to="/products">
                      <Button size="lg" className="bg-white text-primary hover:bg-white/90 shadow-xl h-14 px-8 text-lg font-semibold">
                        <ShoppingBag className="ml-2 h-5 w-5" />
                        المنتجات ({featuredProducts.length})
                      </Button>
                    </Link>
                  )}
                  {pages.length > 0 && (
                    <Link to={`/${pages[0].slug}`}>
                      <Button size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white/10 h-14 px-8 text-lg font-semibold">
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

      <div className="container py-16 space-y-20">
        {/* Brands Section */}
        {brands.length > 0 && (
          <section className="animate-slide-up">
            <div className="flex items-center justify-between mb-8">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Tag className="h-5 w-5 text-primary" />
                  </div>
                  <h2 className="text-3xl md:text-4xl font-heading font-bold gradient-text">
                    العلامات التجارية
                  </h2>
                  <Badge variant="soft-primary" className="text-base px-3 py-1">
                    {brands.length}
                  </Badge>
                </div>
                <p className="text-muted-foreground text-lg">
                  تسوق حسب العلامة التجارية
                </p>
              </div>
              <Link to="/categories">
                <Button variant="outline" size="lg" className="border-2 hidden sm:flex">
                  عرض الكل
                  <ArrowRight className="mr-2 h-5 w-5" />
                </Button>
              </Link>
            </div>

            <div className="flex flex-wrap gap-3">
              {brands.map((brand) => (
                <Link key={brand.id} to={`/products?brandId=${brand.id}`}>
                  <Card className="px-5 py-3 hover:shadow-md hover:border-primary/30 transition-all cursor-pointer group">
                    <span className="font-semibold text-base group-hover:text-primary transition-colors">
                      {brand.name}
                      {brand.nameAr && brand.nameAr !== brand.name && (
                        <span className="text-muted-foreground mr-2 text-sm">({brand.nameAr})</span>
                      )}
                    </span>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Categories Section */}
        {categories.length > 0 && (
          <section className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center justify-between mb-8">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-secondary/10 rounded-lg">
                    <FolderOpen className="h-5 w-5 text-secondary" />
                  </div>
                  <h2 className="text-3xl md:text-4xl font-heading font-bold gradient-text-secondary">
                    التصنيفات
                  </h2>
                  <Badge variant="soft-secondary" className="text-base px-3 py-1">
                    {categories.length}
                  </Badge>
                </div>
                <p className="text-muted-foreground text-lg">
                  تسوق حسب التصنيف
                </p>
              </div>
              <Link to="/categories">
                <Button variant="outline" size="lg" className="border-2 hidden sm:flex">
                  عرض الكل
                  <ArrowRight className="mr-2 h-5 w-5" />
                </Button>
              </Link>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {categories.map((category) => (
                <Link key={category.id} to={`/categories/${category.id}`}>
                  <Card className="h-full hover:shadow-lg transition-all duration-300 group cursor-pointer hover:-translate-y-1 overflow-hidden">
                    <div className="flex">
                      <div className="w-24 h-24 bg-gradient-mesh flex items-center justify-center shrink-0">
                        {category.image ? (
                          <img src={category.image} alt={category.name} className="w-full h-full object-cover" />
                        ) : (
                          <FolderOpen className="h-10 w-10 text-primary/40" />
                        )}
                      </div>
                      <CardContent className="flex-1 p-4 flex flex-col justify-center">
                        <CardTitle className="text-lg group-hover:text-primary transition-colors">
                          {category.name}
                        </CardTitle>
                        {category.description && (
                          <CardDescription className="line-clamp-1 mt-1">
                            {category.description}
                          </CardDescription>
                        )}
                      </CardContent>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* User Created Pages Section */}
        {pages.length > 0 && (
          <section className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center justify-between mb-8">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-accent/10 rounded-lg">
                    <FileText className="h-5 w-5 text-accent" />
                  </div>
                  <h2 className="text-3xl md:text-4xl font-heading font-bold">
                    <span className="text-foreground">الصفحات</span>
                  </h2>
                  <Badge variant="soft-primary" className="text-base px-3 py-1">
                    {pages.length} {pages.length === 1 ? 'صفحة' : pages.length === 2 ? 'صفحتان' : 'صفحات'}
                  </Badge>
                </div>
                <p className="text-muted-foreground text-lg">
                  تصفح محتوى المتجر
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {pages.map((page) => (
                <Link key={page.id} to={`/${page.slug}`}>
                  <Card className="h-full hover:shadow-lg transition-all duration-300 group cursor-pointer hover:-translate-y-1">
                    <CardHeader>
                      <div className="flex items-start justify-between mb-2">
                        <div className="p-3 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                          <FileText className="h-6 w-6 text-primary" />
                        </div>
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
                        <span className="text-sm text-muted-foreground">
                          /{page.slug}
                        </span>
                        <Button variant="ghost" size="sm" className="group-hover:bg-primary/10">
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
          <section className="animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <div className="flex items-center justify-between mb-8">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-success/10 rounded-lg">
                    <ShoppingBag className="h-5 w-5 text-success" />
                  </div>
                  <h2 className="text-3xl md:text-4xl font-heading font-bold gradient-text">
                    المنتجات
                  </h2>
                </div>
              </div>
              <Link to="/products">
                <Button variant="outline" size="lg" className="border-2">
                  عرض الكل
                  <ArrowRight className="mr-2 h-5 w-5" />
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        )}

        {/* Empty State */}
        {pages.length === 0 && featuredProducts.length === 0 && (
          <section className="py-20">
            <Card className="shadow-lg">
              <CardContent className="py-16 text-center">
                <Package className="h-20 w-20 mx-auto text-muted-foreground/30 mb-4" />
                <h3 className="text-2xl font-heading font-bold mb-2">لا يوجد محتوى بعد</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  عذراً، لا يوجد محتوى لعرضه حالياً.
                </p>
              </CardContent>
            </Card>
          </section>
        )}
      </div>
    </div>
  );
}
