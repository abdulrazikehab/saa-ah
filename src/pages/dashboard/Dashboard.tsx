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
import { CardsDashboard } from '@/components/cards-template';
import { DashboardNavigationCards } from '@/components/dashboard/DashboardNavigationCards';
import { LayoutGrid, List, Compass } from 'lucide-react';

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
  const [displayMode, setDisplayMode] = useState<'normal' | 'cards' | 'navigation'>(
    (localStorage.getItem('dashboardDisplayMode') as 'normal' | 'cards' | 'navigation') || 'normal'
  );
  const logoUrl = getLogoUrl();
  
  const hasMarket = !!user?.tenantId;

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      
      const [statsData, ordersData] = await Promise.all([
        coreApi.get('/dashboard/stats'),
        coreApi.getOrders()
      ]);

      // Validate statsData is not an error object
      let validStats: Stats | null = null;
      if (statsData && typeof statsData === 'object' && !('error' in statsData) && !('statusCode' in statsData)) {
        validStats = {
          orderCount: Number(statsData.orderCount) || 0,
          revenue: Number(statsData.revenue) || 0,
          productCount: Number(statsData.productCount) || 0,
          customerCount: Number(statsData.customerCount) || 0,
          visits: Number(statsData.visits) || 0,
          saved: Number(statsData.saved) || 0
        };
      } else {
        validStats = {
          orderCount: 0,
          revenue: 0,
          productCount: 0,
          customerCount: 0,
          visits: 0,
          saved: 0
        };
      }
      
      setStats(validStats);
      
      // Validate ordersData
      let orders: Order[] = [];
      if (ordersData && typeof ordersData === 'object') {
        if (Array.isArray(ordersData)) {
          orders = ordersData.filter((o: any) => o && typeof o === 'object' && !('error' in o));
        } else if (ordersData.orders && Array.isArray(ordersData.orders)) {
          orders = ordersData.orders.filter((o: any) => o && typeof o === 'object' && !('error' in o));
        }
      }
      
      setRecentOrders(orders.slice(0, 5));

      const chartData = generateChartData(orders);
      setSalesData(chartData);

      const notifs = generateNotifications(orders, validStats);
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
      if (order && order.createdAt && order.total !== undefined) {
        const orderDate = new Date(order.createdAt);
        const key = `${orderDate.getDate()}/${orderDate.getMonth() + 1}`;
        if (dataMap.has(key)) {
          const data = dataMap.get(key);
          data.revenue += Number(order.total) || 0;
          data.orders += 1;
        }
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
        title: t('dashboard.notifications.newOrders', 'New Orders'),
        message: t('dashboard.notifications.pendingOrdersMessage', 'You have {{count}} new order(s) pending', { count: pendingOrders.length }),
        time: t('dashboard.notifications.justNow', 'Just now'),
        read: false
      });
    }

    return notifs;
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { labelKey: string; defaultLabel: string; variant: 'soft-warning' | 'soft-primary' | 'soft-secondary' | 'soft-success' | 'soft-destructive' }> = {
      pending: { labelKey: 'dashboard.orders.pending', defaultLabel: 'Pending', variant: 'soft-warning' },
      processing: { labelKey: 'dashboard.orders.processing', defaultLabel: 'Processing', variant: 'soft-primary' },
      shipped: { labelKey: 'dashboard.orders.shipped', defaultLabel: 'Shipped', variant: 'soft-secondary' },
      delivered: { labelKey: 'dashboard.orders.delivered', defaultLabel: 'Delivered', variant: 'soft-success' },
      cancelled: { labelKey: 'dashboard.orders.cancelled', defaultLabel: 'Cancelled', variant: 'soft-destructive' },
    };

    const { labelKey, defaultLabel, variant } = config[status] || config.pending;
    return <Badge variant={variant}>{t(labelKey, defaultLabel)}</Badge>;
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
              <p className="text-muted-foreground font-medium">{t('common.loading', 'Loading data...')}</p>
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 pb-3 sm:pb-4 border-b">
        <div className="space-y-1">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-12 h-12 sm:w-20 sm:h-20 rounded-lg overflow-hidden bg-card border border-border shadow-sm flex-shrink-0">
              <img src={logoUrl} alt={BRAND_NAME_AR} className="w-full h-full object-contain p-1" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-heading font-bold gradient-text truncate">
                {t('dashboard.sidebar.dashboard', 'Dashboard')}
              </h1>
              <p className="text-muted-foreground text-xs sm:text-sm truncate">{t('dashboard.main.subtitle', 'Overview of your store performance')}</p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-full sm:w-[140px] md:w-[160px] h-9 sm:h-10 bg-card text-xs sm:text-sm">
              <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 ml-2 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">{t('dashboard.main.lastWeek', 'Last Week')}</SelectItem>
              <SelectItem value="month">{t('dashboard.main.lastMonth', 'Last Month')}</SelectItem>
              <SelectItem value="year">{t('dashboard.main.lastYear', 'Last Year')}</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" className="h-9 w-9 sm:h-10 sm:w-10 flex-shrink-0" title={t('common.refresh', 'Refresh')} onClick={() => loadDashboardData()}>
            <RefreshCw className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </Button>
          <Button variant="outline" size="icon" className="h-9 w-9 sm:h-10 sm:w-10 flex-shrink-0" title={t('dashboard.header.download', 'Download Report')}>
            <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </Button>
          <Button variant="outline" size="icon" className="h-9 w-9 sm:h-10 sm:w-10 flex-shrink-0" title={t('dashboard.header.filter', 'Filter')}>
            <Filter className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </Button>
          
          <div className="flex items-center bg-muted/50 rounded-lg p-1 ml-1 border border-border/50">
            <span className="text-[10px] font-bold px-2 text-muted-foreground hidden sm:inline-block uppercase tracking-wider">
              {t('dashboard.main.viewMode', 'العرض')}
            </span>
            <Button 
              variant={displayMode === 'normal' ? 'secondary' : 'ghost'} 
              size="sm" 
              className="h-7 px-2 sm:h-8 sm:px-3 flex items-center gap-2 transition-all" 
              onClick={() => {
                setDisplayMode('normal');
                localStorage.setItem('dashboardDisplayMode', 'normal');
              }}
              title={t('dashboard.main.normal')}
            >
              <List className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden md:inline text-xs font-medium">{t('dashboard.main.normal')}</span>
            </Button>
            <Button 
              variant={displayMode === 'cards' ? 'secondary' : 'ghost'} 
              size="sm" 
              className="h-7 px-2 sm:h-8 sm:px-3 flex items-center gap-2 transition-all" 
              onClick={() => {
                setDisplayMode('cards');
                localStorage.setItem('dashboardDisplayMode', 'cards');
              }}
              title={t('dashboard.main.cards')}
            >
              <LayoutGrid className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden md:inline text-xs font-medium">{t('dashboard.main.cards')}</span>
            </Button>
            <Button 
              variant={displayMode === 'navigation' ? 'secondary' : 'ghost'} 
              size="sm" 
              className="h-7 px-2 sm:h-8 sm:px-3 flex items-center gap-2 transition-all" 
              onClick={() => {
                setDisplayMode('navigation');
                localStorage.setItem('dashboardDisplayMode', 'navigation');
              }}
              title={t('dashboard.main.navigation', 'التنقل')}
            >
              <Compass className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden md:inline text-xs font-medium">{t('dashboard.main.navigation', 'التنقل')}</span>
            </Button>
          </div>
        </div>
      </div>

      {displayMode === 'normal' ? (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-5">
            <StatCard
              title={t('dashboard.main.totalSales')}
              value={`${stats?.revenue?.toFixed(2) || '0.00'} ${t('common.currency')}`}
              icon={DollarSign}
              trend="+18.7%"
              color="accent"
            />
            <StatCard
              title={t('dashboard.main.totalOrders')}
              value={stats?.orderCount || 0}
              icon={ShoppingCart}
              trend="+8.2%"
              color="secondary"
            />
            <StatCard
              title={t('dashboard.main.avgOrderValue')}
              value={`${(stats?.revenue && stats?.orderCount ? stats.revenue / stats.orderCount : 0).toFixed(2)} ${t('common.currency')}`}
              icon={TrendingUp}
              trend="+5.4%"
              color="primary"
            />
            
            <StatCard
              title={t('dashboard.main.totalCustomers')}
              value={stats?.customerCount || 0}
              icon={Users}
              trend="+12.5%"
              color="success"
            />
            <StatCard
              title={t('dashboard.main.visits')}
              value={stats?.visits || 0}
              icon={Eye}
              trend="+22.4%"
              color="secondary"
            />
            <StatCard
              title={t('dashboard.main.totalProducts')}
              value={stats?.productCount || 0}
              icon={Package}
              trend="+12.5%"
              color="accent"
            />
          </div>

          {/* Chart and Notifications */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
            {/* Sales Chart */}
            <Card className="lg:col-span-2 hover:shadow-lg transition-shadow border-border/50 overflow-hidden">
              <CardHeader className="border-b pb-3 sm:pb-4 px-3 sm:px-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-base sm:text-lg font-heading flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                      <span className="truncate">{t('dashboard.main.salesChart')}</span>
                    </CardTitle>
                    <CardDescription className="mt-1 text-xs sm:text-sm">
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
                    <TabsList className="h-8 sm:h-9 bg-muted/50">
                      <TabsTrigger value="visual" className="text-[10px] sm:text-xs px-2 sm:px-3">{t('dashboard.main.visual')}</TabsTrigger>
                      <TabsTrigger value="summary" className="text-[10px] sm:text-xs px-2 sm:px-3">{t('dashboard.main.summary')}</TabsTrigger>
                      <TabsTrigger value="detailed" className="text-[10px] sm:text-xs px-2 sm:px-3">{t('dashboard.main.detailed')}</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </CardHeader>
              <CardContent className="pt-4 sm:pt-6 px-3 sm:px-6">
                {chartView === 'visual' && (
                  <ResponsiveContainer width="100%" height={280} className="sm:h-[320px]">
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
            <Card className="border-border/50 overflow-hidden">
              <CardHeader className="border-b pb-3 sm:pb-4 px-3 sm:px-6">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-base sm:text-lg font-heading flex items-center gap-2">
                    <Bell className="h-4 w-4 sm:h-5 sm:w-5 text-secondary flex-shrink-0" />
                    <span className="truncate">{t('dashboard.main.notifications')}</span>
                  </CardTitle>
                  <Button variant="ghost" size="sm" className="text-[10px] sm:text-xs h-7 sm:h-8 text-muted-foreground hover:text-foreground flex-shrink-0">
                    {t('dashboard.header.clearAll')}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y max-h-[300px] sm:max-h-[380px] overflow-y-auto scrollbar-thin">
                  {notifications.length === 0 ? (
                    <div className="p-6 sm:p-10 text-center text-muted-foreground">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 mx-auto mb-3 sm:mb-4 rounded-xl bg-muted/50 flex items-center justify-center">
                        <Bell className="h-6 w-6 sm:h-7 sm:w-7 opacity-40" />
                      </div>
                      <p className="text-xs sm:text-sm">{t('dashboard.main.noNotifications')}</p>
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div key={notif.id} className={`p-3 sm:p-4 hover:bg-muted/30 transition-colors cursor-pointer ${!notif.read ? 'bg-primary/5' : ''}`}>
                        <div className="flex items-start gap-2 sm:gap-3">
                          <div className={`p-2 sm:p-2.5 rounded-xl flex-shrink-0 ${
                            notif.type === 'order' ? 'bg-success/10' :
                            notif.type === 'stock' ? 'bg-warning/10' :
                            notif.type === 'review' ? 'bg-primary/10' :
                            'bg-secondary/10'
                          }`}>
                            {notif.type === 'order' && <ShoppingCart className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-success" />}
                            {notif.type === 'stock' && <Package className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-warning" />}
                            {notif.type === 'payment' && <DollarSign className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-secondary" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs sm:text-sm font-semibold truncate">{String(notif.title || '')}</p>
                            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 line-clamp-2">{String(notif.message || '')}</p>
                            <div className="flex items-center gap-1.5 mt-2 text-[10px] sm:text-xs text-muted-foreground">
                              <Clock className="h-3 w-3 flex-shrink-0" />
                              <span className="truncate">{String(notif.time || '')}</span>
                            </div>
                          </div>
                          {!notif.read && (
                            <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-primary rounded-full flex-shrink-0 mt-1.5 animate-pulse" />
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
          <Card className="border-border/50 overflow-hidden">
            <CardHeader className="border-b pb-3 sm:pb-4 px-3 sm:px-6">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-base sm:text-lg font-heading flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5 text-accent flex-shrink-0" />
                  <span className="truncate">{t('dashboard.main.recentOrders')}</span>
                </CardTitle>
                <Link to="/dashboard/orders">
                  <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80 text-[10px] sm:text-xs h-7 sm:h-8 gap-1 flex-shrink-0">
                    {t('dashboard.main.viewAll')}
                    <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 rtl:rotate-180" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {recentOrders.length === 0 ? (
                <div className="p-10 sm:p-16 text-center text-muted-foreground">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 rounded-xl bg-muted/50 flex items-center justify-center">
                    <ShoppingCart className="h-6 w-6 sm:h-8 sm:w-8 opacity-40" />
                  </div>
                  <p className="text-xs sm:text-sm">{t('dashboard.main.noOrders')}</p>
                </div>
              ) : (
                <div className="divide-y">
                  {recentOrders.map((order) => (
                    <div key={order.id} className="p-3 sm:p-4 md:p-5 hover:bg-muted/30 transition-colors group">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                        <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                          <div className="p-2 sm:p-3 bg-accent/10 rounded-xl flex-shrink-0 group-hover:bg-accent/20 transition-colors">
                            <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5 text-accent" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-sm">
                              #{String(order.orderNumber || order.id?.slice(0, 8) || '')}
                            </p>
                            <p className="text-xs text-muted-foreground truncate mt-0.5">
                              {String(order.customer?.name || t('dashboard.sidebar.customers') || '')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
                          <div className="text-left">
                            <p className="font-bold text-xs sm:text-sm">
                              {Number(order.total || 0).toFixed(2)} {t('common.currency')}
                            </p>
                            <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
                              {order.createdAt ? new Date(order.createdAt).toLocaleDateString(i18n.language === 'ar' ? 'ar-SA' : 'en-US', { 
                                month: 'short', 
                                day: 'numeric' 
                              }) : '-'}
                            </p>
                          </div>
                          <div className="flex-shrink-0">{getStatusBadge(order.status)}</div>
                          <Link to={`/dashboard/orders/${order.id}`}>
                            <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
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
        </>
      ) : displayMode === 'cards' ? (
        <CardsDashboard stats={stats} />
      ) : (
        <DashboardNavigationCards />
      )}
    </div>
  );
}
