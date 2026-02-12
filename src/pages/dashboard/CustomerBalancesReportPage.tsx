import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Wallet, 
  Search, 
  Download, 
  Calendar, 
  Smartphone, 
  Globe,
  ArrowUpRight,
  User,
  History,
  Info,
  Filter
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { reportService } from '@/lib/api';
import { formatCurrency } from '@/lib/currency-utils';
import { writeFile, utils } from 'xlsx';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTablePagination } from '@/components/common/DataTablePagination';

interface Recharge {
  id: string;
  amount: number;
  date: string;
  ipAddress?: string;
  userAgent?: string;
  description?: string;
  type: string;
  performedBy?: {
    id: string;
    name: string;
    email: string;
  } | null;
}

interface CustomerBalance {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userRole: string;
  balance: number;
  currency: string;
  lastRecharges: Recharge[];
}

interface FlattenedRecharge extends Recharge {
  customerId: string;
  customerName: string;
  customerEmail: string;
}

export default function CustomerBalancesReportPage() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const { toast } = useToast();
  
  const [data, setData] = useState<{ wallets: CustomerBalance[], totalBalance: number, currency: string }>({
    wallets: [],
    totalBalance: 0,
    currency: 'SAR'
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerBalance | null>(null);
  
  // Recharge History Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [rechargePage, setRechargePage] = useState(1);
  const [rechargeLimit, setRechargeLimit] = useState(20);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await reportService.getCustomerBalancesReport();
      setData(response);
    } catch (error) {
      console.error('Failed to load balance report:', error);
      toast({
        title: isRTL ? 'خطأ' : 'Error',
        description: isRTL ? 'فشل في تحميل تقرير الأرصدة' : 'Failed to load balance report',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [isRTL, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filtered Wallets for Balances Tab
  const filteredWallets = useMemo(() => {
    return data.wallets.filter(w => 
      w.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.userEmail.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [data.wallets, searchQuery]);

  // Flattened Recharges for History Tab
  const allRecharges = useMemo(() => {
    const recharges: FlattenedRecharge[] = [];
    data.wallets.forEach(w => {
      w.lastRecharges.forEach(r => {
        recharges.push({
          ...r,
          customerId: w.userId,
          customerName: w.userName,
          customerEmail: w.userEmail
        });
      });
    });
    return recharges.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [data.wallets]);

  // Filtered Recharges
  const filteredRecharges = useMemo(() => {
    return allRecharges.filter(r => {
      const matchesSearch = 
        r.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.customerEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.description && r.description.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const rDate = new Date(r.date);
      const matchesStart = startDate ? rDate >= new Date(startDate) : true;
      const matchesEnd = endDate ? rDate <= new Date(endDate + 'T23:59:59') : true;

      return matchesSearch && matchesStart && matchesEnd;
    });
  }, [allRecharges, searchQuery, startDate, endDate]);

  // Paginated Recharges
  const paginatedRecharges = useMemo(() => {
    const start = (rechargePage - 1) * rechargeLimit;
    return filteredRecharges.slice(start, start + rechargeLimit);
  }, [filteredRecharges, rechargePage, rechargeLimit]);

  const handleExportBalances = () => {
    try {
      const exportData = filteredWallets.map(w => ({
        [isRTL ? 'اسم العميل' : 'Customer Name']: w.userName,
        [isRTL ? 'البريد الإلكتروني' : 'Email']: w.userEmail,
        [isRTL ? 'الرصيد الحالي' : 'Current Balance']: w.balance,
        [isRTL ? 'العملة' : 'Currency']: w.currency,
        [isRTL ? 'عدد عمليات الشحن الأخيرة' : 'Recent Recharges']: w.lastRecharges.length,
      }));

      const ws = utils.json_to_sheet(exportData);
      const wb = utils.book_new();
      utils.book_append_sheet(wb, ws, isRTL ? 'أرصدة العملاء' : 'Customer Balances');
      writeFile(wb, `customer_balances_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const handleExportRecharges = () => {
    try {
      const exportData = filteredRecharges.map(r => ({
        [isRTL ? 'التاريخ' : 'Date']: new Date(r.date).toLocaleString(isRTL ? 'ar-SA' : 'en-US'),
        [isRTL ? 'العميل' : 'Customer']: r.customerName,
        [isRTL ? 'البريد الإلكتروني' : 'Email']: r.customerEmail,
        [isRTL ? 'المبلغ' : 'Amount']: r.amount,
        [isRTL ? 'الوصف' : 'Description']: r.description || '-',
        [isRTL ? 'الجهاز' : 'Device']: r.userAgent ? parseUserAgent(r.userAgent) : '-',
        [isRTL ? 'IP' : 'IP']: r.ipAddress || '-',
      }));

      const ws = utils.json_to_sheet(exportData);
      const wb = utils.book_new();
      utils.book_append_sheet(wb, ws, isRTL ? 'سجل الشحن' : 'Recharge History');
      writeFile(wb, `recharge_history_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const parseUserAgent = (ua?: string) => {
    if (!ua) return isRTL ? 'غير معروف' : 'Unknown';
    if (ua.includes('iPhone') || ua.includes('iPad')) return 'iOS Device';
    if (ua.includes('Android')) return 'Android Device';
    if (ua.includes('Windows')) return 'Windows PC';
    if (ua.includes('Macintosh')) return 'Mac PC';
    if (ua.includes('Linux')) return 'Linux PC';
    return ua.split(' ')[0] || ua;
  };

  const setDateFilter = (period: 'week' | 'month' | 'all') => {
    const now = new Date();
    if (period === 'all') {
      setStartDate('');
      setEndDate('');
    } else if (period === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      setStartDate(weekAgo.toISOString().split('T')[0]);
      setEndDate(now.toISOString().split('T')[0]);
    } else if (period === 'month') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      setStartDate(monthAgo.toISOString().split('T')[0]);
      setEndDate(now.toISOString().split('T')[0]);
    }
  };

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Wallet className="h-7 w-7 text-primary" />
            {isRTL ? 'تقارير المحفظة والشحن' : 'Wallet & Recharge Reports'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isRTL ? 'متابعة أرصدة العملاء وسجل عمليات الشحن' : 'Track customer balances and recharge history'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadData} disabled={loading}>
            {isRTL ? 'تحديث' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{isRTL ? 'إجمالي الأرصدة في المتجر' : 'Total Store Balance'}</p>
                <p className="text-3xl font-bold mt-1">{formatCurrency(data.totalBalance, data.currency)}</p>
              </div>
              <div className="h-12 w-12 bg-primary/20 rounded-full flex items-center justify-center">
                <Wallet className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{isRTL ? 'إجمالي عمليات الشحن (الفترة المحددة)' : 'Total Recharges (Selected Period)'}</p>
                <p className="text-3xl font-bold mt-1">
                  {formatCurrency(filteredRecharges.reduce((sum, r) => sum + r.amount, 0), data.currency)}
                </p>
              </div>
              <div className="h-12 w-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <ArrowUpRight className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{isRTL ? 'عدد العمليات' : 'Transaction Count'}</p>
                <p className="text-3xl font-bold mt-1">{filteredRecharges.length}</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                <History className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="balances" className="w-full">
        <TabsList className="w-full md:w-auto grid grid-cols-2 md:inline-flex">
          <TabsTrigger value="balances">{isRTL ? 'أرصدة العملاء' : 'Customer Balances'}</TabsTrigger>
          <TabsTrigger value="recharges">{isRTL ? 'سجل عمليات الشحن' : 'Recharge History'}</TabsTrigger>
        </TabsList>

        {/* Balances Tab */}
        <TabsContent value="balances" className="mt-6 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle>{isRTL ? 'أرصدة العملاء الحالية' : 'Current Customer Balances'}</CardTitle>
                  <CardDescription>
                    {isRTL ? 'قائمة بجميع العملاء وأرصدتهم الحالية' : 'List of all customers and their current balances'}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative w-full md:w-64">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder={isRTL ? 'بحث بالاسم أو البريد...' : 'Search by name or email...'}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pr-10"
                    />
                  </div>
                  <Button onClick={handleExportBalances} variant="outline" size="icon" title={isRTL ? 'تصدير' : 'Export'}>
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{isRTL ? 'العميل' : 'Customer'}</TableHead>
                        <TableHead>{isRTL ? 'البريد الإلكتروني' : 'Email'}</TableHead>
                        <TableHead className="text-center">{isRTL ? 'الرصيد الحالي' : 'Balance'}</TableHead>
                        <TableHead className="text-center">{isRTL ? 'آخر شحن' : 'Last Recharge'}</TableHead>
                        <TableHead className="text-left">{isRTL ? 'الإجراءات' : 'Actions'}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredWallets.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                            {isRTL ? 'لا توجد بيانات مطابقة للبحث' : 'No data matching your search'}
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredWallets.map((wallet) => (
                          <TableRow key={wallet.id} className="hover:bg-muted/50 transition-colors">
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                                  {wallet.userName.substring(0, 2).toUpperCase()}
                                </div>
                                <div className="flex flex-col">
                                  <span className="font-medium">{wallet.userName}</span>
                                  <Badge variant="outline" className="w-fit text-[10px] h-4 px-1">
                                    {wallet.userRole}
                                  </Badge>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">{wallet.userEmail}</TableCell>
                            <TableCell className="text-center font-bold text-primary">
                              {formatCurrency(wallet.balance, wallet.currency)}
                            </TableCell>
                            <TableCell className="text-center">
                              {wallet.lastRecharges.length > 0 ? (
                                <div className="flex flex-col items-center">
                                  <span className="text-sm font-medium">
                                    {formatCurrency(wallet.lastRecharges[0].amount, wallet.currency)}
                                  </span>
                                  <span className="text-[10px] text-muted-foreground">
                                    {new Date(wallet.lastRecharges[0].date).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US')}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-xs text-muted-foreground italic">{isRTL ? 'لا يوجد' : 'None'}</span>
                              )}
                            </TableCell>
                            <TableCell className="text-left">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="gap-1 text-xs"
                                onClick={() => setSelectedCustomer(wallet)}
                              >
                                <History className="h-3 w-3" />
                                {isRTL ? 'التفاصيل' : 'Details'}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recharges Tab */}
        <TabsContent value="recharges" className="mt-6 space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <CardTitle>{isRTL ? 'سجل عمليات الشحن' : 'Recharge Operations Log'}</CardTitle>
                    <CardDescription>
                      {isRTL ? 'عرض تفصيلي لجميع عمليات شحن الرصيد' : 'Detailed log of all balance recharge operations'}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setDateFilter('week')}>
                      {isRTL ? 'هذا الأسبوع' : 'This Week'}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setDateFilter('month')}>
                      {isRTL ? 'هذا الشهر' : 'This Month'}
                    </Button>
                    <Button onClick={handleExportRecharges} variant="outline" size="sm" className="gap-2">
                      <Download className="h-4 w-4" />
                      {isRTL ? 'تصدير' : 'Export'}
                    </Button>
                  </div>
                </div>
                
                <div className="flex flex-col md:flex-row gap-4 items-end">
                  <div className="w-full md:w-64 space-y-2">
                    <label className="text-sm font-medium">{isRTL ? 'بحث' : 'Search'}</label>
                    <div className="relative">
                      <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        placeholder={isRTL ? 'بحث بالعميل، الوصف...' : 'Search customer, description...'}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pr-10"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">{isRTL ? 'من تاريخ' : 'From Date'}</label>
                      <Input 
                        type="date" 
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">{isRTL ? 'إلى تاريخ' : 'To Date'}</label>
                      <Input 
                        type="date" 
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{isRTL ? 'التاريخ' : 'Date'}</TableHead>
                      <TableHead>{isRTL ? 'العميل' : 'Customer'}</TableHead>
                      <TableHead>{isRTL ? 'المبلغ' : 'Amount'}</TableHead>
                      <TableHead>{isRTL ? 'الوصف' : 'Description'}</TableHead>
                      <TableHead>{isRTL ? 'الجهاز' : 'Device'}</TableHead>
                      <TableHead>{isRTL ? 'IP' : 'IP'}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedRecharges.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                          {isRTL ? 'لا توجد عمليات شحن في هذه الفترة' : 'No recharges found in this period'}
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedRecharges.map((recharge) => (
                        <TableRow key={recharge.id}>
                          <TableCell className="whitespace-nowrap">
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {new Date(recharge.date).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US')}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {new Date(recharge.date).toLocaleTimeString(isRTL ? 'ar-SA' : 'en-US')}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">{recharge.customerName}</span>
                              <span className="text-xs text-muted-foreground">{recharge.customerEmail}</span>
                            </div>
                          </TableCell>
                          <TableCell className="font-bold text-green-600">
                            +{formatCurrency(recharge.amount, data.currency)}
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate" title={recharge.description}>
                            {recharge.description || '-'}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Smartphone className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs">{parseUserAgent(recharge.userAgent)}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Globe className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs font-mono">{recharge.ipAddress || '-'}</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              
              <div className="mt-4">
                <DataTablePagination
                  currentPage={rechargePage}
                  totalPages={Math.ceil(filteredRecharges.length / rechargeLimit)}
                  totalItems={filteredRecharges.length}
                  itemsPerPage={rechargeLimit}
                  onPageChange={setRechargePage}
                  onItemsPerPageChange={(val) => { setRechargeLimit(val); setRechargePage(1); }}
                  showItemsPerPage={true}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Details Dialog */}
      <Dialog open={!!selectedCustomer} onOpenChange={(open) => !open && setSelectedCustomer(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
          {selectedCustomer && (
            <>
              <DialogHeader className="p-6 border-b bg-muted/30">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xl">
                    {selectedCustomer.userName.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <DialogTitle className="text-xl">{selectedCustomer.userName}</DialogTitle>
                    <DialogDescription asChild>
                      <div className="flex items-center gap-2 mt-1">
                        {selectedCustomer.userEmail}
                        <Badge variant="secondary" className="text-[10px] h-4">{selectedCustomer.userRole}</Badge>
                      </div>
                    </DialogDescription>
                  </div>
                  <div className="mr-auto text-left">
                    <p className="text-xs text-muted-foreground">{isRTL ? 'الرصيد الحالي' : 'Current Balance'}</p>
                    <p className="text-2xl font-bold text-primary">
                      {formatCurrency(selectedCustomer.balance, selectedCustomer.currency)}
                    </p>
                  </div>
                </div>
              </DialogHeader>

              <ScrollArea className="flex-1 p-6">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
                      <History className="h-5 w-5 text-primary" />
                      {isRTL ? 'سجل العمليات الأخيرة' : 'Recent Transaction History'}
                    </h3>
                    
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader className="bg-muted/50">
                          <TableRow>
                            <TableHead>{isRTL ? 'التاريخ' : 'Date'}</TableHead>
                            <TableHead className="text-center">{isRTL ? 'النوع' : 'Type'}</TableHead>
                            <TableHead className="text-center">{isRTL ? 'المبلغ' : 'Amount'}</TableHead>
                            <TableHead className="text-center">{isRTL ? 'بواسطة' : 'Performed By'}</TableHead>
                            <TableHead className="text-center">{isRTL ? 'الجهاز' : 'Device'}</TableHead>
                            <TableHead className="text-center">{isRTL ? 'عنوان IP' : 'IP Address'}</TableHead>
                            <TableHead>{isRTL ? 'الوصف' : 'Description'}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedCustomer.lastRecharges.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                                {isRTL ? 'لا توجد عمليات مسجلة' : 'No transactions recorded'}
                              </TableCell>
                            </TableRow>
                          ) : (
                            selectedCustomer.lastRecharges.map((recharge) => {
                              const isPositive = recharge.amount >= 0;
                              const typeLabels: Record<string, { en: string; ar: string; color: string }> = {
                                TOPUP: { en: 'Recharge', ar: 'شحن', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
                                PURCHASE: { en: 'Purchase', ar: 'شراء', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
                                REFUND: { en: 'Refund', ar: 'استرداد', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
                                ADJUSTMENT: { en: 'Manual', ar: 'يدوي', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' },
                                BONUS: { en: 'Bonus', ar: 'مكافأة', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
                                WITHDRAWAL: { en: 'Withdrawal', ar: 'سحب', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' },
                              };
                              const typeInfo = typeLabels[recharge.type] || { en: recharge.type, ar: recharge.type, color: 'bg-gray-100 text-gray-800' };
                              
                              return (
                              <TableRow key={recharge.id}>
                                <TableCell className="text-sm whitespace-nowrap">
                                  {new Date(recharge.date).toLocaleString(isRTL ? 'ar-SA' : 'en-US')}
                                </TableCell>
                                <TableCell className="text-center">
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${typeInfo.color}`}>
                                    {isRTL ? typeInfo.ar : typeInfo.en}
                                  </span>
                                </TableCell>
                                <TableCell className={`text-center font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                                  {isPositive ? '+' : ''}{formatCurrency(recharge.amount, selectedCustomer.currency)}
                                </TableCell>
                                <TableCell className="text-center">
                                  {recharge.performedBy ? (
                                    <div className="flex flex-col items-center gap-0.5">
                                      <span className="text-xs font-medium">{recharge.performedBy.name}</span>
                                      <span className="text-[10px] text-muted-foreground">{recharge.performedBy.email}</span>
                                    </div>
                                  ) : (
                                    <span className="text-[10px] text-muted-foreground">{isRTL ? 'النظام' : 'System'}</span>
                                  )}
                                </TableCell>
                                <TableCell className="text-center">
                                  <div className="flex flex-col items-center gap-1">
                                    <Smartphone className="h-3 w-3 text-muted-foreground" />
                                    <span className="text-[10px] max-w-[120px] truncate" title={recharge.userAgent}>
                                      {parseUserAgent(recharge.userAgent)}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell className="text-center">
                                  <div className="flex flex-col items-center gap-1">
                                    <Globe className="h-3 w-3 text-muted-foreground" />
                                    <span className="text-[10px] font-mono">
                                      {recharge.ipAddress || (isRTL ? 'غير متوفر' : 'N/A')}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell className="text-sm italic text-muted-foreground">
                                  {recharge.description || (isRTL ? 'عملية' : 'Transaction')}
                                </TableCell>
                              </TableRow>
                              );
                            })
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-100 dark:border-blue-900/30 flex gap-3">
                    <Info className="h-5 w-5 text-blue-500 shrink-0" />
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      {isRTL 
                        ? 'يتم تسجيل معلومات الجهاز وعنوان IP تلقائياً عند كل عملية شحن لضمان الأمان وتتبع العمليات.' 
                        : 'Device information and IP address are automatically recorded for each recharge to ensure security and transaction tracking.'}
                    </p>
                  </div>
                </div>
              </ScrollArea>

              <div className="p-4 border-t bg-muted/30 flex justify-end">
                <Button onClick={() => setSelectedCustomer(null)}>
                  {isRTL ? 'إغلاق' : 'Close'}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
