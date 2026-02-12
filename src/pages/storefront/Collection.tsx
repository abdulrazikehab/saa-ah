import { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { coreApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { 
  Package, Search, Filter, SlidersHorizontal, X, Grid3x3, List,
  TrendingUp, Sparkles, RefreshCw, ChevronLeft, ChevronRight, Zap, ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductCard } from '@/components/storefront/ProductCard';
import { Badge } from '@/components/ui/badge';
import { Product, ProductCollection as CollectionType } from '@/services/types';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
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

export default function Collection() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  
  const [collection, setCollection] = useState<CollectionType | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);

  useEffect(() => {
    if (id) {
      loadCollection(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, priceRange, sortBy]);

  async function loadCollection(collectionId: string, isRefresh = false) {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      
      const collectionData = await coreApi.get(`/collections/${collectionId}`);
      setCollection(collectionData);
      
      if (collectionData.products) {
        // Normalize products
        const processed = collectionData.products.map((p: any) => ({
          ...p,
          price: Number(p.price) || 0,
          compareAtPrice: p.compareAtPrice ? Number(p.compareAtPrice) : undefined,
          isAvailable: (p.isAvailable !== false && p.isAvailable !== undefined) ? true : false,
          isPublished: (p.isPublished !== false && p.isPublished !== undefined) ? true : false,
        })).filter((p: any) => p.isAvailable && p.isPublished);
        setProducts(processed);
      }
    } catch (error) {
      console.error('Failed to load collection:', error);
      toast({
        title: isRtl ? 'تعذر تحميل المجموعة' : 'Failed to load collection',
        description: isRtl ? 'حدث خطأ أثناء تحميل بيانات المجموعة.' : 'An error occurred while loading collection data.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  // Filter and Sort Logic
  const filteredProducts = useMemo(() => {
    let result = products.filter(product => {
      const matchesSearch = !searchQuery || product.name?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesPrice = product.price >= priceRange[0] && product.price <= priceRange[1];
      return matchesSearch && matchesPrice;
    });

    // Sort
    result = [...result].sort((a, b) => {
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
  }, [products, searchQuery, priceRange, sortBy]);

  // Pagination meta
  const totalItems = filteredProducts.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const FilterSidebar = () => (
    <div className="space-y-8">
      {/* Price Range */}
      <div>
        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
          <div className="p-2 rounded-lg bg-orange-500">
            <TrendingUp className="h-4 w-4 text-white" />
          </div>
          <span className="text-orange-600 font-bold uppercase tracking-tight">{isRtl ? 'نطاق السعر' : 'Price Range'}</span>
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
            <span className="mt-5 text-muted-foreground font-bold">-</span>
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
      {(searchQuery || priceRange[0] > 0 || priceRange[1] < 10000) && (
        <Button
          variant="outline"
          className="w-full rounded-xl border-destructive/50 text-destructive hover:bg-destructive/10 transition-colors"
          onClick={() => {
            setSearchQuery('');
            setPriceRange([0, 10000]);
          }}
        >
          <X className="ml-2 h-4 w-4" />
          {isRtl ? 'إلغاء الفلاتر' : 'Clear Filters'}
        </Button>
      )}
    </div>
  );

  if (loading) return <StorefrontLoading />;

  if (!collection) {
    return (
      <div className="min-h-screen container py-24 text-center">
        <div className="max-w-md mx-auto p-12 glass-card rounded-[2.5rem] border-2 shadow-2xl">
          <Package className="h-20 w-20 mx-auto text-gray-300 mb-6" />
          <h2 className="text-3xl font-black mb-4">{isRtl ? 'المجموعة غير موجودة' : 'Collection not found'}</h2>
          <p className="text-muted-foreground mb-8">{isRtl ? 'عذراً، لم نتمكن من العثور على ما تبحث عنه.' : 'Sorry, we couldnt find the items youre looking for.'}</p>
          <Link to="/">
            <Button size="lg" className="rounded-2xl px-10 gradient-primary shadow-glow">{isRtl ? 'العودة للرئيسية' : 'Back to Home'}</Button>
          </Link>
        </div>
      </div>
    );
  }

  const SeparatorIcon = isRtl ? ChevronLeft : ChevronRight;

  return (
    <div className="min-h-screen bg-background">
      {/* Premium Header */}
      <div className="relative overflow-hidden pt-12 pb-20">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-background" />
        <div className="container relative">
          <div className="mb-8 flex items-center gap-2 text-sm text-muted-foreground animate-fade-in">
            <Link to="/" className="hover:text-primary transition-colors font-medium">
              {isRtl ? 'الرئيسية' : 'Home'}
            </Link>
            <SeparatorIcon className="h-4 w-4" />
            <span className="text-primary font-bold">{isRtl ? (collection.nameAr || collection.name) : (collection.name || collection.nameAr)}</span>
          </div>

          <div className="flex flex-col md:flex-row gap-10 items-center">
             <div className="relative group shrink-0">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary to-primary/20 rounded-[2.5rem] blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative w-32 h-32 md:w-48 md:h-48 rounded-[2.2rem] overflow-hidden bg-white dark:bg-gray-800 p-2 shadow-2xl">
                 <div className="w-full h-full rounded-[1.8rem] overflow-hidden bg-muted flex items-center justify-center">
                  {collection.image ? (
                    <img src={collection.image} alt={collection.name} className="w-full h-full object-cover" />
                  ) : (
                    <Sparkles className="h-16 w-16 text-primary/30" />
                  )}
                </div>
              </div>
            </div>
            <div className="flex-1 text-center md:text-right">
              <Badge className="mb-4 px-6 py-2 rounded-full gradient-primary border-none text-sm font-black shadow-[0_5px_20px_rgba(var(--primary),0.3)]">
                <Zap className="w-4 h-4 ml-2 fill-current" />
                {isRtl ? 'مجموعة مختارة' : 'Featured Collection'}
              </Badge>
              <h1 className="text-4xl md:text-7xl font-black mb-4 bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent leading-tight">
                {isRtl ? (collection.nameAr || collection.name) : (collection.name || collection.nameAr)}
              </h1>
              {(collection.descriptionAr || collection.description) && (
                <p className="text-xl text-muted-foreground max-w-2xl leading-relaxed mx-auto md:mx-0">
                  {isRtl ? (collection.descriptionAr || collection.description) : (collection.description || collection.descriptionAr)}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container pb-24">
        {/* Controls Bar */}
        <div className="mb-10 flex flex-col lg:flex-row gap-4 animate-slide-up">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder={isRtl ? 'ابحث في هذه المجموعة...' : 'Search in this collection...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-12 h-14 border-2 rounded-2xl bg-card shadow-sm text-lg focus:border-primary/50 transition-all"
            />
          </div>

          <div className="flex gap-3">
            <Button
              onClick={() => loadCollection(id!, true)}
              disabled={refreshing}
              variant="outline"
              className="h-14 px-6 border-2 rounded-2xl shadow-sm hover:bg-muted"
            >
              <RefreshCw className={cn("h-4 w-4 ml-2", refreshing && "animate-spin")} />
              {isRtl ? 'تحديث' : 'Refresh'}
            </Button>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px] h-14 border-2 rounded-2xl shadow-sm">
                <SelectValue placeholder={isRtl ? 'ترتيب حسب' : 'Sort by'} />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="newest">{isRtl ? 'الأحدث' : 'Newest'}</SelectItem>
                <SelectItem value="price-asc">{isRtl ? 'السعر: من الأقل' : 'Price: Low'}</SelectItem>
                <SelectItem value="price-desc">{isRtl ? 'السعر: من الأعلى' : 'Price: High'}</SelectItem>
                <SelectItem value="name-asc">{isRtl ? 'الاسم: أ-ي' : 'Name: A-Z'}</SelectItem>
              </SelectContent>
            </Select>

            <div className="hidden md:flex border-2 rounded-2xl overflow-hidden shadow-sm">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="icon"
                className={cn("h-14 w-14 rounded-none transition-all", viewMode === 'grid' && "gradient-primary text-white")}
                onClick={() => setViewMode('grid')}
              >
                <Grid3x3 className="h-5 w-5" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="icon"
                className={cn("h-14 w-14 rounded-none transition-all", viewMode === 'list' && "gradient-primary text-white")}
                onClick={() => setViewMode('list')}
              >
                <List className="h-5 w-5" />
              </Button>
            </div>

            <Sheet open={showFilters} onOpenChange={setShowFilters}>
              <SheetTrigger asChild>
                <Button variant="outline" className="lg:hidden h-14 border-2 rounded-2xl shadow-sm">
                  <SlidersHorizontal className="ml-2 h-5 w-5" />
                  {isRtl ? 'تصفية' : 'Filter'}
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <SheetHeader>
                  <SheetTitle className="text-2xl font-black gradient-text">{isRtl ? 'تصفية المنتج' : 'Filter Products'}</SheetTitle>
                  <SheetDescription>{isRtl ? 'خصص عرض المنتجات حسب احتياجك' : 'Customize product display'}</SheetDescription>
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
            <Card className="p-8 sticky top-24 border-2 shadow-2xl rounded-[2.5rem] glass-card">
              <FilterSidebar />
            </Card>
          </aside>

          <div className="flex-1">
            {totalItems > 0 ? (
              <>
                <div className="mb-8 flex items-center justify-between p-6 glass-card rounded-3xl animate-slide-up bg-muted/20">
                  <p className="text-muted-foreground font-bold flex items-center gap-3">
                    <Sparkles className="w-5 h-5 text-primary animate-pulse" />
                    <span className="text-lg">
                      {isRtl ? 'وجدنا' : 'Found'} <span className="text-foreground text-2xl font-black mx-1 gradient-text">{totalItems}</span> {isRtl ? 'منتجات رائعة لك' : 'amazing products for you'}
                    </span>
                  </p>
                </div>

                <div className={cn(
                  viewMode === 'grid' 
                    ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8" 
                    : "flex flex-col gap-8"
                )}>
                  {paginatedProducts.map((product, index) => (
                    <ProductCard key={product.id} product={product} viewMode={viewMode} index={index} />
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="mt-16">
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
              <Card className="p-20 text-center border-2 border-dashed shadow-2xl rounded-[3rem] glass-card animate-scale-in">
                <div className="relative inline-block mb-10">
                  <div className="absolute inset-0 bg-primary/20 blur-[50px] rounded-full"></div>
                  <Package className="relative h-28 w-28 mx-auto text-muted-foreground/30" />
                </div>
                <h3 className="text-4xl font-black mb-4">{isRtl ? 'لا توجد نتائج' : 'No Results Found'}</h3>
                <p className="text-xl text-muted-foreground mb-12 max-w-md mx-auto">{isRtl ? 'لم نجد أي منتجات تطابق بحثك في هذه المجموعة حالياً. جرب تغيير الفلاتر.' : 'We couldnt find any products matching your search in this collection. Try changing filters.'}</p>
                <Button 
                  variant="outline" 
                  onClick={() => {
                     setSearchQuery('');
                     setPriceRange([0, 10000]);
                  }} 
                  className="rounded-2xl px-12 h-16 font-black border-2 hover:bg-primary text-lg transition-all hover:text-white"
                >
                  <X className="ml-3 h-6 w-6" />
                  {isRtl ? 'إعادة ضبط البحث' : 'Reset Search'}
                </Button>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
