import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  Loader2,
  ArrowRight,
  Tag,
  Truck,
  Shield,
  ShoppingCart,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { useCart } from '@/contexts/CartContext';

export default function Cart() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { cart, loading, updateQuantity, removeItem, refreshCart } = useCart();
  const [couponCode, setCouponCode] = useState('');

  console.log('🛒 Cart Page: Component rendered');
  console.log('🛒 Cart Page: Current cart state:', cart);
  console.log('🛒 Cart Page: Cart type:', typeof cart);
  console.log('🛒 Cart Page: Cart is null?', cart === null);
  console.log('🛒 Cart Page: Cart keys:', cart && typeof cart === 'object' ? Object.keys(cart) : 'N/A');
  
  const cartItemsArray = (cart as any)?.cartItems || (cart as any)?.items || [];
  console.log('🛒 Cart Page: Cart items array:', cartItemsArray);
  console.log('🛒 Cart Page: Cart items length:', cartItemsArray.length);
  console.log('🛒 Cart Page: Cart items is array?', Array.isArray(cartItemsArray));
  
  // Force re-render check
  useEffect(() => {
    console.log('🛒 Cart Page: Cart changed, items:', cartItemsArray.length);
  }, [cart]);

  const applyCoupon = () => {
    if (!couponCode) return;
    toast({
      title: 'كود الخصم',
      description: 'تم تطبيق كود الخصم بنجاح',
    });
  };

  // Debug function to manually test cart API
  const debugCart = async () => {
    console.log('🔍 DEBUG: Manual cart fetch test');
    try {
      await refreshCart();
      console.log('🔍 DEBUG: Cart refreshed manually');
      toast({
        title: 'Debug',
        description: 'Cart refreshed. Check console for details.',
      });
    } catch (error) {
      console.error('🔍 DEBUG: Error refreshing cart:', error);
      toast({
        title: 'Debug Error',
        description: 'Failed to refresh cart. Check console.',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-12 w-12 animate-spin text-indigo-600" />
        </div>
      </div>
    );
  }

  // Get cart items - ensure it's always an array
  const cartItems = Array.isArray((cart as any)?.cartItems) 
    ? (cart as any).cartItems 
    : Array.isArray((cart as any)?.items) 
      ? (cart as any).items 
      : [];
  
  // Filter out invalid items and ensure all items have product data
  const validCartItems = cartItems.filter((item: any) => {
    if (!item || !item.id) {
      console.warn('🛒 Cart Page: Invalid cart item (missing id):', item);
      return false;
    }
    // Only show items with valid product data
    if (!item.product) {
      console.warn('🛒 Cart Page: Cart item missing product data:', item.id, item.productId);
      // Try to refresh cart to reload product data
      if (item.productId) {
        console.log('🛒 Cart Page: Attempting to refresh cart to reload product data');
        setTimeout(() => refreshCart(), 1000);
      }
      return false;
    }
    return true;
  });
  
  // Debug: Log everything about the cart
  console.log('🛒 Cart Page: ========== CART DEBUG ==========');
  console.log('🛒 Cart Page: cart object:', cart);
  console.log('🛒 Cart Page: cart type:', typeof cart);
  console.log('🛒 Cart Page: cart is null?', cart === null);
  console.log('🛒 Cart Page: cart keys:', cart && typeof cart === 'object' ? Object.keys(cart) : 'N/A');
  console.log('🛒 Cart Page: cart.cartItems:', (cart as any)?.cartItems);
  console.log('🛒 Cart Page: cart.items:', (cart as any)?.items);
  console.log('🛒 Cart Page: cartItems array (raw):', cartItems);
  console.log('🛒 Cart Page: cartItems.length (raw):', cartItems.length);
  console.log('🛒 Cart Page: validCartItems array:', validCartItems);
  console.log('🛒 Cart Page: validCartItems.length:', validCartItems.length);
  console.log('🛒 Cart Page: cartItems is array?', Array.isArray(cartItems));
  console.log('🛒 Cart Page: =================================');
  
  const isEmpty = !validCartItems || validCartItems.length === 0;
  const subtotal = validCartItems.reduce((sum: number, item: any) => {
    const price = item.productVariant?.price ?? item.product?.price ?? 0;
    return sum + Number(price) * item.quantity;
  }, 0) ?? 0;
  const shipping = subtotal > 200 ? 0 : 25;
  const total = subtotal + shipping;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            سلة التسوق
          </h1>
          {!isEmpty && (
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              لديك {validCartItems.length} {validCartItems.length === 1 ? 'منتج' : 'منتجات'} في سلتك
            </p>
          )}
        </div>

        {isEmpty ? (
          <Card className="p-16 text-center border-0 shadow-lg">
            <ShoppingBag className="h-24 w-24 mx-auto text-gray-400 mb-6" />
            <h2 className="text-3xl font-bold mb-4">سلة التسوق فارغة</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8 text-lg max-w-md mx-auto">
              ابدأ التسوق الآن واكتشف منتجاتنا المميزة
            </p>
                <div className="flex gap-4 justify-center">
                  <Link to="/products">
                    <Button size="lg" className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 px-8">
                      تصفح المنتجات
                      <ArrowRight className="mr-2 h-5 w-5" />
                    </Button>
                  </Link>
                  <Button 
                    size="lg" 
                    variant="outline" 
                    onClick={async () => {
                      console.log('🔍 DEBUG: Manual cart refresh triggered');
                      await refreshCart();
                      toast({
                        title: 'Debug',
                        description: 'Cart refreshed. Check console for details.',
                      });
                    }}
                    className="px-8"
                  >
                    🔍 Debug Cart
                  </Button>
                </div>
          </Card>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
                  {validCartItems.map((item: any) => {
                    // Ensure product exists
                    if (!item.product) {
                      console.error('❌ Cart item missing product:', item);
                      return null;
                    }
                    
                    const productName = item.product?.nameAr || item.product?.name || 'منتج غير معروف';
                    
                    // Product images can be objects with 'url' property or strings
                    let productImage: string | null = null;
                    if (item.product?.images && item.product.images.length > 0) {
                      const firstImage = item.product.images[0];
                      if (typeof firstImage === 'string') {
                        productImage = firstImage;
                      } else if (firstImage?.url) {
                        productImage = firstImage.url;
                      } else if (firstImage?.imageUrl) {
                        productImage = firstImage.imageUrl;
                      } else if (typeof firstImage === 'object' && firstImage !== null) {
                        // Try to find any URL-like property
                        const urlKeys = ['url', 'imageUrl', 'src', 'image', 'path'];
                        for (const key of urlKeys) {
                          if (firstImage[key] && typeof firstImage[key] === 'string') {
                            productImage = firstImage[key];
                            break;
                          }
                        }
                      }
                    }
                    
                    // Fallback: try to get image from product directly
                    if (!productImage && item.product?.image) {
                      productImage = typeof item.product.image === 'string' 
                        ? item.product.image 
                        : item.product.image?.url || item.product.image?.imageUrl;
                    }
                    
                    const productPrice = Number(item.productVariant?.price ?? item.product?.price ?? 0);
                    const quantity = Number(item.quantity ?? 0);
                    
                    return (
                      <Card key={item.id} className="border-0 shadow-md hover:shadow-lg transition-shadow">
                        <div className="p-6">
                          <div className="flex gap-6">
                            {/* Product Image */}
                            <div className="relative w-32 h-32 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 flex-shrink-0">
                              {productImage ? (
                                <img
                                  src={productImage}
                                  alt={productName}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    console.error('Failed to load product image:', productImage, 'for product:', item.productId);
                                    (e.target as HTMLImageElement).style.display = 'none';
                                  }}
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <ShoppingBag className="h-12 w-12 text-gray-400" />
                                </div>
                              )}
                            </div>

                          {/* Product Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-4 mb-3">
                              <div className="flex-1">
                                <h3 className="font-bold text-lg mb-1 text-gray-900 dark:text-white" title={productName}>
                                  {productName}
                                </h3>
                                {item.product?.sku && (
                                  <p className="text-sm text-gray-500 font-mono">
                                    SKU: {item.product.sku}
                                  </p>
                                )}
                              </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 flex-shrink-0"
                            onClick={() => removeItem(item.id)}
                          >
                            <Trash2 className="h-5 w-5" />
                          </Button>
                        </div>

                        <div className="flex items-center justify-between">
                          {/* Quantity Controls */}
                          <div className="flex items-center gap-3">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-10 w-10 border-2"
                              onClick={() => updateQuantity(item.id, quantity - 1)}
                              disabled={quantity <= 1}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="w-12 text-center font-bold text-lg">
                              {quantity}
                            </span>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-10 w-10 border-2"
                              onClick={() => updateQuantity(item.id, quantity + 1)}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>

                          {/* Price */}
                          <div className="text-left">
                            <p className="font-bold text-2xl text-indigo-600">
                              {(productPrice * quantity).toFixed(2)} ر.س
                            </p>
                            <p className="text-sm text-gray-500">
                              {productPrice.toFixed(2)} ر.س × {quantity}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            }).filter(Boolean)}

              {/* Continue Shopping */}
              <Link to="/products">
                <Button variant="outline" size="lg" className="w-full border-2">
                  <ShoppingCart className="ml-2 h-5 w-5" />
                  متابعة التسوق
                </Button>
              </Link>
            </div>

            {/* Order Summary */}
            <div>
              <Card className="sticky top-4 border-0 shadow-lg">
                <div className="p-6">
                  <h2 className="text-2xl font-bold mb-6">ملخص الطلب</h2>

                  {/* Coupon Code */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium mb-2">
                      كود الخصم
                    </label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="أدخل الكود"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        className="flex-1"
                      />
                      <Button onClick={applyCoupon} variant="outline">
                        تطبيق
                      </Button>
                    </div>
                  </div>

                  <Separator className="my-6" />

                  {/* Price Breakdown */}
                  <div className="space-y-4 mb-6">
                    <div className="flex justify-between text-lg">
                      <span className="text-gray-600 dark:text-gray-400">المجموع الفرعي</span>
                      <span className="font-semibold">{subtotal.toFixed(2)} ر.س</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">الشحن</span>
                      <span className="font-semibold">
                        {shipping === 0 ? (
                          <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                            مجاني
                          </Badge>
                        ) : (
                          `${shipping.toFixed(2)} ر.س`
                        )}
                      </span>
                    </div>
                    {shipping > 0 && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        أضف {(200 - subtotal).toFixed(2)} ر.س للحصول على شحن مجاني
                      </p>
                    )}
                  </div>

                  <Separator className="my-6" />

                  {/* Total */}
                  <div className="flex justify-between items-center mb-6">
                    <span className="text-xl font-bold">الإجمالي</span>
                    <span className="text-3xl font-bold text-indigo-600">
                      {total.toFixed(2)} ر.س
                    </span>
                  </div>

                  {/* Checkout Button */}
                  <Link to="/checkout">
                    <Button 
                      size="lg" 
                      className="w-full h-14 text-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg mb-4"
                    >
                      إتمام الطلب
                      <ArrowRight className="mr-2 h-5 w-5" />
                    </Button>
                  </Link>

                  {/* Trust Badges */}
                  <div className="space-y-3 pt-4 border-t">
                    <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                      <Shield className="h-5 w-5 text-green-600 flex-shrink-0" />
                      <span>دفع آمن ومشفر</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                      <Truck className="h-5 w-5 text-blue-600 flex-shrink-0" />
                      <span>شحن سريع وموثوق</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                      <Tag className="h-5 w-5 text-purple-600 flex-shrink-0" />
                      <span>أفضل الأسعار مضمونة</span>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
