import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useStoreSettings } from '@/contexts/StoreSettingsContext';
import { coreApi } from '@/lib/api';
import { paymentService, AvailablePaymentMethod } from '@/services/payment.service';
import { walletService } from '@/services/wallet.service';
import { Loader2, CreditCard, Wallet, CheckCircle, ChevronRight, Mail, Phone, User, Package, FileText } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { getErrorMessage } from '@/lib/error-utils';
import { formatCurrency } from '@/lib/currency-utils';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function MobileCheckout() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { cart, loading: cartLoading, refreshCart, clearCart } = useCart();
  const { user, isAuthenticated, refreshUser } = useAuth();
  const { settings } = useStoreSettings();
  
  const [loading, setLoading] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<AvailablePaymentMethod[]>([]);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [activeConfig, setActiveConfig] = useState<any>(null);
  
  // Retrieve context configuration from MobileLayout
  const { appConfig: contextAppConfig } = useOutletContext<{ appConfig: any }>() || {};
  
  // Prioritize context config (live preview) over local state
  const config = contextAppConfig || activeConfig || {};

  // Helper to get dynamic page title
  const getPageTitle = (pageId: string) => {
    const page = config.pages?.find((p: any) => p.id === pageId);
    if (!page) return null;
    return i18n.language === 'ar' ? (page.titleAr || page.title) : page.title;
  };
  const [errorState, setErrorState] = useState<{ title: string; message: string; } | null>(null);
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    paymentMethod: '',
    serialNumberDelivery: ['inventory'] as string[],
  });

  // Cart calculations
  const cartItems = Array.isArray(cart?.cartItems) 
    ? cart!.cartItems! 
    : Array.isArray(cart?.items) 
      ? cart!.items 
      : [];

  const validCartItems = cartItems.filter((item: any) => item && (item.product || item.unitPriceSnapshot));
  
  const subtotal = validCartItems.reduce((sum: number, item: any) => {
    const price = 
      item.unitPriceSnapshot ??
      item.productVariant?.price ?? 
      item.product?.retailPrice ?? 
      item.product?.wholesalePrice ?? 
      item.product?.price ?? 
      0;
    return sum + Number(price) * (item.quantity || 1);
  }, 0);

  const total = subtotal;

  useEffect(() => {
    // Pre-fill user data when user object is available/updated
    if (isAuthenticated && user) {
      setFormData(prev => ({
        ...prev,
        fullName: prev.fullName || user.name || '',
        email: prev.email || user.email || '',
        phone: prev.phone || user.phone || '',
      }));
    }
  }, [isAuthenticated, user?.name, user?.email, user?.phone, user]);

  const loadPaymentMethods = useCallback(async () => {
    try {
      const methods = await paymentService.getPaymentMethods();
      const isDigitalStore = settings?.storeType === 'DIGITAL_CARDS';
      const filteredMethods = isDigitalStore
        ? methods.filter(m => m.provider !== 'CASH_ON_DELIVERY')
        : methods;
      setPaymentMethods(filteredMethods);
      
      // Default selection
      if (filteredMethods.length > 0 && !formData.paymentMethod) {
        setFormData(prev => ({ ...prev, paymentMethod: filteredMethods[0].provider }));
      }
    } catch (error) {
      console.error('Failed to load payment methods:', error);
    }
  }, [settings?.storeType]);

  const loadWalletBalance = useCallback(async () => {
    try {
      if (isAuthenticated) {
        const wallet = await walletService.getBalance();
        setWalletBalance(Number(wallet.balance) || 0);
      }
    } catch (error) {
      console.error('Failed to load wallet balance:', error);
    }
  }, [isAuthenticated]);

  // Effect to auto-select first available payment method
  useEffect(() => {
    if (!formData.paymentMethod) {
      const allMethods = [
        ...(isAuthenticated ? [{ provider: 'WALLET_BALANCE' }] : []),
        ...paymentMethods,
      ];
      if (allMethods.length > 0) {
        setFormData(prev => ({ ...prev, paymentMethod: allMethods[0].provider }));
      }
    }
  }, [paymentMethods, isAuthenticated, formData.paymentMethod]);

  // Ref to prevent refreshUser loop
  const hasRefreshedUser = React.useRef(false);

  useEffect(() => {
    // Only fetch config if not already loaded to avoid 429
    if (!activeConfig) {
        coreApi.get('/app-builder/config').then(res => setActiveConfig(res.config || res)).catch(() => {});
    }
    
    refreshCart();
    loadPaymentMethods();
    loadWalletBalance();
    
    // Refresh user info ONLY if critical display data is missing
    // We use a ref to prevent infinite loops even if data remains missing in DB
    if (isAuthenticated && user && (!user.name || !user.phone) && !hasRefreshedUser.current) {
        console.log("MobileCheckout: Refreshing user due to missing name/phone");
        hasRefreshedUser.current = true;
        refreshUser().catch(console.error);
    }
  }, [isAuthenticated, refreshUser, refreshCart, loadPaymentMethods, loadWalletBalance, activeConfig]);

  const handleRefresh = useCallback(() => {
    setErrorState(null);
    setLoading(false);
    refreshCart(true); // Forced refresh
    loadPaymentMethods();
    loadWalletBalance();
    if (isAuthenticated) refreshUser().catch(() => {});
  }, [refreshCart, loadPaymentMethods, loadWalletBalance, isAuthenticated, refreshUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate
      if (formData.serialNumberDelivery.length === 0) {
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
          description: t('checkoutPage.insufficientWalletDesc', 'Insufficient wallet balance'),
        });
        setLoading(false);
        return;
      }

      if (!cart?.id) {
        toast({
          variant: 'destructive',
          title: t('common.error'),
          description: t('checkoutPage.cartEmpty', 'Cart is empty'),
        });
        setLoading(false);
        return;
      }

      const orderPayload = {
        cartId: cart.id,
        customerEmail: formData.email,
        customerName: formData.fullName,
        customerPhone: formData.phone,
        shippingAddress: {
          fullName: formData.fullName,
          street: 'Digital Delivery',
          city: 'Digital',
          state: 'Digital',
          country: 'SA',
          postalCode: '00000',
        },
        billingAddress: {
          fullName: formData.fullName,
          street: 'Digital Delivery',
          city: 'Digital',
          state: 'Digital',
          country: 'SA',
          postalCode: '00000',
        },
        paymentMethod: formData.paymentMethod,
        useWalletBalance: formData.paymentMethod === 'WALLET_BALANCE',
        serialNumberDelivery: formData.serialNumberDelivery,
      };

      setErrorState(null);
      console.log('📦 [MobileCheckout] Submitting order payload:', orderPayload);

      const order = await coreApi.createOrder(orderPayload, isAuthenticated, { hideErrorToast: true });
      console.log('✅ [MobileCheckout] Order created:', order);

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
          ? t('checkoutPage.walletPaid', 'Payment successful from wallet')
          : t('checkoutPage.orderCreated', 'Order created successfully'),
      });
      
      await clearCart();
      navigate(`/orders/${order.id}`);
    } catch (error: any) {
      console.error('❌ [MobileCheckout] Order creation error details:', {
        message: error.message,
        status: error.status,
        data: error.data,
        error: error
      });
      
      const errorMessage = Array.isArray(error.data?.message) 
        ? error.data.message.join('. ') 
        : (error.data?.message || getErrorMessage(error));

      setErrorState({
        title: t('common.error'),
        message: errorMessage
      });

      toast({
        variant: 'destructive',
        title: t('common.error'),
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  const primaryColor = config.primaryColor || '#000000';

  if (cartLoading && !cart) {
    return (
      <div className="p-8 text-center pt-20">
        <Loader2 className="animate-spin h-8 w-8 mx-auto" />
      </div>
    );
  }

  const allPaymentMethods = [
    ...(isAuthenticated ? [{
      id: 'WALLET_BALANCE',
      provider: 'WALLET_BALANCE',
      name: t('payment.wallet.name', 'Wallet Balance'),
      isActive: true,
    }] : []),
    ...paymentMethods,
  ];

  return (
    <div className="pb-32 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white p-4 shadow-sm sticky top-0 z-10 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-1 rounded-full hover:bg-gray-100">
          <ArrowIcon className="w-5 h-5 rtl:rotate-180" />
        </button>
        <h1 className="text-lg font-bold">
          {getPageTitle('checkout') || t('checkoutPage.title', 'Checkout')}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        {/* Error Alert */}
        {errorState && (
          <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-800 animate-in fade-in slide-in-from-top-4 duration-300">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <div className="flex justify-between items-start w-full">
              <div className="flex-1">
                <AlertTitle className="font-bold text-red-900">{errorState.title}</AlertTitle>
                <AlertDescription className="text-red-700 text-xs">
                  {errorState.message}
                </AlertDescription>
              </div>
              <button 
                type="button" 
                onClick={handleRefresh}
                className="p-1 rounded-full hover:bg-red-100 transition-colors ml-2"
                title={t('common.refresh', 'Refresh')}
              >
                <RefreshCw className="h-4 w-4 text-red-600" />
              </button>
            </div>
          </Alert>
        )}
        {/* Customer Info */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="font-bold text-base mb-4 flex items-center gap-2">
            <User className="w-4 h-4" style={{ color: primaryColor }} />
            {t('checkoutPage.customerInfo', 'Customer Information')}
          </h2>
          
          <div className="space-y-4">
            <div>
              <Label className="text-xs text-gray-500 mb-1 block">{t('common.fullName', 'Full Name')}</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-gray-400 rtl:right-3 rtl:left-auto" />
                <Input
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  required
                  readOnly={isAuthenticated && !!user?.name}
                  className="pl-10 h-12 rounded-xl rtl:pr-10 rtl:pl-3"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs text-gray-500 mb-1 block">{t('common.email', 'Email')}</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400 rtl:right-3 rtl:left-auto" />
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  readOnly={isAuthenticated && !!user?.email}
                  className="pl-10 h-12 rounded-xl rtl:pr-10 rtl:pl-3"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs text-gray-500 mb-1 block">{t('common.phone', 'Phone')}</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400 rtl:right-3 rtl:left-auto" />
                <Input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                  readOnly={isAuthenticated && !!user?.phone}
                  className="pl-10 h-12 rounded-xl rtl:pr-10 rtl:pl-3"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Delivery Options */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="font-bold text-base mb-4 flex items-center gap-2">
            <Package className="w-4 h-4" style={{ color: primaryColor }} />
            {t('checkoutPage.serialNumberDelivery', 'Delivery Options')}
          </h2>
          
          <div className="space-y-3">
            {['text', 'excel', 'email', 'whatsapp', 'inventory'].map(option => (
              <label key={option} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer">
                <Checkbox
                  checked={formData.serialNumberDelivery.includes(option)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setFormData(prev => ({
                        ...prev,
                        serialNumberDelivery: [...prev.serialNumberDelivery, option]
                      }));
                    } else {
                      setFormData(prev => ({
                        ...prev,
                        serialNumberDelivery: prev.serialNumberDelivery.filter(opt => opt !== option)
                      }));
                    }
                  }}
                />
                <span className="text-sm font-medium">
                  {option === 'text' && t('checkoutPage.deliveryText', 'Text File')}
                  {option === 'excel' && t('checkoutPage.deliveryExcel', 'Excel File')}
                  {option === 'email' && t('checkoutPage.deliveryEmail', 'Send to Email')}
                  {option === 'whatsapp' && t('checkoutPage.deliveryWhatsApp', 'Send to WhatsApp')}
                  {option === 'inventory' && t('checkoutPage.deliveryInventory', 'Save to Inventory')}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Payment Methods */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="font-bold text-base mb-4 flex items-center gap-2">
            <CreditCard className="w-4 h-4" style={{ color: primaryColor }} />
            {t('checkoutPage.paymentMethod', 'Payment Method')}
          </h2>

          {isAuthenticated && (
            <div className="mb-4 p-3 bg-green-50 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium">{t('wallet.balance', 'Balance')}</span>
              </div>
              <span className="font-bold text-green-600">{formatCurrency(walletBalance, settings?.currency || 'SAR')}</span>
            </div>
          )}

          <div className="space-y-2">
            {allPaymentMethods.map(method => (
              <button
                key={method.provider}
                type="button"
                onClick={() => setFormData({ ...formData, paymentMethod: method.provider })}
                className={`w-full p-4 rounded-xl border-2 flex items-center justify-between transition-all ${
                  formData.paymentMethod === method.provider 
                    ? 'border-primary bg-primary/5' 
                    : 'border-gray-200 bg-white'
                }`}
                style={{ borderColor: formData.paymentMethod === method.provider ? primaryColor : undefined }}
              >
                <div className="flex items-center gap-3">
                  {method.provider === 'WALLET_BALANCE' && <Wallet className="w-5 h-5" />}
                  {method.provider !== 'WALLET_BALANCE' && <CreditCard className="w-5 h-5" />}
                  <span className="font-medium">{method.name}</span>
                </div>
                {formData.paymentMethod === method.provider && (
                  <CheckCircle className="w-5 h-5" style={{ color: primaryColor }} />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="font-bold text-base mb-4">{t('checkoutPage.orderSummary', 'Order Summary')}</h2>
          
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">{t('checkoutPage.items', 'Items')} ({validCartItems.length})</span>
              <span>{formatCurrency(subtotal, settings?.currency || 'SAR')}</span>
            </div>
            <div className="border-t pt-3 flex justify-between font-bold text-lg">
              <span>{t('checkoutPage.total', 'Total')}</span>
              <span style={{ color: primaryColor }}>{formatCurrency(total, settings?.currency || 'SAR')}</span>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={loading || !formData.paymentMethod}
          className="w-full h-14 rounded-2xl text-lg font-bold shadow-lg"
          style={{ backgroundColor: primaryColor }}
        >
          {loading ? (
            <Loader2 className="animate-spin mr-2" />
          ) : (
            <CheckCircle className="mr-2 h-5 w-5" />
          )}
          {t('checkoutPage.placeOrder', 'Place Order')}
        </Button>
      </form>
    </div>
  );
}

function ArrowIcon(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m15 18-6-6 6-6"/>
    </svg>
  );
}
