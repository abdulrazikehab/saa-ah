import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  CreditCard, 
  DollarSign, 
  Calendar, 
  Download, 
  Search, 
  Filter, 
  ArrowUpRight, 
  ArrowDownLeft, 
  CheckCircle2, 
  XCircle, 
  Clock,
  Wallet
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { coreApi } from '@/lib/api';
import { formatCurrency, formatNumber } from '@/lib/currency-utils';
import { writeFile, utils } from 'xlsx';
import { DataTablePagination } from '@/components/common/DataTablePagination';

interface PaymentTransaction {
  id: string;
  amount: number;
  currency: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED' | 'CANCELLED' | 'SUCCESS' | 'PAID';
  method: string;
  provider?: string;
  transactionId?: string;
  orderId?: string;
  customerName?: string;
  createdAt: string;
  type?: 'PAYMENT' | 'REFUND';
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  COMPLETED: { label: 'مكتمل', color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle2 },
  SUCCESS: { label: 'ناجح', color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle2 },
  PAID: { label: 'مدفوع', color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle2 },
  PENDING: { label: 'قيد الانتظار', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Clock },
  FAILED: { label: 'فشل', color: 'bg-red-100 text-red-800 border-red-200', icon: XCircle },
  REFUNDED: { label: 'تم الاسترداد', color: 'bg-orange-100 text-orange-800 border-orange-200', icon: ArrowDownLeft },
  CANCELLED: { label: 'ملغي', color: 'bg-gray-100 text-gray-800 border-gray-200', icon: XCircle },
};

