import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { coreApi } from '@/lib/api';
import { orderService } from '@/services/order.service';
import { utils, writeFile } from 'xlsx';
import { createWorker } from 'tesseract.js';
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
  AlertCircle,
  RotateCcw
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
import { formatNumber, formatCurrency } from '@/lib/currency-utils';
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
  processedBy?: {
    id: string;
    name: string;
    email: string;
  };
}

export default function OrdersManager() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
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
  const [topUpRequests, setTopUpRequests] = useState<TopUpRequest[]>([]); // Pending
  const [topUpHistory, setTopUpHistory] = useState<TopUpRequest[]>([]); // History (Approved/Rejected)
  const [historyPage, setHistoryPage] = useState(1);
  const historyItemsPerPage = 10;

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
  
  // Order approve/reject state
  const [showOrderRejectDialog, setShowOrderRejectDialog] = useState(false);
  const [selectedOrderForReject, setSelectedOrderForReject] = useState<Order | null>(null);
  const [orderRejectReason, setOrderRejectReason] = useState('');
  const [processingOrder, setProcessingOrder] = useState<string | null>(null);


  // Top-up approval confirmation state
  const [showApproveConfirmDialog, setShowApproveConfirmDialog] = useState(false);
  const [selectedTopUpForApproval, setSelectedTopUpForApproval] = useState<TopUpRequest | null>(null);

  // Analysis State
  const [analyzingImage, setAnalyzingImage] = useState(false);
  const [detectedAmount, setDetectedAmount] = useState<number | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Date Filter State
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Refund State
  const [showRefundDialog, setShowRefundDialog] = useState(false);
  const [selectedOrderForRefund, setSelectedOrderForRefund] = useState<Order | null>(null);
  const [refundReason, setRefundReason] = useState('');

  const analyzeImage = useCallback(async (imageUrl: string) => {
    setAnalyzingImage(true);
    setDetectedAmount(null);
    setAnalysisError(null);

    try {
      console.log('Sending image to backend for AI analysis:', imageUrl);
      
      const response = await coreApi.post('/ai/analyze-receipt', { imageUrl }, { requireAuth: true });
      console.log('Backend AI Analysis Result:', response);
      
      // Check for amount property explicitly, allowing 0
      if (response && typeof response.amount === 'number' && response.amount !== null) {
          setDetectedAmount(response.amount);
      } else {
          console.warn('Backend AI Analysis returned no amount. Attempting Client-Side OCR Fallback...');
          
          try {
            // Initialize Tesseract worker (English + Arabic)
            const worker = await createWorker('eng+ara');
            const ret = await worker.recognize(imageUrl);
            await worker.terminate();
            
            const text = ret.data.text;
            console.log('Local OCR Text:', text);
            
            // Regex to find amounts:
            // 1. Matches "5,000.00" or "500.00"
            // 2. Matches "500.00-" (Trailing minus)
            // 3. Matches "SAR 500.00"
            const amountRegex = /([0-9,]+\.[0-9]{2})(-?)/g;// Finds X.XX optionally followed by -
            
            const matches = [...text.matchAll(amountRegex)];
            let bestAmount: number | null = null;
            
            for (const match of matches) {
                const rawVal = match[1].replace(/,/g, '');
                // match[2] is trailing minus sign
                const val = parseFloat(rawVal);
                
                // If trailing minus, we usually treat it as the "Amount" of transfer (Positive)
                // Filter out obviously wrong numbers (like dates or small decimals if irrelevant)
                if (!isNaN(val) && val > 0) {
                     // Heuristic: If we see keywords "Amount", "Total", "المبلغ" nearby? 
                     // For now, take the largest valid amount found that looks like a transaction
                     if (bestAmount === null || val > bestAmount) {
                         bestAmount = val;
                     }
                }
            }
            
            if (bestAmount !== null) {
                console.log('Local OCR Detected Amount:', bestAmount);
                setDetectedAmount(bestAmount);
            } else {
                setAnalysisError(t('dashboard.orders.aiAnalysisFailed', 'Could not detect amount. Please enter manually.'));
            }
            
          } catch (ocrError) {
             console.error('Local OCR Failed:', ocrError);
             setAnalysisError(t('dashboard.orders.aiAnalysisFailed', 'Analysis failed. Please enter manually.'));
          }
      }

    } catch (e: unknown) {
      console.error('AI Analysis Error:', e);
      setAnalysisError('Analysis failed');
    } finally {
      setAnalyzingImage(false);
    }
  }, [t]);

  useEffect(() => {
    if (isPreviewOpen && previewRequest?.proofImage) {
        analyzeImage(previewRequest.proofImage);
    }
  }, [isPreviewOpen, previewRequest, analyzeImage]);

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
        status: filterStatus !== 'all' ? filterStatus : undefined,
        search: searchQuery || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined
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
  }, [toast, t, currentPage, itemsPerPage, filterStatus, searchQuery, startDate, endDate]);

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
    } catch (error: unknown) {
      const err = error as { status?: number; message?: string };
      // Check if it's a session expiration error
      if (err?.status === 401 || err?.message?.includes('sessionExpired') || err?.message?.includes('Unauthorized')) {
        toast({
          title: t('common.sessionExpired') || 'انتهت الجلسة',
          description: t('common.sessionExpiredDesc') || 'انتهت صلاحية جلسة العمل. يرجى تحديث الصفحة (F5) أو تسجيل الدخول مرة أخرى.',
          variant: 'destructive',
        });
        // Auto-refresh after 3 seconds to help user recover
        setTimeout(() => {
          window.location.reload();
        }, 3000);
      } else {
      toast({
        title: t('dashboard.orders.updateStatusError'),
          description: err?.message || 'حدث خطأ أثناء تحديث حالة الطلب',
        variant: 'destructive',
      });
      }
    }
  };

  // Approve order
  const handleApproveOrder = async (orderId: string) => {
    try {
      setProcessingOrder(orderId);
      await coreApi.updateOrderStatus(orderId, 'APPROVED');
      toast({
        title: t('dashboard.orders.approveSuccess') || 'Order approved successfully',
      });
      loadOrders();
    } catch (error: unknown) {
      const err = error as { status?: number; message?: string };
      console.error('Failed to approve order:', error);
      toast({
        title: t('dashboard.orders.approveError') || 'Failed to approve order',
        description: err?.message,
        variant: 'destructive',
      });
    } finally {
      setProcessingOrder(null);
    }
  };

  // Reject order
  const handleRejectOrder = async () => {
    if (!selectedOrderForReject || !orderRejectReason.trim()) {
      toast({
        title: t('dashboard.orders.error') || 'Error',
        description: t('dashboard.orders.enterRejectReasonOrder') || 'Please enter a rejection reason',
        variant: 'destructive',
      });
      return;
    }

    try {
      setProcessingOrder(selectedOrderForReject.id);
      await orderService.rejectOrder(selectedOrderForReject.id, orderRejectReason);
      
      toast({
        title: t('dashboard.orders.rejectSuccess') || 'Order rejected successfully',
      });
      
      setShowOrderRejectDialog(false);
      setOrderRejectReason('');
      setSelectedOrderForReject(null);
      loadOrders();
    } catch (error: unknown) {
      const err = error as { status?: number; message?: string };
      console.error('Failed to reject order:', error);
      toast({
        title: t('dashboard.orders.rejectError') || 'Failed to reject order',
        description: err?.message,
        variant: 'destructive',
      });
    } finally {
      setProcessingOrder(null);
    }

  };

  // Refund order
  // Refund order
  const handleRefundOrder = async () => {
    if (!selectedOrderForRefund) return;

    try {
      setProcessingOrder(selectedOrderForRefund.id);
      await orderService.refundOrder(selectedOrderForRefund.id, refundReason);
      
      // Force update status
      try {
        await orderService.updateOrderStatus(selectedOrderForRefund.id, 'REFUNDED');
      } catch (e) {
        console.warn('Failed to force status update to REFUNDED', e);
      }

      toast({
        title: t('dashboard.orders.refundSuccess') || 'Order refunded successfully',
      });
      
      setShowRefundDialog(false);
      setRefundReason('');
      setSelectedOrderForRefund(null);
      loadOrders();
    } catch (error: unknown) {
      const err = error as { status?: number; message?: string };
      console.error('Failed to refund order:', error);
      toast({
        title: t('dashboard.orders.refundError') || 'Failed to refund order',
        description: err?.message,
        variant: 'destructive',
      });
    } finally {
      setProcessingOrder(null);
    }
  };

  const currentOrders = orders;

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

  // Export orders to Excel
  const handleExport = async () => {
    try {
      // Fetch all orders for export (use a high limit or fetch all pages)
      const allOrders: Order[] = [];
      let page = 1;
      let hasMore = true;
      
      while (hasMore) {
        const response = await coreApi.getOrders({ 
          page, 
          limit: 100,
          status: filterStatus !== 'all' ? filterStatus : undefined,
          search: searchQuery || undefined
        });
        
        let ordersData: Order[] = [];
        if (response && typeof response === 'object' && 'data' in response && 'meta' in response) {
          const paginatedResponse = response as { data: Order[]; meta: { total: number; totalPages: number } };
          ordersData = paginatedResponse.data.map(mapOrderData);
          hasMore = page < paginatedResponse.meta.totalPages;
        } else {
          const responseObj = response as { orders?: Order[]; items?: Order[] };
          ordersData = Array.isArray(response) 
            ? response.map(mapOrderData)
            : ((responseObj?.orders || responseObj?.items || []).map(mapOrderData));
          hasMore = false;
        }
        
        allOrders.push(...ordersData);
        if (ordersData.length < 100) {
          hasMore = false;
        } else {
          page++;
        }
      }

      // Prepare export data
      const exportData = allOrders.map((order, index) => ({
        '#': index + 1,
        [t('dashboard.orders.orderNumber')]: order.orderNumber || order.id?.slice(0, 8) || '',
        [t('dashboard.orders.customer')]: order.customer?.name || order.customerName || '',
        [t('dashboard.orders.email')]: order.customer?.email || order.customerEmail || '',
        [t('dashboard.orders.phone')]: order.customer?.phone || order.customerPhone || '',
        [t('dashboard.orders.status')]: order.status || '',
        [t('dashboard.orders.total')]: order.total || 0,
        [t('dashboard.orders.date')]: order.createdAt ? new Date(order.createdAt).toLocaleDateString() : '',
        [t('dashboard.orders.items')]: order.items?.length || 0,
      }));

      const ws = utils.json_to_sheet(exportData);
      const wb = utils.book_new();
      utils.book_append_sheet(wb, ws, 'Orders');
      writeFile(wb, `orders_export_${new Date().toISOString().split('T')[0]}.xlsx`);
      
      toast({
        title: t('common.success'),
        description: t('dashboard.orders.exportSuccess') || 'Orders exported successfully',
      });
    } catch (error) {
      console.error('Failed to export orders:', error);
      toast({
        title: t('common.error'),
        description: t('dashboard.orders.exportError') || 'Failed to export orders',
        variant: 'destructive',
      });
    }
  };

  // Import orders from Excel (placeholder - may not be needed for orders)
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      toast({
        title: t('common.info'),
        description: t('dashboard.orders.importNotSupported') || 'Order import is not currently supported',
      });
    } catch (error) {
      console.error('Failed to import orders:', error);
      toast({
        title: t('common.error'),
        description: t('dashboard.orders.importError') || 'Failed to import orders',
        variant: 'destructive',
      });
    } finally {
      // Reset file input
      e.target.value = '';
    }
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
      
      // Filter requests
      const pendingRequests = requests.filter((req: TopUpRequest) => req.status === 'PENDING');
      const historyRequests = requests.filter((req: TopUpRequest) => req.status !== 'PENDING');
      
      setTopUpRequests(pendingRequests);
      setTopUpHistory(historyRequests);
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

  // Approve top-up request - Phase 1: Show confirmation
  const handleApproveTopUp = (requestId: string) => {
    const request = topUpRequests.find(req => req.id === requestId) || (previewRequest && previewRequest.id === requestId ? previewRequest : null);
    if (!request) return;
    
    setSelectedTopUpForApproval(request);
    setShowApproveConfirmDialog(true);
  };

  // Approve top-up request - Phase 2: Execute approval
  const confirmApproveTopUp = async () => {
    if (!selectedTopUpForApproval) return;
    
    try {
      setProcessingTopUp(selectedTopUpForApproval.id);
      await coreApi.post(`/wallet/admin/topup/${selectedTopUpForApproval.id}/approve`, {}, { requireAuth: true });
      
      toast({
        title: t('dashboard.orders.approveSuccess'),
      });
      
      loadTopUpRequests();
      loadOrders(); // Refresh orders in case balance affects anything
      setShowApproveConfirmDialog(false);
      setSelectedTopUpForApproval(null);
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

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline" | "success" | "warning"> = {
      PENDING: 'warning',
      PROCESSING: 'secondary',
      SHIPPED: 'default',
      DELIVERED: 'success',
      APPROVED: 'success',
      REJECTED: 'destructive',
      CANCELLED: 'destructive',
      REFUNDED: 'outline',
    };
    
    // Map status to badge variant, default to 'outline' if not found
    const variant = variants[status] || 'outline';
    
    let className = "";
    if (status === 'PENDING') className = "bg-yellow-100 text-yellow-800 hover:bg-yellow-100";
    if (status === 'DELIVERED' || status === 'APPROVED') className = "bg-green-100 text-green-800 hover:bg-green-100";
    if (status === 'REJECTED' || status === 'CANCELLED') className = "bg-red-100 text-red-800 hover:bg-red-100";
    if (status === 'REFUNDED') className = "bg-orange-100 text-orange-800 hover:bg-orange-100";

    return (
      <Badge variant={variant === 'success' || variant === 'warning' ? 'outline' : variant} className={className}>
        {t(`dashboard.orders.${status.toLowerCase()}`, status)}
      </Badge>
    );
  };

  const getPaymentStatusBadge = (status?: string) => {
    if (!status) return null;
    
    const isPaid = status === 'PAID';
    const isFailed = status === 'FAILED' || status === 'REFUNDED';
    
    let className = "bg-gray-100 text-gray-800";
    if (isPaid) className = "bg-green-100 text-green-800 hover:bg-green-100";
    if (isFailed) className = "bg-red-100 text-red-800 hover:bg-red-100";
    if (status === 'PENDING') className = "bg-yellow-100 text-yellow-800 hover:bg-yellow-100";

    return (
      <Badge variant="outline" className={className}>
        {t(`dashboard.orders.payment.${status.toLowerCase()}`, status)}
      </Badge>
    );
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
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${formatNumber(item.quantity)}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${formatCurrency(item.price || 0)}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${formatCurrency((item.price || 0) * (item.quantity || 1))}</td>
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
              <span>${formatCurrency(subtotal)}</span>
            </div>
            ${taxAmount > 0 ? `
            <div class="total-row">
              <span>${t('dashboard.orders.invoice.vat')}:</span>
              <span>${formatCurrency(taxAmount)}</span>
            </div>
            ` : ''}
            ${shipping > 0 ? `
            <div class="total-row">
              <span>${t('dashboard.orders.invoice.shipping')}:</span>
              <span>${formatCurrency(shipping)}</span>
            </div>
            ` : ''}
            ${discount > 0 ? `
            <div class="total-row">
              <span>${t('dashboard.orders.invoice.discount')}:</span>
              <span>-${formatCurrency(discount)}</span>
            </div>
            ` : ''}
            <div class="total-row grand-total">
              <span>${t('dashboard.orders.invoice.grandTotal')}:</span>
              <span>${formatCurrency(total)}</span>
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
    <div className="space-y-6 w-full" style={{ maxWidth: '100%', overflowX: 'hidden' }}>
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
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
            <Card className="border-s-4 border-s-blue-500 min-w-0">
              <CardContent className="p-4 md:pt-6">
                <div className="text-center">
                  <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 truncate">{t('dashboard.orders.totalOrders')}</p>
                  <p className="text-2xl md:text-3xl font-bold mt-1 md:mt-2">{formatNumber(stats.total)}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-s-4 border-s-yellow-500 min-w-0">
              <CardContent className="p-4 md:pt-6">
                <div className="text-center">
                  <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 truncate">{t('dashboard.orders.pending')}</p>
                  <p className="text-2xl md:text-3xl font-bold mt-1 md:mt-2">{formatNumber(stats.pending)}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-s-4 border-s-blue-600 min-w-0">
              <CardContent className="p-4 md:pt-6">
                <div className="text-center">
                  <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 truncate">{t('dashboard.orders.processing')}</p>
                  <p className="text-2xl md:text-3xl font-bold mt-1 md:mt-2">{formatNumber(stats.processing)}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-s-4 border-s-purple-500 min-w-0">
              <CardContent className="p-4 md:pt-6">
                <div className="text-center">
                  <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 truncate">{t('dashboard.orders.shipped')}</p>
                  <p className="text-2xl md:text-3xl font-bold mt-1 md:mt-2">{formatNumber(stats.shipped)}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-s-4 border-s-green-500 min-w-0 col-span-2 sm:col-span-1">
              <CardContent className="p-4 md:pt-6">
                <div className="text-center">
                  <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 truncate">{t('dashboard.orders.delivered')}</p>
                  <p className="text-2xl md:text-3xl font-bold mt-1 md:mt-2">{formatNumber(stats.delivered)}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters and Table */}
          <Card className="overflow-hidden">
            <CardHeader className="border-b p-4 md:p-6">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1 relative">
                    <Search className="absolute end-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder={t('dashboard.orders.searchPlaceholder')}
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="pe-10"
                    />
                  </div>
                  <Select value={filterStatus} onValueChange={(val) => {
                    setFilterStatus(val);
                    setCurrentPage(1);
                  }}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <Filter className="h-4 w-4 me-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('dashboard.orders.allStatuses')}</SelectItem>
                      <SelectItem value="PENDING">{t('dashboard.orders.pending')}</SelectItem>
                      <SelectItem value="PROCESSING">{t('dashboard.orders.processing')}</SelectItem>
                      <SelectItem value="SHIPPED">{t('dashboard.orders.shipped')}</SelectItem>
                      <SelectItem value="DELIVERED">{t('dashboard.orders.delivered')}</SelectItem>
                      <SelectItem value="APPROVED">{t('dashboard.orders.approved')}</SelectItem>
                      <SelectItem value="REJECTED">{t('dashboard.orders.rejected')}</SelectItem>
                      <SelectItem value="CANCELLED">{t('dashboard.orders.cancelled')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full sm:w-auto"
                  />
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => {
                      setEndDate(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full sm:w-auto"
                  />
                </div>
                <div className="flex flex-wrap gap-2 justify-end">
                  <Button variant="outline" className="gap-2" onClick={handleExport} size="sm">
                    <Download className="h-4 w-4" />
                    <span className="hidden sm:inline">{t('dashboard.orders.export')}</span>
                  </Button>
                  <div className="relative">
                    <Input
                      type="file"
                      accept=".xlsx, .xls"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      onChange={handleImport}
                    />
                    <Button variant="outline" className="gap-2" size="sm">
                      <Upload className="h-4 w-4" />
                      <span className="hidden sm:inline">{t('dashboard.orders.import')}</span>
                    </Button>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-12 px-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
                </div>
              ) : currentOrders.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <Package className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-xl font-semibold mb-2">{t('dashboard.orders.noOrders')}</h3>
                  <p className="text-gray-500">{t('dashboard.orders.noMatchingOrders')}</p>
                </div>
              ) : (
                <>
                <div className="w-full" dir={isRTL ? 'rtl' : 'ltr'}>
                  <Table className="w-full" style={{ minWidth: '900px', tableLayout: 'auto' }}>
                    <TableHeader>
                      <TableRow>
                          <TableHead className={`font-semibold min-w-[140px] max-w-[180px] whitespace-nowrap sticky ${isRTL ? 'right-0' : 'left-0'} bg-background z-20 ${isRTL ? 'border-l' : 'border-r'} shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)] text-start`}>{t('dashboard.orders.orderNumber')}</TableHead>
                          <TableHead className={`font-semibold min-w-[180px] max-w-[250px] text-start`}>{t('dashboard.orders.customer')}</TableHead>
                          <TableHead className={`font-semibold min-w-[100px] max-w-[140px] whitespace-nowrap text-start`}>{t('dashboard.orders.products')}</TableHead>
                          <TableHead className={`font-semibold min-w-[100px] max-w-[140px] whitespace-nowrap text-start`}>{t('dashboard.orders.amount')}</TableHead>
                          <TableHead className={`font-semibold min-w-[120px] max-w-[160px] whitespace-nowrap text-start`}>{t('dashboard.orders.status')}</TableHead>
                          <TableHead className={`font-semibold min-w-[120px] max-w-[160px] whitespace-nowrap text-start`}>{t('dashboard.orders.paymentStatus')}</TableHead>
                          <TableHead className={`font-semibold min-w-[100px] max-w-[140px] whitespace-nowrap text-start`}>{t('dashboard.orders.date')}</TableHead>
                          <TableHead className={`font-semibold text-center min-w-[80px] max-w-[120px] whitespace-nowrap sticky ${isRTL ? 'left-0' : 'right-0'} bg-background z-20 ${isRTL ? 'border-r' : 'border-l'} shadow-[-2px_0_4px_-2px_rgba(0,0,0,0.1)]`}>{t('dashboard.orders.actions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentOrders.map((order, index) => (
                        <TableRow key={order.id || `order-${index}`} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                          <TableCell className={`font-mono font-semibold sticky ${isRTL ? 'right-0' : 'left-0'} bg-background z-10 ${isRTL ? 'border-l' : 'border-r'} shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)] text-start`}>
                            #{order.orderNumber || order.id?.slice(0, 8) || 'N/A'}
                          </TableCell>
                          <TableCell className="text-start">
                            <div className="min-w-0 text-start">
                              <p className="font-medium break-words">{order.customer?.name || t('dashboard.orders.customer')}</p>
                              <p className="text-sm text-gray-500 break-words">{order.customer?.email}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-start">
                            <div className={`flex ${isRTL ? 'justify-end' : 'justify-start'}`}>
                            <Badge variant="secondary">
                              {formatNumber(order.items?.length || 0)} {t('dashboard.orders.products')}
                            </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="font-semibold text-start">
                            {formatCurrency(order.total || 0)}
                          </TableCell>
                          <TableCell className="text-start">
                            <Select
                              value={order.status}
                              onValueChange={(value) => handleUpdateStatus(order.id, value)}
                            >
                              <SelectTrigger className="w-[140px] md:w-[160px] border-0 shadow-none bg-transparent h-auto p-0 focus:ring-0">
                                {getStatusBadge(order.status)}
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="PENDING">{t('dashboard.orders.pending')}</SelectItem>
                                <SelectItem value="PROCESSING">{t('dashboard.orders.processing')}</SelectItem>
                                <SelectItem value="SHIPPED">{t('dashboard.orders.shipped')}</SelectItem>
                                <SelectItem value="DELIVERED">{t('dashboard.orders.delivered')}</SelectItem>
                                <SelectItem value="APPROVED">{t('dashboard.orders.approved')}</SelectItem>
                                <SelectItem value="REJECTED">{t('dashboard.orders.rejected')}</SelectItem>
                                <SelectItem value="CANCELLED">{t('dashboard.orders.cancelled')}</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="text-start">{getPaymentStatusBadge(order.paymentStatus)}</TableCell>
                          <TableCell className={`text-sm text-gray-500 text-start`}>
                            {new Date(order.createdAt).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </TableCell>
                          <TableCell className={`sticky ${isRTL ? 'left-0' : 'right-0'} bg-background z-10 ${isRTL ? 'border-r' : 'border-l'} shadow-[-2px_0_4px_-2px_rgba(0,0,0,0.1)]`}>
                            <div className="flex items-center justify-center gap-2">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => openOrderDetails(order)}
                                title={t('dashboard.orders.viewDetails') || 'عرض التفاصيل'}
                                aria-label={t('dashboard.orders.viewDetails') || 'عرض التفاصيل'}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {order.status !== 'REFUNDED' && order.paymentStatus !== 'REFUNDED' && (
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  onClick={() => {
                                    setSelectedOrderForRefund(order);
                                    setShowRefundDialog(true);
                                  }}
                                  title={t('dashboard.orders.refundOrder')}
                                  className="text-orange-500 hover:text-orange-600 hover:bg-orange-50 dark:text-orange-400 dark:hover:bg-orange-950/50"
                                >
                                  <RotateCcw className="h-4 w-4" />
                                </Button>
                              )}
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => handlePrintInvoice(order)}
                                title={t('dashboard.orders.printInvoice') || 'طباعة الفاتورة'}
                                aria-label={t('dashboard.orders.printInvoice') || 'طباعة الفاتورة'}
                              >
                                <Printer className="h-4 w-4" />
                              </Button>
                              {!['APPROVED', 'DELIVERED', 'COMPLETED', 'REJECTED', 'CANCELLED', 'REFUNDED'].includes(order.status) && order.paymentStatus !== 'REFUNDED' && (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-green-600 dark:text-green-500 border-green-200 dark:border-green-800 hover:text-green-700 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-950"
                                    onClick={() => handleApproveOrder(order.id)}
                                    disabled={processingOrder === order.id}
                                    title={t('dashboard.orders.approve') || 'موافقة'}
                                  >
                                    {processingOrder === order.id ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <Check className="h-4 w-4 me-1" />
                                    )}
                                    {t('dashboard.orders.approve') || 'موافقة'}
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-red-600 dark:text-red-500 border-red-200 dark:border-red-800 hover:text-red-700 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950"
                                    onClick={() => {
                                      setSelectedOrderForReject(order);
                                      setShowOrderRejectDialog(true);
                                    }}
                                    disabled={processingOrder === order.id}
                                    title={t('dashboard.orders.reject') || 'رفض'}
                                  >
                                    <X className="h-4 w-4 me-1" />
                                    {t('dashboard.orders.reject') || 'رفض'}
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

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
                              title={t('common.previous') || 'السابق'}
                              aria-label={t('common.previous') || 'السابق'}
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
                                {formatNumber(page)}
                              </PaginationLink>
                            </PaginationItem>
                          ))}

                          <PaginationItem>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                              disabled={currentPage === totalPages}
                              title={t('common.next') || 'التالي'}
                              aria-label={t('common.next') || 'التالي'}
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
                    {formatNumber(topUpRequests.length)} {t('dashboard.orders.pending')}
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
                <div className="w-full" dir={isRTL ? 'rtl' : 'ltr'}>
                  <Table className="w-full" style={{ minWidth: '700px', tableLayout: 'auto' }}>
                  <TableHeader>
                    <TableRow>
                        <TableHead className={`font-semibold min-w-[200px] sticky ${isRTL ? 'right-0' : 'left-0'} bg-background z-20 ${isRTL ? 'border-l' : 'border-r'} shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)] ${isRTL ? 'text-right' : 'text-left'}`}>{t('dashboard.orders.user')}</TableHead>
                      <TableHead className={`font-semibold w-32 whitespace-nowrap ${isRTL ? 'text-right' : 'text-left'}`}>{t('dashboard.orders.amount')}</TableHead>
                      <TableHead className={`font-semibold min-w-[200px] ${isRTL ? 'text-right' : 'text-left'}`}>{t('dashboard.orders.bank')}</TableHead>
                      <TableHead className={`font-semibold w-32 whitespace-nowrap ${isRTL ? 'text-right' : 'text-left'}`}>{t('dashboard.orders.receiptImage')}</TableHead>
                      <TableHead className={`font-semibold w-32 whitespace-nowrap ${isRTL ? 'text-right' : 'text-left'}`}>{t('dashboard.orders.requestDate')}</TableHead>
                       <TableHead className={`font-semibold text-center w-32 whitespace-nowrap sticky ${isRTL ? 'left-0' : 'right-0'} bg-background z-20 ${isRTL ? 'border-r' : 'border-l'} shadow-[-2px_0_4px_-2px_rgba(0,0,0,0.1)]`}>{t('dashboard.orders.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topUpRequests.map((request) => (
                      <TableRow key={request.id}>
                         <TableCell className={`sticky ${isRTL ? 'right-0' : 'left-0'} bg-background z-10 ${isRTL ? 'border-l' : 'border-r'} shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)] ${isRTL ? 'text-right' : 'text-left'}`}>
                          <div className={`min-w-0 ${isRTL ? 'text-right' : 'text-left'}`}>
                            <p className="font-medium break-words">{request.user.name || request.user.email}</p>
                            <p className="text-sm text-gray-500 break-words">{request.user.email}</p>
                          </div>
                        </TableCell>
                        <TableCell className={isRTL ? 'text-right' : 'text-left'}>
                          <span className="font-semibold text-green-600">
                            {formatCurrency(request.amount, request.currency || 'SAR')}
                          </span>
                        </TableCell>
                        <TableCell className={isRTL ? 'text-right' : 'text-left'}>
                          {request.bank ? (
                            <div className="min-w-0">
                              <p className="font-medium break-words">{request.bank.nameAr || request.bank.name}</p>
                              <p className="text-xs text-gray-500 break-words">{t('dashboard.orders.accountNumber')}: {request.bank.accountNumber}</p>
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell className={isRTL ? 'text-right' : 'text-left'}>
                          {request.proofImage ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(request.proofImage, '_blank')}
                              className="gap-2"
                              title={t('dashboard.orders.viewProof') || 'عرض إثبات الدفع'}
                              aria-label={t('dashboard.orders.viewProof') || 'عرض إثبات الدفع'}
                            >
                              <Eye className="h-4 w-4" />
                              {t('dashboard.orders.view') || 'عرض'}
                            </Button>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell className={`text-sm text-gray-500 ${isRTL ? 'text-right' : 'text-left'}`}>
                          {new Date(request.createdAt).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </TableCell>
                         <TableCell className={`sticky ${isRTL ? 'left-0' : 'right-0'} bg-background z-10 ${isRTL ? 'border-r' : 'border-l'} shadow-[-2px_0_4px_-2px_rgba(0,0,0,0.1)]`}>
                          <div className="flex items-center justify-center gap-2">
                            {request.status === 'PENDING' && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-green-600 dark:text-green-500 border-green-200 dark:border-green-800 hover:text-green-700 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-950"
                                  onClick={() => handleApproveTopUp(request.id)}
                                  disabled={processingTopUp === request.id}
                                  title={t('dashboard.orders.approve') || 'موافقة'}
                                >
                                  {processingTopUp === request.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Check className="h-4 w-4 me-1" />
                                  )}
                                  {t('dashboard.orders.approve') || 'موافقة'}
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-red-600 dark:text-red-500 border-red-200 dark:border-red-800 hover:text-red-700 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950"
                                  onClick={() => {
                                    setSelectedTopUp(request);
                                    setShowRejectDialog(true);
                                  }}
                                  disabled={processingTopUp === request.id}
                                  title={t('dashboard.orders.reject') || 'رفض'}
                                >
                                  <X className="h-4 w-4 me-1" />
                                  {t('dashboard.orders.reject') || 'رفض'}
                                </Button>
                              </>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setPreviewRequest(request);
                                setIsPreviewOpen(true);
                              }}
                              title={t('dashboard.orders.viewDetails') || 'عرض التفاصيل'}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* History Section */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                {t('dashboard.orders.topupHistory', 'Top-up History')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingTopUps ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
                </div>
              ) : topUpHistory.length === 0 ? (
                <div className="text-center py-12">
                  <Clock className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-xl font-semibold mb-2">{t('dashboard.orders.noHistory', 'No history found')}</h3>
                  <p className="text-gray-500">{t('dashboard.orders.noHistoryDesc', 'Processed top-up requests will appear here')}</p>
                </div>
              ) : (
                <div className="w-full" dir={isRTL ? 'rtl' : 'ltr'}>
                  <Table className="w-full" style={{ minWidth: '700px', tableLayout: 'auto' }}>
                  <TableHeader>
                    <TableRow>
                      <TableHead className={`font-semibold min-w-[200px] sticky ${isRTL ? 'right-0' : 'left-0'} bg-background z-20 ${isRTL ? 'border-l' : 'border-r'} shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)] ${isRTL ? 'text-right' : 'text-left'}`}>{t('dashboard.orders.user', 'User')}</TableHead>
                      <TableHead className={`font-semibold w-32 whitespace-nowrap ${isRTL ? 'text-right' : 'text-left'}`}>{t('dashboard.orders.amount', 'Amount')}</TableHead>
                      <TableHead className={`font-semibold min-w-[150px] ${isRTL ? 'text-right' : 'text-left'}`}>{t('dashboard.orders.processedBy', 'المنفذ')}</TableHead>
                      <TableHead className={`font-semibold min-w-[120px] ${isRTL ? 'text-right' : 'text-left'}`}>{t('dashboard.orders.status')}</TableHead>
                      <TableHead className={`font-semibold w-32 whitespace-nowrap ${isRTL ? 'text-right' : 'text-left'}`}>{t('dashboard.orders.receiptImage')}</TableHead>
                      <TableHead className={`font-semibold w-32 whitespace-nowrap ${isRTL ? 'text-right' : 'text-left'}`}>{t('dashboard.orders.requestDate')}</TableHead>
                       <TableHead className={`font-semibold text-center w-32 whitespace-nowrap sticky ${isRTL ? 'left-0' : 'right-0'} bg-background z-20 ${isRTL ? 'border-r' : 'border-l'} shadow-[-2px_0_4px_-2px_rgba(0,0,0,0.1)]`}>{t('dashboard.orders.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topUpHistory
                      .slice((historyPage - 1) * historyItemsPerPage, historyPage * historyItemsPerPage)
                      .map((request) => (
                      <TableRow key={request.id}>
                         <TableCell className={`sticky ${isRTL ? 'right-0' : 'left-0'} bg-background z-10 ${isRTL ? 'border-l' : 'border-r'} shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)] ${isRTL ? 'text-right' : 'text-left'}`}>
                          <div className={`min-w-0 ${isRTL ? 'text-right' : 'text-left'}`}>
                            <p className="font-medium break-words">{request.user.name || request.user.email}</p>
                            <p className="text-sm text-gray-500 break-words">{request.user.email}</p>
                          </div>
                        </TableCell>
                        <TableCell className={isRTL ? 'text-right' : 'text-left'}>
                          <span className={`font-semibold ${request.status === 'REJECTED' ? 'text-red-600' : 'text-green-600'}`}>
                            {formatCurrency(request.amount, request.currency || 'SAR')}
                          </span>
                        </TableCell>
                        <TableCell className={isRTL ? 'text-right' : 'text-left'}>
                          {request.processedBy ? (
                            <div className="text-sm">
                              <p className="font-medium">{request.processedBy.name}</p>
                              <p className="text-xs text-gray-500">{request.processedBy.email}</p>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell className={isRTL ? 'text-right' : 'text-left'}>
                          {getStatusBadge(request.status)}
                        </TableCell>
                        <TableCell className={isRTL ? 'text-right' : 'text-left'}>
                          {request.proofImage ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(request.proofImage, '_blank')}
                              className="gap-2"
                              title={t('dashboard.orders.viewProof') || 'عرض إثبات الدفع'}
                              aria-label={t('dashboard.orders.viewProof') || 'عرض إثبات الدفع'}
                            >
                              <Eye className="h-4 w-4" />
                              {t('dashboard.orders.view') || 'عرض'}
                            </Button>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell className={`text-sm text-gray-500 ${isRTL ? 'text-right' : 'text-left'}`}>
                          {new Date(request.createdAt).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </TableCell>
                         <TableCell className={`sticky ${isRTL ? 'left-0' : 'right-0'} bg-background z-10 ${isRTL ? 'border-r' : 'border-l'} shadow-[-2px_0_4px_-2px_rgba(0,0,0,0.1)] text-center`}>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setPreviewRequest(request);
                                setIsPreviewOpen(true);
                              }}
                              title={t('dashboard.orders.viewDetails') || 'عرض التفاصيل'}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                {topUpHistory.length > historyItemsPerPage && (
                  <div className="mt-4 flex justify-center">
                    <Pagination>
                        <PaginationContent>
                          <PaginationItem>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => setHistoryPage(p => Math.max(1, p - 1))}
                              disabled={historyPage === 1}
                            >
                              {t('common.previous', 'Previous')}
                            </Button>
                          </PaginationItem>
                          <span className="mx-4 flex items-center text-sm text-gray-500">
                            {t('common.page', 'Page')} {historyPage} {t('common.of', 'of')} {Math.ceil(topUpHistory.length / historyItemsPerPage)}
                          </span>
                          <PaginationItem>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => setHistoryPage(p => Math.min(Math.ceil(topUpHistory.length / historyItemsPerPage), p + 1))}
                              disabled={historyPage >= Math.ceil(topUpHistory.length / historyItemsPerPage)}
                            >
                              {t('common.next', 'Next')}
                            </Button>
                          </PaginationItem>
                        </PaginationContent>
                    </Pagination>
                  </div>
                )}
                </div>
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
                        <TableHead className={`w-[40%] ${isRTL ? 'text-right' : 'text-left'}`}>{t('dashboard.orders.productName')}</TableHead>
                        <TableHead className="text-center">{t('dashboard.reports.quantity')}</TableHead>
                        <TableHead className={isRTL ? 'text-right' : 'text-left'}>{t('dashboard.products.price')}</TableHead>
                        <TableHead className={isRTL ? 'text-right' : 'text-left'}>{t('dashboard.reports.itemTotal')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedOrder.items?.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell className={isRTL ? 'text-right' : 'text-left'}>
                            <div className="font-medium">
                              {item.product?.nameAr || item.product?.name}
                            </div>
                            {item.variantName && (
                              <p className="text-xs text-gray-500 mt-0.5">
                                {t('dashboard.products.variant')}: {item.variantName}
                              </p>
                            )}
                          </TableCell>
                          <TableCell className="text-center font-mono">{formatNumber(item.quantity)}</TableCell>
                          <TableCell className={`font-mono ${isRTL ? 'text-right' : 'text-left'}`}>
                            {formatCurrency(item.price ?? 0)}
                          </TableCell>
                          <TableCell className={`font-mono font-semibold ${isRTL ? 'text-right' : 'text-left'}`}>
                            {formatCurrency(((item.price ?? 0) * (item.quantity ?? 0)))}
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
                      <span className="font-mono">{formatCurrency(selectedOrder.subtotal ?? 0)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">{t('dashboard.reports.tax')}</span>
                      <span className="font-mono">{formatCurrency(selectedOrder.tax ?? 0)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">{t('dashboard.orders.shipping')}</span>
                      <span className="font-mono">{formatCurrency(selectedOrder.shipping ?? 0)}</span>
                    </div>
                    {(selectedOrder.discount ?? 0) > 0 && (
                      <div className="flex justify-between text-sm text-red-600">
                        <span>{t('categories.offers.discountPercent')}</span>
                        <span className="font-mono">-{formatCurrency(selectedOrder.discount ?? 0)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-xl font-bold border-t pt-3 mt-3">
                      <span>{t('dashboard.reports.total')}</span>
                      <span className="text-primary font-mono">{formatCurrency(selectedOrder.total ?? 0)}</span>
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
                      {formatCurrency(previewRequest.amount, previewRequest.currency || 'SAR')}
                    </p>
                    <p className="text-sm text-gray-500">{t('dashboard.orders.requestAmount')}</p>
                  </div>
                </div>
              </div>

               <div className="mt-4 rounded-md bg-yellow-50 p-4 border border-yellow-200">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <Info className="h-5 w-5 text-yellow-400" aria-hidden="true" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800">{t('dashboard.orders.warning')}</h3>
                      <div className="mt-2 text-sm text-yellow-700">
                        <p>
                          {t('dashboard.orders.transferCheckWarning')}
                        </p>
                        <p className="mt-2 font-bold text-lg text-yellow-900">
                          {formatCurrency(previewRequest.amount, previewRequest.currency || 'SAR')}
                        </p>
                      </div>
                    </div>
                  </div>
               </div>

               {/* Analysis Result */}
               <div className={`mt-4 rounded-md p-4 border ${
                  detectedAmount && Math.abs(detectedAmount - previewRequest.amount) < 1.0 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-blue-50 border-blue-200'
                }`}>
                  <div className="flex">
                    <div className="flex-shrink-0">
                      {analyzingImage ? (
                        <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                      ) : detectedAmount && Math.abs(detectedAmount - previewRequest.amount) < 1.0 ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <Info className="h-5 w-5 text-blue-500" />
                      )}
                    </div>
                    <div className="ml-3 w-full">
                      <h3 className={`text-sm font-medium ${
                        detectedAmount && Math.abs(detectedAmount - previewRequest.amount) < 1.0 
                          ? 'text-green-800'
                          : 'text-blue-800'
                      }`}>
                        {analyzingImage ? t('dashboard.orders.analysis.analyzing') : t('dashboard.orders.analysis.result')}
                      </h3>
                      {!analyzingImage && (
                        <div className={`mt-2 text-sm ${
                           detectedAmount && Math.abs(detectedAmount - previewRequest.amount) < 1.0 
                             ? 'text-green-700'
                             : 'text-blue-700'
                        }`}>
                          <p className="mb-3 opacity-90">
                             {t('dashboard.orders.analysis.autoAnalysisInfo')}
                          </p>
                          <div className="flex flex-col gap-2 bg-white/50 p-3 rounded text-sm">
                             <div className="flex justify-between items-center">
                               <span>{t('dashboard.orders.requestAmount')}:</span>
                               <span className="font-bold text-lg">
                                 {formatCurrency(previewRequest.amount, previewRequest.currency || 'SAR')}
                               </span>
                             </div>
                             <div className="flex justify-between items-center border-t border-gray-200 pt-2">
                               <span>{t('dashboard.orders.analysis.receiptAmount')}:</span>
                               <span className={`font-bold text-lg ${
                                 detectedAmount && Math.abs(detectedAmount - previewRequest.amount) < 1.0
                                    ? 'text-green-600'
                                    : 'text-red-500' 
                               }`}>
                                 {detectedAmount 
                                   ? formatCurrency(detectedAmount, previewRequest.currency || 'SAR') 
                                   : t('dashboard.orders.analysis.notDetected') || 'Not detected'}
                               </span>
                             </div>
                          </div>
                          {detectedAmount && Math.abs(detectedAmount - previewRequest.amount) >= 1.0 && (
                            <p className="mt-2 text-red-600 font-medium flex items-center gap-1">
                              <AlertCircle className="h-4 w-4" />
                              {t('dashboard.orders.analysis.matchFailed')}
                            </p>
                          )}
                        </div>
                      )}
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

      {/* Reject Order Dialog */}
      <Dialog open={showOrderRejectDialog} onOpenChange={setShowOrderRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('dashboard.orders.rejectOrder') || 'رفض الطلب'}</DialogTitle>
            <DialogDescription>
              {t('dashboard.orders.enterRejectReasonOrder') || 'يرجى إدخال سبب رفض الطلب'} #{selectedOrderForReject?.orderNumber || selectedOrderForReject?.id}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="order-reject-reason" className="mb-2 block">
              {t('dashboard.orders.rejectReason') || 'سبب الرفض'}
            </Label>
            <Textarea
              id="order-reject-reason"
              placeholder={t('dashboard.orders.enterRejectReason') || 'أدخل سبب الرفض...'}
              value={orderRejectReason}
              onChange={(e) => setOrderRejectReason(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowOrderRejectDialog(false);
                setOrderRejectReason('');
                setSelectedOrderForReject(null);
              }}
            >
              {t('dashboard.orders.cancel') || 'إلغاء'}
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleRejectOrder}
              disabled={!orderRejectReason.trim() || processingOrder === selectedOrderForReject?.id}
            >
              {processingOrder === selectedOrderForReject?.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                t('dashboard.orders.reject') || 'رفض'
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

      {/* Approve Top-up Confirmation Dialog */}
      <Dialog open={showApproveConfirmDialog} onOpenChange={setShowApproveConfirmDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-warning font-semibold">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              {t('dashboard.orders.confirmApproval', 'Confirm Top-up Approval')}
            </DialogTitle>
            <DialogDescription>
              {t('dashboard.orders.confirmApprovalDesc', 'Please review the amount carefully before approving. This will add the amount to the user\'s wallet.')}
            </DialogDescription>
          </DialogHeader>
          <div className="py-6">
            <div className="flex flex-col items-center justify-center space-y-4 rounded-lg border bg-muted/30 p-6">
              <p className="text-sm font-medium text-muted-foreground">{t('dashboard.orders.amountToAdd', 'Amount to add')}</p>
              <div className="text-3xl font-bold text-primary">
                 {formatCurrency(selectedTopUpForApproval?.amount || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                {selectedTopUpForApproval?.user?.email}
              </p>
            </div>
            <div className="mt-4 rounded-md bg-yellow-50 p-4 border border-yellow-200">
               <div className="flex">
                  <div className="flex-shrink-0">
                    <Info className="h-5 w-5 text-yellow-400" aria-hidden="true" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">{t('dashboard.orders.warning', 'Attention')}</h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <p>
                        {t('dashboard.orders.transferCheckWarning', 'Please ensure you have received the exact amount in your bank account before approving.')}
                      </p>
                    </div>
                  </div>
               </div>
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowApproveConfirmDialog(false);
                setSelectedTopUpForApproval(null);
              }}
              className="sm:w-auto w-full"
            >
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button 
              onClick={confirmApproveTopUp}
              disabled={processingTopUp === selectedTopUpForApproval?.id}
              className="sm:w-auto w-full bg-green-600 hover:bg-green-700 text-white"
            >
              {processingTopUp === selectedTopUpForApproval?.id ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Check className="h-4 w-4 mr-2" />
              )}
              {t('dashboard.orders.confirmAndApprove', 'Confirm & Approve')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Refund Dialog */}
      <Dialog open={showRefundDialog} onOpenChange={setShowRefundDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('dashboard.orders.refundOrder')}</DialogTitle>
            <DialogDescription>
              {t('dashboard.orders.refundConfirmation')}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="refund-reason">{t('dashboard.orders.refundReason')}</Label>
            <Textarea
              id="refund-reason"
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
              placeholder={t('dashboard.orders.enterRefundReason')}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRefundDialog(false)}>
              {t('common.cancel')}
            </Button>
            <Button variant="destructive" onClick={handleRefundOrder} disabled={processingOrder === selectedOrderForRefund?.id}>
              {processingOrder === selectedOrderForRefund?.id ? (
                <Loader2 className="h-4 w-4 animate-spin me-2" />
              ) : null}
              {t('dashboard.orders.confirmRefund')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
