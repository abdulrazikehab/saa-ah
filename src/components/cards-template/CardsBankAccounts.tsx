import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Building2, 
  Plus, 
  Trash2, 
  Star, 
  Loader2,
  CreditCard,
  Edit2,
  CheckCircle2
} from 'lucide-react';
import { toast } from 'sonner';
import { walletService, BankAccount, AddBankAccountDto } from '@/services/wallet.service';

export default function CardsBankAccounts() {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  
  const [newAccount, setNewAccount] = useState<AddBankAccountDto>({
    bankName: '',
    accountName: '',
    accountNumber: '',
    iban: '',
    isDefault: false,
  });

  const loadBankAccounts = useCallback(async () => {
    try {
      setLoading(true);
      const accounts = await walletService.getBankAccounts();
      setBankAccounts(Array.isArray(accounts) ? accounts : []);
    } catch (error) {
      console.error('Failed to load bank accounts:', error);
      toast.error(isRTL ? 'فشل تحميل الحسابات البنكية' : 'Failed to load bank accounts');
    } finally {
      setLoading(false);
    }
  }, [isRTL]);

  useEffect(() => {
    loadBankAccounts();
  }, [loadBankAccounts]);

  const handleAddAccount = async () => {
    if (!newAccount.bankName || !newAccount.accountName || !newAccount.accountNumber) {
      toast.error(isRTL ? 'يرجى ملء جميع الحقول المطلوبة' : 'Please fill all required fields');
      return;
    }

    setSubmitting(true);
    try {
      await walletService.addBankAccount(newAccount);
      toast.success(isRTL ? 'تم إضافة الحساب البنكي بنجاح' : 'Bank account added successfully');
      setShowAddDialog(false);
      setNewAccount({
        bankName: '',
        accountName: '',
        accountNumber: '',
        iban: '',
        isDefault: false,
      });
      loadBankAccounts();
    } catch (error) {
      console.error('Failed to add bank account:', error);
      toast.error(isRTL ? 'فشل إضافة الحساب البنكي' : 'Failed to add bank account');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAccount = async (id: string) => {
    if (!confirm(isRTL ? 'هل أنت متأكد من حذف هذا الحساب البنكي؟' : 'Are you sure you want to delete this bank account?')) {
      return;
    }

    setDeleting(id);
    try {
      await walletService.deleteBankAccount(id);
      setBankAccounts(prev => prev.filter(acc => acc.id !== id));
      toast.success(isRTL ? 'تم حذف الحساب البنكي' : 'Bank account deleted');
    } catch (error) {
      console.error('Failed to delete bank account:', error);
      toast.error(isRTL ? 'فشل حذف الحساب البنكي' : 'Failed to delete bank account');
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[500px] flex items-center justify-center" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="flex flex-col items-center gap-4 p-8">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground font-medium">{isRTL ? 'جاري التحميل...' : 'Loading...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-4 md:p-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <Card className="bg-card border-border/50 shadow-xl overflow-hidden">
        {/* Header */}
        <CardHeader className="border-b border-border/50 bg-muted/30 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-accent/5 opacity-50"></div>
          <div className="flex items-center justify-between relative z-10">
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10 border border-primary/20 shadow-sm">
                <Building2 className="w-6 h-6 text-primary" />
              </div>
              {isRTL ? 'حساباتي البنكية' : 'My Bank Accounts'}
            </CardTitle>
            
            {/* Add Account Button */}
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-primary-foreground shadow-lg shadow-primary/20">
                  <Plus className="h-5 w-5 mr-2" />
                  {isRTL ? 'إضافة حساب جديد' : 'Add New Account'}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold flex items-center gap-2">
                    <CreditCard className="w-6 h-6 text-primary" />
                    {isRTL ? 'إضافة حساب بنكي جديد' : 'Add New Bank Account'}
                  </DialogTitle>
                  <DialogDescription>
                    {isRTL ? 'أدخل بيانات حسابك البنكي لاستخدامه في عمليات الشحن' : 'Enter your bank account details for top-up operations'}
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-5 py-4">
                  <div className="space-y-2">
                    <Label>{isRTL ? 'اسم البنك' : 'Bank Name'} *</Label>
                    <Input
                      value={newAccount.bankName}
                      onChange={(e) => setNewAccount({ ...newAccount, bankName: e.target.value })}
                      placeholder={isRTL ? 'مثال: البنك الأهلي السعودي' : 'e.g., Al Ahli Bank'}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>{isRTL ? 'اسم صاحب الحساب' : 'Account Holder Name'} *</Label>
                    <Input
                      value={newAccount.accountName}
                      onChange={(e) => setNewAccount({ ...newAccount, accountName: e.target.value })}
                      placeholder={isRTL ? 'الاسم كما يظهر في الحساب' : 'Name as shown on the account'}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>{isRTL ? 'رقم الحساب' : 'Account Number'} *</Label>
                    <Input
                      value={newAccount.accountNumber}
                      onChange={(e) => setNewAccount({ ...newAccount, accountNumber: e.target.value })}
                      placeholder={isRTL ? 'أدخل رقم الحساب' : 'Enter account number'}
                      className="font-mono"
                      dir="ltr"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>{isRTL ? 'رقم الآيبان (IBAN)' : 'IBAN Number'}</Label>
                    <Input
                      value={newAccount.iban || ''}
                      onChange={(e) => setNewAccount({ ...newAccount, iban: e.target.value })}
                      placeholder={isRTL ? 'SA00 0000 0000 0000 0000 0000' : 'SA00 0000 0000 0000 0000 0000'}
                      className="font-mono"
                      dir="ltr"
                    />
                  </div>
                  
                  <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-xl border border-border/50">
                    <Checkbox
                      id="isDefault"
                      checked={newAccount.isDefault}
                      onCheckedChange={(checked) => setNewAccount({ ...newAccount, isDefault: checked as boolean })}
                    />
                    <Label htmlFor="isDefault" className="cursor-pointer flex items-center gap-2">
                      <Star className="w-4 h-4 text-amber-500" />
                      {isRTL ? 'تعيين كحساب افتراضي' : 'Set as default account'}
                    </Label>
                  </div>
                </div>
                
                <DialogFooter className="gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowAddDialog(false)}
                  >
                    {isRTL ? 'إلغاء' : 'Cancel'}
                  </Button>
                  <Button 
                    onClick={handleAddAccount} 
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {isRTL ? 'جاري الإضافة...' : 'Adding...'}
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        {isRTL ? 'إضافة الحساب' : 'Add Account'}
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {bankAccounts.length === 0 ? (
            <div className="text-center py-16">
              <div className="p-6 rounded-2xl bg-muted/30 inline-block mb-6 border border-border/50">
                <Building2 className="h-16 w-16 text-muted-foreground/50" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                {isRTL ? 'لا توجد حسابات بنكية' : 'No Bank Accounts'}
              </h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                {isRTL 
                  ? 'لم تقم بإضافة أي حساب بنكي بعد. أضف حسابك البنكي لتسهيل عمليات الشحن.'
                  : 'You haven\'t added any bank accounts yet. Add your bank account to facilitate top-up operations.'}
              </p>
              <Button 
                onClick={() => setShowAddDialog(true)}
                className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-primary-foreground shadow-lg shadow-primary/20"
              >
                <Plus className="h-5 w-5 mr-2" />
                {isRTL ? 'إضافة حسابك الأول' : 'Add Your First Account'}
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {bankAccounts.map((account) => (
                <div 
                  key={account.id}
                  className="p-5 rounded-xl bg-card border border-border hover:border-primary/50 transition-all group shadow-sm"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Building2 className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground">{account.bankName}</h4>
                        <p className="text-sm text-muted-foreground">{account.accountName}</p>
                      </div>
                    </div>
                    {account.isDefault && (
                      <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20">
                        <Star className="w-3 h-3 mr-1 fill-amber-600" />
                        {isRTL ? 'افتراضي' : 'Default'}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between items-center py-2 border-b border-border/50">
                      <span className="text-muted-foreground text-sm">{isRTL ? 'رقم الحساب' : 'Account Number'}</span>
                      <span className="text-foreground font-mono text-sm">{account.accountNumber}</span>
                    </div>
                    {account.iban && (
                      <div className="flex justify-between items-center py-2">
                        <span className="text-muted-foreground text-sm">IBAN</span>
                        <span className="text-foreground font-mono text-xs">{account.iban}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        setEditingAccount(account);
                        setShowEditDialog(true);
                      }}
                    >
                      <Edit2 className="h-4 w-4 mr-2" />
                      {isRTL ? 'تعديل' : 'Edit'}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="text-red-500 hover:text-red-600 hover:bg-red-500/10 border-red-500/20"
                      onClick={() => handleDeleteAccount(account.id)}
                      disabled={deleting === account.id}
                    >
                      {deleting === account.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