export default function PaymentReportsPage() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const { toast } = useToast();
  
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Load data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        // Use the reports endpoint
        const response = await coreApi.get('/reports/payments', { requireAuth: true });
        
        // Handle different response structures based on API return type
        let data: PaymentTransaction[] = [];
        if (Array.isArray(response)) {
          data = response as PaymentTransaction[];
        } else if (response && typeof response === 'object') {
          // Use type assertion for flexible API structure
          const resObj = response as { data?: PaymentTransaction[]; transactions?: PaymentTransaction[] };
          data = resObj.data || resObj.transactions || [];
        }
        
        setTransactions(data);
      } catch (error) {
        console.error('Failed to load payment reports:', error);
        toast({
          title: t('common.error'),
          description: 'فشل في تحميل تقرير المدفوعات',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [toast, t]);

  // Calculations
  const stats = useMemo(() => {
    const total = transactions.reduce((sum, t) => t.status === 'COMPLETED' || t.status === 'SUCCESS' || t.status === 'PAID' ? sum + Number(t.amount || 0) : sum, 0);
    const count = transactions.length;
    const successfulCount = transactions.filter(t => t.status === 'COMPLETED' || t.status === 'SUCCESS' || t.status === 'PAID').length;
    const failedCount = transactions.filter(t => t.status === 'FAILED').length;
    const pendingCount = transactions.filter(t => t.status === 'PENDING').length;
    
    return { total, count, successfulCount, failedCount, pendingCount };
  }, [transactions]);

  // Filtering
  const filteredTransactions = useMemo(() => {
    return transactions.filter(item => {
      // Search
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesSearch = 
          item.transactionId?.toLowerCase().includes(q) || 
          item.orderId?.toLowerCase().includes(q) ||
          item.customerName?.toLowerCase().includes(q);
        
        if (!matchesSearch) return false;
      }
      
      // Status Filter
      if (statusFilter !== 'all' && item.status !== statusFilter) {
        return false;
      }
      
      // Method Filter
      if (methodFilter !== 'all' && item.method !== methodFilter) {
        return false;
      }
      
      return true;
    });
  }, [transactions, searchQuery, statusFilter, methodFilter]);

  // Pagination
  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredTransactions.slice(startIndex, startIndex + pageSize);
  }, [filteredTransactions, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredTransactions.length / pageSize);

  // Export
  const handleExport = () => {
    try {
      const exportData = filteredTransactions.map(t => ({
        'معرف المعاملة': t.transactionId || t.id,
        'المبلغ': t.amount,
        'العملة': t.currency || 'SAR',
        'الحالة': statusConfig[t.status]?.label || t.status,
        'طريقة الدفع': t.method,
        'رقم الطلب': t.orderId || '-',
        'العميل': t.customerName || '-',
        'التاريخ': new Date(t.createdAt).toLocaleDateString('ar-SA'),
      }));

      const ws = utils.json_to_sheet(exportData);
      const wb = utils.book_new();
      utils.book_append_sheet(wb, ws, 'تقرير المدفوعات');
      writeFile(wb, `payment_report_${new Date().toISOString().split('T')[0]}.xlsx`);
      
      toast({
        title: 'تم التصدير',
        description: 'تم تصدير التقرير بنجاح'
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'حدث خطأ أثناء التصدير'
      });
    }
  };

  const getMethods = () => {
    const methods = new Set(transactions.map(t => t.method).filter(Boolean));
    return Array.from(methods);
  };

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CreditCard className="h-7 w-7 text-primary" />
            {t('dashboard.reports.payments', 'تقارير المدفوعات')}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t('dashboard.reports.paymentsDesc', 'تحليل المعاملات المالية وحالات الدفع')}
          </p>
        </div>
        <Button onClick={handleExport} className="gap-2">
          <Download className="h-4 w-4" />
          تصدير Excel
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/50 dark:to-green-900/30 border-none shadow-sm">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">إجمالي الإيرادات</p>
                <h3 className="text-2xl font-bold text-green-700 dark:text-green-400">
                  {formatCurrency(stats.total, 'SAR')}
                </h3>
              </div>
              <div className="p-2 bg-white/50 dark:bg-black/20 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-card border shadow-sm">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">المعاملات الناجحة</p>
                <h3 className="text-2xl font-bold">
                  {formatNumber(stats.successfulCount)}
                </h3>
              </div>
              <div className="p-2 bg-green-100 dark:bg-green-900/40 rounded-lg">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-card border shadow-sm">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">قيد الانتظار</p>
                <h3 className="text-2xl font-bold">
                  {formatNumber(stats.pendingCount)}
                </h3>
              </div>
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/40 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-card border shadow-sm">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">عمليات فاشلة</p>
                <h3 className="text-2xl font-bold">
                  {formatNumber(stats.failedCount)}
                </h3>
              </div>
              <div className="p-2 bg-red-100 dark:bg-red-900/40 rounded-lg">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="بحث برقم المعاملة، رقم الطلب، أو اسم العميل..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                <SelectItem value="COMPLETED">مكتمل</SelectItem>
                <SelectItem value="PENDING">قيد الانتظار</SelectItem>
                <SelectItem value="FAILED">فشل</SelectItem>
                <SelectItem value="REFUNDED">تم الاسترداد</SelectItem>
              </SelectContent>
            </Select>

            <Select value={methodFilter} onValueChange={setMethodFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="طريقة الدفع" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">الكل</SelectItem>
                {getMethods().map(method => (
                  <SelectItem key={method} value={method}>{method}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>سجل المعاملات</CardTitle>
          <CardDescription>عرض تفاصيل المعاملات المالية والمدفوعات</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">المعرف</TableHead>
                  <TableHead>المبلغ</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>طريقة الدفع</TableHead>
                  <TableHead>العميل</TableHead>
                  <TableHead>الطلب</TableHead>
                  <TableHead className="text-left">التاريخ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      {loading ? 'جاري التحميل...' : 'لا توجد معاملات'}
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedTransactions.map((transaction) => {
                    const statusInfo = statusConfig[transaction.status] || { label: transaction.status, color: 'bg-gray-100', icon: CheckCircle2 };
                    const StatusIcon = statusInfo.icon;
                    
                    return (
                      <TableRow key={transaction.id}>
                        <TableCell className="font-mono text-xs">
                          {transaction.transactionId || transaction.id.substring(0, 8)}
                        </TableCell>
                        <TableCell>
                          <div className="font-bold">
                            {formatCurrency(transaction.amount, transaction.currency || 'SAR')}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={statusInfo.color} variant="outline">
                            <span className="flex items-center gap-1">
                              <StatusIcon className="h-3 w-3" />
                              {statusInfo.label}
                            </span>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <CreditCard className="h-4 w-4 text-muted-foreground" />
                            {transaction.method}
                          </div>
                        </TableCell>
                        <TableCell>{transaction.customerName || '-'}</TableCell>
                        <TableCell>{transaction.orderId ? `#${transaction.orderId}` : '-'}</TableCell>
                        <TableCell className="text-left text-muted-foreground text-sm">
                          {new Date(transaction.createdAt).toLocaleDateString('ar-SA')} 
                          <span className="block text-xs opacity-70">
                            {new Date(transaction.createdAt).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          <div className="mt-4">
            <DataTablePagination
              currentPage={currentPage}
              totalPages={totalPages}
              itemsPerPage={pageSize}
              totalItems={filteredTransactions.length}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={setPageSize}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
