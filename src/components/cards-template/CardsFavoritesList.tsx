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
  Gift,
  Sparkles
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
  const { i18n } = useTranslation();
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
    <div className="w-full h-full p-4 md:p-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex flex-col lg:flex-row h-[calc(100vh-8rem)] gap-6 relative z-10">
        {/* Main Content */}
        <div className="flex-1 flex flex-col gap-4 min-h-0">
          <Card className="flex-1 bg-card border-border/50 shadow-xl overflow-hidden flex flex-col">
            <CardHeader className="border-b border-border/50 bg-muted/30 relative overflow-hidden flex-shrink-0">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-accent/5 opacity-50"></div>
              <div className="flex items-center justify-between relative z-10">
                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-primary/10 border border-primary/20 shadow-sm">
                    <Heart className="w-6 h-6 text-primary fill-primary/20" />
                  </div>
                  {isRTL ? 'البطاقات المفضلة' : 'Favorite Cards'}
                </CardTitle>
                <Sparkles className="w-6 h-6 text-primary/50" />
              </div>
            </CardHeader>
            <CardContent className="p-6 flex-1 overflow-hidden flex flex-col">
              {/* Search */}
              <div className="relative mb-6 flex-shrink-0">
                <Search className={cn(
                  "absolute top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground",
                  isRTL ? "right-4" : "left-4"
                )} />
                <Input
                  placeholder={isRTL ? 'ابحث عن بطاقة...' : 'Search card...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={cn(
                    "bg-background border-border h-12 rounded-xl focus:ring-primary/20",
                    isRTL ? "pr-12" : "pl-12"
                  )}
                />
              </div>

              <h3 className="text-lg font-semibold mb-4 text-foreground flex-shrink-0">
                {isRTL ? 'اختر البطاقة:' : 'Choose Card:'}
              </h3>

              <ScrollArea className="flex-1 pr-4">
                {filteredFavorites.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="p-6 rounded-2xl bg-muted/30 inline-block mb-4 border border-border/50">
                      <Heart className="h-12 w-12 text-muted-foreground/50" />
                    </div>
                    <p className="text-muted-foreground">{isRTL ? 'لا توجد بطاقات مفضلة' : 'No favorite cards'}</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredFavorites.map((product) => (
                      <Card 
                        key={product.id} 
                        className="bg-card border-border hover:border-primary/50 transition-all rounded-xl overflow-hidden group shadow-sm"
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center gap-4">
                            {/* Favorite Button */}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => toggleFavorite(product.id)}
                              className="flex-shrink-0 hover:bg-primary/10 text-primary"
                            >
                              <Heart className="h-5 w-5 fill-primary text-primary" />
                            </Button>

                            {/* Product Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3">
                                <div className="w-16 h-16 rounded-xl bg-muted/30 flex items-center justify-center overflow-hidden flex-shrink-0 border border-border/50">
                                  {product.image ? (
                                    <img src={product.image} alt="" className="w-full h-full object-cover" />
                                  ) : (
                                    <Gift className="h-8 w-8 text-primary/50" />
                                  )}
                                </div>
                                <div>
                                  <h3 className="font-semibold text-foreground">{product.name}</h3>
                                  <p className="text-sm text-muted-foreground">
                                    {isRTL ? 'سعر الجملة' : 'Wholesale'}: {product.retailPrice} {product.currency}
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Price and Cart Controls */}
                            <div className="flex items-center gap-4">
                              <div className="text-right hidden sm:block">
                                <p className="text-sm text-muted-foreground">
                                  {isRTL ? 'سعر التجزئة' : 'Retail'}
                                </p>
                                <p className="font-bold text-emerald-600">{product.wholesalePrice} {product.currency}</p>
                              </div>

                              {cart.find(item => item.product.id === product.id) ? (
                                <div className="flex items-center gap-2 bg-muted/50 rounded-xl p-1.5 border border-border/50">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-foreground hover:bg-background"
                                    onClick={() => updateQuantity(product.id, -1)}
                                  >
                                    <Minus className="h-4 w-4" />
                                  </Button>
                                  <span className="w-8 text-center font-medium text-foreground">
                                    {cart.find(item => item.product.id === product.id)?.quantity}
                                  </span>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-foreground hover:bg-background"
                                    onClick={() => updateQuantity(product.id, 1)}
                                  >
                                    <Plus className="h-4 w-4" />
                                  </Button>
                                </div>
                              ) : (
                                <Button
                                  onClick={() => addToCart(product)}
                                  className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-primary-foreground shadow-md shadow-primary/20"
                                >
                                  {isRTL ? 'تفعيل المنتج' : 'Add Product'}
                                </Button>
                              )}
                            </div>

                            {/* Total for this item in cart */}
                            {cart.find(item => item.product.id === product.id) && (
                              <div className="flex items-center gap-2 bg-primary/10 rounded-xl p-3 border border-primary/20 hidden md:flex">
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

              <p className="text-sm text-muted-foreground mt-4 text-center flex-shrink-0">
                {isRTL 
                  ? `عرض 1 إلى ${filteredFavorites.length} من ${favorites.length} بطاقة`
                  : `Showing 1 to ${filteredFavorites.length} of ${favorites.length} cards`}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Cart Sidebar */}
        <Card className="w-full lg:w-80 flex-shrink-0 flex flex-col bg-card border-border/50 shadow-xl rounded-2xl overflow-hidden h-[300px] lg:h-auto">
          <CardHeader className="pb-3 border-b border-border/50 bg-muted/30">
            <CardTitle className="flex items-center gap-2 text-lg text-foreground">
              <div className="p-1.5 rounded-lg bg-primary/10">
                <ShoppingCart className="h-5 w-5 text-primary" />
              </div>
              {isRTL ? 'سلة الشراء' : 'Shopping Cart'}
            </CardTitle>
          </CardHeader>
          <Separator className="bg-border/50" />
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-3">
              {cart.length === 0 ? (
                <div className="text-center py-8">
                  <div className="p-4 rounded-xl bg-muted/30 inline-block mb-3 border border-border/50">
                    <ShoppingCart className="h-10 w-10 text-muted-foreground/50" />
                  </div>
                  <p className="text-muted-foreground">{isRTL ? 'السلة فارغة' : 'Cart is empty'}</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.product.id} className="flex items-start gap-3 p-3 bg-muted/20 rounded-xl border border-border/50">
                    <div className="w-12 h-12 rounded-lg bg-muted/30 flex items-center justify-center overflow-hidden flex-shrink-0 border border-border/50">
                      {item.product.image ? (
                        <img src={item.product.image} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Package className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{item.product.name}</p>
                      <p className="text-xs text-emerald-600 font-semibold">
                        $ {item.product.wholesalePrice.toFixed(2)}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-6 w-6 border-border text-foreground hover:bg-muted"
                          onClick={() => updateQuantity(item.product.id, -1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="text-sm font-medium text-foreground">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-6 w-6 border-border text-foreground hover:bg-muted"
                          onClick={() => updateQuantity(item.product.id, 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-red-500 hover:bg-red-500/10"
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
              <Separator className="bg-border/50" />
              <div className="p-4 space-y-3 bg-muted/10">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{isRTL ? 'عدد البطاقات' : 'Cards count'}</span>
                  <span className="text-foreground">{cartItemsCount} {isRTL ? 'بطاقة' : 'cards'}</span>
                </div>
                <div className="flex justify-between font-semibold text-foreground">
                  <span>{isRTL ? 'الإجمالي' : 'Total'}</span>
                  <span className="text-emerald-600">{cartTotal.toFixed(6)} {isRTL ? 'دولار' : 'USD'}</span>
                </div>
                <Button className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-primary-foreground shadow-lg shadow-primary/20">
                  {isRTL ? 'إتمام الطلب' : 'Complete Order'}
                </Button>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
