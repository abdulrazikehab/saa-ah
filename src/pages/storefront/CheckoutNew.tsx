import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GuestCheckoutForm } from '@/components/checkout/GuestCheckoutForm';
import { UserPlus, LogIn, ShoppingBag } from 'lucide-react';

export default function CheckoutPage() {
  const [checkoutType, setCheckoutType] = useState<'guest' | 'login' | 'register'>('guest');
  
  // Mock cart data - replace with actual cart from context/state
  const cartItems = [
    {
      productId: '1',
      productName: 'iPhone 14 Pro',
      quantity: 1,
      price: 4999,
      sku: 'IPH14PRO',
    },
  ];
  
  const totalAmount = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleOrderComplete = (orderNumber: string) => {
    console.log('Order completed:', orderNumber);
    // Clear cart, redirect, etc.
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="container max-w-6xl">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Checkout Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-3xl">إتمام الطلب</CardTitle>
                <CardDescription>
                  اختر طريقة الدفع وأكمل طلبك
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={checkoutType} onValueChange={(v) => setCheckoutType(v as any)}>
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="guest" className="flex items-center gap-2">
                      <ShoppingBag className="h-4 w-4" />
                      ضيف
                    </TabsTrigger>
                    <TabsTrigger value="login" className="flex items-center gap-2">
                      <LogIn className="h-4 w-4" />
                      تسجيل دخول
                    </TabsTrigger>
                    <TabsTrigger value="register" className="flex items-center gap-2">
                      <UserPlus className="h-4 w-4" />
                      إنشاء حساب
                    </TabsTrigger>
                  </TabsList>

                  {/* Guest Checkout */}
                  <TabsContent value="guest" className="mt-6">
                    <GuestCheckoutForm
                      cartItems={cartItems}
                      totalAmount={totalAmount}
                      onComplete={handleOrderComplete}
                    />
                  </TabsContent>

                  {/* Login */}
                  <TabsContent value="login" className="mt-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>تسجيل الدخول</CardTitle>
                        <CardDescription>
                          سجل دخولك للوصول إلى عنوانك المحفوظ وتتبع طلباتك
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="text-center py-8">
                          <p className="text-gray-600 dark:text-gray-400 mb-4">
                            هل لديك حساب؟
                          </p>
                          <Link to="/login">
                            <Button size="lg" className="w-full max-w-sm">
                              <LogIn className="mr-2 h-5 w-5" />
                              تسجيل الدخول
                            </Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Register */}
                  <TabsContent value="register" className="mt-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>إنشاء حساب جديد</CardTitle>
                        <CardDescription>
                          أنشئ حسابًا لتتبع طلباتك والحصول على عروض حصرية
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="text-center py-8">
                          <p className="text-gray-600 dark:text-gray-400 mb-4">
                            ليس لديك حساب؟
                          </p>
                          <Link to="/signup">
                            <Button size="lg" className="w-full max-w-sm">
                              <UserPlus className="mr-2 h-5 w-5" />
                              إنشاء حساب
                            </Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>ملخص الطلب</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Cart Items */}
                <div className="space-y-3">
                  {cartItems.map((item, index) => (
                    <div key={index} className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-medium">{item.productName}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          الكمية: {item.quantity}
                        </p>
                      </div>
                      <p className="font-semibold">{item.price * item.quantity} ر.س</p>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">المجموع الفرعي</span>
                    <span>{totalAmount} ر.س</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">الشحن</span>
                    <span>مجاني</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">الضريبة</span>
                    <span>0 ر.س</span>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between text-lg font-bold">
                    <span>الإجمالي</span>
                    <span className="text-indigo-600">{totalAmount} ر.س</span>
                  </div>
                </div>

                {/* Trust Badges */}
                <div className="border-t pt-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>دفع آمن ومشفر</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>شحن سريع</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>إرجاع مجاني خلال 14 يوم</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
