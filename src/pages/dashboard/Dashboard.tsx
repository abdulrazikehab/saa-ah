import { useEffect, useState, useCallback } from 'react';
import { coreApi } from '@/lib/api';
import { 
  ShoppingCart, 
  Users, 
  Package, 
  DollarSign,
  TrendingUp,
  Calendar,
  Download,
  Eye,
  Filter,
  Bookmark,
  BarChart3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';

interface Stats {
  orderCount: number;
  revenue: number;
  productCount: number;
  customerCount: number;
  visits: number;
  saved: number;
}

interface Order {
  id: string;
  orderNumber: string;
  customer: { name: string; email: string };
  total: number;
  status: string;
  createdAt: string;
}

interface Notification {
  id: string;
  type: 'order' | 'stock' | 'payment' | 'review';
  title: string;
  message: string;
  time: string;
  read: boolean;
}

interface SalesData {
  name: string;
  revenue: number;
  orders: number;
}

export default function Dashboard() {
  const { t, i18n } = useTranslation();
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('month');
  const [chartView, setChartView] = useState('visual');

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      
      const [statsData, ordersData] = await Promise.all([
        coreApi.get('/dashboard/stats'),
        coreApi.getOrders()
      ]);

      // Add calculated fields
      setStats({
        ...statsData,
        visits: statsData.visits || 0,
        saved: statsData.saved || 0
      });
      
      const orders = Array.isArray(ordersData) ? ordersData : ((ordersData as any)?.orders || []);
      setRecentOrders(orders.slice(0, 5));

      const chartData = generateChartData(orders);
      setSalesData(chartData);

      const notifs = generateNotifications(orders, statsData);
      setNotifications(notifs);

    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      setStats({ 
        orderCount: 0, 
        revenue: 0, 
        productCount: 0, 
        customerCount: 0,
        visits: 0,
        saved: 0
      });
      setRecentOrders([]);
      setSalesData([]);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData, dateRange]);

  const generateChartData = (orders: Order[]): SalesData[] => {
    const dataMap = new Map();
    const now = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const key = `${date.getDate()}/${date.getMonth() + 1}`;
      dataMap.set(key, { name: key, revenue: 0, orders: 0 });
    }

    orders.forEach(order => {
      const orderDate = new Date(order.createdAt);
      const key = `${orderDate.getDate()}/${orderDate.getMonth() + 1}`;
      if (dataMap.has(key)) {
        const data = dataMap.get(key);
        data.revenue += order.total;
        data.orders += 1;
      }
    });

    return Array.from(dataMap.values());
  };

  const generateNotifications = (orders: Order[], stats: Stats): Notification[] => {
    const notifs: Notification[] = [];
    
    const pendingOrders = orders.filter(o => o.status === 'pending');
    if (pendingOrders.length > 0) {
      notifs.push({
        id: '1',
        type: 'order',
        title: 'طلب جديد',
        message: `لديك ${pendingOrders.length} طلب جديد في انتظار المعالجة`,
        time: 'منذ دقيقة',
        read: false
      });
    }

    return notifs;
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; className: string }> = {
      pending: { label: 'قيد الانتظار', className: 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20' },
      processing: { label: 'قيد المعالجة', className: 'bg-blue-500/10 text-blue-700 border-blue-500/20' },
      shipped: { label: 'تم الشحن', className: 'bg-purple-500/10 text-purple-700 border-purple-500/20' },
      delivered: { label: 'تم التوصيل', className: 'bg-green-500/10 text-green-700 border-green-500/20' },
      cancelled: { label: 'ملغي', className: 'bg-red-500/10 text-red-700 border-red-500/20' },
    };

    const { label, className } = config[status] || config.pending;
    return <Badge variant="outline" className={className}>{label}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-cyan-500 mx-auto" />
          <p className="text-muted-foreground">جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 pb-6 sm:pb-8">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:gap-4 pb-3 sm:pb-4 border-b">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
            لوحة التحكم
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">نظرة عامة على أداء متجرك</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-full sm:w-[180px] md:w-[200px] h-9">
              <Calendar className="h-4 w-4 ml-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">آخر أسبوع</SelectItem>
              <SelectItem value="month">آخر شهر</SelectItem>
              <SelectItem value="year">آخر سنة</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" className="h-9 w-9" title="تحميل التقرير">
            <Download className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="h-9 w-9" title="تصفية">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>



      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="border-r-4 border-r-cyan-500 hover:shadow-lg transition-all duration-300 hover:scale-[1.01] sm:hover:scale-[1.02]">
          <CardContent className="p-4 sm:p-5 md:p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1.5 sm:space-y-2 min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-muted-foreground font-medium">المحفوظ</p>
                <p className="text-2xl sm:text-3xl font-bold text-foreground truncate">{stats?.saved || 0}</p>
                <div className="flex items-center gap-1 text-[10px] sm:text-xs text-green-600 dark:text-green-400 font-medium">
                  <TrendingUp className="h-3 w-3 flex-shrink-0" />
                  <span>+25.83%</span>
                </div>
              </div>
              <div className="p-2 sm:p-3 bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 rounded-xl flex-shrink-0">
                <Bookmark className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-cyan-600 dark:text-cyan-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-r-4 border-r-green-500 hover:shadow-lg transition-all duration-300 hover:scale-[1.01] sm:hover:scale-[1.02]">
          <CardContent className="p-4 sm:p-5 md:p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1.5 sm:space-y-2 min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-muted-foreground font-medium">{t('dashboard.main.totalCustomers')}</p>
                <p className="text-2xl sm:text-3xl font-bold text-foreground truncate">{stats?.visits || stats?.customerCount || 0}</p>
                <div className="flex items-center gap-1 text-[10px] sm:text-xs text-green-600 dark:text-green-400 font-medium">
                  <TrendingUp className="h-3 w-3 flex-shrink-0" />
                  <span>+25.83%</span>
                </div>
              </div>
              <div className="p-2 sm:p-3 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl flex-shrink-0">
                <Users className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-r-4 border-r-purple-500 hover:shadow-lg transition-all duration-300 hover:scale-[1.01] sm:hover:scale-[1.02]">
          <CardContent className="p-4 sm:p-5 md:p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1.5 sm:space-y-2 min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-muted-foreground font-medium">{t('dashboard.main.totalOrders')}</p>
                <p className="text-2xl sm:text-3xl font-bold text-foreground truncate">{stats?.orderCount || 0}</p>
                <div className="flex items-center gap-1 text-[10px] sm:text-xs text-green-600 dark:text-green-400 font-medium">
                  <TrendingUp className="h-3 w-3 flex-shrink-0" />
                  <span>+25.83%</span>
                </div>
              </div>
              <div className="p-2 sm:p-3 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl flex-shrink-0">
                <ShoppingCart className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-r-4 border-r-blue-500 hover:shadow-lg transition-all duration-300 hover:scale-[1.01] sm:hover:scale-[1.02]">
          <CardContent className="p-4 sm:p-5 md:p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1.5 sm:space-y-2 min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-muted-foreground font-medium">{t('dashboard.main.totalSales')}</p>
                <p className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground truncate">{stats?.revenue.toFixed(2) || '0.00'} {t('common.currency')}</p>
                <div className="flex items-center gap-1 text-[10px] sm:text-xs text-green-600 dark:text-green-400 font-medium">
                  <TrendingUp className="h-3 w-3 flex-shrink-0" />
                  <span>+25.83%</span>
                </div>
              </div>
              <div className="p-2 sm:p-3 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl flex-shrink-0">
                <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart and Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Sales Chart */}
        <Card className="lg:col-span-2 hover:shadow-lg transition-shadow">
          <CardHeader className="border-b pb-3 sm:pb-4 px-4 sm:px-6 pt-4 sm:pt-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
              <div>
                <CardTitle className="text-base sm:text-lg font-semibold">{t('dashboard.main.salesChart')}</CardTitle>
                <CardDescription className="mt-1 text-xs">
                  {(() => {
                    const now = new Date();
                    const start = new Date(now.getFullYear(), now.getMonth(), 1);
                    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                    const locale = i18n.language === 'ar' ? 'ar-SA' : 'en-US';
                    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
                    return `${start.toLocaleDateString(locale, options)} - ${end.toLocaleDateString(locale, options)}`;
                  })()}
                </CardDescription>
              </div>
              <Tabs value={chartView} onValueChange={setChartView} className="w-full sm:w-auto">
                <TabsList className="h-8 sm:h-9 w-full sm:w-auto">
                  <TabsTrigger value="visual" className="text-[10px] sm:text-xs px-2 sm:px-3 flex-1 sm:flex-none">{t('dashboard.main.visual')}</TabsTrigger>
                  <TabsTrigger value="summary" className="text-[10px] sm:text-xs px-2 sm:px-3 flex-1 sm:flex-none">{t('dashboard.main.summary')}</TabsTrigger>
                  <TabsTrigger value="detailed" className="text-[10px] sm:text-xs px-2 sm:px-3 flex-1 sm:flex-none">{t('dashboard.main.detailed')}</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent className="pt-4 sm:pt-6 px-4 sm:px-6 pb-4 sm:pb-6">
            {chartView === 'visual' && (
              <ResponsiveContainer width="100%" height={250} className="sm:h-[300px]">
                <AreaChart data={salesData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    stroke="#888" 
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    stroke="#888" 
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                      fontSize: '12px'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#06b6d4" 
                    strokeWidth={2.5}
                    fillOpacity={1} 
                    fill="url(#colorRevenue)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
            {chartView === 'summary' && (
              <div className="h-[250px] sm:h-[300px] flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <BarChart3 className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">{t('dashboard.main.showSummary')}</p>
                </div>
              </div>
            )}
            {chartView === 'detailed' && (
              <div className="h-[250px] sm:h-[300px] flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <BarChart3 className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">{t('dashboard.main.showDetailed')}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader className="border-b pb-3 sm:pb-4 px-4 sm:px-6 pt-4 sm:pt-6">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base sm:text-lg">{t('dashboard.main.notifications')}</CardTitle>
              <Button variant="ghost" size="sm" className="text-[10px] sm:text-xs h-7 sm:h-8 px-2 sm:px-3">{t('dashboard.header.clearAll')}</Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y max-h-[300px] sm:max-h-[350px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-6 sm:p-8 text-center text-muted-foreground">
                  <p className="text-xs sm:text-sm">{t('dashboard.main.noNotifications')}</p>
                </div>
              ) : (
                notifications.map((notif) => (
                  <div key={notif.id} className={`p-3 sm:p-4 hover:bg-muted/50 transition-colors cursor-pointer ${!notif.read ? 'bg-cyan-50/30 dark:bg-cyan-900/10' : ''}`}>
                    <div className="flex items-start gap-2 sm:gap-3">
                      <div className={`p-1.5 sm:p-2 rounded-lg flex-shrink-0 ${
                        notif.type === 'order' ? 'bg-green-100 dark:bg-green-900/30' :
                        notif.type === 'stock' ? 'bg-yellow-100 dark:bg-yellow-900/30' :
                        notif.type === 'review' ? 'bg-blue-100 dark:bg-blue-900/30' :
                        'bg-purple-100 dark:bg-purple-900/30'
                      }`}>
                        {notif.type === 'order' && <ShoppingCart className="h-4 w-4 text-green-600" />}
                        {notif.type === 'stock' && <Package className="h-4 w-4 text-yellow-600" />}
                        {notif.type === 'payment' && <DollarSign className="h-4 w-4 text-purple-600" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-medium text-foreground">{notif.title}</p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 line-clamp-2">{notif.message}</p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground mt-1.5 sm:mt-2">{notif.time}</p>
                      </div>
                      {!notif.read && (
                        <div className="w-2 h-2 bg-cyan-500 rounded-full flex-shrink-0 mt-2" />
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader className="border-b pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{t('dashboard.main.recentOrders')}</CardTitle>
            <Button variant="ghost" size="sm" asChild className="text-cyan-600 hover:text-cyan-700 text-xs h-8">
              <Link to="/dashboard/orders">
                {t('dashboard.main.viewAll')}
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {recentOrders.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p className="text-sm">{t('dashboard.main.noOrders')}</p>
            </div>
          ) : (
            <div className="divide-y">
              {recentOrders.map((order) => (
                <div key={order.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="p-2.5 bg-gray-100 dark:bg-gray-700 rounded-lg flex-shrink-0">
                        <ShoppingCart className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 dark:text-white text-sm">
                          #{order.orderNumber || order.id.slice(0, 8)}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{order.customer?.name || t('dashboard.sidebar.customers')}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="text-left">
                        <p className="font-semibold text-gray-900 dark:text-white text-sm">
                          {order.total?.toFixed(2) || '0.00'} {t('common.currency')}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(order.createdAt).toLocaleDateString('ar-SA', { 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </p>
                      </div>
                      {getStatusBadge(order.status)}
                      <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                        <Link to={`/dashboard/orders/${order.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
