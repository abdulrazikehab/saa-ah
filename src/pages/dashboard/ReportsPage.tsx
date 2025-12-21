import { useState, useEffect, useCallback } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Download, 
  DollarSign,
  ShoppingCart,
  Package,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard
} from 'lucide-react';
import { writeFile, utils } from 'xlsx';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { coreApi, reportService } from '@/lib/api';
import { ProductReportItem, CustomerReportItem, PaymentReportItem } from '@/services/report.service';
import { useTranslation } from 'react-i18next';
import { formatCurrency } from '@/lib/currency-utils';

const COLORS = ['#06b6d4', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function ReportsPage() {
  const { t, i18n } = useTranslation();
  const [dateRange, setDateRange] = useState('30days');
  const [reportType, setReportType] = useState('sales');
  const [loading, setLoading] = useState(true);
  const [salesData, setSalesData] = useState<{ name: string; revenue: number; orders: number }[]>([]);
  const [stats, setStats] = useState<{ orderCount: number; revenue: number; productCount: number; customerCount: number } | null>(null);
  const [previousStats, setPreviousStats] = useState<{ orderCount: number; revenue: number; productCount: number; customerCount: number } | null>(null);
  
  // New state for other reports
  const [productReport, setProductReport] = useState<ProductReportItem[]>([]);
  const [customerReport, setCustomerReport] = useState<CustomerReportItem[]>([]);
  const [paymentReport, setPaymentReport] = useState<PaymentReportItem[]>([]);
  const [chartMetric, setChartMetric] = useState<'revenue' | 'orders'>('revenue');
  const [originalSalesData, setOriginalSalesData] = useState<{ name: string; revenue: number; orders: number }[]>([]);

  // Calculate date ranges based on selected period
  const getDateRanges = (range: string) => {
    const now = new Date();
    let currentStart: Date;
    const currentEnd: Date = new Date(now);
    let previousStart: Date;
    let previousEnd: Date;

    switch (range) {
      case '7days':
        currentStart = new Date(now);
        currentStart.setDate(currentStart.getDate() - 7);
        previousEnd = new Date(currentStart);
        previousStart = new Date(previousEnd);
        previousStart.setDate(previousStart.getDate() - 7);
        break;
      case '30days':
        currentStart = new Date(now);
        currentStart.setDate(currentStart.getDate() - 30);
        previousEnd = new Date(currentStart);
        previousStart = new Date(previousEnd);
        previousStart.setDate(previousStart.getDate() - 30);
        break;
      case '90days':
        currentStart = new Date(now);
        currentStart.setDate(currentStart.getDate() - 90);
        previousEnd = new Date(currentStart);
        previousStart = new Date(previousEnd);
        previousStart.setDate(previousStart.getDate() - 90);
        break;
      case 'year':
        currentStart = new Date(now.getFullYear(), 0, 1);
        previousEnd = new Date(currentStart);
        previousStart = new Date(now.getFullYear() - 1, 0, 1);
        previousEnd = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59);
        break;
      default:
        currentStart = new Date(now);
        currentStart.setDate(currentStart.getDate() - 30);
        previousEnd = new Date(currentStart);
        previousStart = new Date(previousEnd);
        previousStart.setDate(previousStart.getDate() - 30);
    }

    return { currentStart, currentEnd, previousStart, previousEnd };
  };

  const loadReportData = useCallback(async () => {
    try {
      setLoading(true);
      const { currentStart, currentEnd, previousStart, previousEnd } = getDateRanges(dateRange);
      
      // Get orders for both periods
      const [allOrdersData, statsData, productsData, customersData, paymentsData] = await Promise.all([
        coreApi.getOrders(),
        coreApi.get('/dashboard/stats'),
        reportService.getProductReport(),
        reportService.getCustomerReport(),
        reportService.getPaymentReport()
      ]);

      const allOrders = Array.isArray(allOrdersData) ? allOrdersData : ((allOrdersData as any)?.orders || []);
      
      // Calculate current period stats
      const currentOrders = allOrders.filter((order: any) => {
        const orderDate = new Date(order.createdAt);
        return orderDate >= currentStart && orderDate <= currentEnd;
      });
      
      const currentRevenue = currentOrders.reduce((sum: number, order: any) => sum + Number(order.total || 0), 0);
      const currentOrderCount = currentOrders.length;
      
      // Calculate previous period stats
      const previousOrders = allOrders.filter((order: any) => {
        const orderDate = new Date(order.createdAt);
        return orderDate >= previousStart && orderDate <= previousEnd;
      });
      
      const previousRevenue = previousOrders.reduce((sum: number, order: any) => sum + Number(order.total || 0), 0);
      const previousOrderCount = previousOrders.length;

      // Use product count and customer count from stats (these don't change by date range)
      setStats({
        ...statsData,
        revenue: currentRevenue,
        orderCount: currentOrderCount,
      });

      setPreviousStats({
        revenue: previousRevenue,
        orderCount: previousOrderCount,
        productCount: statsData.productCount, // Products don't have date-based comparison
        customerCount: statsData.customerCount, // Customers don't have date-based comparison
      });

      setProductReport(productsData);
      setCustomerReport(customersData);
      setPaymentReport(paymentsData);

      // Process orders data for charts (current period only)
      const chartData = processOrdersForChart(currentOrders);
      setOriginalSalesData(chartData);
      setSalesData(chartData);

    } catch (error) {
      console.error('Failed to load report data:', error);
      setStats({ orderCount: 0, revenue: 0, productCount: 0, customerCount: 0 });
      setPreviousStats({ orderCount: 0, revenue: 0, productCount: 0, customerCount: 0 });
      setSalesData([]);
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    loadReportData();
  }, [loadReportData, dateRange]);

  // Format date range display
  const formatDateRange = () => {
    const { currentStart, currentEnd } = getDateRanges(dateRange);
    const locale = i18n.language === 'ar' ? 'ar-SA' : 'en-US';
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    return `${currentStart.toLocaleDateString(locale, options)} - ${currentEnd.toLocaleDateString(locale, options)}`;
  };

  const processOrdersForChart = (orders: { createdAt: string; total: number }[]) => {
    const dataMap = new Map();
    const now = new Date();
    
    // Generate last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const key = `${date.getDate()}/${date.getMonth() + 1}`;
      dataMap.set(key, { name: key, revenue: 0, orders: 0 });
    }

    // Aggregate order data
    orders.forEach((order) => {
      const orderDate = new Date(order.createdAt);
      const key = `${orderDate.getDate()}/${orderDate.getMonth() + 1}`;
      if (dataMap.has(key)) {
        const data = dataMap.get(key);
        data.revenue += Number(order.total || 0);
        data.orders += 1;
      }
    });

    return Array.from(dataMap.values());
  };

  // Calculate percentage change
  const calculateChange = (current: number, previous: number): { change: number; trend: 'up' | 'down' } => {
    if (previous === 0) {
      return current > 0 ? { change: 100, trend: 'up' } : { change: 0, trend: 'up' };
    }
    const percentChange = ((current - previous) / previous) * 100;
    return {
      change: Math.abs(percentChange),
      trend: percentChange >= 0 ? 'up' : 'down',
    };
  };

  // Export reports to Excel
  const handleExportReports = useCallback(() => {
    const wb = utils.book_new();
    
    // Export Sales Report
    const salesExportData = originalSalesData.length > 0 ? originalSalesData : salesData;
    const salesExport = salesExportData.map((item, index) => ({
      Date: item.name,
      Revenue: item.revenue,
      Orders: item.orders,
    }));
    const salesWs = utils.json_to_sheet(salesExport);
    utils.book_append_sheet(wb, salesWs, 'Sales Report');

    // Export Products Report
    const productsData = productReport.map((product) => ({
      Product: product.name,
      Sales: product.salesCount,
      Revenue: product.revenue,
    }));
    const productsWs = utils.json_to_sheet(productsData);
    utils.book_append_sheet(wb, productsWs, 'Products Report');

    // Export Customers Report
    const customersData = customerReport.map((customer) => ({
      Name: customer.name,
      Email: customer.email,
      Orders: customer.orders,
      TotalSpent: customer.totalSpent,
    }));
    const customersWs = utils.json_to_sheet(customersData);
    utils.book_append_sheet(wb, customersWs, 'Customers Report');

    // Export Payments Report
    const paymentsData = paymentReport.map((payment) => ({
      Provider: payment.provider,
      Volume: payment.volume,
      Net: payment.net,
      Fees: payment.fees,
      Currency: payment.currency || 'SAR',
    }));
    const paymentsWs = utils.json_to_sheet(paymentsData);
    utils.book_append_sheet(wb, paymentsWs, 'Payments Report');

    // Generate filename with date range
    const { currentStart, currentEnd } = getDateRanges(dateRange);
    const filename = `reports_${currentStart.toISOString().split('T')[0]}_to_${currentEnd.toISOString().split('T')[0]}.xlsx`;
    
    writeFile(wb, filename);
  }, [dateRange, originalSalesData, salesData, productReport, customerReport, paymentReport]);

  // Listen for export event from header
  useEffect(() => {
    const handleExportEvent = () => {
      handleExportReports();
    };

    window.addEventListener('exportReports', handleExportEvent);
    return () => {
      window.removeEventListener('exportReports', handleExportEvent);
    };
  }, [handleExportReports]);

  const MetricCard = ({ 
    title, 
    value, 
    change, 
    trend, 
    icon: Icon 
  }: { 
    title: string; 
    value: string | number; 
    change?: number;
    trend?: 'up' | 'down';
    icon: React.ComponentType<{ className?: string }>;
  }) => (
    <Card className="border-l-4 border-l-cyan-500">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl font-bold">{value}</h3>
              {change !== undefined && (
                <div className={`flex items-center gap-1 text-sm font-medium ${
                  trend === 'up' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {trend === 'up' ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                  {Math.abs(change)}%
                </div>
              )}
            </div>
          </div>
          <div className="p-3 rounded-lg bg-cyan-500/10">
            <Icon className="h-5 w-5 text-cyan-600" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

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
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('dashboard.reports.title')}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {formatDateRange()}
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[200px]">
              <Calendar className="h-4 w-4 ml-2" />
              <SelectValue placeholder={t('dashboard.reports.selectDateRange', 'اختر الفترة')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">{t('dashboard.reports.last7Days')}</SelectItem>
              <SelectItem value="30days">{t('dashboard.reports.last30Days')}</SelectItem>
              <SelectItem value="90days">{t('dashboard.reports.last90Days')}</SelectItem>
              <SelectItem value="year">{t('dashboard.reports.thisYear')}</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            className="gap-2"
            onClick={handleExportReports}
          >
            <Download className="h-4 w-4" />
            {t('dashboard.reports.export')}
          </Button>
        </div>
      </div>

      {/* Report Type Tabs */}
      <Tabs value={reportType} onValueChange={setReportType} className="w-full">
        <TabsList className="grid w-full max-w-2xl grid-cols-4">
          <TabsTrigger value="sales">{t('dashboard.reports.sales')}</TabsTrigger>
          <TabsTrigger value="products">{t('dashboard.reports.products')}</TabsTrigger>
          <TabsTrigger value="customers">{t('dashboard.reports.customers')}</TabsTrigger>
          <TabsTrigger value="payments">{t('dashboard.reports.payments')}</TabsTrigger>
        </TabsList>

        {/* Sales Report */}
        <TabsContent value="sales" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <MetricCard
              title={t('dashboard.reports.totalSales')}
              value={`${stats?.revenue.toFixed(2) || '0.00'} ${t('common.currency', 'SAR')}`}
              {...(previousStats ? calculateChange(stats?.revenue || 0, previousStats.revenue) : {})}
              icon={DollarSign}
            />
            <MetricCard
              title={t('dashboard.reports.orders')}
              value={stats?.orderCount || 0}
              {...(previousStats ? calculateChange(stats?.orderCount || 0, previousStats.orderCount) : {})}
              icon={ShoppingCart}
            />
            <MetricCard
              title={t('dashboard.reports.products')}
              value={stats?.productCount || 0}
              icon={Package}
            />
            <MetricCard
              title={t('dashboard.reports.customers')}
              value={stats?.customerCount || 0}
              icon={Users}
            />
          </div>

          {/* Sales Chart */}
          <Card>
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{t('dashboard.reports.salesAnalysis')}</CardTitle>
                  <CardDescription>{t('dashboard.reports.salesAndRevenueTrends')}</CardDescription>
                </div>
                <Select 
                  value={chartMetric}
                  onValueChange={(value: 'revenue' | 'orders') => {
                    setChartMetric(value);
                    // Update chart based on selected metric
                    if (value === 'orders') {
                      const ordersData = originalSalesData.map(item => ({
                        ...item,
                        revenue: item.orders
                      }));
                      setSalesData(ordersData);
                    } else {
                      setSalesData(originalSalesData);
                    }
                  }}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="revenue">{t('dashboard.reports.revenue')}</SelectItem>
                    <SelectItem value="orders">{t('dashboard.reports.orders')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={salesData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" stroke="#888" fontSize={12} />
                  <YAxis stroke="#888" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#06b6d4" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorRevenue)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Products Report */}
        <TabsContent value="products" className="space-y-6">
          <Card>
            <CardHeader className="border-b">
              <CardTitle>{t('dashboard.reports.productPerformance')}</CardTitle>
              <CardDescription>{t('dashboard.reports.topSellingProducts')}</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-8">
                {productReport.map((product) => (
                  <div key={product.id} className="flex items-center">
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none">{product.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {product.salesCount} {t('dashboard.reports.sales')}
                      </p>
                    </div>
                    <div className="text-left font-medium">
                      {product.revenue.toFixed(2)} {t('common.currency')}
                    </div>
                  </div>
                ))}
                {productReport.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">{t('dashboard.reports.noProductData')}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Customers Report */}
        <TabsContent value="customers" className="space-y-6">
          <Card>
            <CardHeader className="border-b">
              <CardTitle>{t('dashboard.reports.topCustomers')}</CardTitle>
              <CardDescription>{t('dashboard.reports.topBuyers')}</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-8">
                {customerReport.map((customer) => (
                  <div key={customer.email} className="flex items-center">
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold mr-4 ml-4">
                      {customer.name.charAt(0)}
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none">{customer.name}</p>
                      <p className="text-sm text-muted-foreground">{customer.email}</p>
                    </div>
                    <div className="text-left">
                      <div className="font-medium">{customer.totalSpent.toFixed(2)} {t('common.currency')}</div>
                      <div className="text-xs text-muted-foreground">{customer.orders} {t('dashboard.reports.orders')}</div>
                    </div>
                  </div>
                ))}
                {customerReport.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">{t('dashboard.reports.noCustomerData')}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payments Report */}
        <TabsContent value="payments" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>{t('dashboard.reports.paymentDistribution')}</CardTitle>
                <CardDescription>{t('dashboard.reports.transactionVolumeByMethod')}</CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center">
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={paymentReport}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="volume"
                        nameKey="provider"
                      >
                        {paymentReport.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>{t('dashboard.reports.paymentSummary')}</CardTitle>
                <CardDescription>{t('dashboard.reports.feesAndNet')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-8">
                  {paymentReport.map((payment) => (
                    <div key={payment.provider} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{payment.provider}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{formatCurrency(payment.volume, payment.currency || 'SAR')}</div>
                        <div className="text-xs text-muted-foreground">
                          {t('dashboard.reports.net')}: {formatCurrency(payment.net, payment.currency || 'SAR')} | {t('dashboard.reports.fees')}: {formatCurrency(payment.fees, payment.currency || 'SAR')}
                        </div>
                      </div>
                    </div>
                  ))}
                  {paymentReport.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">{t('dashboard.reports.noPaymentData')}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
