import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Wallet, 
  Loader2,
  CreditCard,
  Building2,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  CheckCircle,
  XCircle,
  Upload,
  Copy,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  History
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { coreApi } from '@/lib/api';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface WalletData {
  id: string;
  balance: number;
  currency: string;
  lastUpdated: string;
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  currency: string;
  status: string;
  description: string;
  reference?: string;
  createdAt: string;
}

interface TopUpRequest {
  id: string;
  amount: number;
  currency: string;
  status: string;
  paymentMethod: string;
  proofImageUrl?: string;
  notes?: string;
  createdAt: string;
  approvedAt?: string;
}

interface Bank {
  id: string;
  name: string;
  nameAr?: string;
  accountName: string;
  accountNumber: string;
  iban?: string;
  logoUrl?: string;
}

const transactionTypeConfig: Record<string, { label: string; labelAr: string; icon: any; color: string }> = {
  TOPUP: { label: 'Top Up', labelAr: 'إيداع', icon: ArrowDownLeft, color: 'text-green-500' },
  PURCHASE: { label: 'Purchase', labelAr: 'شراء', icon: ArrowUpRight, color: 'text-red-500' },
  REFUND: { label: 'Refund', labelAr: 'استرداد', icon: ArrowDownLeft, color: 'text-green-500' },
  BONUS: { label: 'Bonus', labelAr: 'مكافأة', icon: Plus, color: 'text-green-500' },
  WITHDRAWAL: { label: 'Withdrawal', labelAr: 'سحب', icon: ArrowUpRight, color: 'text-red-500' },
  ADJUSTMENT: { label: 'Adjustment', labelAr: 'تعديل', icon: RefreshCw, color: 'text-blue-500' },
};

const statusConfig: Record<string, { label: string; labelAr: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: any }> = {
  PENDING: { label: 'Pending', labelAr: 'معلق', variant: 'secondary', icon: Clock },
  APPROVED: { label: 'Approved', labelAr: 'موافق عليه', variant: 'default', icon: CheckCircle },
  COMPLETED: { label: 'Completed', labelAr: 'مكتمل', variant: 'default', icon: CheckCircle },
  REJECTED: { label: 'Rejected', labelAr: 'مرفوض', variant: 'destructive', icon: XCircle },
  FAILED: { label: 'Failed', labelAr: 'فشل', variant: 'destructive', icon: XCircle },
};

