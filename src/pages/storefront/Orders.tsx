import { useEffect, useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  const loadOrders = useCallback(async () => {
    try {
      const customerToken = localStorage.getItem('customerToken');
      
      if (!customerToken) {
        navigate('/');
        return;
      }

      // Fetch orders using customer token
      const ordersData = await apiClient.fetch(`${apiClient.coreUrl}/orders`, {
        headers: {
          'Authorization': `Bearer ${customerToken}`,
        },
      });
      
      setOrders(Array.isArray(ordersData) ? ordersData : []);
    } catch (error) {
      console.error('Failed to load orders:', error);
      toast({
        title: 'خطأ',
        description: 'فشل تحميل الطلبات. يرجى المحاولة مرة أخرى.',
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
    const statusMap: Record<string, string> = {
      PENDING: 'قيد الانتظار',
      PROCESSING: 'قيد المعالجة',
      SHIPPED: 'تم الشحن',
      DELIVERED: 'تم التوصيل',
      COMPLETED: 'مكتمل',
      CANCELLED: 'ملغي',
      REFUNDED: 'مسترد',
    };
    return statusMap[status?.toUpperCase()] || status;
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
            طلباتي
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            تتبع وإدارة جميع طلباتك
          </p>
        </div>

        {orders.length === 0 ? (
          <Card className="border-0 shadow-lg">
            <CardContent className="p-16 text-center">
              <Package className="h-24 w-24 mx-auto text-gray-400 mb-6" />
              <h2 className="text-3xl font-bold mb-4">لا توجد طلبات</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-8 text-lg max-w-md mx-auto">
                لم تقم بإجراء أي طلبات بعد. ابدأ التسوق الآن!
              </p>
              <Link to="/products">
                <Button size="lg" className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 px-8">
                  تصفح المنتجات
                  <ArrowRight className="mr-2 h-5 w-5" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Desktop View */}
            <Card className="border-0 shadow-lg hidden md:block">
              <CardHeader>
                <CardTitle className="text-2xl">سجل الطلبات</CardTitle>
                <CardDescription>عرض وتتبع طلباتك الأخيرة</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">رقم الطلب</TableHead>
                      <TableHead className="text-right">التاريخ</TableHead>
                      <TableHead className="text-right">الحالة</TableHead>
                      <TableHead className="text-right">المبلغ الإجمالي</TableHead>
                      <TableHead className="text-right">العناصر</TableHead>
                      <TableHead className="text-right">الإجراءات</TableHead>
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
                            {new Date(order.createdAt).toLocaleDateString('ar-SA', {
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
                            {Number(order.totalAmount || order.total || 0).toFixed(2)} ر.س
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <ShoppingBag className="h-4 w-4 text-gray-400" />
                            {order.orderItems?.length || 0} منتج
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/orders/${order.id}`)}
                            className="border-2"
                          >
                            عرض التفاصيل
                            <ArrowRight className="mr-2 h-4 w-4" />
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
                        <p className="text-sm text-gray-500 mb-1">رقم الطلب</p>
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
                          التاريخ
                        </span>
                        <span className="font-medium">
                          {new Date(order.createdAt).toLocaleDateString('ar-SA')}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500 flex items-center gap-2">
                          <ShoppingBag className="h-4 w-4" />
                          العناصر
                        </span>
                        <span className="font-medium">{order.orderItems?.length || 0} منتج</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-gray-500 flex items-center gap-2">
                          <DollarSign className="h-4 w-4" />
                          المبلغ الإجمالي
                        </span>
                        <span className="font-bold text-lg text-indigo-600">
                          {Number(order.totalAmount || order.total || 0).toFixed(2)} ر.س
                        </span>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      className="w-full border-2"
                      onClick={() => navigate(`/orders/${order.id}`)}
                    >
                      عرض التفاصيل
                      <ArrowRight className="mr-2 h-4 w-4" />
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
