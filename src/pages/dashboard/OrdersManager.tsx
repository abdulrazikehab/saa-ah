import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { coreApi } from '@/lib/api';
import { 
  Package, 
  Search, 
  Filter, 
  Download, 
  Upload, 
  Eye, 
  Printer, 
  CheckCircle, 
  Clock, 
  XCircle, 
  Truck,
  Wallet,
  Check,
  X,
  Image as ImageIcon,
  Loader2,
  Info,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
} from "@/components/ui/pagination";
interface Address {
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  postalCode?: string;
  country?: string;
  phone?: string;
  address?: string;
}

interface StoreSettings {
  storeName?: string;
  storeNameAr?: string;
  vatNumber?: string;
  currency?: string;
  address?: string;
  city?: string;
  phone?: string;
}
interface Order {
  id: string;
  _id?: string;
  orderNumber?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  customer?: {
    name?: string;
    email?: string;
    phone?: string;
  };
  orderItems?: Array<{
    id: string;
    productId?: string;
    productName?: string;
    variantName?: string;
    quantity: number;
    price: number;
    total?: number;
    product?: {
      name?: string;
      nameAr?: string;
      images?: Array<{ url: string } | string>;
    };
  }>;
  items?: Array<{
    product?: {
      name?: string;
      nameAr?: string;
      images?: Array<{ url: string } | string>;
    };
    quantity?: number;
    price?: number;
    variantName?: string;
  }>;
  totalAmount?: number;
  total?: number;
  subtotalAmount?: number;
  subtotal?: number;
  taxAmount?: number;
  tax?: number;
  shippingAmount?: number;
  shipping?: number;
  discountAmount?: number;
  discount?: number;
  status: string;
  paymentStatus?: string;
  paymentMethod?: string;
  shippingAddress?: Address;
  billingAddress?: Address;
  ipAddress?: string;
  createdAt: string;
}

interface TopUpRequest {
  id: string;
  amount: number;
  currency: string;
  status: string;
  proofImage?: string;
  rejectionReason?: string;
  createdAt: string;
  user: {
    name: string;
    email: string;
  };
  bank?: {
    name: string;
    nameAr?: string;
    accountNumber: string;
  };
}

