import { useState, useEffect, useCallback } from 'react';
import { Wallet, FileText, Download, CreditCard, TrendingUp, TrendingDown, Calendar, Filter, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { coreApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslation } from 'react-i18next';
import { ar, enUS } from 'date-fns/locale';

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
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const dateLocale = isRTL ? 'ar-SA' : 'en-US';

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
        title: t('common.error'),
        description: t('wallet.loadError'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast, t]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const downloadInvoice = async (invoiceId: string) => {
    try {
      toast({ title: t('wallet.downloading'), description: t('wallet.downloading') });
      
      const invoice = invoices.find(i => i.id === invoiceId);
      if (!invoice) throw new Error('Invoice not found');

      // Generate invoice content
      const content = `
${t('wallet.invoices')}
${t('wallet.invoiceNumber')}: ${invoice.invoiceNumber}
${t('wallet.date')}: ${new Date(invoice.date).toLocaleDateString(dateLocale)}
${t('wallet.dueDate')}: ${new Date(invoice.dueDate).toLocaleDateString(dateLocale)}
----------------------------------------
${t('wallet.description').padEnd(40)} ${t('wallet.quantity').padEnd(10)} ${t('wallet.price')}
----------------------------------------
${invoice.items.map(item => `${item.description.padEnd(40)} ${item.quantity.toString().padEnd(10)} ${item.price.toFixed(2)}`).join('\n')}
----------------------------------------
${t('wallet.subtotal')}: ${invoice.amount.toFixed(2)} ${t('common.currency')}
${t('wallet.tax')}: ${invoice.tax.toFixed(2)} ${t('common.currency')}
----------------------------------------
${t('wallet.total')}: ${invoice.total.toFixed(2)} ${t('common.currency')}
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

      toast({ title: t('common.success'), description: t('wallet.downloadSuccess') });
    } catch (error) {
      console.error('Failed to download invoice:', error);
      toast({
        title: t('wallet.downloadError'),
        description: t('wallet.downloadError'),
        variant: 'destructive',
      });
    }
  };

  const getTransactionBadge = (type: string) => {
    return type === 'CREDIT' ? (
      <Badge className="bg-green-500/10 text-green-700 border-green-500/20">
        <TrendingUp className="h-3 w-3 ml-1" />
        {t('wallet.credit')}
      </Badge>
    ) : (
      <Badge variant="outline" className="bg-red-500/10 text-red-700 border-red-500/20">
        <TrendingDown className="h-3 w-3 ml-1" />
        {t('wallet.debit')}
      </Badge>
    );
  };

  const getInvoiceStatusBadge = (status: string) => {
    const config = {
      PAID: { label: t('wallet.paid'), className: 'bg-green-500/10 text-green-700 border-green-500/20' },
      PENDING: { label: t('wallet.pending'), className: 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20' },
      OVERDUE: { label: t('wallet.overdue'), className: 'bg-red-500/10 text-red-700 border-red-500/20' },
      CANCELLED: { label: t('wallet.cancelled'), className: 'bg-gray-500/10 text-gray-700 border-gray-500/20' },
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('wallet.title')}</h1>
          <p className="text-sm text-gray-500 mt-1">{t('wallet.subtitle')}</p>
        </div>
      </div>

      {/* Balance Card */}
      <Card className="bg-gradient-to-br from-primary to-primary/80 text-white border-0">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">{t('wallet.availableBalance')}</p>
              <p className="text-4xl font-bold mt-2">{balance.toFixed(2)} {t('common.currency')}</p>
              <p className="text-sm opacity-75 mt-2">{t('wallet.lastUpdate')}: {new Date().toLocaleDateString(dateLocale)}</p>
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
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('wallet.totalIncome')}</p>
                <p className="text-2xl font-bold mt-1">{stats.totalIncome.toFixed(2)} {t('common.currency')}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-r-4 border-r-red-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('wallet.totalExpense')}</p>
                <p className="text-2xl font-bold mt-1">{stats.totalExpense.toFixed(2)} {t('common.currency')}</p>
              </div>
              <TrendingDown className="h-8 w-8 text-red-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-r-4 border-r-yellow-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('wallet.pendingInvoices')}</p>
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
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('wallet.paidInvoices')}</p>
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
          <TabsTrigger value="transactions">{t('wallet.transactions')}</TabsTrigger>
          <TabsTrigger value="invoices">{t('wallet.invoices')}</TabsTrigger>
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
                    <SelectItem value="all">{t('wallet.allTypes')}</SelectItem>
                    <SelectItem value="CREDIT">{t('wallet.credit')}</SelectItem>
                    <SelectItem value="DEBIT">{t('wallet.debit')}</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('wallet.allStatuses')}</SelectItem>
                    <SelectItem value="COMPLETED">{t('wallet.completed')}</SelectItem>
                    <SelectItem value="PENDING">{t('wallet.pending')}</SelectItem>
                    <SelectItem value="FAILED">{t('wallet.failed')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {filteredTransactions.length === 0 ? (
                <div className="text-center py-12">
                  <Wallet className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-xl font-semibold mb-2">{t('wallet.noTransactions')}</h3>
                  <p className="text-gray-500">{t('wallet.noTransactions')}</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('wallet.date')}</TableHead>
                      <TableHead>{t('wallet.description')}</TableHead>
                      <TableHead>{t('wallet.filterType')}</TableHead>
                      <TableHead>{t('wallet.amount')}</TableHead>
                      <TableHead>{t('wallet.filterStatus')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTransactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            {new Date(transaction.date).toLocaleDateString(dateLocale)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{isRTL ? transaction.descriptionAr : transaction.description}</p>
                            <p className="text-sm text-gray-500">{transaction.category}</p>
                          </div>
                        </TableCell>
                        <TableCell>{getTransactionBadge(transaction.type)}</TableCell>
                        <TableCell className={`font-bold ${transaction.type === 'CREDIT' ? 'text-green-600' : 'text-red-600'}`}>
                          {transaction.type === 'CREDIT' ? '+' : '-'}{transaction.amount.toFixed(2)} {t('common.currency')}
                        </TableCell>
                        <TableCell>
                          <Badge variant={transaction.status === 'COMPLETED' ? 'default' : 'secondary'}>
                            {transaction.status === 'COMPLETED' && t('wallet.completed')}
                            {transaction.status === 'PENDING' && t('wallet.pending')}
                            {transaction.status === 'FAILED' && t('wallet.failed')}
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
                  <h3 className="text-xl font-semibold mb-2">{t('wallet.noInvoices')}</h3>
                  <p className="text-gray-500">{t('wallet.noInvoicesDesc')}</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('wallet.invoiceNumber')}</TableHead>
                      <TableHead>{t('wallet.date')}</TableHead>
                      <TableHead>{t('wallet.dueDate')}</TableHead>
                      <TableHead>{t('wallet.amount')}</TableHead>
                      <TableHead>{t('wallet.tax')}</TableHead>
                      <TableHead>{t('wallet.total')}</TableHead>
                      <TableHead>{t('wallet.filterStatus')}</TableHead>
                      <TableHead>{t('wallet.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-mono font-semibold">
                          {invoice.invoiceNumber}
                        </TableCell>
                        <TableCell>
                          {new Date(invoice.date).toLocaleDateString(dateLocale)}
                        </TableCell>
                        <TableCell>
                          {new Date(invoice.dueDate).toLocaleDateString(dateLocale)}
                        </TableCell>
                        <TableCell>{invoice.amount.toFixed(2)} {t('common.currency')}</TableCell>
                        <TableCell>{invoice.tax.toFixed(2)} {t('common.currency')}</TableCell>
                        <TableCell className="font-bold">
                          {invoice.total.toFixed(2)} {t('common.currency')}
                        </TableCell>
                        <TableCell>{getInvoiceStatusBadge(invoice.status)}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => downloadInvoice(invoice.id)}
                            title={t('wallet.downloadInvoice')}
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
