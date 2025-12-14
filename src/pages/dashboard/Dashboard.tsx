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
  BarChart3,
  Store,
  ArrowRight,
  Sparkles,
  RefreshCw,
  Bell,
  Clock,
  ChevronRight
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
import { useAuth } from '@/contexts/AuthContext';
import { getLogoUrl, BRAND_NAME_AR } from '@/config/logo.config';

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

const StatCard = ({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  color 
}: { 
  title: string; 
  value: string | number; 
  icon: any; 
  trend: string;
  color: 'primary' | 'success' | 'secondary' | 'accent'
}) => {
  const colorClasses = {
    primary: 'from-primary to-primary/70 bg-primary/10',
    success: 'from-success to-success/70 bg-success/10',
    secondary: 'from-secondary to-secondary/70 bg-secondary/10',
    accent: 'from-accent to-accent/70 bg-accent/10'
  };

  const textColors = {
    primary: 'text-primary',
    success: 'text-success',
    secondary: 'text-secondary',
    accent: 'text-accent'
  };

  return (
    <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden border-border/50">
      <div className={`absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b ${colorClasses[color].split(' ')[0]} ${colorClasses[color].split(' ')[1]}`} />
      <CardContent className="p-5 md:p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground font-medium">{title}</p>
            <p className="text-2xl md:text-3xl font-heading font-bold text-foreground">{value}</p>
            <div className="flex items-center gap-1.5 text-xs font-medium text-success">
              <TrendingUp className="h-3.5 w-3.5" />
              <span>{trend}</span>
            </div>
          </div>
          <div className={`p-3 rounded-xl ${colorClasses[color].split(' ')[2]} group-hover:scale-110 transition-transform duration-300`}>
            <Icon className={`h-6 w-6 ${textColors[color]}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default function Dashboard() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('month');
  const [chartView, setChartView] = useState('visual');
  const logoUrl = getLogoUrl();
  
  const hasMarket = !!user?.tenantId;

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      
      const [statsData, ordersData] = await Promise.all([
        coreApi.get('/dashboard/stats'),
        coreApi.getOrders()
      ]);

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
        title: 'طلبات جديدة',
        message: `لديك ${pendingOrders.length} طلب جديد في انتظار المعالجة`,
        time: 'منذ دقيقة',
        read: false
      });
    }

    return notifs;
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; variant: 'soft-warning' | 'soft-primary' | 'soft-secondary' | 'soft-success' | 'soft-destructive' }> = {
      pending: { label: 'قيد الانتظار', variant: 'soft-warning' },
      processing: { label: 'قيد المعالجة', variant: 'soft-primary' },
      shipped: { label: 'تم الشحن', variant: 'soft-secondary' },
      delivered: { label: 'تم التوصيل', variant: 'soft-success' },
      cancelled: { label: 'ملغي', variant: 'soft-destructive' },
    };

    const { label, variant } = config[status] || config.pending;
    return <Badge variant={variant}>{label}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="text-center space-y-6">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
            <div className="relative w-20 h-20 mx-auto rounded-xl overflow-hidden bg-card border border-border shadow-lg">
              <img src={logoUrl} alt={BRAND_NAME_AR} className="w-full h-full object-contain p-2" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2">
              <RefreshCw className="h-5 w-5 animate-spin text-primary" />
              <p className="text-muted-foreground font-medium">جاري تحميل البيانات...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Market Setup Prompt */}
      {!hasMarket && (
        <Card className="border-2 border-dashed border-primary/40 bg-gradient-to-r from-primary/5 via-accent/5 to-secondary/5 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
          <CardContent className="p-6 md:p-8 relative">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="relative">
                <div className="absolute -inset-3 bg-gradient-to-r from-primary to-secondary rounded-2xl blur-lg opacity-40" />
                <div className="relative p-4 gradient-primary rounded-2xl shadow-xl">
                  <Store className="h-10 w-10 text-white" />
                </div>
              </div>
              <div className="flex-1 text-center md:text-right space-y-2">
                <h3 className="text-2xl font-heading font-bold">
                  {t('dashboard.setupPrompt.title', 'أنشئ متجرك الإلكتروني')}
                </h3>
                <p className="text-muted-foreground text-base max-w-xl">
                  {t('dashboard.setupPrompt.description', 'يمكنك إنشاء الصفحات والمحتوى الآن، ثم أكمل إعداد المتجر لاحقاً للحصول على نطاقك الخاص')}
                </p>
              </div>
              <Link to="/dashboard/market-setup">
                <Button size="lg" className="gradient-primary shadow-lg gap-2 font-semibold h-12 px-8">
                  <Sparkles className="h-5 w-5" />
                  {t('dashboard.setupPrompt.button', 'إعداد المتجر')}
                  <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-4 border-b">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg overflow-hidden bg-card border border-border shadow-sm">
              <img src={logoUrl} alt={BRAND_NAME_AR} className="w-full h-full object-contain p-1" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-heading font-bold gradient-text">
                لوحة التحكم
              </h1>
              <p className="text-muted-foreground text-sm">نظرة عامة على أداء متجرك</p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[160px] h-10 bg-card">
              <Calendar className="h-4 w-4 ml-2 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">آخر أسبوع</SelectItem>
              <SelectItem value="month">آخر شهر</SelectItem>
              <SelectItem value="year">آخر سنة</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" className="h-10 w-10" title="تحديث" onClick={() => loadDashboardData()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="h-10 w-10" title="تحميل التقرير">
            <Download className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="h-10 w-10" title="تصفية">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        <StatCard
          title="المحفوظ"
          value={stats?.saved || 0}
          icon={Bookmark}
          trend="+25.83%"
          color="primary"
        />
        <StatCard
          title={t('dashboard.main.totalCustomers')}
          value={stats?.visits || stats?.customerCount || 0}
          icon={Users}
          trend="+12.5%"
          color="success"
        />
        <StatCard
          title={t('dashboard.main.totalOrders')}
          value={stats?.orderCount || 0}
          icon={ShoppingCart}
          trend="+8.2%"
          color="secondary"
        />
        <StatCard
          title={t('dashboard.main.totalSales')}
          value={`${stats?.revenue?.toFixed(2) || '0.00'} ${t('common.currency')}`}
          icon={DollarSign}
          trend="+18.7%"
          color="accent"
        />
      </div>

      {/* Chart and Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 md:gap-6">
        {/* Sales Chart */}
        <Card className="lg:col-span-2 hover:shadow-lg transition-shadow border-border/50">
          <CardHeader className="border-b pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="text-lg font-heading flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  {t('dashboard.main.salesChart')}
                </CardTitle>
                <CardDescription className="mt-1">
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
              <Tabs value={chartView} onValueChange={setChartView}>
                <TabsList className="h-9 bg-muted/50">
                  <TabsTrigger value="visual" className="text-xs px-3">{t('dashboard.main.visual')}</TabsTrigger>
                  <TabsTrigger value="summary" className="text-xs px-3">{t('dashboard.main.summary')}</TabsTrigger>
                  <TabsTrigger value="detailed" className="text-xs px-3">{t('dashboard.main.detailed')}</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {chartView === 'visual' && (
              <ResponsiveContainer width="100%" height={320}>
                <AreaChart data={salesData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    stroke="hsl(var(--muted-foreground))" 
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))" 
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '12px',
                      boxShadow: 'var(--shadow-lg)',
                      fontSize: '12px'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorRevenue)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
            {chartView === 'summary' && (
              <div className="h-[320px] flex items-center justify-center text-muted-foreground">
                <div className="text-center space-y-3">
                  <div className="w-16 h-16 mx-auto rounded-xl bg-muted/50 flex items-center justify-center">
                    <BarChart3 className="h-8 w-8 opacity-50" />
                  </div>
                  <p className="text-sm">{t('dashboard.main.showSummary')}</p>
                </div>
              </div>
            )}
            {chartView === 'detailed' && (
              <div className="h-[320px] flex items-center justify-center text-muted-foreground">
                <div className="text-center space-y-3">
                  <div className="w-16 h-16 mx-auto rounded-xl bg-muted/50 flex items-center justify-center">
                    <BarChart3 className="h-8 w-8 opacity-50" />
                  </div>
                  <p className="text-sm">{t('dashboard.main.showDetailed')}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="border-border/50">
          <CardHeader className="border-b pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-heading flex items-center gap-2">
                <Bell className="h-5 w-5 text-secondary" />
                {t('dashboard.main.notifications')}
              </CardTitle>
              <Button variant="ghost" size="sm" className="text-xs h-8 text-muted-foreground hover:text-foreground">
                {t('dashboard.header.clearAll')}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y max-h-[380px] overflow-y-auto scrollbar-thin">
              {notifications.length === 0 ? (
                <div className="p-10 text-center text-muted-foreground">
                  <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-muted/50 flex items-center justify-center">
                    <Bell className="h-7 w-7 opacity-40" />
                  </div>
                  <p className="text-sm">{t('dashboard.main.noNotifications')}</p>
                </div>
              ) : (
                notifications.map((notif) => (
                  <div key={notif.id} className={`p-4 hover:bg-muted/30 transition-colors cursor-pointer ${!notif.read ? 'bg-primary/5' : ''}`}>
                    <div className="flex items-start gap-3">
                      <div className={`p-2.5 rounded-xl flex-shrink-0 ${
                        notif.type === 'order' ? 'bg-success/10' :
                        notif.type === 'stock' ? 'bg-warning/10' :
                        notif.type === 'review' ? 'bg-primary/10' :
                        'bg-secondary/10'
                      }`}>
                        {notif.type === 'order' && <ShoppingCart className="h-4 w-4 text-success" />}
                        {notif.type === 'stock' && <Package className="h-4 w-4 text-warning" />}
                        {notif.type === 'payment' && <DollarSign className="h-4 w-4 text-secondary" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold">{notif.title}</p>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{notif.message}</p>
                        <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {notif.time}
                        </div>
                      </div>
                      {!notif.read && (
                        <div className="w-2.5 h-2.5 bg-primary rounded-full flex-shrink-0 mt-1.5 animate-pulse" />
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
      <Card className="border-border/50">
        <CardHeader className="border-b pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-heading flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-accent" />
              {t('dashboard.main.recentOrders')}
            </CardTitle>
            <Link to="/dashboard/orders">
              <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80 text-xs h-8 gap-1">
                {t('dashboard.main.viewAll')}
                <ChevronRight className="h-4 w-4 rtl:rotate-180" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {recentOrders.length === 0 ? (
            <div className="p-16 text-center text-muted-foreground">
              <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-muted/50 flex items-center justify-center">
                <ShoppingCart className="h-8 w-8 opacity-40" />
              </div>
              <p className="text-sm">{t('dashboard.main.noOrders')}</p>
            </div>
          ) : (
            <div className="divide-y">
              {recentOrders.map((order) => (
                <div key={order.id} className="p-4 md:p-5 hover:bg-muted/30 transition-colors group">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="p-3 bg-accent/10 rounded-xl flex-shrink-0 group-hover:bg-accent/20 transition-colors">
                        <ShoppingCart className="h-5 w-5 text-accent" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm">
                          #{order.orderNumber || order.id.slice(0, 8)}
                        </p>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {order.customer?.name || t('dashboard.sidebar.customers')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 flex-shrink-0">
                      <div className="text-left hidden sm:block">
                        <p className="font-bold text-sm">
                          {order.total?.toFixed(2) || '0.00'} {t('common.currency')}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {new Date(order.createdAt).toLocaleDateString('ar-SA', { 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </p>
                      </div>
                      {getStatusBadge(order.status)}
                      <Link to={`/dashboard/orders/${order.id}`}>
                        <Button variant="ghost" size="icon-sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
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
