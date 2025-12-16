import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Search, 
  Heart, 
  ShoppingCart, 
  Plus, 
  Minus, 
  X,
  Package,
  Gift
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface FavoriteProduct {
  id: string;
  name: string;
  nameAr?: string;
  image?: string;
  wholesalePrice: number;
  retailPrice: number;
  currency: string;
  isFavorite: boolean;
}

interface CartItem {
  product: FavoriteProduct;
  quantity: number;
}

// Sample favorite products
const sampleFavorites: FavoriteProduct[] = [
  {
    id: '1',
    name: '68,500 ذهب - يلا لودو',
    image: '/placeholder.svg',
    wholesalePrice: 2.025,
    retailPrice: 1.9467,
    currency: '$',
    isFavorite: true,
  },
];

export default function CardsFavoritesList() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  
  const [favorites, setFavorites] = useState<FavoriteProduct[]>(sampleFavorites);
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);

  const filteredFavorites = favorites.filter(product => 
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const addToCart = (product: FavoriteProduct) => {
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

  const toggleFavorite = (productId: string) => {
    setFavorites(prev => prev.filter(p => p.id !== productId));
    toast.success(isRTL ? 'تم الإزالة من المفضلة' : 'Removed from favorites');
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.product.wholesalePrice * item.quantity), 0);
  const cartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4 p-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Main Content */}
      <div className="flex-1 flex flex-col gap-4">
        <Card className="flex-1">
          <CardHeader className="border-b bg-muted/30">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">
                {isRTL ? 'البطاقات المفضلة' : 'Favorite Cards'}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            {/* Search */}
            <div className="relative mb-4">
              <Search className={cn(
                "absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground",
                isRTL ? "right-3" : "left-3"
              )} />
              <Input
                placeholder={isRTL ? 'ابحث عن بطاقة...' : 'Search card...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={cn(isRTL ? "pr-10" : "pl-10")}
              />
            </div>

            <h3 className="text-lg font-semibold mb-4">
              {isRTL ? 'اختر البطاقة:' : 'Choose Card:'}
            </h3>

            <ScrollArea className="h-[400px]">
              {filteredFavorites.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Heart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>{isRTL ? 'لا توجد بطاقات مفضلة' : 'No favorite cards'}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredFavorites.map((product) => (
                    <Card key={product.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          {/* Favorite Button */}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => toggleFavorite(product.id)}
                            className="flex-shrink-0"
                          >
                            <Heart className="h-5 w-5 fill-red-500 text-red-500" />
                          </Button>

                          {/* Product Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3">
                              <div className="w-16 h-16 rounded bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                                {product.image ? (
                                  <img src={product.image} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <Gift className="h-8 w-8 text-muted-foreground" />
                                )}
                              </div>
                              <div>
                                <h3 className="font-semibold">{product.name}</h3>
                                <p className="text-sm text-muted-foreground">
                                  {isRTL ? 'سعر الجملة' : 'Wholesale'}: {product.retailPrice} {product.currency}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Price and Cart Controls */}
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="text-sm text-muted-foreground">
                                {isRTL ? 'سعر التجزئة' : 'Retail'}
                              </p>
                              <p className="font-bold">{product.wholesalePrice} {product.currency}</p>
                            </div>

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
                                className="bg-primary hover:bg-primary/90"
                              >
                                {isRTL ? 'تفعيل المنتج' : 'Add Product'}
                              </Button>
                            )}
                          </div>

                          {/* Total for this item in cart */}
                          {cart.find(item => item.product.id === product.id) && (
                            <div className="flex items-center gap-2 bg-primary/10 rounded-lg p-3">
                              <Gift className="h-5 w-5 text-primary" />
                              <div>
                                <p className="text-xs text-muted-foreground">{isRTL ? 'الإجمالي :' : 'Total:'}</p>
                                <p className="font-bold text-primary">
                                  {product.currency} {(product.wholesalePrice * (cart.find(item => item.product.id === product.id)?.quantity || 0)).toFixed(6)}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>

            <p className="text-sm text-muted-foreground mt-4 text-center">
              {isRTL 
                ? `عرض 1 إلى ${filteredFavorites.length} من ${favorites.length} بطاقة`
                : `Showing 1 to ${filteredFavorites.length} of ${favorites.length} cards`}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Cart Sidebar */}
      <Card className="w-80 flex-shrink-0 flex flex-col">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <ShoppingCart className="h-5 w-5" />
            {isRTL ? 'سلة الشراء' : 'Shopping Cart'}
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
                    <p className="text-sm font-medium truncate">{item.product.name}</p>
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
                      <span className="text-sm font-medium">{item.quantity}</span>
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
                    className="h-6 w-6 text-destructive"
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
            <div className="p-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{isRTL ? 'عدد البطاقات' : 'Cards count'}</span>
                <span>{cartItemsCount} {isRTL ? 'بطاقة' : 'cards'}</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span>{isRTL ? 'الإجمالي' : 'Total'}</span>
                <span>{cartTotal.toFixed(6)} {isRTL ? 'دولار' : 'USD'}</span>
              </div>
              <Button className="w-full bg-primary hover:bg-primary/90">
                {isRTL ? 'إتمام الطلب' : 'Complete Order'}
              </Button>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
