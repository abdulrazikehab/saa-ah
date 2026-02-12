import { useEffect, useState, useMemo } from 'react';
import { Capacitor } from '@capacitor/core';
import MobileCategoryDetail from '@/pages/mobile/MobileCategoryDetail';
import { useParams, Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { coreApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { 
  Loader2, ArrowLeft, Package, FolderOpen, ArrowRight, 
  ChevronLeft, ChevronRight, Search, Filter, SlidersHorizontal,
  X, Grid3x3, List, TrendingUp, Sparkles, RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductCard } from '@/components/storefront/ProductCard';
import { Badge } from '@/components/ui/badge';
import { Product } from '@/services/types';
import { useTranslation } from 'react-i18next';
import { BRAND_NAME_AR, BRAND_NAME_EN } from '@/config/logo.config';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

import { StorefrontLoading } from '@/components/storefront/StorefrontLoading';
import { cn } from '@/lib/utils';
import { DataTablePagination } from '@/components/common/DataTablePagination';

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
  const isRtl = i18n.language === 'ar';
  
  const [category, setCategory] = useState<Category | null>(null);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);

  const isNativeMode = Capacitor.isNativePlatform() || window.location.href.includes('platform=mobile') || sessionStorage.getItem('isMobilePlatform') === 'true';


  useEffect(() => {
    if (isNativeMode) return;
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

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, priceRange, selectedSubcategories, sortBy]);

  const loadCategoryAndProducts = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      
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
      
      // Load products in this category (Fetch all for client-side filtering/pagination for now)
      const productsData = await coreApi.getProducts({ 
        categoryId: id,
        limit: 1000
      });
      
      const productsList = Array.isArray(productsData) 
        ? productsData 
        : ((productsData as any)?.data || (productsData as any)?.products || []);
      
      // Normalize and filter
      const processedProducts = productsList.map((p: any) => ({
        ...p,
        price: Number(p.price) || 0,
        compareAtPrice: p.compareAtPrice ? Number(p.compareAtPrice) : undefined,
        isAvailable: (p.isAvailable !== false && p.isAvailable !== undefined) ? true : false,
        isPublished: (p.isPublished !== false && p.isPublished !== undefined) ? true : false,
      })).filter((p: any) => p.isAvailable && p.isPublished);
      
      setProducts(processedProducts as Product[]);
    } catch (error) {
      console.error('Failed to load category:', error);
      toast({
        title: isRtl ? 'تعذر تحميل التصنيف' : 'Failed to load category',
        description: isRtl ? 'حدث خطأ أثناء تحميل بيانات التصنيف. يرجى المحاولة مرة أخرى.' : 'An error occurred while loading category data.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Filter and Sort Logic
  const filteredProducts = useMemo(() => {
    let result = products.filter(product => {
      const matchesSearch = !searchQuery || product.name?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesPrice = product.price >= priceRange[0] && product.price <= priceRange[1];
      
      let matchesSubcategory = true;
      if (selectedSubcategories.length > 0) {
        matchesSubcategory = selectedSubcategories.includes(product.categoryId || '');
      }
      
      return matchesSearch && matchesPrice && matchesSubcategory;
    });

    // Sort
    result = [...result].sort((a, b) => {
      const aVal = a as any;
      const bVal = b as any;
      switch (sortBy) {
        case 'price-asc': return (a.price || 0) - (b.price || 0);
        case 'price-desc': return (b.price || 0) - (a.price || 0);
        case 'name-asc': return (a.name || '').localeCompare(b.name || '');
        case 'name-desc': return (b.name || '').localeCompare(a.name || '');
        case 'newest': return new Date(bVal.createdAt || 0).getTime() - new Date(aVal.createdAt || 0).getTime();
        default: return 0;
      }
    });

    return result;
  }, [products, searchQuery, priceRange, selectedSubcategories, sortBy]);

  // Pagination meta
  const totalItems = filteredProducts.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getBreadcrumbs = () => {
    if (!category) return [];
    const path = [];
    let currentId = category.parentId;
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

  const FilterSidebar = () => (
    <div className="space-y-8">
      {/* Subcategories */}
      {subcategories.length > 0 && (
        <div>
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <div className="p-2 rounded-lg gradient-primary bg-primary">
              <FolderOpen className="h-4 w-4 text-white" />
            </div>
            <span className="gradient-text">{isRtl ? 'التصنيفات الفرعية' : 'Subcategories'}</span>
          </h3>
          <div className="space-y-3">
            {subcategories.map((subcat, index) => (
              <div key={subcat.id} className="flex items-center justify-between group animate-slide-up" style={{ animationDelay: `${index * 50}ms` }}>
                <div className="flex items-center gap-3">
                  <Checkbox
                    id={subcat.id}
                    checked={selectedSubcategories.includes(subcat.id)}
                    onCheckedChange={(checked) => {
                      if (checked) setSelectedSubcategories([...selectedSubcategories, subcat.id]);
                      else setSelectedSubcategories(selectedSubcategories.filter(id => id !== subcat.id));
                    }}
                  />
                  <Label htmlFor={subcat.id} className="cursor-pointer group-hover:text-primary transition-colors font-medium">
                    {subcat.name}
                  </Label>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Price Range */}
      <div>
        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
          <div className="p-2 rounded-lg bg-orange-500">
            <TrendingUp className="h-4 w-4 text-white" />
          </div>
          <span className="text-orange-600">{isRtl ? 'نطاق السعر' : 'Price Range'}</span>
        </h3>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <Label className="text-xs text-muted-foreground mb-1 block">{isRtl ? 'من' : 'From'}</Label>
              <Input
                type="number"
                value={priceRange[0]}
                onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
                className="rounded-xl"
              />
            </div>
            <span className="mt-5 text-muted-foreground">-</span>
            <div className="flex-1">
              <Label className="text-xs text-muted-foreground mb-1 block">{isRtl ? 'إلى' : 'To'}</Label>
              <Input
                type="number"
                value={priceRange[1]}
                onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                className="rounded-xl"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Reset */}
      {(selectedSubcategories.length > 0 || priceRange[0] > 0 || priceRange[1] < 10000) && (
        <Button
          variant="outline"
          className="w-full rounded-xl border-destructive/50 text-destructive hover:bg-destructive/10"
          onClick={() => {
            setSelectedSubcategories([]);
            setPriceRange([0, 10000]);
          }}
        >
          <X className="ml-2 h-4 w-4" />
          {isRtl ? 'إعادة تعيين' : 'Reset Filters'}
        </Button>
      )}
    </div>
  );

  if (loading) return <StorefrontLoading />;

  if (!category) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container py-20">
          <Card className="p-12 text-center border-0 shadow-lg glass-effect">
            <Package className="h-20 w-20 mx-auto text-gray-400 mb-4" />
            <h2 className="text-2xl font-bold mb-2">{isRtl ? 'التصنيف غير موجود' : 'Category not found'}</h2>
            <Link to="/categories">
              <Button className="gradient-primary mt-4">{isRtl ? 'العودة للتصنيفات' : 'Back to Categories'}</Button>
            </Link>
          </Card>
        </div>
      </div>
    );
  }

  const breadcrumbs = getBreadcrumbs();
  const SeparatorIcon = isRtl ? ChevronLeft : ChevronRight;

  if (isNativeMode) return <MobileCategoryDetail />;

  return (
    <div className="min-h-screen bg-background">
      {/* Premium Header Section */}
      <div className="relative overflow-hidden pt-12 pb-20">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-background" />
        <div className="container relative">
          {/* Breadcrumb */}
          <div className="mb-8 flex items-center flex-wrap gap-2 text-sm text-muted-foreground animate-fade-in">
            <Link to="/" className="hover:text-primary transition-colors font-medium">
              {isRtl ? BRAND_NAME_AR : BRAND_NAME_EN}
            </Link>
            <SeparatorIcon className="h-4 w-4" />
            <Link to="/categories" className="hover:text-primary transition-colors">
              {t('nav.categories', isRtl ? 'التصنيفات' : 'Categories')}
            </Link>
            {breadcrumbs.map((cat) => (
              <div key={cat.id} className="flex items-center gap-2">
                <SeparatorIcon className="h-4 w-4" />
                <Link to={`/categories/${cat.id}`} className="hover:text-primary transition-colors">
                  {cat.name}
                </Link>
              </div>
            ))}
            <SeparatorIcon className="h-4 w-4" />
            <span className="text-primary font-bold">{category.name}</span>
          </div>

          <div className="flex flex-col md:flex-row gap-10 items-start md:items-center">
            {category.image && (
              <div className="w-32 h-32 md:w-48 md:h-48 rounded-3xl overflow-hidden shadow-2xl border-4 border-white dark:border-gray-800 shrink-0 transform -rotate-3 hover:rotate-0 transition-transform duration-500">
                <img src={category.image} alt={category.name} className="w-full h-full object-cover" />
              </div>
            )}
            <div className="flex-1">
              <h1 className="text-4xl md:text-6xl font-black mb-4 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                {category.name}
              </h1>
              {category.description && (
                <p className="text-xl text-muted-foreground max-w-2xl leading-relaxed">
                  {category.description}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-4 mt-8">
                <Badge variant="secondary" className="px-4 py-1.5 rounded-full text-base font-medium">
                  <Package className="w-4 h-4 ml-2" />
                  {products.length} {isRtl ? 'منتج متاح' : 'products'}
                </Badge>
                {subcategories.length > 0 && (
                  <Badge variant="outline" className="px-4 py-1.5 rounded-full text-base font-medium border-primary/30 text-primary">
                    <FolderOpen className="w-4 h-4 ml-2" />
                    {subcategories.length} {isRtl ? 'تصنيف فرعي' : 'subcategories'}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container pb-24">
        {/* Controls Bar */}
        <div className="mb-10 flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder={isRtl ? 'ابحث في هذا التصنيف...' : 'Search in this category...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-12 h-14 border-2 rounded-2xl bg-card"
            />
          </div>

          <div className="flex gap-3">
             <Button
              onClick={() => loadCategoryAndProducts(true)}
              disabled={refreshing}
              variant="outline"
              className="h-14 px-6 border-2 rounded-2xl"
            >
              <RefreshCw className={cn("h-4 w-4 ml-2", refreshing && "animate-spin")} />
              {isRtl ? 'تحديث' : 'Refresh'}
            </Button>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px] h-14 border-2 rounded-2xl">
                <SelectValue placeholder={t('storefront.products.sortBy')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">{isRtl ? 'الأحدث' : 'Newest'}</SelectItem>
                <SelectItem value="price-asc">{isRtl ? 'السعر: من الأقل' : 'Price: Low to High'}</SelectItem>
                <SelectItem value="price-desc">{isRtl ? 'السعر: من الأعلى' : 'Price: High to Low'}</SelectItem>
                <SelectItem value="name-asc">{isRtl ? 'الاسم: أ-ي' : 'Name: A-Z'}</SelectItem>
              </SelectContent>
            </Select>

            <div className="hidden md:flex border-2 rounded-2xl overflow-hidden">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="icon"
                className={cn("h-14 w-14 rounded-none", viewMode === 'grid' && "bg-primary text-white")}
                onClick={() => setViewMode('grid')}
              >
                <Grid3x3 className="h-5 w-5" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="icon"
                className={cn("h-14 w-14 rounded-none", viewMode === 'list' && "bg-primary text-white")}
                onClick={() => setViewMode('list')}
              >
                <List className="h-5 w-5" />
              </Button>
            </div>

            <Sheet open={showFilters} onOpenChange={setShowFilters}>
              <SheetTrigger asChild>
                <Button variant="outline" className="lg:hidden h-14 border-2 rounded-2xl">
                  <SlidersHorizontal className="ml-2 h-5 w-5" />
                  {isRtl ? 'تصفية' : 'Filter'}
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <SheetHeader>
                  <SheetTitle>{isRtl ? 'خيارات التصفية' : 'Filter Options'}</SheetTitle>
                </SheetHeader>
                <div className="mt-10">
                  <FilterSidebar />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        <div className="flex gap-10">
          <aside className="hidden lg:block w-72 shrink-0">
            <Card className="p-8 sticky top-24 border-2 shadow-xl rounded-3xl glass-card">
              <FilterSidebar />
            </Card>
          </aside>

          <div className="flex-1">
            {totalItems > 0 ? (
              <>
                <div className="mb-6 flex items-center justify-between p-4 bg-muted/30 rounded-2xl">
                  <p className="text-muted-foreground font-medium">
                    <Sparkles className="w-4 h-4 inline ml-2 text-primary" />
                    {isRtl ? 'عرض' : 'Showing'} <span className="text-foreground font-bold">{paginatedProducts.length}</span> {isRtl ? 'من أصل' : 'of'} <span className="text-foreground font-bold">{totalItems}</span> {isRtl ? 'منتج' : 'products'}
                  </p>
                </div>

                <div className={cn(
                  viewMode === 'grid' 
                    ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8" 
                    : "flex flex-col gap-6"
                )}>
                  {paginatedProducts.map((product, index) => (
                    <ProductCard key={product.id} product={product} viewMode={viewMode} index={index} />
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="mt-12">
                    <DataTablePagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      totalItems={totalItems}
                      itemsPerPage={itemsPerPage}
                      onPageChange={setCurrentPage}
                      onItemsPerPageChange={setItemsPerPage}
                      itemsPerPageOptions={[12, 24, 48]}
                    />
                  </div>
                )}
              </>
            ) : (
              <Card className="p-20 text-center border-2 border-dashed shadow-sm rounded-3xl">
                <Package className="h-20 w-20 mx-auto text-muted-foreground/30 mb-6" />
                <h3 className="text-2xl font-bold mb-2">{isRtl ? 'لا توجد منتجات' : 'No products found'}</h3>
                <p className="text-muted-foreground mb-8">{isRtl ? 'جرب تغيير خيارات التصفية أو ابحث عن شيء آخر.' : 'Try adjusting your filters or search for something else.'}</p>
                <Button variant="outline" onClick={() => {
                   setSearchQuery('');
                   setSelectedSubcategories([]);
                   setPriceRange([0, 10000]);
                }} className="rounded-xl">
                  <X className="ml-2 h-4 w-4" />
                  {isRtl ? 'إلغاء جميع الفلاتر' : 'Clear all filters'}
                </Button>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

