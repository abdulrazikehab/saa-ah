import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { Loader2, CreditCard, Truck, Calculator } from 'lucide-react';
import { coreApi } from '@/lib/api';
import { paymentService, AvailablePaymentMethod } from '@/services/payment.service';

import { Cart, ShippingMethod, SiteSettings } from '@/services/types';

// Provider display names
const PROVIDER_NAMES: Record<string, { name: string; description: string }> = {
  HYPERPAY: { name: 'بطاقة ائتمان (HyperPay)', description: 'Visa, Mastercard, Mada' },
  STRIPE: { name: 'بطاقة ائتمان (Stripe)', description: 'Visa, Mastercard' },
  PAYPAL: { name: 'PayPal', description: 'الدفع عبر PayPal' },
  CASH_ON_DELIVERY: { name: 'الدفع عند الاستلام', description: 'ادفع نقداً عند استلام الطلب' },
  BANK_TRANSFER: { name: 'التحويل البنكي', description: 'الدفع عبر التحويل المباشر' },
};

export default function Checkout() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [cart, setCart] = useState<Cart | null>(null);
  const [shippingRates, setShippingRates] = useState<ShippingMethod[]>([]);
  const [taxAmount, setTaxAmount] = useState(0);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<AvailablePaymentMethod[]>([]);
  
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
    // Payment
    paymentMethod: 'CASH_ON_DELIVERY',
  });

  useEffect(() => {
    loadCart();
    loadSettings();
    loadPaymentMethods();
  }, []);

  useEffect(() => {
    if (formData.country && formData.city && cart) {
      calculateShipping();
      calculateTax();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.country, formData.city, cart]);

  const loadCart = async () => {
    try {
      const data = await coreApi.getCart();
      setCart(data);
    } catch (error) {
      console.error('Failed to load cart:', error);
    }
  };

  const loadSettings = async () => {
    try {
      const data = await coreApi.get('/site-config');
      setSettings(data.settings);
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const loadPaymentMethods = async () => {
    try {
      const methods = await paymentService.getPaymentMethods();
      setPaymentMethods(methods);
      // Set default payment method if available
      if (methods.length > 0) {
        const cod = methods.find(m => m.provider === 'CASH_ON_DELIVERY');
        setFormData(prev => ({
          ...prev,
          paymentMethod: cod?.provider || methods[0].provider,
        }));
      }
    } catch (error) {
      console.error('Failed to load payment methods:', error);
      // Fallback to COD if API fails
      setPaymentMethods([{
        id: 'fallback-cod',
        provider: 'CASH_ON_DELIVERY',
        name: 'الدفع عند الاستلام',
        isActive: true,
      }]);
    }
  };

  const calculateShipping = async () => {
    try {
      const rates = await coreApi.calculateShipping({
        destination: {
          country: formData.country,
          city: formData.city,
          postalCode: formData.postalCode,
        },
        items: cart?.items || [],
      });
      setShippingRates(Array.isArray(rates) ? rates : [rates]);
    } catch (error) {
      console.error('Failed to calculate shipping:', error);
    }
  };

  const calculateTax = async () => {
    try {
      const tax = await coreApi.calculateTax({
        amount: cart?.total || 0,
        country: formData.country,
        state: formData.state,
      });
      setTaxAmount(tax.amount || 0);
    } catch (error) {
      console.error('Failed to calculate tax:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Create order
      const order = await coreApi.createOrder({
        shippingAddress: {
          fullName: formData.fullName,
          street: formData.address,
          city: formData.city,
          state: formData.state,
          country: formData.country,
          postalCode: formData.postalCode,
        },
        contact: {
          email: formData.email,
          phone: formData.phone,
        },
        shippingMethod: formData.shippingMethod,
        paymentMethod: formData.paymentMethod,
      });

      // Initialize payment if not COD
      if (formData.paymentMethod !== 'CASH_ON_DELIVERY') {
        const payment = await coreApi.initializePayment({
          orderId: order.id,
          method: formData.paymentMethod,
          amount: order.total,
        });

        // Redirect to payment gateway
        if (payment.redirectUrl) {
          window.location.href = payment.redirectUrl;
          return;
        }
      }

      toast({
        title: t('common.success'),
        description: 'تم إنشاء الطلب بنجاح',
      });
      navigate(`/orders/${order.id}`);
    } catch (error: unknown) {
      const err = error as Error;
      toast({
        variant: 'destructive',
        title: t('common.error'),
        description: err.message || 'فشل إنشاء الطلب',
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedShipping = shippingRates.find(r => r.id === formData.shippingMethod);
  const subtotal = cart?.total || 0;
  const shippingCost = selectedShipping?.cost || 0;
  const total = subtotal + shippingCost + taxAmount;

  return (
    <div className="min-h-screen py-8">
      <div className="container max-w-6xl">
        <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          إتمام الطلب
        </h1>

        <form onSubmit={handleSubmit}>
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column - Forms */}
            <div className="lg:col-span-2 space-y-6">
              {/* Shipping Address */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="h-5 w-5" />
                    عنوان الشحن
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">الاسم الكامل *</Label>
                      <Input
                        id="fullName"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">رقم الهاتف *</Label>
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
                    <Label htmlFor="email">البريد الإلكتروني *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">العنوان *</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      required
                    />
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">المدينة *</Label>
                      <Input
                        id="city"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">المنطقة</Label>
                      <Input
                        id="state"
                        value={formData.state}
                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="country">الدولة *</Label>
                      <Input
                        id="country"
                        value={formData.country}
                        onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="postalCode">الرمز البريدي</Label>
                      <Input
                        id="postalCode"
                        value={formData.postalCode}
                        onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Shipping Method */}
              {shippingRates.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>طريقة الشحن</CardTitle>
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
                              <p className="text-sm text-muted-foreground">{rate.estimatedDays} أيام</p>
                            </Label>
                          </div>
                          <span className="font-semibold">{rate.cost.toFixed(2)} ريال</span>
                        </div>
                      ))}
                    </RadioGroup>
                  </CardContent>
                </Card>
              )}

              {/* Payment Method */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    طريقة الدفع
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <RadioGroup
                    value={formData.paymentMethod}
                    onValueChange={(value) => setFormData({ ...formData, paymentMethod: value })}
                  >
                    {paymentMethods.length === 0 ? (
                      <div className="text-center py-4 text-muted-foreground">
                        جاري تحميل طرق الدفع...
                      </div>
                    ) : (
                      paymentMethods.map((method) => {
                        const display = PROVIDER_NAMES[method.provider] || {
                          name: method.name,
                          description: '',
                        };
                        return (
                          <div key={method.id} className="flex items-center gap-3 p-4 border rounded-lg hover:border-primary/50 transition-colors">
                            <RadioGroupItem value={method.provider} id={method.provider} />
                            <Label htmlFor={method.provider} className="cursor-pointer flex-1">
                              <p className="font-medium">{display.name}</p>
                              <p className="text-sm text-muted-foreground">{display.description}</p>
                            </Label>
                          </div>
                        );
                      })
                    )}
                  </RadioGroup>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Order Summary */}
            <div>
              <Card className="sticky top-4">
                <CardHeader>
                  <CardTitle>ملخص الطلب</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">المجموع الفرعي</span>
                    <span className="font-semibold">{subtotal.toFixed(2)} ريال</span>
                  </div>
                  {selectedShipping && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">الشحن</span>
                      <span className="font-semibold">{shippingCost.toFixed(2)} ريال</span>
                    </div>
                  )}
                  {taxAmount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Calculator className="h-4 w-4" />
                        الضريبة
                      </span>
                      <span className="font-semibold">{taxAmount.toFixed(2)} ريال</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>الإجمالي</span>
                    <span className="text-primary">{total.toFixed(2)} ريال</span>
                  </div>
                  <Button type="submit" className="w-full" size="lg" disabled={loading || !formData.shippingMethod}>
                    {loading ? (
                      <>
                        <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                        جاري المعالجة...
                      </>
                    ) : (
                      <>
                        <CreditCard className="ml-2 h-4 w-4" />
                        إتمام الطلب
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
