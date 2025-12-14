import { useState, useEffect, useCallback } from 'react';
import { Search, Filter, Download, Eye, Package, Truck, CheckCircle, XCircle, Clock, Printer, Upload } from 'lucide-react';
import { read, utils, writeFile } from 'xlsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { coreApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { useTabUpdatesContext } from '@/contexts/TabUpdatesContext';
import { useTranslation } from 'react-i18next';

interface Order {
  id: string;
  orderNumber: string;
  customer: { name: string; email: string; phone?: string };
  items: Array<{ product: { name: string; nameAr: string }; quantity: number; price: number }>;
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  total: number;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  shippingAddress?: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  createdAt: string;
  updatedAt: string;
}

export default function OrdersManager() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { addUpdate } = useTabUpdatesContext();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [previousOrdersCount, setPreviousOrdersCount] = useState(0);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      const data = await coreApi.getOrders();
      const ordersList = Array.isArray(data) ? data : ((data as any).orders || []);
      
      // Check for new orders by comparing with previous count
      setOrders((prevOrders) => {
        if (prevOrders.length > 0 && ordersList.length > prevOrders.length) {
          // Find new orders (orders that don't exist in previous list)
          const prevOrderIds = new Set(prevOrders.map(o => o.id));
          const newOrders = ordersList.filter((order: Order) => !prevOrderIds.has(order.id));
          
          newOrders.forEach((order: Order) => {
            addUpdate('/dashboard/orders', {
              type: 'added',
              message: `طلب جديد #${order.orderNumber} بقيمة ${order.total.toFixed(2)} ر.س`,
              data: order,
            });
          });
        }
        return ordersList;
      });
      
      setPreviousOrdersCount(ordersList.length);
    } catch (error) {
      console.error('Failed to load orders:', error);
      toast({
        title: 'تعذر تحميل الطلبات',
        description: 'حدث خطأ أثناء تحميل الطلبات. يرجى تحديث الصفحة.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast, addUpdate]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      await coreApi.put(`/orders/${orderId}/status`, { status: newStatus }, { requireAuth: true });
      const order = orders.find(o => o.id === orderId);
      if (order) {
        addUpdate('/dashboard/orders', {
          type: 'updated',
          message: `تم تحديث حالة الطلب #${order.orderNumber} إلى ${newStatus}`,
          data: { orderId, newStatus },
        });
      }
      toast({ title: 'نجح', description: 'تم تحديث حالة الطلب' });
      loadOrders();
    } catch (error) {
      console.error('Failed to update order status:', error);
      toast({
        title: 'تعذر تحديث حالة الطلب',
        description: 'حدث خطأ أثناء تحديث حالة الطلب. يرجى المحاولة مرة أخرى.',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; className: string; icon: any }> = {
      PENDING: { label: t('dashboard.orders.pending'), className: 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20', icon: Clock },
      PROCESSING: { label: t('dashboard.orders.processing'), className: 'bg-blue-500/10 text-blue-700 border-blue-500/20', icon: Package },
      SHIPPED: { label: t('dashboard.orders.shipped'), className: 'bg-purple-500/10 text-purple-700 border-purple-500/20', icon: Truck },
      DELIVERED: { label: t('dashboard.orders.delivered'), className: 'bg-green-500/10 text-green-700 border-green-500/20', icon: CheckCircle },
      CANCELLED: { label: t('dashboard.orders.cancelled', 'Cancelled'), className: 'bg-red-500/10 text-red-700 border-red-500/20', icon: XCircle },
    };
    const { label, className, icon: Icon } = config[status] || config.PENDING;
    return (
      <Badge variant="outline" className={className}>
        <Icon className="h-3 w-3 ml-1" />
        {label}
      </Badge>
    );
  };

  const getPaymentStatusBadge = (status: string) => {
    const config: Record<string, { label: string; className: string }> = {
      PENDING: { label: 'في انتظار الدفع', className: 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20' },
      SUCCEEDED: { label: 'مدفوع', className: 'bg-green-500/10 text-green-700 border-green-500/20' },
      FAILED: { label: 'فشل', className: 'bg-red-500/10 text-red-700 border-red-500/20' },
      REFUNDED: { label: 'مسترجع', className: 'bg-gray-500/10 text-gray-700 border-gray-500/20' },
    };
    const { label, className } = config[status] || config.PENDING;
    return <Badge variant="outline" className={className}>{label}</Badge>;
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.orderNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         order.customer?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         order.customer?.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // Pagination Logic
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentOrders = filteredOrders.slice(startIndex, endIndex);

  const handleExport = () => {
    const exportData = orders.map(o => ({
      ID: o.id,
      OrderNumber: o.orderNumber,
      CustomerName: o.customer?.name,
      CustomerEmail: o.customer?.email,
      Total: o.total,
      Status: o.status,
      PaymentStatus: o.paymentStatus,
      CreatedAt: o.createdAt
    }));

    const ws = utils.json_to_sheet(exportData);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, "Orders");
    writeFile(wb, "orders_export.xlsx");
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = await file.arrayBuffer();
      const workbook = read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = utils.sheet_to_json(worksheet);

      toast({ 
        title: 'Import Processed', 
        description: `Read ${jsonData.length} records. Order import is restricted to logging.` 
      });
      
      // Reset file input
      e.target.value = '';
    } catch (error: any) {
      toast({ title: 'Error', description: error?.message || 'Failed to import file', variant: 'destructive' });
    }
  };

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'PENDING').length,
    processing: orders.filter(o => o.status === 'PROCESSING').length,
    shipped: orders.filter(o => o.status === 'SHIPPED').length,
    delivered: orders.filter(o => o.status === 'DELIVERED').length,
  };

  const openOrderDetails = (order: Order) => {
    setSelectedOrder(order);
    setIsDetailsOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">الطلبات</h1>
          <p className="text-sm text-gray-500 mt-1">إدارة طلبات العملاء والشحنات</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="border-r-4 border-r-blue-500">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">إجمالي الطلبات</p>
              <p className="text-3xl font-bold mt-2">{stats.total}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-r-4 border-r-yellow-500">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">{t('dashboard.orders.pending')}</p>
              <p className="text-3xl font-bold mt-2">{stats.pending}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-r-4 border-r-blue-600">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">{t('dashboard.orders.processing')}</p>
              <p className="text-3xl font-bold mt-2">{stats.processing}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-r-4 border-r-purple-500">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">{t('dashboard.orders.shipped')}</p>
              <p className="text-3xl font-bold mt-2">{stats.shipped}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-r-4 border-r-green-500">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">{t('dashboard.orders.delivered')}</p>
              <p className="text-3xl font-bold mt-2">{stats.delivered}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Table */}
      <Card>
        <CardHeader className="border-b">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="البحث برقم الطلب أو اسم العميل..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1); // Reset to first page on search
                }}
                className="pr-10"
              />
            </div>
            <Select value={filterStatus} onValueChange={(val) => {
              setFilterStatus(val);
              setCurrentPage(1); // Reset to first page on filter change
            }}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 ml-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                <SelectItem value="PENDING">{t('dashboard.orders.pending')}</SelectItem>
                <SelectItem value="PROCESSING">{t('dashboard.orders.processing')}</SelectItem>
                <SelectItem value="SHIPPED">{t('dashboard.orders.shipped')}</SelectItem>
                <SelectItem value="DELIVERED">{t('dashboard.orders.delivered')}</SelectItem>
                <SelectItem value="CANCELLED">ملغي</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Button variant="outline" className="gap-2" onClick={handleExport}>
                <Download className="h-4 w-4" />
                تصدير
              </Button>
              <div className="relative">
                <Input
                  type="file"
                  accept=".xlsx, .xls"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={handleImport}
                />
                <Button variant="outline" className="gap-2">
                  <Upload className="h-4 w-4" />
                  استيراد
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold mb-2">{t('dashboard.orders.noOrders')}</h3>
              <p className="text-gray-500">{t('dashboard.orders.noMatchingOrders')}</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>رقم الطلب</TableHead>
                    <TableHead>العميل</TableHead>
                    <TableHead>المنتجات</TableHead>
                    <TableHead>المبلغ</TableHead>
                    <TableHead>حالة الطلب</TableHead>
                    <TableHead>حالة الدفع</TableHead>
                    <TableHead>التاريخ</TableHead>
                    <TableHead>الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentOrders.map((order) => (
                    <TableRow key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <TableCell className="font-mono font-semibold">
                        #{order.orderNumber || order.id.slice(0, 8)}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{order.customer?.name || 'عميل'}</p>
                          <p className="text-sm text-gray-500">{order.customer?.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {order.items?.length || 0} منتج
                        </Badge>
                      </TableCell>
                      <TableCell className="font-semibold">
                        {order.total?.toFixed(2) || '0.00'} ريال
                      </TableCell>
                      <TableCell>
                        <Select
                          value={order.status}
                          onValueChange={(value) => handleUpdateStatus(order.id, value)}
                        >
                          <SelectTrigger className="w-[150px]">
                            {getStatusBadge(order.status)}
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="PENDING">قيد الانتظار</SelectItem>
                            <SelectItem value="PROCESSING">قيد المعالجة</SelectItem>
                            <SelectItem value="SHIPPED">تم الشحن</SelectItem>
                            <SelectItem value="DELIVERED">تم التوصيل</SelectItem>
                            <SelectItem value="CANCELLED">ملغي</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>{getPaymentStatusBadge(order.paymentStatus)}</TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {new Date(order.createdAt).toLocaleDateString('ar-SA', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="icon" onClick={() => openOrderDetails(order)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon">
                            <Printer className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination Controls */}
              <div className="py-4 border-t">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                      >
                        السابق
                      </Button>
                    </PaginationItem>
                    
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <PaginationItem key={page}>
                        <PaginationLink 
                          isActive={currentPage === page}
                          onClick={() => setCurrentPage(page)}
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    ))}

                    <PaginationItem>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                      >
                        التالي
                      </Button>
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Order Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>تفاصيل الطلب #{selectedOrder?.orderNumber || selectedOrder?.id.slice(0, 8)}</DialogTitle>
            <DialogDescription>
              تم الإنشاء في {selectedOrder && new Date(selectedOrder.createdAt).toLocaleString('ar-SA')}
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="details">التفاصيل</TabsTrigger>
                <TabsTrigger value="customer">العميل</TabsTrigger>
                <TabsTrigger value="shipping">الشحن</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-4 mt-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>حالة الطلب:</Label>
                    {getStatusBadge(selectedOrder.status)}
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>حالة الدفع:</Label>
                    {getPaymentStatusBadge(selectedOrder.paymentStatus)}
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>طريقة الدفع:</Label>
                    <span className="font-medium">{selectedOrder.paymentMethod || 'غير محدد'}</span>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-4">المنتجات</h4>
                  <div className="space-y-3">
                    {selectedOrder.items?.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div>
                          <p className="font-medium">{item.product?.nameAr || item.product?.name}</p>
                          <p className="text-sm text-gray-500">الكمية: {item.quantity}</p>
                        </div>
                        <p className="font-semibold">{(item.price * item.quantity).toFixed(2)} ريال</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between">
                    <span>المجموع الفرعي:</span>
                    <span className="font-medium">{selectedOrder.subtotal?.toFixed(2) || '0.00'} ريال</span>
                  </div>
                  <div className="flex justify-between">
                    <span>الضريبة:</span>
                    <span className="font-medium">{selectedOrder.tax?.toFixed(2) || '0.00'} ريال</span>
                  </div>
                  <div className="flex justify-between">
                    <span>الشحن:</span>
                    <span className="font-medium">{selectedOrder.shipping?.toFixed(2) || '0.00'} ريال</span>
                  </div>
                  {selectedOrder.discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>الخصم:</span>
                      <span className="font-medium">-{selectedOrder.discount.toFixed(2)} ريال</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>الإجمالي:</span>
                    <span>{selectedOrder.total?.toFixed(2) || '0.00'} ريال</span>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="customer" className="space-y-4 mt-4">
                <div className="space-y-3">
                  <div>
                    <Label>الاسم:</Label>
                    <p className="font-medium mt-1">{selectedOrder.customer?.name || 'غير محدد'}</p>
                  </div>
                  <div>
                    <Label>البريد الإلكتروني:</Label>
                    <p className="font-medium mt-1">{selectedOrder.customer?.email || 'غير محدد'}</p>
                  </div>
                  <div>
                    <Label>رقم الهاتف:</Label>
                    <p className="font-medium mt-1">{selectedOrder.customer?.phone || 'غير محدد'}</p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="shipping" className="space-y-4 mt-4">
                {selectedOrder.shippingAddress ? (
                  <div className="space-y-3">
                    <div>
                      <Label>العنوان:</Label>
                      <p className="font-medium mt-1">{selectedOrder.shippingAddress.street}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>المدينة:</Label>
                        <p className="font-medium mt-1">{selectedOrder.shippingAddress.city}</p>
                      </div>
                      <div>
                        <Label>المنطقة:</Label>
                        <p className="font-medium mt-1">{selectedOrder.shippingAddress.state}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>الرمز البريدي:</Label>
                        <p className="font-medium mt-1">{selectedOrder.shippingAddress.postalCode}</p>
                      </div>
                      <div>
                        <Label>الدولة:</Label>
                        <p className="font-medium mt-1">{selectedOrder.shippingAddress.country}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">لا توجد معلومات شحن</p>
                )}
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
