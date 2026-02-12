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
import { Loader2, CreditCard, Truck, Calculator, Wallet, CheckCircle, AlertCircle, ExternalLink, FileText, FileSpreadsheet, File, Mail, MessageSquare, Package } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { coreApi } from '@/lib/api';
import { paymentService, AvailablePaymentMethod } from '@/services/payment.service';
import { walletService } from '@/services/wallet.service';
import { useStoreSettings } from '@/contexts/StoreSettingsContext';
import { useCart } from '@/contexts/CartContext';
import { getErrorMessage } from '@/lib/error-utils';
import { useAuth } from '@/contexts/AuthContext';
import { SectionRenderer } from '@/components/builder/SectionRenderer';
import { Section } from '@/components/builder/PageBuilder';
import { Page, Cart, CartItem, ShippingMethod } from '@/services/types';
import { Capacitor } from '@capacitor/core';
import MobileCheckout from '@/pages/mobile/MobileCheckout';
import { formatCurrency } from '@/lib/currency-utils';

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

// Check if running in native/mobile mode (must be outside component to avoid hooks rules)
const checkIsNative = () => {
  if (typeof window === 'undefined') return false;
  return Capacitor.isNativePlatform() || 
         window.location.href.includes('platform=mobile') || 
         sessionStorage.getItem('isMobilePlatform') === 'true';
};

export default function Checkout() {
  // Early return for mobile - must be first before any hooks
  if (checkIsNative()) {
    return <MobileCheckout />;
  }
  
  return <WebCheckout />;
}

