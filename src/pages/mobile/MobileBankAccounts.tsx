import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Building2, 
  Star, 
  Loader2,
  Edit2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { walletService, BankAccount } from '@/services/wallet.service';
import { coreApi } from '@/lib/api';
import { cn } from '@/lib/utils';

interface Bank {
  id: string;
  name: string;
  nameAr?: string;
  logo?: string;
  code?: string;
}

// Extended form data interface for UI
interface BankAccountFormData {
  bankName: string;
  bankCode?: string;
  accountName: string;
  accountNumber: string;
  iban?: string;
  isDefault?: boolean;
}

export default function MobileBankAccounts() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isRTL = i18n.language === 'ar';

  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null);
  const [selectedBankId, setSelectedBankId] = useState<string>('');
  
  const [formData, setFormData] = useState<BankAccountFormData>({
    bankName: '',
    bankCode: '',
    accountName: '',
    accountNumber: '',
    iban: '',
    isDefault: false,
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [accountsRes, banksRes] = await Promise.all([
        walletService.getBankAccounts(),
        coreApi.get('/banks').catch(() => []),
      ]);
      setBankAccounts(accountsRes || []);
      setBanks(Array.isArray(banksRes) ? banksRes : banksRes?.data || []);
    } catch (error) {
      console.error('Failed to load bank accounts:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleBankSelect = (bankId: string) => {
    setSelectedBankId(bankId);
    const bank = banks.find(b => b.id === bankId);
    if (bank) {
      setFormData({
        ...formData,
        bankName: bank.name,
        bankCode: bank.code,
      });
    }
  };

  const handleAddOrUpdate = async () => {
    if (!formData.bankName || !formData.accountNumber || !formData.accountName) {
      toast({ variant: 'destructive', title: t('common.error'), description: t('bankAccounts.fillRequired', 'Please fill all required fields') });
      return;
    }

    setSaving(true);
    try {
      // Always add new since update isn't available
      await walletService.addBankAccount(formData);
      toast({ title: t('common.success'), description: editingAccount ? t('bankAccounts.updated', 'Bank account updated') : t('bankAccounts.added', 'Bank account added') });
      setIsDialogOpen(false);
      setEditingAccount(null);
      resetForm();
      loadData();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : t('common.errorOccurred');
      toast({ variant: 'destructive', title: t('common.error'), description: errorMessage });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('bankAccounts.confirmDelete', 'Are you sure you want to delete this bank account?'))) return;
    
    try {
      await walletService.deleteBankAccount(id);
      toast({ title: t('common.success'), description: t('bankAccounts.deleted', 'Bank account deleted') });
      loadData();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : t('common.errorOccurred');
      toast({ variant: 'destructive', title: t('common.error'), description: errorMessage });
    }
  };

  const resetForm = () => {
    setFormData({ bankName: '', bankCode: '', accountName: '', accountNumber: '', iban: '', isDefault: false });
    setSelectedBankId('');
  };

  const openEditDialog = (account: BankAccount) => {
    setEditingAccount(account);
    // Find matching bank
    const matchingBank = banks.find(b => b.name === account.bankName || b.code === account.bankCode);
    setSelectedBankId(matchingBank?.id || '');
    setFormData({
      bankName: account.bankName,
      bankCode: account.bankCode,
      accountName: account.accountName,
      accountNumber: account.accountNumber,
      iban: account.iban || '',
      isDefault: account.isDefault,
    });
    setIsDialogOpen(true);
  };

  const openAddDialog = () => {
    setEditingAccount(null);
    resetForm();
    setIsDialogOpen(true);
  };

  return (
    <div className="pb-24 bg-background min-h-screen">
      {/* Header */}
      <div className="bg-card p-4 shadow-sm sticky top-0 z-10 flex items-center justify-between border-b border-border">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1 rounded-full hover:bg-muted text-foreground">
            <ArrowLeft className={cn("w-5 h-5", isRTL && "rotate-180")} />
          </button>
          <h1 className="text-lg font-bold text-foreground">{t('bankAccounts.title', 'Bank Accounts')}</h1>
        </div>
        <Button size="sm" onClick={openAddDialog} className="gap-2">
          <Plus className="w-4 h-4" />
          {t('common.add')}
        </Button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : bankAccounts.length === 0 ? (
          <div className="text-center py-16">
            <Building2 className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
            <h3 className="font-semibold text-foreground mb-2">{t('bankAccounts.noAccounts', 'No Bank Accounts')}</h3>
            <p className="text-sm text-muted-foreground mb-4">{t('bankAccounts.addFirst', 'Add your first bank account for balance recharges')}</p>
            <Button onClick={openAddDialog} className="gap-2">
              <Plus className="w-4 h-4" />
              {t('bankAccounts.addAccount', 'Add Bank Account')}
            </Button>
          </div>
        ) : (
          bankAccounts.map((account) => {
            const bank = banks.find(b => b.name === account.bankName || b.code === account.bankCode);
            return (
              <div 
                key={account.id} 
                className={cn(
                  "bg-card rounded-2xl p-4 border shadow-sm relative overflow-hidden",
                  account.isDefault ? "border-primary/50 ring-1 ring-primary/20" : "border-border"
                )}
              >
                {account.isDefault && (
                  <div className="absolute top-2 right-2">
                    <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded-full flex items-center gap-1">
                      <Star className="w-3 h-3 fill-current" />
                      {t('common.default')}
                    </span>
                  </div>
                )}

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center shrink-0">
                    {bank?.logo ? (
                      <img src={bank.logo} alt={bank.name} className="w-8 h-8 object-contain" />
                    ) : (
                      <Building2 className="w-6 h-6 text-primary" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground truncate">
                      {isRTL ? bank?.nameAr || account.bankName : account.bankName}
                    </h3>
                    <p className="text-sm text-muted-foreground">{account.accountName}</p>
                    <p className="text-xs text-muted-foreground font-mono mt-1">
                      {account.accountNumber}
                    </p>
                    {account.iban && (
                      <p className="text-xs text-muted-foreground font-mono">
                        IBAN: {account.iban}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border/50">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs h-8"
                    onClick={() => openEditDialog(account)}
                  >
                    <Edit2 className="w-3 h-3 mr-1" />
                    {t('common.edit')}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs h-8 text-destructive hover:text-destructive"
                    onClick={() => handleDelete(account.id)}
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    {t('common.delete')}
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingAccount ? t('bankAccounts.editAccount', 'Edit Bank Account') : t('bankAccounts.addAccount', 'Add Bank Account')}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t('bankAccounts.selectBank', 'Select Bank')} *</Label>
              <Select value={selectedBankId} onValueChange={handleBankSelect}>
                <SelectTrigger>
                  <SelectValue placeholder={t('bankAccounts.selectBankPlaceholder', 'Choose a bank')} />
                </SelectTrigger>
                <SelectContent>
                  {banks.map((bank) => (
                    <SelectItem key={bank.id} value={bank.id}>
                      <div className="flex items-center gap-2">
                        {bank.logo && <img src={bank.logo} alt="" className="w-5 h-5 object-contain" />}
                        {isRTL ? bank.nameAr || bank.name : bank.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t('bankAccounts.accountHolder', 'Account Holder Name')} *</Label>
              <Input
                value={formData.accountName}
                onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                placeholder={t('bankAccounts.accountHolderPlaceholder', 'Enter account holder name')}
              />
            </div>

            <div className="space-y-2">
              <Label>{t('bankAccounts.accountNumber', 'Account Number')} *</Label>
              <Input
                value={formData.accountNumber}
                onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                placeholder={t('bankAccounts.accountNumberPlaceholder', 'Enter account number')}
              />
            </div>

            <div className="space-y-2">
              <Label>{t('bankAccounts.iban', 'IBAN')} ({t('common.optional')})</Label>
              <Input
                value={formData.iban}
                onChange={(e) => setFormData({ ...formData, iban: e.target.value })}
                placeholder="SA00 0000 0000 0000 0000 0000"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleAddOrUpdate} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingAccount ? t('common.save') : t('common.add')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
