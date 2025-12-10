import { useState } from 'react';
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
  const { cart, loading, updateQuantity, removeItem } = useCart();
  const [couponCode, setCouponCode] = useState('');

  console.log('Cart Page: Current cart state:', cart);

  const applyCoupon = () => {
    if (!couponCode) return;
    toast({
      title: 'كود الخصم',
      description: 'تم تطبيق كود الخصم بنجاح',
    });
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

  const isEmpty = !cart?.cartItems?.length;
  const subtotal = cart?.cartItems?.reduce((sum: number, item: any) => {
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
              لديك {cart.cartItems.length} {cart.cartItems.length === 1 ? 'منتج' : 'منتجات'} في سلتك
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
            <Link to="/products">
              <Button size="lg" className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 px-8">
                تصفح المنتجات
                <ArrowRight className="mr-2 h-5 w-5" />
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cart.cartItems.map((item: any) => (
                <Card key={item.id} className="border-0 shadow-md hover:shadow-lg transition-shadow">
                  <div className="p-6">
                    <div className="flex gap-6">
                      {/* Product Image */}
                      <div className="relative w-32 h-32 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 flex-shrink-0">
                        {item.product?.images?.[0] ? (
                          <img
                            src={item.product.images[0]}
                            alt={item.product.name}
                            className="w-full h-full object-cover"
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
                            <h3 className="font-bold text-lg mb-1 text-gray-900 dark:text-white">
                              {item.product?.name}
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
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              disabled={item.quantity <= 1}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="w-12 text-center font-bold text-lg">
                              {item.quantity}
                            </span>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-10 w-10 border-2"
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>

                          {/* Price */}
                          <div className="text-left">
                            <p className="font-bold text-2xl text-indigo-600">
                              {(Number(item.productVariant?.price ?? item.product?.price ?? 0) * item.quantity).toFixed(2)} ر.س
                            </p>
                            <p className="text-sm text-gray-500">
                              {Number(item.productVariant?.price ?? item.product?.price ?? 0).toFixed(2)} ر.س × {item.quantity}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}

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
