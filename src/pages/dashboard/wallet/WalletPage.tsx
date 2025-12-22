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
import { coreApi, walletService, type Bank, type CreateBankDto } from '@/lib/api';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';

interface WalletData {
  id: string;
  balance: number;
  currency: string;
  lastUpdated: string;
}

interface Transaction {
  id: string;
  type: 'TOPUP' | 'PURCHASE' | 'REFUND' | 'BONUS' | 'ADJUSTMENT' | 'WITHDRAWAL';
  amount: number | string;
  currency: string;
  status: 'COMPLETED' | 'PENDING' | 'FAILED';
  description: string;
  descriptionAr?: string;
  reference?: string;
  createdAt: string;
}

interface TopUpRequest {
  id: string;
  amount: number | string;
  currency: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  paymentMethod: 'BANK_TRANSFER' | 'VISA' | 'MASTERCARD' | 'MADA' | 'APPLE_PAY' | 'STC_PAY';
  receiptImage?: string;
  notes?: string;
  createdAt: string;
  processedAt?: string;
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
  const { user, loading: authLoading } = useAuth();
  
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [topUpRequests, setTopUpRequests] = useState<TopUpRequest[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [allBanks, setAllBanks] = useState<Bank[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTopUpDialog, setShowTopUpDialog] = useState(false);
  const [showAddBankDialog, setShowAddBankDialog] = useState(false);
  const [editingBank, setEditingBank] = useState<Bank | null>(null);
  const [selectedBank, setSelectedBank] = useState<Bank | null>(null);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [proofImage, setProofImage] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Bank form state
  const [bankForm, setBankForm] = useState<CreateBankDto>({
    name: '',
    nameAr: '',
    code: '',
    accountName: '',
    accountNumber: '',
    iban: '',
    swiftCode: '',
    isActive: true,
    sortOrder: 0,
  });
  const [bankLogoFile, setBankLogoFile] = useState<File | null>(null);

  // Fetch wallet data
  useEffect(() => {
    const fetchData = async () => {
      // Don't fetch if auth is loading or user has no tenant
      if (authLoading) return;
      
      if (!user?.tenantId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const [walletRes, transactionsRes, topUpRes, banksRes, allBanksRes] = await Promise.all([
          walletService.getBalance().catch(() => ({ balance: 0, currency: 'SAR' })),
          walletService.getTransactions(1, 50).catch(() => ({ data: [], total: 0, page: 1, limit: 50, totalPages: 0 })),
          walletService.getTopUpRequests().catch(() => []),
          walletService.getBanks().catch(() => []),
          walletService.getAllBanks().catch(() => []),
        ]);
        setWallet({
          id: walletRes.id || '',
          balance: typeof walletRes.balance === 'string' ? parseFloat(walletRes.balance) : walletRes.balance || 0,
          currency: walletRes.currency || 'SAR',
          lastUpdated: walletRes.updatedAt || new Date().toISOString(),
        });
        setTransactions(transactionsRes.data || []);
        setTopUpRequests(Array.isArray(topUpRes) ? topUpRes : []);
        setBanks(Array.isArray(banksRes) ? banksRes : []);
        setAllBanks(Array.isArray(allBanksRes) ? allBanksRes : []);
      } catch (error) {
        console.error('Error fetching wallet data:', error);
        toast.error(t('common.error', 'حدث خطأ'));
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [t, authLoading, user?.tenantId]);

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

  // Handle add/edit merchant bank
  const handleSaveBank = async () => {
    if (!bankForm.name || !bankForm.code || !bankForm.accountName || !bankForm.accountNumber || !bankForm.iban) {
      toast.error(isRTL ? 'يرجى ملء جميع الحقول المطلوبة' : 'Please fill all required fields');
      return;
    }

    try {
      setSubmitting(true);
      if (editingBank) {
        await walletService.updateBank(editingBank.id, bankForm, bankLogoFile || undefined);
        toast.success(isRTL ? 'تم تحديث البنك بنجاح' : 'Bank updated successfully');
      } else {
        await walletService.createBank(bankForm, bankLogoFile || undefined);
        toast.success(isRTL ? 'تم إضافة البنك بنجاح' : 'Bank added successfully');
      }
      setShowAddBankDialog(false);
      setEditingBank(null);
      setBankForm({
        name: '',
        nameAr: '',
        code: '',
        accountName: '',
        accountNumber: '',
        iban: '',
        swiftCode: '',
        isActive: true,
        sortOrder: 0,
      });
      setBankLogoFile(null);
      
      // Refresh banks
      const [banksRes, allBanksRes] = await Promise.all([
        walletService.getBanks().catch(() => []),
        walletService.getAllBanks().catch(() => []),
      ]);
      setBanks(Array.isArray(banksRes) ? banksRes : []);
      setAllBanks(Array.isArray(allBanksRes) ? allBanksRes : []);
    } catch (error: any) {
      console.error('Error saving bank:', error);
      toast.error(error?.message || (isRTL ? 'فشل حفظ البنك' : 'Failed to save bank'));
    } finally {
      setSubmitting(false);
    }
  };

  // Handle delete bank
  const handleDeleteBank = async (bankId: string) => {
    if (!confirm(isRTL ? 'هل أنت متأكد من حذف هذا البنك؟' : 'Are you sure you want to delete this bank?')) {
      return;
    }

    try {
      await walletService.deleteBank(bankId);
      toast.success(isRTL ? 'تم حذف البنك بنجاح' : 'Bank deleted successfully');
      
      // Refresh banks
      const [banksRes, allBanksRes] = await Promise.all([
        walletService.getBanks().catch(() => []),
        walletService.getAllBanks().catch(() => []),
      ]);
      setBanks(Array.isArray(banksRes) ? banksRes : []);
      setAllBanks(Array.isArray(allBanksRes) ? allBanksRes : []);
    } catch (error: any) {
      console.error('Error deleting bank:', error);
      toast.error(error?.message || (isRTL ? 'فشل حذف البنك' : 'Failed to delete bank'));
    }
  };

  // Handle edit bank
  const handleEditBank = (bank: Bank) => {
    setEditingBank(bank);
    setBankForm({
      name: bank.name,
      nameAr: bank.nameAr || '',
      code: bank.code,
      accountName: bank.accountName,
      accountNumber: bank.accountNumber,
      iban: bank.iban,
      swiftCode: bank.swiftCode || '',
      isActive: bank.isActive,
      sortOrder: bank.sortOrder,
    });
    setBankLogoFile(null);
    setShowAddBankDialog(true);
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
      
      // Convert File to base64 if image provided
      let receiptImageUrl: string | undefined;
      if (proofImage) {
        const reader = new FileReader();
        receiptImageUrl = await new Promise<string>((resolve, reject) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(proofImage);
        });
      }

      await walletService.createTopUpRequest({
        amount: parseFloat(topUpAmount),
        currency: 'SAR',
        paymentMethod: 'BANK_TRANSFER',
        bankId: selectedBank.id,
        receiptImage: receiptImageUrl,
      });
      
      toast.success(isRTL ? 'تم إرسال طلب الشحن بنجاح' : 'Top-up request submitted successfully');
      setShowTopUpDialog(false);
      setTopUpAmount('');
      setSelectedBank(null);
      setProofImage(null);
      
      // Refresh data
      const topUpRes = await walletService.getTopUpRequests();
      setTopUpRequests(Array.isArray(topUpRes) ? topUpRes : []);
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
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="transactions" className="gap-2">
            <History className="h-4 w-4" />
            {isRTL ? 'سجل العمليات' : 'Transactions'}
          </TabsTrigger>
          <TabsTrigger value="requests" className="gap-2">
            <Clock className="h-4 w-4" />
            {isRTL ? 'طلبات الشحن' : 'Top-up Requests'}
          </TabsTrigger>
          <TabsTrigger value="bank-accounts" className="gap-2">
            <Building2 className="h-4 w-4" />
            {isRTL ? 'البنوك' : 'Banks'}
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
                            {isCredit ? '+' : '-'} {typeof tx.amount === 'string' ? parseFloat(tx.amount).toFixed(2) : tx.amount.toFixed(2)} {tx.currency}
                          </TableCell>
                          <TableCell className="text-muted-foreground">{isRTL ? (tx.descriptionAr || tx.description || '-') : (tx.description || '-')}</TableCell>
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
                            {typeof req.amount === 'string' ? parseFloat(req.amount).toFixed(2) : req.amount.toFixed(2)} {req.currency}
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

        {/* Bank Accounts Tab */}
        <TabsContent value="bank-accounts">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{isRTL ? 'البنوك' : 'Banks'}</CardTitle>
                  <CardDescription>
                    {isRTL 
                      ? 'إدارة البنوك التي يمكن للعملاء التحويل إليها'
                      : 'Manage banks that customers can transfer to'
                    }
                  </CardDescription>
                </div>
                <Dialog open={showAddBankDialog} onOpenChange={(open) => {
                  setShowAddBankDialog(open);
                  if (!open) {
                    setEditingBank(null);
                    setBankForm({
                      name: '',
                      nameAr: '',
                      code: '',
                      accountName: '',
                      accountNumber: '',
                      iban: '',
                      swiftCode: '',
                      isActive: true,
                      sortOrder: 0,
                    });
                    setBankLogoFile(null);
                  }
                }}>
                  <DialogTrigger asChild>
                    <Button className="gap-2" onClick={() => {
                      setEditingBank(null);
                      setBankForm({
                        name: '',
                        nameAr: '',
                        code: '',
                        accountName: '',
                        accountNumber: '',
                        iban: '',
                        swiftCode: '',
                        isActive: true,
                        sortOrder: 0,
                      });
                      setBankLogoFile(null);
                    }}>
                      <Plus className="h-4 w-4" />
                      {isRTL ? 'إضافة بنك' : 'Add Bank'}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5" />
                        {editingBank 
                          ? (isRTL ? 'تعديل البنك' : 'Edit Bank')
                          : (isRTL ? 'إضافة بنك جديد' : 'Add New Bank')
                        }
                      </DialogTitle>
                      <DialogDescription>
                        {isRTL 
                          ? 'أدخل معلومات البنك الذي يمكن للعملاء التحويل إليه'
                          : 'Enter bank information that customers can transfer to'
                        }
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                      {/* Bank Name */}
                      <div className="space-y-2">
                        <Label>{isRTL ? 'اسم البنك *' : 'Bank Name *'}</Label>
                        <Input
                          placeholder={isRTL ? 'مثال: البنك الأهلي السعودي' : 'e.g., NBE Bank'}
                          value={bankForm.name}
                          onChange={(e) => setBankForm({ ...bankForm, name: e.target.value })}
                        />
                      </div>

                      {/* Bank Name (Arabic) */}
                      <div className="space-y-2">
                        <Label>{isRTL ? 'اسم البنك (عربي)' : 'Bank Name (Arabic)'}</Label>
                        <Input
                          placeholder={isRTL ? 'مثال: مصرف الأهلي' : 'e.g., مصرف الأهلي'}
                          value={bankForm.nameAr || ''}
                          onChange={(e) => setBankForm({ ...bankForm, nameAr: e.target.value })}
                        />
                      </div>

                      {/* Bank Code */}
                      <div className="space-y-2">
                        <Label>{isRTL ? 'رمز البنك *' : 'Bank Code *'}</Label>
                        <Input
                          placeholder={isRTL ? 'مثال: ahli' : 'e.g., ahli'}
                          value={bankForm.code}
                          onChange={(e) => setBankForm({ ...bankForm, code: e.target.value })}
                          disabled={!!editingBank}
                        />
                        {editingBank && (
                          <p className="text-xs text-muted-foreground">
                            {isRTL ? 'لا يمكن تغيير رمز البنك بعد الإنشاء' : 'Bank code cannot be changed after creation'}
                          </p>
                        )}
                      </div>

                      {/* Logo Upload */}
                      <div className="space-y-2">
                        <Label>{isRTL ? 'شعار البنك' : 'Bank Logo'}</Label>
                        <div className="border-2 border-dashed rounded-lg p-4 text-center">
                          {bankLogoFile ? (
                            <div className="flex items-center justify-center gap-2">
                              <img 
                                src={URL.createObjectURL(bankLogoFile)} 
                                alt="Logo preview" 
                                className="h-16 w-16 object-contain"
                              />
                              <span className="text-sm">{bankLogoFile.name}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setBankLogoFile(null)}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : editingBank && editingBank.logo ? (
                            <div className="flex items-center justify-center gap-2">
                              <img 
                                src={editingBank.logo} 
                                alt="Current logo" 
                                className="h-16 w-16 object-contain"
                              />
                              <span className="text-sm text-muted-foreground">
                                {isRTL ? 'الشعار الحالي' : 'Current logo'}
                              </span>
                            </div>
                          ) : (
                            <label className="cursor-pointer">
                              <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                              <span className="text-sm text-muted-foreground">
                                {isRTL ? 'اضغط لرفع الشعار' : 'Click to upload logo'}
                              </span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => setBankLogoFile(e.target.files?.[0] || null)}
                              />
                            </label>
                          )}
                        </div>
                      </div>

                      {/* Account Name */}
                      <div className="space-y-2">
                        <Label>{isRTL ? 'اسم صاحب الحساب *' : 'Account Holder Name *'}</Label>
                        <Input
                          placeholder={isRTL ? 'مثال: Company Name' : 'e.g., Company Name'}
                          value={bankForm.accountName}
                          onChange={(e) => setBankForm({ ...bankForm, accountName: e.target.value })}
                        />
                      </div>

                      {/* Account Number */}
                      <div className="space-y-2">
                        <Label>{isRTL ? 'رقم الحساب *' : 'Account Number *'}</Label>
                        <Input
                          placeholder={isRTL ? 'رقم الحساب البنكي' : 'Bank account number'}
                          value={bankForm.accountNumber}
                          onChange={(e) => setBankForm({ ...bankForm, accountNumber: e.target.value })}
                        />
                      </div>

                      {/* IBAN */}
                      <div className="space-y-2">
                        <Label>{isRTL ? 'IBAN *' : 'IBAN *'}</Label>
                        <Input
                          placeholder={isRTL ? 'SA1234567890123456789012' : 'SA1234567890123456789012'}
                          value={bankForm.iban}
                          onChange={(e) => setBankForm({ ...bankForm, iban: e.target.value })}
                        />
                      </div>

                      {/* Swift Code */}
                      <div className="space-y-2">
                        <Label>{isRTL ? 'SWIFT Code' : 'SWIFT Code'}</Label>
                        <Input
                          placeholder={isRTL ? 'مثال: RJHISARI' : 'e.g., RJHISARI'}
                          value={bankForm.swiftCode || ''}
                          onChange={(e) => setBankForm({ ...bankForm, swiftCode: e.target.value })}
                        />
                      </div>

                      {/* Sort Order */}
                      <div className="space-y-2">
                        <Label>{isRTL ? 'ترتيب العرض' : 'Sort Order'}</Label>
                        <Input
                          type="number"
                          placeholder="0"
                          value={bankForm.sortOrder}
                          onChange={(e) => setBankForm({ ...bankForm, sortOrder: parseInt(e.target.value) || 0 })}
                        />
                      </div>

                      {/* Is Active */}
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <input
                          type="checkbox"
                          id="isActive"
                          checked={bankForm.isActive}
                          onChange={(e) => setBankForm({ ...bankForm, isActive: e.target.checked })}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                        <Label htmlFor="isActive" className="cursor-pointer">
                          {isRTL ? 'نشط (سيظهر للعملاء)' : 'Active (will be shown to customers)'}
                        </Label>
                      </div>
                    </div>

                    <DialogFooter>
                      <Button variant="outline" onClick={() => {
                        setShowAddBankDialog(false);
                        setEditingBank(null);
                        setBankForm({
                          name: '',
                          nameAr: '',
                          code: '',
                          accountName: '',
                          accountNumber: '',
                          iban: '',
                          swiftCode: '',
                          isActive: true,
                          sortOrder: 0,
                        });
                        setBankLogoFile(null);
                      }}>
                        {isRTL ? 'إلغاء' : 'Cancel'}
                      </Button>
                      <Button 
                        onClick={handleSaveBank} 
                        disabled={submitting || !bankForm.name || !bankForm.code || !bankForm.accountName || !bankForm.accountNumber || !bankForm.iban}
                      >
                        {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        {editingBank 
                          ? (isRTL ? 'حفظ التغييرات' : 'Save Changes')
                          : (isRTL ? 'إضافة' : 'Add Bank')
                        }
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {allBanks.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Building2 className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">
                    {isRTL ? 'لا توجد بنوك' : 'No banks yet'}
                  </h3>
                  <p className="text-sm mb-4">
                    {isRTL 
                      ? 'أضف بنكك الأول ليتمكن العملاء من التحويل إليه'
                      : 'Add your first bank so customers can transfer to it'
                    }
                  </p>
                  <Button onClick={() => setShowAddBankDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    {isRTL ? 'إضافة بنك' : 'Add Bank'}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {allBanks.map((bank) => (
                    <Card key={bank.id} className={cn(!bank.isActive && 'opacity-60')}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              {bank.logo ? (
                                <img src={bank.logo} alt={bank.name} className="h-8 w-8 object-contain" />
                              ) : (
                                <Building2 className="h-5 w-5 text-muted-foreground" />
                              )}
                              <h3 className="font-semibold text-lg">
                                {isRTL ? bank.nameAr || bank.name : bank.name}
                              </h3>
                              {bank.isActive ? (
                                <Badge variant="default" className="text-xs">
                                  {isRTL ? 'نشط' : 'Active'}
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="text-xs">
                                  {isRTL ? 'غير نشط' : 'Inactive'}
                                </Badge>
                              )}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                              <div>
                                <span className="text-muted-foreground">
                                  {isRTL ? 'رمز البنك: ' : 'Code: '}
                                </span>
                                <span className="font-medium">{bank.code}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">
                                  {isRTL ? 'اسم صاحب الحساب: ' : 'Account Holder: '}
                                </span>
                                <span className="font-medium">{bank.accountName}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">
                                  {isRTL ? 'رقم الحساب: ' : 'Account Number: '}
                                </span>
                                <span className="font-mono font-medium">{bank.accountNumber}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">IBAN: </span>
                                <span className="font-mono font-medium text-xs">{bank.iban}</span>
                              </div>
                              {bank.swiftCode && (
                                <div>
                                  <span className="text-muted-foreground">SWIFT: </span>
                                  <span className="font-mono font-medium text-xs">{bank.swiftCode}</span>
                                </div>
                              )}
                              <div className="text-xs text-muted-foreground">
                                {isRTL ? 'ترتيب العرض: ' : 'Sort Order: '}
                                {bank.sortOrder}
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditBank(bank)}
                            >
                              {isRTL ? 'تعديل' : 'Edit'}
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteBank(bank.id)}
                            >
                              {isRTL ? 'حذف' : 'Delete'}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

