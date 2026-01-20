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
  bank?: Bank;
  senderName?: string;
  transferReference?: string;
  rejectionReason?: string;
}


const transactionTypeConfig: Record<string, { labelKey: string; icon: LucideIcon; color: string }> = {
  TOPUP: { labelKey: 'dashboard.wallet.transactionTypes.TOPUP', icon: ArrowDownLeft, color: 'text-green-500' },
  PURCHASE: { labelKey: 'dashboard.wallet.transactionTypes.PURCHASE', icon: ArrowUpRight, color: 'text-red-500' },
  REFUND: { labelKey: 'dashboard.wallet.transactionTypes.REFUND', icon: ArrowDownLeft, color: 'text-green-500' },
  BONUS: { labelKey: 'dashboard.wallet.transactionTypes.BONUS', icon: Plus, color: 'text-green-500' },
  WITHDRAWAL: { labelKey: 'dashboard.wallet.transactionTypes.WITHDRAWAL', icon: ArrowUpRight, color: 'text-red-500' },
  ADJUSTMENT: { labelKey: 'dashboard.wallet.transactionTypes.ADJUSTMENT', icon: RefreshCw, color: 'text-blue-500' },
};

const statusConfig: Record<string, { labelKey: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: LucideIcon }> = {
  PENDING: { labelKey: 'dashboard.wallet.status.PENDING', variant: 'secondary', icon: Clock },
  APPROVED: { labelKey: 'dashboard.wallet.status.APPROVED', variant: 'default', icon: CheckCircle },
  COMPLETED: { labelKey: 'dashboard.wallet.status.COMPLETED', variant: 'default', icon: CheckCircle },
  REJECTED: { labelKey: 'dashboard.wallet.status.REJECTED', variant: 'destructive', icon: XCircle },
  FAILED: { labelKey: 'dashboard.wallet.status.FAILED', variant: 'destructive', icon: XCircle },
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
        toast.error(t('common.error'));
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
    toast.success(t('dashboard.wallet.banksTab.copied'));
  };

  // Handle add/edit merchant bank
  const handleSaveBank = async () => {
    if (!bankForm.name || !bankForm.code || !bankForm.accountName || !bankForm.accountNumber || !bankForm.iban) {
      toast.error(t('dashboard.wallet.banksTab.fillRequired'));
      return;
    }

    try {
      setSubmitting(true);
      if (editingBank) {
        await walletService.updateBank(editingBank.id, bankForm, bankLogoFile || undefined);
        toast.success(t('dashboard.wallet.banksTab.updateSuccess'));
      } else {
        await walletService.createBank(bankForm, bankLogoFile || undefined);
        toast.success(t('dashboard.wallet.banksTab.saveSuccess'));
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
      const errorMessage = error instanceof Error ? error.message : t('dashboard.wallet.banksTab.saveError');
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle delete bank
  const handleDeleteBank = async (bankId: string) => {
    if (!confirm(t('dashboard.wallet.banksTab.deleteConfirm'))) {
      return;
    }

    try {
      await walletService.deleteBank(bankId);
      toast.success(t('dashboard.wallet.banksTab.deleteSuccess'));
      
      // Refresh banks
      const [banksRes, allBanksRes] = await Promise.all([
        walletService.getBanks().catch(() => []),
        walletService.getAllBanks().catch(() => []),
      ]);
      setBanks(Array.isArray(banksRes) ? banksRes : []);
      setAllBanks(Array.isArray(allBanksRes) ? allBanksRes : []);
    } catch (error: unknown) {
      console.error('Error deleting bank:', error);
      const errorMessage = error instanceof Error ? error.message : t('dashboard.wallet.banksTab.deleteError');
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

    if (!confirm(t('dashboard.wallet.requestsTab.approveConfirm', { amount: selectedRequest.amount, currency: selectedRequest.currency }))) {
      return;
    }

    try {
      setProcessingRequest(true);
      await walletService.approveTopUp(selectedRequest.id);
      toast.success(t('dashboard.wallet.requestsTab.approveSuccess'));
      
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
      const errorMessage = error instanceof Error ? error.message : t('dashboard.wallet.requestsTab.approveError');
      toast.error(errorMessage);
    } finally {
      setProcessingRequest(false);
    }
  };

  // Handle reject top-up request
  const handleRejectRequest = async () => {
    if (!selectedRequest || !rejectReason.trim()) {
      toast.error(t('dashboard.wallet.requestsTab.rejectConfirm'));
      return;
    }

    try {
      setProcessingRequest(true);
      await walletService.rejectTopUp(selectedRequest.id, rejectReason);
      toast.success(t('dashboard.wallet.requestsTab.rejectSuccess'));
      
      // Refresh data
      const topUpRes = await walletService.getTopUpRequests().catch(() => []);
      setTopUpRequests(Array.isArray(topUpRes) ? topUpRes : []);
      
      setShowRequestDialog(false);
      setShowRejectDialog(false);
      setSelectedRequest(null);
      setRejectReason('');
    } catch (error: unknown) {
      console.error('Error rejecting request:', error);
      const errorMessage = error instanceof Error ? error.message : t('dashboard.wallet.requestsTab.rejectError');
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
          {t('dashboard.wallet.pageTitle')}
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
                  {t('dashboard.wallet.pageTitle')}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t('dashboard.wallet.pageDesc')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">
                  {t('dashboard.wallet.totalBanks')}
                </p>
                <p className="text-3xl font-bold text-blue-600">
                  {banks.length}
                </p>
              </div>
              <div className="h-12 w-px bg-border" />
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">
                  {t('dashboard.wallet.totalTransactions')}
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
            {t('dashboard.wallet.tabs.transactions')}
          </TabsTrigger>
          <TabsTrigger value="requests" className="gap-2">
            <Clock className="h-4 w-4" />
            {t('dashboard.wallet.tabs.requests')}
          </TabsTrigger>
          <TabsTrigger value="bank-accounts" className="gap-2">
            <Building2 className="h-4 w-4" />
            {t('dashboard.wallet.tabs.banks')}
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
                    {t('dashboard.wallet.noTransactions', 'No transactions yet')}
                  </h3>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className={isRTL ? 'text-right' : ''}>{t('common.type', 'Type')}</TableHead>
                      <TableHead className={isRTL ? 'text-right' : ''}>{t('dashboard.wallet.amount')}</TableHead>
                      <TableHead className={isRTL ? 'text-right' : ''}>{t('dashboard.wallet.description')}</TableHead>
                      <TableHead className={isRTL ? 'text-right' : ''}>{t('dashboard.wallet.status')}</TableHead>
                      <TableHead className={isRTL ? 'text-right' : ''}>{t('dashboard.wallet.date')}</TableHead>
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
                              {t(typeConfig.labelKey)}
                            </div>
                          </TableCell>
                          <TableCell className={cn('font-semibold', isCredit ? 'text-green-600' : 'text-red-600')}>
                            {isCredit ? '+' : '-'} {typeof tx.amount === 'string' ? parseFloat(tx.amount).toFixed(2) : tx.amount.toFixed(2)} {tx.currency}
                          </TableCell>
                          <TableCell className="text-muted-foreground">{isRTL ? (tx.descriptionAr || tx.description || '-') : (tx.description || '-')}</TableCell>
                          <TableCell>
                            <Badge variant={status.variant}>
                              {t(status.labelKey)}
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
                    {t('dashboard.wallet.requestsTab.noRequests')}
                  </h3>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className={isRTL ? 'text-right' : ''}>{t('dashboard.wallet.amount')}</TableHead>
                      <TableHead className={isRTL ? 'text-right' : ''}>{t('dashboard.wallet.requestsTab.method')}</TableHead>
                      <TableHead className={isRTL ? 'text-right' : ''}>{t('dashboard.wallet.status')}</TableHead>
                      <TableHead className={isRTL ? 'text-right' : ''}>{t('dashboard.wallet.date')}</TableHead>
                      <TableHead className={isRTL ? 'text-right' : ''}>{t('dashboard.wallet.actions')}</TableHead>
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
                              {t(status.labelKey)}
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
                              {t('dashboard.wallet.requestsTab.viewDetails')}
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
                  <CardTitle>{t('dashboard.wallet.banksTab.title')}</CardTitle>
                  <CardDescription>
                    {t('dashboard.wallet.banksTab.desc')}
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
                      {t('dashboard.wallet.banksTab.addBank')}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5" />
                        {editingBank 
                          ? t('dashboard.wallet.banksTab.editBankTitle')
                          : t('dashboard.wallet.banksTab.addBankTitle')
                        }
                      </DialogTitle>
                      <DialogDescription>
                        {t('dashboard.wallet.banksTab.dialogDesc')}
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                      {/* Bank Name */}
                      <div className="space-y-2">
                        <Label>{t('dashboard.wallet.banksTab.bankName')} *</Label>
                        <Input
                          placeholder={t('dashboard.wallet.banksTab.bankName')}
                          value={bankForm.name}
                          onChange={(e) => setBankForm({ ...bankForm, name: e.target.value })}
                        />
                      </div>

                      {/* Bank Name (Arabic) */}
                      <div className="space-y-2">
                        <Label>{t('dashboard.wallet.banksTab.bankNameAr')}</Label>
                        <Input
                          placeholder={t('dashboard.wallet.banksTab.bankNameAr')}
                          value={bankForm.nameAr || ''}
                          onChange={(e) => setBankForm({ ...bankForm, nameAr: e.target.value })}
                        />
                      </div>

                      {/* Bank Code */}
                      <div className="space-y-2">
                        <Label>{t('dashboard.wallet.banksTab.bankCode')} *</Label>
                        <Input
                          placeholder={t('dashboard.wallet.banksTab.bankCode')}
                          value={bankForm.code}
                          onChange={(e) => setBankForm({ ...bankForm, code: e.target.value })}
                          disabled={!!editingBank}
                        />
                        {editingBank && (
                          <p className="text-xs text-muted-foreground">
                            {t('dashboard.wallet.banksTab.bankCodeHint')}
                          </p>
                        )}
                      </div>

                      {/* Logo Upload */}
                      <div className="space-y-2">
                        <Label>{t('dashboard.wallet.banksTab.bankLogo')}</Label>
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
                                {t('dashboard.wallet.banksTab.currentLogo')}
                              </span>
                            </div>
                          ) : (
                            <label className="cursor-pointer">
                              <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                              <span className="text-sm text-muted-foreground">
                                {t('dashboard.wallet.banksTab.uploadLogo')}
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
                        <Label>{t('dashboard.wallet.banksTab.accountName')} *</Label>
                        <Input
                          placeholder={t('dashboard.wallet.banksTab.accountName')}
                          value={bankForm.accountName}
                          onChange={(e) => setBankForm({ ...bankForm, accountName: e.target.value })}
                        />
                      </div>

                      {/* Account Number */}
                      <div className="space-y-2">
                        <Label>{t('dashboard.wallet.banksTab.accountNumber')} *</Label>
                        <Input
                          placeholder={t('dashboard.wallet.banksTab.accountNumber')}
                          value={bankForm.accountNumber}
                          onChange={(e) => setBankForm({ ...bankForm, accountNumber: e.target.value })}
                        />
                      </div>

                      {/* IBAN */}
                      <div className="space-y-2">
                        <Label>{t('dashboard.wallet.banksTab.iban')} *</Label>
                        <Input
                          placeholder={isRTL ? 'SA1234567890123456789012' : 'SA1234567890123456789012'}
                          value={bankForm.iban}
                          onChange={(e) => setBankForm({ ...bankForm, iban: e.target.value })}
                        />
                      </div>

                      {/* Swift Code */}
                      <div className="space-y-2">
                        <Label>{t('dashboard.wallet.banksTab.swiftCode')}</Label>
                        <Input
                          placeholder={t('dashboard.wallet.banksTab.swiftCode')}
                          value={bankForm.swiftCode || ''}
                          onChange={(e) => setBankForm({ ...bankForm, swiftCode: e.target.value })}
                        />
                      </div>

                      {/* Sort Order */}
                      <div className="space-y-2">
                        <Label>{t('dashboard.wallet.banksTab.sortOrder')}</Label>
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
                          {t('dashboard.wallet.banksTab.active')}
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
                        {t('common.cancel', 'Cancel')}
                      </Button>
                      <Button 
                        onClick={handleSaveBank} 
                        disabled={submitting || !bankForm.name || !bankForm.code || !bankForm.accountName || !bankForm.accountNumber || !bankForm.iban}
                      >
                        {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        {editingBank 
                          ? t('dashboard.wallet.banksTab.saveChanges')
                          : t('dashboard.wallet.banksTab.addBank')
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
                    {t('dashboard.wallet.banksTab.noBanks')}
                  </h3>
                  <p className="text-sm mb-4">
                    {t('dashboard.wallet.banksTab.noBanksDesc')}
                  </p>
                  <Button onClick={() => setShowAddBankDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    {t('dashboard.wallet.banksTab.addBank')}
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
                                  {t('common.active', 'Active')}
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="text-xs">
                                  {t('common.inactive', 'Inactive')}
                                </Badge>
                              )}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                              <div>
                                <span className="text-muted-foreground">{t('dashboard.wallet.banksTab.bankCode')}: </span>
                                <span className="font-medium">{bank.code}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">{t('dashboard.wallet.banksTab.accountName')}: </span>
                                <span className="font-medium">{bank.accountName}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">{t('dashboard.wallet.banksTab.accountNumber')}: </span>
                                <span className="font-mono font-medium">{bank.accountNumber}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">{t('dashboard.wallet.banksTab.iban')}: </span>
                                <span className="font-mono font-medium text-xs">{bank.iban}</span>
                              </div>
                              {bank.swiftCode && (
                                <div>
                                  <span className="text-muted-foreground">{t('dashboard.wallet.banksTab.swiftCode')}: </span>
                                  <span className="font-mono font-medium text-xs">{bank.swiftCode}</span>
                                </div>
                              )}
                              <div className="text-xs text-muted-foreground">
                                {t('dashboard.wallet.banksTab.sortOrder')}: {bank.sortOrder}
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditBank(bank)}
                            >
                              {t('common.edit', 'Edit')}
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteBank(bank.id)}
                            >
                              {t('common.delete', 'Delete')}
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
              {t('dashboard.wallet.requestsTab.detailsTitle')}
            </DialogTitle>
            <DialogDescription>
              {t('dashboard.wallet.requestsTab.detailsDesc')}
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
                        <span className="text-sm text-muted-foreground">{t('dashboard.wallet.amount')}</span>
                        <span className="text-lg font-bold text-green-600">
                          {typeof selectedRequest.amount === 'string' ? parseFloat(selectedRequest.amount).toFixed(2) : selectedRequest.amount.toFixed(2)} {selectedRequest.currency}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">{t('dashboard.wallet.requestsTab.method')}</span>
                        <Badge variant="outline">{selectedRequest.paymentMethod}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">{t('dashboard.wallet.status')}</span>
                        <Badge variant={statusConfig[selectedRequest.status]?.variant || 'default'}>
                          {t(statusConfig[selectedRequest.status]?.labelKey || 'dashboard.wallet.status.PENDING')}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {t('dashboard.wallet.date')}
                        </span>
                        <span className="text-sm">{formatDate(selectedRequest.createdAt)}</span>
                      </div>
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
                            {t('dashboard.wallet.requestsTab.bankInfo')}
                          </h4>
                          <div className="space-y-2 text-sm">
                            <div>
                              <span className="text-muted-foreground">{t('dashboard.wallet.banksTab.bankName')}: </span>
                              <span className="font-medium">{isRTL ? selectedRequest.bank.nameAr || selectedRequest.bank.name : selectedRequest.bank.name}</span>
                            </div>
                            {selectedRequest.bank.accountName && (
                              <div>
                                <span className="text-muted-foreground">{t('dashboard.wallet.banksTab.accountName')}: </span>
                                <span className="font-medium">{selectedRequest.bank.accountName}</span>
                              </div>
                            )}
                            {selectedRequest.bank.accountNumber && (
                              <div>
                                <span className="text-muted-foreground">{t('dashboard.wallet.banksTab.accountNumber')}: </span>
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
                            {t('dashboard.wallet.requestsTab.senderInfo')}
                          </h4>
                          <div className="space-y-2 text-sm">
                            <div>
                              <span className="text-muted-foreground">{t('dashboard.wallet.requestsTab.senderName')}: </span>
                              <span className="font-medium">{selectedRequest.senderName}</span>
                            </div>
                            {selectedRequest.transferReference && (
                              <div>
                                <span className="text-muted-foreground">{t('dashboard.wallet.requestsTab.referenceNumber')}: </span>
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
                      {t('dashboard.wallet.requestsTab.notes')}
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
                      {t('dashboard.wallet.requestsTab.receiptImage')}
                    </h4>
                    <div className="relative border rounded-lg overflow-hidden bg-muted">
                      <img 
                        src={selectedRequest.receiptImage} 
                        alt={t('dashboard.wallet.requestsTab.receipt')} 
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
                      {t('common.openInNewWindow', 'Open in New Window')}
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
                      {t('dashboard.wallet.requestsTab.rejectionReason')}
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
                    {t('dashboard.wallet.requestsTab.reject')}
                  </Button>
                  <Button
                    onClick={handleApproveRequest}
                    disabled={processingRequest}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {processingRequest ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {t('dashboard.wallet.requestsTab.processing')}
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        {t('dashboard.wallet.requestsTab.approve')}
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
            <DialogTitle>{t('dashboard.wallet.requestsTab.rejectTitle')}</DialogTitle>
            <DialogDescription>
              {t('dashboard.wallet.requestsTab.rejectDesc')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="rejectReason">{t('dashboard.wallet.requestsTab.rejectionReason')}</Label>
              <Textarea
                id="rejectReason"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder={t('dashboard.wallet.requestsTab.rejectPlaceholder')}
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
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectRequest}
              disabled={!rejectReason.trim() || processingRequest}
            >
              {processingRequest ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t('dashboard.wallet.requestsTab.processing')}
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 mr-2" />
                  {t('dashboard.wallet.requestsTab.reject')}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

