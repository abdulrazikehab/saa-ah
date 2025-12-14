import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ShoppingBag, Mail, Phone, User, MapPin } from 'lucide-react';

interface GuestCheckoutFormProps {
  cartItems: any[];
  totalAmount: number;
  onComplete: (orderNumber: string) => void;
}

export function GuestCheckoutForm({ cartItems, totalAmount, onComplete }: GuestCheckoutFormProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  // Guest Information
  const [guestEmail, setGuestEmail] = useState('');
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');

  // Shipping Address
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('SA');

  // Billing same as shipping
  const [billingSameAsShipping, setBillingSameAsShipping] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Prepare order data
      const orderData = {
        guestEmail,
        guestName,
        guestPhone,
        totalAmount,
        subtotalAmount: totalAmount,
        taxAmount: 0,
        shippingAmount: 0,
        discountAmount: 0,
        items: cartItems.map(item => ({
          productId: item.productId,
          productVariantId: item.productVariantId,
          quantity: item.quantity,
          price: item.price,
          productName: item.productName,
          variantName: item.variantName,
          sku: item.sku,
        })),
        shippingAddress: {
          street,
          city,
          state,
          postalCode,
          country,
        },
        billingAddress: billingSameAsShipping ? {
          street,
          city,
          state,
          postalCode,
          country,
        } : null,
      };

      // Call API
      const response = await fetch('/api/guest-checkout/order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-Domain': window.location.hostname,
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        throw new Error('Failed to create order');
      }

      const order = await response.json();

      toast({
        title: 'طلب ناجح!',
        description: `رقم الطلب: ${order.orderNumber}`,
      });

      // Clear cart and redirect
      onComplete(order.orderNumber);
      navigate(`/order-confirmation/${order.orderNumber}?email=${guestEmail}`);
    } catch (error) {
      console.error('Checkout error:', error);
      toast({
        title: 'تعذر إتمام الطلب',
        description: 'حدث خطأ أثناء إنشاء الطلب. يرجى المحاولة مرة أخرى.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Guest Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            معلومات الاتصال
          </CardTitle>
          <CardDescription>
            سنستخدم هذه المعلومات لإرسال تأكيد الطلب
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="guestEmail">
              <Mail className="inline h-4 w-4 mr-2" />
              البريد الإلكتروني *
            </Label>
            <Input
              id="guestEmail"
              type="email"
              value={guestEmail}
              onChange={(e) => setGuestEmail(e.target.value)}
              placeholder="example@email.com"
              required
            />
          </div>

          <div>
            <Label htmlFor="guestName">
              <User className="inline h-4 w-4 mr-2" />
              الاسم الكامل *
            </Label>
            <Input
              id="guestName"
              type="text"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder="أحمد محمد"
              required
            />
          </div>

          <div>
            <Label htmlFor="guestPhone">
              <Phone className="inline h-4 w-4 mr-2" />
              رقم الهاتف *
            </Label>
            <Input
              id="guestPhone"
              type="tel"
              value={guestPhone}
              onChange={(e) => setGuestPhone(e.target.value)}
              placeholder="+966501234567"
              required
            />
          </div>
        </CardContent>
      </Card>

      {/* Shipping Address */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            عنوان الشحن
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="street">الشارع *</Label>
            <Input
              id="street"
              value={street}
              onChange={(e) => setStreet(e.target.value)}
              placeholder="شارع الملك فهد، حي النخيل"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="city">المدينة *</Label>
              <Input
                id="city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="الرياض"
                required
              />
            </div>

            <div>
              <Label htmlFor="state">المنطقة</Label>
              <Input
                id="state"
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="الرياض"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="postalCode">الرمز البريدي</Label>
              <Input
                id="postalCode"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                placeholder="12345"
              />
            </div>

            <div>
              <Label htmlFor="country">الدولة *</Label>
              <select
                id="country"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
                required
              >
                <option value="SA">السعودية</option>
                <option value="AE">الإمارات</option>
                <option value="KW">الكويت</option>
                <option value="QA">قطر</option>
                <option value="BH">البحرين</option>
                <option value="OM">عمان</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="billingSame"
              checked={billingSameAsShipping}
              onChange={(e) => setBillingSameAsShipping(e.target.checked)}
              className="h-4 w-4"
            />
            <Label htmlFor="billingSame" className="cursor-pointer">
              عنوان الفواتير مطابق لعنوان الشحن
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* Submit Button */}
      <Button
        type="submit"
        size="lg"
        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
        disabled={loading}
      >
        {loading ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
            جاري المعالجة...
          </>
        ) : (
          <>
            <ShoppingBag className="mr-2 h-5 w-5" />
            إتمام الطلب ({totalAmount} ر.س)
          </>
        )}
      </Button>

      <p className="text-sm text-center text-gray-600 dark:text-gray-400">
        بالنقر على "إتمام الطلب"، فإنك توافق على{' '}
        <a href="/terms" className="text-indigo-600 hover:underline">
          الشروط والأحكام
        </a>
      </p>
    </form>
  );
}
