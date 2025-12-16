import { useState, useEffect } from 'react';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  CreditCard,
  RefreshCw,
  Plus,
  History,
  TrendingUp,
  TrendingDown,
  Filter,
  Download,
  Calendar,
  DollarSign,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useTranslation } from 'react-i18next';

interface Transaction {
  id: string;
  type: 'credit' | 'debit' | 'refund';
  amount: number;
  description: string;
  status: 'completed' | 'pending' | 'failed';
  createdAt: string;
  reference?: string;
  orderId?: string;
}

interface WalletStats {
  balance: number;
  totalSpent: number;
  totalRefunds: number;
  pendingAmount: number;
}

export default function BuyerWallet() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const [stats, setStats] = useState<WalletStats | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');
  const [addFundsOpen, setAddFundsOpen] = useState(false);
  const [addAmount, setAddAmount] = useState('');

  useEffect(() => {
    loadWalletData();
  }, []);

  const loadWalletData = async () => {
    setLoading(true);
    try {
      // Mock data - replace with actual API call
      setStats({
        balance: 450.50,
        totalSpent: 1250.00,
        totalRefunds: 49.00,
        pendingAmount: 0
      });

      setTransactions([
        {
          id: '1',
          type: 'debit',
          amount: 299.00,
          description: 'شراء: دورة تصميم UI/UX الاحترافية',
          status: 'completed',
          createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
          orderId: 'ORD-2024-001'
        },
        {
          id: '2',
          type: 'credit',
          amount: 500.00,
          description: 'إيداع رصيد - بطاقة ائتمان',
          status: 'completed',
          createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
          reference: 'PAY-12345'
        },
        {
          id: '3',
          type: 'refund',
          amount: 49.00,
          description: 'استرداد: طلب ملغي ORD-2024-004',
          status: 'completed',
          createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
          orderId: 'ORD-2024-004'
        },
        {
          id: '4',
          type: 'debit',
          amount: 150.00,
          description: 'شراء: حزمة أيقونات + خطوط عربية',
          status: 'completed',
          createdAt: new Date(Date.now() - 86400000 * 15).toISOString(),
          orderId: 'ORD-2024-003'
        },
        {
          id: '5',
          type: 'credit',
          amount: 200.00,
          description: 'إيداع رصيد - Apple Pay',
          status: 'completed',
          createdAt: new Date(Date.now() - 86400000 * 20).toISOString(),
          reference: 'PAY-12340'
        },
        {
          id: '6',
          type: 'debit',
          amount: 599.00,
          description: 'شراء: دورة Python + كتاب إلكتروني',
          status: 'completed',
          createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
          orderId: 'ORD-2024-005'
        }
      ]);
    } catch (error) {
      console.error('Failed to load wallet data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'credit': return <ArrowDownLeft className="h-4 w-4 text-success" />;
      case 'debit': return <ArrowUpRight className="h-4 w-4 text-destructive" />;
      case 'refund': return <RefreshCw className="h-4 w-4 text-primary" />;
      default: return <DollarSign className="h-4 w-4" />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'credit': return 'text-success';
      case 'debit': return 'text-destructive';
      case 'refund': return 'text-primary';
      default: return 'text-foreground';
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; variant: 'soft-success' | 'soft-warning' | 'soft-destructive' }> = {
      completed: { label: 'مكتمل', variant: 'soft-success' },
      pending: { label: 'قيد المعالجة', variant: 'soft-warning' },
      failed: { label: 'فشل', variant: 'soft-destructive' },
    };
    const { label, variant } = config[status] || config.pending;
    return <Badge variant={variant}>{label}</Badge>;
  };

  const filteredTransactions = transactions.filter(tx => {
    if (filterType === 'all') return true;
    return tx.type === filterType;
  });

  const handleAddFunds = async () => {
    // TODO: Implement add funds logic
    console.log('Adding funds:', addAmount);
    setAddFundsOpen(false);
    setAddAmount('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <RefreshCw className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">جاري تحميل المحفظة...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-bold gradient-text flex items-center gap-3">
            <Wallet className="h-8 w-8 text-primary" />
            المحفظة
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            إدارة رصيدك وعرض معاملاتك المالية
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={addFundsOpen} onOpenChange={setAddFundsOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                إضافة رصيد
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>إضافة رصيد</DialogTitle>
                <DialogDescription>
                  أضف رصيداً إلى محفظتك لاستخدامه في عمليات الشراء
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>المبلغ (ر.س)</Label>
                  <Input
                    type="number"
                    placeholder="100.00"
                    value={addAmount}
                    onChange={(e) => setAddAmount(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[50, 100, 200, 500].map((amount) => (
                    <Button
                      key={amount}
                      variant="outline"
                      size="sm"
                      onClick={() => setAddAmount(amount.toString())}
                    >
                      {amount}
                    </Button>
                  ))}
                </div>
                <div className="space-y-2">
                  <Label>طريقة الدفع</Label>
                  <Select defaultValue="card">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="card">بطاقة ائتمان</SelectItem>
                      <SelectItem value="apple">Apple Pay</SelectItem>
                      <SelectItem value="stc">STC Pay</SelectItem>
                      <SelectItem value="mada">مدى</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setAddFundsOpen(false)}>
                  إلغاء
                </Button>
                <Button onClick={handleAddFunds} disabled={!addAmount}>
                  إضافة {addAmount && `${addAmount} ر.س`}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Balance Card */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-br from-primary via-primary/90 to-secondary p-6 md:p-8 text-white">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <p className="text-sm text-white/80 mb-2">الرصيد الحالي</p>
              <p className="text-4xl md:text-5xl font-heading font-bold">
                {stats?.balance.toFixed(2)} <span className="text-2xl">ر.س</span>
              </p>
              {stats?.pendingAmount && stats.pendingAmount > 0 && (
                <p className="text-sm text-white/80 mt-2 flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {stats.pendingAmount.toFixed(2)} ر.س قيد المعالجة
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4 md:gap-8">
              <div className="text-center">
                <div className="p-3 rounded-xl bg-white/10 backdrop-blur mb-2 inline-flex">
                  <TrendingDown className="h-6 w-6" />
                </div>
                <p className="text-2xl font-bold">{stats?.totalSpent.toFixed(0)}</p>
                <p className="text-xs text-white/70">ر.س مصروفات</p>
              </div>
              <div className="text-center">
                <div className="p-3 rounded-xl bg-white/10 backdrop-blur mb-2 inline-flex">
                  <RefreshCw className="h-6 w-6" />
                </div>
                <p className="text-2xl font-bold">{stats?.totalRefunds.toFixed(0)}</p>
                <p className="text-xs text-white/70">ر.س استرداد</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-all" onClick={() => setAddFundsOpen(true)}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-success/10">
              <Plus className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="font-medium text-sm">إضافة رصيد</p>
              <p className="text-xs text-muted-foreground">شحن المحفظة</p>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-all">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <CreditCard className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-sm">طرق الدفع</p>
              <p className="text-xs text-muted-foreground">إدارة البطاقات</p>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-all">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-secondary/10">
              <History className="h-5 w-5 text-secondary" />
            </div>
            <div>
              <p className="font-medium text-sm">السجل</p>
              <p className="text-xs text-muted-foreground">عرض المعاملات</p>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-all">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-accent/10">
              <Download className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="font-medium text-sm">تصدير</p>
              <p className="text-xs text-muted-foreground">تحميل كشف حساب</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transactions */}
      <Card>
        <CardHeader className="border-b">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5 text-primary" />
                سجل المعاملات
              </CardTitle>
              <CardDescription>جميع العمليات المالية على محفظتك</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[150px]">
                  <Filter className="h-4 w-4 ml-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  <SelectItem value="credit">إيداعات</SelectItem>
                  <SelectItem value="debit">مصروفات</SelectItem>
                  <SelectItem value="refund">استردادات</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredTransactions.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-muted/50 flex items-center justify-center">
                <History className="h-8 w-8 opacity-40" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">لا توجد معاملات</p>
              <p className="text-xs text-muted-foreground mt-1">
                سجل معاملاتك المالية سيظهر هنا
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredTransactions.map((tx) => (
                <div key={tx.id} className="p-4 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className={`p-2.5 rounded-xl ${
                        tx.type === 'credit' ? 'bg-success/10' :
                        tx.type === 'debit' ? 'bg-destructive/10' :
                        'bg-primary/10'
                      }`}>
                        {getTransactionIcon(tx.type)}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{tx.description}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(tx.createdAt).toLocaleDateString('ar-SA')}
                          </span>
                          {tx.reference && (
                            <Badge variant="outline" className="text-[10px]">
                              {tx.reference}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-left">
                        <p className={`font-bold ${getTransactionColor(tx.type)}`}>
                          {tx.type === 'debit' ? '-' : '+'}
                          {tx.amount.toFixed(2)} ر.س
                        </p>
                        {getStatusBadge(tx.status)}
                      </div>
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