export default function OrdersManager() {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('orders');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Top-up requests state
  const [topUpRequests, setTopUpRequests] = useState<TopUpRequest[]>([]);
  const [loadingTopUps, setLoadingTopUps] = useState(false);
  const [processingTopUp, setProcessingTopUp] = useState<string | null>(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [selectedTopUp, setSelectedTopUp] = useState<TopUpRequest | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewRequest, setPreviewRequest] = useState<TopUpRequest | null>(null);
  const [showRejectionReasonDialog, setShowRejectionReasonDialog] = useState(false);
  const [selectedRejectionReason, setSelectedRejectionReason] = useState<string>('');
  const [storeSettings, setStoreSettings] = useState<StoreSettings | null>(null);

  const loadStoreSettings = useCallback(async () => {
    try {
      const response = await coreApi.get('/site-config', { requireAuth: true });
      if (response && response.settings) {
        setStoreSettings(response.settings);
      }
    } catch (error) {
      console.error('Failed to load store settings:', error);
    }
  }, []);

  useEffect(() => {
    loadStoreSettings();
  }, [loadStoreSettings]);

  const mapOrderData = (order: Order): Order => {
    return {
      ...order,
      id: order.id || order._id,
      customer: order.customer || {
        name: order.customerName,
        email: order.customerEmail,
        phone: order.customerPhone,
      },
      items: order.items || order.orderItems?.map((item: NonNullable<Order['orderItems']>[number]) => ({
        ...item,
        product: item.product || {
          name: item.productName,
          nameAr: item.productName,
        }
      })),
      total: order.total || order.totalAmount,
      subtotal: order.subtotal || order.subtotalAmount,
      tax: order.tax || order.taxAmount,
      shipping: order.shipping || order.shippingAmount,
      discount: order.discount || order.discountAmount,
    };
  };

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      const response = await coreApi.getOrders({ 
        page: currentPage, 
        limit: itemsPerPage,
        status: filterStatus !== 'all' ? filterStatus : undefined 
      });
      
      // Handle paginated response
      if (response && typeof response === 'object' && 'data' in response && 'meta' in response) {
        const paginatedResponse = response as { data: Order[]; meta: { total: number; totalPages: number } };
        const mappedOrders = paginatedResponse.data.map(mapOrderData);
        setOrders(mappedOrders);
        setTotalItems(paginatedResponse.meta.total);
        setTotalPages(paginatedResponse.meta.totalPages);
      } else {
        // Legacy array response or object with orders/items
        const responseObj = response as { orders?: Order[]; items?: Order[] };
        const ordersArray = Array.isArray(response) 
          ? response 
          : (responseObj?.orders || responseObj?.items || []);
        const mappedOrders = ordersArray.map(mapOrderData);
        setOrders(mappedOrders);
        setTotalItems(mappedOrders.length);
        setTotalPages(Math.ceil(mappedOrders.length / itemsPerPage));
      }
    } catch (error) {
      console.error('Failed to load orders:', error);
      toast({
        title: t('dashboard.orders.loadOrdersError'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast, t, currentPage, itemsPerPage, filterStatus]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      await coreApi.updateOrderStatus(orderId, newStatus);
      toast({
        title: t('dashboard.orders.updateStatusSuccess'),
      });
      loadOrders();
    } catch (error) {
      toast({
        title: t('dashboard.orders.updateStatusError'),
        variant: 'destructive',
      });
    }
  };

  const handleExport = () => {
    // Implementation for export to Excel
    toast({
      title: t('common.success'),
      description: t('dashboard.header.exportingOrders'),
    });
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Implementation for import from Excel
    toast({
      title: t('common.success'),
      description: t('dashboard.orders.import'),
    });
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string; icon: React.ElementType }> = {
      PENDING: { label: t('dashboard.orders.pending'), className: 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20', icon: Clock },
      PROCESSING: { label: t('dashboard.orders.processing'), className: 'bg-blue-500/10 text-blue-700 border-blue-500/20', icon: Package },
      SHIPPED: { label: t('dashboard.orders.shipped'), className: 'bg-purple-500/10 text-purple-700 border-purple-500/20', icon: Truck },
      DELIVERED: { label: t('dashboard.orders.delivered'), className: 'bg-green-500/10 text-green-700 border-green-500/20', icon: CheckCircle },
      CANCELLED: { label: t('dashboard.orders.cancelled'), className: 'bg-red-500/10 text-red-700 border-red-500/20', icon: XCircle },
    };

    const config = statusMap[status] || statusMap.PENDING;
    const Icon = config.icon;

    return (
      <Badge variant="outline" className={`${config.className} gap-1`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getPaymentStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      PENDING: { label: t('dashboard.orders.paymentPending'), variant: 'outline' },
      PAID: { label: t('dashboard.orders.paid'), variant: 'default' },
      FAILED: { label: t('dashboard.orders.failed'), variant: 'destructive' },
      REFUNDED: { label: t('dashboard.orders.refunded'), variant: 'secondary' },
    };

    const config = statusMap[status] || statusMap.PENDING;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  // For client-side search filtering (server already handles status)
  const filteredOrders = orders.filter(order => {
    if (!searchQuery) return true;
    const matchesSearch = 
      order.orderNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer?.email?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  // Use filtered orders directly since pagination is server-side
  const currentOrders = filteredOrders;

  const stats = {
    total: totalItems, // Use totalItems from server response
    pending: orders.filter(o => o.status === 'PENDING').length,
    processing: orders.filter(o => o.status === 'PROCESSING').length,
    shipped: orders.filter(o => o.status === 'SHIPPED').length,
    delivered: orders.filter(o => o.status === 'DELIVERED').length,
  };

  const openOrderDetails = (order: Order) => {
    setSelectedOrder(order);
    setIsDetailsOpen(true);
  };

  // Load top-up requests
  const loadTopUpRequests = useCallback(async () => {
    try {
      setLoadingTopUps(true);
      const response = await coreApi.get('/wallet/admin/topups', { requireAuth: true }) as { data?: TopUpRequest[]; requests?: TopUpRequest[] };
      // API client automatically unwraps { success, data, message } format
      const requests = Array.isArray(response) 
        ? response 
        : (response?.data || response?.requests || []);
      
      // Filter to show only pending requests
      const pendingRequests = requests.filter((req: TopUpRequest) => req.status === 'PENDING');
      setTopUpRequests(pendingRequests);
    } catch (error) {
      console.error('Failed to load top-up requests:', error);
      toast({
        title: t('dashboard.orders.loadTopupsError'),
        variant: 'destructive',
      });
      setTopUpRequests([]);
    } finally {
      setLoadingTopUps(false);
    }
  }, [toast, t]);

  // Load top-up requests when tab is active
  useEffect(() => {
    if (activeTab === 'topups') {
      loadTopUpRequests();
    }
  }, [activeTab, loadTopUpRequests]);

  // Approve top-up request
  const handleApproveTopUp = async (requestId: string) => {
    try {
      setProcessingTopUp(requestId);
      await coreApi.post(`/wallet/admin/topup/${requestId}/approve`, {}, { requireAuth: true });
      
      toast({
        title: t('dashboard.orders.approveSuccess'),
      });
      
      loadTopUpRequests();
      loadOrders(); // Refresh orders in case balance affects anything
    } catch (error: unknown) {
      const err = error as { message?: string };
      console.error('Failed to approve top-up:', error);
      toast({
        title: t('dashboard.orders.approveError'),
        description: err?.message,
        variant: 'destructive',
      });
    } finally {
      setProcessingTopUp(null);
    }
  };

  // Reject top-up request
  const handleRejectTopUp = async () => {
    if (!selectedTopUp || !rejectReason.trim()) {
      toast({
        title: t('dashboard.orders.error'),
        description: t('dashboard.orders.enterRejectReason'),
        variant: 'destructive',
      });
      return;
    }

    try {
      setProcessingTopUp(selectedTopUp.id);
      await coreApi.post(
        `/wallet/admin/topup/${selectedTopUp.id}/reject`,
        { reason: rejectReason },
        { requireAuth: true }
      );
      
      toast({
        title: t('dashboard.orders.rejectSuccess'),
      });
      
      setShowRejectDialog(false);
      setRejectReason('');
      setSelectedTopUp(null);
      loadTopUpRequests();
    } catch (error: unknown) {
      console.error('Failed to reject top-up:', error);
      toast({
        title: t('dashboard.orders.rejectError'),
        description: (error as { message?: string })?.message,
        variant: 'destructive',
      });
    } finally {
      setProcessingTopUp(null);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString(i18n.language === 'ar' ? 'ar-SA' : 'en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  const handlePrintInvoice = (order: Order) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const storeName = storeSettings?.storeNameAr || storeSettings?.storeName || t('common.ourStore');
    const vatNumber = storeSettings?.vatNumber || t('common.notAvailable');
    const currency = storeSettings?.currency || t('common.currency');
    
    const subtotal = order.subtotal || 0;
    const taxAmount = order.tax || 0;
    const total = order.total || 0;
    const discount = order.discount || 0;
    const shipping = order.shipping || 0;

    const itemsHtml = order.items?.map(item => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${item.product?.nameAr || item.product?.name || 'منتج'}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${(item.price || 0).toFixed(2)}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${((item.price || 0) * (item.quantity || 1)).toFixed(2)}</td>
      </tr>
    `).join('') || '';

    printWindow.document.write(`
      <html dir="rtl" lang="ar">
        <head>
          <title>فاتورة ضريبية - ${order.orderNumber}</title>
          <style>
            body { font-family: 'Arial', sans-serif; padding: 40px; color: #333; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
            .store-info h1 { margin: 0; color: #000; }
            .invoice-title { text-align: center; margin-bottom: 30px; }
            .invoice-title h2 { border: 1px solid #333; display: inline-block; padding: 5px 20px; background: #f9f9f9; }
            .details-grid { display: grid; grid-template-cols: 1fr 1fr; gap: 40px; margin-bottom: 40px; }
            .details-box h3 { border-bottom: 1px solid #eee; padding-bottom: 5px; margin-bottom: 10px; font-size: 16px; }
            .details-box p { margin: 5px 0; font-size: 14px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            th { background: #f5f5f5; padding: 10px; border-bottom: 2px solid #ddd; text-align: right; }
            .totals { width: 300px; margin-right: auto; }
            .total-row { display: flex; justify-content: space-between; padding: 5px 0; }
            .total-row.grand-total { border-top: 2px solid #333; margin-top: 10px; padding-top: 10px; font-weight: bold; font-size: 18px; }
            .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #777; border-top: 1px solid #eee; padding-top: 20px; }
            @media print {
              body { padding: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="store-info">
              <h1>${storeName}</h1>
              <p>${t('dashboard.orders.invoice.vatNumber')}: ${vatNumber}</p>
              <p>${storeSettings?.address || ''}, ${storeSettings?.city || ''}</p>
              <p>${storeSettings?.phone || ''}</p>
            </div>
            <div class="qr-placeholder" style="width: 100px; height: 100px; border: 1px solid #eee; display: flex; align-items: center; justify-content: center; font-size: 10px; text-align: center;">
              QR Code<br>ZATCA Compliant
            </div>
          </div>

          <div class="invoice-title">
            <h2>${t('dashboard.orders.invoice.simplifiedTaxInvoice')}</h2>
            <p>Simplified Tax Invoice</p>
          </div>

          <div class="details-grid">
            <div class="details-box">
              <h3>${t('dashboard.orders.invoice.invoiceInfo')}</h3>
              <p><strong>${t('dashboard.orders.invoice.orderNumber')}:</strong> ${order.orderNumber || order.id}</p>
              <p><strong>${t('dashboard.orders.invoice.date')}:</strong> ${formatDate(order.createdAt)}</p>
              <p><strong>${t('dashboard.orders.invoice.paymentStatus')}:</strong> ${order.paymentStatus === 'PAID' ? t('dashboard.orders.invoice.paid') : t('dashboard.orders.invoice.unpaid')}</p>
            </div>
            <div class="details-box">
              <h3>${t('dashboard.orders.invoice.customerInfo')}</h3>
              <p><strong>${t('dashboard.orders.invoice.name')}:</strong> ${order.customer?.name || t('dashboard.orders.customer')}</p>
              <p><strong>${t('dashboard.orders.invoice.phone')}:</strong> ${order.customer?.phone || '-'}</p>
              <p><strong>${t('dashboard.orders.invoice.address')}:</strong> ${order.shippingAddress ? order.shippingAddress.street + ', ' + order.shippingAddress.city : '-'}</p>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="text-align: right;">${t('dashboard.orders.invoice.product')}</th>
                <th style="text-align: center;">${t('dashboard.orders.invoice.quantity')}</th>
                <th style="text-align: center;">${t('dashboard.orders.invoice.unitPrice')}</th>
                <th style="text-align: center;">${t('dashboard.orders.invoice.total')}</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div class="totals">
            <div class="total-row">
              <span>${t('dashboard.orders.invoice.subtotal')}:</span>
              <span>${subtotal.toFixed(2)} ${currency}</span>
            </div>
            ${taxAmount > 0 ? `
            <div class="total-row">
              <span>${t('dashboard.orders.invoice.vat')}:</span>
              <span>${taxAmount.toFixed(2)} ${currency}</span>
            </div>
            ` : ''}
            ${shipping > 0 ? `
            <div class="total-row">
              <span>${t('dashboard.orders.invoice.shipping')}:</span>
              <span>${shipping.toFixed(2)} ${currency}</span>
            </div>
            ` : ''}
            ${discount > 0 ? `
            <div class="total-row">
              <span>${t('dashboard.orders.invoice.discount')}:</span>
              <span>-${discount.toFixed(2)} ${currency}</span>
            </div>
            ` : ''}
            <div class="total-row grand-total">
              <span>${t('dashboard.orders.invoice.grandTotal')}:</span>
              <span>${total.toFixed(2)} ${currency}</span>
            </div>
          </div>

          <div class="footer">
            <p>${t('dashboard.orders.invoice.thankYou', { storeName })}</p>
            <p>${t('dashboard.orders.invoice.footer')}</p>
          </div>

          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('dashboard.orders.title')}</h1>
          <p className="text-sm text-gray-500 mt-1">{t('dashboard.orders.subtitle')}</p>
        </div>
      </div>

      {/* Tabs for Orders and Top-up Requests */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="orders" className="gap-2">
            <Package className="h-4 w-4" />
            {t('dashboard.orders.orders')}
          </TabsTrigger>
          <TabsTrigger value="topups" className="gap-2 relative">
            <Wallet className="h-4 w-4" />
            {t('dashboard.orders.topups')}
            {topUpRequests.length > 0 && (
              <Badge variant="destructive" className="mr-2 h-5 w-5 flex items-center justify-center p-0 text-xs">
                {topUpRequests.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Orders Tab */}
        <TabsContent value="orders" className="space-y-6 mt-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card className="border-r-4 border-r-blue-500">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400">{t('dashboard.orders.totalOrders')}</p>
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
                    placeholder={t('dashboard.orders.searchPlaceholder')}
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="pr-10"
                  />
                </div>
                <Select value={filterStatus} onValueChange={(val) => {
                  setFilterStatus(val);
                  setCurrentPage(1);
                }}>
                  <SelectTrigger className="w-[180px]">
                    <Filter className="h-4 w-4 ml-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('dashboard.orders.allStatuses')}</SelectItem>
                    <SelectItem value="PENDING">{t('dashboard.orders.pending')}</SelectItem>
                    <SelectItem value="PROCESSING">{t('dashboard.orders.processing')}</SelectItem>
                    <SelectItem value="SHIPPED">{t('dashboard.orders.shipped')}</SelectItem>
                    <SelectItem value="DELIVERED">{t('dashboard.orders.delivered')}</SelectItem>
                    <SelectItem value="CANCELLED">{t('dashboard.orders.cancelled')}</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex gap-2">
                  <Button variant="outline" className="gap-2" onClick={handleExport}>
                    <Download className="h-4 w-4" />
                    {t('dashboard.orders.export')}
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
                      {t('dashboard.orders.import')}
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
                        <TableHead>{t('dashboard.orders.orderNumber')}</TableHead>
                        <TableHead>{t('dashboard.orders.customer')}</TableHead>
                        <TableHead>{t('dashboard.orders.products')}</TableHead>
                        <TableHead>{t('dashboard.orders.amount')}</TableHead>
                        <TableHead>{t('dashboard.orders.status')}</TableHead>
                        <TableHead>{t('dashboard.orders.paymentStatus')}</TableHead>
                        <TableHead>{t('dashboard.orders.date')}</TableHead>
                        <TableHead>{t('dashboard.orders.actions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentOrders.map((order, index) => (
                        <TableRow key={order.id || `order-${index}`} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                          <TableCell className="font-mono font-semibold">
                            #{order.orderNumber || order.id?.slice(0, 8) || 'N/A'}
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{order.customer?.name || t('dashboard.orders.customer')}</p>
                              <p className="text-sm text-gray-500">{order.customer?.email}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {order.items?.length || 0} {t('dashboard.orders.products')}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-semibold">
                            {order.total?.toFixed(2) || '0.00'} {t('common.currency')}
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
                                <SelectItem value="PENDING">{t('dashboard.orders.pending')}</SelectItem>
                                <SelectItem value="PROCESSING">{t('dashboard.orders.processing')}</SelectItem>
                                <SelectItem value="SHIPPED">{t('dashboard.orders.shipped')}</SelectItem>
                                <SelectItem value="DELIVERED">{t('dashboard.orders.delivered')}</SelectItem>
                                <SelectItem value="CANCELLED">{t('dashboard.orders.cancelled')}</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>{getPaymentStatusBadge(order.paymentStatus)}</TableCell>
                          <TableCell className="text-sm text-gray-500">
                            {new Date(order.createdAt).toLocaleDateString(undefined, {
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
                              <Button variant="ghost" size="icon" onClick={() => handlePrintInvoice(order)}>
                                <Printer className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {/* Pagination Controls */}
                  {totalPages > 1 && (
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
                              {t('dashboard.orders.previous')}
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
                              {t('dashboard.orders.next')}
                            </Button>
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Top-up Requests Tab */}
        <TabsContent value="topups" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                {t('dashboard.orders.topupRequests')}
                {topUpRequests.length > 0 && (
                  <Badge variant="outline" className="bg-yellow-500/10 text-yellow-700 border-yellow-500/20">
                    {topUpRequests.length} {t('dashboard.orders.pending')}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingTopUps ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
                </div>
              ) : topUpRequests.length === 0 ? (
                <div className="text-center py-12">
                  <Wallet className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-xl font-semibold mb-2">{t('dashboard.orders.noTopups')}</h3>
                  <p className="text-gray-500">{t('dashboard.orders.noPendingTopups')}</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('dashboard.orders.user')}</TableHead>
                      <TableHead>{t('dashboard.orders.amount')}</TableHead>
                      <TableHead>{t('dashboard.orders.bank')}</TableHead>
                      <TableHead>{t('dashboard.orders.receiptImage')}</TableHead>
                      <TableHead>{t('dashboard.orders.requestDate')}</TableHead>
                      <TableHead>{t('dashboard.orders.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topUpRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{request.user.name || request.user.email}</p>
                            <p className="text-sm text-gray-500">{request.user.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-semibold text-green-600">
                            {Number(request.amount).toFixed(2)} {request.currency || t('common.currency')}
                          </span>
                        </TableCell>
                        <TableCell>
                          {request.bank ? (
                            <div>
                              <p className="font-medium">{request.bank.nameAr || request.bank.name}</p>
                              <p className="text-xs text-gray-500">{t('dashboard.orders.accountNumber')}: {request.bank.accountNumber}</p>
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {request.proofImage ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(request.proofImage, '_blank')}
                              className="gap-2"
                            >
                              <ImageIcon className="h-4 w-4" />
                              {t('dashboard.orders.view')}
                            </Button>
                          ) : (
                            <span className="text-gray-400">{t('dashboard.orders.noImage')}</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{formatDate(request.createdAt)}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="gap-2"
                              onClick={() => {
                                setPreviewRequest(request);
                                setIsPreviewOpen(true);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                              {t('dashboard.orders.preview')}
                            </Button>
                            {request.status === 'REJECTED' && request.rejectionReason ? (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-orange-600 dark:text-orange-500 border-orange-600 dark:border-orange-500 hover:text-orange-700 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950"
                                onClick={() => {
                                  setSelectedRejectionReason(request.rejectionReason || '');
                                  setShowRejectionReasonDialog(true);
                                }}
                              >
                                <Info className="h-4 w-4 ml-1" />
                                {t('dashboard.orders.viewRejectionReason', 'View Rejection Reason')}
                              </Button>
                            ) : request.status === 'PENDING' ? (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-green-600 dark:text-green-500 border-green-600 dark:border-green-500 hover:text-green-700 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-950"
                                  onClick={() => handleApproveTopUp(request.id)}
                                  disabled={processingTopUp === request.id}
                                >
                                  {processingTopUp === request.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Check className="h-4 w-4 ml-1" />
                                  )}
                                  {t('dashboard.orders.approve')}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-red-600 dark:text-red-500 border-red-600 dark:border-red-500 hover:text-red-700 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950"
                                  onClick={() => {
                                    setSelectedTopUp(request);
                                    setShowRejectDialog(true);
                                  }}
                                  disabled={processingTopUp === request.id}
                                >
                                  <X className="h-4 w-4 ml-1" />
                                  {t('dashboard.orders.reject')}
                                </Button>
                              </>
                            ) : null}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Order Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex justify-between items-start">
              <div>
                <DialogTitle className="text-2xl flex items-center gap-2">
                  <Package className="h-6 w-6 text-primary" />
                  {t('dashboard.orders.viewDetails')} #{selectedOrder?.orderNumber || selectedOrder?.id?.slice(0, 8)}
                </DialogTitle>
                <DialogDescription className="mt-1">
                  {selectedOrder && formatDate(selectedOrder.createdAt)}
                </DialogDescription>
              </div>
              <div className="flex gap-2">
                {selectedOrder && getStatusBadge(selectedOrder.status)}
                {selectedOrder && getPaymentStatusBadge(selectedOrder.paymentStatus || 'PENDING')}
              </div>
            </div>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-8 py-6">
              {/* Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Customer Info */}
                <Card className="bg-gray-50/50 dark:bg-gray-900/50 border-none">
                  <CardContent className="pt-6 space-y-4">
                    <div className="flex items-center gap-2 font-semibold text-primary">
                      <Info className="h-4 w-4" />
                      {t('dashboard.orders.customer')}
                    </div>
                    <div className="space-y-2">
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider">{t('dashboard.orders.customerName')}</p>
                        <p className="font-medium">{selectedOrder.customer?.name || t('common.notAvailable')}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider">{t('dashboard.orders.email')}</p>
                        <p className="font-medium break-all">{selectedOrder.customer?.email || t('common.notAvailable')}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider">{t('dashboard.orders.phone')}</p>
                        <p className="font-medium">{selectedOrder.customer?.phone || t('common.notAvailable')}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Shipping Info */}
                <Card className="bg-gray-50/50 dark:bg-gray-900/50 border-none">
                  <CardContent className="pt-6 space-y-4">
                    <div className="flex items-center gap-2 font-semibold text-primary">
                      <Truck className="h-4 w-4" />
                      {t('dashboard.orders.shippingAddress')}
                    </div>
                    {selectedOrder.shippingAddress ? (
                      <div className="space-y-2">
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wider">{t('dashboard.orders.address')}</p>
                          <p className="font-medium">{selectedOrder.shippingAddress.street || selectedOrder.shippingAddress.address || t('common.notAvailable')}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wider">{t('dashboard.orders.city')}</p>
                            <p className="font-medium">{selectedOrder.shippingAddress.city || t('common.notAvailable')}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wider">{t('dashboard.orders.state')}</p>
                            <p className="font-medium">{selectedOrder.shippingAddress.state || t('common.notAvailable')}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wider">{t('dashboard.orders.postalCode')}</p>
                            <p className="font-medium">{selectedOrder.shippingAddress.postalCode || t('common.notAvailable')}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wider">{t('dashboard.orders.country')}</p>
                            <p className="font-medium">{selectedOrder.shippingAddress.country || t('common.notAvailable')}</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 italic">{t('dashboard.orders.noShippingInfo')}</p>
                    )}
                  </CardContent>
                </Card>

                {/* Payment Info */}
                <Card className="bg-gray-50/50 dark:bg-gray-900/50 border-none">
                  <CardContent className="pt-6 space-y-4">
                    <div className="flex items-center gap-2 font-semibold text-primary">
                      <Wallet className="h-4 w-4" />
                      {t('dashboard.orders.paymentDetails')}
                    </div>
                    <div className="space-y-2">
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider">{t('dashboard.orders.paymentMethod')}</p>
                        <p className="font-medium">{selectedOrder.paymentMethod || t('common.notAvailable')}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider">{t('dashboard.orders.paymentStatus')}</p>
                        <p className="font-medium">{selectedOrder.paymentStatus || t('common.notAvailable')}</p>
                      </div>
                      {selectedOrder.ipAddress && (
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wider">IP Address</p>
                          <p className="font-mono text-xs">{selectedOrder.ipAddress}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Products Table */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Package className="h-5 w-5 text-primary" />
                    {t('dashboard.orders.products')}
                  </h3>
                  <Badge variant="outline">
                    {selectedOrder.items?.length || 0} {t('dashboard.orders.items')}
                  </Badge>
                </div>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader className="bg-gray-50 dark:bg-gray-900">
                      <TableRow>
                        <TableHead className="w-[40%]">{t('dashboard.orders.productName')}</TableHead>
                        <TableHead className="text-center">{t('dashboard.reports.quantity')}</TableHead>
                        <TableHead className="text-right">{t('dashboard.products.price')}</TableHead>
                        <TableHead className="text-right">{t('dashboard.reports.itemTotal')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedOrder.items?.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <div className="font-medium">
                              {item.product?.nameAr || item.product?.name}
                            </div>
                            {item.variantName && (
                              <p className="text-xs text-gray-500 mt-0.5">
                                {t('dashboard.products.variant')}: {item.variantName}
                              </p>
                            )}
                          </TableCell>
                          <TableCell className="text-center font-mono">{item.quantity}</TableCell>
                          <TableCell className="text-right font-mono">
                            {(item.price ?? 0).toFixed(2)} {t('common.currency')}
                          </TableCell>
                          <TableCell className="text-right font-mono font-semibold">
                            {((item.price ?? 0) * (item.quantity ?? 0)).toFixed(2)} {t('common.currency')}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Summary */}
              <div className="flex justify-end">
                <Card className="w-full max-w-sm border-none bg-gray-50/50 dark:bg-gray-900/50">
                  <CardContent className="pt-6 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">{t('dashboard.reports.subtotal')}</span>
                      <span className="font-mono">{(selectedOrder.subtotal ?? 0).toFixed(2)} {t('common.currency')}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">{t('dashboard.reports.tax')}</span>
                      <span className="font-mono">{(selectedOrder.tax ?? 0).toFixed(2)} {t('common.currency')}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">{t('dashboard.orders.shipping')}</span>
                      <span className="font-mono">{(selectedOrder.shipping ?? 0).toFixed(2)} {t('common.currency')}</span>
                    </div>
                    {(selectedOrder.discount ?? 0) > 0 && (
                      <div className="flex justify-between text-sm text-red-600">
                        <span>{t('categories.offers.discountPercent')}</span>
                        <span className="font-mono">-{(selectedOrder.discount ?? 0).toFixed(2)} {t('common.currency')}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-xl font-bold border-t pt-3 mt-3">
                      <span>{t('dashboard.reports.total')}</span>
                      <span className="text-primary font-mono">{(selectedOrder.total ?? 0).toFixed(2)} {t('common.currency')}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          <DialogFooter className="border-t pt-4 gap-2">
            <Button variant="outline" onClick={() => setIsDetailsOpen(false)}>
              {t('common.close')}
            </Button>
            <Button className="gap-2" onClick={() => selectedOrder && handlePrintInvoice(selectedOrder)}>
              <Printer className="h-4 w-4" />
              {t('dashboard.orders.printInvoice')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Rejection Reason Dialog */}
      <Dialog open={showRejectionReasonDialog} onOpenChange={setShowRejectionReasonDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              {t('dashboard.orders.rejectionReason', 'Rejection Reason')}
            </DialogTitle>
            <DialogDescription>
              {t('dashboard.orders.rejectionReasonDescription', 'The reason why this top-up request was rejected')}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {selectedRejectionReason || t('dashboard.orders.noReasonProvided', 'No reason provided')}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowRejectionReasonDialog(false)}>
              {t('common.close', 'Close')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Top-up Request Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <Wallet className="h-6 w-6 text-primary" />
              {t('dashboard.orders.topupDetails')}
            </DialogTitle>
            <DialogDescription>
              {previewRequest && formatDate(previewRequest.createdAt)}
            </DialogDescription>
          </DialogHeader>

          {previewRequest && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold border-b pb-2">{t('dashboard.orders.user')}</h3>
                  <div className="space-y-1">
                    <p className="font-medium">{previewRequest.user.name || t('dashboard.orders.customer')}</p>
                    <p className="text-sm text-gray-500">{previewRequest.user.email}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="font-semibold border-b pb-2">{t('dashboard.orders.amount')}</h3>
                  <div className="space-y-1">
                    <p className="text-2xl font-bold text-green-600">
                      {Number(previewRequest.amount).toFixed(2)} {previewRequest.currency || t('common.currency')}
                    </p>
                    <p className="text-sm text-gray-500">{t('dashboard.orders.requestAmount')}</p>
                  </div>
                </div>
              </div>

              {previewRequest.bank && (
                <div className="space-y-4">
                  <h3 className="font-semibold border-b pb-2">{t('dashboard.orders.bank')}</h3>
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">{t('dashboard.orders.bankName')}</p>
                      <p className="font-medium">{previewRequest.bank.nameAr || previewRequest.bank.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">{t('dashboard.orders.accountNumber')}</p>
                      <p className="font-medium font-mono">{previewRequest.bank.accountNumber}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <h3 className="font-semibold border-b pb-2">{t('dashboard.orders.receiptImage')}</h3>
                {previewRequest.proofImage ? (
                  <div className="space-y-2">
                    <img
                      src={previewRequest.proofImage}
                      alt={t('dashboard.orders.receiptImage')}
                      className="max-w-full h-auto rounded-lg border border-gray-200 dark:border-gray-700"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(previewRequest.proofImage, '_blank')}
                      className="gap-2"
                    >
                      <ImageIcon className="h-4 w-4" />
                      {t('dashboard.orders.viewFullImage')}
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-gray-400">
                    <ImageIcon className="h-5 w-5" />
                    <span>{t('dashboard.orders.noImage')}</span>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold border-b pb-2">{t('dashboard.orders.status')}</h3>
                <div>
                  {getStatusBadge(previewRequest.status)}
                </div>
              </div>

              {previewRequest.status === 'REJECTED' && previewRequest.rejectionReason && (
                <div className="space-y-4">
                  <h3 className="font-semibold border-b pb-2">{t('dashboard.orders.rejectionReason', 'Rejection Reason')}</h3>
                  <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      {previewRequest.rejectionReason}
                    </p>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <h3 className="font-semibold border-b pb-2">{t('dashboard.orders.requestDate')}</h3>
                <p className="text-sm">{formatDate(previewRequest.createdAt)}</p>
              </div>
            </div>
          )}

          <DialogFooter className="border-t pt-4">
            <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>
              {t('common.close')}
            </Button>
            {previewRequest && (
              <>
                {previewRequest.status === 'REJECTED' && previewRequest.rejectionReason ? (
                  <Button
                    variant="outline"
                    className="text-orange-600 dark:text-orange-500 border-orange-600 dark:border-orange-500 hover:text-orange-700 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950"
                    onClick={() => {
                      setIsPreviewOpen(false);
                      setSelectedRejectionReason(previewRequest.rejectionReason || '');
                      setShowRejectionReasonDialog(true);
                    }}
                  >
                    <Info className="h-4 w-4 ml-1" />
                    {t('dashboard.orders.viewRejectionReason', 'View Rejection Reason')}
                  </Button>
                ) : previewRequest.status === 'PENDING' ? (
                  <>
                    <Button
                      variant="outline"
                      className="text-green-600 dark:text-green-500 border-green-600 dark:border-green-500 hover:text-green-700 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-950"
                      onClick={() => {
                        setIsPreviewOpen(false);
                        handleApproveTopUp(previewRequest.id);
                      }}
                      disabled={processingTopUp === previewRequest.id}
                    >
                      {processingTopUp === previewRequest.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4 ml-1" />
                      )}
                      {t('dashboard.orders.approve')}
                    </Button>
                    <Button
                      variant="outline"
                      className="text-red-600 dark:text-red-500 border-red-600 dark:border-red-500 hover:text-red-700 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950"
                      onClick={() => {
                        setIsPreviewOpen(false);
                        setSelectedTopUp(previewRequest);
                        setShowRejectDialog(true);
                      }}
                      disabled={processingTopUp === previewRequest.id}
                    >
                      <X className="h-4 w-4 ml-1" />
                      {t('dashboard.orders.reject')}
                    </Button>
                  </>
                ) : null}
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Top-up Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('dashboard.orders.rejectReason')}</DialogTitle>
            <DialogDescription>
              {t('dashboard.orders.enterRejectReason')} {selectedTopUp?.user.email}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="reject-reason" className="mb-2 block">
              {t('dashboard.orders.rejectReason')}
            </Label>
            <Textarea
              id="reject-reason"
              placeholder={t('dashboard.orders.enterRejectReason')}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              {t('dashboard.orders.cancel')}
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleRejectTopUp}
              disabled={!rejectReason.trim() || processingTopUp === selectedTopUp?.id}
            >
              {processingTopUp === selectedTopUp?.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                t('dashboard.orders.reject')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Rejection Reason Dialog */}
      <Dialog open={showRejectionReasonDialog} onOpenChange={setShowRejectionReasonDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              {t('dashboard.orders.rejectionReason', 'Rejection Reason')}
            </DialogTitle>
            <DialogDescription>
              {t('dashboard.orders.rejectionReasonDescription', 'The reason why this top-up request was rejected')}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {selectedRejectionReason || t('dashboard.orders.noReasonProvided', 'No reason provided')}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowRejectionReasonDialog(false)}>
              {t('common.close', 'Close')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