export default function WalletPage() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [topUpRequests, setTopUpRequests] = useState<TopUpRequest[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTopUpDialog, setShowTopUpDialog] = useState(false);
  const [selectedBank, setSelectedBank] = useState<Bank | null>(null);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [proofImage, setProofImage] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Fetch wallet data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [walletRes, transactionsRes, topUpRes, banksRes] = await Promise.all([
          coreApi.get('/wallet', { requireAuth: true }),
          coreApi.get('/wallet/transactions?limit=50', { requireAuth: true }),
          coreApi.get('/wallet/top-up-requests', { requireAuth: true }),
          coreApi.get('/wallet/banks', { requireAuth: true }),
        ]);
        setWallet(walletRes);
        setTransactions(transactionsRes.data || []);
        setTopUpRequests(topUpRes.data || []);
        setBanks(banksRes.data || []);
      } catch (error) {
        console.error('Error fetching wallet data:', error);
        toast.error(t('common.error', 'حدث خطأ'));
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [t]);

  // Format date
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'dd/MM/yyyy HH:mm', { locale: isRTL ? ar : undefined });
    } catch {
      return dateString;
    }
  };

  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(isRTL ? 'تم النسخ' : 'Copied');
  };

  // Submit top-up request
  const handleTopUpSubmit = async () => {
    if (!selectedBank || !topUpAmount || parseFloat(topUpAmount) <= 0) {
      toast.error(isRTL ? 'يرجى ملء جميع الحقول' : 'Please fill all fields');
      return;
    }

    try {
      setSubmitting(true);
      
      const formData = new FormData();
      formData.append('amount', topUpAmount);
      formData.append('bankId', selectedBank.id);
      formData.append('paymentMethod', 'BANK_TRANSFER');
      if (proofImage) {
        formData.append('proofImage', proofImage);
      }
      
      await coreApi.post('/wallet/top-up', formData, { 
        requireAuth: true,
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      toast.success(isRTL ? 'تم إرسال طلب الشحن بنجاح' : 'Top-up request submitted successfully');
      setShowTopUpDialog(false);
      setTopUpAmount('');
      setSelectedBank(null);
      setProofImage(null);
      
      // Refresh data
      const topUpRes = await coreApi.get('/wallet/top-up-requests', { requireAuth: true });
      setTopUpRequests(topUpRes.data || []);
    } catch (error) {
      console.error('Error submitting top-up:', error);
      toast.error(isRTL ? 'فشل إرسال طلب الشحن' : 'Failed to submit top-up request');
    } finally {
      setSubmitting(false);
    }
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
          <Wallet className="h-6 w-6" />
          {isRTL ? 'محفظتي' : 'My Wallet'}
        </h1>
      </div>

      {/* Balance Card */}
      <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">
                {isRTL ? 'الرصيد المتاح' : 'Available Balance'}
              </p>
              <div className="text-4xl font-bold text-primary">
                {wallet?.balance.toFixed(2) || '0.00'}
                <span className="text-xl ml-2">{wallet?.currency || 'SAR'}</span>
              </div>
              {wallet?.lastUpdated && (
                <p className="text-xs text-muted-foreground mt-2">
                  {isRTL ? 'آخر تحديث: ' : 'Last updated: '}
                  {formatDate(wallet.lastUpdated)}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Dialog open={showTopUpDialog} onOpenChange={setShowTopUpDialog}>
                <DialogTrigger asChild>
                  <Button size="lg" className="gap-2">
                    <Plus className="h-5 w-5" />
                    {isRTL ? 'شحن الرصيد' : 'Top Up'}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Building2 className="h-5 w-5" />
                      {isRTL ? 'شحن الرصيد عبر التحويل البنكي' : 'Top Up via Bank Transfer'}
                    </DialogTitle>
                    <DialogDescription>
                      {isRTL 
                        ? 'اختر البنك وأدخل المبلغ ثم قم بالتحويل وأرفق صورة الإيصال'
                        : 'Select a bank, enter the amount, transfer, and upload the receipt'
                      }
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4">
                    {/* Bank Selection */}
                    <div className="space-y-2">
                      <Label>{isRTL ? 'اختر البنك' : 'Select Bank'}</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {banks.map((bank) => (
                          <Card
                            key={bank.id}
                            className={cn(
                              'p-3 cursor-pointer transition-all hover:border-primary',
                              selectedBank?.id === bank.id && 'border-primary bg-primary/5'
                            )}
                            onClick={() => setSelectedBank(bank)}
                          >
                            <div className="flex items-center gap-2">
                              <div className="w-10 h-10 rounded bg-muted flex items-center justify-center overflow-hidden">
                                {bank.logoUrl ? (
                                  <img src={bank.logoUrl} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <Building2 className="h-5 w-5 text-muted-foreground" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">
                                  {isRTL ? bank.nameAr || bank.name : bank.name}
                                </p>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>

                    {/* Bank Details */}
                    {selectedBank && (
                      <Card className="bg-muted">
                        <CardContent className="p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">
                              {isRTL ? 'اسم الحساب' : 'Account Name'}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{selectedBank.accountName}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(selectedBank.accountName)}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">
                              {isRTL ? 'رقم الحساب' : 'Account Number'}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="font-medium font-mono">{selectedBank.accountNumber}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(selectedBank.accountNumber)}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          {selectedBank.iban && (
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">IBAN</span>
                              <div className="flex items-center gap-2">
                                <span className="font-medium font-mono text-xs">{selectedBank.iban}</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyToClipboard(selectedBank.iban || '')}
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )}

                    {/* Amount */}
                    <div className="space-y-2">
                      <Label>{isRTL ? 'المبلغ (ريال)' : 'Amount (SAR)'}</Label>
                      <Input
                        type="number"
                        min="1"
                        placeholder={isRTL ? 'أدخل المبلغ' : 'Enter amount'}
                        value={topUpAmount}
                        onChange={(e) => setTopUpAmount(e.target.value)}
                      />
                    </div>

                    {/* Proof Upload */}
                    <div className="space-y-2">
                      <Label>{isRTL ? 'صورة الإيصال (اختياري)' : 'Receipt Image (optional)'}</Label>
                      <div className="border-2 border-dashed rounded-lg p-4 text-center">
                        {proofImage ? (
                          <div className="flex items-center justify-center gap-2">
                            <CheckCircle className="h-5 w-5 text-green-500" />
                            <span className="text-sm">{proofImage.name}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setProofImage(null)}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <label className="cursor-pointer">
                            <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                            <span className="text-sm text-muted-foreground">
                              {isRTL ? 'اضغط لرفع الصورة' : 'Click to upload'}
                            </span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => setProofImage(e.target.files?.[0] || null)}
                            />
                          </label>
                        )}
                      </div>
                    </div>
                  </div>

                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowTopUpDialog(false)}>
                      {isRTL ? 'إلغاء' : 'Cancel'}
                    </Button>
                    <Button onClick={handleTopUpSubmit} disabled={submitting || !selectedBank || !topUpAmount}>
                      {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      {isRTL ? 'إرسال الطلب' : 'Submit Request'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="transactions">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="transactions" className="gap-2">
            <History className="h-4 w-4" />
            {isRTL ? 'سجل العمليات' : 'Transactions'}
          </TabsTrigger>
          <TabsTrigger value="requests" className="gap-2">
            <Clock className="h-4 w-4" />
            {isRTL ? 'طلبات الشحن' : 'Top-up Requests'}
          </TabsTrigger>
        </TabsList>

        {/* Transactions Tab */}
        <TabsContent value="transactions">
          <Card>
            <CardContent className="p-0">
              {transactions.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <History className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">
                    {isRTL ? 'لا توجد عمليات' : 'No transactions yet'}
                  </h3>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className={isRTL ? 'text-right' : ''}>{isRTL ? 'النوع' : 'Type'}</TableHead>
                      <TableHead className={isRTL ? 'text-right' : ''}>{isRTL ? 'المبلغ' : 'Amount'}</TableHead>
                      <TableHead className={isRTL ? 'text-right' : ''}>{isRTL ? 'الوصف' : 'Description'}</TableHead>
                      <TableHead className={isRTL ? 'text-right' : ''}>{isRTL ? 'الحالة' : 'Status'}</TableHead>
                      <TableHead className={isRTL ? 'text-right' : ''}>{isRTL ? 'التاريخ' : 'Date'}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((tx) => {
                      const typeConfig = transactionTypeConfig[tx.type] || transactionTypeConfig.ADJUSTMENT;
                      const status = statusConfig[tx.status] || statusConfig.PENDING;
                      const TypeIcon = typeConfig.icon;
                      const isCredit = ['TOPUP', 'REFUND', 'BONUS'].includes(tx.type);
                      
                      return (
                        <TableRow key={tx.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <TypeIcon className={cn('h-4 w-4', typeConfig.color)} />
                              {isRTL ? typeConfig.labelAr : typeConfig.label}
                            </div>
                          </TableCell>
                          <TableCell className={cn('font-semibold', isCredit ? 'text-green-600' : 'text-red-600')}>
                            {isCredit ? '+' : '-'} {tx.amount.toFixed(2)} {tx.currency}
                          </TableCell>
                          <TableCell className="text-muted-foreground">{tx.description || '-'}</TableCell>
                          <TableCell>
                            <Badge variant={status.variant}>
                              {isRTL ? status.labelAr : status.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{formatDate(tx.createdAt)}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Top-up Requests Tab */}
        <TabsContent value="requests">
          <Card>
            <CardContent className="p-0">
              {topUpRequests.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Clock className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">
                    {isRTL ? 'لا توجد طلبات شحن' : 'No top-up requests'}
                  </h3>
                  <Button variant="outline" onClick={() => setShowTopUpDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    {isRTL ? 'شحن الرصيد' : 'Top Up'}
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className={isRTL ? 'text-right' : ''}>{isRTL ? 'المبلغ' : 'Amount'}</TableHead>
                      <TableHead className={isRTL ? 'text-right' : ''}>{isRTL ? 'طريقة الدفع' : 'Method'}</TableHead>
                      <TableHead className={isRTL ? 'text-right' : ''}>{isRTL ? 'الحالة' : 'Status'}</TableHead>
                      <TableHead className={isRTL ? 'text-right' : ''}>{isRTL ? 'التاريخ' : 'Date'}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topUpRequests.map((req) => {
                      const status = statusConfig[req.status] || statusConfig.PENDING;
                      const StatusIcon = status.icon;
                      
                      return (
                        <TableRow key={req.id}>
                          <TableCell className="font-semibold">
                            {req.amount.toFixed(2)} {req.currency}
                          </TableCell>
                          <TableCell>{req.paymentMethod}</TableCell>
                          <TableCell>
                            <Badge variant={status.variant} className="gap-1">
                              <StatusIcon className="h-3 w-3" />
                              {isRTL ? status.labelAr : status.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{formatDate(req.createdAt)}</TableCell>
                        </TableRow>
                      );
                    })}
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

