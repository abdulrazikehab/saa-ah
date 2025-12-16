import { useEffect, useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Search, 
  Filter,
  SlidersHorizontal,
  Grid3X3,
  List,
  CreditCard,
  Star,
  ShoppingCart,
  Loader2,
  X,
  ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { coreApi } from '@/lib/api';
import { cn } from '@/lib/utils';

interface Brand {
  id: string;
  name: string;
  nameAr?: string;
  code?: string;
  logo?: string;
}

interface Category {
  id: string;
  name: string;
  nameAr?: string;
  slug: string;
}

interface CardProduct {
  id: string;
  name: string;
  nameAr?: string;
  description?: string;
  price: number;
  currencyCode: string;
  imageUrl?: string;
  brand?: Brand;
  category?: Category;
  inStock: number;
  isPopular?: boolean;
}

// Brand icons
const brandIcons: Record<string, string> = {
  'ITUNES': '🍎',
  'GOOGLEPLAY': '▶️',
  'PLAYSTATION': '🎮',
  'XBOX': '🎯',
  'STEAM': '🎲',
  'PUBG': '🔫',
  'FREEFIRE': '🔥',
  'NETFLIX': '🎬',
  'SPOTIFY': '🎵',
  'RAZERGOLD': '💎',
  'AMAZON': '📦',
  'NINTENDO': '🕹️',
};

export default function CardsCatalog() {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cards, setCards] = useState<CardProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Filters
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedBrand, setSelectedBrand] = useState(searchParams.get('brand') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [sortBy, setSortBy] = useState('popular');
  const [inStockOnly, setInStockOnly] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    // Update URL params
    const params = new URLSearchParams();
    if (searchQuery) params.set('search', searchQuery);
    if (selectedBrand) params.set('brand', selectedBrand);
    if (selectedCategory) params.set('category', selectedCategory);
    setSearchParams(params, { replace: true });
  }, [searchQuery, selectedBrand, selectedCategory, setSearchParams]);

  const loadData = async () => {
    try {
      const [brandsRes, categoriesRes, cardsRes] = await Promise.all([
        coreApi.getBrands().catch(() => []),
        coreApi.getCategories().catch(() => []),
        coreApi.get('/card-products?limit=100').catch(() => ({ data: [] })),
      ]);
      
      setBrands(Array.isArray(brandsRes) ? brandsRes : []);
      setCategories(Array.isArray(categoriesRes) ? categoriesRes : []);
      setCards(cardsRes.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filtered and sorted cards
  const filteredCards = useMemo(() => {
    let result = [...cards];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(card => 
        card.name.toLowerCase().includes(query) ||
        card.nameAr?.toLowerCase().includes(query) ||
        card.brand?.name.toLowerCase().includes(query)
      );
    }

    // Brand filter
    if (selectedBrand) {
      result = result.filter(card => card.brand?.id === selectedBrand);
    }

    // Category filter
    if (selectedCategory) {
      result = result.filter(card => card.category?.id === selectedCategory);
    }

    // Price filter
    result = result.filter(card => 
      card.price >= priceRange[0] && card.price <= priceRange[1]
    );

    // In stock filter
    if (inStockOnly) {
      result = result.filter(card => card.inStock > 0);
    }

    // Sort
    switch (sortBy) {
      case 'price-low':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'name':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'popular':
      default:
        result.sort((a, b) => (b.isPopular ? 1 : 0) - (a.isPopular ? 1 : 0));
    }

    return result;
  }, [cards, searchQuery, selectedBrand, selectedCategory, priceRange, inStockOnly, sortBy]);

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('');
    setSelectedBrand('');
    setSelectedCategory('');
    setPriceRange([0, 1000]);
    setInStockOnly(false);
    setSortBy('popular');
  };

  const activeFiltersCount = [
    searchQuery,
    selectedBrand,
    selectedCategory,
    inStockOnly,
    priceRange[0] > 0 || priceRange[1] < 1000,
  ].filter(Boolean).length;

  // Filter Sidebar Content
  const FiltersContent = () => (
    <div className="space-y-6">
      {/* Brands */}
      <div>
        <h3 className="text-white font-semibold mb-3">
          {isRTL ? 'العلامات التجارية' : 'Brands'}
        </h3>
        <ScrollArea className="h-48">
          <div className="space-y-2">
            {brands.map((brand) => (
              <button
                key={brand.id}
                onClick={() => setSelectedBrand(selectedBrand === brand.id ? '' : brand.id)}
                className={cn(
                  "w-full flex items-center gap-2 p-2 rounded-lg transition-colors text-right",
                  selectedBrand === brand.id
                    ? "bg-purple-500/20 text-purple-400"
                    : "hover:bg-white/5 text-slate-300"
                )}
              >
                <span className="text-lg">
                  {brandIcons[brand.code || ''] || '🎁'}
                </span>
                <span className="flex-1 text-sm">
                  {isRTL ? brand.nameAr || brand.name : brand.name}
                </span>
                {selectedBrand === brand.id && (
                  <div className="w-2 h-2 rounded-full bg-purple-400" />
                )}
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Categories */}
      <div>
        <h3 className="text-white font-semibold mb-3">
          {isRTL ? 'التصنيفات' : 'Categories'}
        </h3>
        <div className="space-y-2">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(selectedCategory === category.id ? '' : category.id)}
              className={cn(
                "w-full flex items-center justify-between p-2 rounded-lg transition-colors text-right",
                selectedCategory === category.id
                  ? "bg-purple-500/20 text-purple-400"
                  : "hover:bg-white/5 text-slate-300"
              )}
            >
              <span className="text-sm">
                {isRTL ? category.nameAr || category.name : category.name}
              </span>
              {selectedCategory === category.id && (
                <div className="w-2 h-2 rounded-full bg-purple-400" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* In Stock Only */}
      <div className="flex items-center gap-3">
        <Checkbox 
          id="inStock"
          checked={inStockOnly}
          onCheckedChange={(checked) => setInStockOnly(checked === true)}
          className="border-slate-500"
        />
        <label htmlFor="inStock" className="text-slate-300 text-sm cursor-pointer">
          {isRTL ? 'متوفر فقط' : 'In Stock Only'}
        </label>
      </div>

      {/* Clear Filters */}
      {activeFiltersCount > 0 && (
        <Button 
          variant="outline" 
          className="w-full border-slate-600 text-slate-300 hover:bg-slate-700"
          onClick={clearFilters}
        >
          <X className="h-4 w-4 mr-2" />
          {isRTL ? 'مسح الكل' : 'Clear All'} ({activeFiltersCount})
        </Button>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-purple-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="border-b border-white/10 bg-black/20 sticky top-0 z-40 backdrop-blur-xl">
        <div className="container py-4">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-slate-400 mb-4">
            <Link to="/" className="hover:text-purple-400 transition-colors">
              {isRTL ? 'الرئيسية' : 'Home'}
            </Link>
            <span>/</span>
            <span className="text-purple-400">{isRTL ? 'البطاقات' : 'Cards'}</span>
          </div>

          {/* Search & Controls */}
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <Input
                type="text"
                placeholder={isRTL ? 'ابحث عن البطاقات...' : 'Search cards...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-10 bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:border-purple-400"
              />
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2">
              {/* Mobile Filter */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" className="md:hidden border-white/20 text-white">
                    <Filter className="h-4 w-4 mr-2" />
                    {isRTL ? 'فلتر' : 'Filter'}
                    {activeFiltersCount > 0 && (
                      <Badge className="ml-2 bg-purple-500">{activeFiltersCount}</Badge>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side={isRTL ? "right" : "left"} className="bg-slate-900 border-white/10">
                  <SheetHeader>
                    <SheetTitle className="text-white">{isRTL ? 'الفلاتر' : 'Filters'}</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6">
                    <FiltersContent />
                  </div>
                </SheetContent>
              </Sheet>

              {/* Sort */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40 bg-white/10 border-white/20 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-white/20">
                  <SelectItem value="popular">{isRTL ? 'الأكثر شعبية' : 'Most Popular'}</SelectItem>
                  <SelectItem value="price-low">{isRTL ? 'السعر: منخفض لعالي' : 'Price: Low to High'}</SelectItem>
                  <SelectItem value="price-high">{isRTL ? 'السعر: عالي لمنخفض' : 'Price: High to Low'}</SelectItem>
                  <SelectItem value="name">{isRTL ? 'الاسم' : 'Name'}</SelectItem>
                </SelectContent>
              </Select>

              {/* View Mode */}
              <div className="hidden md:flex items-center gap-1 p-1 bg-white/10 rounded-lg">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    "h-8 w-8",
                    viewMode === 'grid' ? "bg-purple-500/30 text-purple-400" : "text-slate-400"
                  )}
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setViewMode('list')}
                  className={cn(
                    "h-8 w-8",
                    viewMode === 'list' ? "bg-purple-500/30 text-purple-400" : "text-slate-400"
                  )}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Active Filters Tags */}
          {(selectedBrand || selectedCategory) && (
            <div className="flex flex-wrap gap-2 mt-4">
              {selectedBrand && (
                <Badge 
                  className="bg-purple-500/20 text-purple-300 border-purple-500/30 cursor-pointer hover:bg-purple-500/30"
                  onClick={() => setSelectedBrand('')}
                >
                  {brands.find(b => b.id === selectedBrand)?.name}
                  <X className="h-3 w-3 ml-1" />
                </Badge>
              )}
              {selectedCategory && (
                <Badge 
                  className="bg-blue-500/20 text-blue-300 border-blue-500/30 cursor-pointer hover:bg-blue-500/30"
                  onClick={() => setSelectedCategory('')}
                >
                  {categories.find(c => c.id === selectedCategory)?.name}
                  <X className="h-3 w-3 ml-1" />
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="container py-8">
        <div className="flex gap-8">
          {/* Desktop Sidebar */}
          <aside className="hidden md:block w-64 shrink-0">
            <Card className="bg-white/5 border-white/10 sticky top-32">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-6">
                  <SlidersHorizontal className="h-5 w-5 text-purple-400" />
                  <h2 className="text-white font-semibold">
                    {isRTL ? 'الفلاتر' : 'Filters'}
                  </h2>
                </div>
                <FiltersContent />
              </CardContent>
            </Card>
          </aside>

          {/* Cards Grid */}
          <main className="flex-1">
            {/* Results Count */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-slate-400">
                {isRTL 
                  ? `${filteredCards.length} بطاقة`
                  : `${filteredCards.length} cards`
                }
              </p>
            </div>

            {filteredCards.length === 0 ? (
              <Card className="bg-white/5 border-white/10">
                <CardContent className="py-16 text-center">
                  <CreditCard className="h-16 w-16 mx-auto text-slate-500 mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">
                    {isRTL ? 'لا توجد نتائج' : 'No results found'}
                  </h3>
                  <p className="text-slate-400 mb-4">
                    {isRTL ? 'جرب تغيير معايير البحث' : 'Try changing your search criteria'}
                  </p>
                  <Button variant="outline" onClick={clearFilters} className="border-purple-500/50 text-purple-400">
                    {isRTL ? 'مسح الفلاتر' : 'Clear Filters'}
                  </Button>
                </CardContent>
              </Card>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredCards.map((card) => (
                  <Link key={card.id} to={`/cards/${card.id}`}>
                    <Card className="bg-white/5 border-white/10 hover:bg-white/10 hover:border-purple-500/50 hover:-translate-y-1 transition-all duration-300 cursor-pointer group overflow-hidden h-full">
                      <CardContent className="p-0">
                        {/* Card Image */}
                        <div className="aspect-[4/3] bg-gradient-to-br from-purple-600/30 to-blue-600/30 relative overflow-hidden">
                          {card.imageUrl ? (
                            <img 
                              src={card.imageUrl} 
                              alt={card.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <CreditCard className="h-12 w-12 text-purple-400/50" />
                            </div>
                          )}
                          
                          {card.inStock > 0 && (
                            <Badge className="absolute top-2 right-2 bg-green-500/90 text-white text-xs">
                              {isRTL ? 'متوفر' : 'In Stock'}
                            </Badge>
                          )}
                          
                          {card.isPopular && (
                            <Badge className="absolute top-2 left-2 bg-yellow-500/90 text-black text-xs">
                              <Star className="h-3 w-3" />
                            </Badge>
                          )}
                        </div>

                        {/* Card Info */}
                        <div className="p-3">
                          {card.brand && (
                            <p className="text-purple-400 text-xs font-medium mb-1 truncate">
                              {isRTL ? card.brand.nameAr || card.brand.name : card.brand.name}
                            </p>
                          )}
                          <h3 className="text-white font-medium text-sm mb-2 line-clamp-2 min-h-[2.5rem]">
                            {isRTL ? card.nameAr || card.name : card.name}
                          </h3>
                          <div className="flex items-center justify-between">
                            <span className="text-lg font-bold text-purple-400">
                              {card.price.toFixed(2)}
                              <span className="text-xs ml-1">{card.currencyCode}</span>
                            </span>
                            <Button size="sm" className="bg-purple-600 hover:bg-purple-700 h-8 w-8 p-0">
                              <ShoppingCart className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredCards.map((card) => (
                  <Link key={card.id} to={`/cards/${card.id}`}>
                    <Card className="bg-white/5 border-white/10 hover:bg-white/10 hover:border-purple-500/50 transition-all duration-300 cursor-pointer group">
                      <CardContent className="p-4 flex items-center gap-4">
                        {/* Image */}
                        <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-purple-600/30 to-blue-600/30 flex items-center justify-center overflow-hidden shrink-0">
                          {card.imageUrl ? (
                            <img src={card.imageUrl} alt={card.name} className="w-full h-full object-cover" />
                          ) : (
                            <CreditCard className="h-8 w-8 text-purple-400/50" />
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          {card.brand && (
                            <p className="text-purple-400 text-xs font-medium mb-1">
                              {isRTL ? card.brand.nameAr || card.brand.name : card.brand.name}
                            </p>
                          )}
                          <h3 className="text-white font-medium mb-1 truncate">
                            {isRTL ? card.nameAr || card.name : card.name}
                          </h3>
                          <div className="flex items-center gap-2">
                            {card.inStock > 0 && (
                              <Badge className="bg-green-500/20 text-green-400 text-xs">
                                {isRTL ? 'متوفر' : 'In Stock'}
                              </Badge>
                            )}
                            {card.isPopular && (
                              <Badge className="bg-yellow-500/20 text-yellow-400 text-xs">
                                <Star className="h-3 w-3 mr-1" />
                                {isRTL ? 'مميز' : 'Popular'}
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Price & Action */}
                        <div className="text-right">
                          <p className="text-xl font-bold text-purple-400 mb-2">
                            {card.price.toFixed(2)} {card.currencyCode}
                          </p>
                          <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                            <ShoppingCart className="h-4 w-4 mr-2" />
                            {isRTL ? 'شراء' : 'Buy'}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

