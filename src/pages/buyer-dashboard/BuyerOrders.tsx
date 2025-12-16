import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingCart,
  Search,
  Filter,
  Eye,
  Download,
  RefreshCw,
  Clock,
  Package,
  FileText,
  Calendar,
  ChevronDown,
  MoreHorizontal,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { useTranslation } from 'react-i18next';

interface OrderProduct {
  id: string;
  name: string;
  type: string;
  price: number;
  quantity: number;
  thumbnailUrl?: string;
}

interface Order {
  id: string;
  orderNumber: string;
  status: 'pending' | 'processing' | 'completed' | 'cancelled' | 'refunded';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentMethod: string;
  total: number;
  subtotal: number;
  discount: number;
  tax: number;
  createdAt: string;
  completedAt?: string;
  products: OrderProduct[];
  invoiceUrl?: string;
}

export default function BuyerOrders() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    setLoading(true);
    try {
      // Mock data - replace with actual API call
      setOrders([
        {
          id: '1',
          orderNumber: 'ORD-2024-001',
          status: 'completed',
          paymentStatus: 'paid',
          paymentMethod: 'بطاقة ائتمان',
          total: 299.00,
          subtotal: 299.00,
          discount: 0,
          tax: 0,
          createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
          completedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
          products: [
            { id: '1', name: 'دورة تصميم UI/UX الاحترافية', type: 'course', price: 299.00, quantity: 1 }
          ],
          invoiceUrl: '/invoices/1'
        },
        {
          id: '2',
          orderNumber: 'ORD-2024-002',
          status: 'pending',
          paymentStatus: 'pending',
          paymentMethod: 'تحويل بنكي',
          total: 49.00,
          subtotal: 49.00,
          discount: 0,
          tax: 0,
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          products: [
            { id: '2', name: 'قالب ووردبريس احترافي', type: 'file', price: 49.00, quantity: 1 }
          ]
        },
        {
          id: '3',
          orderNumber: 'ORD-2024-003',
          status: 'processing',
          paymentStatus: 'paid',
          paymentMethod: 'Apple Pay',
          total: 150.00,
          subtotal: 170.00,
          discount: 20.00,
          tax: 0,
          createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
          products: [
            { id: '3', name: 'حزمة أيقونات متجهة', type: 'file', price: 80.00, quantity: 1 },
            { id: '4', name: 'خطوط عربية احترافية', type: 'file', price: 70.00, quantity: 1 }
          ]
        },
        {
          id: '4',
          orderNumber: 'ORD-2024-004',
          status: 'cancelled',
          paymentStatus: 'refunded',
          paymentMethod: 'بطاقة ائتمان',
          total: 199.00,
          subtotal: 199.00,
          discount: 0,
          tax: 0,
          createdAt: new Date(Date.now() - 86400000 * 15).toISOString(),
          products: [
            { id: '5', name: 'اشتراك شهري - أدوات التصميم', type: 'subscription', price: 199.00, quantity: 1 }
          ]
        },
        {
          id: '5',
          orderNumber: 'ORD-2024-005',
          status: 'completed',
          paymentStatus: 'paid',
          paymentMethod: 'محفظة',
          total: 599.00,
          subtotal: 699.00,
          discount: 100.00,
          tax: 0,
          createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
          completedAt: new Date(Date.now() - 86400000 * 30).toISOString(),
          products: [
            { id: '6', name: 'دورة البرمجة بلغة Python', type: 'course', price: 399.00, quantity: 1 },
            { id: '7', name: 'كتاب إلكتروني - أساسيات البرمجة', type: 'file', price: 300.00, quantity: 1 }
          ],
          invoiceUrl: '/invoices/5'
        }
      ]);
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; variant: 'soft-warning' | 'soft-primary' | 'soft-success' | 'soft-destructive' | 'soft-secondary'; icon: React.ElementType }> = {
      pending: { label: 'قيد الانتظار', variant: 'soft-warning', icon: Clock },
      processing: { label: 'قيد المعالجة', variant: 'soft-primary', icon: Loader2 },
      completed: { label: 'مكتمل', variant: 'soft-success', icon: CheckCircle2 },
      cancelled: { label: 'ملغي', variant: 'soft-destructive', icon: XCircle },
      refunded: { label: 'مسترد', variant: 'soft-secondary', icon: RefreshCw },
    };
    const { label, variant, icon: Icon } = config[status] || config.pending;
    return (
      <Badge variant={variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {label}
      </Badge>
    );
  };

  const getPaymentStatusBadge = (status: string) => {
    const config: Record<string, { label: string; variant: 'soft-warning' | 'soft-success' | 'soft-destructive' | 'soft-secondary' }> = {
      pending: { label: 'في انتظار الدفع', variant: 'soft-warning' },
      paid: { label: 'مدفوع', variant: 'soft-success' },
      failed: { label: 'فشل الدفع', variant: 'soft-destructive' },
      refunded: { label: 'مسترد', variant: 'soft-secondary' },
    };
    const { label, variant } = config[status] || config.pending;
    return <Badge variant={variant}>{label}</Badge>;
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         order.products.some(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const viewOrderDetails = (order: Order) => {
    setSelectedOrder(order);
    setDetailsOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <RefreshCw className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">جاري تحميل الطلبات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-bold gradient-text flex items-center gap-3">
            <ShoppingCart className="h-8 w-8 text-primary" />
            طلباتي
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            عرض وتتبع جميع طلباتك
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={loadOrders} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            تحديث
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <ShoppingCart className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{orders.length}</p>
                <p className="text-xs text-muted-foreground">إجمالي الطلبات</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10">
                <CheckCircle2 className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{orders.filter(o => o.status === 'completed').length}</p>
                <p className="text-xs text-muted-foreground">مكتملة</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning/10">
                <Clock className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{orders.filter(o => o.status === 'pending' || o.status === 'processing').length}</p>
                <p className="text-xs text-muted-foreground">قيد المعالجة</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent/10">
                <Package className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold">{orders.reduce((acc, o) => acc + o.total, 0).toFixed(0)} ر.س</p>
                <p className="text-xs text-muted-foreground">إجمالي الإنفاق</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className={`absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground ${isRTL ? 'right-3' : 'left-3'}`} />
              <Input
                placeholder="البحث برقم الطلب أو اسم المنتج..."
                className={isRTL ? 'pr-9' : 'pl-9'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 ml-2" />
                <SelectValue placeholder="حالة الطلب" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الطلبات</SelectItem>
                <SelectItem value="pending">قيد الانتظار</SelectItem>
                <SelectItem value="processing">قيد المعالجة</SelectItem>
                <SelectItem value="completed">مكتملة</SelectItem>
                <SelectItem value="cancelled">ملغية</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardContent className="p-0">
          {filteredOrders.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-muted/50 flex items-center justify-center">
                <ShoppingCart className="h-8 w-8 opacity-40" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">لا توجد طلبات</p>
              <p className="text-xs text-muted-foreground mt-1">
                {searchQuery ? 'جرب البحث بكلمات مختلفة' : 'طلباتك ستظهر هنا'}
              </p>
              <Link to="/products">
                <Button variant="outline" size="sm" className="mt-4">
                  تصفح المنتجات
                </Button>
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>رقم الطلب</TableHead>
                  <TableHead>التاريخ</TableHead>
                  <TableHead>المنتجات</TableHead>
                  <TableHead>المبلغ</TableHead>
                  <TableHead>حالة الطلب</TableHead>
                  <TableHead>حالة الدفع</TableHead>
                  <TableHead className="text-left">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id} className="group">
                    <TableCell className="font-medium">
                      #{order.orderNumber}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(order.createdAt).toLocaleDateString('ar-SA')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[200px]">
                        <p className="text-sm truncate">{order.products[0].name}</p>
                        {order.products.length > 1 && (
                          <p className="text-xs text-muted-foreground">
                            +{order.products.length - 1} منتجات أخرى
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold">{order.total.toFixed(2)} ر.س</span>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(order.status)}
                    </TableCell>
                    <TableCell>
                      {getPaymentStatusBadge(order.paymentStatus)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => viewOrderDetails(order)}>
                            <Eye className="h-4 w-4 ml-2" />
                            عرض التفاصيل
                          </DropdownMenuItem>
                          {order.invoiceUrl && (
                            <DropdownMenuItem>
                              <FileText className="h-4 w-4 ml-2" />
                              عرض الفاتورة
                            </DropdownMenuItem>
                          )}
                          {order.status === 'completed' && (
                            <DropdownMenuItem>
                              <Download className="h-4 w-4 ml-2" />
                              تحميل المنتجات
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-muted-foreground">
                            <AlertCircle className="h-4 w-4 ml-2" />
                            الإبلاغ عن مشكلة
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Order Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-primary" />
              تفاصيل الطلب #{selectedOrder?.orderNumber}
            </DialogTitle>
            <DialogDescription>
              {selectedOrder && new Date(selectedOrder.createdAt).toLocaleDateString('ar-SA', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </DialogDescription>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-6">
              {/* Status */}
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">حالة الطلب</p>
                  {getStatusBadge(selectedOrder.status)}
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">حالة الدفع</p>
                  {getPaymentStatusBadge(selectedOrder.paymentStatus)}
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">طريقة الدفع</p>
                  <p className="font-medium">{selectedOrder.paymentMethod}</p>
                </div>
              </div>

              <Separator />

              {/* Products */}
              <div>
                <h4 className="font-semibold mb-3">المنتجات</h4>
                <div className="space-y-3">
                  {selectedOrder.products.map((product) => (
                    <div key={product.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Package className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{product.name}</p>
                          <p className="text-xs text-muted-foreground">الكمية: {product.quantity}</p>
                        </div>
                      </div>
                      <p className="font-semibold">{product.price.toFixed(2)} ر.س</p>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Summary */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">المجموع الفرعي</span>
                  <span>{selectedOrder.subtotal.toFixed(2)} ر.س</span>
                </div>
                {selectedOrder.discount > 0 && (
                  <div className="flex justify-between text-sm text-success">
                    <span>الخصم</span>
                    <span>-{selectedOrder.discount.toFixed(2)} ر.س</span>
                  </div>
                )}
                {selectedOrder.tax > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">الضريبة</span>
                    <span>{selectedOrder.tax.toFixed(2)} ر.س</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-bold">
                  <span>الإجمالي</span>
                  <span className="text-lg">{selectedOrder.total.toFixed(2)} ر.س</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 justify-end">
                {selectedOrder.invoiceUrl && (
                  <Button variant="outline" className="gap-2">
                    <FileText className="h-4 w-4" />
                    تحميل الفاتورة
                  </Button>
                )}
                {selectedOrder.status === 'completed' && (
                  <Button className="gap-2">
                    <Download className="h-4 w-4" />
                    تحميل المنتجات
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

