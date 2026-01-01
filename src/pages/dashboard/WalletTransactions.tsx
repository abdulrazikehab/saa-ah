import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { coreApi } from '@/lib/api';
import { BalanceSummary, Transaction, SubscriptionInfo } from '@/services/transaction.service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  Download,
  CheckCircle2,
  XCircle,
  Clock,
  Printer,
  CreditCard
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency, getCurrencySymbol } from '@/lib/currency-utils';

export default function WalletTransactions() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState<BalanceSummary | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [printingId, setPrintingId] = useState<string | null>(null);
  const [refundingId, setRefundingId] = useState<string | null>(null);


  useEffect(() => {
    if (user?.tenantId) {
      loadData();
    }
  }, [user?.tenantId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [balanceData, transactionsData, subscriptionData] = await Promise.all([
        coreApi.getBalance(user!.tenantId!),
        coreApi.getTransactions(user!.tenantId!),
        coreApi.getSubscription(user!.tenantId!)
      ]);

      setBalance(balanceData);
      setTransactions(transactionsData.transactions);
      setSubscription(subscriptionData);
    } catch (error) {
      console.error('Failed to load financial data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle reprint transaction receipt
  const handleReprint = async (transaction: Transaction) => {
    try {
      setPrintingId(transaction.id);
      
      // Call API to increment print count and get receipt
      await coreApi.reprintTransaction(user!.tenantId!, transaction.id);
      
      // Update local state to increment print count
      setTransactions(prev => prev.map(t => 
        t.id === transaction.id 
          ? { ...t, printCount: (t.printCount || 0) + 1 }
          : t
      ));
      
      toast({
        title: 'تمت الطباعة',
        description: `تم طباعة إيصال الطلب ${transaction.orderNumber}`,
      });
    } catch (error) {
      toast({
        title: 'فشل الطباعة',
        description: 'حدث خطأ أثناء طباعة الإيصال',
        variant: 'destructive',
      });
    } finally {
      setPrintingId(null);
    }
  };

  // Handle refund transaction
  const handleRefund = async (transaction: Transaction) => {
    if (!confirm('هل أنت متأكد من رغبتك في استرجاع هذه المعاملة؟ لا يمكن التراجع عن هذا الإجراء.')) {
      return;
    }

    try {
      setRefundingId(transaction.id);
      
      await coreApi.refundTransaction(user!.tenantId!, transaction.id);
      
      // Update local state to reflect refunded status
      setTransactions(prev => prev.map(t => 
        t.id === transaction.id 
          ? { ...t, status: 'REFUNDED' }
          : t
      ));
      
      // Reload balance to reflect the refund
      const balanceData = await coreApi.getBalance(user!.tenantId!);
      setBalance(balanceData);
      
      toast({
        title: 'تم الاسترجاع',
        description: `تم استرجاع مبلغ المعاملة ${transaction.orderNumber || transaction.id} بنجاح`,
      });
    } catch (error: any) {
      toast({
        title: 'فشل الاسترجاع',
        description: error.response?.data?.message || 'حدث خطأ أثناء استرجاع المعاملة',
        variant: 'destructive',
      });
    } finally {
      setRefundingId(null);
    }
  };


  // Format card number with BIN
  const formatCardDisplay = (cardNumber?: string, cardBin?: string, cardLast4?: string) => {
    if (cardNumber) {
      // Mask middle digits: 4242****1234
      return cardNumber.replace(/(\d{4})(\d+)(\d{4})/, '$1****$3');
    }
    if (cardBin && cardLast4) {
      return `${cardBin}****${cardLast4}`;
    }
    return '----';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">الرصيد والمدفوعات</h1>
          <p className="text-muted-foreground">إدارة رصيدك، معاملاتك، واشتراكك</p>
        </div>
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          تصدير التقرير
        </Button>
      </div>

      {/* Subscription Alert */}
      {subscription?.shouldAlert && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 flex items-start gap-4">
          <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 mt-0.5" />
          <div>
            <h3 className="font-medium text-yellow-900 dark:text-yellow-200">تجديد الاشتراك مطلوب قريباً</h3>
            <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
              سينتهي اشتراكك في باقة {subscription.plan} خلال {subscription.daysUntilBilling} أيام. يرجى تجديد الاشتراك لضمان استمرار الخدمة.
            </p>
            <Button size="sm" variant="outline" className="mt-3 border-yellow-600 text-yellow-700 hover:bg-yellow-100">
              تجديد الاشتراك الآن
            </Button>
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الرصيد المتاح</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {balance ? formatCurrency(balance.availableBalance, balance.currency || 'SAR') : '0.00 ر.س'}
            </div>
            <p className="text-xs text-muted-foreground">جاهز للسحب</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الرصيد المعلق</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {balance ? formatCurrency(balance.pendingAmount, balance.currency || 'SAR') : '0.00 ر.س'}
            </div>
            <p className="text-xs text-muted-foreground">قيد المعالجة</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الإيرادات</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {balance ? formatCurrency(balance.totalRevenue, balance.currency || 'SAR') : '0.00 ر.س'}
            </div>
            <p className="text-xs text-muted-foreground">قبل خصم العمولات</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">عمولات المنصة</CardTitle>
            <ArrowDownRight className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {balance ? formatCurrency(balance.totalPlatformFees, balance.currency || 'SAR') : '0.00 ر.س'}
            </div>
            <p className="text-xs text-muted-foreground">رسوم الخدمات</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>سجل المعاملات</CardTitle>
            <CardDescription>
              آخر المعاملات المالية في متجرك
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>رقم الطلب</TableHead>
                  <TableHead>التاريخ</TableHead>
                  <TableHead>رقم البطاقة</TableHead>
                  <TableHead>BIN</TableHead>
                  <TableHead>المبلغ</TableHead>
                  <TableHead>الصافي</TableHead>
                  <TableHead className="text-center">عدد الطباعة</TableHead>
                  <TableHead className="text-center">إعادة طباعة</TableHead>
                  <TableHead className="text-center">استرجاع</TableHead>

                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="font-medium">
                      {transaction.orderNumber || '#--'}
                      <div className="text-xs text-muted-foreground">{transaction.paymentProvider}</div>
                    </TableCell>
                    <TableCell>
                      {format(new Date(transaction.createdAt), 'dd MMM yyyy', { locale: ar })}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                        <span className="font-mono text-sm">
                          {formatCardDisplay(transaction.cardNumber, transaction.cardBin, transaction.cardLast4)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-sm bg-muted px-2 py-1 rounded">
                        {transaction.cardBin || '------'}
                      </span>
                    </TableCell>
                    <TableCell>
                      {formatCurrency(transaction.amount, transaction.currency || 'SAR')}
                    </TableCell>
                    <TableCell className="text-green-600 font-medium">
                      {formatCurrency(transaction.merchantEarnings, transaction.currency || 'SAR')}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="font-mono">
                        {transaction.printCount || 0}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleReprint(transaction)}
                        disabled={printingId === transaction.id}
                        className="gap-1"
                      >
                        <Printer className={`h-4 w-4 ${printingId === transaction.id ? 'animate-pulse' : ''}`} />
                        {printingId === transaction.id ? 'جاري...' : 'طباعة'}
                      </Button>
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRefund(transaction)}
                        disabled={refundingId === transaction.id || transaction.status === 'REFUNDED' || transaction.status !== 'COMPLETED'}
                        className={`gap-1 ${transaction.status === 'REFUNDED' ? 'text-muted-foreground' : 'text-red-500 hover:text-red-600 hover:bg-red-50'}`}
                      >
                        <ArrowDownRight className={`h-4 w-4 ${refundingId === transaction.id ? 'animate-pulse' : ''}`} />
                        {transaction.status === 'REFUNDED' ? 'تم الاسترجاع' : refundingId === transaction.id ? 'جاري...' : 'استرجاع'}
                      </Button>
                    </TableCell>

                  </TableRow>
                ))}
                {transactions.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      لا توجد معاملات حتى الآن
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>تفاصيل الاشتراك</CardTitle>
            <CardDescription>باقتك الحالية وموعد التجديد</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between p-4 border rounded-lg bg-slate-50 dark:bg-slate-900">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">الباقة الحالية</p>
                <h3 className="text-2xl font-bold text-primary">{subscription?.plan}</h3>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-muted-foreground">السعر</p>
                <p className="text-xl font-bold">{subscription?.monthlyPrice} ريال/شهر</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">تاريخ التجديد القادم</span>
                <span className="font-medium">
                  {subscription && format(new Date(subscription.nextBillingDate), 'dd MMMM yyyy', { locale: ar })}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">الأيام المتبقية</span>
                <span className={`font-medium ${subscription?.shouldAlert ? 'text-red-600' : ''}`}>
                  {subscription?.daysUntilBilling} يوم
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-medium mb-2">مميزات الباقة:</h4>
              <ul className="space-y-2">
                {subscription?.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            <Button className="w-full mt-4">ترقية الباقة</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
