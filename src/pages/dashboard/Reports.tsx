import React, { useEffect, useState, useCallback } from 'react';
import { coreApi, reportService, orderService } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, Search, TrendingUp, DollarSign, Receipt, Calendar } from 'lucide-react';
import { writeFile, utils } from 'xlsx';
import { formatCurrency } from '@/lib/currency-utils';
// PDF export will be implemented after installing jspdf package

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
  const [activeTab, setActiveTab] = useState<'products' | 'orders' | 'orderDetails'>('products');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  
  // Data states
  const [productReport, setProductReport] = useState<ProductReportItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderDetails, setOrderDetails] = useState<Order[]>([]);
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
      setOrderDetails(filteredOrders);
      
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
      setOrderDetails([]);
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
  }, [loadBrands, loadProductsReport]);

  // Reload orders when filters change
  useEffect(() => {
    if (activeTab === 'orders' || activeTab === 'orderDetails') {
      loadOrders();
    }
  }, [activeTab, startDate, endDate, searchTerm, loadOrders]);

  // Filter products by brand and search
  const filteredProducts = productReport.filter(product => {
    if (selectedBrand !== 'all') {
      // Filter by brand if needed (assuming product has brandId)
      // For now, we'll filter by search term only
    }
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
        'Product Name': product.name,
        'SKU': product.sku || '',
        'Stock': product.stock,
        'Sales Count': product.salesCount,
        'Revenue': product.revenue,
      }));
      const ws = utils.json_to_sheet(productsData);
      utils.book_append_sheet(wb, ws, 'Products Report');
    } else if (activeTab === 'orders' || activeTab === 'orderDetails') {
      const ordersData = orders.map(order => ({
        'Order Number': order.orderNumber,
        'Customer': order.customerName || order.customerEmail,
        'Email': order.customerEmail,
        'Subtotal': order.subtotal || 0,
        'Tax': order.taxAmount || 0,
        'Total': order.totalAmount,
        'Status': order.status,
        'Payment Status': order.paymentStatus,
        'Date': new Date(order.createdAt).toLocaleDateString(),
      }));
      const ws = utils.json_to_sheet(ordersData);
      utils.book_append_sheet(wb, ws, 'Orders Report');
    }
    
    const filename = `reports_${activeTab}_${new Date().toISOString().split('T')[0]}.xlsx`;
    writeFile(wb, filename);
  };

  // Export to PDF (simplified version - opens print dialog)
  const handleExportPDF = () => {
    // For now, we'll use window.print() which allows users to save as PDF
    // TODO: Install jspdf and jspdf-autotable for proper PDF generation
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    let content = '<html><head><title>Reports</title><style>';
    content += 'table { border-collapse: collapse; width: 100%; }';
    content += 'th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }';
    content += 'th { background-color: #f2f2f2; }';
    content += '</style></head><body>';
    content += '<h1>Reports</h1>';
    
    if (activeTab === 'products') {
      content += '<h2>Products Report</h2><table>';
      content += '<tr><th>Product Name</th><th>SKU</th><th>Stock</th><th>Sales Count</th><th>Revenue</th></tr>';
      filteredProducts.forEach(product => {
        content += `<tr><td>${product.name}</td><td>${product.sku || ''}</td><td>${product.stock}</td><td>${product.salesCount}</td><td>${product.revenue.toFixed(2)}</td></tr>`;
      });
      content += '</table>';
    } else if (activeTab === 'orders' || activeTab === 'orderDetails') {
      content += '<h2>Orders Report</h2><table>';
      content += '<tr><th>Order Number</th><th>Customer</th><th>Subtotal</th><th>Tax</th><th>Total</th><th>Status</th></tr>';
      orders.forEach(order => {
        content += `<tr><td>${order.orderNumber}</td><td>${order.customerName || order.customerEmail}</td><td>${(order.subtotal || 0).toFixed(2)}</td><td>${(order.taxAmount || 0).toFixed(2)}</td><td>${order.totalAmount.toFixed(2)}</td><td>${order.status}</td></tr>`;
      });
      content += '</table>';
    }
    
    content += '</body></html>';
    printWindow.document.write(content);
    printWindow.document.close();
    printWindow.print();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground">جاري التحميل…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">التقارير</h2>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">تصدير:</span>
          <Button variant="outline" size="sm" onClick={handleExportPDF}>
            <Download className="h-4 w-4 mr-2" />
            PDF
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportExcel}>
            <Download className="h-4 w-4 mr-2" />
            Excel
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 p-4 bg-card rounded-lg border">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="بحث..."
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
            placeholder="mm/dd/yyyy"
          />
          <span className="text-muted-foreground">-</span>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-[150px]"
            placeholder="mm/dd/yyyy"
          />
        </div>
        <Select value={selectedBrand} onValueChange={setSelectedBrand}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="اختر العلامة التجارية" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع العلامات التجارية</SelectItem>
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
            <CardTitle className="text-sm font-medium">إجمالي السعر</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalPrice, 'SAR')}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الضريبة</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalTax, 'SAR')}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الإجمالي بعد الضريبة</CardTitle>
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
          <TabsTrigger value="products">المنتجات</TabsTrigger>
          <TabsTrigger value="orders">الطلبات</TabsTrigger>
          <TabsTrigger value="orderDetails">تفاصيل الطلب</TabsTrigger>
        </TabsList>

        {/* Products Tab */}
        <TabsContent value="products" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>تقرير المنتجات</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredProducts.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>اسم المنتج</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>المخزون</TableHead>
                      <TableHead>عدد المبيعات</TableHead>
                      <TableHead>الإيرادات</TableHead>
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
                  <p>لا توجد بيانات</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Orders Tab */}
        <TabsContent value="orders" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>تقرير الطلبات</CardTitle>
            </CardHeader>
            <CardContent>
              {orders.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>رقم الطلب</TableHead>
                      <TableHead>العميل</TableHead>
                      <TableHead>البريد الإلكتروني</TableHead>
                      <TableHead>المجموع الفرعي</TableHead>
                      <TableHead>الضريبة</TableHead>
                      <TableHead>الإجمالي</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead>تاريخ الطلب</TableHead>
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
                        <TableCell>{new Date(order.createdAt).toLocaleDateString('ar-SA')}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>لا توجد بيانات</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Order Details Tab */}
        <TabsContent value="orderDetails" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>تفاصيل الطلب</CardTitle>
            </CardHeader>
            <CardContent>
              {orderDetails.length > 0 ? (
                <div className="space-y-4">
                  {orderDetails.map((order) => (
                    <Card key={order.id} className="p-4">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-bold">طلب رقم: {order.orderNumber}</h3>
                          <p className="text-sm text-muted-foreground">
                            {order.customerName || order.customerEmail}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(order.createdAt).toLocaleDateString('ar-SA')}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{formatCurrency(order.totalAmount, 'SAR')}</p>
                          <p className="text-sm text-muted-foreground">الحالة: {order.status}</p>
                          <p className="text-sm text-muted-foreground">دفع: {order.paymentStatus}</p>
                        </div>
                      </div>
                      {order.items && order.items.length > 0 && (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>المنتج</TableHead>
                              <TableHead>الكمية</TableHead>
                              <TableHead>السعر</TableHead>
                              <TableHead>الإجمالي</TableHead>
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
                          <p className="text-sm">المجموع الفرعي: {formatCurrency(order.subtotal || 0, 'SAR')}</p>
                          <p className="text-sm">الضريبة: {formatCurrency(order.taxAmount || 0, 'SAR')}</p>
                          <p className="font-bold">الإجمالي: {formatCurrency(order.totalAmount, 'SAR')}</p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>لا توجد بيانات</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
