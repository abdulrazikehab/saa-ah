import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Receipt, 
  Loader2,
  Package,
  Eye,
  Copy,
  CheckCircle,
  Clock,
  XCircle,
  Plus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { coreApi } from '@/lib/api';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  taxAmount: number;
  totalWithTax: number;
  deliveredCount: number;
  product: {
    name: string;
    nameAr?: string;
    image?: string;
    brand?: {
      name: string;
      nameAr?: string;
    };
  };
  deliveries?: Array<{
    cardCode: string;
    cardPin?: string;
    deliveredAt: string;
    viewedAt?: string;
  }>;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  taxAmount: number;
  totalWithTax: number;
  currency: string;
  paymentMethod: string;
  paymentStatus: string;
  paidAt?: string;
  deliveredAt?: string;
  createdAt: string;
  items: OrderItem[];
}

const statusConfig: Record<string, { label: string; labelAr: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: any }> = {
  PENDING: { label: 'Pending', labelAr: 'معلق', variant: 'secondary', icon: Clock },
  PAID: { label: 'Paid', labelAr: 'مدفوع', variant: 'default', icon: CheckCircle },
  PROCESSING: { label: 'Processing', labelAr: 'قيد المعالجة', variant: 'secondary', icon: Clock },
  DELIVERED: { label: 'Delivered', labelAr: 'تم التسليم', variant: 'default', icon: CheckCircle },
  CANCELLED: { label: 'Cancelled', labelAr: 'ملغي', variant: 'destructive', icon: XCircle },
  FAILED: { label: 'Failed', labelAr: 'فشل', variant: 'destructive', icon: XCircle },
};

