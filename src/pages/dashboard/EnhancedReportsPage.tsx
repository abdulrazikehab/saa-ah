import { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Package, 
  TrendingUp, 
  ShoppingCart, 
  DollarSign,
  Download,
  Search,
  BarChart3,
  RefreshCw,
  Calendar,
  Filter,
  FileText,
  CreditCard,
  Tag,
  Wallet,
  History,
  Eye,
  ArrowUpRight,
  ArrowDownLeft,
  FileSpreadsheet
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { coreApi, reportService } from '@/lib/api';
import { formatCurrency as formatCurrencyBase, formatNumber } from '@/lib/currency-utils';
import { writeFile, utils } from 'xlsx';
import { DataTablePagination } from '@/components/common/DataTablePagination';

// Helper function to format currency with default SAR
const formatCurrency = (amount: number | string): string => {
  return formatCurrencyBase(amount, 'SAR');
};

// Date preset options
type DatePreset = 'today' | 'yesterday' | 'week' | 'month' | '3months' | '6months' | 'year' | 'custom';

interface DateRange {
  startDate: string;
  endDate: string;
}

interface ProductReport {
  id: string;
  name: string;
  sku?: string;
  brandId?: string;
  brandName?: string;
  categoryId?: string;
  categoryName?: string;
  salesCount: number;
  revenue: number;
  cost: number;
  profitMargin: number;
  withdrawnQuantity: number;
}

interface OrderDetail {
  id: string;
  orderNumber: string;
  productName: string;
  productSku?: string;
  categoryName?: string;
  quantity: number;
  price: number;
  total: number;
  status: string;
  customerName: string;
  customerEmail: string;
  createdAt: string;
}

// Raw API types
interface RawProduct {
  id: string;
  name?: string;
  sku?: string;
  brandId?: string;
  categoryId?: string;
  salesCount?: number;
  revenue?: number;
  cost?: number;
  profitMargin?: number;
}

interface RawBrand {
  id: string;
  name?: string;
  nameAr?: string;
}

interface RawCategory {
  id: string;
  name?: string;
  nameAr?: string;
}

interface RawOrderItem {
  id?: string;
  productId?: string;
  productName?: string;
  productSku?: string;
  categoryName?: string;
  quantity?: number;
  price?: number;
  product?: {
    id?: string;
    name?: string;
    sku?: string;
  };
}

interface RawOrder {
  id: string;
  orderNumber?: string;
  status?: string;
  createdAt: string;
  customerName?: string;
  customerEmail?: string;
  items?: RawOrderItem[];
  orderItems?: RawOrderItem[];
  customer?: {
    name?: string;
    email?: string;
  };
}

export default function EnhancedReportsPage() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const { toast } = useToast();
  
  // State
  const [activeTab, setActiveTab] = useState('products');
  const [products, setProducts] = useState<ProductReport[]>([]);
  const [orderDetails, setOrderDetails] = useState<OrderDetail[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [brandFilter, setBrandFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [datePreset, setDatePreset] = useState<DatePreset>('month');
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: '',
    endDate: ''
  });
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  
  // Available filters
  const [availableBrands, setAvailableBrands] = useState<{id: string, name: string}[]>([]);
  const [availableCategories, setAvailableCategories] = useState<{id: string, name: string}[]>([]);

  // Calculate date range from preset
  const getDateRangeFromPreset = useCallback((preset: DatePreset): DateRange => {
    const now = new Date();
    const endDate = now.toISOString().split('T')[0];
    let startDate = '';
    
    switch (preset) {
      case 'today': {
        startDate = endDate;
        break;
      }
      case 'yesterday': {
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        startDate = yesterday.toISOString().split('T')[0];
        break;
      }
      case 'week': {
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        startDate = weekAgo.toISOString().split('T')[0];
        break;
      }
      case 'month': {
        const monthAgo = new Date(now);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        startDate = monthAgo.toISOString().split('T')[0];
        break;
      }
      case '3months': {
        const threeMonthsAgo = new Date(now);
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
        startDate = threeMonthsAgo.toISOString().split('T')[0];
        break;
      }
      case '6months': {
        const sixMonthsAgo = new Date(now);
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        startDate = sixMonthsAgo.toISOString().split('T')[0];
        break;
      }
      case 'year': {
        const yearAgo = new Date(now);
        yearAgo.setFullYear(yearAgo.getFullYear() - 1);
        startDate = yearAgo.toISOString().split('T')[0];
        break;
      }
      default: {
        startDate = dateRange.startDate;
      }
    }
    
    return { startDate, endDate: preset === 'yesterday' ? startDate : endDate };
  }, [dateRange.startDate]);

  // Load data
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Get effective date range
      const effectiveDateRange = datePreset === 'custom' ? dateRange : getDateRangeFromPreset(datePreset);
      
      // Fetch products report
      const productsResponse = await reportService.getProductReport({ limit: 1000 });
      const productsData = Array.isArray(productsResponse) ? productsResponse : 
        (productsResponse as { data?: ProductReport[] }).data || [];
      
      // Fetch brands
      const brandsResponse = await coreApi.getBrands();
      const brandsData = Array.isArray(brandsResponse) ? brandsResponse : 
        (brandsResponse as { brands?: { id: string; name?: string; nameAr?: string }[] }).brands || [];
      
      // Fetch categories
      const categoriesResponse = await coreApi.getCategories({});
      const categoriesData = (categoriesResponse as { categories?: { id: string; name?: string; nameAr?: string }[] }).categories || 
        (categoriesResponse as { id: string; name?: string }[]) || [];
      
      // Fetch orders for order details tab
      const ordersResponse = await coreApi.getOrders({ limit: 500 } as Record<string, unknown>);
      const ordersData: RawOrder[] = (ordersResponse as { orders?: RawOrder[]; data?: RawOrder[] }).orders || 
        (ordersResponse as { data?: RawOrder[] }).data || [];
      
      // Map products
      const mappedProducts: ProductReport[] = (productsData as RawProduct[]).map((p: RawProduct) => ({
        id: p.id,
        name: p.name || '',
        sku: p.sku || '',
        brandId: p.brandId,
        brandName: (brandsData as RawBrand[]).find((b: RawBrand) => b.id === p.brandId)?.name || 
                   (brandsData as RawBrand[]).find((b: RawBrand) => b.id === p.brandId)?.nameAr || '',
        categoryId: p.categoryId,
        categoryName: (categoriesData as RawCategory[]).find((c: RawCategory) => c.id === p.categoryId)?.name || '',
        salesCount: p.salesCount || 0,
        revenue: p.revenue || 0,
        cost: p.cost || 0,
        profitMargin: p.profitMargin || 0,
        withdrawnQuantity: p.salesCount || 0
      }));
      
      // Map order details
      const mappedOrderDetails: OrderDetail[] = [];
      ordersData.forEach((order: RawOrder) => {
        const orderDate = new Date(order.createdAt);
        const startCheck = effectiveDateRange.startDate ? new Date(effectiveDateRange.startDate) : null;
        const endCheck = effectiveDateRange.endDate ? new Date(effectiveDateRange.endDate + 'T23:59:59') : null;
        
        // Filter by date range
        if (startCheck && orderDate < startCheck) return;
        if (endCheck && orderDate > endCheck) return;
        
        const items: RawOrderItem[] = order.items || order.orderItems || [];
        items.forEach((item: RawOrderItem) => {
          mappedOrderDetails.push({
            id: `${order.id}-${item.productId || item.id}`,
            orderNumber: order.orderNumber || order.id.substring(0, 8),
            productName: item.productName || item.product?.name || '',
            productSku: item.productSku || item.product?.sku || '',
            categoryName: item.categoryName || '',
            quantity: item.quantity || 1,
            price: item.price || 0,
            total: (item.price || 0) * (item.quantity || 1),
            status: order.status || 'pending',
            customerName: order.customerName || order.customer?.name || '',
            customerEmail: order.customerEmail || order.customer?.email || '',
            createdAt: order.createdAt
          });
        });
      });
      
      setProducts(mappedProducts);
      setOrderDetails(mappedOrderDetails);
      setAvailableBrands((brandsData as RawBrand[]).map((b: RawBrand) => ({ id: b.id, name: b.name || b.nameAr || '' })));
      setAvailableCategories((categoriesData as RawCategory[]).map((c: RawCategory) => ({ id: c.id, name: c.name || c.nameAr || '' })));
      
    } catch (error) {
      console.error('Failed to load reports:', error);
      toast({
        title: isRTL ? 'خطأ' : 'Error',
        description: isRTL ? 'فشل في تحميل التقارير' : 'Failed to load reports',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [datePreset, dateRange, getDateRangeFromPreset, isRTL, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Stats
  const stats = useMemo(() => {
    const totalRevenue = products.reduce((sum, p) => sum + p.revenue, 0);
    const totalSales = products.reduce((sum, p) => sum + p.salesCount, 0);
    const totalProfit = products.reduce((sum, p) => sum + (p.revenue - p.cost), 0);
    
    return {
      totalProducts: products.length,
      totalRevenue,
      totalSales,
      totalProfit
    };
  }, [products]);

  // Filtered products
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (!product.name.toLowerCase().includes(query) && !product.sku?.toLowerCase().includes(query)) {
          return false;
        }
      }
      if (brandFilter !== 'all' && product.brandId !== brandFilter) return false;
      if (categoryFilter !== 'all' && product.categoryId !== categoryFilter) return false;
      return true;
    });
  }, [products, searchQuery, brandFilter, categoryFilter]);

  // Filtered order details
  const filteredOrderDetails = useMemo(() => {
    return orderDetails.filter(order => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (!order.productName.toLowerCase().includes(query) && 
            !order.productSku?.toLowerCase().includes(query) &&
            !order.customerName.toLowerCase().includes(query) &&
            !order.orderNumber.toLowerCase().includes(query)) {
          return false;
        }
      }
      if (categoryFilter !== 'all' && order.categoryName !== categoryFilter) return false;
      return true;
    });
  }, [orderDetails, searchQuery, categoryFilter]);

  // Paginated data
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredProducts.slice(startIndex, startIndex + pageSize);
  }, [filteredProducts, currentPage, pageSize]);

  const paginatedOrderDetails = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredOrderDetails.slice(startIndex, startIndex + pageSize);
  }, [filteredOrderDetails, currentPage, pageSize]);

  // Export functions
  const handleExportExcel = () => {
    try {
      let exportData: Record<string, unknown>[] = [];
      let sheetName = '';
      let fileName = '';
      
      if (activeTab === 'products') {
        exportData = filteredProducts.map((p, i) => ({
          '#': i + 1,
          [isRTL ? 'اسم المنتج' : 'Product Name']: p.name,
          [isRTL ? 'رمز المنتج' : 'SKU']: p.sku || '',
          [isRTL ? 'العلامة التجارية' : 'Brand']: p.brandName || '',
          [isRTL ? 'الفئة' : 'Category']: p.categoryName || '',
          [isRTL ? 'عدد المبيعات' : 'Sales Count']: p.salesCount,
          [isRTL ? 'الإيرادات' : 'Revenue']: p.revenue,
          [isRTL ? 'التكلفة' : 'Cost']: p.cost,
          [isRTL ? 'هامش الربح %' : 'Profit Margin %']: p.profitMargin.toFixed(2)
        }));
        sheetName = isRTL ? 'المنتجات' : 'Products';
        fileName = `products_report_${new Date().toISOString().split('T')[0]}.xlsx`;
      } else if (activeTab === 'orders') {
        exportData = filteredOrderDetails.map((o, i) => ({
          '#': i + 1,
          [isRTL ? 'رقم الطلب' : 'Order #']: o.orderNumber,
          [isRTL ? 'المنتج' : 'Product']: o.productName,
          [isRTL ? 'الفئة' : 'Category']: o.categoryName || '',
          [isRTL ? 'الكمية' : 'Quantity']: o.quantity,
          [isRTL ? 'السعر' : 'Price']: o.price,
          [isRTL ? 'الإجمالي' : 'Total']: o.total,
          [isRTL ? 'العميل' : 'Customer']: o.customerName,
          [isRTL ? 'الحالة' : 'Status']: o.status,
          [isRTL ? 'التاريخ' : 'Date']: new Date(o.createdAt).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US')
        }));
        sheetName = isRTL ? 'تفاصيل الطلبات' : 'Order Details';
        fileName = `order_details_${new Date().toISOString().split('T')[0]}.xlsx`;
      }
      
      const ws = utils.json_to_sheet(exportData);
      const wb = utils.book_new();
      utils.book_append_sheet(wb, ws, sheetName);
      writeFile(wb, fileName);
      
      toast({
        title: isRTL ? 'تم التصدير' : 'Exported',
        description: isRTL ? 'تم تصدير التقرير بنجاح' : 'Report exported successfully'
      });
    } catch (error) {
      toast({
        title: isRTL ? 'خطأ' : 'Error',
        description: isRTL ? 'فشل في تصدير التقرير' : 'Failed to export report',
        variant: 'destructive'
      });
    }
  };

  const handleExportPDF = () => {
    // For now, use text-based export
    try {
      let content = '';
      let fileName = '';
      
      if (activeTab === 'products') {
        content = `=== ${isRTL ? 'تقرير المنتجات' : 'Products Report'} ===\n\n`;
        content += `${isRTL ? 'التاريخ:' : 'Date:'} ${new Date().toLocaleDateString()}\n`;
        content += `${isRTL ? 'إجمالي المنتجات:' : 'Total Products:'} ${filteredProducts.length}\n`;
        content += `${isRTL ? 'إجمالي الإيرادات:' : 'Total Revenue:'} ${formatCurrency(stats.totalRevenue)}\n\n`;
        
        filteredProducts.forEach((p, i) => {
          content += `${i + 1}. ${p.name} (${p.sku || 'N/A'})\n`;
          content += `   ${isRTL ? 'المبيعات:' : 'Sales:'} ${p.salesCount} | ${isRTL ? 'الإيرادات:' : 'Revenue:'} ${formatCurrency(p.revenue)}\n\n`;
        });
        fileName = `products_report_${new Date().toISOString().split('T')[0]}.txt`;
      } else {
        content = `=== ${isRTL ? 'تفاصيل الطلبات' : 'Order Details'} ===\n\n`;
        content += `${isRTL ? 'التاريخ:' : 'Date:'} ${new Date().toLocaleDateString()}\n`;
        content += `${isRTL ? 'إجمالي الطلبات:' : 'Total Orders:'} ${filteredOrderDetails.length}\n\n`;
        
        filteredOrderDetails.forEach((o, i) => {
          content += `${i + 1}. ${isRTL ? 'طلب' : 'Order'} #${o.orderNumber}\n`;
          content += `   ${o.productName} x${o.quantity} = ${formatCurrency(o.total)}\n\n`;
        });
        fileName = `order_details_${new Date().toISOString().split('T')[0]}.txt`;
      }
      
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: isRTL ? 'تم التصدير' : 'Exported',
        description: isRTL ? 'تم تصدير التقرير بنجاح' : 'Report exported successfully'
      });
    } catch (error) {
      toast({
        title: isRTL ? 'خطأ' : 'Error',
        description: isRTL ? 'فشل في تصدير التقرير' : 'Failed to export report',
        variant: 'destructive'
      });
    }
  };

  const totalPages = activeTab === 'products' 
    ? Math.ceil(filteredProducts.length / pageSize)
    : Math.ceil(filteredOrderDetails.length / pageSize);

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-primary" />
            {isRTL ? 'التقارير' : 'Reports'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isRTL ? 'تحليل المبيعات والمنتجات والطلبات' : 'Analyze sales, products, and orders'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={loadData} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            {isRTL ? 'تحديث' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setCurrentPage(1); }}>
        <TabsList className="grid w-full md:w-auto grid-cols-3 md:inline-flex gap-1 bg-muted/50 p-1 rounded-lg">
          <TabsTrigger value="products" className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md">
            <Package className="h-4 w-4" />
            {isRTL ? 'المنتجات' : 'Products'}
          </TabsTrigger>
          <TabsTrigger value="orders" className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md">
            <ShoppingCart className="h-4 w-4" />
            {isRTL ? 'الطلبات' : 'Orders'}
          </TabsTrigger>
          <TabsTrigger value="orderDetails" className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md">
            <FileText className="h-4 w-4" />
            {isRTL ? 'تفاصيل الطلب' : 'Order Details'}
          </TabsTrigger>
        </TabsList>

        {/* Filters Card */}
        <Card className="mt-4">
          <CardContent className="p-4">
            <div className="flex flex-col gap-4">
              {/* Row 1: Brand filter and Date pickers */}
              <div className="flex flex-col md:flex-row gap-4 items-end">
                <div className="w-full md:w-48">
                  <label className="text-sm font-medium mb-2 block text-muted-foreground">
                    {isRTL ? 'اختر العلامة التجارية' : 'Select Brand'}
                  </label>
                  <Select value={brandFilter} onValueChange={setBrandFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder={isRTL ? 'اختر العلامة التجارية' : 'Select Brand'} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{isRTL ? 'الكل' : 'All'}</SelectItem>
                      {availableBrands.map(brand => (
                        <SelectItem key={brand.id} value={brand.id}>{brand.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <div>
                    <label className="text-sm font-medium mb-2 block text-muted-foreground invisible">.</label>
                    <Input 
                      type="date" 
                      value={dateRange.endDate || new Date().toISOString().split('T')[0]}
                      onChange={(e) => { setDateRange(prev => ({ ...prev, endDate: e.target.value })); setDatePreset('custom'); }}
                      className="w-40"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block text-muted-foreground invisible">.</label>
                    <Input 
                      type="date" 
                      value={dateRange.startDate}
                      onChange={(e) => { setDateRange(prev => ({ ...prev, startDate: e.target.value })); setDatePreset('custom'); }}
                      className="w-40"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium mb-2 block text-muted-foreground invisible">.</label>
                  <Button variant="outline" onClick={handleExportExcel} className="gap-2 whitespace-nowrap">
                    Excel
                  </Button>
                  <Button variant="outline" onClick={handleExportPDF} className="gap-2 whitespace-nowrap">
                    PDF
                  </Button>
                </div>
              </div>

              {/* Row 2: Search */}
              <div className="relative">
                <Search className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground`} />
                <Input
                  placeholder={isRTL ? 'بحث...' : 'Search...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={isRTL ? 'pr-10' : 'pl-10'}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/20 border-blue-200/50">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">
                    {isRTL ? 'إجمالي السعر' : 'Total Price'}
                  </p>
                  <p className="text-3xl font-bold mt-2">{formatCurrency(stats.totalRevenue)}</p>
                </div>
                <div className="h-14 w-14 bg-blue-500/10 rounded-2xl flex items-center justify-center">
                  <TrendingUp className="h-7 w-7 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/20 border-green-200/50">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">
                    {isRTL ? 'إجمالي الضريبة' : 'Total Tax'}
                  </p>
                  <p className="text-3xl font-bold mt-2">{formatCurrency(stats.totalRevenue * 0.15)}</p>
                </div>
                <div className="h-14 w-14 bg-green-500/10 rounded-2xl flex items-center justify-center">
                  <DollarSign className="h-7 w-7 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/20 border-purple-200/50">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">
                    {isRTL ? 'الإجمالي بعد الضريبة' : 'Total After Tax'}
                  </p>
                  <p className="text-3xl font-bold mt-2">{formatCurrency(stats.totalRevenue * 1.15)}</p>
                </div>
                <div className="h-14 w-14 bg-purple-500/10 rounded-2xl flex items-center justify-center">
                  <CreditCard className="h-7 w-7 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Products Tab Content */}
        <TabsContent value="products" className="mt-4">
          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mb-4"></div>
                  <p className="text-muted-foreground">{isRTL ? 'جاري التحميل...' : 'Loading...'}</p>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                  <BarChart3 className="h-16 w-16 mb-4 opacity-30" />
                  <p className="text-lg">{isRTL ? 'لا توجد بيانات' : 'No data'}</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/30">
                          <TableHead className="text-center w-[60px]">#</TableHead>
                          <TableHead>{isRTL ? 'المنتج' : 'Product'}</TableHead>
                          <TableHead>{isRTL ? 'العلامة التجارية' : 'Brand'}</TableHead>
                          <TableHead>{isRTL ? 'الفئة' : 'Category'}</TableHead>
                          <TableHead className="text-center">{isRTL ? 'المبيعات' : 'Sales'}</TableHead>
                          <TableHead className="text-left">{isRTL ? 'الإيرادات' : 'Revenue'}</TableHead>
                          <TableHead className="text-center">{isRTL ? 'هامش الربح' : 'Profit Margin'}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedProducts.map((product, index) => (
                          <TableRow key={product.id} className="hover:bg-muted/30 transition-colors">
                            <TableCell className="text-center font-medium text-muted-foreground">
                              {(currentPage - 1) * pageSize + index + 1}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="font-medium">{product.name}</span>
                                {product.sku && (
                                  <span className="text-xs text-muted-foreground">{product.sku}</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>{product.brandName || '-'}</TableCell>
                            <TableCell>{product.categoryName || '-'}</TableCell>
                            <TableCell className="text-center">
                              <Badge variant="secondary">{formatNumber(product.salesCount)}</Badge>
                            </TableCell>
                            <TableCell className="text-left font-semibold text-green-600">
                              {formatCurrency(product.revenue)}
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge className={
                                product.profitMargin > 20 ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                                product.profitMargin > 10 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                              }>
                                {product.profitMargin.toFixed(1)}%
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  
                  {totalPages > 1 && (
                    <div className="p-4 border-t">
                      <DataTablePagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        itemsPerPage={pageSize}
                        totalItems={filteredProducts.length}
                        onPageChange={setCurrentPage}
                        onItemsPerPageChange={(size) => {
                          setPageSize(size);
                          setCurrentPage(1);
                        }}
                        showItemsPerPage={true}
                      />
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Orders Tab Content */}
        <TabsContent value="orders" className="mt-4">
          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mb-4"></div>
                </div>
              ) : filteredOrderDetails.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                  <ShoppingCart className="h-16 w-16 mb-4 opacity-30" />
                  <p className="text-lg">{isRTL ? 'لا توجد طلبات' : 'No orders'}</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/30">
                          <TableHead className="text-center w-[60px]">#</TableHead>
                          <TableHead>{isRTL ? 'رقم الطلب' : 'Order #'}</TableHead>
                          <TableHead>{isRTL ? 'العميل' : 'Customer'}</TableHead>
                          <TableHead>{isRTL ? 'المنتج' : 'Product'}</TableHead>
                          <TableHead className="text-center">{isRTL ? 'الكمية' : 'Qty'}</TableHead>
                          <TableHead className="text-left">{isRTL ? 'الإجمالي' : 'Total'}</TableHead>
                          <TableHead className="text-center">{isRTL ? 'الحالة' : 'Status'}</TableHead>
                          <TableHead>{isRTL ? 'التاريخ' : 'Date'}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedOrderDetails.map((order, index) => (
                          <TableRow key={order.id} className="hover:bg-muted/30 transition-colors">
                            <TableCell className="text-center text-muted-foreground">
                              {(currentPage - 1) * pageSize + index + 1}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="font-mono">{order.orderNumber}</Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="font-medium">{order.customerName || '-'}</span>
                                <span className="text-xs text-muted-foreground">{order.customerEmail}</span>
                              </div>
                            </TableCell>
                            <TableCell>{order.productName}</TableCell>
                            <TableCell className="text-center">{order.quantity}</TableCell>
                            <TableCell className="text-left font-semibold">
                              {formatCurrency(order.total)}
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant={
                                order.status === 'completed' || order.status === 'COMPLETED' ? 'default' :
                                order.status === 'pending' || order.status === 'PENDING' ? 'secondary' :
                                'destructive'
                              }>
                                {order.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {new Date(order.createdAt).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US')}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  
                  {totalPages > 1 && (
                    <div className="p-4 border-t">
                      <DataTablePagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        itemsPerPage={pageSize}
                        totalItems={filteredOrderDetails.length}
                        onPageChange={setCurrentPage}
                        onItemsPerPageChange={(size) => {
                          setPageSize(size);
                          setCurrentPage(1);
                        }}
                        showItemsPerPage={true}
                      />
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Order Details Tab Content */}
        <TabsContent value="orderDetails" className="mt-4">
          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mb-4"></div>
                </div>
              ) : filteredOrderDetails.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                  <FileText className="h-16 w-16 mb-4 opacity-30" />
                  <p className="text-lg">{isRTL ? 'لا توجد تفاصيل' : 'No details'}</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/30">
                          <TableHead className="text-center w-[60px]">#</TableHead>
                          <TableHead>{isRTL ? 'رقم الطلب' : 'Order #'}</TableHead>
                          <TableHead>{isRTL ? 'المنتج' : 'Product'}</TableHead>
                          <TableHead>{isRTL ? 'الفئة' : 'Category'}</TableHead>
                          <TableHead className="text-center">{isRTL ? 'الكمية' : 'Qty'}</TableHead>
                          <TableHead className="text-left">{isRTL ? 'السعر' : 'Price'}</TableHead>
                          <TableHead className="text-left">{isRTL ? 'الإجمالي' : 'Total'}</TableHead>
                          <TableHead>{isRTL ? 'التاريخ' : 'Date'}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedOrderDetails.map((order, index) => (
                          <TableRow key={order.id} className="hover:bg-muted/30 transition-colors">
                            <TableCell className="text-center text-muted-foreground">
                              {(currentPage - 1) * pageSize + index + 1}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="font-mono">{order.orderNumber}</Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="font-medium">{order.productName}</span>
                                {order.productSku && (
                                  <span className="text-xs text-muted-foreground">{order.productSku}</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>{order.categoryName || '-'}</TableCell>
                            <TableCell className="text-center">{order.quantity}</TableCell>
                            <TableCell className="text-left">{formatCurrency(order.price)}</TableCell>
                            <TableCell className="text-left font-semibold text-green-600">
                              {formatCurrency(order.total)}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {new Date(order.createdAt).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US')}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  
                  {totalPages > 1 && (
                    <div className="p-4 border-t">
                      <DataTablePagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        itemsPerPage={pageSize}
                        totalItems={filteredOrderDetails.length}
                        onPageChange={setCurrentPage}
                        onItemsPerPageChange={(size) => {
                          setPageSize(size);
                          setCurrentPage(1);
                        }}
                        showItemsPerPage={true}
                      />
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
