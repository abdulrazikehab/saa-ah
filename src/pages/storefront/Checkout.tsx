import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { Loader2, CreditCard, Truck, Calculator, Wallet, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';
import { coreApi } from '@/lib/api';
import { paymentService, AvailablePaymentMethod } from '@/services/payment.service';
import { walletService } from '@/services/wallet.service';
import { useStoreSettings } from '@/contexts/StoreSettingsContext';
import { useCart } from '@/contexts/CartContext';

import { Cart, CartItem, ShippingMethod } from '@/services/types';

// Provider display names
const PROVIDER_NAMES: Record<string, { nameKey: string; defaultName: string; descKey: string; defaultDesc: string }> = {
  WALLET_BALANCE: { 
    nameKey: 'payment.wallet.name', defaultName: 'Wallet Balance',
    descKey: 'payment.wallet.desc', defaultDesc: 'Use your wallet balance for payment'
  },
  HYPERPAY: { 
    nameKey: 'payment.hyperpay.name', defaultName: 'Credit Card (HyperPay)',
    descKey: 'payment.hyperpay.desc', defaultDesc: 'Visa, Mastercard, Mada'
  },
  STRIPE: { 
    nameKey: 'payment.stripe.name', defaultName: 'Credit Card (Stripe)',
    descKey: 'payment.stripe.desc', defaultDesc: 'Visa, Mastercard'
  },
  PAYPAL: { 
    nameKey: 'payment.paypal.name', defaultName: 'PayPal',
    descKey: 'payment.paypal.desc', defaultDesc: 'Pay via PayPal'
  },
  CASH_ON_DELIVERY: { 
    nameKey: 'payment.cod.name', defaultName: 'Cash on Delivery',
    descKey: 'payment.cod.desc', defaultDesc: 'Pay cash upon delivery'
  },
  BANK_TRANSFER: { 
    nameKey: 'payment.bank.name', defaultName: 'Bank Transfer',
    descKey: 'payment.bank.desc', defaultDesc: 'Pay via direct bank transfer'
  },
};

export default function Checkout() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { cart, loading: cartLoading, refreshCart, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [shippingRates, setShippingRates] = useState<ShippingMethod[]>([]);
  const [taxAmount, setTaxAmount] = useState(0);
  const { settings } = useStoreSettings();
  const [paymentMethods, setPaymentMethods] = useState<AvailablePaymentMethod[]>([]);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  const [formData, setFormData] = useState({
    // Shipping Address
    fullName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    country: 'SA',
    postalCode: '',
    // Shipping Method
    shippingMethod: '',
    // Payment - Default will be set based on login status
    paymentMethod: '',
  });

  // Removed loadCart as we use useCart hook now

  const loadPaymentMethods = useCallback(async () => {
    try {
      const methods = await paymentService.getPaymentMethods();
      setPaymentMethods(methods);
      
      if (methods.length > 0) {
        const cod = methods.find(m => m.provider === 'CASH_ON_DELIVERY');
        const isDigitalStore = settings?.storeType === 'DIGITAL_CARDS';
        
        setFormData(prev => ({
          ...prev,
          paymentMethod: prev.paymentMethod || (isDigitalStore ? methods.find(m => m.provider !== 'CASH_ON_DELIVERY')?.provider : cod?.provider) || methods[0]?.provider || 'WALLET_BALANCE',
        }));
      }
    } catch (error) {
      console.error('Failed to load payment methods:', error);
      const isDigitalStore = settings?.storeType === 'DIGITAL_CARDS';
      if (!isDigitalStore) {
        setPaymentMethods([{
          id: 'fallback-cod',
          provider: 'CASH_ON_DELIVERY',
          name: 'الدفع عند الاستلام',
          isActive: true,
        }]);
      }
    }
  }, [settings?.storeType]);

  const loadWalletBalance = useCallback(async () => {
    try {
      const token = localStorage.getItem('customerToken');
      if (token) {
        const wallet = await walletService.getBalance();
        const balance = Number(wallet.balance) || 0;
        setWalletBalance(balance);
      }
    } catch (error) {
      console.error('Failed to load wallet balance:', error);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('customerToken');
    setIsLoggedIn(!!token);
    refreshCart();
    loadPaymentMethods();
    loadWalletBalance();
  }, [refreshCart, loadPaymentMethods, loadWalletBalance]);

  const isShippingEnabled = settings?.shippingEnabled === true && settings?.storeType !== 'DIGITAL_CARDS';
  const isShippingRequired = isShippingEnabled;

  const calculateShipping = useCallback(async () => {
    if (!isShippingRequired || !cart) {
      setShippingRates([]);
      return;
    }
    
    try {
      const rates = await coreApi.calculateShipping({
        destination: {
          country: formData.country,
          city: formData.city,
          postalCode: formData.postalCode,
        },
        items: cart.items || [],
      });
      setShippingRates(Array.isArray(rates) ? rates : [rates]);
    } catch (error) {
      console.error('Failed to calculate shipping:', error);
      setShippingRates([]);
    }
  }, [isShippingRequired, cart, formData.country, formData.city, formData.postalCode]);

  const calculateTax = useCallback(async () => {
    if (settings?.taxEnabled === false || !cart) {
      setTaxAmount(0);
      return;
    }
    
    try {
      const tax = await coreApi.calculateTax({
        amount: cart.total || 0,
        country: formData.country,
        state: formData.state,
      });
      setTaxAmount(tax.amount || 0);
    } catch (error) {
      console.error('Failed to calculate tax:', error);
      setTaxAmount(0);
    }
  }, [settings?.taxEnabled, cart, formData.country, formData.state]);

  useEffect(() => {
    if (formData.country && formData.city && cart) {
      if (isShippingRequired) {
        calculateShipping();
      }
      if (settings?.taxEnabled !== false) {
        calculateTax();
      }
    }
  }, [formData.country, formData.city, cart, settings?.taxEnabled, isShippingRequired, calculateShipping, calculateTax]);

  const getAllPaymentMethods = (): AvailablePaymentMethod[] => {
    const methods: AvailablePaymentMethod[] = [];
    const isWalletEnabled = settings?.paymentMethods?.includes('WALLET_PAYMENT');
    const isDigitalStore = settings?.storeType === 'DIGITAL_CARDS';

    if (isLoggedIn && isWalletEnabled) {
      methods.push({
        id: 'wallet-balance',
        provider: 'WALLET_BALANCE',
        name: 'الدفع من الرصيد',
        isActive: true,
      });
    }
    
    if (settings?.paymentMethods && settings.paymentMethods.length > 0) {
      const enabledMethods = paymentMethods.filter(m => {
        if (isDigitalStore && m.provider === 'CASH_ON_DELIVERY') {
          return false;
        }
        return settings.paymentMethods?.includes(m.provider);
      });
      methods.push(...enabledMethods);
    } else {
      const filteredMethods = isDigitalStore 
        ? paymentMethods.filter(m => m.provider !== 'CASH_ON_DELIVERY')
        : paymentMethods;
      methods.push(...filteredMethods);
    }
    
    return methods;
  };

  const selectedShipping = shippingRates.find(r => r.id === formData.shippingMethod);
  
  // Get cart items - ensure it's always an array
  const cartItems: CartItem[] = Array.isArray(cart?.cartItems) 
    ? cart!.cartItems! 
    : Array.isArray(cart?.items) 
      ? cart!.items 
      : [];

  const validCartItems = cartItems.filter((item: CartItem) => item && (item.product || item.unitPriceSnapshot));
  
  // Calculate subtotal considering various price sources
  const subtotal = validCartItems.reduce((sum: number, item: CartItem) => {
    // Priority: 1. unitPriceSnapshot 2. productVariant 3. retailPrice 4. wholesalePrice 5. product.price
    const price = 
      item.unitPriceSnapshot ??
      item.productVariant?.price ?? 
      item.product?.retailPrice ?? 
      item.product?.wholesalePrice ?? 
      item.product?.price ?? 
      0;
    
    return sum + Number(price) * (item.quantity || 1);
  }, 0);
  
  const shippingCost = isShippingRequired ? (selectedShipping?.cost || 0) : 0;
  const finalTaxAmount = settings?.taxEnabled !== false ? taxAmount : 0;
  const total = subtotal + shippingCost + finalTaxAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (formData.paymentMethod === 'WALLET_BALANCE' && walletBalance < total) {
        toast({
          variant: 'destructive',
          title: t('common.error'),
          description: t('checkout.insufficientWalletDesc'),
        });
        setLoading(false);
        return;
      }

      const shippingAddress = isShippingRequired ? {
          fullName: formData.fullName,
          street: formData.address,
          city: formData.city,
          state: formData.state,
          country: formData.country,
          postalCode: formData.postalCode,
      } : {
          fullName: formData.fullName,
          street: 'Digital Delivery',
          city: 'Digital',
          state: 'Digital',
          country: formData.country || 'SA',
          postalCode: '00000',
      };

      if (!cart?.id) {
        toast({
          variant: 'destructive',
          title: t('common.error'),
          description: 'السلة غير موجودة. يرجى إضافة منتجات إلى السلة أولاً.',
        });
        setLoading(false);
        return;
      }

      let order;
      if (!isLoggedIn) {
        const guestOrderData = {
          guestEmail: formData.email,
          guestName: formData.fullName,
          guestPhone: formData.phone,
          totalAmount: total,
          subtotalAmount: subtotal,
          taxAmount: finalTaxAmount,
          shippingAmount: shippingCost,
          discountAmount: 0,
          items: validCartItems.map((item: CartItem) => ({
            productId: item.product?.id || item.productId,
            productVariantId: item.productVariant?.id || item.variantId,
            quantity: item.quantity || 1,
            price: item.unitPriceSnapshot ?? item.productVariant?.price ?? item.product?.retailPrice ?? item.product?.wholesalePrice ?? item.product?.price ?? 0,
            productName: item.product?.name || 'Product',
            variantName: item.productVariant?.name,
            sku: item.productVariant?.sku || item.product?.sku,
          })),
          shippingAddress,
          billingAddress: shippingAddress,
          ipAddress: '0.0.0.0',
        };

        order = await coreApi.post('/guest-checkout/order', guestOrderData, { requireAuth: false });
      } else {
        order = await coreApi.createOrder({
          cartId: cart.id,
          shippingAddress,
          customerEmail: formData.email,
          customerName: formData.fullName,
          customerPhone: formData.phone,
          contact: {
            email: formData.email,
            phone: formData.phone,
          },
          shippingMethod: isShippingRequired ? formData.shippingMethod : 'digital_delivery',
          paymentMethod: formData.paymentMethod,
          useWalletBalance: formData.paymentMethod === 'WALLET_BALANCE',
        });
      }

      if (formData.paymentMethod !== 'CASH_ON_DELIVERY' && formData.paymentMethod !== 'WALLET_BALANCE') {
        try {
          const payment = await coreApi.initializePayment({
            orderId: order.id,
            method: formData.paymentMethod,
            amount: order.total || order.totalAmount || total,
          });

          if (payment.redirectUrl) {
            window.location.href = payment.redirectUrl;
            return;
          }
        } catch (paymentError) {
          console.error('Payment initialization error:', paymentError);
        }
      }

      toast({
        title: t('common.success'),
        description: formData.paymentMethod === 'WALLET_BALANCE' 
          ? 'تم الدفع من رصيد المحفظة بنجاح' 
          : isLoggedIn
            ? 'تم إنشاء الطلب بنجاح'
            : 'تم إنشاء الطلب بنجاح. سيتم إرسال تفاصيل الطلب إلى بريدك الإلكتروني',
      });
      
      // Clear cart after successful order creation
      await clearCart();
      
      // Save email for guest orders so they can view their orders later
      if (!isLoggedIn && formData.email) {
        localStorage.setItem('lastOrderEmail', formData.email);
        sessionStorage.setItem('guestOrderEmail', formData.email);
      }
      
      if (!isLoggedIn && order.orderNumber) {
        navigate(`/order-confirmation/${order.orderNumber}?email=${encodeURIComponent(formData.email)}`);
      } else {
        navigate(`/orders/${order.id}`);
      }
    } catch (error) {
      console.error('Order creation error:', error);
      const err = error as { data?: { message?: string }, message?: string };
      let errorMessage = 'فشل إنشاء الطلب';
      if (err?.data?.message) {
        errorMessage = err.data.message;
      } else if (err?.message) {
        errorMessage = err.message;
      }
      toast({
        variant: 'destructive',
        title: t('common.error'),
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  if (cartLoading && !cart) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="container max-w-6xl">
        <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          {t('checkout.title', 'Checkout')}
        </h1>

        <form onSubmit={handleSubmit}>
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="h-5 w-5" />
                    {isShippingRequired ? t('checkout.shippingInfo', 'Shipping Information') : t('checkout.customerInfo', 'Customer Information')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">{t('common.fullName', 'Full Name')} *</Label>
                      <Input
                        id="fullName"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">{t('common.phone', 'Phone Number')} *</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">{t('common.email', 'Email')} *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                  
                  {isShippingRequired && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="address">{t('common.address', 'Address')} *</Label>
                        <Input
                          id="address"
                          value={formData.address}
                          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                          required
                        />
                      </div>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="city">{t('common.city', 'City')} *</Label>
                          <Input
                            id="city"
                            value={formData.city}
                            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="state">{t('common.state', 'State/Region')}</Label>
                          <Input
                            id="state"
                            value={formData.state}
                            onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="country">{t('common.country', 'Country')} *</Label>
                          <Input
                            id="country"
                            value={formData.country}
                            onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="postalCode">{t('common.postalCode', 'Postal Code')}</Label>
                          <Input
                            id="postalCode"
                            value={formData.postalCode}
                            onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                          />
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {isShippingRequired && shippingRates.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>{t('checkout.shippingMethod', 'Shipping Method')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <RadioGroup
                      value={formData.shippingMethod}
                      onValueChange={(value) => setFormData({ ...formData, shippingMethod: value })}
                    >
                      {shippingRates.map((rate) => (
                        <div key={rate.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <RadioGroupItem value={rate.id} id={rate.id} />
                            <Label htmlFor={rate.id} className="cursor-pointer">
                              <p className="font-medium">{rate.name}</p>
                              <p className="text-sm text-muted-foreground">{rate.estimatedDays} {t('common.days', 'days')}</p>
                            </Label>
                          </div>
                          <span className="font-semibold">{rate.cost.toFixed(2)} {i18n.language === 'ar' ? 'ر.س' : (settings?.currency || 'SAR')}</span>
                        </div>
                      ))}
                    </RadioGroup>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    {t('checkout.paymentMethod', 'Payment Method')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isLoggedIn && (
                    <div className={`flex items-center justify-between p-4 rounded-xl border-2 ${
                      walletBalance > 0 ? 'border-primary/30 bg-primary/5' : 'border-border bg-muted/30'
                    }`}>
                      <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-xl ${
                          walletBalance > 0 ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                        }`}>
                          <Wallet className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-semibold">{t('checkout.walletBalance', 'Wallet Balance')}</p>
                          <p className="text-sm text-muted-foreground">{t('checkout.availableBalance', 'Available balance for payment')}</p>
                        </div>
                      </div>
                      <div className="text-left">
                        <p className={`text-2xl font-bold ${
                          walletBalance >= total ? 'text-primary' : 'text-muted-foreground'
                        }`}>
                          {walletBalance.toFixed(2)} {i18n.language === 'ar' ? 'ر.س' : (settings?.currency || 'SAR')}
                        </p>
                        {walletBalance > 0 && walletBalance >= total ? (
                          <p className="text-xs text-green-600 flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            {t('checkout.sufficientBalance', 'Sufficient balance')}
                          </p>
                        ) : (
                          <p className="text-xs text-orange-600 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {t('checkout.insufficientBalance', 'Insufficient balance')}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                   <RadioGroup
                    value={formData.paymentMethod}
                    onValueChange={(value) => setFormData({ ...formData, paymentMethod: value })}
                    className="space-y-3"
                  >
                    {!settings ? (
                      <div className="text-center py-4 text-muted-foreground flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {t('checkout.loadingPaymentMethods', 'Loading payment methods...')}
                      </div>
                    ) : getAllPaymentMethods().length === 0 ? (
                      <div className="text-center py-8 border-2 border-dashed rounded-xl bg-muted/20">
                        <AlertCircle className="h-8 w-8 mx-auto mb-2 text-orange-500" />
                        <p className="font-medium">{t('checkout.noPaymentMethods', 'No payment methods available')}</p>
                        <p className="text-sm text-muted-foreground">{t('checkout.noPaymentMethodsDesc', 'Please recharge your balance or contact support')}</p>
                      </div>
                    ) : (
                      getAllPaymentMethods().map((method) => {
                        const provider = PROVIDER_NAMES[method.provider];
                        const displayName = provider ? t(provider.nameKey, provider.defaultName) : method.name;
                        const displayDesc = provider ? t(provider.descKey, provider.defaultDesc) : '';
                        
                        const isWallet = method.provider === 'WALLET_BALANCE';
                        const isDisabled = isWallet && (!isLoggedIn || walletBalance < total);
                        
                        return (
                          <div 
                            key={method.id} 
                            className={`flex items-center gap-3 p-4 border-2 rounded-xl transition-all ${
                              formData.paymentMethod === method.provider 
                                ? 'border-primary bg-primary/5 shadow-md' 
                                : 'border-border hover:border-primary/30'
                            } ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                            onClick={() => !isDisabled && setFormData({ ...formData, paymentMethod: method.provider })}
                          >
                            <RadioGroupItem 
                              value={method.provider} 
                              id={method.provider} 
                              disabled={isDisabled}
                            />
                            <Label htmlFor={method.provider} className={`flex-1 ${isDisabled ? '' : 'cursor-pointer'}`}>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  {isWallet && <Wallet className="h-4 w-4 text-primary" />}
                                  <p className="font-medium">{displayName}</p>
                                  {isWallet && isLoggedIn && formData.paymentMethod === 'WALLET_BALANCE' && (
                                    <span className="px-2 py-0.5 bg-primary text-white text-xs rounded-full">{t('common.preferred', 'Preferred')}</span>
                                  )}
                                </div>
                                {isWallet && isLoggedIn && (
                                  <span className={`text-sm font-bold ${walletBalance >= total ? 'text-green-600' : 'text-red-600'}`}>
                                    {walletBalance.toFixed(2)} {i18n.language === 'ar' ? 'ر.س' : (settings?.currency || 'SAR')}
                                  </span>
                                )}
                                {isWallet && !isLoggedIn && (
                                  <span className="text-xs text-muted-foreground">
                                    {t('common.loginRequired', 'Login required')}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">{displayDesc}</p>
                            </Label>
                          </div>
                        );
                      })
                    )}
                  </RadioGroup>
                </CardContent>
              </Card>
            </div>

            <div>
              <Card className="sticky top-4">
                <CardHeader>
                  <CardTitle>{t('checkout.orderSummary', 'Order Summary')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('cart.subtotal', 'Subtotal')}</span>
                    <span className="font-semibold">{subtotal.toFixed(2)} {i18n.language === 'ar' ? 'ر.س' : (settings?.currency || 'SAR')}</span>
                  </div>
                   {isShippingRequired && selectedShipping && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('cart.shipping', 'Shipping')}</span>
                      <span className="font-semibold">{shippingCost.toFixed(2)} {i18n.language === 'ar' ? 'ر.س' : (settings?.currency || 'SAR')}</span>
                    </div>
                  )}
                  {settings?.taxEnabled !== false && finalTaxAmount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Calculator className="h-4 w-4" />
                        {t('cart.tax', 'Tax')}
                      </span>
                      <span className="font-semibold">{finalTaxAmount.toFixed(2)} {i18n.language === 'ar' ? 'ر.س' : (settings?.currency || 'SAR')}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>{t('cart.total', 'Total')}</span>
                    <span className="text-primary">{total.toFixed(2)} {i18n.language === 'ar' ? 'ر.س' : (settings?.currency || 'SAR')}</span>
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full" 
                    size="lg" 
                    disabled={
                      loading || 
                      (isShippingRequired && !formData.shippingMethod) || 
                      !formData.paymentMethod ||
                      (formData.paymentMethod === 'WALLET_BALANCE' && walletBalance < total)
                    }
                  >
                    {loading ? (
                      <>
                        <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                        {t('common.processing', 'Processing...')}
                      </>
                    ) : (
                      <>
                        <CreditCard className="ml-2 h-4 w-4" />
                        {t('checkout.placeOrder', 'Place Order')}
                      </>
                    )}
                  </Button>
                  {formData.paymentMethod === 'WALLET_BALANCE' && walletBalance < total && (
                    <div className="mt-4 space-y-3">
                      <p className="text-sm text-red-600 text-center font-medium">
                        {t('checkout.insufficientWalletDesc', 'Sorry, your wallet balance is insufficient for this order. Please recharge or choose another payment method.')}
                      </p>
                      <Button 
                        type="button" 
                        variant="outline" 
                        className="w-full border-primary text-primary hover:bg-primary/5 gap-2"
                        onClick={() => navigate('/profile?tab=wallet')}
                      >
                        <Wallet className="h-4 w-4" />
                        {t('checkout.rechargeNow', 'Recharge Now')}
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
