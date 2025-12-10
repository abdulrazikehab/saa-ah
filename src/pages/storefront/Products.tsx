import { useEffect, useState } from 'react';
import { ProductCard } from '@/components/storefront/ProductCard';
import { coreApi } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { 
  Search, Loader2, Filter, SlidersHorizontal, Grid3x3, List,
  X, Package, Sparkles, TrendingUp
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
      (product.categories && product.categories.some((cat: any) => selectedCategories.includes(cat.id || cat.category?.id)));
    return matchesSearch && matchesPrice && matchesCategory;
});


  // Sort products
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
    <div className="space-y-6">
      {/* Categories */}
      <div>
        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
          <Filter className="h-5 w-5 text-indigo-600" />
          الفئات
        </h3>
        <div className="space-y-3">
          {categories.map((category) => (
            <div key={category.id} className="flex items-center justify-between group">
              <div className="flex items-center gap-2">
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
                  className="data-[state=checked]:bg-indigo-600"
                />
                <Label htmlFor={category.id} className="cursor-pointer group-hover:text-indigo-600 transition-colors">
                  {category.name}
                </Label>
              </div>
              {/* Only show count if available */}
              {(category as any).count !== undefined && (
                <Badge variant="secondary" className="text-xs bg-indigo-50 text-indigo-700">
                  {(category as any).count}
                </Badge>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-indigo-600" />
          نطاق السعر
        </h3>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Input
              type="number"
              placeholder="من"
              value={priceRange[0]}
              onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
              className="flex-1 border-2 focus:border-indigo-600"
            />
            <span className="text-gray-500 font-bold">-</span>
            <Input
              type="number"
              placeholder="إلى"
              value={priceRange[1]}
              onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
              className="flex-1 border-2 focus:border-indigo-600"
            />
          </div>
          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
            <span className="font-semibold">{priceRange[0]} ر.س</span>
            <span className="font-semibold">{priceRange[1]} ر.س</span>
          </div>
        </div>
      </div>

      {/* Reset Filters */}
      {(selectedCategories.length > 0 || priceRange[0] > 0 || priceRange[1] < 10000) && (
        <Button
          variant="outline"
          className="w-full border-2 hover:bg-red-50 hover:text-red-600 hover:border-red-600 transition-all"
          onClick={() => {
            setSelectedCategories([]);
            setPriceRange([0, 10000]);
          }}
        >
          <X className="ml-2 h-4 w-4" />
          مسح الفلاتر
        </Button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-indigo-950/30">
      <div className="container py-8">
        {/* Search and Controls */}
        <div className="mb-8 flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              placeholder="ابحث عن المنتجات..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-12 h-14 border-2 rounded-xl shadow-sm focus:shadow-md transition-all text-lg"
            />
          </div>

          <div className="flex gap-3">
            {/* Sort */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[200px] h-14 border-2 rounded-xl shadow-sm">
                <SelectValue placeholder="ترتيب حسب" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">الأحدث</SelectItem>
                <SelectItem value="price-asc">السعر: من الأقل</SelectItem>
                <SelectItem value="price-desc">السعر: من الأعلى</SelectItem>
                <SelectItem value="name-asc">الاسم: أ-ي</SelectItem>
                <SelectItem value="name-desc">الاسم: ي-أ</SelectItem>
              </SelectContent>
            </Select>

            {/* View Mode */}
            <div className="hidden md:flex border-2 rounded-xl overflow-hidden shadow-sm">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="icon"
                className="rounded-none h-14 w-14"
                onClick={() => setViewMode('grid')}
              >
                <Grid3x3 className="h-5 w-5" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="icon"
                className="rounded-none h-14 w-14"
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
                  فلتر
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[320px]">
                <SheetHeader>
                  <SheetTitle className="text-2xl">الفلاتر</SheetTitle>
                  <SheetDescription>
                    اختر الفلاتر لتضييق نطاق البحث
                  </SheetDescription>
                </SheetHeader>
                <div className="mt-6">
                  <FilterSidebar />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        <div className="flex gap-8">
          {/* Desktop Filters Sidebar */}
          <aside className="hidden lg:block w-72 flex-shrink-0">
            <Card className="p-6 sticky top-4 border-2 shadow-lg rounded-2xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
              <FilterSidebar />
            </Card>
          </aside>

          {/* Products Grid */}
          <div className="flex-1">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-32">
                <Loader2 className="h-16 w-16 animate-spin text-indigo-600 mb-4" />
                <p className="text-gray-600 dark:text-gray-400 text-lg">جاري تحميل المنتجات...</p>
              </div>
            ) : filteredProducts.length > 0 ? (
              <>
                <div className="mb-6 flex items-center justify-between p-4 bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm rounded-xl border-2">
                  <p className="text-gray-600 dark:text-gray-400 text-lg">
                    <span className="font-bold text-2xl text-indigo-600 dark:text-indigo-400">
                      {filteredProducts.length}
                    </span>{' '}
                    منتج متاح
                  </p>
                  {(selectedCategories.length > 0 || searchQuery) && (
                    <div className="flex items-center gap-2 flex-wrap">
                      {searchQuery && (
                        <Badge variant="secondary" className="gap-2 px-3 py-1 text-sm">
                          بحث: {searchQuery}
                          <X
                            className="h-3 w-3 cursor-pointer hover:text-red-600"
                            onClick={() => setSearchQuery('')}
                          />
                        </Badge>
                      )}
                      {selectedCategories.length > 0 && (
                        <Badge variant="secondary" className="px-3 py-1 text-sm">
                          {selectedCategories.length} فئة محددة
                        </Badge>
                      )}
                    </div>
                  )}
                </div>

                <div className={
                  viewMode === 'grid'
                    ? 'grid sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6'
                    : 'space-y-4'
                }>
                  {filteredProducts.map((product: Product, index: number) => (
                    <div
                      key={product.id}
                      className="animate-fade-in-up"
                      style={{
                        animationDelay: `${index * 50}ms`,
                        animationFillMode: 'both'
                      }}
                    >
                      <ProductCard product={product} viewMode={viewMode} />
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <Card className="p-16 text-center border-2 shadow-xl rounded-2xl bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
                <Package className="h-24 w-24 mx-auto text-gray-300 dark:text-gray-700 mb-6" />
                <h3 className="text-3xl font-bold mb-3 text-gray-900 dark:text-white">لا توجد منتجات</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto text-lg">
                  {searchQuery
                    ? 'لم نجد أي منتجات تطابق بحثك. جرب كلمات مختلفة أو امسح الفلاتر.'
                    : 'لا توجد منتجات متاحة حالياً. تحقق مرة أخرى قريباً!'}
                </p>
                {(searchQuery || selectedCategories.length > 0) && (
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-2"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategories([]);
                      setPriceRange([0, 10000]);
                    }}
                  >
                    <X className="ml-2 h-5 w-5" />
                    مسح جميع الفلاتر
                  </Button>
                )}
              </Card>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out;
        }

        @keyframes gradient {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }

        .animate-gradient {
          background-size: 200% auto;
          animation: gradient 3s ease infinite;
        }
      `}</style>
    </div>
  );
}
