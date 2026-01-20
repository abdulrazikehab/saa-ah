import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  BarChart3, 
  Loader2,
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  Wallet,
  CreditCard,
  Package,
  Calendar,
  Download,
  ArrowUpRight,
  ArrowDownLeft
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { coreApi } from '@/lib/api';
import { toast } from 'sonner';
import { format, subDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';

interface ReportStats {
  totalOrders: number;
  totalRevenue: number;
  totalCards: number;
  averageOrderValue: number;
  ordersChange: number;
  revenueChange: number;
  cardsChange: number;
  aovChange: number;
}

interface TopProduct {
  id: string;
  name: string;
  nameAr?: string;
  quantity: number;
  revenue: number;
  brand?: {
    name: string;
    nameAr?: string;
  };
}

interface DailyStats {
  date: string;
  orders: number;
  revenue: number;
  cards: number;
}

interface TransactionSummary {
  type: string;
  count: number;
  total: number;
}

export default function CardsReports() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  
  const [period, setPeriod] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ReportStats | null>(null);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [transactionSummary, setTransactionSummary] = useState<TransactionSummary[]>([]);
  
  // Fetch report data
  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);
        
        // Calculate date range
        const endDate = new Date();
        let startDate = new Date();
        
        switch (period) {
          case 'week':
            startDate = subDays(endDate, 7);
            break;
          case 'month':
            startDate = subDays(endDate, 30);
            break;
          case 'quarter':
            startDate = subDays(endDate, 90);
            break;
          case 'year':
            startDate = subDays(endDate, 365);
            break;
        }
        
        const params = new URLSearchParams({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        });
        
        const [statsRes, productsRes, dailyRes, walletRes] = await Promise.all([
          coreApi.get(`/card-orders/stats?${params}`, { requireAuth: true }),
          coreApi.get(`/card-orders/top-products?${params}&limit=10`, { requireAuth: true }),
          coreApi.get(`/card-orders/daily-stats?${params}`, { requireAuth: true }),
          coreApi.get(`/wallet/summary?${params}`, { requireAuth: true }),
        ]);
        
        setStats(statsRes);
        setTopProducts(productsRes.data || []);
        setDailyStats(dailyRes.data || []);
        setTransactionSummary(walletRes.data || []);
      } catch (error) {
        console.error('Error fetching reports:', error);
        // Use mock data for now
        setStats({
          totalOrders: 0,
          totalRevenue: 0,
          totalCards: 0,
          averageOrderValue: 0,
          ordersChange: 0,
          revenueChange: 0,
          cardsChange: 0,
          aovChange: 0,
        });
        setTopProducts([]);
        setDailyStats([]);
        setTransactionSummary([]);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, [period]);

  // Format currency
  const formatCurrency = (amount: number, currency = 'SAR') => {
    return new Intl.NumberFormat(isRTL ? 'ar-SA' : 'en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'dd MMM', { locale: isRTL ? ar : enUS });
    } catch {
      return dateString;
    }
  };

  // Render change indicator
  const renderChange = (change: number) => {
    if (change === 0) return null;
    const isPositive = change > 0;
    return (
      <span className={cn(
        'flex items-center text-xs font-medium',
        isPositive ? 'text-green-600' : 'text-red-600'
      )}>
        {isPositive ? (
          <TrendingUp className="h-3 w-3 mr-1" />
        ) : (
          <TrendingDown className="h-3 w-3 mr-1" />
        )}
        {Math.abs(change).toFixed(1)}%
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BarChart3 className="h-6 w-6" />
          {isRTL ? 'تقارير البطاقات' : 'Cards Reports'}
        </h1>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={(v: any) => setPeriod(v)}>
            <SelectTrigger className="w-[180px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">{isRTL ? 'آخر أسبوع' : 'Last Week'}</SelectItem>
              <SelectItem value="month">{isRTL ? 'آخر شهر' : 'Last Month'}</SelectItem>
              <SelectItem value="quarter">{isRTL ? 'آخر 3 أشهر' : 'Last Quarter'}</SelectItem>
              <SelectItem value="year">{isRTL ? 'آخر سنة' : 'Last Year'}</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            {isRTL ? 'تصدير' : 'Export'}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {isRTL ? 'إجمالي الطلبات' : 'Total Orders'}
                </p>
                <p className="text-2xl font-bold mt-1">{stats?.totalOrders || 0}</p>
                {renderChange(stats?.ordersChange || 0)}
              </div>
              <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/20">
                <ShoppingCart className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {isRTL ? 'إجمالي المبيعات' : 'Total Revenue'}
                </p>
                <p className="text-2xl font-bold mt-1">
                  {formatCurrency(stats?.totalRevenue || 0)}
                </p>
                {renderChange(stats?.revenueChange || 0)}
              </div>
              <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/20">
                <Wallet className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {isRTL ? 'البطاقات المباعة' : 'Cards Sold'}
                </p>
                <p className="text-2xl font-bold mt-1">{stats?.totalCards || 0}</p>
                {renderChange(stats?.cardsChange || 0)}
              </div>
              <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900/20">
                <CreditCard className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {isRTL ? 'متوسط قيمة الطلب' : 'Avg. Order Value'}
                </p>
                <p className="text-2xl font-bold mt-1">
                  {formatCurrency(stats?.averageOrderValue || 0)}
                </p>
                {renderChange(stats?.aovChange || 0)}
              </div>
              <div className="p-3 rounded-full bg-orange-100 dark:bg-orange-900/20">
                <Package className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {isRTL ? 'أكثر المنتجات مبيعاً' : 'Top Selling Products'}
            </CardTitle>
            <CardDescription>
              {isRTL ? 'أفضل 10 منتجات حسب عدد المبيعات' : 'Top 10 products by sales'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {topProducts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>{isRTL ? 'لا توجد بيانات' : 'No data available'}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {topProducts.map((product, index) => (
                  <div key={product.id} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-semibold">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {isRTL ? product.nameAr || product.name : product.name}
                      </p>
                      {product.brand && (
                        <p className="text-xs text-muted-foreground">
                          {isRTL ? product.brand.nameAr || product.brand.name : product.brand.name}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{product.quantity}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(product.revenue)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Wallet Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {isRTL ? 'ملخص المحفظة' : 'Wallet Summary'}
            </CardTitle>
            <CardDescription>
              {isRTL ? 'إحصائيات المعاملات المالية' : 'Financial transactions summary'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {transactionSummary.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Wallet className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>{isRTL ? 'لا توجد بيانات' : 'No data available'}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {transactionSummary.map((item) => {
                  const isCredit = ['TOPUP', 'REFUND', 'BONUS'].includes(item.type);
                  return (
                    <div key={item.type} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          'p-2 rounded-full',
                          isCredit ? 'bg-green-100 dark:bg-green-900/20' : 'bg-red-100 dark:bg-red-900/20'
                        )}>
                          {isCredit ? (
                            <ArrowDownLeft className="h-4 w-4 text-green-600" />
                          ) : (
                            <ArrowUpRight className="h-4 w-4 text-red-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{item.type}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.count} {isRTL ? 'عملية' : 'transactions'}
                          </p>
                        </div>
                      </div>
                      <p className={cn(
                        'font-semibold',
                        isCredit ? 'text-green-600' : 'text-red-600'
                      )}>
                        {isCredit ? '+' : '-'}{formatCurrency(item.total)}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Daily Stats Chart (Placeholder - could use recharts) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {isRTL ? 'المبيعات اليومية' : 'Daily Sales'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {dailyStats.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <BarChart3 className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p>{isRTL ? 'لا توجد بيانات للفترة المحددة' : 'No data for selected period'}</p>
            </div>
          ) : (
            <div className="h-64 flex items-end gap-1">
              {dailyStats.map((day) => {
                const maxRevenue = Math.max(...dailyStats.map(d => d.revenue)) || 1;
                const height = (day.revenue / maxRevenue) * 100;
                
                return (
                  <div
                    key={day.date}
                    className="flex-1 flex flex-col items-center gap-1"
                    title={`${formatDate(day.date)}: ${formatCurrency(day.revenue)}`}
                  >
                    <div
                      className="w-full bg-primary/80 hover:bg-primary rounded-t transition-all cursor-pointer"
                      style={{ height: `${Math.max(height, 2)}%` }}
                    />
                    <span className="text-[10px] text-muted-foreground">
                      {formatDate(day.date)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

