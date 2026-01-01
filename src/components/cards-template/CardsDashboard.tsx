import { useState, useEffect, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  ShoppingCart, 
  Wallet, 
  CreditCard, 
  Package,
  BarChart3,
  Users,
  Heart,
  TrendingUp,
  Clock,
  AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { walletService } from '@/services/wallet.service';

interface CardsDashboardProps {
  stats?: {
    orderCount: number;
    revenue: number;
  } | null;
}

interface StatsCard {
  label: string;
  value: string;
  suffix?: string;
  icon: ReactNode;
  gradient: string;
  shadowColor: string;
}

interface QuickAction {
  label: string;
  icon: ReactNode;
  link: string;
  gradient: string;
}

interface TopUpRequest {
  id: string;
  createdAt: string;
  bank?: { name: string };
  senderName?: string;
  amount: number;
  currency: string;
}

export default function CardsDashboard({ stats }: CardsDashboardProps) {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const navigate = useNavigate();
  const [walletBalance, setWalletBalance] = useState<string | number>(0);
  const [pendingTopUps, setPendingTopUps] = useState<TopUpRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWalletData = async () => {
      try {
        const [balanceData, topUpsData] = await Promise.all([
          walletService.getBalance(),
          walletService.getTopUpRequests('PENDING')
        ]);
        
        if (balanceData) {
          setWalletBalance(balanceData.balance);
        }
        
        if (topUpsData) {
          setPendingTopUps(topUpsData as TopUpRequest[]);
        }
      } catch (error) {
        console.error('Failed to fetch wallet data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWalletData();
  }, []);

  const statsCards: StatsCard[] = [
    {
      label: isRTL ? 'عدد الطلبات' : 'Orders Count',
      value: stats?.orderCount?.toString() || '0',
      suffix: isRTL ? 'طلب' : 'Orders',
      icon: <ShoppingCart className="h-7 w-7" />,
      gradient: 'from-orange-500 to-amber-500',
      shadowColor: 'shadow-orange-500/20',
    },
    {
      label: isRTL ? 'إجمالي قيمة الطلبات' : 'Total Orders Value',
      value: stats?.revenue?.toFixed(2) || '0.00',
      suffix: isRTL ? 'ريال' : 'SAR',
      icon: <TrendingUp className="h-7 w-7" />,
      gradient: 'from-emerald-500 to-teal-500',
      shadowColor: 'shadow-emerald-500/20',
    },
    {
      label: isRTL ? 'رصيد المحفظة' : 'Wallet Balance',
      value: Number(walletBalance).toFixed(2),
      suffix: isRTL ? 'ريال' : 'SAR',
      icon: <Wallet className="h-7 w-7" />,
      gradient: 'from-violet-500 to-purple-500',
      shadowColor: 'shadow-violet-500/20',
    },
  ];

  const quickActions: QuickAction[] = [
    {
      label: isRTL ? 'التقارير' : 'Reports',
      icon: <BarChart3 className="h-6 w-6" />,
      link: '/dashboard/reports',
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      label: isRTL ? 'المنتجات' : 'Products',
      icon: <Package className="h-6 w-6" />,
      link: '/dashboard/products',
      gradient: 'from-orange-500 to-amber-500',
    },
    {
      label: isRTL ? 'السلات' : 'Carts',
      icon: <ShoppingCart className="h-6 w-6" />,
      link: '/dashboard/orders',
      gradient: 'from-emerald-500 to-teal-500',
    },
    {
      label: isRTL ? 'الموظفين' : 'Employees',
      icon: <Users className="h-6 w-6" />,
      link: '/dashboard/settings/users',
      gradient: 'from-violet-500 to-purple-500',
    },
    {
      label: isRTL ? 'المفضلة' : 'Favourites',
      icon: <Heart className="h-6 w-6" />,
      link: '/dashboard/favorites',
      gradient: 'from-pink-500 to-rose-500',
    },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="space-y-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {statsCards.map((stat, index) => (
            <Card 
              key={index} 
              className={cn(
                "overflow-hidden bg-card border-border/50 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300",
                stat.shadowColor
              )}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">{stat.label}</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold text-foreground">{stat.value}</span>
                      {stat.suffix && (
                        <span className="text-sm text-muted-foreground">{stat.suffix}</span>
                      )}
                    </div>
                  </div>
                  <div className={cn("p-3 rounded-xl bg-gradient-to-br text-white shadow-lg", stat.gradient)}>
                    {stat.icon}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <Card className="bg-card border-border/50 rounded-2xl overflow-hidden shadow-sm">
          <CardContent className="py-8">
            <div className="flex flex-wrap justify-center gap-8">
              {quickActions.map((action, index) => (
                <button
                  key={index}
                  onClick={() => navigate(action.link)}
                  className="flex flex-col items-center gap-3 group"
                >
                  <div className={cn(
                    "p-4 rounded-2xl bg-gradient-to-br text-white shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:shadow-xl",
                    action.gradient
                  )}>
                    {action.icon}
                  </div>
                  <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                    {action.label}
                  </span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Tables Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pending Wallet Charges */}
          <Card className="bg-card border-border/50 rounded-2xl overflow-hidden shadow-sm">
            <CardHeader className="border-b border-border/50 bg-muted/30">
              <CardTitle className="text-lg text-foreground flex items-center gap-2">
                <Clock className="w-5 h-5 text-orange-500" />
                {isRTL ? 'عمليات شحن الرصيد النقدي (المعلقة)' : 'Pending Cash Balance Charges'}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border/50 bg-muted/30">
                      <th className="text-right py-3 px-4 text-sm font-semibold text-muted-foreground">
                        {isRTL ? 'التاريخ' : 'Date'}
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-muted-foreground">
                        {isRTL ? 'رقم العملية' : 'Transaction #'}
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-muted-foreground">
                        {isRTL ? 'البنك' : 'Bank'}
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-muted-foreground">
                        {isRTL ? 'اسم المحول' : 'Sender Name'}
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-muted-foreground">
                        {isRTL ? 'القيمة' : 'Amount'}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={5} className="text-center py-12">
                          <div className="flex flex-col items-center">
                            <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mb-3"></div>
                            <p className="text-muted-foreground">{isRTL ? 'جاري التحميل...' : 'Loading...'}</p>
                          </div>
                        </td>
                      </tr>
                    ) : pendingTopUps.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-12">
                          <div className="flex flex-col items-center">
                            <div className="p-4 rounded-2xl bg-muted/30 mb-4">
                              <Package className="h-10 w-10 text-muted-foreground/50" />
                            </div>
                            <p className="text-muted-foreground">
                              {isRTL ? 'لا توجد عمليات معلقة' : 'No pending transactions'}
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      pendingTopUps.map((topup) => (
                        <tr key={topup.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                          <td className="py-3 px-4 text-sm text-foreground">
                            {new Date(topup.createdAt).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US')}
                          </td>
                          <td className="py-3 px-4 text-sm font-mono text-muted-foreground">#{topup.id.slice(0, 8)}</td>
                          <td className="py-3 px-4 text-sm text-foreground">{topup.bank?.name || '-'}</td>
                          <td className="py-3 px-4 text-sm text-foreground">{topup.senderName || '-'}</td>
                          <td className="py-3 px-4 text-sm font-bold text-emerald-600">
                            +{Number(topup.amount).toFixed(2)} {topup.currency}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Pending Complaints */}
          <Card className="bg-card border-border/50 rounded-2xl overflow-hidden shadow-sm">
            <CardHeader className="border-b border-border/50 bg-muted/30">
              <CardTitle className="text-lg text-foreground flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-500" />
                {isRTL ? 'الشكاوى المعلقة' : 'Pending Complaints'}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border/50 bg-muted/30">
                      <th className="text-right py-3 px-4 text-sm font-semibold text-muted-foreground">
                        {isRTL ? 'تاريخ الإضافة' : 'Date Added'}
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-muted-foreground">
                        {isRTL ? 'عنوان التذكرة' : 'Ticket Title'}
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-muted-foreground">
                        {isRTL ? 'رقم الطلب' : 'Order #'}
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-muted-foreground">
                        {isRTL ? 'الحالة' : 'Status'}
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-muted-foreground">
                        {isRTL ? 'التعليق' : 'Comment'}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td colSpan={5} className="text-center py-12">
                        <div className="flex flex-col items-center">
                          <div className="p-4 rounded-2xl bg-muted/30 mb-4">
                            <Package className="h-10 w-10 text-muted-foreground/50" />
                          </div>
                          <p className="text-muted-foreground">
                            {isRTL ? 'لا توجد شكاوى معلقة' : 'No pending complaints'}
                          </p>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
