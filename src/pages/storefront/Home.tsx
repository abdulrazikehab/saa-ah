import { useEffect, useState } from 'react';
import { 
  ArrowRight, Loader2, FileText, Calendar, Eye, Search, ImageIcon,
  Sparkles, ShoppingBag, Package, FolderOpen, Tag, 
  ChevronRight, Star, TrendingUp, Zap, Wallet, RefreshCw
} from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ProductCard } from '@/components/storefront/ProductCard';
import { coreApi } from '@/lib/api';
import { useTranslation } from 'react-i18next';
import { SectionRenderer } from '@/components/builder/SectionRenderer';
import { Section } from '@/components/builder/PageBuilder';
import { Page, Product, Category, UserProfile, Brand } from '@/services/types';
import { getLogoUrl, BRAND_NAME_AR } from '@/config/logo.config';
import { cn } from '@/lib/utils';
import { StorefrontLoading } from '@/components/storefront/StorefrontLoading';
import { walletService } from '@/services/wallet.service';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { useStoreSettings } from '@/contexts/StoreSettingsContext';
import { DigitalCardsLanding } from '@/components/storefront/DigitalCardsLanding';
import MobileHome from '@/pages/mobile/MobileHome';
import { formatCurrency } from '@/lib/currency-utils';

export default function Home() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const navigate = useNavigate();
  const { settings, loading: settingsLoading } = useStoreSettings();
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [pages, setPages] = useState<Page[]>([]);
  const [homePage, setHomePage] = useState<Page | null>(null);
  const [loading, setLoading] = useState(true);
  interface SiteConfig {
    storeName?: string;
    storeNameAr?: string;
    currency?: string;
    settings?: {
      storeType?: string;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  }

  interface AppConfig {
    homeSections?: Section[];
    [key: string]: unknown;
  }

  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [customerData, setCustomerData] = useState<UserProfile | null>(null);
  const [siteConfig, setSiteConfig] = useState<SiteConfig | null>(null);
  const [appConfig, setAppConfig] = useState<AppConfig | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
    
    // Check for logged in user
    const token = localStorage.getItem('customerToken');
    const data = localStorage.getItem('customerData');
    if (token && data) {
      setCustomerData(JSON.parse(data));
      loadWalletBalance();
    }

    // Listen for product updates
    const handleProductsUpdate = () => {
      loadData();
    };
    
    window.addEventListener('productsUpdated', handleProductsUpdate);
    
    return () => {
      window.removeEventListener('productsUpdated', handleProductsUpdate);
    };
  }, []);

  const loadWalletBalance = async () => {
    try {
      const wallet = await walletService.getBalance();
      setWalletBalance(Number(wallet.balance) || 0);
    } catch (error) {
      // Silently handle wallet balance errors
    }
  };

  const loadData = async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      }
      const isNativeMode = Capacitor.isNativePlatform() || window.location.href.includes('platform=mobile') || window.location.hostname.includes('nip.io') || window.location.hostname.startsWith('192.168.');

      const [productsData, pagesData, categoriesData, brandsData, siteConfigData, appBuilderData] = await Promise.all([
        coreApi.getProducts({ limit: 1000 }),
        coreApi.getPages(false).catch(() => []), // Public endpoint - don't require auth
        coreApi.getCategories().catch(() => []),
        coreApi.getBrands().catch(() => []),
        coreApi.get('/site-config').catch(() => null),
        coreApi.get('/site-config/mobile', { requireAuth: false }).then(res => res?.config || res).catch((e: unknown) => {
            // Fallback to app-builder config or localStorage
            return coreApi.get('/app-builder/config').catch(() => {
                const local = localStorage.getItem('app_builder_config');
                return local ? JSON.parse(local) : null;
            });
        })
      ]);
      
      if (siteConfigData) {
        setSiteConfig(siteConfigData);
      }
      
      let configObj = null;
      if (appBuilderData) {
         configObj = appBuilderData?.config || appBuilderData;
         setAppConfig(configObj);
      }
      
      // Determine home page slug (from config or default)
      // Only use AppBuilder config slug if in Native/Mobile mode, otherwise default to 'home' for Web
      // This prevents App Builder Mobile settings from overriding the Web Storefront's Home Page
      const homeSlug = (isNativeMode && configObj?.homePageSlug) ? configObj.homePageSlug : 'home';
      
      // Try to load home page by multiple possible slugs
      const slugsToTry = [homeSlug];
      if (homeSlug !== 'home') slugsToTry.push('home');
      if (homeSlug !== '/') slugsToTry.push('/');
      
      let homePage = null;
      for (const slug of slugsToTry) {
        try {
          const page = await coreApi.getPageBySlug(slug);
          if (page && page.isPublished) {
            homePage = page;
            break;
          }
        } catch (e) {
          // Try next slug
        }
      }
      
      if (homePage) {
        setHomePage(homePage);
      }
      
      const publishedPages = Array.isArray(pagesData) 
        ? (pagesData as Page[]).filter((p) => p && typeof p === 'object' && !('error' in p) && p.isPublished)
        : [];
      
      interface ProductsResponse {
        data?: Product[];
        products?: Product[];
      }

      let rawProducts: Product[] = [];
      if (productsData && typeof productsData === 'object' && !('error' in productsData) && !('statusCode' in productsData)) {
        if (Array.isArray(productsData)) {
          rawProducts = productsData.filter((p: Product) => 
            p && typeof p === 'object' && p.id && !('error' in p) && !('statusCode' in p)
          );
        } else {
          const response = productsData as ProductsResponse;
          if (response.data && Array.isArray(response.data)) {
            rawProducts = response.data.filter((p: Product) => 
              p && typeof p === 'object' && p.id && !('error' in p) && !('statusCode' in p)
            );
          } else if (response.products && Array.isArray(response.products)) {
            rawProducts = response.products.filter((p: Product) => 
              p && typeof p === 'object' && p.id && !('error' in p) && !('statusCode' in p)
            );
          }
        }
      }
      
      interface ProductCategory {
        categoryId?: string;
        id?: string;
        category?: { id: string };
      }

      interface ExtendedProduct extends Product {
        categories?: ProductCategory[];
        title?: string;
        productName?: string;
        titleAr?: string;
        productNameAr?: string;
        cost?: number;
        isPublished?: boolean;
      }

      interface ProductImageData {
        url: string;
        id?: string;
        altText?: string;
      }

      // Process products: normalize categories and filter only available and published
      const validProducts = rawProducts
        .map((p: ExtendedProduct) => {
          // Normalize categories
          let normalizedCategories: ProductCategory[] = [];
          if ((p as ExtendedProduct).categories && Array.isArray((p as ExtendedProduct).categories)) {
            normalizedCategories = (p as ExtendedProduct).categories!.map((cat: ProductCategory | string) => {
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

          // Normalize images
          let normalizedImages: ProductImageData[] = [];
          if (p.images && Array.isArray(p.images)) {
            normalizedImages = p.images.map((img: ProductImageData | string) => {
              if (typeof img === 'string') {
                return { url: img, id: img };
              }
              return { url: img.url, id: img.id, altText: img.altText };
            });
          }

          return {
            ...p,
            name: p.name || (p as ExtendedProduct).title || (p as ExtendedProduct).productName || '',
            nameAr: p.nameAr || (p as ExtendedProduct).titleAr || (p as ExtendedProduct).productNameAr || '',
            images: normalizedImages,
            price: Number(p.price) || Number((p as ExtendedProduct).cost) || 0,
            compareAtPrice: p.compareAtPrice ? Number(p.compareAtPrice) : undefined,
            isAvailable: (p.isAvailable !== false && p.isAvailable !== undefined) ? true : false,
            isPublished: ((p as ExtendedProduct).isPublished !== false && (p as ExtendedProduct).isPublished !== undefined) ? true : false,
          } as Product & { isPublished: boolean };
        })
        .filter((p: Product & { isPublished: boolean }) => {
          // Only show available and published products
          return p.isAvailable && p.isPublished;
        })
        .slice(0, 8); // Limit to 8 for featured products
      
      interface CategoriesResponse {
        categories?: Category[];
      }

      let rawCategories: Category[] = [];
      if (categoriesData && typeof categoriesData === 'object' && !('error' in categoriesData) && !('statusCode' in categoriesData)) {
        if (Array.isArray(categoriesData)) {
          rawCategories = categoriesData.filter((c: Category) => 
            c && typeof c === 'object' && c.id && !('error' in c) && !('statusCode' in c)
          );
        } else {
          const response = categoriesData as CategoriesResponse;
          if (response.categories && Array.isArray(response.categories)) {
            rawCategories = response.categories.filter((c: Category) => 
              c && typeof c === 'object' && c.id && !('error' in c) && !('statusCode' in c)
            );
          }
        }
      }
      const rootCategories = rawCategories.filter((cat: Category) => !cat.parentId);
      
      let validBrands: Brand[] = [];
      if (brandsData && typeof brandsData === 'object' && !('error' in brandsData) && !('statusCode' in brandsData)) {
        if (Array.isArray(brandsData)) {
          validBrands = brandsData.filter((b: Brand) => 
            b && typeof b === 'object' && b.id && !('error' in b) && !('statusCode' in b)
          );
        }
      }
      
      setFeaturedProducts(validProducts);
      setPages(publishedPages);
      setCategories(rootCategories.slice(0, 6));
      setBrands(validBrands.slice(0, 8));
    } catch (error) {
      // Silently handle data loading errors
      setFeaturedProducts([]);
      setPages([]);
      setCategories([]);
      setBrands([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    loadData(true);
    loadWalletBalance();
  };

  const logoUrl = getLogoUrl();

  // Redirect logic for private (closed) stores
  useEffect(() => {
    // Only proceed if settings are loaded and no custom home page is active
    if (!settingsLoading && settings && !homePage) {
      const isPrivate = settings.isPrivateStore;
      const allowPublic = settings.allowPublicLanding;
      const isLoggedIn = !!localStorage.getItem('customerToken');

      if (isPrivate && !allowPublic && !isLoggedIn) {
        // Redirect to login if store is private, public access is disabled, and user is not logged in
        navigate('/login', { replace: true, state: { from: '/' } });
      }
    }
  }, [settings, settingsLoading, homePage, navigate]);

  if (loading || settingsLoading) {
    return <StorefrontLoading />;
  }
  


  // Check maintenance mode
  if (settings?.maintenanceMode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center p-8">
          <h1 className="text-4xl font-bold mb-4 text-gray-900 dark:text-white">
            {settings.storeName || 'المتجر'} في صيانة
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
            نعمل على تحسين تجربتك. سنعود قريباً!
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            {settings.storeDescription || 'نعتذر عن الإزعاج. نحن نعمل على تحسين المتجر وسنعود قريباً.'}
          </p>
        </div>
      </div>
    );
  }

  // Check if Native App (App Builder Layout)
  // Force mobile layout if ?platform=mobile matches or if running on nip.io (local dev)
  const isNativeMode = Capacitor.isNativePlatform() || window.location.href.includes('platform=mobile');
  
  // Default config if remote config is empty
  const DEFAULT_CONFIG = {
    showSearch: true,
    showBanner: true,
    bannerText: 'Welcome to Store',
    bannerSubtext: 'Best products for you',
    primaryColor: '#10b981',
    secondaryColor: '#3b82f6',
    showCategories: true,
    categoriesTitle: 'Categories',
    showFeatured: true,
    featuredTitle: 'Featured Products',
    cornerRadius: '1rem'
  };

  // Always render mobile layout if in Native Mode (even if config fetch failed)
  if (isNativeMode) {
    return <MobileHome 
      products={featuredProducts} 
      categories={categories} 
      brands={brands}
      pages={pages}
      homePage={homePage}
      appConfig={appConfig}
      loading={loading}
    />;
  }

  // Check if custom home page exists and is valid
  const hasCustomHomePage = homePage && homePage.content && Array.isArray(homePage.content.sections);

  // If custom home page exists, render it
  if (hasCustomHomePage) {
    return (
      <div className="min-h-screen bg-background">
        {(homePage!.content.sections as Section[]).map((section, index) => (
          <SectionRenderer key={section.id || `section-${index}`} section={section} />
        ))}
      </div>
    );
  }
  
  // Use specialized landing page for Digital Cards stores (if no custom home page)
  if (settings?.storeType === 'DIGITAL_CARDS') {
    return <DigitalCardsLanding />;
  }

  // Fallback to default layout
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-background dark:gradient-primary" />
        <div className="absolute inset-0 bg-grid-pattern opacity-10" />
        
        {/* Animated Orbs */}
        <div className="absolute top-20 right-20 w-96 h-96 rounded-full bg-primary/5 dark:bg-white/10 blur-3xl animate-blob" />
        <div className="absolute bottom-20 left-20 w-96 h-96 rounded-full bg-secondary/5 dark:bg-white/10 blur-3xl animate-blob animation-delay-2000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-accent/5 dark:bg-white/5 blur-3xl animate-pulse-slow" />
        
        {/* Floating Particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <div 
              key={i}
              className="absolute w-2 h-2 rounded-full bg-primary/20 dark:bg-white/30"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animation: `float ${5 + Math.random() * 5}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 5}s`
              }}
            />
          ))}
        </div>
        
        <div className="container relative py-24 md:py-36">
          {/* Refresh Button */}
          <div className="absolute top-4 right-4 z-10">
            <Button
              onClick={handleRefresh}
              disabled={refreshing || loading}
              variant="outline"
              size="sm"
              className="bg-background/50 dark:bg-white/10 backdrop-blur-sm border-border/50 dark:border-white/20 text-foreground dark:text-white hover:bg-background/80 dark:hover:bg-white/20"
            >
              <RefreshCw className={`h-4 w-4 ml-2 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'جاري التحديث...' : 'تحديث'}
            </Button>
          </div>
          
          <div className="mx-auto max-w-4xl text-center">
            {(pages.length > 0 || featuredProducts.length > 0) && (
              <>
                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 dark:bg-white/15 backdrop-blur-sm border border-accent/20 dark:border-white/20 mb-8 animate-slide-down">
                  <Sparkles className="w-4 h-4 text-accent/80 dark:text-warning" />
                  <span className="text-foreground/80 dark:text-white/90 text-sm font-medium">أفضل المنتجات بأفضل الأسعار</span>
                </div>

                {/* Wallet Balance Display - Only for digital card stores */}
                {customerData && siteConfig?.settings?.storeType === 'DIGITAL_CARDS' && (
                  <div className="mb-6 animate-slide-down animation-delay-100">
                    <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-lg">
                      <div className="p-2 rounded-xl bg-primary/20 text-white">
                        <Wallet className="w-5 h-5" />
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-white/70 font-medium">رصيدك الحالي</p>
                        <p className="text-xl font-bold text-white tracking-tight">
                          {formatCurrency(walletBalance, settings?.currency || 'SAR')}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Title */}
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-heading font-bold tracking-tight mb-6 text-foreground dark:text-white leading-tight animate-slide-up">
                  مرحباً بك في
                  <span className="block mt-2 bg-gradient-to-r from-primary via-primary/80 to-primary/60 dark:from-white dark:via-white/90 dark:to-white/70 bg-clip-text text-transparent">
                    متجرنا الإلكتروني
                  </span>
                </h1>
                
                {/* Subtitle */}
                <p className="text-xl md:text-2xl text-muted-foreground dark:text-white/80 mb-10 max-w-2xl mx-auto animate-slide-up animation-delay-200">
                  اكتشف تشكيلة متنوعة من المنتجات عالية الجودة بأسعار منافسة
                </p>
                
                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up animation-delay-400">
                  {featuredProducts.length > 0 && (
                    <Link to="/products">
                      <Button 
                        size="lg" 
                        className="bg-primary text-primary-foreground hover:bg-primary/90 dark:bg-white dark:text-primary dark:hover:bg-white/90 shadow-2xl h-14 px-8 text-lg font-semibold rounded-xl group"
                      >
                        <ShoppingBag className="ml-2 h-5 w-5 group-hover:animate-wiggle" />
                        تصفح المنتجات
                        <ChevronRight className="mr-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </Link>
                  )}
                  {pages.length > 0 && (
                    <Link to={`/${pages[0].slug}`}>
                      <Button 
                        size="lg" 
                        variant="outline" 
                        className="border-2 border-primary/20 dark:border-white/50 bg-transparent text-foreground dark:text-white hover:bg-primary/5 dark:hover:bg-white/10 h-14 px-8 text-lg font-semibold rounded-xl backdrop-blur-sm"
                      >
                        <FileText className="ml-2 h-5 w-5" />
                        اكتشف المزيد
                      </Button>
                    </Link>
                  )}
                </div>
                
                {/* Stats */}
                <div className="mt-16 grid grid-cols-3 gap-8 max-w-xl mx-auto animate-slide-up animation-delay-500">
                  {[
                    { label: 'منتج', value: featuredProducts.length + '+', icon: Package },
                    { label: 'تصنيف', value: categories.length + '+', icon: FolderOpen },
                    { label: 'علامة تجارية', value: brands.length + '+', icon: Tag },
                  ].map((stat, i) => (
                    <div key={i} className="text-center">
                      <div className="text-3xl md:text-4xl font-bold text-foreground dark:text-white mb-1">{stat.value}</div>
                      <div className="text-sm text-muted-foreground dark:text-white/70 flex items-center justify-center gap-1">
                        <stat.icon className="w-3.5 h-3.5" />
                        {stat.label}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
        
        {/* Wave Divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" className="w-full h-auto">
            <path 
              d="M0,60 C480,120 960,0 1440,60 L1440,120 L0,120 Z" 
              className="fill-background/50 dark:fill-background"
            />
          </svg>
        </div>
      </section>

      <div className="container py-20 space-y-24">
        {/* Brands Section */}
        {brands.length > 0 && (
          <section className="animate-slide-up">
            <div className="flex items-center justify-between mb-10">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2.5 rounded-xl gradient-primary shadow-glow">
                    <Tag className="h-5 w-5 text-white" />
                  </div>
                  <h2 className="text-3xl md:text-4xl font-heading font-bold gradient-text">
                    العلامات التجارية
                  </h2>
                  <Badge variant="outline" className="text-sm px-3 py-1 rounded-full border-primary/30 text-primary">
                    {brands.length}
                  </Badge>
                </div>
                <p className="text-muted-foreground text-lg">
                  تسوق من أفضل العلامات التجارية العالمية
                </p>
              </div>
              <Link to="/categories">
                <Button variant="outline" size="lg" className="border-2 hidden sm:flex rounded-xl hover:bg-primary/5 group">
                  عرض الكل
                  <ArrowRight className="mr-2 h-5 w-5 group-hover:-translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>

            <div className="flex flex-wrap gap-3">
              {brands.map((brand, index) => (
                <Link 
                  key={brand.id} 
                  to={`/products?brandId=${brand.id}`}
                  className="animate-scale-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <Card className="px-5 py-3 hover:shadow-lg hover:border-primary/50 hover:-translate-y-1 transition-all duration-300 cursor-pointer group rounded-xl">
                    <span className="font-semibold text-base group-hover:text-primary transition-colors inline-flex items-center gap-2">
                      {brand.name}
                      {brand.nameAr && brand.nameAr !== brand.name && (
                        <span className="text-muted-foreground text-sm">({brand.nameAr})</span>
                      )}
                      <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                    </span>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Categories Section */}
        {categories.length > 0 && (
          <section className="animate-slide-up animation-delay-200">
            <div className="flex items-center justify-between mb-10">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2.5 rounded-xl gradient-secondary shadow-glow-secondary">
                    <FolderOpen className="h-5 w-5 text-white" />
                  </div>
                  <h2 className="text-3xl md:text-4xl font-heading font-bold gradient-text-secondary">
                    التصنيفات
                  </h2>
                  <Badge variant="outline" className="text-sm px-3 py-1 rounded-full border-secondary/30 text-secondary">
                    {categories.length}
                  </Badge>
                </div>
                <p className="text-muted-foreground text-lg">
                  تصفح مجموعاتنا المتنوعة
                </p>
              </div>
              <Link to="/categories">
                <Button variant="outline" size="lg" className="border-2 hidden sm:flex rounded-xl hover:bg-secondary/5 group">
                  عرض الكل
                  <ArrowRight className="mr-2 h-5 w-5 group-hover:-translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {categories.map((category, index) => (
                <Link 
                  key={category.id} 
                  to={`/categories/${category.id}`}
                  className="animate-scale-in"
                  style={{ animationDelay: `${index * 75}ms` }}
                >
                  <Card className="h-full overflow-hidden group cursor-pointer rounded-2xl border-2 border-border/50 hover:border-secondary/50 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
                    <div className="flex">
                      <div className="w-28 h-28 relative overflow-hidden bg-gradient-mesh flex items-center justify-center shrink-0">
                        {/* Overlay */}
                        <div className="absolute inset-0 gradient-secondary opacity-0 group-hover:opacity-20 transition-opacity duration-500" />
                        
                        {category.image ? (
                          <OptimizedImage 
                            src={category.image} 
                            alt={category.name} 
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                          />
                        ) : (
                          <FolderOpen className="h-12 w-12 text-secondary/40 group-hover:text-secondary group-hover:scale-110 transition-all duration-300" />
                        )}
                      </div>
                      <CardContent className="flex-1 p-5 flex flex-col justify-center">
                        <CardTitle className="text-lg group-hover:text-secondary transition-colors flex items-center gap-2">
                          {category.name}
                          <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                        </CardTitle>
                        {category.description && (
                          <CardDescription className="line-clamp-2 mt-1">
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

        {/* Pages Section */}
        {pages.length > 0 && (
          <section className="animate-slide-up animation-delay-400">
            <div className="flex items-center justify-between mb-10">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2.5 rounded-xl gradient-accent shadow-glow-accent">
                    <FileText className="h-5 w-5 text-white" />
                  </div>
                  <h2 className="text-3xl md:text-4xl font-heading font-bold">
                    <span className="bg-gradient-to-r from-accent via-primary to-secondary bg-clip-text text-transparent">
                      الصفحات
                    </span>
                  </h2>
                  <Badge variant="outline" className="text-sm px-3 py-1 rounded-full border-accent/30 text-accent">
                    {pages.length} {pages.length === 1 ? 'صفحة' : pages.length === 2 ? 'صفحتان' : 'صفحات'}
                  </Badge>
                </div>
                <p className="text-muted-foreground text-lg">
                  تصفح محتوى المتجر
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {pages.map((page, index) => (
                <Link 
                  key={page.id} 
                  to={`/${page.slug}`}
                  className="animate-scale-in"
                  style={{ animationDelay: `${index * 75}ms` }}
                >
                  <Card className="h-full group cursor-pointer rounded-2xl border-2 border-border/50 hover:border-accent/50 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
                    <CardHeader>
                      <div className="flex items-start justify-between mb-3">
                        <div className="p-3.5 rounded-xl bg-accent/10 group-hover:bg-accent/20 group-hover:scale-110 transition-all duration-300">
                          <FileText className="h-6 w-6 text-accent" />
                        </div>
                        <Badge variant="outline" className="text-xs border-border/50 text-muted-foreground">
                          <Calendar className="h-3 w-3 ml-1" />
                          {new Date(page.createdAt).toLocaleDateString('ar-SA')}
                        </Badge>
                      </div>
                      <CardTitle className="text-xl group-hover:text-accent transition-colors flex items-center gap-2">
                        {page.title}
                        <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground font-mono bg-muted/50 px-2 py-1 rounded-md">
                          /{page.slug}
                        </span>
                        <Button variant="ghost" size="sm" className="group-hover:bg-accent/10 rounded-lg">
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
          <section className="animate-slide-up animation-delay-500">
            <div className="flex items-center justify-between mb-10">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2.5 rounded-xl bg-gradient-to-r from-success to-primary shadow-lg">
                    <ShoppingBag className="h-5 w-5 text-white" />
                  </div>
                  <h2 className="text-3xl md:text-4xl font-heading font-bold gradient-text">
                    المنتجات المميزة
                  </h2>
                  <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-warning/10 text-warning text-sm font-medium">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>الأكثر مبيعاً</span>
                  </div>
                </div>
                <p className="text-muted-foreground text-lg">
                  اكتشف أفضل منتجاتنا
                </p>
              </div>
              <Link to="/products">
                <Button variant="outline" size="lg" className="border-2 rounded-xl hover:bg-primary/5 group">
                  عرض الكل
                  <ArrowRight className="mr-2 h-5 w-5 group-hover:-translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts.map((product, index) => (
                <ProductCard key={product.id} product={product} index={index} />
              ))}
            </div>
          </section>
        )}

        {/* Empty State */}
        {pages.length === 0 && featuredProducts.length === 0 && (
          <section className="py-20 animate-fade-in">
            <Card className="shadow-2xl rounded-3xl border-2 border-dashed border-border">
              <CardContent className="py-20 text-center">
                <div className="relative inline-block mb-6">
                  <div className="absolute inset-0 rounded-full gradient-mesh blur-2xl opacity-50" />
                  <div className="relative p-6 rounded-full bg-muted/50">
                    <Package className="h-20 w-20 text-muted-foreground/30" />
                  </div>
                </div>
                <h3 className="text-2xl font-heading font-bold mb-3">{t('common.noContentYet')}</h3>
                <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                  {t('common.noContentDescription')}
                </p>
                
                {(Capacitor.isNativePlatform() || window.location.href.includes('platform=mobile')) && (
                   <div className="mt-4 p-4 bg-red-100 text-red-800 rounded-lg text-left" dir="ltr">
                      <p className="font-bold">MOBILE DEBUG INFO:</p>
                      <p>Native: {Capacitor.isNativePlatform() ? 'Yes (Capacitor)' : 'Yes (URL Param)'}</p>
                      <p>App Config: {appConfig ? 'Loaded' : 'MISSING (Check Logs)'}</p>
                      <p>Tenant: {settings?.storeName || 'Unknown'}</p>
                   </div>
                )}
                
                <Button size="lg" className="gradient-primary text-white rounded-xl hover:shadow-glow transition-shadow">
                  <Sparkles className="ml-2 h-5 w-5" />
                  {t('common.exploreMore')}
                </Button>
              </CardContent>
            </Card>
          </section>
        )}
      </div>

      {/* Newsletter Section */}
      <section className="relative overflow-hidden py-20">
        <div className="absolute inset-0 gradient-mesh" />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-secondary/5" />
        
      
      </section>
    </div>
  );
}
