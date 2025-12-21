import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { coreApi, reportService } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, Search, TrendingUp, DollarSign, Receipt, Calendar } from 'lucide-react';
import { writeFile, utils } from 'xlsx';
import { formatCurrency } from '@/lib/currency-utils';

interface ProductReportItem {
  id: string;
  name: string;
  sku: string | null;
  stock: number;
  salesCount: number;
  revenue: number;
}

interface Order {
  id: string;
  orderNumber: string;
  customerName?: string;
  customerEmail: string;
  totalAmount: number;
  taxAmount: number;
  subtotal: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
  items?: Array<{
    product: { name: string; nameAr?: string };
    quantity: number;
    price: number;
  }>;
}

interface Brand {
  id: string;
  name: string;
  nameAr?: string;
}

export default function Reports() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'products' | 'orders' | 'orderDetails'>('products');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  
  // Data states
  const [productReport, setProductReport] = useState<ProductReportItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  
  // Metrics
  const [totalPrice, setTotalPrice] = useState(0);
  const [totalTax, setTotalTax] = useState(0);
  const [totalAfterTax, setTotalAfterTax] = useState(0);

  // Load brands
  const loadBrands = useCallback(async () => {
    try {
      const response = await coreApi.get('/brands') as any;
      setBrands(Array.isArray(response) ? response : (response?.brands || []));
    } catch (error) {
      console.error('Failed to load brands:', error);
      setBrands([]);
    }
  }, []);

  // Load products report
  const loadProductsReport = useCallback(async () => {
    try {
      const products = await reportService.getProductReport();
      setProductReport(products);
    } catch (error) {
      console.error('Failed to load products report:', error);
      setProductReport([]);
    }
  }, []);

  // Load orders
  const loadOrders = useCallback(async () => {
    try {
      const ordersData = await coreApi.getOrders() as any;
      const ordersList = Array.isArray(ordersData) ? ordersData : (ordersData?.orders || []);
      
      // Filter by date range if provided
      let filteredOrders = ordersList;
      if (startDate || endDate) {
        filteredOrders = ordersList.filter((order: Order) => {
          const orderDate = new Date(order.createdAt);
          if (startDate && orderDate < new Date(startDate)) return false;
          if (endDate && orderDate > new Date(endDate)) return false;
          return true;
        });
      }
      
      // Filter by search term
      if (searchTerm) {
        filteredOrders = filteredOrders.filter((order: Order) =>
          order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.customerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (order.customerName && order.customerName.toLowerCase().includes(searchTerm.toLowerCase()))
        );
      }
      
      setOrders(filteredOrders);
      
      // Calculate metrics
      const price = filteredOrders.reduce((sum: number, order: Order) => sum + (order.subtotal || 0), 0);
      const tax = filteredOrders.reduce((sum: number, order: Order) => sum + (order.taxAmount || 0), 0);
      const afterTax = filteredOrders.reduce((sum: number, order: Order) => sum + (order.totalAmount || 0), 0);
      
      setTotalPrice(price);
      setTotalTax(tax);
      setTotalAfterTax(afterTax);
    } catch (error) {
      console.error('Failed to load orders:', error);
      setOrders([]);
    }
  }, [startDate, endDate, searchTerm]);

  // Initial load
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        loadBrands(),
        loadProductsReport(),
        loadOrders()
      ]);
      setLoading(false);
    };
    loadData();
  }, [loadBrands, loadProductsReport, loadOrders]);

  // Reload orders when filters change
  useEffect(() => {
    if (activeTab === 'orders' || activeTab === 'orderDetails') {
      loadOrders();
    }
  }, [activeTab, startDate, endDate, searchTerm, loadOrders]);

  // Filter products by brand and search
  const filteredProducts = productReport.filter(product => {
    if (searchTerm) {
      return product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
             (product.sku && product.sku.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    return true;
  });

  // Export to Excel
  const handleExportExcel = () => {
    const wb = utils.book_new();
    
    if (activeTab === 'products') {
      const productsData = filteredProducts.map(product => ({
        [t('dashboard.reports.productName')]: product.name,
        [t('dashboard.reports.sku')]: product.sku || '',
        [t('dashboard.reports.stock')]: product.stock,
        [t('dashboard.reports.salesCount')]: product.salesCount,
        [t('dashboard.reports.revenue')]: product.revenue,
      }));
      const ws = utils.json_to_sheet(productsData);
      utils.book_append_sheet(wb, ws, t('dashboard.reports.productReport'));
    } else if (activeTab === 'orders' || activeTab === 'orderDetails') {
      const ordersData = orders.map(order => ({
        [t('dashboard.reports.orderNo')]: order.orderNumber,
        [t('dashboard.orders.customer')]: order.customerName || order.customerEmail,
        [t('dashboard.reports.email')]: order.customerEmail,
        [t('dashboard.reports.subtotal')]: order.subtotal || 0,
        [t('dashboard.reports.tax')]: order.taxAmount || 0,
        [t('dashboard.reports.total')]: order.totalAmount,
        [t('dashboard.orders.status')]: order.status,
        [t('dashboard.orders.paymentStatus')]: order.paymentStatus,
        [t('dashboard.reports.orderDate')]: new Date(order.createdAt).toLocaleDateString(),
      }));
      const ws = utils.json_to_sheet(ordersData);
      utils.book_append_sheet(wb, ws, t('dashboard.reports.orderReport'));
    }
    
    const filename = `reports_${activeTab}_${new Date().toISOString().split('T')[0]}.xlsx`;
    writeFile(wb, filename);
  };

  // Export to PDF (simplified version - opens print dialog)
  const handleExportPDF = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground">{t('dashboard.reports.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">{t('dashboard.reports.title')}</h2>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{t('dashboard.reports.export')}:</span>
          <Button variant="outline" size="sm" onClick={handleExportPDF}>
            <Download className="h-4 w-4 mr-2" />
            {t('dashboard.reports.pdf')}
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportExcel}>
            <Download className="h-4 w-4 mr-2" />
            {t('dashboard.reports.excel')}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 p-4 bg-card rounded-lg border">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('dashboard.reports.search')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-[150px]"
          />
          <span className="text-muted-foreground">-</span>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-[150px]"
          />
        </div>
        <Select value={selectedBrand} onValueChange={setSelectedBrand}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder={t('dashboard.reports.selectBrand')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('dashboard.reports.allBrands')}</SelectItem>
            {brands.map((brand) => (
              <SelectItem key={brand.id} value={brand.id}>
                {brand.nameAr || brand.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.reports.totalPrice')}</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalPrice, 'SAR')}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.reports.totalTax')}</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalTax, 'SAR')}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.reports.totalAfterTax')}</CardTitle>
            <Receipt className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalAfterTax, 'SAR')}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList>
          <TabsTrigger value="products">{t('dashboard.reports.products')}</TabsTrigger>
          <TabsTrigger value="orders">{t('dashboard.reports.orders')}</TabsTrigger>
          <TabsTrigger value="orderDetails">{t('dashboard.reports.orderDetails')}</TabsTrigger>
        </TabsList>

        {/* Products Tab */}
        <TabsContent value="products" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('dashboard.reports.productReport')}</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredProducts.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('dashboard.reports.productName')}</TableHead>
                      <TableHead>{t('dashboard.reports.sku')}</TableHead>
                      <TableHead>{t('dashboard.reports.stock')}</TableHead>
                      <TableHead>{t('dashboard.reports.salesCount')}</TableHead>
                      <TableHead>{t('dashboard.reports.revenue')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell>{product.name}</TableCell>
                        <TableCell>{product.sku || '-'}</TableCell>
                        <TableCell>{product.stock}</TableCell>
                        <TableCell>{product.salesCount}</TableCell>
                        <TableCell>{formatCurrency(product.revenue, 'SAR')}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>{t('dashboard.reports.noData')}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Orders Tab */}
        <TabsContent value="orders" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('dashboard.reports.orderReport')}</CardTitle>
            </CardHeader>
            <CardContent>
              {orders.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('dashboard.reports.orderNo')}</TableHead>
                      <TableHead>{t('dashboard.orders.customer')}</TableHead>
                      <TableHead>{t('dashboard.reports.email')}</TableHead>
                      <TableHead>{t('dashboard.reports.subtotal')}</TableHead>
                      <TableHead>{t('dashboard.reports.tax')}</TableHead>
                      <TableHead>{t('dashboard.reports.total')}</TableHead>
                      <TableHead>{t('dashboard.orders.status')}</TableHead>
                      <TableHead>{t('dashboard.reports.orderDate')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell>{order.orderNumber}</TableCell>
                        <TableCell>{order.customerName || '-'}</TableCell>
                        <TableCell>{order.customerEmail}</TableCell>
                        <TableCell>{formatCurrency(order.subtotal || 0, 'SAR')}</TableCell>
                        <TableCell>{formatCurrency(order.taxAmount || 0, 'SAR')}</TableCell>
                        <TableCell>{formatCurrency(order.totalAmount, 'SAR')}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded text-xs ${
                            order.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                            order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {order.status}
                          </span>
                        </TableCell>
                        <TableCell>{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>{t('dashboard.reports.noData')}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Order Details Tab */}
        <TabsContent value="orderDetails" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('dashboard.reports.orderDetails')}</CardTitle>
            </CardHeader>
            <CardContent>
              {orders.length > 0 ? (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <Card key={order.id} className="p-4">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-bold">{t('dashboard.reports.orderNo')}: {order.orderNumber}</h3>
                          <p className="text-sm text-muted-foreground">
                            {order.customerName || order.customerEmail}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{formatCurrency(order.totalAmount, 'SAR')}</p>
                          <p className="text-sm text-muted-foreground">{t('dashboard.orders.status')}: {order.status}</p>
                          <p className="text-sm text-muted-foreground">{t('dashboard.reports.payment')}: {order.paymentStatus}</p>
                        </div>
                      </div>
                      {order.items && order.items.length > 0 && (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>{t('dashboard.reports.products')}</TableHead>
                              <TableHead>{t('dashboard.reports.quantity')}</TableHead>
                              <TableHead>{t('dashboard.products.price')}</TableHead>
                              <TableHead>{t('dashboard.reports.itemTotal')}</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {order.items.map((item, index) => (
                              <TableRow key={index}>
                                <TableCell>{item.product?.nameAr || item.product?.name || '-'}</TableCell>
                                <TableCell>{item.quantity}</TableCell>
                                <TableCell>{formatCurrency(item.price, 'SAR')}</TableCell>
                                <TableCell>{formatCurrency(item.price * item.quantity, 'SAR')}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                      <div className="mt-4 pt-4 border-t flex justify-end gap-4">
                        <div className="text-right">
                          <p className="text-sm">{t('dashboard.reports.subtotal')}: {formatCurrency(order.subtotal || 0, 'SAR')}</p>
                          <p className="text-sm">{t('dashboard.reports.tax')}: {formatCurrency(order.taxAmount || 0, 'SAR')}</p>
                          <p className="font-bold">{t('dashboard.reports.total')}: {formatCurrency(order.totalAmount, 'SAR')}</p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>{t('dashboard.reports.noData')}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
