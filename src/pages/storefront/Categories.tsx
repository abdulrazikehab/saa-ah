import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import MobileCategories from '@/pages/mobile/MobileCategories';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { coreApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { Loader2, FolderOpen, ArrowRight, ChevronDown, ChevronRight, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SectionRenderer } from '@/components/builder/SectionRenderer';
import { Section } from '@/components/builder/PageBuilder';
import { Page } from '@/services/types';

interface Category {
  id: string;
  name: string;
  description?: string;
  image?: string;
  parentId?: string | null;
  productCount?: number;
  children?: Category[];
}

export default function Categories() {
  const isNativeMode = Capacitor.isNativePlatform() || window.location.href.includes('platform=mobile') || sessionStorage.getItem('isMobilePlatform') === 'true';

  const { t } = useTranslation();
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [appConfig, setAppConfig] = useState<unknown>(null);
  const [customPage, setCustomPage] = useState<Page | null>(null);


  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Try to fetch custom page for categories
      try {
        const customCategoriesPage = await coreApi.getPageBySlug('categories');
        if (customCategoriesPage && customCategoriesPage.isPublished && 
            customCategoriesPage.content?.sections && 
            Array.isArray(customCategoriesPage.content.sections) && 
            customCategoriesPage.content.sections.length > 0) {
          setCustomPage(customCategoriesPage);
        }
      } catch (e) {
        // No custom page found, continue with default layout
      }
      
      const promises: Promise<unknown>[] = [
        coreApi.getCategories(),
        coreApi.getBrands().catch(() => [])
      ];

      if (isNativeMode) {
        promises.push(coreApi.get('/app-builder/config').catch(() => null));
      }

      const [categoriesData, brandsData, appConfigData] = await Promise.all(promises) as [unknown, unknown, unknown];
      
      const appConfigObj = appConfigData as { config?: unknown } | null;
      if (appConfigObj) {
         setAppConfig(appConfigObj.config || appConfigObj);
      }
      
      const rawCategories: Category[] = Array.isArray(categoriesData) ? categoriesData : ((categoriesData as { categories?: Category[] })?.categories || []);
      
      // Build category tree - only show root categories (no parent)
      const categoryMap = new Map<string, Category>();
      rawCategories.forEach((cat: Category) => {
        categoryMap.set(cat.id, { ...cat, children: [] });
      });
      
      // Assign children to parents
      rawCategories.forEach((cat: Category) => {
        if (cat.parentId && categoryMap.has(cat.parentId)) {
          const parent = categoryMap.get(cat.parentId)!;
          parent.children = parent.children || [];
          parent.children.push(categoryMap.get(cat.id)!);
        }
      });
      
      // Get only root categories (no parent)
      const rootCategories = Array.from(categoryMap.values()).filter(cat => !cat.parentId);
      
      setCategories(rootCategories);
      setBrands(Array.isArray(brandsData) ? brandsData : []);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast({
        title: t('common.error'),
        description: 'فشل تحميل الفئات',
        variant: 'destructive',
      });
      setCategories([]);
      setBrands([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpanded = (categoryId: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  const renderCategory = (category: Category, level: number = 0) => {
    const hasChildren = category.children && category.children.length > 0;
    const isExpanded = expandedCategories.has(category.id);

    return (
      <div key={category.id} className={level > 0 ? 'mr-4 border-r-2 border-primary/20 pr-4' : ''}>
        <div className="group">
          <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 mb-4">
            <div className="flex">
              {/* Image Section */}
              <div className="w-32 h-32 bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 flex items-center justify-center relative overflow-hidden shrink-0">
                {category.image ? (
                  <img
                    src={category.image}
                    alt={category.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                ) : (
                  <FolderOpen className="h-12 w-12 text-primary/40" />
                )}
              </div>
              
              {/* Content Section */}
              <CardContent className="flex-1 p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Link to={`/categories/${category.id}`} className="flex-1">
                      <h2 className="text-lg font-bold group-hover:text-primary transition-colors">
                        {category.name}
                      </h2>
                    </Link>
                    <div className="flex items-center gap-2">
                      {category.productCount !== undefined && category.productCount > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {category.productCount} منتج
                        </Badge>
                      )}
                      {hasChildren && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.preventDefault();
                            toggleExpanded(category.id);
                          }}
                          className="p-1 h-8 w-8"
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                  <p className="text-muted-foreground text-sm line-clamp-2">
                    {category.description || 'اكتشف مجموعتنا'}
                  </p>
                </div>
                <div className="flex items-center justify-between mt-3">
                  {hasChildren && (
                    <span className="text-xs text-muted-foreground">
                      {category.children!.length} تصنيف فرعي
                    </span>
                  )}
                  <Link to={`/categories/${category.id}`}>
                    <Button variant="ghost" size="sm" className="p-2">
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </div>
          </Card>
        </div>
        
        {/* Subcategories */}
        {hasChildren && isExpanded && (
          <div className="mr-6 mb-4">
            {category.children!.map(child => renderCategory(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  if (isNativeMode) return <MobileCategories categories={categories} config={appConfig} loading={loading} />;

  // If custom page with sections exists, render it
  if (customPage && customPage.content?.sections && Array.isArray(customPage.content.sections)) {
    const sections = customPage.content.sections as Section[];
    return (
      <div className="min-h-screen bg-background">
        {sections.map((section, index) => (
          <SectionRenderer key={section.id || `section-${index}`} section={section} />
        ))}
      </div>
    );
  }

  // Default layout
  return (
    <div className="min-h-screen">
      <div className="container py-8">
        {/* Brands Section */}
        {brands.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <Tag className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold">العلامات التجارية</h2>
              <Badge variant="outline">{brands.length}</Badge>
            </div>
            <div className="flex flex-wrap gap-3">
              {brands.map((brand) => (
                <Link
                  key={brand.id}
                  to={`/products?brandId=${brand.id}`}
                  className="group"
                >
                  <Card className="px-4 py-2 hover:shadow-md hover:border-primary/50 transition-all">
                    <span className="font-medium group-hover:text-primary transition-colors">
                      {brand.name}
                      {brand.nameAr && brand.nameAr !== brand.name && (
                        <span className="text-muted-foreground mr-2">({brand.nameAr})</span>
                      )}
                    </span>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Categories Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <FolderOpen className="h-6 w-6 text-primary" />
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              {t('categories.title', 'التصنيفات')}
            </h1>
            {categories.length > 0 && (
              <Badge variant="outline">{categories.length}</Badge>
            )}
          </div>
          <p className="text-muted-foreground text-lg mb-8">تسوق حسب الفئة</p>
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
          <div className="space-y-2">
            {categories.map((category) => renderCategory(category))}
          </div>
        )}
      </div>
    </div>
  );
}
