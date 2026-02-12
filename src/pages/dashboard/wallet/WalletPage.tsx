import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Building2, 
  Loader2,
  Plus,
  XCircle,
  CheckCircle,
  TrendingUp,
  BarChart3,
  Copy,
  ChevronDown,
  ChevronUp,
  Eye,
  Calendar,
  User,
  Clock,
  History,
  type LucideIcon
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { walletService, type Bank, type CreateBankDto } from '@/lib/api';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface BankUsageStats {
  bankId: string;
  bankName: string;
  bankNameAr?: string;
  usageCount: number;
  percentage: number;
}

export default function WalletPage() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const { user, loading: authLoading } = useAuth();
  
  const [allBanks, setAllBanks] = useState<Bank[]>([]);
  const [topUpRequests, setTopUpRequests] = useState<Array<{
    id: string;
    bankId?: string | null;
    bank?: Bank | null;
    amount: string | number;
    currency: string;
    status: string;
    createdAt: string;
    user?: { name?: string; email?: string } | null;
    senderName?: string | null;
    transferReference?: string | null;
    notes?: string | null;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [showAddBankDialog, setShowAddBankDialog] = useState(false);
  const [editingBank, setEditingBank] = useState<Bank | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [expandedBankId, setExpandedBankId] = useState<string | null>(null);
  
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

  // Fetch banks and top-up requests for analytics
  useEffect(() => {
    const fetchData = async () => {
      if (authLoading) return;
      
      if (!user?.tenantId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        const [allBanksRes, topUpRes] = await Promise.all([
          walletService.getAllBanks().catch((err) => {
            console.error('[BanksPage] Error fetching banks:', err);
            return [];
          }),
          walletService.getTopUpRequests().catch((err) => {
            console.error('[BanksPage] Error fetching top-up requests:', err);
            return [];
          }),
        ]);
        
        setAllBanks(Array.isArray(allBanksRes) ? allBanksRes : []);
        setTopUpRequests(Array.isArray(topUpRes) ? topUpRes : []);
      } catch (error) {
        console.error('[BanksPage] Error fetching data:', error);
        toast.error(t('common.error'));
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [t, authLoading, user?.tenantId]);

  // Calculate bank usage statistics
  const bankUsageStats = useMemo(() => {
    const stats: Record<string, BankUsageStats> = {};
    let totalBankTransfers = 0;

    // Count usage for each bank from top-up requests
    topUpRequests.forEach((request) => {
      if (request.bankId && request.bank) {
        totalBankTransfers++;
        const bankId = request.bankId;
        if (!stats[bankId]) {
          stats[bankId] = {
            bankId,
            bankName: request.bank.name,
            bankNameAr: request.bank.nameAr,
            usageCount: 0,
            percentage: 0,
          };
        }
        stats[bankId].usageCount++;
      }
    });

    // Calculate percentages
    Object.values(stats).forEach((stat) => {
      stat.percentage = totalBankTransfers > 0 
        ? (stat.usageCount / totalBankTransfers) * 100 
        : 0;
    });

    // Sort by usage count (descending)
    return Object.values(stats).sort((a, b) => b.usageCount - a.usageCount);
  }, [topUpRequests]);

  // Get most chosen bank
  const mostChosenBank = bankUsageStats.length > 0 ? bankUsageStats[0] : null;

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const activeBanks = allBanks.filter(b => b.isActive).length;
    const inactiveBanks = allBanks.length - activeBanks;
    const totalBankTransfers = topUpRequests.filter(r => r.bankId).length;

    return {
      totalBanks: allBanks.length,
      activeBanks,
      inactiveBanks,
      totalBankTransfers,
    };
  }, [allBanks, topUpRequests]);

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
      const [allBanksRes, topUpRes] = await Promise.all([
        walletService.getAllBanks().catch(() => []),
        walletService.getTopUpRequests().catch(() => []),
      ]);
      setAllBanks(Array.isArray(allBanksRes) ? allBanksRes : []);
      setTopUpRequests(Array.isArray(topUpRes) ? topUpRes : []);
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
      const [allBanksRes, topUpRes] = await Promise.all([
        walletService.getAllBanks().catch(() => []),
        walletService.getTopUpRequests().catch(() => []),
      ]);
      setAllBanks(Array.isArray(allBanksRes) ? allBanksRes : []);
      setTopUpRequests(Array.isArray(topUpRes) ? topUpRes : []);
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

  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(t('dashboard.wallet.banksTab.copied'));
  };

  // Get transfers for a specific bank
  const getBankTransfers = (bankId: string) => {
    return topUpRequests.filter(request => request.bankId === bankId);
  };

  // Format date
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'dd/MM/yyyy HH:mm', { locale: isRTL ? ar : undefined });
    } catch {
      return dateString;
    }
  };

  // Get status badge variant
  const getStatusVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (status) {
      case 'APPROVED':
      case 'COMPLETED':
        return 'default';
      case 'PENDING':
        return 'secondary';
      case 'REJECTED':
      case 'CANCELLED':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  // Toggle bank transfers view
  const toggleBankTransfers = (bankId: string) => {
    setExpandedBankId(expandedBankId === bankId ? null : bankId);
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
          <Building2 className="h-6 w-6" />
          {t('dashboard.wallet.pageTitle', 'Banks and Transactions')}
        </h1>
      </div>

      {/* Info Card */}
      <Card className="bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-background border-blue-500/20">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                <Building2 className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-1">
                  {t('dashboard.wallet.pageTitle', 'Banks and Transactions')}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t('dashboard.wallet.pageDesc', 'Manage banks and view financial transaction history')}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  {t('dashboard.wallet.totalBanks', 'Total Banks')}
                </p>
                <p className="text-3xl font-bold">{summaryStats.totalBanks}</p>
              </div>
              <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/20">
                <Building2 className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  {t('common.active', 'Active Banks')}
                </p>
                <p className="text-3xl font-bold text-green-600">{summaryStats.activeBanks}</p>
              </div>
              <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/20">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  {t('common.inactive', 'Inactive Banks')}
                </p>
                <p className="text-3xl font-bold text-gray-600">{summaryStats.inactiveBanks}</p>
              </div>
              <div className="p-3 rounded-full bg-gray-100 dark:bg-gray-900/20">
                <XCircle className="h-6 w-6 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  {t('dashboard.wallet.totalBankTransfers', 'Total Bank Transfers')}
                </p>
                <p className="text-3xl font-bold text-indigo-600">{summaryStats.totalBankTransfers}</p>
              </div>
              <div className="p-3 rounded-full bg-indigo-100 dark:bg-indigo-900/20">
                <TrendingUp className="h-6 w-6 text-indigo-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="banks" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="banks" className="gap-2">
            <Building2 className="h-4 w-4" />
            {t('dashboard.wallet.banksTab.title', 'Banks')} ({allBanks.length})
          </TabsTrigger>
          <TabsTrigger value="transfers" className="gap-2">
            <History className="h-4 w-4" />
            {t('dashboard.wallet.transfers', 'Transfers')} ({summaryStats.totalBankTransfers})
          </TabsTrigger>
          <TabsTrigger value="usage" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            {t('dashboard.wallet.usageStats', 'Usage Statistics')}
          </TabsTrigger>
        </TabsList>

        {/* Banks Tab */}
        <TabsContent value="banks" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{t('dashboard.wallet.banksTab.title', 'Banks')}</CardTitle>
                  <CardDescription>
                    {t('dashboard.wallet.banksTab.desc', 'Manage banks that customers can transfer to')}
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
                  {t('dashboard.wallet.banksTab.addBank', 'Add Bank')}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    {editingBank 
                      ? t('dashboard.wallet.banksTab.editBankTitle', 'Edit Bank')
                      : t('dashboard.wallet.banksTab.addBankTitle', 'Add Bank')
                    }
                  </DialogTitle>
                  <DialogDescription>
                    {t('dashboard.wallet.banksTab.dialogDesc', 'Fill in the bank details below')}
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  {/* Bank Name */}
                  <div className="space-y-2">
                    <Label>{t('dashboard.wallet.banksTab.bankName', 'Bank Name')} *</Label>
                    <Input
                      placeholder={t('dashboard.wallet.banksTab.bankName', 'Bank Name')}
                      value={bankForm.name}
                      onChange={(e) => setBankForm({ ...bankForm, name: e.target.value })}
                    />
                  </div>

                  {/* Bank Name (Arabic) */}
                  <div className="space-y-2">
                    <Label>{t('dashboard.wallet.banksTab.bankNameAr', 'Bank Name (Arabic)')}</Label>
                    <Input
                      placeholder={t('dashboard.wallet.banksTab.bankNameAr', 'Bank Name (Arabic)')}
                      value={bankForm.nameAr || ''}
                      onChange={(e) => setBankForm({ ...bankForm, nameAr: e.target.value })}
                    />
                  </div>

                  {/* Bank Code */}
                  <div className="space-y-2">
                    <Label>{t('dashboard.wallet.banksTab.bankCode', 'Bank Code')} *</Label>
                    <Input
                      placeholder={t('dashboard.wallet.banksTab.bankCode', 'Bank Code')}
                      value={bankForm.code}
                      onChange={(e) => setBankForm({ ...bankForm, code: e.target.value })}
                      disabled={!!editingBank}
                    />
                    {editingBank && (
                      <p className="text-xs text-muted-foreground">
                        {t('dashboard.wallet.banksTab.bankCodeHint', 'Bank code cannot be changed')}
                      </p>
                    )}
                  </div>

                  {/* Logo Upload */}
                  <div className="space-y-2">
                    <Label>{t('dashboard.wallet.banksTab.bankLogo', 'Bank Logo')}</Label>
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
                            {t('dashboard.wallet.banksTab.currentLogo', 'Current logo')}
                          </span>
                        </div>
                      ) : (
                        <label className="cursor-pointer">
                          <div className="flex flex-col items-center gap-2">
                            <Building2 className="h-8 w-8 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                              {t('dashboard.wallet.banksTab.uploadLogo', 'Click to upload logo')}
                            </span>
                          </div>
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
                    <Label>{t('dashboard.wallet.banksTab.accountName', 'Account Name')} *</Label>
                    <Input
                      placeholder={t('dashboard.wallet.banksTab.accountName', 'Account Name')}
                      value={bankForm.accountName}
                      onChange={(e) => setBankForm({ ...bankForm, accountName: e.target.value })}
                    />
                  </div>

                  {/* Account Number */}
                  <div className="space-y-2">
                    <Label>{t('dashboard.wallet.banksTab.accountNumber', 'Account Number')} *</Label>
                    <Input
                      placeholder={t('dashboard.wallet.banksTab.accountNumber', 'Account Number')}
                      value={bankForm.accountNumber}
                      onChange={(e) => setBankForm({ ...bankForm, accountNumber: e.target.value })}
                    />
                  </div>

                  {/* IBAN */}
                  <div className="space-y-2">
                    <Label>{t('dashboard.wallet.banksTab.iban', 'IBAN')} *</Label>
                    <Input
                      placeholder="SA1234567890123456789012"
                      value={bankForm.iban}
                      onChange={(e) => setBankForm({ ...bankForm, iban: e.target.value })}
                    />
                  </div>

                  {/* Swift Code */}
                  <div className="space-y-2">
                    <Label>{t('dashboard.wallet.banksTab.swiftCode', 'SWIFT Code')}</Label>
                    <Input
                      placeholder={t('dashboard.wallet.banksTab.swiftCode', 'SWIFT Code')}
                      value={bankForm.swiftCode || ''}
                      onChange={(e) => setBankForm({ ...bankForm, swiftCode: e.target.value })}
                    />
                  </div>

                  {/* Sort Order */}
                  <div className="space-y-2">
                    <Label>{t('dashboard.wallet.banksTab.sortOrder', 'Display Order')}</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={bankForm.sortOrder}
                      onChange={(e) => setBankForm({ ...bankForm, sortOrder: parseInt(e.target.value) || 0 })}
                    />
                  </div>

                  {/* Is Active */}
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={bankForm.isActive}
                      onChange={(e) => setBankForm({ ...bankForm, isActive: e.target.checked })}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <Label htmlFor="isActive" className="cursor-pointer">
                      {t('dashboard.wallet.banksTab.active', 'Active')}
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
                      ? t('dashboard.wallet.banksTab.saveChanges', 'Save Changes')
                      : t('dashboard.wallet.banksTab.addBank', 'Add Bank')
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
                {t('dashboard.wallet.banksTab.noBanks', 'No banks yet')}
              </h3>
              <p className="text-sm mb-4">
                {t('dashboard.wallet.banksTab.noBanksDesc', 'Add your first bank so customers can transfer to it')}
              </p>
              <Button onClick={() => setShowAddBankDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                {t('dashboard.wallet.banksTab.addBank', 'Add Bank')}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {allBanks.map((bank) => {
                const bankStat = bankUsageStats.find(s => s.bankId === bank.id);
                return (
                  <Card key={bank.id} className={cn(!bank.isActive && 'opacity-60')}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-4">
                          <div className="flex items-center gap-3">
                            {bank.logo ? (
                              <img src={bank.logo} alt={bank.name} className="h-12 w-12 object-contain" />
                            ) : (
                              <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
                                <Building2 className="h-6 w-6 text-muted-foreground" />
                              </div>
                            )}
                            <div>
                              <h3 className="font-semibold text-lg flex items-center gap-2">
                                {isRTL ? bank.nameAr || bank.name : bank.name}
                                {bank.isActive ? (
                                  <Badge variant="default" className="text-xs">
                                    {t('common.active', 'Active')}
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary" className="text-xs">
                                    {t('common.inactive', 'Inactive')}
                                  </Badge>
                                )}
                              </h3>
                              {bankStat && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  {t('dashboard.wallet.usedTimes', 'Used {{count}} times', { count: bankStat.usageCount })} • {bankStat.percentage.toFixed(1)}%
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">{t('dashboard.wallet.banksTab.bankCode', 'Bank Code')}: </span>
                              <span className="font-medium">{bank.code}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">{t('dashboard.wallet.banksTab.accountName', 'Account Name')}: </span>
                              <span className="font-medium">{bank.accountName}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">{t('dashboard.wallet.banksTab.accountNumber', 'Account Number')}: </span>
                              <span className="font-mono font-medium">{bank.accountNumber}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="ml-2 h-6 px-2"
                                onClick={() => copyToClipboard(bank.accountNumber)}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                            <div>
                              <span className="text-muted-foreground">{t('dashboard.wallet.banksTab.iban', 'IBAN')}: </span>
                              <span className="font-mono font-medium text-xs">{bank.iban}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="ml-2 h-6 px-2"
                                onClick={() => copyToClipboard(bank.iban)}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                            {bank.swiftCode && (
                              <div>
                                <span className="text-muted-foreground">{t('dashboard.wallet.banksTab.swiftCode', 'SWIFT Code')}: </span>
                                <span className="font-mono font-medium text-xs">{bank.swiftCode}</span>
                              </div>
                            )}
                            <div className="text-xs text-muted-foreground">
                              {t('dashboard.wallet.banksTab.sortOrder', 'Display Order')}: {bank.sortOrder}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
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
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
        </TabsContent>

        {/* All Transfers Tab */}
        <TabsContent value="transfers" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                {t('dashboard.wallet.allTransfers', 'All Bank Transfers')}
              </CardTitle>
              <CardDescription>
                {t('dashboard.wallet.allTransfersDesc', 'View all transfers grouped by bank')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {summaryStats.totalBankTransfers === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <History className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">
                    {t('dashboard.wallet.noTransfers', 'No transfers yet')}
                  </h3>
                  <p className="text-sm">
                    {t('dashboard.wallet.noTransfersDesc', 'Transfers will appear here when customers use bank transfers')}
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {allBanks.map((bank) => {
                    const bankTransfers = getBankTransfers(bank.id);
                    if (bankTransfers.length === 0) return null;
                    
                    return (
                      <div key={bank.id} className="space-y-3">
                        <div className="flex items-center gap-3 mb-4">
                          {bank.logo ? (
                            <img src={bank.logo} alt={bank.name} className="h-8 w-8 object-contain" />
                          ) : (
                            <Building2 className="h-6 w-6 text-muted-foreground" />
                          )}
                          <h4 className="font-semibold text-lg">
                            {isRTL ? bank.nameAr || bank.name : bank.name}
                          </h4>
                          <Badge variant="outline">
                            {bankTransfers.length} {t('dashboard.wallet.transfers', 'transfers')}
                          </Badge>
                        </div>
                        <div className="space-y-3">
                          {bankTransfers.map((transfer) => (
                            <Card key={transfer.id} className="bg-muted/50">
                              <CardContent className="p-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                  <div>
                                    <div className="flex items-center gap-2 mb-2">
                                      <User className="h-4 w-4 text-muted-foreground" />
                                      <span className="text-xs text-muted-foreground">
                                        {t('dashboard.wallet.customer', 'Customer')}
                                      </span>
                                    </div>
                                    <p className="font-medium">
                                      {transfer.user?.name || transfer.senderName || t('common.unknown', 'Unknown')}
                                    </p>
                                    {transfer.user?.email && (
                                      <p className="text-sm text-muted-foreground">{transfer.user.email}</p>
                                    )}
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2 mb-2">
                                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                                      <span className="text-xs text-muted-foreground">
                                        {t('dashboard.wallet.amount', 'Amount')}
                                      </span>
                                    </div>
                                    <p className="font-bold text-lg text-green-600">
                                      {typeof transfer.amount === 'string' 
                                        ? parseFloat(transfer.amount).toFixed(2) 
                                        : transfer.amount.toFixed(2)} {transfer.currency || 'SAR'}
                                    </p>
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2 mb-2">
                                      <Clock className="h-4 w-4 text-muted-foreground" />
                                      <span className="text-xs text-muted-foreground">
                                        {t('dashboard.wallet.status', 'Status')}
                                      </span>
                                    </div>
                                    <Badge variant={getStatusVariant(transfer.status)}>
                                      {transfer.status === 'PENDING' && t('dashboard.wallet.status.PENDING', 'Pending')}
                                      {transfer.status === 'APPROVED' && t('dashboard.wallet.status.APPROVED', 'Approved')}
                                      {transfer.status === 'REJECTED' && t('dashboard.wallet.status.REJECTED', 'Rejected')}
                                      {transfer.status === 'CANCELLED' && t('dashboard.wallet.status.CANCELLED', 'Cancelled')}
                                    </Badge>
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2 mb-2">
                                      <Calendar className="h-4 w-4 text-muted-foreground" />
                                      <span className="text-xs text-muted-foreground">
                                        {t('dashboard.wallet.date', 'Date')}
                                      </span>
                                    </div>
                                    <p className="text-sm">{formatDate(transfer.createdAt)}</p>
                                  </div>
                                </div>
                                {(transfer.transferReference || transfer.senderName || transfer.notes) && (
                                  <div className="mt-4 pt-4 border-t space-y-2">
                                    {transfer.transferReference && (
                                      <div className="flex items-center gap-2 text-sm">
                                        <span className="text-muted-foreground">
                                          {t('dashboard.wallet.transferReference', 'Reference')}:
                                        </span>
                                        <span className="font-mono">{transfer.transferReference}</span>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-6 px-2"
                                          onClick={() => copyToClipboard(transfer.transferReference || '')}
                                        >
                                          <Copy className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    )}
                                    {transfer.senderName && !transfer.user?.name && (
                                      <div className="text-sm">
                                        <span className="text-muted-foreground">
                                          {t('dashboard.wallet.senderName', 'Sender')}:
                                        </span>
                                        <span className="ml-2 font-medium">{transfer.senderName}</span>
                                      </div>
                                    )}
                                    {transfer.notes && (
                                      <div className="text-sm">
                                        <span className="text-muted-foreground">
                                          {t('dashboard.wallet.notes', 'Notes')}:
                                        </span>
                                        <span className="ml-2">{transfer.notes}</span>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Usage Statistics Tab */}
        <TabsContent value="usage" className="space-y-6">
          {/* Most Chosen Bank */}
          {mostChosenBank && (
            <Card className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-purple-500/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-purple-600" />
                  {t('dashboard.wallet.mostChosenBank', 'Most Chosen Bank')}
                </CardTitle>
                <CardDescription>
                  {t('dashboard.wallet.mostChosenBankDesc', 'The bank that customers choose most often for transfers')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-4 rounded-xl bg-purple-100 dark:bg-purple-900/20">
                      <Building2 className="h-8 w-8 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">
                        {isRTL ? mostChosenBank.bankNameAr || mostChosenBank.bankName : mostChosenBank.bankName}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {t('dashboard.wallet.usageCount', 'Used {{count}} times', { count: mostChosenBank.usageCount })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-purple-600">
                      {mostChosenBank.percentage.toFixed(1)}%
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t('dashboard.wallet.ofAllTransfers', 'of all transfers')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Bank Usage Statistics */}
          {bankUsageStats.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  {t('dashboard.wallet.bankUsageStats', 'Bank Usage Statistics')}
                </CardTitle>
                <CardDescription>
                  {t('dashboard.wallet.bankUsageStatsDesc', 'See which banks your customers prefer')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {bankUsageStats.map((stat, index) => {
                    const bank = allBanks.find(b => b.id === stat.bankId);
                    return (
                      <div key={stat.bankId} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-4 flex-1">
                            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-bold">
                              {index + 1}
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-lg">
                                {isRTL ? stat.bankNameAr || stat.bankName : stat.bankName}
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                {stat.usageCount} {t('dashboard.wallet.transfers', 'transfers')}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-primary">
                              {stat.percentage.toFixed(1)}%
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {t('dashboard.wallet.ofAllTransfers', 'of all transfers')}
                            </p>
                          </div>
                        </div>
                        <div className="w-full bg-muted rounded-full h-3">
                          <div 
                            className="bg-primary h-3 rounded-full transition-all"
                            style={{ width: `${stat.percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-12">
                <div className="text-center text-muted-foreground">
                  <BarChart3 className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">
                    {t('dashboard.wallet.noUsageData', 'No usage data yet')}
                  </h3>
                  <p className="text-sm">
                    {t('dashboard.wallet.noUsageDataDesc', 'Usage statistics will appear here when customers make transfers')}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
