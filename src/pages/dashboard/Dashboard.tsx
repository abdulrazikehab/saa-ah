import { useEffect, useState, useCallback } from 'react';
import { coreApi } from '@/lib/api';
import { 
  ShoppingCart, 
  Users, 
  Package, 
  DollarSign,
  TrendingUp,
  Calendar,
  CalendarDays,
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
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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
import { formatNumber, formatCurrency, getCurrencySymbol } from '@/lib/currency-utils';
import { CurrencyIcon } from '@/components/currency/CurrencyIcon';
import { tenantService } from '@/services/tenant.service';
import type { Order } from '@/services/types';

interface Stats {
  orderCount: number;
  revenue: number;
  productCount: number;
  customerCount: number;
  visits: number;
  saved: number;
}

// Redefine locally only the fields we actually use from the backend response
// to avoid confusion, but keep it compatible with the imported Order type
interface DashboardOrder extends Partial<Order> {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  totalAmount: number;
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
  icon: React.ElementType; 
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
  const [recentOrders, setRecentOrders] = useState<DashboardOrder[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('month');
  const [chartView, setChartView] = useState('visual');
  const [displayMode, setDisplayMode] = useState<'normal' | 'cards' | 'navigation'>(
    (localStorage.getItem('dashboardDisplayMode') as 'normal' | 'cards' | 'navigation') || 'normal'
  );
  const logoUrl = getLogoUrl();
  
  // Custom date range states
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);
  
  const hasMarket = !!user?.tenantId;
  const [storeSubdomain, setStoreSubdomain] = useState<string>('default');
  const [currency, setCurrency] = useState<string>('SAR');
  const [currencySymbol, setCurrencySymbol] = useState<string>('ر.س');

  // Helper function to get date range
  const getDateRange = useCallback((range: string): { startDate: Date; endDate: Date; days: number } => {
    const now = new Date();
    const endDate = new Date(now);
    endDate.setHours(23, 59, 59, 999);
    
    let startDate = new Date(now);
    let days = 7;
    
    switch (range) {
      case 'today':
        startDate.setHours(0, 0, 0, 0);
        days = 1;
        break;
      case 'yesterday':
        startDate.setDate(startDate.getDate() - 1);
        startDate.setHours(0, 0, 0, 0);
        endDate.setDate(endDate.getDate() - 1);
        days = 1;
        break;
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        startDate.setHours(0, 0, 0, 0);
        days = 7;
        break;
      case 'month':
        startDate.setDate(startDate.getDate() - 30);
        startDate.setHours(0, 0, 0, 0);
        days = 30;
        break;
      case 'thisMonth':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        startDate.setHours(0, 0, 0, 0);
        days = now.getDate();
        break;
      case 'lastMonth':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        startDate.setHours(0, 0, 0, 0);
        endDate.setTime(new Date(now.getFullYear(), now.getMonth(), 0).getTime());
        endDate.setHours(23, 59, 59, 999);
        days = endDate.getDate();
        break;
      case 'quarter':
        startDate.setDate(startDate.getDate() - 90);
        startDate.setHours(0, 0, 0, 0);
        days = 90;
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        startDate.setHours(0, 0, 0, 0);
        days = Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        break;
      case 'custom':
        if (customStartDate && customEndDate) {
          startDate = new Date(customStartDate);
          startDate.setHours(0, 0, 0, 0);
          endDate.setTime(new Date(customEndDate).getTime());
          endDate.setHours(23, 59, 59, 999);
          days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        }
        break;
      default:
        startDate.setDate(startDate.getDate() - 30);
        startDate.setHours(0, 0, 0, 0);
        days = 30;
    }
    
    return { startDate, endDate, days };
  }, [customStartDate, customEndDate]);

  // Load currency from settings
  useEffect(() => {
    const loadCurrency = async () => {
      try {
        const config = await coreApi.get('/site-config', { requireAuth: true });
        if (config && typeof config === 'object' && config.settings?.currency) {
          const currencyCode = String(config.settings.currency);
          if (currencyCode && currencyCode.length <= 10) {
            setCurrency(currencyCode);
            setCurrencySymbol(getCurrencySymbol(currencyCode));
            
            // Try to get currency symbol from currencies API
            try {
              const currencies = await coreApi.get('/currencies', { requireAuth: true });
              if (Array.isArray(currencies)) {
                const currencyData = currencies.find((c: { code: string; symbol?: string }) => c?.code === currencyCode);
                if (currencyData?.symbol && typeof currencyData.symbol === 'string') {
                  setCurrencySymbol(currencyData.symbol);
                }
              }
            } catch (err) {
              // Use fallback symbol
            }
          }
        }
      } catch (error) {
        console.error('Failed to load currency:', error);
        setCurrency('SAR');
        setCurrencySymbol('ر.س');
      }
    };
    loadCurrency();
  }, []);

  // Load tenant subdomain from API (most reliable)
  useEffect(() => {
    const loadTenantSubdomain = async () => {
      try {
        // First, try to get subdomain from tenant API (most reliable)
        const tenant = await tenantService.getCurrentUserTenant();
        if (tenant?.subdomain) {
          console.log('✅ Using subdomain from tenant API:', tenant.subdomain);
          setStoreSubdomain(tenant.subdomain);
          return;
        }
        
        // Fallback: Try to get from site-config
        try {
          const config = await coreApi.get('/site-config', { requireAuth: true });
          if (config?.settings?.subdomain) {
            console.log('✅ Using subdomain from site-config:', config.settings.subdomain);
            setStoreSubdomain(config.settings.subdomain);
            return;
          }
        } catch (configError) {
          console.warn('⚠️ Failed to load subdomain from site-config:', configError);
        }
        
        // Fallback: Use user's tenantSubdomain if available
        if (user?.tenantSubdomain) {
          console.log('✅ Using subdomain from user context:', user.tenantSubdomain);
          setStoreSubdomain(user.tenantSubdomain);
          return;
        }
        
        // Last fallback: Extract subdomain from current hostname (only if it's not a tenant ID)
        const hostname = window.location.hostname;
        if (hostname.includes('.localhost')) {
          const subdomain = hostname.split('.localhost')[0];
          if (subdomain && subdomain !== 'www' && subdomain !== 'localhost' && !subdomain.startsWith('tenant-')) {
            console.log('✅ Using extracted subdomain from hostname:', subdomain);
            setStoreSubdomain(subdomain);
            return;
          }
        }
        
        console.warn('⚠️ Could not determine subdomain. Using default.');
      } catch (error) {
        console.error('❌ Failed to load tenant subdomain:', error);
        // Fallback: Use user's tenantSubdomain or extract from hostname
        if (user?.tenantSubdomain) {
          setStoreSubdomain(user.tenantSubdomain);
        } else {
          const hostname = window.location.hostname;
          if (hostname.includes('.localhost')) {
            const subdomain = hostname.split('.localhost')[0];
            if (subdomain && subdomain !== 'www' && subdomain !== 'localhost') {
              setStoreSubdomain(subdomain);
            }
          }
        }
      }
    };
    
    loadTenantSubdomain();
  }, [user?.tenantSubdomain]);


  const generateChartData = useCallback((orders: DashboardOrder[], range: string): SalesData[] => {
    const { startDate, endDate, days } = getDateRange(range);
    const dataMap = new Map<string, SalesData>();
    
    // Determine grouping based on date range
    let groupBy: 'day' | 'week' | 'month' = 'day';
    if (days > 90) {
      groupBy = 'month';
    } else if (days > 30) {
      groupBy = 'week';
    }
    
    // Generate date keys for the range
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      let key: string;
      if (groupBy === 'month') {
        key = `${currentDate.getMonth() + 1}/${currentDate.getFullYear()}`;
      } else if (groupBy === 'week') {
        const weekNum = Math.ceil(currentDate.getDate() / 7);
        key = `W${weekNum} ${currentDate.getMonth() + 1}`;
      } else {
        key = `${currentDate.getDate()}/${currentDate.getMonth() + 1}`;
      }
      
      if (!dataMap.has(key)) {
        dataMap.set(key, { name: key, revenue: 0, orders: 0 });
      }
      
      // Move to next period
      if (groupBy === 'month') {
        currentDate.setMonth(currentDate.getMonth() + 1);
      } else if (groupBy === 'week') {
        currentDate.setDate(currentDate.getDate() + 7);
      } else {
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }

    // Aggregate orders into the date buckets
    orders.forEach(order => {
      if (order && order.createdAt && order.totalAmount !== undefined) {
        const orderDate = new Date(order.createdAt);
        
        // Skip orders outside the date range
        if (orderDate < startDate || orderDate > endDate) return;
        
        let key: string;
        if (groupBy === 'month') {
          key = `${orderDate.getMonth() + 1}/${orderDate.getFullYear()}`;
        } else if (groupBy === 'week') {
          const weekNum = Math.ceil(orderDate.getDate() / 7);
          key = `W${weekNum} ${orderDate.getMonth() + 1}`;
        } else {
          key = `${orderDate.getDate()}/${orderDate.getMonth() + 1}`;
        }
        
        if (dataMap.has(key)) {
          const data = dataMap.get(key)!;
          data.revenue += Number(order.totalAmount) || 0;
          data.orders += 1;
        }
      }
    });

    return Array.from(dataMap.values());
  }, [getDateRange]);

  const generateNotifications = useCallback((orders: DashboardOrder[], stats: Stats): Notification[] => {
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
  }, [t]);

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Get date range for filtering
      const { startDate, endDate } = getDateRange(dateRange);
      
      const [statsData, ordersData] = await Promise.all([
        coreApi.get('/dashboard/stats'),
        coreApi.getOrders({ 
          limit: 500, 
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        })
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
      let orders: DashboardOrder[] = [];
      if (ordersData) {
        if (Array.isArray(ordersData)) {
          orders = ordersData as DashboardOrder[];
        } else if (typeof ordersData === 'object' && ordersData !== null && 'data' in ordersData) {
          orders = (ordersData as { data: DashboardOrder[] }).data;
        }
      }
      
      // Filter out invalid items
      orders = orders.filter((o: DashboardOrder) => o && typeof o === 'object' && !('error' in (o as unknown as Record<string, unknown>)));
      
      setRecentOrders(orders.slice(0, 5));

      const chartData = generateChartData(orders, dateRange);
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
  }, [generateChartData, generateNotifications, getDateRange, dateRange]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData, dateRange, customStartDate, customEndDate]);

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
      {/* Store Dashboard Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-border/40">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {t('dashboard.overview.welcomeStore', 'مرحباً بك في متجرك')}
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            {t('dashboard.overview.subtitle', 'نظرة عامة على أداء متجرك اليوم')}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
             <a 
               href={`${window.location.protocol}//${storeSubdomain}.${
                 window.location.hostname.includes('localhost') || window.location.hostname.includes('127.0.0.1') 
                   ? 'localhost' 
                   : window.location.hostname.replace('www.', '').split('.').slice(-2).join('.')
               }${window.location.port ? `:${window.location.port}` : ''}`}
               target="_blank"
               rel="noopener noreferrer"
             >
              <Button variant="outline" className="gap-2 h-11 border-primary/20 hover:bg-primary/5 hover:text-primary transition-colors">
                <Store className="h-4 w-4" />
                {t('dashboard.header.viewStore', 'زيارة المتجر')}
              </Button>
            </a>
        </div>
      </div>

      {hasMarket && !stats?.revenue && !stats?.orderCount && !loading ? (
           <div className="bg-gradient-to-br from-primary/5 to-secondary/5 rounded-2xl p-8 border border-primary/10 text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-md">
                 <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold">{t('dashboard.overview.emptyTitle', 'متجرك جاهز للانطلاق!')}</h3>
              <p className="text-muted-foreground max-w-lg mx-auto">
                 {t('dashboard.overview.emptyDesc', 'يبدو أنك لم تتلق أي طلبات بعد. ابدأ بمشاركة رابط متجرك على وسائل التواصل الاجتماعي وتسويق منتجاتك.')}
              </p>
           </div>
      ) : null}

      {/* Main Stats Grid - Store Style */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="rounded-xl border border-border/50 bg-card relative overflow-hidden">

           <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-4">
                 <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-xl">
                    <CurrencyIcon currencyCode={currency} size={24} />
                 </div>
                 <span className="text-sm font-medium text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    +12.5%
                 </span>
              </div>
              <div>
                 <p className="text-sm font-medium text-muted-foreground">{t('dashboard.main.totalSales')}</p>
                 <h2 className="text-3xl font-bold mt-1 text-foreground">{formatCurrency(stats?.revenue || 0, currency)}</h2>
              </div>
           </CardContent>
        </Card>

        <Card className="rounded-xl border border-border/50 bg-card relative overflow-hidden">

           <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-4">
                 <div className="p-3 bg-blue-500/10 text-blue-600 rounded-xl">
                    <ShoppingCart className="h-6 w-6" />
                 </div>
                 <span className="text-sm font-medium text-blue-600 bg-blue-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    +5.2%
                 </span>
              </div>
              <div>
                 <p className="text-sm font-medium text-muted-foreground">{t('dashboard.main.totalOrders')}</p>
                 <h2 className="text-3xl font-bold mt-1 text-foreground">{formatNumber(stats?.orderCount || 0)}</h2>
              </div>
           </CardContent>
        </Card>

        <Card className="rounded-xl border border-border/50 bg-card relative overflow-hidden">

           <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-4">
                 <div className="p-3 bg-violet-500/10 text-violet-600 rounded-xl">
                    <Package className="h-6 w-6" />
                 </div>
              </div>
              <div>
                 <p className="text-sm font-medium text-muted-foreground">{t('dashboard.main.totalProducts')}</p>
                 <h2 className="text-3xl font-bold mt-1 text-foreground">{formatNumber(stats?.productCount || 0)}</h2>
              </div>
           </CardContent>
        </Card>

        <Card className="rounded-xl border border-border/50 bg-card relative overflow-hidden">

           <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-4">
                 <div className="p-3 bg-amber-500/10 text-amber-600 rounded-xl">
                    <Users className="h-6 w-6" />
                 </div>
              </div>
              <div>
                 <p className="text-sm font-medium text-muted-foreground">{t('dashboard.main.totalCustomers')}</p>
                 <h2 className="text-3xl font-bold mt-1 text-foreground">{formatNumber(stats?.customerCount || 0)}</h2>
              </div>
           </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         {/* Main Chart */}
         <Card className="lg:col-span-2 shadow-sm border-border/50">
            <CardHeader>
               <div className="flex items-center justify-between flex-wrap gap-2">
                  <CardTitle className="text-lg font-bold">
                     {t('dashboard.main.salesOverview', 'تحليل المبيعات')}
                  </CardTitle>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Select value={dateRange} onValueChange={setDateRange}>
                       <SelectTrigger className="w-[140px] h-9">
                          <CalendarDays className="h-4 w-4 mr-2 text-muted-foreground" />
                          <SelectValue />
                       </SelectTrigger>
                       <SelectContent>
                          <SelectItem value="today">{t('dashboard.dateFilter.today', 'اليوم')}</SelectItem>
                          <SelectItem value="yesterday">{t('dashboard.dateFilter.yesterday', 'أمس')}</SelectItem>
                          <SelectItem value="week">{t('dashboard.dateFilter.last7Days', 'آخر 7 أيام')}</SelectItem>
                          <SelectItem value="month">{t('dashboard.dateFilter.last30Days', 'آخر 30 يوم')}</SelectItem>
                          <SelectItem value="thisMonth">{t('dashboard.dateFilter.thisMonth', 'هذا الشهر')}</SelectItem>
                          <SelectItem value="lastMonth">{t('dashboard.dateFilter.lastMonth', 'الشهر الماضي')}</SelectItem>
                          <SelectItem value="quarter">{t('dashboard.dateFilter.last3Months', 'آخر 3 أشهر')}</SelectItem>
                          <SelectItem value="year">{t('dashboard.dateFilter.thisYear', 'هذا العام')}</SelectItem>
                          <SelectItem value="custom">{t('dashboard.dateFilter.custom', 'تاريخ مخصص')}</SelectItem>
                       </SelectContent>
                    </Select>
                    
                    {/* Custom Date Picker */}
                    {dateRange === 'custom' && (
                      <div className="flex items-center gap-2">
                        <Input
                          type="date"
                          value={customStartDate}
                          onChange={(e) => setCustomStartDate(e.target.value)}
                          className="h-9 w-[130px] text-sm"
                        />
                        <span className="text-muted-foreground text-sm">-</span>
                        <Input
                          type="date"
                          value={customEndDate}
                          onChange={(e) => setCustomEndDate(e.target.value)}
                          className="h-9 w-[130px] text-sm"
                        />
                      </div>
                    )}
                  </div>
               </div>
            </CardHeader>
            <CardContent>
               <div className="h-[300px] w-full mt-2">
                 <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={salesData}>
                       <defs>
                          <linearGradient id="colorStoreData" x1="0" y1="0" x2="0" y2="1">
                             <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2}/>
                             <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                          </linearGradient>
                       </defs>
                       <XAxis 
                          dataKey="name" 
                          stroke="#888888" 
                          fontSize={12} 
                          tickLine={false} 
                          axisLine={false} 
                       />
                       <YAxis 
                          stroke="#888888" 
                          fontSize={12} 
                          tickLine={false} 
                          axisLine={false} 
                          tickFormatter={(value) => `${value}`}
                       />
                       <Tooltip
                          contentStyle={{ 
                             backgroundColor: 'hsl(var(--card))',
                             borderColor: 'hsl(var(--border))',
                             boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                             borderRadius: '8px' 
                          }}
                       />
                       <Area 
                          type="monotone" 
                          dataKey="revenue" 
                          name={t('dashboard.main.revenue', 'المبيعات')}
                          stroke="hsl(var(--primary))" 
                          strokeWidth={3} 
                          fill="url(#colorStoreData)" 
                       />
                       <Area 
                          type="monotone" 
                          dataKey="orders" 
                          name={t('dashboard.main.orders', 'الطلبات')}
                          stroke="hsl(var(--secondary))" 
                          strokeWidth={2} 
                          fill="transparent"
                       />
                    </AreaChart>
                 </ResponsiveContainer>
               </div>
            </CardContent>
         </Card>

         {/* Pending Orders / Recent Activity */}
         <Card className="shadow-sm border-border/50 flex flex-col">
            <CardHeader className="border-b border-border/50 pb-4">
               <CardTitle className="text-lg font-bold flex items-center justify-between">
                  {t('dashboard.main.recentOrders', 'أحدث الطلبات')}
               </CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-auto max-h-[350px]">
               {recentOrders.length > 0 ? (
                  <div className="divide-y divide-border/50">
                     {recentOrders.map((order) => (
                        <div key={order.id} className="p-4 hover:bg-muted/40 transition-colors flex items-center justify-between">
                           <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                 <Package className="h-5 w-5" />
                              </div>
                              <div>
                                 <p className="font-semibold text-sm">#{order.orderNumber}</p>
                                 <p className="text-xs text-muted-foreground">{order.customerName || order.customerEmail}</p>
                              </div>
                           </div>
                           <div className="text-right">
                              <p className="font-bold text-sm">{formatCurrency(order.totalAmount)}</p>
                              <div className="flex justify-end mt-1">
                                 {getStatusBadge(order.status)}
                              </div>
                           </div>
                        </div>
                     ))}
                  </div>
               ) : (
                  <div className="h-full flex flex-col items-center justify-center p-6 text-muted-foreground">
                     <ShoppingCart className="h-10 w-10 mb-2 opacity-20" />
                     <p>{t('dashboard.main.noOrders')}</p>
                  </div>
               )}
            </CardContent>
            <div className="p-3 border-t border-border/50 bg-muted/20">
               <Link to="/dashboard/orders">
                 <Button variant="ghost" className="w-full text-xs h-8">
                    {t('dashboard.main.viewAll', 'عرض الكل')}
                    <ArrowRight className="ml-2 h-3 w-3 rtl:rotate-180" />
                 </Button>
               </Link>
            </div>
         </Card>
      </div>

      {displayMode === 'navigation' && (
         <div className="mt-8">
            <h2 className="text-xl font-bold mb-4">{t('dashboard.main.shortcuts', 'اختصارات سريعة')}</h2>
            <DashboardNavigationCards />
         </div>
      )}
    </div>
  );
}
