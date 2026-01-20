import { useEffect, useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { apiClient } from '@/services/core/api-client';
import type { Order } from '@/services/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Package, ArrowRight, ShoppingBag, Calendar, DollarSign } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

export default function Orders() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  const loadOrders = useCallback(async () => {
    try {
      const customerToken = localStorage.getItem('customerToken');
      const customerEmail = localStorage.getItem('lastOrderEmail') || sessionStorage.getItem('guestOrderEmail');
      
      if (!customerToken && !customerEmail) {
        // If no token and no email, redirect to home (or show message)
        navigate('/');
        return;
      }

      let regularOrdersResponse: any = { data: [] };
      
      // If authenticated, use the orders endpoint (includes both regular and guest orders)
      if (customerToken) {
        regularOrdersResponse = await apiClient.fetch(`${apiClient.coreUrl}/orders`, {
          headers: { 'Authorization': `Bearer ${customerToken}` },
        }).catch(() => ({ data: [] }));
      } 
      // If not authenticated but have email, use the public guest orders endpoint
      else if (customerEmail) {
        regularOrdersResponse = await apiClient.fetch(
          `${apiClient.coreUrl}/guest-checkout/orders-by-email?email=${encodeURIComponent(customerEmail)}`,
          { requireAuth: false }
        ).catch(() => []);
      }

      // Fetch card orders if authenticated
      const cardOrdersResponse = customerToken
        ? await apiClient.fetch(`${apiClient.coreUrl}/card-orders/my-orders`, {
          headers: { 'Authorization': `Bearer ${customerToken}` },
          }).catch(() => ({ data: [] }))
        : { data: [] };
      
      // Handle paginated response format { data: [...], meta: {...} } or array
      const regularOrders = Array.isArray(regularOrdersResponse) 
        ? regularOrdersResponse 
        : (regularOrdersResponse?.data || []);
      const cardOrders = Array.isArray(cardOrdersResponse) 
        ? cardOrdersResponse 
        : (cardOrdersResponse?.data || []);
      
      // Merge and sort by date
      const allOrders = [
        ...regularOrders,
        ...cardOrders.map((o: any) => ({ ...o, isCardOrder: true })),
      ].sort((a: any, b: any) => new Date(b.createdAt || b.created_at || 0).getTime() - new Date(a.createdAt || a.created_at || 0).getTime());

      setOrders(allOrders);
    } catch (error) {
      console.error('Failed to load orders:', error);
      toast({
        title: t('sections.customerOrders.loadError'),
        description: t('sections.customerOrders.loadErrorDesc'),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast, navigate]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'COMPLETED':
      case 'DELIVERED':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'PENDING':
      case 'PROCESSING':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'CANCELLED':
      case 'REFUNDED':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      case 'SHIPPED':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const getStatusText = (status: string) => {
    const statusKey = status?.toLowerCase();
    const translationKey = `sections.customerOrders.orderStatus.${statusKey}`;
    return t(translationKey, status);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container py-8">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-12 w-12 animate-spin text-indigo-600" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            {t('sections.customerOrders.title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            {t('sections.customerOrders.subtitle')}
          </p>
        </div>

        {orders.length === 0 ? (
          <Card className="border-0 shadow-lg">
            <CardContent className="p-16 text-center">
              <Package className="h-24 w-24 mx-auto text-gray-400 mb-6" />
              <h2 className="text-3xl font-bold mb-4">{t('sections.customerOrders.noOrders')}</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-8 text-lg max-w-md mx-auto">
                {isRTL ? 'لم تقم بإجراء أي طلبات بعد. ابدأ التسوق الآن!' : "You haven't placed any orders yet. Start shopping now!"}
              </p>
              <Link to="/products">
                <Button size="lg" className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 px-8">
                  {t('sections.customerOrders.continueShopping')}
                  <ArrowRight className={`${isRTL ? 'mr-2' : 'ml-2'} h-5 w-5 ${isRTL ? 'rotate-180' : ''}`} />
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Desktop View */}
            <Card className="border-0 shadow-lg hidden md:block">
              <CardHeader>
                <CardTitle className="text-2xl">{t('sections.customerOrders.title')}</CardTitle>
                <CardDescription>{t('sections.customerOrders.subtitle')}</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className={isRTL ? 'text-right' : 'text-left'}>{t('sections.customerOrders.orderNumber')}</TableHead>
                      <TableHead className={isRTL ? 'text-right' : 'text-left'}>{t('sections.customerOrders.date')}</TableHead>
                      <TableHead className={isRTL ? 'text-right' : 'text-left'}>{t('sections.customerOrders.status')}</TableHead>
                      <TableHead className={isRTL ? 'text-right' : 'text-left'}>{t('sections.customerOrders.total')}</TableHead>
                      <TableHead className={isRTL ? 'text-right' : 'text-left'}>{isRTL ? 'العناصر' : 'Items'}</TableHead>
                      <TableHead className={isRTL ? 'text-right' : 'text-left'}>{t('sections.customerOrders.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => (
                      <TableRow key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <TableCell className="font-medium font-mono">
                          #{order.orderNumber || order.id.slice(0, 8).toUpperCase()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            {new Date(order.createdAt).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(order.status)}>
                            {getStatusText(order.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 font-bold text-indigo-600">
                            <DollarSign className="h-4 w-4" />
                            {Number(order.totalAmount || order.total || 0).toFixed(2)} {t('common.currency')}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <ShoppingBag className="h-4 w-4 text-gray-400" />
                            {order.orderItems?.length || 0} {isRTL ? 'منتج' : 'items'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/orders/${order.id}`)}
                            className="border-2"
                            title={t('sections.customerOrders.viewDetails')}
                          >
                            {t('sections.customerOrders.viewDetails')}
                            <ArrowRight className={`${isRTL ? 'mr-2' : 'ml-2'} h-4 w-4 ${isRTL ? 'rotate-180' : ''}`} />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Mobile View */}
            <div className="md:hidden space-y-4">
              {orders.map((order) => (
                <Card key={order.id} className="border-0 shadow-md hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <p className="text-sm text-gray-500 mb-1">{t('sections.customerOrders.orderNumber')}</p>
                        <p className="font-bold font-mono">
                          #{order.orderNumber || order.id.slice(0, 8).toUpperCase()}
                        </p>
                      </div>
                      <Badge className={getStatusColor(order.status)}>
                        {getStatusText(order.status)}
                      </Badge>
                    </div>

                    <div className="space-y-3 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500 flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          {t('sections.customerOrders.date')}
                        </span>
                        <span className="font-medium">
                          {new Date(order.createdAt).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US')}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500 flex items-center gap-2">
                          <ShoppingBag className="h-4 w-4" />
                          {isRTL ? 'العناصر' : 'Items'}
                        </span>
                        <span className="font-medium">{order.orderItems?.length || 0} {isRTL ? 'منتج' : 'items'}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-gray-500 flex items-center gap-2">
                          <DollarSign className="h-4 w-4" />
                          {t('sections.customerOrders.total')}
                        </span>
                        <span className="font-bold text-lg text-indigo-600">
                          {Number(order.totalAmount || order.total || 0).toFixed(2)} {t('common.currency')}
                        </span>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      className="w-full border-2"
                      onClick={() => navigate(`/orders/${order.id}`)}
                      title={t('sections.customerOrders.viewDetails')}
                    >
                      {t('sections.customerOrders.viewDetails')}
                      <ArrowRight className={`${isRTL ? 'mr-2' : 'ml-2'} h-4 w-4 ${isRTL ? 'rotate-180' : ''}`} />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
