import { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ProductCard } from '@/components/storefront/ProductCard';
import { coreApi } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { 
  Search, Filter, SlidersHorizontal, Grid3x3, List,
  X, Package, Sparkles, TrendingUp, ChevronRight, RefreshCw,
  Tag, Zap
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Product, Category, Page } from '@/services/types';
import { cn } from '@/lib/utils';
import { DataTablePagination } from '@/components/common/DataTablePagination';
import { StorefrontLoading } from '@/components/storefront/StorefrontLoading';
import { useStoreSettings } from '@/contexts/StoreSettingsContext';
import { formatCurrency } from '@/lib/currency-utils';
import { SectionRenderer } from '@/components/builder/SectionRenderer';
import { Section } from '@/components/builder/PageBuilder';

export default function Products() {
  const { t, i18n } = useTranslation();
  const { settings } = useStoreSettings();
  const [searchParams] = useSearchParams();
  const isRtl = i18n.language === 'ar';
  
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [customPage, setCustomPage] = useState<Page | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);

  useEffect(() => {
    loadData();
    
    // Listen for product updates
    const handleProductsUpdate = () => {
      loadData();
    };
    
    window.addEventListener('productsUpdated', handleProductsUpdate);
    return () => {
      window.removeEventListener('productsUpdated', handleProductsUpdate);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const query = searchParams.get('search');
    if (query !== null) {
      setSearchQuery(query);
    }
  }, [searchParams]);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, priceRange, selectedCategories, selectedBrands, sortBy]);

  const loadData = async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true);
      else setLoading(true);
      
      // Try to fetch custom page for products
      try {
        const customProductsPage = await coreApi.getPageBySlug('products');
        if (customProductsPage && customProductsPage.isPublished && 
            customProductsPage.content?.sections && 
            Array.isArray(customProductsPage.content.sections) && 
            customProductsPage.content.sections.length > 0) {
          setCustomPage(customProductsPage);
        }
      } catch (e) {
        // No custom page found, continue with default layout
      }
      
      const [productsData, categoriesData, brandsData] = await Promise.all([
        coreApi.getProducts({ limit: 1000 }),
        coreApi.getCategories({ limit: 1000 }),
        coreApi.getBrands({ limit: 1000 })
      ]);
      
      // Process Products
      const rawProducts = Array.isArray(productsData) 
        ? productsData 
        : ((productsData as any)?.data || (productsData as any)?.products || []);
      
      const validProducts = rawProducts.map((p: any) => ({
        ...p,
        price: Number(p.price) || 0,
        compareAtPrice: p.compareAtPrice ? Number(p.compareAtPrice) : undefined,
        isAvailable: (p.isAvailable !== false && p.isAvailable !== undefined) ? true : false,
        isPublished: (p.isPublished !== false && p.isPublished !== undefined) ? true : false,
      })).filter((p: any) => p.isAvailable && p.isPublished);
      
      setProducts(validProducts);

      // Process Categories
      let categoriesList: Category[] = [];
      if (Array.isArray(categoriesData)) {
        categoriesList = categoriesData;
      } else if (categoriesData && typeof categoriesData === 'object' && 'categories' in categoriesData) {
        categoriesList = Array.isArray((categoriesData as any).categories) ? (categoriesData as any).categories : [];
      }
      setCategories(categoriesList);

      // Process Brands
      const processedBrands = Array.isArray(brandsData) ? brandsData : (brandsData as any)?.data || [];
      
      // Fallback: If brands array is empty, try to extract brands from products
      if (processedBrands.length === 0 && validProducts.length > 0) {
        const brandsFromProducts = validProducts
          .filter((p: any) => p.brand && p.brand.id)
          .map((p: any) => p.brand);
        
        // Unique brands by ID
        const uniqueBrands = Array.from(new Map(brandsFromProducts.map((b: any) => [b.id, b])).values());
        setBrands(uniqueBrands);
      } else {
        setBrands(processedBrands);
      }
      
    } catch (error) {
      console.error('❌ Failed to load products data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    loadData(true);
  };

  const filteredProducts = useMemo(() => {
    let result = products.filter((product: Product) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery || 
        product.name?.toLowerCase().includes(q) || 
        product.nameAr?.toLowerCase().includes(q) ||
        product.sku?.toLowerCase().includes(q);
      const matchesPrice = product.price >= priceRange[0] && product.price <= priceRange[1];
      
      // Category matching
      let matchesCategory = true;
      if (selectedCategories.length > 0) {
        const productCategories = (product as any).categories || [];
        matchesCategory = productCategories.some((cat: any) => {
          const catId = cat.categoryId || cat.id || cat.category?.id;
          return selectedCategories.includes(catId);
        }) || (product.categoryId && selectedCategories.includes(product.categoryId));
      }

      // Brand matching
      let matchesBrand = true;
      if (selectedBrands.length > 0) {
        matchesBrand = product.brandId && selectedBrands.includes(product.brandId);
      }
      
      return matchesSearch && matchesPrice && matchesCategory && matchesBrand;
    });

    // Sort
    result = [...result].sort((a: any, b: any) => {
      switch (sortBy) {
        case 'price-asc': return (a.price || 0) - (b.price || 0);
        case 'price-desc': return (b.price || 0) - (a.price || 0);
        case 'name-asc': return (a.name || '').localeCompare(b.name || '');
        case 'name-desc': return (b.name || '').localeCompare(a.name || '');
        case 'newest': return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        default: return 0;
      }
    });

    return result;
  }, [products, searchQuery, priceRange, selectedCategories, selectedBrands, sortBy]);

  // Calculate pagination
  const totalItems = filteredProducts.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const FilterSidebar = () => (
    <div className="space-y-10">
      {/* Categories */}
      <div>
        <h3 className="font-black text-xl mb-6 flex items-center gap-3">
          <div className="p-2.5 rounded-2xl gradient-primary shadow-lg shadow-primary/20">
            <Filter className="h-4.5 w-4.5 text-white" />
          </div>
          <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            {t('storefront.products.categories')}
          </span>
        </h3>
        <div className="space-y-3.5 pl-1 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
          {categories.length > 0 ? categories.map((category, index) => (
            <div 
              key={category.id} 
              className="flex items-center justify-between group animate-slide-up"
              style={{ animationDelay: `${index * 40}ms` }}
            >
              <div className="flex items-center gap-3.5">
                <Checkbox
                  id={category.id}
                  checked={selectedCategories.includes(category.id)}
                  onCheckedChange={(checked) => {
                    if (checked) setSelectedCategories([...selectedCategories, category.id]);
                    else setSelectedCategories(selectedCategories.filter(id => id !== category.id));
                  }}
                  className="w-5 h-5 rounded-md border-2 data-[state=checked]:bg-primary data-[state=checked]:border-primary transition-all"
                />
                <Label 
                  htmlFor={category.id} 
                  className="cursor-pointer group-hover:text-primary transition-colors font-bold text-base opacity-85 group-hover:opacity-100"
                >
                  {isRtl ? (category.nameAr || category.name) : (category.name || category.nameAr)}
                </Label>
              </div>
            </div>
          )) : (
            <p className="text-sm text-muted-foreground/60 italic py-2">
              {t('storefront.products.noCategories')}
            </p>
          )}
        </div>
      </div>

      {/* Brands */}
      {brands.length > 0 && (
        <div>
          <h3 className="font-black text-xl mb-6 flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-500 shadow-lg shadow-indigo-200">
              <Tag className="h-4.5 w-4.5 text-white" />
            </div>
            <span className="text-indigo-600">{isRtl ? 'الماركات' : 'Brands'}</span>
          </h3>
        <div className="space-y-3.5 pl-1 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
            {brands.map((brand, index) => (
              <div 
                key={brand.id} 
                className="flex items-center justify-between group animate-slide-up"
                style={{ animationDelay: `${index * 40}ms` }}
              >
                <div className="flex items-center gap-3.5">
                  <Checkbox
                    id={`brand-${brand.id}`}
                    checked={selectedBrands.includes(brand.id)}
                    onCheckedChange={(checked) => {
                      if (checked) setSelectedBrands([...selectedBrands, brand.id]);
                      else setSelectedBrands(selectedBrands.filter(id => id !== brand.id));
                    }}
                    className="w-5 h-5 rounded-md border-2 border-indigo-200 data-[state=checked]:bg-indigo-500 data-[state=checked]:border-indigo-500 transition-all"
                  />
                  <Label 
                    htmlFor={`brand-${brand.id}`} 
                    className="cursor-pointer group-hover:text-indigo-600 transition-colors font-bold text-base opacity-85 group-hover:opacity-100"
                  >
                    {isRtl ? (brand.nameAr || brand.name) : (brand.name || brand.nameAr || brand.id)}
                  </Label>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Price Range */}
      <div>
        <h3 className="font-black text-xl mb-6 flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-orange-500 shadow-lg shadow-orange-200">
            <TrendingUp className="h-4.5 w-4.5 text-white" />
          </div>
          <span className="text-orange-600">{t('storefront.products.priceRange')}</span>
        </h3>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Label className="text-[11px] font-black uppercase text-muted-foreground/60 mb-2 block tracking-wider">{t('storefront.products.from')}</Label>
              <Input
                type="number"
                value={priceRange[0]}
                onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
                className="h-12 border-2 focus:border-orange-500/50 rounded-2xl font-black bg-orange-50/20"
              />
            </div>
            <span className="text-muted-foreground font-black mt-8 opacity-30 text-xl">-</span>
            <div className="flex-1">
              <Label className="text-[11px] font-black uppercase text-muted-foreground/60 mb-2 block tracking-wider">{t('storefront.products.to')}</Label>
              <Input
                type="number"
                value={priceRange[1]}
                onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                className="h-12 border-2 focus:border-orange-500/50 rounded-2xl font-black bg-orange-50/20"
              />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="px-4 py-2 rounded-xl border-orange-200 bg-orange-50/50 text-orange-700 font-bold">
              {formatCurrency(priceRange[0], settings?.currency || 'SAR')}
            </Badge>
            <Badge variant="outline" className="px-4 py-2 rounded-xl border-orange-200 bg-orange-50/50 text-orange-700 font-bold">
              {formatCurrency(priceRange[1], settings?.currency || 'SAR')}
            </Badge>
          </div>
        </div>
      </div>

      {/* Reset Filters */}
      {(selectedCategories.length > 0 || selectedBrands.length > 0 || priceRange[0] > 0 || priceRange[1] < 10000) && (
        <Button
          variant="outline"
          className="w-full h-14 rounded-2xl border-2 border-destructive/20 text-destructive hover:bg-destructive/10 hover:border-destructive/40 transition-all font-black text-base shadow-sm"
          onClick={() => {
            setSelectedCategories([]);
            setSelectedBrands([]);
            setPriceRange([0, 10000]);
            setSearchQuery('');
          }}
        >
          <X className="ml-3 h-5 w-5" />
          {t('storefront.products.clearFilters')}
        </Button>
      )}
    </div>
  );

  if (loading) return <StorefrontLoading />;

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
    <div className="min-h-screen bg-background text-foreground">
      {/* Dynamic Mesh Background Header */}
      <div className="relative pt-16 pb-24 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full gradient-mesh opacity-10 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-background" />
        
        <div className="container relative">
          <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground/70 mb-8 animate-fade-in group">
            <span className="hover:text-primary transition-colors cursor-pointer">{t('storefront.products.home')}</span>
            <ChevronRight className="w-4 h-4 opacity-50" />
            <span className="text-primary">{t('storefront.products.title')}</span>
          </div>
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-10">
            <div className="space-y-4 animate-slide-up">
              <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary font-black text-xs uppercase tracking-[0.2em] shadow-sm">
                <Sparkles className="w-4 h-4 fill-current" />
                {t('storefront.products.discover')}
              </div>
              <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[1.1]">
                {t('storefront.products.title')} <br/>
                <span className="gradient-text">{isRtl ? 'بأسلوب جديد' : 'New Style'}</span>
              </h1>
              <p className="text-xl text-muted-foreground/80 max-w-2xl leading-relaxed">
                {t('storefront.products.subtitle')}
              </p>
            </div>

            <div className="flex shrink-0 animate-scale-in">
               <Card className="p-1 border-none shadow-2xl rounded-[2.5rem] bg-gradient-to-br from-primary to-secondary p-[2px]">
                 <div className="bg-card rounded-[2.4rem] px-10 py-8 text-center flex flex-col items-center">
                    <span className="text-5xl font-black gradient-text leading-tight">{products.length}</span>
                    <span className="text-xs font-black uppercase text-muted-foreground tracking-widest mt-1">
                      {isRtl ? 'منتج مميز' : 'Premium Items'}
                    </span>
                 </div>
               </Card>
            </div>
          </div>
        </div>
      </div>

      <div className="container pb-32">
        {/* Modern Toolbar */}
        <div className="mb-12 flex flex-col xl:flex-row gap-6 items-stretch animate-slide-up">
          {/* Search Bar - Premium Style */}
          <div className="relative flex-1 group">
          <div className="absolute inset-0 bg-primary/20 blur-2xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500 rounded-3xl pointer-events-none z-0" />
          <Search className={cn(
            "absolute top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground transition-colors group-focus-within:text-primary pointer-events-none z-20",
            isRtl ? "left-6" : "right-6"
          )} />
          <Input
            placeholder={t('storefront.products.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={cn(
              "h-16 border-2 border-border/40 focus:border-primary/50 rounded-[1.8rem] shadow-xl text-xl bg-card font-medium transition-all relative z-10",
              isRtl ? "pl-16 pr-6" : "pr-16 pl-6"
            )}
          />
          </div>

          <div className="flex flex-wrap gap-4 items-center">
            {/* Action Buttons */}
            <Button
              onClick={handleRefresh}
              disabled={refreshing}
              variant="outline"
              className="h-16 px-8 border-2 border-border/40 rounded-[1.5rem] shadow-lg bg-card hover:bg-muted font-black transition-all active:scale-95"
            >
              <RefreshCw className={cn("h-5 w-5 ml-4 text-primary", refreshing && "animate-spin")} />
              {refreshing ? t('common.refreshing') : t('common.refresh')}
            </Button>
            
            {/* Sort Dropdown */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[220px] h-16 border-2 border-border/40 rounded-[1.5rem] shadow-lg bg-card font-black">
                <SelectValue placeholder={t('storefront.products.sortBy')} />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-border/40">
                <SelectItem value="newest" className="font-bold py-3">{isRtl ? 'الأحدث أولاً' : t('storefront.products.newest')}</SelectItem>
                <SelectItem value="price-asc" className="font-bold py-3">{t('storefront.products.priceAsc')}</SelectItem>
                <SelectItem value="price-desc" className="font-bold py-3">{t('storefront.products.priceDesc')}</SelectItem>
                <SelectItem value="name-asc" className="font-bold py-3">{t('storefront.products.nameAsc')}</SelectItem>
                <SelectItem value="name-desc" className="font-bold py-3">{t('storefront.products.nameDesc')}</SelectItem>
              </SelectContent>
            </Select>

            {/* View Mode Toggler */}
            <div className="hidden md:flex p-1 border-2 border-border/40 rounded-[1.5rem] shadow-lg bg-card overflow-hidden">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="icon"
                className={cn(
                  "rounded-2xl h-14 w-14 transition-all duration-500",
                  viewMode === 'grid' && "gradient-primary text-white shadow-lg"
                )}
                onClick={() => setViewMode('grid')}
              >
                <Grid3x3 className="h-6 w-6" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="icon"
                className={cn(
                  "rounded-2xl h-14 w-14 transition-all duration-500",
                  viewMode === 'list' && "gradient-primary text-white shadow-lg"
                )}
                onClick={() => setViewMode('list')}
              >
                <List className="h-6 w-6" />
              </Button>
            </div>

            {/* Mobile Filter Sheet */}
            <Sheet open={showFilters} onOpenChange={setShowFilters}>
              <SheetTrigger asChild>
                <Button variant="outline" className="lg:hidden h-16 px-6 border-2 rounded-[1.5rem] shadow-lg bg-card font-black flex items-center gap-3">
                  <SlidersHorizontal className="h-6 w-6 text-primary" />
                  {t('storefront.products.filter')}
                  {(selectedCategories.length > 0 || selectedBrands.length > 0) && (
                    <Badge className="px-2 py-0.5 min-w-[24px] h-6 rounded-full gradient-primary border-none text-white scale-90">
                      {selectedCategories.length + selectedBrands.length}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[350px] sm:w-[400px] rounded-l-[3rem] border-none shadow-2xl pt-12">
                <SheetHeader className="mb-10 text-right">
                  <SheetTitle className="text-3xl font-black bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                    {t('storefront.products.filters')}
                  </SheetTitle>
                  <SheetDescription className="text-lg font-bold text-muted-foreground/60">
                    {t('storefront.products.filterDesc')}
                  </SheetDescription>
                </SheetHeader>
                <div className="pr-2">
                  <FilterSidebar />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        <div className="flex gap-12">
          {/* Desktop Sidebar - Premium Glassy Look */}
          <aside className="hidden lg:block w-[340px] flex-shrink-0">
             <div className="sticky top-28">
                <div className="absolute inset-0 bg-primary/5 blur-3xl rounded-[3rem] opacity-30 pointer-events-none" />
                <Card className="p-10 border-2 border-border/30 shadow-[0_20px_50px_rgba(0,0,0,0.08)] rounded-[2.5rem] glass-card relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 pointer-events-none transition-transform duration-1000 group-hover:scale-110" />
                  <FilterSidebar />
                </Card>
             </div>
          </aside>

          {/* Result Content */}
          <div className="flex-1 min-w-0">
            {filteredProducts.length > 0 ? (
              <div className="space-y-12">
                {/* Status Bar */}
                <div className="flex flex-col sm:flex-row items-center justify-between p-8 glass-card rounded-[2.5rem] border-2 border-border/30 animate-slide-up shadow-xl overflow-hidden relative">
                   <div className="absolute top-0 left-0 w-2 h-full gradient-primary" />
                   <div className="flex items-center gap-5 relative z-10 transition-transform hover:translate-x-1 duration-500">
                      <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center shadow-glow">
                         <Zap className="w-7 h-7 text-white fill-current animate-pulse" />
                      </div>
                      <div>
                         <div className="flex items-baseline gap-1">
                            <span className="text-4xl font-black gradient-text">{totalItems}</span>
                            <span className="text-lg font-black text-muted-foreground/80">{t('storefront.products.availableProducts')}</span>
                         </div>
                         <p className="text-sm font-bold text-muted-foreground/50">{isRtl ? 'تم تحديث القائمة للتو' : 'List just updated'}</p>
                      </div>
                   </div>

                   {(selectedCategories.length > 0 || selectedBrands.length > 0 || searchQuery) && (
                     <div className="flex flex-wrap gap-2.5 mt-6 sm:mt-0 justify-center sm:justify-end">
                        {searchQuery && (
                          <Badge variant="secondary" className="px-5 py-2.5 rounded-2xl h-11 text-base font-black bg-muted/50 border-2 hover:bg-destructive/10 hover:text-destructive transition-all cursor-pointer group" onClick={() => setSearchQuery('')}>
                            {searchQuery}
                            <X className="mr-3 h-4 w-4 opacity-50 group-hover:opacity-100" />
                          </Badge>
                        )}
                        {(selectedCategories.length > 0 || selectedBrands.length > 0) && (
                          <Badge variant="secondary" className="px-5 py-2.5 rounded-2xl h-11 text-base font-black bg-primary/10 text-primary border-primary/20">
                            {selectedCategories.length + selectedBrands.length} {isRtl ? 'تصنيفات مختارة' : 'Filters Active'}
                          </Badge>
                        )}
                     </div>
                   )}
                </div>

                {/* Main Grid */}
                <div className={cn(
                  "animate-slide-up transition-all duration-700",
                  viewMode === 'grid'
                    ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3 gap-10'
                    : 'flex flex-col gap-10'
                )}>
                  {paginatedProducts.map((product, index) => (
                    <ProductCard 
                      key={product.id} 
                      product={product} 
                      viewMode={viewMode}
                      index={index}
                    />
                  ))}
                </div>

                {/* Premium Pagination */}
                {totalPages > 1 && (
                  <div className="mt-20 flex justify-center scale-110">
                    <DataTablePagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      totalItems={totalItems}
                      itemsPerPage={itemsPerPage}
                      onPageChange={setCurrentPage}
                      onItemsPerPageChange={setItemsPerPage}
                      itemsPerPageOptions={[12, 24, 48, 96]}
                    />
                  </div>
                )}
              </div>
            ) : (
              <Card className="p-24 text-center border-3 border-dashed border-border/50 shadow-2xl rounded-[4rem] glass-card animate-scale-in relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 opacity-50" />
                <div className="relative z-10">
                  <div className="relative inline-block mb-10">
                    <div className="absolute inset-0 rounded-full bg-primary/20 blur-[60px] animate-pulse" />
                    <div className="relative p-12 rounded-[3.5rem] bg-card/80 backdrop-blur-xl border-4 border-white transform transition-transform duration-700 group-hover:rotate-12">
                      <Package className="h-28 w-28 text-primary shadow-xl" />
                    </div>
                  </div>
                  <h3 className="text-5xl font-black mb-6 tracking-tight">{t('storefront.products.noProducts')}</h3>
                  <p className="text-2xl text-muted-foreground/60 mb-14 max-w-xl mx-auto font-medium leading-relaxed">
                    {searchQuery
                      ? t('storefront.products.noProductsDesc')
                      : t('storefront.products.noProductsEmpty')}
                  </p>
                  {(searchQuery || selectedCategories.length > 0 || selectedBrands.length > 0) && (
                    <Button
                      size="lg"
                      className="h-20 px-14 rounded-[2rem] gradient-primary text-xl font-black text-white hover:shadow-glow transition-all active:scale-95 group"
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedCategories([]);
                        setSelectedBrands([]);
                        setPriceRange([0, 10000]);
                      }}
                    >
                      <X className="ml-4 h-7 w-7 transition-transform group-hover:rotate-90 duration-500" />
                      {t('storefront.products.clearFilters')}
                    </Button>
                  )}
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
      
      {/* Decorative Floating Elements */}
      <div className="fixed top-1/4 -left-20 w-80 h-80 bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-1/4 -right-20 w-80 h-80 bg-secondary/10 rounded-full blur-[120px] pointer-events-none" />
    </div>
  );
}