export default function CardsOrders() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const navigate = useNavigate();
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Fetch orders
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const res = await coreApi.get(`/card-orders/my-orders?page=${page}&limit=20`, { requireAuth: true });
        setOrders(res.data || []);
        setTotalPages(res.totalPages || 1);
      } catch (error) {
        console.error('Error fetching orders:', error);
        toast.error(t('common.error', 'حدث خطأ'));
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [page, t]);

  // Copy card code
  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success(t('cardsOrders.copied'));
  };

  // Format date
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'dd/MM/yyyy HH:mm', { locale: isRTL ? ar : undefined });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Receipt className="h-6 w-6" />
          {t('sections.customerOrders.title')}
        </h1>
        <Button onClick={() => navigate('/dashboard/cards/store')} title={t('cardsOrders.createOrder')}>
          <Plus className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
          {t('cardsOrders.createOrder')}
        </Button>
      </div>

      {/* Orders Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">
                {t('sections.customerOrders.noOrders')}
              </h3>
              <p className="text-sm mb-4">
                {t('cardsOrders.createFirstOrder')}
              </p>
              <Button onClick={() => navigate('/dashboard/cards/store')}>
                {t('cardsOrders.browseStore')}
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className={isRTL ? 'text-right' : ''}>{t('cardsOrders.table.orderNumber')}</TableHead>
                  <TableHead className={isRTL ? 'text-right' : ''}>{t('cardsOrders.table.date')}</TableHead>
                  <TableHead className={isRTL ? 'text-right' : ''}>{t('cardsOrders.table.cards')}</TableHead>
                  <TableHead className={isRTL ? 'text-right' : ''}>{t('cardsOrders.table.amount')}</TableHead>
                  <TableHead className={isRTL ? 'text-right' : ''}>{t('cardsOrders.table.status')}</TableHead>
                  <TableHead className={isRTL ? 'text-right' : ''}>{t('cardsOrders.table.by')}</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => {
                  const status = statusConfig[order.status] || statusConfig.PENDING;
                  const StatusIcon = status.icon;
                  const totalCards = order.items.reduce((sum, item) => sum + item.quantity, 0);
                  
                  return (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.orderNumber}</TableCell>
                      <TableCell>{formatDate(order.createdAt)}</TableCell>
                      <TableCell>{totalCards}</TableCell>
                      <TableCell className="font-semibold">
                        $ {order.totalWithTax.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={status.variant} className="gap-1">
                          <StatusIcon className="h-3 w-3" />
                          {isRTL ? status.labelAr : status.label}
                        </Badge>
                      </TableCell>
                      <TableCell>{order.paymentMethod}</TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" onClick={() => setSelectedOrder(order)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
                            <DialogHeader>
                              <DialogTitle className="flex items-center gap-2">
                                <Receipt className="h-5 w-5" />
                                {t('cardsOrders.orderDetails')} - {order.orderNumber}
                              </DialogTitle>
                            </DialogHeader>
                            
                            <div className="space-y-6">
                              {/* Order Info */}
                              <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                                <div>
                                  <span className="text-sm text-muted-foreground">
                                    {t('cardsOrders.orderDate')}:
                                  </span>
                                  <p className="font-medium">{formatDate(order.createdAt)}</p>
                                </div>
                                <div>
                                  <span className="text-sm text-muted-foreground">
                                    {t('cardsOrders.status')}:
                                  </span>
                                  <p>
                                    <Badge variant={status.variant}>
                                      {isRTL ? status.labelAr : status.label}
                                    </Badge>
                                  </p>
                                </div>
                                <div>
                                  <span className="text-sm text-muted-foreground">
                                    {t('cardsOrders.totalAmount')}:
                                  </span>
                                  <p className="font-bold text-lg text-primary">
                                    $ {order.totalWithTax.toFixed(2)}
                                  </p>
                                </div>
                                <div>
                                  <span className="text-sm text-muted-foreground">
                                    {t('cardsOrders.paymentMethod')}:
                                  </span>
                                  <p className="font-medium">{order.paymentMethod}</p>
                                </div>
                              </div>

                              {/* Order Items */}
                              <div>
                                <h4 className="font-semibold mb-3">
                                  {t('cardsOrders.orderedCards')}
                                </h4>
                                <div className="space-y-4">
                                  {order.items.map((item) => (
                                    <Card key={item.id}>
                                      <CardContent className="p-4">
                                        <div className="flex items-start gap-4">
                                          <div className="w-16 h-16 rounded bg-muted flex items-center justify-center overflow-hidden">
                                            {item.product.image ? (
                                              <img src={item.product.image} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                              <Package className="h-8 w-8 text-muted-foreground" />
                                            )}
                                          </div>
                                          <div className="flex-1">
                                            <h5 className="font-semibold">
                                              {isRTL ? item.product.nameAr || item.product.name : item.product.name}
                                            </h5>
                                            <p className="text-sm text-muted-foreground">
                                              {item.quantity} × $ {item.unitPrice.toFixed(2)} = $ {item.totalWithTax.toFixed(2)}
                                            </p>
                                            
                                            {/* Card Codes */}
                                            {item.deliveries && item.deliveries.length > 0 && (
                                              <div className="mt-3 space-y-2">
                                                <p className="text-sm font-medium text-green-600">
                                                  {t('cardsOrders.codes')}
                                                </p>
                                                <div className="space-y-1">
                                                  {item.deliveries.map((delivery, idx) => (
                                                    <div 
                                                      key={idx}
                                                      className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800"
                                                    >
                                                      <code className="flex-1 text-sm font-mono">
                                                        {delivery.cardCode}
                                                        {delivery.cardPin && (
                                                          <span className="text-muted-foreground ml-2">
                                                            PIN: {delivery.cardPin}
                                                          </span>
                                                        )}
                                                      </code>
                                                      <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => copyCode(
                                                          delivery.cardPin 
                                                            ? `${delivery.cardCode} - PIN: ${delivery.cardPin}`
                                                            : delivery.cardCode
                                                        )}
                                                      >
                                                        <Copy className="h-4 w-4" />
                                                      </Button>
                                                    </div>
                                                  ))}
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      </CardContent>
                                    </Card>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
          >
            {t('cardsOrders.previous')}
          </Button>
          <span className="text-sm text-muted-foreground">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page === totalPages}
            onClick={() => setPage(p => p + 1)}
          >
            {t('cardsOrders.next')}
          </Button>
        </div>
      )}
    </div>
  );
}

