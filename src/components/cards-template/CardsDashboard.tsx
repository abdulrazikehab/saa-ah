import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ShoppingCart, 
  Wallet, 
  CreditCard, 
  Package,
  Plus,
  Settings,
  BarChart3
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
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

interface QuickAction {
  label: string;
  icon: React.ReactNode;
  link: string;
}

export default function CardsDashboard({ stats }: CardsDashboardProps) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const navigate = useNavigate();
  const [walletBalance, setWalletBalance] = useState<string | number>(0);
  const [pendingTopUps, setPendingTopUps] = useState<any[]>([]);
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
          setPendingTopUps(topUpsData);
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
      icon: <ShoppingCart className="h-8 w-8" />,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      label: isRTL ? 'إجمالي قيمة الطلبات' : 'Total Orders Value',
      value: stats?.revenue?.toFixed(2) || '0.00',
      suffix: isRTL ? 'ريال' : 'SAR',
      icon: <Wallet className="h-8 w-8" />,
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
    {
      label: isRTL ? 'رصيد المحفظة' : 'Wallet Balance',
      value: Number(walletBalance).toFixed(2),
      suffix: isRTL ? 'ريال' : 'SAR',
      icon: <CreditCard className="h-8 w-8" />,
      color: 'text-[hsl(var(--teal))]',
      bgColor: 'bg-[hsl(var(--teal)/0.1)]',
    },
  ];

  const quickActions: QuickAction[] = [
    {
      label: isRTL ? 'إضافة منتج' : 'Add Product',
      icon: <Plus className="h-6 w-6" />,
      link: '/dashboard/products',
    },
    {
      label: isRTL ? 'إدارة المنتجات' : 'Manage Products',
      icon: <Package className="h-6 w-6" />,
      link: '/dashboard/products',
    },
    {
      label: isRTL ? 'إدارة الطلبات' : 'Manage Orders',
      icon: <ShoppingCart className="h-6 w-6" />,
      link: '/dashboard/orders',
    },
    {
      label: isRTL ? 'إعدادات المتجر' : 'Store Settings',
      icon: <Settings className="h-6 w-6" />,
      link: '/dashboard/settings',
    },
    {
      label: isRTL ? 'التقارير' : 'Reports',
      icon: <BarChart3 className="h-6 w-6" />,
      link: '/dashboard/reports',
    },
  ];

  return (
    <div className="space-y-6 p-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {statsCards.map((stat, index) => (
          <Card key={index} className="overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold">{stat.value}</span>
                    {stat.suffix && (
                      <span className="text-sm text-muted-foreground">{stat.suffix}</span>
                    )}
                  </div>
                </div>
                <div className={cn("p-3 rounded-xl", stat.bgColor, stat.color)}>
                  {stat.icon}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardContent className="py-6">
          <div className="flex flex-wrap justify-center gap-8">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={() => navigate(action.link)}
                className="flex flex-col items-center gap-2 text-muted-foreground hover:text-primary transition-colors group"
              >
                <div className="p-4 rounded-xl bg-muted/50 group-hover:bg-primary/10 transition-colors">
                  {action.icon}
                </div>
                <span className="text-sm font-medium">{action.label}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tables Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Wallet Charges */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {isRTL ? 'عمليات شحن الرصيد النقدي (المعلقة)' : 'Pending Cash Balance Charges'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                      {isRTL ? 'التاريخ' : 'Date'}
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                      {isRTL ? 'رقم العملية' : 'Transaction #'}
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                      {isRTL ? 'البنك' : 'Bank'}
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                      {isRTL ? 'اسم المحول' : 'Sender Name'}
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                      {isRTL ? 'القيمة' : 'Amount'}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pendingTopUps.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-12">
                        <Package className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                        <p className="text-muted-foreground">
                          {isRTL ? 'لا توجد بيانات' : 'No data'}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    pendingTopUps.map((topup) => (
                      <tr key={topup.id} className="border-b last:border-0 hover:bg-muted/50">
                        <td className="py-3 px-4 text-sm">
                          {new Date(topup.createdAt).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US')}
                        </td>
                        <td className="py-3 px-4 text-sm font-mono">{topup.id.slice(0, 8)}</td>
                        <td className="py-3 px-4 text-sm">{topup.bank?.name || '-'}</td>
                        <td className="py-3 px-4 text-sm">{topup.senderName || '-'}</td>
                        <td className="py-3 px-4 text-sm font-bold">
                          {Number(topup.amount).toFixed(2)} {topup.currency}
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
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {isRTL ? 'الشكاوى المعلقة' : 'Pending Complaints'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                      {isRTL ? 'تاريخ الإضافة' : 'Date Added'}
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                      {isRTL ? 'عنوان التذكرة' : 'Ticket Title'}
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                      {isRTL ? 'رقم الطلب' : 'Order #'}
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                      {isRTL ? 'الحالة' : 'Status'}
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                      {isRTL ? 'التعليق' : 'Comment'}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan={5} className="text-center py-12">
                      <Package className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                      <p className="text-muted-foreground">
                        {isRTL ? 'لا توجد بيانات' : 'No data'}
                      </p>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
