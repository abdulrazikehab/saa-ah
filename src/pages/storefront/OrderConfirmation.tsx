import { useEffect, useState, useCallback } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Package, Mail, Phone, MapPin, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useStoreSettings } from '@/contexts/StoreSettingsContext';

interface OrderItem {
  id: string;
  productName: string;
  variantName?: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  orderNumber: string;
  createdAt: string;
  totalAmount: number;
  subtotalAmount: number;
  shippingAmount: number;
  taxAmount: number;
  guestEmail: string;
  guestPhone: string;
  guestName: string;
  shippingAddress?: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  orderItems: OrderItem[];
}

export default function OrderConfirmation() {
  const { t, i18n } = useTranslation();
  const { settings } = useStoreSettings();
  const { orderNumber } = useParams();
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email');
  
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  const loadOrder = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/guest-checkout/track?orderNumber=${orderNumber}&email=${email}`,
        {
          headers: {
            'X-Tenant-Domain': window.location.hostname,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setOrder(data);
      }
    } catch (error) {
      console.error('Failed to load order:', error);
    } finally {
      setLoading(false);
    }
  }, [orderNumber, email]);

  useEffect(() => {
    if (orderNumber && email) {
      loadOrder();
    }
  }, [orderNumber, email, loadOrder]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-gray-600 dark:text-gray-400">
              {t('order.notFound', 'Order not found')}
            </p>
            <Link to="/">
              <Button className="mt-4">
                {t('common.backToHome', 'Back to Home')}
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="container max-w-4xl">
        {/* Success Message */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full mb-4">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold mb-2">{t('order.successTitle', 'Your order has been received!')}</h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t('order.successDesc', 'Thank you for your order. We will send you a confirmation email soon.')}
          </p>
        </div>

        {/* Order Details */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              {t('order.details', 'Order Details')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('order.number', 'Order Number')}</p>
                <p className="font-semibold">{order.orderNumber}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('common.date', 'Date')}</p>
                <p className="font-semibold">
                  {new Date(order.createdAt).toLocaleDateString(i18n.language === 'ar' ? 'ar-SA' : 'en-US')}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('common.status', 'Status')}</p>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  {t('order.status.processing', 'Processing')}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('cart.total', 'Total Amount')}</p>
                <p className="font-semibold text-lg text-indigo-600">
                  {order.totalAmount} {i18n.language === 'ar' ? 'ر.س' : (settings?.currency || 'SAR')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{t('checkout.contactInfo', 'Contact Information')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-gray-400" />
              <span>{order.guestEmail}</span>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="h-5 w-5 text-gray-400" />
              <span>{order.guestPhone}</span>
            </div>
          </CardContent>
        </Card>
        {/* Shipping Address */}
        {order.shippingAddress && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                {t('checkout.shippingAddress', 'Shipping Address')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>{order.guestName}</p>
              <p className="text-gray-600 dark:text-gray-400">
                {order.shippingAddress.street}
              </p>
              <p className="text-gray-600 dark:text-gray-400">
                {order.shippingAddress.city}, {order.shippingAddress.state}
              </p>
              <p className="text-gray-600 dark:text-gray-400">
                {order.shippingAddress.postalCode}
              </p>
              <p className="text-gray-600 dark:text-gray-400">
                {order.shippingAddress.country}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Order Items */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{t('common.products', 'Products')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {order.orderItems?.map((item: OrderItem) => (
                <div key={item.id} className="flex justify-between items-start border-b pb-4 last:border-0">
                  <div className="flex-1">
                    <p className="font-medium">{item.productName}</p>
                    {item.variantName && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {item.variantName}
                      </p>
                    )}
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {t('common.quantity', 'Quantity')}: {item.quantity}
                    </p>
                  </div>
                  <p className="font-semibold">{item.price * item.quantity} {i18n.language === 'ar' ? 'ر.س' : (settings?.currency || 'SAR')}</p>
                </div>
              ))}
            </div>

            <div className="border-t mt-4 pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">{t('cart.subtotal', 'Subtotal')}</span>
                <span>{order.subtotalAmount} {i18n.language === 'ar' ? 'ر.س' : (settings?.currency || 'SAR')}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">{t('cart.shipping', 'Shipping')}</span>
                <span>{order.shippingAmount} {i18n.language === 'ar' ? 'ر.س' : (settings?.currency || 'SAR')}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">{t('cart.tax', 'Tax')}</span>
                <span>{order.taxAmount} {i18n.language === 'ar' ? 'ر.س' : (settings?.currency || 'SAR')}</span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t">
                <span>{t('cart.total', 'Total')}</span>
                <span className="text-indigo-600">{order.totalAmount} {i18n.language === 'ar' ? 'ر.س' : (settings?.currency || 'SAR')}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/">
            <Button variant="outline" size="lg">
              <ArrowRight className="mr-2 h-5 w-5" />
              {t('cart.continueShopping', 'Continue Shopping')}
            </Button>
          </Link>
          <Button
            size="lg"
            onClick={() => window.print()}
            className="bg-gradient-to-r from-indigo-600 to-purple-600"
          >
            {t('order.print', 'Print Order')}
          </Button>
        </div>

        {/* Help Text */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t('order.confirmationSent', { email: order.guestEmail })}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            {t('order.trackHint', 'You can track your order using the order number and email')}
          </p>
        </div>
      </div>
    </div>
  );
}
