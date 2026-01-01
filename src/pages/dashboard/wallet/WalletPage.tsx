import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  History,
  Eye,
  Image as ImageIcon,
  User,
  Calendar,
  FileText,
  type LucideIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { coreApi, walletService, type Bank, type CreateBankDto, type Wallet as WalletType } from '@/lib/api';
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


const transactionTypeConfig: Record<string, { label: string; labelAr: string; icon: LucideIcon; color: string }> = {
  TOPUP: { label: 'Top Up', labelAr: 'إيداع', icon: ArrowDownLeft, color: 'text-green-500' },
  PURCHASE: { label: 'Purchase', labelAr: 'شراء', icon: ArrowUpRight, color: 'text-red-500' },
  REFUND: { label: 'Refund', labelAr: 'استرداد', icon: ArrowDownLeft, color: 'text-green-500' },
  BONUS: { label: 'Bonus', labelAr: 'مكافأة', icon: Plus, color: 'text-green-500' },
  WITHDRAWAL: { label: 'Withdrawal', labelAr: 'سحب', icon: ArrowUpRight, color: 'text-red-500' },
  ADJUSTMENT: { label: 'Adjustment', labelAr: 'تعديل', icon: RefreshCw, color: 'text-blue-500' },
};

const statusConfig: Record<string, { label: string; labelAr: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: LucideIcon }> = {
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
  const [showAddBankDialog, setShowAddBankDialog] = useState(false);
  const [editingBank, setEditingBank] = useState<Bank | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<TopUpRequest | null>(null);
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [processingRequest, setProcessingRequest] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  
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
          walletService.getBalance().catch(() => ({ id: '', balance: 0, currency: 'SAR', updatedAt: new Date().toISOString() } as Partial<WalletType> & { balance: number; currency: string; updatedAt: string })),
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
    } catch (error: unknown) {
      console.error('Error saving bank:', error);
      const errorMessage = error instanceof Error ? error.message : (isRTL ? 'فشل حفظ البنك' : 'Failed to save bank');
      toast.error(errorMessage);
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
    } catch (error: unknown) {
      console.error('Error deleting bank:', error);
      const errorMessage = error instanceof Error ? error.message : (isRTL ? 'فشل حذف البنك' : 'Failed to delete bank');
      toast.error(errorMessage);
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

  // Handle view request details
  const handleViewRequest = (request: TopUpRequest) => {
    setSelectedRequest(request);
    setShowRequestDialog(true);
  };

  // Handle approve top-up request
  const handleApproveRequest = async () => {
    if (!selectedRequest) return;

    if (!confirm(isRTL 
      ? `هل أنت متأكد من الموافقة على طلب الشحن بقيمة ${selectedRequest.amount} ${selectedRequest.currency}؟`
      : `Are you sure you want to approve this top-up request of ${selectedRequest.amount} ${selectedRequest.currency}?`
    )) {
      return;
    }

    try {
      setProcessingRequest(true);
      await walletService.approveTopUp(selectedRequest.id);
      toast.success(isRTL ? 'تمت الموافقة على طلب الشحن بنجاح' : 'Top-up request approved successfully');
      
      // Refresh data
      const [walletRes, transactionsRes, topUpRes] = await Promise.all([
        walletService.getBalance().catch(() => ({ id: '', balance: 0, currency: 'SAR', updatedAt: new Date().toISOString() } as Partial<WalletType> & { balance: number; currency: string; updatedAt: string })),
        walletService.getTransactions(1, 50).catch(() => ({ data: [], total: 0, page: 1, limit: 50, totalPages: 0 })),
        walletService.getTopUpRequests().catch(() => []),
      ]);
      setWallet({
        id: walletRes.id || '',
        balance: typeof walletRes.balance === 'string' ? parseFloat(walletRes.balance) : walletRes.balance || 0,
        currency: walletRes.currency || 'SAR',
        lastUpdated: walletRes.updatedAt || new Date().toISOString(),
      });
      setTransactions(transactionsRes.data || []);
      setTopUpRequests(Array.isArray(topUpRes) ? topUpRes : []);
      
      setShowRequestDialog(false);
      setSelectedRequest(null);
    } catch (error: unknown) {
      console.error('Error approving request:', error);
      const errorMessage = error instanceof Error ? error.message : (isRTL ? 'فشل الموافقة على طلب الشحن' : 'Failed to approve top-up request');
      toast.error(errorMessage);
    } finally {
      setProcessingRequest(false);
    }
  };

  // Handle reject top-up request
  const handleRejectRequest = async () => {
    if (!selectedRequest || !rejectReason.trim()) {
      toast.error(isRTL ? 'يرجى إدخال سبب الرفض' : 'Please enter a rejection reason');
      return;
    }

    try {
      setProcessingRequest(true);
      await walletService.rejectTopUp(selectedRequest.id, rejectReason);
      toast.success(isRTL ? 'تم رفض طلب الشحن بنجاح' : 'Top-up request rejected successfully');
      
      // Refresh data
      const topUpRes = await walletService.getTopUpRequests().catch(() => []);
      setTopUpRequests(Array.isArray(topUpRes) ? topUpRes : []);
      
      setShowRequestDialog(false);
      setShowRejectDialog(false);
      setSelectedRequest(null);
      setRejectReason('');
    } catch (error: unknown) {
      console.error('Error rejecting request:', error);
      const errorMessage = error instanceof Error ? error.message : (isRTL ? 'فشل رفض طلب الشحن' : 'Failed to reject top-up request');
      toast.error(errorMessage);
    } finally {
      setProcessingRequest(false);
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
          {isRTL ? 'البنوك و المعاملات' : 'Banks and Transactions'}
        </h1>
      </div>

      {/* Info Card - Banks and Transactions */}
      <Card className="bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-background border-blue-500/20">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                <Building2 className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-1">
                  {isRTL ? 'البنوك و المعاملات' : 'Banks and Transactions'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {isRTL 
                    ? 'إدارة البنوك وعرض سجل المعاملات المالية' 
                    : 'Manage banks and view financial transaction history'
                  }
                </p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">
                  {isRTL ? 'إجمالي البنوك' : 'Total Banks'}
                </p>
                <p className="text-3xl font-bold text-blue-600">
                  {banks.length}
                </p>
              </div>
              <div className="h-12 w-px bg-border" />
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">
                  {isRTL ? 'إجمالي المعاملات' : 'Total Transactions'}
                </p>
                <p className="text-3xl font-bold text-indigo-600">
                  {transactions.length}
                </p>
              </div>
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
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className={isRTL ? 'text-right' : ''}>{isRTL ? 'المبلغ' : 'Amount'}</TableHead>
                      <TableHead className={isRTL ? 'text-right' : ''}>{isRTL ? 'طريقة الدفع' : 'Method'}</TableHead>
                      <TableHead className={isRTL ? 'text-right' : ''}>{isRTL ? 'الحالة' : 'Status'}</TableHead>
                      <TableHead className={isRTL ? 'text-right' : ''}>{isRTL ? 'التاريخ' : 'Date'}</TableHead>
                      <TableHead className={isRTL ? 'text-right' : ''}>{isRTL ? 'الإجراءات' : 'Actions'}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topUpRequests.map((req) => {
                      const status = statusConfig[req.status] || statusConfig.PENDING;
                      const StatusIcon = status.icon;
                      
                      return (
                        <TableRow 
                          key={req.id} 
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handleViewRequest(req)}
                        >
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
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewRequest(req);
                              }}
                              className="gap-2"
                            >
                              <Eye className="h-4 w-4" />
                              {isRTL ? 'عرض التفاصيل' : 'View Details'}
                            </Button>
                          </TableCell>
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

      {/* Request Detail Dialog */}
      <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {isRTL ? 'تفاصيل طلب الشحن' : 'Top-up Request Details'}
            </DialogTitle>
            <DialogDescription>
              {isRTL 
                ? 'عرض تفاصيل طلب الشحن والموافقة أو الرفض'
                : 'View top-up request details and approve or reject'
              }
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-6">
              {/* Request Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">{isRTL ? 'المبلغ' : 'Amount'}</span>
                        <span className="text-lg font-bold text-green-600">
                          {typeof selectedRequest.amount === 'string' ? parseFloat(selectedRequest.amount).toFixed(2) : selectedRequest.amount.toFixed(2)} {selectedRequest.currency}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">{isRTL ? 'طريقة الدفع' : 'Payment Method'}</span>
                        <Badge variant="outline">{selectedRequest.paymentMethod}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">{isRTL ? 'الحالة' : 'Status'}</span>
                        <Badge variant={selectedRequest.status === 'PENDING' ? 'secondary' : selectedRequest.status === 'APPROVED' ? 'default' : 'destructive'}>
                          {selectedRequest.status === 'PENDING' ? (isRTL ? 'معلق' : 'Pending') :
                           selectedRequest.status === 'APPROVED' ? (isRTL ? 'موافق عليه' : 'Approved') :
                           selectedRequest.status === 'REJECTED' ? (isRTL ? 'مرفوض' : 'Rejected') :
                           selectedRequest.status}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {isRTL ? 'تاريخ الإنشاء' : 'Created At'}
                        </span>
                        <span className="text-sm">{formatDate(selectedRequest.createdAt)}</span>
                      </div>
                      {selectedRequest.processedAt && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">{isRTL ? 'تاريخ المعالجة' : 'Processed At'}</span>
                          <span className="text-sm">{formatDate(selectedRequest.processedAt)}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Bank & Sender Info */}
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      {selectedRequest.bank && (
                        <>
                          <h4 className="font-semibold mb-2 flex items-center gap-2">
                            <Building2 className="h-4 w-4" />
                            {isRTL ? 'معلومات البنك' : 'Bank Information'}
                          </h4>
                          <div className="space-y-2 text-sm">
                            <div>
                              <span className="text-muted-foreground">{isRTL ? 'اسم البنك: ' : 'Bank Name: '}</span>
                              <span className="font-medium">{isRTL ? selectedRequest.bank.nameAr || selectedRequest.bank.name : selectedRequest.bank.name}</span>
                            </div>
                            {selectedRequest.bank.accountName && (
                              <div>
                                <span className="text-muted-foreground">{isRTL ? 'اسم الحساب: ' : 'Account Name: '}</span>
                                <span className="font-medium">{selectedRequest.bank.accountName}</span>
                              </div>
                            )}
                            {selectedRequest.bank.accountNumber && (
                              <div>
                                <span className="text-muted-foreground">{isRTL ? 'رقم الحساب: ' : 'Account Number: '}</span>
                                <span className="font-mono font-medium">{selectedRequest.bank.accountNumber}</span>
                              </div>
                            )}
                          </div>
                        </>
                      )}
                      {selectedRequest.senderName && (
                        <div className="mt-4">
                          <h4 className="font-semibold mb-2 flex items-center gap-2">
                            <User className="h-4 w-4" />
                            {isRTL ? 'معلومات المرسل' : 'Sender Information'}
                          </h4>
                          <div className="space-y-2 text-sm">
                            <div>
                              <span className="text-muted-foreground">{isRTL ? 'اسم المرسل: ' : 'Sender Name: '}</span>
                              <span className="font-medium">{selectedRequest.senderName}</span>
                            </div>
                            {selectedRequest.transferReference && (
                              <div>
                                <span className="text-muted-foreground">{isRTL ? 'رقم المرجع: ' : 'Reference Number: '}</span>
                                <span className="font-mono font-medium">{selectedRequest.transferReference}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Notes */}
              {selectedRequest.notes && (
                <Card>
                  <CardContent className="pt-6">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      {isRTL ? 'ملاحظات' : 'Notes'}
                    </h4>
                    <p className="text-sm text-muted-foreground">{selectedRequest.notes}</p>
                  </CardContent>
                </Card>
              )}

              {/* Receipt Image */}
              {selectedRequest.receiptImage && (
                <Card>
                  <CardContent className="pt-6">
                    <h4 className="font-semibold mb-4 flex items-center gap-2">
                      <ImageIcon className="h-4 w-4" />
                      {isRTL ? 'صورة الإيصال' : 'Receipt Image'}
                    </h4>
                    <div className="relative border rounded-lg overflow-hidden bg-muted">
                      <img 
                        src={selectedRequest.receiptImage} 
                        alt={isRTL ? 'صورة الإيصال' : 'Receipt'} 
                        className="w-full h-auto max-h-[500px] object-contain cursor-pointer"
                        onClick={() => window.open(selectedRequest.receiptImage!, '_blank')}
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => window.open(selectedRequest.receiptImage!, '_blank')}
                    >
                      {isRTL ? 'فتح في نافذة جديدة' : 'Open in New Window'}
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Rejection Reason */}
              {selectedRequest.status === 'REJECTED' && selectedRequest.rejectionReason && (
                <Card>
                  <CardContent className="pt-6">
                    <h4 className="font-semibold mb-2 text-destructive flex items-center gap-2">
                      <XCircle className="h-4 w-4" />
                      {isRTL ? 'سبب الرفض' : 'Rejection Reason'}
                    </h4>
                    <p className="text-sm text-muted-foreground">{selectedRequest.rejectionReason}</p>
                  </CardContent>
                </Card>
              )}

              {/* Action Buttons */}
              {selectedRequest.status === 'PENDING' && (
                <div className="flex gap-4 justify-end pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowRejectDialog(true);
                    }}
                    disabled={processingRequest}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    {isRTL ? 'رفض' : 'Reject'}
                  </Button>
                  <Button
                    onClick={handleApproveRequest}
                    disabled={processingRequest}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {processingRequest ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {isRTL ? 'جاري المعالجة...' : 'Processing...'}
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        {isRTL ? 'موافقة' : 'Approve'}
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isRTL ? 'رفض طلب الشحن' : 'Reject Top-up Request'}</DialogTitle>
            <DialogDescription>
              {isRTL 
                ? 'يرجى إدخال سبب رفض طلب الشحن'
                : 'Please enter a reason for rejecting this top-up request'
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="rejectReason">{isRTL ? 'سبب الرفض' : 'Rejection Reason'}</Label>
              <Textarea
                id="rejectReason"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder={isRTL ? 'أدخل سبب الرفض...' : 'Enter rejection reason...'}
                rows={4}
                className="mt-2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRejectDialog(false);
                setRejectReason('');
              }}
            >
              {isRTL ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectRequest}
              disabled={!rejectReason.trim() || processingRequest}
            >
              {processingRequest ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {isRTL ? 'جاري المعالجة...' : 'Processing...'}
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 mr-2" />
                  {isRTL ? 'رفض' : 'Reject'}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

