import { useEffect, useState, useCallback } from 'react';
import { 
  ShoppingCart, 
  Package, 
  DollarSign,
  TrendingUp,
  Calendar,
  Download,
  Heart,
  Wallet,
  RefreshCw,
  Clock,
  ChevronRight,
  Eye,
  Store,
  ArrowRight,
  Sparkles,
  CreditCard,
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { coreApi } from '@/lib/api';

interface BuyerStats {
  totalPurchases: number;
  totalSpent: number;
  activeSubscriptions: number;
  favoriteProducts: number;
  pendingOrders: number;
  downloadableProducts: number;
}

interface RecentOrder {
  id: string;
  orderNumber: string;
  total: number;
  status: string;
  createdAt: string;
  products: Array<{
    name: string;
    type: string;
  }>;
}

interface RecentProduct {
  id: string;
  name: string;
  type: 'file' | 'course' | 'subscription' | 'service';
  purchaseDate: string;
  status: 'active' | 'expired' | 'pending';
  thumbnailUrl?: string;
}

const StatCard = ({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  color,
  onClick
}: { 
  title: string; 
  value: string | number; 
  icon: React.ElementType; 
  trend?: string;
  color: 'primary' | 'success' | 'secondary' | 'accent';
  onClick?: () => void;
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
    <Card 
      className={`group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden border-border/50 ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <div className={`absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b ${colorClasses[color].split(' ')[0]} ${colorClasses[color].split(' ')[1]}`} />
      <CardContent className="p-5 md:p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground font-medium">{title}</p>
            <p className="text-2xl md:text-3xl font-heading font-bold text-foreground">{value}</p>
            {trend && (
              <div className="flex items-center gap-1.5 text-xs font-medium text-success">
                <TrendingUp className="h-3.5 w-3.5" />
                <span>{trend}</span>
              </div>
            )}
          </div>
          <div className={`p-3 rounded-xl ${colorClasses[color].split(' ')[2]} group-hover:scale-110 transition-transform duration-300`}>
            <Icon className={`h-6 w-6 ${textColors[color]}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const QuickActionCard = ({
  title,
  description,
  icon: Icon,
  href,
  color
}: {
  title: string;
  description: string;
  icon: React.ElementType;
  href: string;
  color: string;
}) => (
  <Link to={href}>
    <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer h-full">
      <CardContent className="p-5 flex items-center gap-4">
        <div className={`p-3 rounded-xl ${color} group-hover:scale-110 transition-transform`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-sm">{title}</h3>
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        </div>
        <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" />
      </CardContent>
    </Card>
  </Link>
);

export default function BuyerDashboard() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [stats, setStats] = useState<BuyerStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [recentProducts, setRecentProducts] = useState<RecentProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('month');

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch buyer stats - in real implementation, this would be an API call
      // const [statsData, ordersData, productsData] = await Promise.all([
      //   coreApi.get('/buyer/stats'),
      //   coreApi.get('/buyer/orders?limit=5'),
      //   coreApi.get('/buyer/products?limit=5')
      // ]);

      // Mock data for demonstration
      setStats({
        totalPurchases: 12,
        totalSpent: 1250.00,
        activeSubscriptions: 2,
        favoriteProducts: 8,
        pendingOrders: 1,
        downloadableProducts: 10
      });

      setRecentOrders([
        {
          id: '1',
          orderNumber: 'ORD-2024-001',
          total: 299.00,
          status: 'completed',
          createdAt: new Date().toISOString(),
          products: [{ name: 'دورة تصميم UI/UX', type: 'course' }]
        },
        {
          id: '2',
          orderNumber: 'ORD-2024-002',
          total: 49.00,
          status: 'pending',
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          products: [{ name: 'قالب ووردبريس احترافي', type: 'file' }]
        }
      ]);

      setRecentProducts([
        {
          id: '1',
          name: 'دورة تصميم UI/UX الاحترافية',
          type: 'course',
          purchaseDate: new Date().toISOString(),
          status: 'active'
        },
        {
          id: '2',
          name: 'قالب ووردبريس متجر إلكتروني',
          type: 'file',
          purchaseDate: new Date(Date.now() - 86400000 * 3).toISOString(),
          status: 'active'
        },
        {
          id: '3',
          name: 'اشتراك أدوات التصميم',
          type: 'subscription',
          purchaseDate: new Date(Date.now() - 86400000 * 10).toISOString(),
          status: 'active'
        }
      ]);

    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      setStats({ 
        totalPurchases: 0, 
        totalSpent: 0, 
        activeSubscriptions: 0,
        favoriteProducts: 0,
        pendingOrders: 0,
        downloadableProducts: 0
      });
      setRecentOrders([]);
      setRecentProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData, dateRange]);

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; variant: 'soft-warning' | 'soft-primary' | 'soft-secondary' | 'soft-success' | 'soft-destructive' }> = {
      pending: { label: 'قيد الانتظار', variant: 'soft-warning' },
      processing: { label: 'قيد المعالجة', variant: 'soft-primary' },
      completed: { label: 'مكتمل', variant: 'soft-success' },
      cancelled: { label: 'ملغي', variant: 'soft-destructive' },
      active: { label: 'نشط', variant: 'soft-success' },
      expired: { label: 'منتهي', variant: 'soft-destructive' },
    };

    const { label, variant } = config[status] || config.pending;
    return <Badge variant={variant}>{label}</Badge>;
  };

  const getProductTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      file: 'ملف',
      course: 'دورة',
      subscription: 'اشتراك',
      service: 'خدمة'
    };
    return types[type] || type;
  };

  const getProductTypeIcon = (type: string) => {
    switch (type) {
      case 'course': return <FileText className="h-4 w-4" />;
      case 'subscription': return <CreditCard className="h-4 w-4" />;
      case 'file': return <Download className="h-4 w-4" />;
      default: return <Package className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="text-center space-y-6">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
            <div className="relative w-20 h-20 mx-auto rounded-xl overflow-hidden bg-card border border-border shadow-lg flex items-center justify-center">
              <Package className="h-10 w-10 text-primary" />
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
      {/* Welcome Banner */}
      <Card className="border-2 border-dashed border-primary/40 bg-gradient-to-r from-primary/5 via-accent/5 to-secondary/5 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
        <CardContent className="p-6 md:p-8 relative">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="relative">
              <div className="absolute -inset-3 bg-gradient-to-r from-primary to-secondary rounded-2xl blur-lg opacity-40" />
              <div className="relative p-4 gradient-primary rounded-2xl shadow-xl">
                <Sparkles className="h-10 w-10 text-white" />
              </div>
            </div>
            <div className="flex-1 text-center md:text-right space-y-2">
              <h3 className="text-2xl font-heading font-bold">
                مرحباً، {user?.name || 'عزيزي العميل'}! 👋
              </h3>
              <p className="text-muted-foreground text-base max-w-xl">
                مرحباً بك في لوحة التحكم الخاصة بك. يمكنك إدارة مشترياتك ومتابعة طلباتك من هنا.
              </p>
            </div>
            <Link to="/products">
              <Button size="lg" className="gradient-primary shadow-lg gap-2 font-semibold h-12 px-8">
                <Store className="h-5 w-5" />
                تصفح المنتجات
                <ArrowRight className="h-4 w-4 rtl:rotate-180" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-4 border-b">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-heading font-bold gradient-text">
            لوحة التحكم
          </h1>
          <p className="text-muted-foreground text-sm">نظرة عامة على حسابك ومشترياتك</p>
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
              <SelectItem value="all">كل الوقت</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" className="h-10 w-10" title="تحديث" onClick={() => loadDashboardData()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        <StatCard
          title="إجمالي المشتريات"
          value={stats?.totalPurchases || 0}
          icon={ShoppingCart}
          trend="+3 هذا الشهر"
          color="primary"
        />
        <StatCard
          title="إجمالي المصروفات"
          value={`${stats?.totalSpent?.toFixed(2) || '0.00'} ر.س`}
          icon={DollarSign}
          color="success"
        />
        <StatCard
          title="الاشتراكات النشطة"
          value={stats?.activeSubscriptions || 0}
          icon={CreditCard}
          color="secondary"
        />
        <StatCard
          title="المفضلة"
          value={stats?.favoriteProducts || 0}
          icon={Heart}
          color="accent"
        />
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-heading font-semibold mb-4">إجراءات سريعة</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <QuickActionCard
            title="تصفح المنتجات"
            description="اكتشف منتجات جديدة"
            icon={Store}
            href="/products"
            color="bg-gradient-to-br from-cyan-500 to-blue-500"
          />
          <QuickActionCard
            title="منتجاتي"
            description="عرض المنتجات المشتراة"
            icon={Package}
            href="/buyer/products"
            color="bg-gradient-to-br from-emerald-500 to-teal-500"
          />
          <QuickActionCard
            title="المفضلة"
            description="المنتجات المحفوظة"
            icon={Heart}
            href="/buyer/favorites"
            color="bg-gradient-to-br from-rose-500 to-pink-500"
          />
          <QuickActionCard
            title="المحفظة"
            description="إدارة رصيدك"
            icon={Wallet}
            href="/buyer/wallet"
            color="bg-gradient-to-br from-amber-500 to-orange-500"
          />
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-6">
        {/* Recent Orders */}
        <Card className="border-border/50">
          <CardHeader className="border-b pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-heading flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-primary" />
                آخر الطلبات
              </CardTitle>
              <Link to="/buyer/orders">
                <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80 text-xs h-8 gap-1">
                  عرض الكل
                  <ChevronRight className="h-4 w-4 rtl:rotate-180" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {recentOrders.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">
                <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-muted/50 flex items-center justify-center">
                  <ShoppingCart className="h-8 w-8 opacity-40" />
                </div>
                <p className="text-sm font-medium">لا توجد طلبات بعد</p>
                <p className="text-xs mt-1">ابدأ بتصفح المنتجات وقم بأول عملية شراء</p>
                <Link to="/products">
                  <Button variant="outline" size="sm" className="mt-4">
                    تصفح المنتجات
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="divide-y">
                {recentOrders.map((order) => (
                  <div key={order.id} className="p-4 md:p-5 hover:bg-muted/30 transition-colors group">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="p-3 bg-primary/10 rounded-xl flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                          <ShoppingCart className="h-5 w-5 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-sm">#{order.orderNumber}</p>
                          <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {order.products.map(p => p.name).join(', ')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 flex-shrink-0">
                        <div className="text-left hidden sm:block">
                          <p className="font-bold text-sm">{order.total.toFixed(2)} ر.س</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {new Date(order.createdAt).toLocaleDateString('ar-SA', { 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </p>
                        </div>
                        {getStatusBadge(order.status)}
                        <Link to={`/buyer/orders/${order.id}`}>
                          <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
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

        {/* Recent Products */}
        <Card className="border-border/50">
          <CardHeader className="border-b pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-heading flex items-center gap-2">
                <Package className="h-5 w-5 text-success" />
                المنتجات المشتراة حديثاً
              </CardTitle>
              <Link to="/buyer/products">
                <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80 text-xs h-8 gap-1">
                  عرض الكل
                  <ChevronRight className="h-4 w-4 rtl:rotate-180" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {recentProducts.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">
                <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-muted/50 flex items-center justify-center">
                  <Package className="h-8 w-8 opacity-40" />
                </div>
                <p className="text-sm font-medium">لا توجد منتجات مشتراة</p>
                <p className="text-xs mt-1">منتجاتك الرقمية ستظهر هنا</p>
              </div>
            ) : (
              <div className="divide-y">
                {recentProducts.map((product) => (
                  <div key={product.id} className="p-4 md:p-5 hover:bg-muted/30 transition-colors group">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="p-3 bg-success/10 rounded-xl flex-shrink-0 group-hover:bg-success/20 transition-colors">
                          {getProductTypeIcon(product.type)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-sm truncate">{product.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                              {getProductTypeLabel(product.type)}
                            </Badge>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(product.purchaseDate).toLocaleDateString('ar-SA', { 
                                month: 'short', 
                                day: 'numeric' 
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        {getStatusBadge(product.status)}
                        <Link to={`/buyer/products/${product.id}`}>
                          <Button variant="outline" size="sm" className="gap-1 h-8">
                            <Download className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">الوصول</span>
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
    </div>
  );
}

