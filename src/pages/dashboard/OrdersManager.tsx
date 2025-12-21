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
  Loader2
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

interface Order {
  id: string;
  orderNumber: string;
  customer: {
    name: string;
    email: string;
    phone?: string;
  };
  items: Array<{
    product: {
      name: string;
      nameAr?: string;
    };
    quantity: number;
    price: number;
  }>;
  total: number;
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  status: string;
  paymentStatus: string;
  paymentMethod?: string;
  shippingAddress?: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  createdAt: string;
}

interface TopUpRequest {
  id: string;
  amount: number;
  currency: string;
  status: string;
  proofImage?: string;
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
  const { t } = useTranslation();
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
  const itemsPerPage = 10;

  // Top-up requests state
  const [topUpRequests, setTopUpRequests] = useState<TopUpRequest[]>([]);
  const [loadingTopUps, setLoadingTopUps] = useState(false);
  const [processingTopUp, setProcessingTopUp] = useState<string | null>(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [selectedTopUp, setSelectedTopUp] = useState<TopUpRequest | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      const response = await coreApi.getOrders() as any;
      setOrders(Array.isArray(response) ? response : (response?.orders || []));
    } catch (error) {
      console.error('Failed to load orders:', error);
      toast({
        title: t('dashboard.orders.loadOrdersError'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast, t]);

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
    const statusMap: Record<string, { label: string; className: string; icon: any }> = {
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

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.orderNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer?.email?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const currentOrders = filteredOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

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

  // Load top-up requests
  const loadTopUpRequests = useCallback(async () => {
    try {
      setLoadingTopUps(true);
      const response = await coreApi.get('/merchant/wallet/admin/topups', { requireAuth: true }) as any;
      setTopUpRequests(Array.isArray(response) ? response : (response?.requests || []));
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
      await coreApi.post(`/merchant/wallet/admin/topup/${requestId}/approve`, {}, { requireAuth: true });
      
      toast({
        title: t('dashboard.orders.approveSuccess'),
      });
      
      loadTopUpRequests();
      loadOrders(); // Refresh orders in case balance affects anything
    } catch (error: any) {
      console.error('Failed to approve top-up:', error);
      toast({
        title: t('dashboard.orders.approveError'),
        description: error?.message,
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
        `/merchant/wallet/admin/topup/${selectedTopUp.id}/reject`,
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
    } catch (error: any) {
      console.error('Failed to reject top-up:', error);
      toast({
        title: t('dashboard.orders.rejectError'),
        description: error?.message,
        variant: 'destructive',
      });
    } finally {
      setProcessingTopUp(null);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString(undefined, {
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
                      {currentOrders.map((order) => (
                        <TableRow key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                          <TableCell className="font-mono font-semibold">
                            #{order.orderNumber || order.id.slice(0, 8)}
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
                              variant="outline"
                              className="text-green-600 hover:text-green-700 hover:bg-green-50"
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
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => {
                                setSelectedTopUp(request);
                                setShowRejectDialog(true);
                              }}
                              disabled={processingTopUp === request.id}
                            >
                              <X className="h-4 w-4 ml-1" />
                              {t('dashboard.orders.reject')}
                            </Button>
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
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <Package className="h-6 w-6 text-primary" />
              {t('dashboard.orders.viewDetails')} #{selectedOrder?.orderNumber}
            </DialogTitle>
            <DialogDescription>
              {selectedOrder && formatDate(selectedOrder.createdAt)}
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold border-b pb-2">{t('dashboard.orders.status')}</h3>
                  <div className="flex flex-wrap gap-3">
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500">{t('dashboard.orders.status')}</p>
                      {getStatusBadge(selectedOrder.status)}
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500">{t('dashboard.orders.paymentStatus')}</p>
                      {getPaymentStatusBadge(selectedOrder.paymentStatus)}
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="font-semibold border-b pb-2">{t('dashboard.orders.customer')}</h3>
                  <div className="space-y-1">
                    <p className="font-medium">{selectedOrder.customer?.name}</p>
                    <p className="text-sm text-gray-500">{selectedOrder.customer?.email}</p>
                    {selectedOrder.customer?.phone && (
                      <p className="text-sm text-gray-500">{selectedOrder.customer.phone}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold border-b pb-2">{t('dashboard.orders.products')}</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('dashboard.orders.products')}</TableHead>
                      <TableHead className="text-center">{t('dashboard.reports.quantity')}</TableHead>
                      <TableHead className="text-left">{t('dashboard.products.price')}</TableHead>
                      <TableHead className="text-left">{t('dashboard.reports.itemTotal')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedOrder.items?.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">
                          {item.product?.nameAr || item.product?.name}
                        </TableCell>
                        <TableCell className="text-center">{item.quantity}</TableCell>
                        <TableCell className="text-left">{item.price.toFixed(2)} {t('common.currency')}</TableCell>
                        <TableCell className="text-left">
                          {(item.price * item.quantity).toFixed(2)} {t('common.currency')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex justify-end">
                <div className="w-full max-w-xs space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">{t('dashboard.reports.subtotal')}:</span>
                    <span>{selectedOrder.subtotal.toFixed(2)} {t('common.currency')}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">{t('dashboard.reports.tax')}:</span>
                    <span>{selectedOrder.tax.toFixed(2)} {t('common.currency')}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">{t('dashboard.orders.shipped')}:</span>
                    <span>{selectedOrder.shipping.toFixed(2)} {t('common.currency')}</span>
                  </div>
                  {selectedOrder.discount > 0 && (
                    <div className="flex justify-between text-sm text-red-600">
                      <span>{t('categories.offers.discountPercent')}:</span>
                      <span>-{selectedOrder.discount.toFixed(2)} {t('common.currency')}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>{t('dashboard.reports.total')}:</span>
                    <span className="text-primary">{selectedOrder.total.toFixed(2)} {t('common.currency')}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="border-t pt-4">
            <Button variant="outline" onClick={() => setIsDetailsOpen(false)}>
              {t('common.close')}
            </Button>
            <Button className="gap-2">
              <Printer className="h-4 w-4" />
              {t('dashboard.orders.print')}
            </Button>
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
    </div>
  );
}
