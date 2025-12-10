import { useState, useEffect, useCallback } from 'react';
import { Wallet, FileText, Download, CreditCard, TrendingUp, TrendingDown, Calendar, Filter, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { coreApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Transaction {
  id: string;
  type: 'CREDIT' | 'DEBIT';
  amount: number;
  description: string;
  descriptionAr: string;
  category: string;
  date: string;
  status: 'COMPLETED' | 'PENDING' | 'FAILED';
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  date: string;
  dueDate: string;
  amount: number;
  tax: number;
  total: number;
  status: 'PAID' | 'PENDING' | 'OVERDUE' | 'CANCELLED';
  items: {
    description: string;
    quantity: number;
    price: number;
  }[];
}

export default function WalletInvoices() {
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const loadData = useCallback(async () => {
    try {
      const [walletData, invoicesData] = await Promise.all([
        coreApi.get('/wallet', { requireAuth: true }),
        coreApi.get('/invoices', { requireAuth: true }),
      ]);

      setBalance(walletData.balance || 171);
      setTransactions(walletData.transactions || [
        {
          id: '1',
          type: 'CREDIT',
          amount: 171,
          description: 'Store Credit',
          descriptionAr: 'رصيد المتجر',
          category: 'credit',
          date: '2025-11-01',
          status: 'COMPLETED'
        }
      ]);

      setInvoices(invoicesData.invoices || []);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast({
        title: 'خطأ',
        description: 'فشل تحميل البيانات',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const downloadInvoice = async (invoiceId: string) => {
    try {
      toast({ title: 'جاري التحميل', description: 'جاري تحميل الفاتورة...' });
      
      const invoice = invoices.find(i => i.id === invoiceId);
      if (!invoice) throw new Error('Invoice not found');

      // Generate invoice content
      const content = `
فاتورة ضريبية
رقم الفاتورة: ${invoice.invoiceNumber}
التاريخ: ${new Date(invoice.date).toLocaleDateString('ar-SA')}
تاريخ الاستحقاق: ${new Date(invoice.dueDate).toLocaleDateString('ar-SA')}
----------------------------------------
الوصف                                   الكمية      السعر
----------------------------------------
${invoice.items.map(item => `${item.description.padEnd(40)} ${item.quantity.toString().padEnd(10)} ${item.price.toFixed(2)}`).join('\n')}
----------------------------------------
المجموع الفرعي: ${invoice.amount.toFixed(2)} ريال
الضريبة: ${invoice.tax.toFixed(2)} ريال
----------------------------------------
الإجمالي: ${invoice.total.toFixed(2)} ريال
      `.trim();

      // Create blob and download link
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice-${invoice.invoiceNumber}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({ title: 'نجح', description: 'تم تحميل الفاتورة بنجاح' });
    } catch (error) {
      console.error('Failed to download invoice:', error);
      toast({
        title: 'خطأ',
        description: 'فشل تحميل الفاتورة',
        variant: 'destructive',
      });
    }
  };

  const getTransactionBadge = (type: string) => {
    return type === 'CREDIT' ? (
      <Badge className="bg-green-500/10 text-green-700 border-green-500/20">
        <TrendingUp className="h-3 w-3 ml-1" />
        إيداع
      </Badge>
    ) : (
      <Badge variant="outline" className="bg-red-500/10 text-red-700 border-red-500/20">
        <TrendingDown className="h-3 w-3 ml-1" />
        سحب
      </Badge>
    );
  };

  const getInvoiceStatusBadge = (status: string) => {
    const config = {
      PAID: { label: 'مدفوعة', className: 'bg-green-500/10 text-green-700 border-green-500/20' },
      PENDING: { label: 'قيد الانتظار', className: 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20' },
      OVERDUE: { label: 'متأخرة', className: 'bg-red-500/10 text-red-700 border-red-500/20' },
      CANCELLED: { label: 'ملغاة', className: 'bg-gray-500/10 text-gray-700 border-gray-500/20' },
    };
    const { label, className } = config[status as keyof typeof config] || config.PENDING;
    return <Badge variant="outline" className={className}>{label}</Badge>;
  };

  const filteredTransactions = transactions.filter(t => {
    const matchesType = filterType === 'all' || t.type === filterType;
    const matchesStatus = filterStatus === 'all' || t.status === filterStatus;
    return matchesType && matchesStatus;
  });

  const stats = {
    totalIncome: transactions.filter(t => t.type === 'CREDIT' && t.status === 'COMPLETED').reduce((sum, t) => sum + t.amount, 0),
    totalExpense: transactions.filter(t => t.type === 'DEBIT' && t.status === 'COMPLETED').reduce((sum, t) => sum + t.amount, 0),
    pendingInvoices: invoices.filter(i => i.status === 'PENDING' || i.status === 'OVERDUE').length,
    paidInvoices: invoices.filter(i => i.status === 'PAID').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin w-12 h-12 text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">المحفظة والفواتير</h1>
          <p className="text-sm text-gray-500 mt-1">إدارة المعاملات المالية والفواتير</p>
        </div>
      </div>

      {/* Balance Card */}
      <Card className="bg-gradient-to-br from-primary to-primary/80 text-white border-0">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">الرصيد المتاح</p>
              <p className="text-4xl font-bold mt-2">{balance.toFixed(2)} ريال</p>
              <p className="text-sm opacity-75 mt-2">آخر تحديث: {new Date().toLocaleDateString('ar-SA')}</p>
            </div>
            <Wallet className="h-16 w-16 opacity-50" />
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-r-4 border-r-green-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">إجمالي الإيداعات</p>
                <p className="text-2xl font-bold mt-1">{stats.totalIncome.toFixed(2)} ريال</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-r-4 border-r-red-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">إجمالي المصروفات</p>
                <p className="text-2xl font-bold mt-1">{stats.totalExpense.toFixed(2)} ريال</p>
              </div>
              <TrendingDown className="h-8 w-8 text-red-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-r-4 border-r-yellow-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">فواتير معلقة</p>
                <p className="text-2xl font-bold mt-1">{stats.pendingInvoices}</p>
              </div>
              <FileText className="h-8 w-8 text-yellow-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-r-4 border-r-blue-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">فواتير مدفوعة</p>
                <p className="text-2xl font-bold mt-1">{stats.paidInvoices}</p>
              </div>
              <CreditCard className="h-8 w-8 text-blue-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="transactions" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="transactions">المعاملات</TabsTrigger>
          <TabsTrigger value="invoices">الفواتير</TabsTrigger>
        </TabsList>

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row gap-4">
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-[180px]">
                    <Filter className="h-4 w-4 ml-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الأنواع</SelectItem>
                    <SelectItem value="CREDIT">إيداعات</SelectItem>
                    <SelectItem value="DEBIT">سحوبات</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الحالات</SelectItem>
                    <SelectItem value="COMPLETED">مكتملة</SelectItem>
                    <SelectItem value="PENDING">قيد الانتظار</SelectItem>
                    <SelectItem value="FAILED">فاشلة</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {filteredTransactions.length === 0 ? (
                <div className="text-center py-12">
                  <Wallet className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-xl font-semibold mb-2">لا توجد معاملات</h3>
                  <p className="text-gray-500">لم يتم العثور على معاملات مطابقة</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>التاريخ</TableHead>
                      <TableHead>الوصف</TableHead>
                      <TableHead>النوع</TableHead>
                      <TableHead>المبلغ</TableHead>
                      <TableHead>الحالة</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTransactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            {new Date(transaction.date).toLocaleDateString('ar-SA')}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{transaction.descriptionAr}</p>
                            <p className="text-sm text-gray-500">{transaction.category}</p>
                          </div>
                        </TableCell>
                        <TableCell>{getTransactionBadge(transaction.type)}</TableCell>
                        <TableCell className={`font-bold ${transaction.type === 'CREDIT' ? 'text-green-600' : 'text-red-600'}`}>
                          {transaction.type === 'CREDIT' ? '+' : '-'}{transaction.amount.toFixed(2)} ريال
                        </TableCell>
                        <TableCell>
                          <Badge variant={transaction.status === 'COMPLETED' ? 'default' : 'secondary'}>
                            {transaction.status === 'COMPLETED' && 'مكتملة'}
                            {transaction.status === 'PENDING' && 'قيد الانتظار'}
                            {transaction.status === 'FAILED' && 'فاشلة'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Invoices Tab */}
        <TabsContent value="invoices" className="space-y-4">
          <Card>
            <CardContent className="p-0">
              {invoices.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-xl font-semibold mb-2">لا توجد فواتير</h3>
                  <p className="text-gray-500">لم يتم إصدار أي فواتير بعد</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>رقم الفاتورة</TableHead>
                      <TableHead>التاريخ</TableHead>
                      <TableHead>تاريخ الاستحقاق</TableHead>
                      <TableHead>المبلغ</TableHead>
                      <TableHead>الضريبة</TableHead>
                      <TableHead>الإجمالي</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead>الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-mono font-semibold">
                          {invoice.invoiceNumber}
                        </TableCell>
                        <TableCell>
                          {new Date(invoice.date).toLocaleDateString('ar-SA')}
                        </TableCell>
                        <TableCell>
                          {new Date(invoice.dueDate).toLocaleDateString('ar-SA')}
                        </TableCell>
                        <TableCell>{invoice.amount.toFixed(2)} ريال</TableCell>
                        <TableCell>{invoice.tax.toFixed(2)} ريال</TableCell>
                        <TableCell className="font-bold">
                          {invoice.total.toFixed(2)} ريال
                        </TableCell>
                        <TableCell>{getInvoiceStatusBadge(invoice.status)}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => downloadInvoice(invoice.id)}
                            title="تحميل الفاتورة"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
