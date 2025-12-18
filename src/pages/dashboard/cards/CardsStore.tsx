import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Search, 
  Heart, 
  ShoppingCart, 
  Plus, 
  Minus, 
  X,
  Store,
  Loader2,
  Package
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { coreApi } from '@/lib/api';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface Brand {
  id: string;
  name: string;
  nameAr?: string;
  logo?: string;
  image?: string;
  productCount?: number;
}

interface Category {
  id: string;
  name: string;
  nameAr?: string;
  icon?: string;
  productCount?: number;
}

interface CardProduct {
  id: string;
  name: string;
  nameAr?: string;
  image?: string;
  denomination: number;
  wholesalePrice: number;
  retailPrice: number;
  currency: string;
  profitMargin: number;
  availableStock: number;
  brand?: Brand;
  category?: Category;
  isFavorite?: boolean;
}

interface CartItem {
  product: CardProduct;
  quantity: number;
}

export default function CardsStore() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const navigate = useNavigate();
  
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<CardProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  
  // Fetch brands and categories
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [brandsRes, categoriesRes] = await Promise.all([
          coreApi.get('/card-products/brands', { requireAuth: true }),
          coreApi.get('/card-products/categories', { requireAuth: true }),
        ]);
        setBrands(brandsRes || []);
        setCategories(categoriesRes || []);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error(t('common.error', 'حدث خطأ'));
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [t]);

  // Fetch products when brand is selected
  useEffect(() => {
    const fetchProducts = async () => {
      if (!selectedBrand) {
        setProducts([]);
        return;
      }
      try {
        setLoading(true);
        const res = await coreApi.get(`/card-products/brand/${selectedBrand}`, { requireAuth: true });
        setProducts(res || []);
      } catch (error) {
        console.error('Error fetching products:', error);
        toast.error(t('common.error', 'حدث خطأ'));
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [selectedBrand, t]);

  // Filter brands by category and search
  const filteredBrands = brands.filter(brand => {
    const matchesSearch = searchQuery === '' || 
      brand.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      brand.nameAr?.includes(searchQuery);
    return matchesSearch;
  });

  // Cart functions
  const addToCart = (product: CardProduct) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    toast.success(isRTL ? 'تمت الإضافة للسلة' : 'Added to cart');
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.product.id === productId) {
          const newQty = item.quantity + delta;
          if (newQty <= 0) return null;
          return { ...item, quantity: newQty };
        }
        return item;
      }).filter(Boolean) as CartItem[];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.product.wholesalePrice * item.quantity), 0);
  const cartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Toggle favorite
  const toggleFavorite = async (product: CardProduct) => {
    try {
      await coreApi.post(`/favorites/${product.id}/toggle`, {}, { requireAuth: true });
      setProducts(prev => prev.map(p => 
        p.id === product.id ? { ...p, isFavorite: !p.isFavorite } : p
      ));
      toast.success(product.isFavorite 
        ? (isRTL ? 'تم الإزالة من المفضلة' : 'Removed from favorites')
        : (isRTL ? 'تمت الإضافة للمفضلة' : 'Added to favorites')
      );
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  // Checkout
  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.error(isRTL ? 'السلة فارغة' : 'Cart is empty');
      return;
    }

    try {
      const items = cart.map(item => ({
        productId: item.product.id,
        quantity: item.quantity,
      }));

      await coreApi.post('/card-orders', { items }, { requireAuth: true });
      setCart([]);
      toast.success(isRTL ? 'تم إتمام الطلب بنجاح' : 'Order completed successfully');
      navigate('/dashboard/cards/orders');
    } catch (error: any) {
      console.error('Error completing card store order:', error?.response?.data || error);
      toast.error(isRTL ? 'فشل في إتمام الطلب' : 'Failed to complete order');
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] gap-4 p-4">
      {/* Main Content */}
      <div className="flex-1 flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Store className="h-6 w-6" />
            {isRTL ? 'المتجر' : 'Store'}
          </h1>
        </div>

        {/* Filters */}
        <div className="flex gap-4 items-center">
          <div className="relative flex-1 max-w-md">
            <Search className={cn("absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground", isRTL ? "right-3" : "left-3")} />
            <Input
              placeholder={isRTL ? 'ابحث عن علامة تجارية أو اسم بطاقة...' : 'Search brand or card name...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={cn(isRTL ? "pr-10" : "pl-10")}
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder={isRTL ? 'كل الأقسام' : 'All Categories'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{isRTL ? 'كل الأقسام' : 'All Categories'}</SelectItem>
              {categories.map(cat => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.icon} {isRTL ? cat.nameAr || cat.name : cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Back to brands button if a brand is selected */}
        {selectedBrand && (
          <Button variant="outline" onClick={() => setSelectedBrand(null)} className="w-fit">
            ← {isRTL ? 'العودة للعلامات التجارية' : 'Back to brands'}
          </Button>
        )}

        {/* Content Area */}
        <ScrollArea className="flex-1">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : selectedBrand ? (
            /* Products Grid */
            <div>
              <h2 className="text-lg font-semibold mb-4">
                {isRTL ? 'اختر البطاقة:' : 'Choose Card:'}
              </h2>
              {products.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>{isRTL ? 'لا توجد بطاقات متاحة' : 'No cards available'}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {products.map((product) => (
                    <Card key={product.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          {/* Product Image */}
                          <div className="w-20 h-20 rounded-lg bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                            {product.image ? (
                              <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                            ) : (
                              <Package className="h-8 w-8 text-muted-foreground" />
                            )}
                          </div>

                          {/* Product Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h3 className="font-semibold truncate">
                                  {isRTL ? product.nameAr || product.name : product.name}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                  {isRTL ? 'سعر التجزئة' : 'Retail'}: {product.retailPrice.toFixed(2)} {product.currency}
                                </p>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => toggleFavorite(product)}
                                className="flex-shrink-0"
                              >
                                <Heart className={cn("h-5 w-5", product.isFavorite && "fill-red-500 text-red-500")} />
                              </Button>
                            </div>
                            
                            <div className="flex items-center justify-between mt-2">
                              <div>
                                <span className="text-lg font-bold text-primary">
                                  {product.wholesalePrice.toFixed(2)} {product.currency}
                                </span>
                                <span className="text-xs text-muted-foreground mx-2">
                                  {isRTL ? 'سعر الجملة' : 'Wholesale'}
                                </span>
                              </div>
                              
                              {/* Quantity Controls or Add Button */}
                              {cart.find(item => item.product.id === product.id) ? (
                                <div className="flex items-center gap-2 bg-muted rounded-lg p-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => updateQuantity(product.id, -1)}
                                  >
                                    <Minus className="h-4 w-4" />
                                  </Button>
                                  <span className="w-8 text-center font-medium">
                                    {cart.find(item => item.product.id === product.id)?.quantity}
                                  </span>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => updateQuantity(product.id, 1)}
                                  >
                                    <Plus className="h-4 w-4" />
                                  </Button>
                                </div>
                              ) : (
                                <Button
                                  onClick={() => addToCart(product)}
                                  disabled={product.availableStock === 0}
                                  className="bg-primary hover:bg-primary/90"
                                >
                                  {isRTL ? 'تفعيل المنتج' : 'Add Product'}
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Brands Grid */
            <div>
              <h2 className="text-lg font-semibold mb-4">
                {isRTL ? 'اختر العلامة التجارية' : 'Choose Brand'}
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                {filteredBrands.length} {isRTL ? 'علامة تجارية' : 'brands'}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {filteredBrands.map((brand) => (
                  <Card
                    key={brand.id}
                    className="cursor-pointer hover:shadow-lg transition-all hover:scale-105 overflow-hidden"
                    onClick={() => setSelectedBrand(brand.id)}
                  >
                    <div className="aspect-[4/3] bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center p-4">
                      {brand.logo || brand.image ? (
                        <img 
                          src={brand.logo || brand.image} 
                          alt={brand.name}
                          className="max-w-full max-h-full object-contain"
                        />
                      ) : (
                        <Store className="h-12 w-12 text-muted-foreground" />
                      )}
                    </div>
                    <CardContent className="p-3 text-center">
                      <h3 className="font-semibold text-sm">
                        {isRTL ? brand.nameAr || brand.name : brand.name}
                      </h3>
                      {brand.productCount !== undefined && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {brand.productCount} {isRTL ? 'بطاقات' : 'cards'}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Cart Sidebar */}
      <Card className="w-80 flex-shrink-0 flex flex-col">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <ShoppingCart className="h-5 w-5" />
            {isRTL ? 'سلة الشراء' : 'Shopping Cart'}
            {cartItemsCount > 0 && (
              <Badge variant="secondary" className="ml-auto">
                {cartItemsCount}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <Separator />
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-3">
            {cart.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <ShoppingCart className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>{isRTL ? 'السلة فارغة' : 'Cart is empty'}</p>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.product.id} className="flex items-start gap-3 p-2 bg-muted/50 rounded-lg">
                  <div className="w-12 h-12 rounded bg-background flex items-center justify-center overflow-hidden flex-shrink-0">
                    {item.product.image ? (
                      <img src={item.product.image} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Package className="h-6 w-6 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {isRTL ? item.product.nameAr || item.product.name : item.product.name}
                    </p>
                    <p className="text-xs text-primary font-semibold">
                      $ {item.product.wholesalePrice.toFixed(2)}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => updateQuantity(item.product.id, -1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => updateQuantity(item.product.id, 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-destructive hover:text-destructive"
                    onClick={() => removeFromCart(item.product.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
        
        {cart.length > 0 && (
          <>
            <Separator />
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{isRTL ? 'عدد البطاقات' : 'Cards count'}:</span>
                <span className="font-medium">{cartItemsCount} {isRTL ? 'بطاقة' : 'cards'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold">{isRTL ? 'الإجمالي' : 'Total'}:</span>
                <span className="text-lg font-bold text-primary">
                  $ {cartTotal.toFixed(2)} {isRTL ? 'دولار' : 'USD'}
                </span>
              </div>
              <Button className="w-full" size="lg" onClick={handleCheckout}>
                {isRTL ? 'إتمام الطلب' : 'Complete Order'}
              </Button>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}

