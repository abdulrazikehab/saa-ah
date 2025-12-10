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

const COLORS = ['#06b6d4', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState('30days');
  const [reportType, setReportType] = useState('sales');
  const [loading, setLoading] = useState(true);
  const [salesData, setSalesData] = useState<{ name: string; revenue: number; orders: number }[]>([]);
  const [stats, setStats] = useState<{ orderCount: number; revenue: number; productCount: number; customerCount: number } | null>(null);
  
  // New state for other reports
  const [productReport, setProductReport] = useState<ProductReportItem[]>([]);
  const [customerReport, setCustomerReport] = useState<CustomerReportItem[]>([]);
  const [paymentReport, setPaymentReport] = useState<PaymentReportItem[]>([]);

  const loadReportData = useCallback(async () => {
    try {
      setLoading(true);
      const [statsData, ordersData, productsData, customersData, paymentsData] = await Promise.all([
        coreApi.get('/dashboard/stats'),
        coreApi.getOrders(),
        reportService.getProductReport(),
        reportService.getCustomerReport(),
        reportService.getPaymentReport()
      ]);

      setStats(statsData);
      setProductReport(productsData);
      setCustomerReport(customersData);
      setPaymentReport(paymentsData);

      // Process orders data for charts
      const orders = Array.isArray(ordersData) ? ordersData : ((ordersData as any)?.orders || []);
      const chartData = processOrdersForChart(orders);
      setSalesData(chartData);

    } catch (error) {
      console.error('Failed to load report data:', error);
      setStats({ orderCount: 0, revenue: 0, productCount: 0, customerCount: 0 });
      setSalesData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReportData();
  }, [loadReportData, dateRange]);

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
          <p className="text-muted-foreground">جاري تحميل التقارير...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">التقارير</h1>
          <p className="text-sm text-gray-500 mt-1">
            نوفمبر 1, 2025 - نوفمبر 30, 2025
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[200px]">
              <Calendar className="h-4 w-4 ml-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">آخر 7 أيام</SelectItem>
              <SelectItem value="30days">آخر 30 يوم</SelectItem>
              <SelectItem value="90days">آخر 90 يوم</SelectItem>
              <SelectItem value="year">هذا العام</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            تصدير
          </Button>
        </div>
      </div>

      {/* Report Type Tabs */}
      <Tabs value={reportType} onValueChange={setReportType} className="w-full">
        <TabsList className="grid w-full max-w-2xl grid-cols-4">
          <TabsTrigger value="sales">المبيعات</TabsTrigger>
          <TabsTrigger value="products">المنتجات</TabsTrigger>
          <TabsTrigger value="customers">العملاء</TabsTrigger>
          <TabsTrigger value="payments">المدفوعات</TabsTrigger>
        </TabsList>

        {/* Sales Report */}
        <TabsContent value="sales" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <MetricCard
              title="إجمالي المبيعات"
              value={`${stats?.revenue.toFixed(2) || '0.00'} ريال`}
              change={25.83}
              trend="up"
              icon={DollarSign}
            />
            <MetricCard
              title="الطلبات"
              value={stats?.orderCount || 0}
              change={25.83}
              trend="up"
              icon={ShoppingCart}
            />
            <MetricCard
              title="المنتجات"
              value={stats?.productCount || 0}
              change={24.94}
              trend="up"
              icon={Package}
            />
            <MetricCard
              title="العملاء"
              value={stats?.customerCount || 0}
              icon={Users}
            />
          </div>

          {/* Sales Chart */}
          <Card>
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>تحليل المبيعات</CardTitle>
                  <CardDescription>اتجاهات المبيعات والإيرادات</CardDescription>
                </div>
                <Select defaultValue="revenue">
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="revenue">الإيرادات</SelectItem>
                    <SelectItem value="orders">الطلبات</SelectItem>
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
              <CardTitle>أداء المنتجات</CardTitle>
              <CardDescription>المنتجات الأكثر مبيعاً والأعلى إيراداً</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-8">
                {productReport.map((product) => (
                  <div key={product.id} className="flex items-center">
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none">{product.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {product.salesCount} مبيعات
                      </p>
                    </div>
                    <div className="text-left font-medium">
                      {product.revenue.toFixed(2)} ريال
                    </div>
                  </div>
                ))}
                {productReport.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">لا توجد بيانات للمنتجات</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Customers Report */}
        <TabsContent value="customers" className="space-y-6">
          <Card>
            <CardHeader className="border-b">
              <CardTitle>أفضل العملاء</CardTitle>
              <CardDescription>العملاء الأكثر شراءً</CardDescription>
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
                      <div className="font-medium">{customer.totalSpent.toFixed(2)} ريال</div>
                      <div className="text-xs text-muted-foreground">{customer.orders} طلبات</div>
                    </div>
                  </div>
                ))}
                {customerReport.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">لا توجد بيانات للعملاء</p>
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
                <CardTitle>توزيع طرق الدفع</CardTitle>
                <CardDescription>حجم المعاملات حسب طريقة الدفع</CardDescription>
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
                <CardTitle>ملخص المدفوعات</CardTitle>
                <CardDescription>تفاصيل الرسوم والصافي</CardDescription>
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
                        <div className="font-bold">{payment.volume.toFixed(2)} ريال</div>
                        <div className="text-xs text-muted-foreground">
                          صافي: {payment.net.toFixed(2)} | رسوم: {payment.fees.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ))}
                  {paymentReport.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">لا توجد بيانات للمدفوعات</p>
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
