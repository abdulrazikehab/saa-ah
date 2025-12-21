import { useEffect, useState } from 'react';
import { ProductCard } from '@/components/storefront/ProductCard';
import { coreApi } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { 
  Search, Loader2, Filter, SlidersHorizontal, Grid3x3, List,
  X, Package, Sparkles, TrendingUp, ChevronRight
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
import { Product, Category } from '@/services/types';
import { cn } from '@/lib/utils';

export default function Products() {
  const { t } = useTranslation();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []);

  const loadProducts = async () => {
    try {
      const data = await coreApi.getProducts({ limit: 50 });
      const rawProducts = Array.isArray(data) ? data : ((data as any).products || []);
      const validProducts = rawProducts.map((p: any) => ({
        ...p,
        price: Number(p.price) || 0,
        compareAtPrice: p.compareAtPrice ? Number(p.compareAtPrice) : undefined
      }));
      setProducts(validProducts);
    } catch (error) {
      console.error('Failed to load products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await coreApi.getCategories();
      setCategories(data);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  let filteredProducts = products.filter((product: Product) => {
    const matchesSearch = product.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPrice = product.price >= priceRange[0] && product.price <= priceRange[1];
    const matchesCategory = selectedCategories.length === 0 || 
      ((product as any).categories && (product as any).categories.some((cat: any) => selectedCategories.includes(cat.id || cat.category?.id))) ||
      (product.categoryId && selectedCategories.includes(product.categoryId));
    return matchesSearch && matchesPrice && matchesCategory;
  });

  filteredProducts = [...filteredProducts].sort((a: Product, b: Product) => {
    switch (sortBy) {
      case 'price-asc':
        return (a.price || 0) - (b.price || 0);
      case 'price-desc':
        return (b.price || 0) - (a.price || 0);
      case 'name-asc':
        return (a.name || '').localeCompare(b.name || '');
      case 'name-desc':
        return (b.name || '').localeCompare(a.name || '');
      default:
        return 0;
    }
  });

  const FilterSidebar = () => (
    <div className="space-y-8">
      {/* Categories */}
      <div>
        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
          <div className="p-2 rounded-lg gradient-primary">
            <Filter className="h-4 w-4 text-white" />
          </div>
          <span className="gradient-text">{t('storefront.products.categories')}</span>
        </h3>
        <div className="space-y-3">
          {categories.map((category, index) => (
            <div 
              key={category.id} 
              className="flex items-center justify-between group animate-slide-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-center gap-3">
                <Checkbox
                  id={category.id}
                  checked={selectedCategories.includes(category.id)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedCategories([...selectedCategories, category.id]);
                    } else {
                      setSelectedCategories(selectedCategories.filter(id => id !== category.id));
                    }
                  }}
                  className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                />
                <Label 
                  htmlFor={category.id} 
                  className="cursor-pointer group-hover:text-primary transition-colors font-medium"
                >
                  {category.name}
                </Label>
              </div>
              {(category as any).count !== undefined && (
                <Badge variant="outline" className="text-xs border-primary/30 text-primary">
                  {(category as any).count}
                </Badge>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
          <div className="p-2 rounded-lg gradient-secondary">
            <TrendingUp className="h-4 w-4 text-white" />
          </div>
          <span className="gradient-text-secondary">{t('storefront.products.priceRange')}</span>
        </h3>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <Label className="text-xs text-muted-foreground mb-1 block">{t('storefront.products.from')}</Label>
              <Input
                type="number"
                placeholder="0"
                value={priceRange[0]}
                onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
                className="border-2 focus:border-primary/50 rounded-xl"
              />
            </div>
            <span className="text-muted-foreground font-bold mt-5">-</span>
            <div className="flex-1">
              <Label className="text-xs text-muted-foreground mb-1 block">{t('storefront.products.to')}</Label>
              <Input
                type="number"
                placeholder="10000"
                value={priceRange[1]}
                onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                className="border-2 focus:border-primary/50 rounded-xl"
              />
            </div>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="px-2 py-1 rounded-lg bg-primary/10 text-primary font-semibold">
              {priceRange[0]} {t('common.currency')}
            </span>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
            <span className="px-2 py-1 rounded-lg bg-secondary/10 text-secondary font-semibold">
              {priceRange[1]} {t('common.currency')}
            </span>
          </div>
        </div>
      </div>

      {/* Reset Filters */}
      {(selectedCategories.length > 0 || priceRange[0] > 0 || priceRange[1] < 10000) && (
        <Button
          variant="outline"
          className="w-full rounded-xl border-2 border-destructive/50 text-destructive hover:bg-destructive/10 hover:border-destructive transition-all"
          onClick={() => {
            setSelectedCategories([]);
            setPriceRange([0, 10000]);
          }}
        >
          <X className="ml-2 h-4 w-4" />
          {t('storefront.products.clearFilters')}
        </Button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Page Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-mesh opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background" />
        
        <div className="container relative py-12">
          <div className="flex items-center gap-2 text-muted-foreground mb-4 animate-fade-in">
            <span>{t('storefront.products.home')}</span>
            <ChevronRight className="w-4 h-4" />
            <span className="text-foreground font-medium">{t('storefront.products.title')}</span>
          </div>
          
          <div className="flex items-center gap-4 mb-2 animate-slide-up">
            <div className="p-3 rounded-xl gradient-primary shadow-glow">
              <Package className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold gradient-text">
              {t('storefront.products.title')}
            </h1>
          </div>
          <p className="text-muted-foreground text-lg animate-slide-up animation-delay-200">
            {t('storefront.products.subtitle')}
          </p>
        </div>
      </div>

      <div className="container py-8">
        {/* Search and Controls */}
        <div className="mb-8 flex flex-col lg:flex-row gap-4 animate-slide-up animation-delay-400">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder={t('storefront.products.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-12 h-14 border-2 border-border/50 focus:border-primary/50 rounded-xl shadow-sm text-lg bg-card"
            />
          </div>

          <div className="flex gap-3">
            {/* Sort */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[200px] h-14 border-2 border-border/50 rounded-xl shadow-sm bg-card">
                <SelectValue placeholder={t('storefront.products.sortBy')} />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="newest">{t('storefront.products.newest')}</SelectItem>
                <SelectItem value="price-asc">{t('storefront.products.priceAsc')}</SelectItem>
                <SelectItem value="price-desc">{t('storefront.products.priceDesc')}</SelectItem>
                <SelectItem value="name-asc">{t('storefront.products.nameAsc')}</SelectItem>
                <SelectItem value="name-desc">{t('storefront.products.nameDesc')}</SelectItem>
              </SelectContent>
            </Select>

            {/* View Mode */}
            <div className="hidden md:flex border-2 border-border/50 rounded-xl overflow-hidden shadow-sm bg-card">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="icon"
                className={cn(
                  "rounded-none h-14 w-14 transition-all",
                  viewMode === 'grid' && "gradient-primary text-white"
                )}
                onClick={() => setViewMode('grid')}
              >
                <Grid3x3 className="h-5 w-5" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="icon"
                className={cn(
                  "rounded-none h-14 w-14 transition-all",
                  viewMode === 'list' && "gradient-primary text-white"
                )}
                onClick={() => setViewMode('list')}
              >
                <List className="h-5 w-5" />
              </Button>
            </div>

            {/* Mobile Filter */}
            <Sheet open={showFilters} onOpenChange={setShowFilters}>
              <SheetTrigger asChild>
                <Button variant="outline" className="lg:hidden h-14 border-2 rounded-xl shadow-sm">
                  <SlidersHorizontal className="ml-2 h-5 w-5" />
                  {t('storefront.products.filter')}
                  {selectedCategories.length > 0 && (
                    <Badge className="mr-2 gradient-primary text-white">
                      {selectedCategories.length}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[320px] glass-effect-strong">
                <SheetHeader>
                  <SheetTitle className="text-2xl gradient-text">{t('storefront.products.filters')}</SheetTitle>
                  <SheetDescription>
                    {t('storefront.products.filterDesc')}
                  </SheetDescription>
                </SheetHeader>
                <div className="mt-8">
                  <FilterSidebar />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        <div className="flex gap-8">
          {/* Desktop Filters Sidebar */}
          <aside className="hidden lg:block w-80 flex-shrink-0">
            <Card className="p-6 sticky top-24 border-2 border-border/30 shadow-xl rounded-2xl glass-effect">
              <FilterSidebar />
            </Card>
          </aside>

          {/* Products Grid */}
          <div className="flex-1">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-32 animate-fade-in">
                <div className="relative">
                  <div className="absolute inset-0 rounded-full gradient-primary blur-2xl opacity-30 animate-pulse" />
                  <Loader2 className="relative h-16 w-16 animate-spin text-primary mb-6" />
                </div>
                <p className="text-muted-foreground text-lg font-medium">{t('storefront.products.loading')}</p>
              </div>
            ) : filteredProducts.length > 0 ? (
              <>
                {/* Results Header */}
                <div className="mb-6 flex items-center justify-between p-5 glass-card rounded-2xl animate-slide-up">
                  <p className="text-muted-foreground text-lg flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    <span className="font-bold text-2xl gradient-text">
                      {filteredProducts.length}
                    </span>
                    {t('storefront.products.availableProducts')}
                  </p>
                  {(selectedCategories.length > 0 || searchQuery) && (
                    <div className="flex items-center gap-2 flex-wrap">
                      {searchQuery && (
                        <Badge 
                          variant="outline" 
                          className="gap-2 px-3 py-1.5 text-sm rounded-lg border-primary/30 bg-primary/5 cursor-pointer hover:bg-primary/10 transition-colors"
                          onClick={() => setSearchQuery('')}
                        >
                          {t('storefront.products.search')}: {searchQuery}
                          <X className="h-3 w-3 hover:text-destructive" />
                        </Badge>
                      )}
                      {selectedCategories.length > 0 && (
                        <Badge 
                          variant="outline" 
                          className="px-3 py-1.5 text-sm rounded-lg border-secondary/30 bg-secondary/5"
                        >
                          {selectedCategories.length} {t('storefront.products.selectedCategories')}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>

                {/* Products Grid */}
                <div className={
                  viewMode === 'grid'
                    ? 'grid sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6'
                    : 'space-y-6'
                }>
                  {filteredProducts.map((product: Product, index: number) => (
                    <ProductCard 
                      key={product.id} 
                      product={product} 
                      viewMode={viewMode}
                      index={index}
                    />
                  ))}
                </div>
              </>
            ) : (
              <Card className="p-16 text-center border-2 border-dashed border-border shadow-xl rounded-3xl glass-card animate-scale-in">
                <div className="relative inline-block mb-6">
                  <div className="absolute inset-0 rounded-full gradient-mesh blur-2xl opacity-50" />
                  <div className="relative p-6 rounded-full bg-muted/50">
                    <Package className="h-20 w-20 text-muted-foreground/30" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold mb-3">{t('storefront.products.noProducts')}</h3>
                <p className="text-muted-foreground mb-8 max-w-md mx-auto text-lg">
                  {searchQuery
                    ? t('storefront.products.noProductsDesc')
                    : t('storefront.products.noProductsEmpty')}
                </p>
                {(searchQuery || selectedCategories.length > 0) && (
                  <Button
                    size="lg"
                    className="rounded-xl gradient-primary text-white hover:shadow-glow transition-shadow"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategories([]);
                      setPriceRange([0, 10000]);
                    }}
                  >
                    <X className="ml-2 h-5 w-5" />
                    {t('storefront.products.clearFilters')}
                  </Button>
                )}
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
