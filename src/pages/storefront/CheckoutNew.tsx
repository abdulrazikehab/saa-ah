import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GuestCheckoutForm } from '@/components/checkout/GuestCheckoutForm';
import { UserPlus, LogIn, ShoppingBag } from 'lucide-react';
import { useEffect, useState as useReactState } from 'react';
import { coreApi } from '@/lib/api';
import { SiteSettings } from '@/services/types';
import { useTranslation } from 'react-i18next';
import { useStoreSettings } from '@/contexts/StoreSettingsContext';

export default function CheckoutPage() {
  const { t, i18n } = useTranslation();
  const { settings: contextSettings } = useStoreSettings();
  const [checkoutType, setCheckoutType] = useState<'guest' | 'login' | 'register'>('guest');
  const [settings, setSettings] = useReactState<SiteSettings | null>(null);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const data = await coreApi.get('/site-config');
        setSettings(data.settings);
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    };
    loadSettings();
  }, [setSettings]);

  const isShippingEnabled = settings?.shippingEnabled === true && settings?.storeType !== 'DIGITAL_CARDS';
  const isTaxEnabled = settings?.taxEnabled !== false;
  
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
                <CardTitle className="text-3xl">{t('checkout.title', 'Checkout')}</CardTitle>
                <CardDescription>
                  {t('checkout.description', 'Choose your payment method and complete your order')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={checkoutType} onValueChange={(v) => setCheckoutType(v as 'guest' | 'login' | 'register')}>
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="guest" className="flex items-center gap-2">
                      <ShoppingBag className="h-4 w-4" />
                      {t('checkout.guest', 'Guest')}
                    </TabsTrigger>
                    <TabsTrigger value="login" className="flex items-center gap-2">
                      <LogIn className="h-4 w-4" />
                      {t('auth.login.title', 'Login')}
                    </TabsTrigger>
                    <TabsTrigger value="register" className="flex items-center gap-2">
                      <UserPlus className="h-4 w-4" />
                      {t('auth.signup', 'Sign Up')}
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
                        <CardTitle>{t('auth.login.title', 'Login')}</CardTitle>
                        <CardDescription>
                          {t('checkout.loginDesc', 'Log in to access your saved addresses and track your orders')}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="text-center py-8">
                          <p className="text-gray-600 dark:text-gray-400 mb-4">
                            {t('auth.haveAccount', 'Already have an account?')}
                          </p>
                          <Link to="/login">
                            <Button size="lg" className="w-full max-w-sm">
                              <LogIn className="mr-2 h-5 w-5" />
                              {t('auth.login.button', 'Login')}
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
                        <CardTitle>{t('auth.createNewAccount', 'Create New Account')}</CardTitle>
                        <CardDescription>
                          {t('checkout.registerDesc', 'Create an account to track your orders and get exclusive offers')}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="text-center py-8">
                          <p className="text-gray-600 dark:text-gray-400 mb-4">
                            {t('auth.noAccount', "Don't have an account?")}
                          </p>
                          <Link to="/signup">
                            <Button size="lg" className="w-full max-w-sm">
                              <UserPlus className="mr-2 h-5 w-5" />
                              {t('auth.signup', 'Sign Up')}
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
                <CardTitle>{t('checkout.orderSummary', 'Order Summary')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Cart Items */}
                <div className="space-y-3">
                  {cartItems.map((item, index) => (
                    <div key={index} className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-medium">{item.productName}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {t('common.quantity', 'Quantity')}: {item.quantity}
                        </p>
                      </div>
                      <p className="font-semibold">{item.price * item.quantity} {i18n.language === 'ar' ? 'ر.س' : (settings?.currency || 'SAR')}</p>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">{t('cart.subtotal', 'Subtotal')}</span>
                    <span>{totalAmount} {i18n.language === 'ar' ? 'ر.س' : (settings?.currency || 'SAR')}</span>
                  </div>
                  {isShippingEnabled && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">{t('cart.shipping', 'Shipping')}</span>
                      <span>{t('common.free', 'Free')}</span>
                    </div>
                  )}
                  {isTaxEnabled && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">{t('cart.tax', 'Tax')}</span>
                      <span>0 {i18n.language === 'ar' ? 'ر.س' : (settings?.currency || 'SAR')}</span>
                    </div>
                  )}
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between text-lg font-bold">
                    <span>{t('cart.total', 'Total')}</span>
                    <span className="text-indigo-600">{totalAmount} {i18n.language === 'ar' ? 'ر.س' : (settings?.currency || 'SAR')}</span>
                  </div>
                </div>

                {/* Trust Badges */}
                <div className="border-t pt-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>{t('checkout.securePayment', 'Secure and encrypted payment')}</span>
                  </div>
                  {isShippingEnabled && (
                    <>
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>{t('checkout.fastShipping', 'Fast shipping')}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>{t('checkout.freeReturns', 'Free returns within 14 days')}</span>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
