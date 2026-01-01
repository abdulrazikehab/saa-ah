import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ShoppingBag, Mail, Phone, User, MapPin } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useStoreSettings } from '@/contexts/StoreSettingsContext';

interface GuestCheckoutFormProps {
  cartItems: any[];
  totalAmount: number;
  onComplete: (orderNumber: string) => void;
}

export function GuestCheckoutForm({ cartItems, totalAmount, onComplete }: GuestCheckoutFormProps) {
  const { t, i18n } = useTranslation();
  const { settings } = useStoreSettings();
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
        title: t('order.successTitle', 'Order Successful!'),
        description: `${t('order.number', 'Order Number')}: ${order.orderNumber}`,
      });

      // Clear cart and redirect
      onComplete(order.orderNumber);
      navigate(`/order-confirmation/${order.orderNumber}?email=${guestEmail}`);
    } catch (error) {
      console.error('Checkout error:', error);
      toast({
        title: t('checkout.paymentFailed', 'Payment Failed'),
        description: t('checkout.paymentFailedDesc', 'An error occurred while creating the order. Please try again.'),
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
            {t('checkout.contactInfo', 'Contact Information')}
          </CardTitle>
          <CardDescription>
            {t('checkout.contactInfoDesc', 'We will use this information to send order confirmation')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="guestEmail">
              <Mail className="inline h-4 w-4 mr-2" />
              {t('common.email', 'Email')} *
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
              {t('common.fullName', 'Full Name')} *
            </Label>
            <Input
              id="guestName"
              type="text"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder={t('common.fullNamePlaceholder', 'John Doe')}
              required
            />
          </div>

          <div>
            <Label htmlFor="guestPhone">
              <Phone className="inline h-4 w-4 mr-2" />
              {t('common.phone', 'Phone Number')} *
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
            {t('checkout.shippingAddress', 'Shipping Address')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="street">{t('common.address', 'Address')} *</Label>
            <Input
              id="street"
              value={street}
              onChange={(e) => setStreet(e.target.value)}
              placeholder={t('common.addressPlaceholder', 'Street name, District')}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="city">{t('common.city', 'City')} *</Label>
              <Input
                id="city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder={t('common.cityPlaceholder', 'Riyadh')}
                required
              />
            </div>

            <div>
              <Label htmlFor="state">{t('common.state', 'State/Region')}</Label>
              <Input
                id="state"
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder={t('common.statePlaceholder', 'Riyadh')}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="postalCode">{t('common.postalCode', 'Postal Code')}</Label>
              <Input
                id="postalCode"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                placeholder="12345"
              />
            </div>

            <div>
              <Label htmlFor="country">{t('common.country', 'Country')} *</Label>
              <select
                id="country"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
                required
              >
                <option value="SA">{t('country.SA', 'Saudi Arabia')}</option>
                <option value="AE">{t('country.AE', 'UAE')}</option>
                <option value="KW">{t('country.KW', 'Kuwait')}</option>
                <option value="QA">{t('country.QA', 'Qatar')}</option>
                <option value="BH">{t('country.BH', 'Bahrain')}</option>
                <option value="OM">{t('country.OM', 'Oman')}</option>
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
              {t('checkout.billingSameAsShipping', 'Billing address same as shipping')}
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
            {t('common.processing', 'Processing...')}
          </>
        ) : (
          <>
            <ShoppingBag className="mr-2 h-5 w-5" />
            {t('checkout.placeOrder', 'Place Order')} ({totalAmount} {i18n.language === 'ar' ? 'ر.س' : (settings?.currency || 'SAR')})
          </>
        )}
      </Button>

      <p className="text-sm text-center text-gray-600 dark:text-gray-400">
        {t('checkout.termsAgreement', 'By clicking "Place Order", you agree to our ')}
        <a href="/terms" className="text-indigo-600 hover:underline">
          {t('common.termsAndConditions', 'Terms and Conditions')}
        </a>
      </p>
    </form>
  );
}