function WebCheckout() {
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
  const { user, isAuthenticated } = useAuth();
  const [customPage, setCustomPage] = useState<Page | null>(null);

  // Fetch custom checkout page on mount
  useEffect(() => {
    const fetchCustomPage = async () => {
      try {
        const checkoutPage = await coreApi.getPageBySlug('checkout');
        if (checkoutPage && checkoutPage.isPublished && 
            checkoutPage.content?.sections && 
            Array.isArray(checkoutPage.content.sections) && 
            checkoutPage.content.sections.length > 0) {
          setCustomPage(checkoutPage);
        }
      } catch (e) {
        // No custom page found, continue with default layout
      }
    };
    fetchCustomPage();
  }, []);
  
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
    // Serial Number Delivery Options
    serialNumberDelivery: [] as string[], // Array of selected options: 'text', 'excel', 'pdf', 'email', 'whatsapp', 'inventory'
  });

  // Calculate cart items and subtotal early to use in other logic
  const cartItems: CartItem[] = Array.isArray(cart?.cartItems) 
    ? cart!.cartItems! 
    : Array.isArray(cart?.items) 
      ? cart!.items 
      : [];

  const validCartItems = cartItems.filter((item: CartItem) => item && (item.product || item.unitPriceSnapshot));
  
  const subtotal = validCartItems.reduce((sum: number, item: CartItem) => {
    const price = 
      item.unitPriceSnapshot ??
      item.productVariant?.price ?? 
      item.product?.retailPrice ?? 
      item.product?.wholesalePrice ?? 
      item.product?.price ?? 
      0;
    
    return sum + Number(price) * (item.quantity || 1);
  }, 0);

  // Removed loadCart as we use useCart hook now

  const loadPaymentMethods = useCallback(async () => {
    try {
      const methods = await paymentService.getPaymentMethods();
      const isDigitalStore = settings?.storeType === 'DIGITAL_CARDS';
      // Backend currently always injects COD as a fallback. For digital stores, COD is invalid.
      const filteredMethods = isDigitalStore
        ? methods.filter(m => m.provider !== 'CASH_ON_DELIVERY')
        : methods;

      setPaymentMethods(filteredMethods);
      
        if (filteredMethods.length > 0 || isAuthenticated) {
          // Build a list for default selection that can include wallet (even if backend doesn't list it)
          const methodsForDefault = [...filteredMethods];
          if (isAuthenticated && !methodsForDefault.some(m => m.provider === 'WALLET_BALANCE')) {
            methodsForDefault.unshift({
              id: 'WALLET_BALANCE',
              provider: 'WALLET_BALANCE',
              name: 'Wallet Balance',
              isActive: true,
            });
          }

          const cod = methodsForDefault.find(m => m.provider === 'CASH_ON_DELIVERY');
          
          let defaultMethod = '';
          
          // STRICT PRIORITY: Wallet
          // If user has enough balance, we prefer wallet.
          if (isAuthenticated && walletBalance >= subtotal) {
             defaultMethod = 'WALLET_BALANCE';
             console.log('[Checkout] Auto-selecting Wallet (Sufficient Balance)');
          } else {
             // Fallback logic
             if (isDigitalStore) {
               // For digital store, try to find text/external
               defaultMethod = methodsForDefault.find(m => m.provider !== 'CASH_ON_DELIVERY')?.provider || methodsForDefault[0]?.provider;
             } else {
               // Physical store
               defaultMethod = cod?.provider || methodsForDefault[0]?.provider;
             }
          }
  
          console.log('[Checkout] Final Default Method:', defaultMethod);
  
          setFormData(prev => {
             // If we determined a strong default (Wallet), enforce it.
             // Otherwise, preserve user selection if valid, else use default.
             const currentIsValid = methodsForDefault.some(m => m.provider === prev.paymentMethod);
             const prevIsCOD = prev.paymentMethod === 'CASH_ON_DELIVERY';
             const codNotAllowed = isDigitalStore && prevIsCOD;
             
             if (defaultMethod === 'WALLET_BALANCE') {
                 return { ...prev, paymentMethod: 'WALLET_BALANCE' }; 
             }
             
             return {
               ...prev,
               // For digital store, never keep COD.
               paymentMethod: (!codNotAllowed && currentIsValid && prev.paymentMethod) ? prev.paymentMethod : (defaultMethod || prev.paymentMethod),
             };
          });
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
  }, [settings?.storeType, isAuthenticated, walletBalance, subtotal]);

  const loadWalletBalance = useCallback(async () => {
    try {
      if (isAuthenticated) {
        const wallet = await walletService.getBalance();
        const balance = Number(wallet.balance) || 0;
        setWalletBalance(balance);
      }
    } catch (error) {
      console.error('Failed to load wallet balance:', error);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      // Default to inventory delivery if logged in
      setFormData(prev => ({
        ...prev,
        fullName: prev.fullName || user?.name || '',
        email: prev.email || user?.email || '',
        phone: prev.phone || user?.phone || '',
        serialNumberDelivery: prev.serialNumberDelivery.includes('inventory') 
          ? prev.serialNumberDelivery 
          : [...prev.serialNumberDelivery, 'inventory']
      }));
    }

    refreshCart();
    loadPaymentMethods();
    loadWalletBalance();
  }, [refreshCart, loadPaymentMethods, loadWalletBalance, isAuthenticated, user]);

  const isShippingEnabled = settings?.shippingEnabled === true && settings?.storeType !== 'DIGITAL_CARDS';
  
  // Smarter shipping required check: Must have at least one physical product
  const isShippingRequired = isShippingEnabled && validCartItems.some(item => {
    const product = item.product;
    if (!product) return false;
    
    // Digital products don't need shipping
    const isDigital = 
      product.productType === 'DIGITAL_CARD' || 
      product.type === 'DIGITAL_CARD' || 
      product.isCardProduct === true ||
      !!product.productCode; // Products with a supplier-hub productCode are digital
      
    return !isDigital;
  });

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
    const isDigitalStore = settings?.storeType === 'DIGITAL_CARDS';

    // Wallet balance is a first-class customer payment option when logged in.
    // (Even if tenant payment settings aren't configured correctly, wallet should still work.)
    if (isAuthenticated) {
      methods.push({
        id: 'WALLET_BALANCE',
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
  
  // subtotal and validCartItems are now defined higher up
  
  const shippingCost = isShippingRequired ? (selectedShipping?.cost || 0) : 0;
  const finalTaxAmount = settings?.taxEnabled !== false ? taxAmount : 0;
  const total = subtotal + shippingCost + finalTaxAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate delivery options for digital cards stores
      const isDigitalStore = settings?.storeType === 'DIGITAL_CARDS';
      const hasDigitalProducts = validCartItems.some(item => {
        const product = item.product;
        return product?.isCardProduct || product?.productType === 'DIGITAL_CARD' || product?.type === 'DIGITAL_CARD' || product?.productCode;
      });

      if ((isDigitalStore || hasDigitalProducts) && formData.serialNumberDelivery.length === 0) {
        toast({
          variant: 'destructive',
          title: t('common.error'),
          description: t('checkoutPage.selectDeliveryOption', 'Please select at least one delivery option'),
        });
        setLoading(false);
        return;
      }

      if (formData.paymentMethod === 'WALLET_BALANCE' && walletBalance < total) {
        toast({
          variant: 'destructive',
          title: t('common.error'),
          description: t('checkoutPage.insufficientWalletDesc'),
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
          description: t('checkoutPage.cartEmpty', 'السلة غير موجودة. يرجى إضافة منتجات إلى السلة أولاً.'),
        });
        setLoading(false);
        return;
      }

      const orderPayload = {
        cartId: cart.id,
        customerEmail: formData.email,
        customerName: formData.fullName,
        customerPhone: formData.phone,
        shippingAddress,
        billingAddress: shippingAddress,
        paymentMethod: formData.paymentMethod,
        useWalletBalance: formData.paymentMethod === 'WALLET_BALANCE',
        serialNumberDelivery: formData.serialNumberDelivery, // Pass serial number delivery options
        // Pass everything required for the unified orders endpoint
      };
      
      console.log('🛒 [Checkout] Creating order with payload:', {
        ...orderPayload,
        shippingAddress: shippingAddress ? 'present' : 'missing',
        billingAddress: shippingAddress ? 'present' : 'missing',
        paymentMethod: formData.paymentMethod,
        useWalletBalance: formData.paymentMethod === 'WALLET_BALANCE',
        isAuthenticated,
      });
      
      const order = await coreApi.createOrder(orderPayload, isAuthenticated); // requireAuth is true only if logged in

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
          ? t('checkoutPage.walletPaid', 'تم الدفع من رصيد المحفظة بنجاح')
          : isAuthenticated
            ? t('checkoutPage.orderCreated', 'تم إنشاء الطلب بنجاح')
            : t('checkoutPage.orderCreatedGuest', 'تم إنشاء الطلب بنجاح. سيتم إرسال تفاصيل الطلب إلى بريدك الإلكتروني'),
      });
      
      // Clear cart after successful order creation
      await clearCart();
      
      // Save email for guest orders so they can view their orders later
      if (!isAuthenticated && formData.email) {
        localStorage.setItem('lastOrderEmail', formData.email);
        sessionStorage.setItem('guestOrderEmail', formData.email);
      }
      
      if (!isAuthenticated && order.orderNumber) {
        navigate(`/order-confirmation/${order.orderNumber}?email=${encodeURIComponent(formData.email)}`);
      } else {
        navigate(`/orders/${order.id}`);
      }
    } catch (error: unknown) {
      console.error('Order creation error:', error);
      
      // Extract more detailed error message
      let errorMessage = t('checkoutPage.orderError', 'حدث خطأ أثناء إنشاء الطلب. يرجى المحاولة مرة أخرى.');
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null) {
        const errObj = error as Record<string, any>;
        if (errObj.response?.data?.message) {
          errorMessage = errObj.response.data.message;
        } else if (errObj.message) {
          errorMessage = errObj.message;
        }
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else {
        errorMessage = getErrorMessage(error);
      }
      
      // Show specific error messages for common issues
      if (errorMessage.includes('Cart') || errorMessage.includes('cart') || errorMessage.includes('السلة')) {
        errorMessage = t('checkoutPage.cartEmpty', 'السلة غير موجودة. يرجى إضافة منتجات إلى السلة أولاً.');
      } else if (errorMessage.includes('email') || errorMessage.includes('Email') || errorMessage.includes('بريد')) {
        errorMessage = t('checkoutPage.emailRequired', 'البريد الإلكتروني مطلوب.');
      } else if (errorMessage.includes('inventory') || errorMessage.includes('Inventory') || errorMessage.includes('المخزون')) {
        errorMessage = t('checkoutPage.insufficientInventory', 'المخزون غير كافٍ. يرجى تحديث السلة.');
      } else if (errorMessage.includes('wallet') || errorMessage.includes('Wallet') || errorMessage.includes('المحفظة')) {
        errorMessage = t('checkoutPage.insufficientWalletDesc', 'رصيد المحفظة غير كافٍ.');
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

  // If custom page with sections exists, render it
  if (customPage && customPage.content?.sections && Array.isArray(customPage.content.sections)) {
    const sections = customPage.content.sections as Section[];
    return (
      <div className="min-h-screen bg-background">
        {sections.map((section, index) => (
          <SectionRenderer key={section.id || `section-${index}`} section={section} />
        ))}
      </div>
    );
  }

  // Default layout
  return (
    <div className="min-h-screen py-8">
      <div className="container max-w-6xl">
        <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          {t('checkoutPage.title', 'Checkout')}
        </h1>

        <form onSubmit={handleSubmit}>
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="h-5 w-5" />
                    {isShippingRequired ? t('checkoutPage.shippingInfo', 'Shipping Information') : t('checkoutPage.customerInfo', 'Customer Information')}
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
                        readOnly={isAuthenticated}
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
                        readOnly={isAuthenticated}
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
                      readOnly={isAuthenticated}
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
                    <CardTitle>{t('checkoutPage.shippingMethod', 'Shipping Method')}</CardTitle>
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
                          <span className="font-semibold">{formatCurrency(rate.cost, settings?.currency || 'SAR')}</span>
                        </div>
                      ))}
                    </RadioGroup>
                  </CardContent>
                </Card>
              )}

              {/* Serial Number Delivery Options - Only show for digital cards stores */}
              {(settings?.storeType === 'DIGITAL_CARDS' || validCartItems.some(item => {
                const product = item.product;
                const isDigitalProduct = product?.isCardProduct || product?.productType === 'DIGITAL_CARD' || product?.type === 'DIGITAL_CARD' || product?.productCode;
                return isDigitalProduct;
              })) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      {t('checkoutPage.serialNumberDelivery', 'Serial Number Delivery')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      {t('checkoutPage.serialNumberDeliveryDesc', 'Choose how you want to receive your card serial numbers')}
                    </p>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="delivery-text"
                          checked={formData.serialNumberDelivery.includes('text')}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setFormData(prev => ({
                                ...prev,
                                serialNumberDelivery: [...prev.serialNumberDelivery, 'text']
                              }));
                            } else {
                              setFormData(prev => ({
                                ...prev,
                                serialNumberDelivery: prev.serialNumberDelivery.filter(opt => opt !== 'text')
                              }));
                            }
                          }}
                        />
                        <Label htmlFor="delivery-text" className="flex items-center gap-2 cursor-pointer">
                          <FileText className="h-4 w-4" />
                          {t('checkoutPage.deliveryText', 'Text File (Serial numbers in columns)')}
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="delivery-excel"
                          checked={formData.serialNumberDelivery.includes('excel')}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setFormData(prev => ({
                                ...prev,
                                serialNumberDelivery: [...prev.serialNumberDelivery, 'excel']
                              }));
                            } else {
                              setFormData(prev => ({
                                ...prev,
                                serialNumberDelivery: prev.serialNumberDelivery.filter(opt => opt !== 'excel')
                              }));
                            }
                          }}
                        />
                        <Label htmlFor="delivery-excel" className="flex items-center gap-2 cursor-pointer">
                          <FileSpreadsheet className="h-4 w-4" />
                          {t('checkoutPage.deliveryExcel', 'Excel Sheet')}
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="delivery-pdf"
                          checked={formData.serialNumberDelivery.includes('pdf')}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setFormData(prev => ({
                                ...prev,
                                serialNumberDelivery: [...prev.serialNumberDelivery, 'pdf']
                              }));
                            } else {
                              setFormData(prev => ({
                                ...prev,
                                serialNumberDelivery: prev.serialNumberDelivery.filter(opt => opt !== 'pdf')
                              }));
                            }
                          }}
                        />
                        <Label htmlFor="delivery-pdf" className="flex items-center gap-2 cursor-pointer">
                          <File className="h-4 w-4" />
                          {t('checkoutPage.deliveryPdf', 'PDF Document')}
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="delivery-email"
                          checked={formData.serialNumberDelivery.includes('email')}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setFormData(prev => ({
                                ...prev,
                                serialNumberDelivery: [...prev.serialNumberDelivery, 'email']
                              }));
                            } else {
                              setFormData(prev => ({
                                ...prev,
                                serialNumberDelivery: prev.serialNumberDelivery.filter(opt => opt !== 'email')
                              }));
                            }
                          }}
                        />
                        <Label htmlFor="delivery-email" className="flex items-center gap-2 cursor-pointer">
                          <Mail className="h-4 w-4" />
                          {t('checkoutPage.deliveryEmail', 'Send to Email')}
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="delivery-whatsapp"
                          checked={formData.serialNumberDelivery.includes('whatsapp')}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setFormData(prev => ({
                                ...prev,
                                serialNumberDelivery: [...prev.serialNumberDelivery, 'whatsapp']
                              }));
                            } else {
                              setFormData(prev => ({
                                ...prev,
                                serialNumberDelivery: prev.serialNumberDelivery.filter(opt => opt !== 'whatsapp')
                              }));
                            }
                          }}
                        />
                        <Label htmlFor="delivery-whatsapp" className="flex items-center gap-2 cursor-pointer">
                          <MessageSquare className="h-4 w-4" />
                          {t('checkoutPage.deliveryWhatsApp', 'Send to WhatsApp')}
                        </Label>
                      </div>
                      {isAuthenticated && (
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="delivery-inventory"
                            checked={formData.serialNumberDelivery.includes('inventory')}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setFormData(prev => ({
                                  ...prev,
                                  serialNumberDelivery: [...prev.serialNumberDelivery, 'inventory']
                                }));
                              } else {
                                setFormData(prev => ({
                                  ...prev,
                                  serialNumberDelivery: prev.serialNumberDelivery.filter(opt => opt !== 'inventory')
                                }));
                              }
                            }}
                          />
                          <Label htmlFor="delivery-inventory" className="flex items-center gap-2 cursor-pointer">
                            <Package className="h-4 w-4" />
                            {t('checkoutPage.deliveryInventory', 'Save to My Inventory')}
                          </Label>
                        </div>
                      )}
                    </div>
                    {formData.serialNumberDelivery.length === 0 && (
                      <p className="text-sm text-amber-600">
                        {t('checkoutPage.selectDeliveryOption', 'Please select at least one delivery option')}
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    {t('checkoutPage.paymentMethod', 'Payment Method')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isAuthenticated && (
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
                          <p className="font-semibold">{t('checkoutPage.walletBalance', 'Wallet Balance')}</p>
                          <p className="text-sm text-muted-foreground">{t('checkoutPage.availableBalance', 'Available balance for payment')}</p>
                        </div>
                      </div>
                      <div className="text-left">
                        <p className={`text-2xl font-bold ${
                          walletBalance >= total ? 'text-primary' : 'text-muted-foreground'
                        }`}>
                          {formatCurrency(walletBalance, settings?.currency || 'SAR')}
                        </p>
                        {walletBalance > 0 && walletBalance >= total ? (
                          <p className="text-xs text-green-600 flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            {t('checkoutPage.sufficientBalance', 'Sufficient balance')}
                          </p>
                        ) : (
                          <p className="text-xs text-orange-600 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {t('checkoutPage.insufficientBalance', 'Insufficient balance')}
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
                        {t('checkoutPage.loadingPaymentMethods', 'Loading payment methods...')}
                      </div>
                    ) : getAllPaymentMethods().length === 0 ? (
                      <div className="text-center py-8 border-2 border-dashed rounded-xl bg-muted/20">
                        <AlertCircle className="h-8 w-8 mx-auto mb-2 text-orange-500" />
                        <p className="font-medium">{t('checkoutPage.noPaymentMethods', 'No payment methods available')}</p>
                        <p className="text-sm text-muted-foreground">{t('checkoutPage.noPaymentMethodsDesc', 'Please recharge your balance or contact support')}</p>
                      </div>
                    ) : (
                      getAllPaymentMethods().map((method) => {
                        const provider = PROVIDER_NAMES[method.provider];
                        const displayName = provider ? t(provider.nameKey, provider.defaultName) : method.name;
                        const displayDesc = provider ? t(provider.descKey, provider.defaultDesc) : '';
                        
                        const isWallet = method.provider === 'WALLET_BALANCE';
                        const isDisabled = isWallet && (!isAuthenticated || walletBalance < total);
                        
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
                                  {isWallet && isAuthenticated && formData.paymentMethod === 'WALLET_BALANCE' && (
                                    <span className="px-2 py-0.5 bg-primary text-white text-xs rounded-full">{t('common.preferred', 'Preferred')}</span>
                                  )}
                                </div>
                                {isWallet && isAuthenticated && (
                                  <span className={`text-sm font-bold ${walletBalance >= total ? 'text-green-600' : 'text-red-600'}`}>
                                    {formatCurrency(walletBalance, settings?.currency || 'SAR')}
                                  </span>
                                )}
                                {isWallet && !isAuthenticated && (
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
                  <CardTitle>{t('checkoutPage.orderSummary', 'Order Summary')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('cart.subtotal', 'Subtotal')}</span>
                    <span className="font-semibold">{formatCurrency(subtotal, settings?.currency || 'SAR')}</span>
                  </div>
                   {isShippingRequired && selectedShipping && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('cart.shipping', 'Shipping')}</span>
                      <span className="font-semibold">{formatCurrency(shippingCost, settings?.currency || 'SAR')}</span>
                    </div>
                  )}
                  {settings?.taxEnabled !== false && finalTaxAmount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Calculator className="h-4 w-4" />
                        {t('cart.tax', 'Tax')}
                      </span>
                      <span className="font-semibold">{formatCurrency(finalTaxAmount, settings?.currency || 'SAR')}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>{t('cart.total', 'Total')}</span>
                    <span className="text-primary">{formatCurrency(total, settings?.currency || 'SAR')}</span>
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
