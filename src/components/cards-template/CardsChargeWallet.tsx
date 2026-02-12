import { useState, useEffect, ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ImagePlus, Plus, Upload, Loader2, Wallet, CreditCard, Building2, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { coreApi } from '@/lib/api';
import { walletService } from '@/services/wallet.service';
import { CurrencyIcon } from '@/components/currency/CurrencyIcon';

interface Bank {
  id: string;
  name: string;
  nameAr: string;
  accountName?: string;
  accountNumber?: string;
  iban?: string;
}

interface BankAccount {
  id: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  iban?: string;
}

const currencies = [
  { id: 'SAR', name: 'ريال سعودي', symbol: 'SAR' },
  { id: 'AED', name: 'درهم إماراتي', symbol: 'AED' },
  { id: 'KWD', name: 'دينار كويتي', symbol: 'KWD' },
  { id: 'USD', name: 'دولار', symbol: 'USD' },
  { id: 'QAR', name: 'ريال قطري', symbol: 'QAR' },
];

export default function CardsChargeWallet() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'visa'>('cash');
  const [selectedBank, setSelectedBank] = useState<string>('');
  const [sourceBank, setSourceBank] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [currency, setCurrency] = useState<string>('SAR');
  const [notes, setNotes] = useState<string>('');
  const [confirmTransfer, setConfirmTransfer] = useState(false);
  const [receiptImage, setReceiptImage] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string>('');
  const [receiptBase64, setReceiptBase64] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [userBankAccounts, setUserBankAccounts] = useState<BankAccount[]>([]);
  const [showAddBankDialog, setShowAddBankDialog] = useState(false);
  const [newBankAccount, setNewBankAccount] = useState({
    bankName: '',
    accountName: '',
    accountNumber: '',
    iban: '',
    isDefault: false,
  });
  const [addingBank, setAddingBank] = useState(false);

  const selectedBankDetails = banks.find(b => b.id === selectedBank);

  // Load banks and user bank accounts
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Try to get banks - this should get the merchant's banks (where customers transfer TO)
        // The endpoint uses tenant context from subdomain/domain, so it works for customers
        let banksData: Bank[] = [];
        try {
          banksData = await walletService.getBanks();
          if (!Array.isArray(banksData)) {
            banksData = [];
          }
        } catch (error: any) {
          console.error('Failed to load banks:', error);
          banksData = [];
        }

        // Get user's bank accounts (where customers transfer FROM)
        let accountsData: BankAccount[] = [];
        try {
          accountsData = await walletService.getBankAccounts();
          if (!Array.isArray(accountsData)) {
            accountsData = [];
          }
        } catch (error: any) {
          console.error('Failed to load bank accounts:', error);
          accountsData = [];
        }

        setBanks(banksData);
        setUserBankAccounts(accountsData);
        
        // Set default bank account if exists
        if (accountsData && Array.isArray(accountsData) && accountsData.length > 0) {
          const defaultAccount = accountsData.find((acc: BankAccount) => acc.isDefault);
          if (defaultAccount) {
            setSourceBank(defaultAccount.id);
          }
        }

        // Show warning if no banks are available
        if (banksData.length === 0) {
          console.warn('No banks available for this store');
        }
      } catch (error) {
        console.error('Failed to load data:', error);
        toast.error(isRTL ? 'فشل تحميل البيانات' : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'].includes(file.type)) {
        toast.error(isRTL ? 'يجب أن يكون صورة الإيصال ملف من النوع: pdf, jpg, png, jpeg' : 'Receipt must be: pdf, jpg, png, jpeg');
        return;
      }
      setReceiptImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setReceiptPreview(base64);
        // Extract base64 data (remove data:image/...;base64, prefix)
        const base64Data = base64.split(',')[1] || base64;
        setReceiptBase64(base64Data);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddBankAccount = async () => {
    if (!newBankAccount.bankName || !newBankAccount.accountName || !newBankAccount.accountNumber) {
      toast.error(isRTL ? 'يرجى ملء جميع الحقول المطلوبة' : 'Please fill all required fields');
      return;
    }
    setAddingBank(true);
    try {
      const addedAccount = await walletService.addBankAccount(newBankAccount);
      toast.success(isRTL ? 'تم إضافة الحساب البنكي بنجاح' : 'Bank account added successfully');
      setShowAddBankDialog(false);
      setNewBankAccount({ bankName: '', accountName: '', accountNumber: '', iban: '', isDefault: false });
      // Reload bank accounts
      const accountsData = await walletService.getBankAccounts();
      setUserBankAccounts(Array.isArray(accountsData) ? accountsData : []);
      
      // If this is set as default or it's the first account, select it
      if (addedAccount.isDefault || accountsData.length === 1) {
        setSourceBank(addedAccount.id);
      }
    } catch (error: any) {
      toast.error(isRTL ? 'فشل إضافة الحساب البنكي' : 'Failed to add bank account');
      console.error('Error adding bank account:', error);
    } finally {
      setAddingBank(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedBank || !amount || !currency) {
      toast.error(isRTL ? 'يرجى ملء جميع الحقول المطلوبة' : 'Please fill all required fields');
      return;
    }
    if (paymentMethod === 'cash' && !confirmTransfer) {
      toast.error(isRTL ? 'يرجى تأكيد التحويل البنكي' : 'Please confirm bank transfer');
      return;
    }
    if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      toast.error(isRTL ? 'يرجى إدخال مبلغ صحيح' : 'Please enter a valid amount');
      return;
    }

    setSubmitting(true);
    try {
      const paymentMethodApi = paymentMethod === 'cash' ? 'BANK_TRANSFER' : 'VISA';
      const requestData: any = {
        amount: parseFloat(amount),
        currency: currency,
        paymentMethod: paymentMethodApi,
        bankId: selectedBank,
        notes: notes,
      };

      if (sourceBank) {
        requestData.senderAccountId = sourceBank;
      }

      if (receiptBase64) {
        requestData.receiptImage = receiptBase64;
      }

      const response = await coreApi.post('/wallet/topup', requestData, { requireAuth: true });
      
      toast.success(isRTL ? 'تم إرسال طلب شحن الرصيد بنجاح' : 'Balance charge request submitted successfully');
      
      // Reset form
      setAmount('');
      setNotes('');
      setReceiptImage(null);
      setReceiptPreview('');
      setReceiptBase64('');
      setConfirmTransfer(false);
    } catch (error: any) {
      toast.error(isRTL ? 'فشل إرسال طلب شحن الرصيد' : 'Failed to submit charge request');
      console.error('Error submitting charge request:', error);
    } finally {
      setSubmitting(false);
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
    <div className="w-full max-w-5xl mx-auto p-4 md:p-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <Card className="glass-card border-border/50 shadow-xl overflow-hidden bg-card/50 backdrop-blur-sm">
        {/* Header */}
        <CardHeader className="border-b border-border/50 bg-muted/30 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-accent/5 opacity-50"></div>
          <div className="flex items-center justify-between relative z-10">
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10 border border-primary/20 shadow-sm">
                <Wallet className="w-6 h-6 text-primary" />
              </div>
              {isRTL ? 'شحن المحفظة' : 'Charge Wallet'}
            </CardTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-background/50 px-3 py-1 rounded-full border border-border/50">
              <CreditCard className="w-4 h-4" />
              <span>{isRTL ? 'رصيدك الحالي:' : 'Current Balance:'}</span>
              <span className="font-bold text-primary text-base">$0.00</span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <Tabs value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as 'cash' | 'visa')} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8 p-1 bg-muted/50 rounded-xl border border-border/50">
              <TabsTrigger 
                value="cash" 
                className="rounded-lg data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all duration-300"
              >
                <Building2 className="w-4 h-4 mr-2" />
                {isRTL ? 'تحويل بنكي' : 'Bank Transfer'}
              </TabsTrigger>
              <TabsTrigger 
                value="visa" 
                className="rounded-lg data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all duration-300"
              >
                <CreditCard className="w-4 h-4 mr-2" />
                {isRTL ? 'دفع إلكتروني' : 'Online Payment'}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="cash" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left Column: Bank Details & Amount */}
                <div className="space-y-6">
                  {/* Bank Selection */}
                  <div className="space-y-3">
                    <Label className="text-base font-medium text-foreground">{isRTL ? 'اختر البنك' : 'Select Bank'}</Label>
                    <Select value={selectedBank} onValueChange={setSelectedBank}>
                      <SelectTrigger className="bg-background border-border focus:ring-primary/20 h-12 rounded-xl">
                        <SelectValue placeholder={isRTL ? 'اختر البنك' : 'Select Bank'} />
                      </SelectTrigger>
                      <SelectContent>
                        {banks.map(bank => (
                          <SelectItem key={bank.id} value={bank.id}>
                            {isRTL ? bank.nameAr : bank.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Selected Bank Details */}
                  {selectedBankDetails && (
                    <div className="p-5 rounded-xl bg-muted/50 border border-border/50 space-y-3 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl -mr-10 -mt-10 transition-all group-hover:bg-primary/10"></div>
                      <div className="relative z-10">
                        <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-primary" />
                          {isRTL ? 'تفاصيل التحويل' : 'Transfer Details'}
                        </h4>
                        <div className="space-y-2 text-sm">
                           <div className="flex justify-between items-center py-2 border-b border-border/50">
                            <span className="text-muted-foreground">{isRTL ? 'اسم البنك :' : 'Bank Name:'}</span>
                            <span className="text-foreground font-medium">{isRTL ? selectedBankDetails.nameAr : selectedBankDetails.name}</span>
                          </div>
                          {selectedBankDetails.accountName && (
                            <div className="flex justify-between items-center py-2 border-b border-border/50">
                              <span className="text-muted-foreground">{isRTL ? 'اسم الحساب :' : 'Account Name:'}</span>
                              <span className="text-foreground font-medium">{selectedBankDetails.accountName}</span>
                            </div>
                          )}
                          {selectedBankDetails.accountNumber && (
                            <div className="flex justify-between items-center py-2 border-b border-border/50">
                              <span className="text-muted-foreground">{isRTL ? 'رقم الحساب :' : 'Account Number:'}</span>
                              <span className="text-foreground font-medium font-mono">{selectedBankDetails.accountNumber}</span>
                            </div>
                          )}
                          {selectedBankDetails.iban && (
                            <div className="flex justify-between items-center py-2">
                              <span className="text-muted-foreground">IBAN :</span>
                              <span className="text-foreground font-medium font-mono text-xs">{selectedBankDetails.iban}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Add Bank Account Dialog */}
                  <div className="flex justify-end">
                    <Dialog open={showAddBankDialog} onOpenChange={setShowAddBankDialog}>
                      <DialogTrigger asChild>
                        <Button variant="link" className="text-primary hover:text-primary/80 p-0 h-auto">
                          <Plus className="h-4 w-4 mr-1" />
                          {isRTL ? 'أضف حساب بنكي' : 'Add Bank Account'}
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>{isRTL ? 'إضافة حساب بنكي' : 'Add Bank Account'}</DialogTitle>
                          <DialogDescription>
                            {isRTL ? 'أضف حسابك البنكي لإتمام عمليات الشحن' : 'Add your bank account to complete recharge operations'}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label>{isRTL ? 'اسم البنك' : 'Bank Name'}</Label>
                            <Input
                              value={newBankAccount.bankName}
                              onChange={(e) => setNewBankAccount({ ...newBankAccount, bankName: e.target.value })}
                              placeholder={isRTL ? 'أدخل اسم البنك' : 'Enter bank name'}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>{isRTL ? 'اسم الحساب' : 'Account Name'}</Label>
                            <Input
                              value={newBankAccount.accountName}
                              onChange={(e) => setNewBankAccount({ ...newBankAccount, accountName: e.target.value })}
                              placeholder={isRTL ? 'أدخل اسم الحساب' : 'Enter account name'}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>{isRTL ? 'رقم الحساب' : 'Account Number'}</Label>
                            <Input
                              value={newBankAccount.accountNumber}
                              onChange={(e) => setNewBankAccount({ ...newBankAccount, accountNumber: e.target.value })}
                              placeholder={isRTL ? 'أدخل رقم الحساب' : 'Enter account number'}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>{isRTL ? 'IBAN (اختياري)' : 'IBAN (Optional)'}</Label>
                            <Input
                              value={newBankAccount.iban}
                              onChange={(e) => setNewBankAccount({ ...newBankAccount, iban: e.target.value })}
                              placeholder={isRTL ? 'أدخل IBAN' : 'Enter IBAN'}
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id="isDefault"
                              checked={newBankAccount.isDefault}
                              onCheckedChange={(checked) => setNewBankAccount({ ...newBankAccount, isDefault: checked as boolean })}
                            />
                            <Label htmlFor="isDefault" className="cursor-pointer">
                              {isRTL ? 'تعيين كحساب افتراضي' : 'Set as default account'}
                            </Label>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setShowAddBankDialog(false)}>
                            {isRTL ? 'إلغاء' : 'Cancel'}
                          </Button>
                          <Button onClick={handleAddBankAccount} disabled={addingBank}>
                            {addingBank ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                {isRTL ? 'جاري الإضافة...' : 'Adding...'}
                              </>
                            ) : (
                              isRTL ? 'إضافة' : 'Add'
                            )}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>

                  {/* Amount Input */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <Label className="text-base font-medium text-foreground">{isRTL ? 'العملة' : 'Currency'}</Label>
                      <Select value={currency} onValueChange={setCurrency}>
                        <SelectTrigger className="bg-background border-border focus:ring-primary/20 h-12 rounded-xl">
                          <SelectValue placeholder={isRTL ? 'اختر العملة' : 'Select Currency'} />
                        </SelectTrigger>
                        <SelectContent>
                          {currencies.map(curr => (
                            <SelectItem key={curr.id} value={curr.id}>
                              <div className="flex items-center gap-2">
                                <CurrencyIcon currencyCode={curr.symbol} size={16} />
                                <span>{curr.name}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-3">
                      <Label className="text-base font-medium text-foreground">{isRTL ? 'مبلغ الشحن' : 'Top-up Amount'}</Label>
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="h-12 text-lg bg-background border-border focus:border-primary focus:ring-primary/20 transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Right Column: Transfer Info & Receipt */}
                <div className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-foreground">{isRTL ? 'الحساب المحول منه' : 'Source Account'}</Label>
                      <div className="space-y-2">
                        <Select value={sourceBank} onValueChange={setSourceBank} disabled={userBankAccounts.length === 0}>
                          <SelectTrigger className="bg-background border-border focus:ring-primary/20 h-12 rounded-xl">
                            <SelectValue placeholder={isRTL ? 'اختر حساب البنك' : 'Select Bank Account'} />
                          </SelectTrigger>
                          <SelectContent>
                            {userBankAccounts.length > 0 ? (
                              userBankAccounts.map(account => (
                                <SelectItem key={account.id} value={account.id}>
                                  {account.bankName} - {account.accountName} ({account.accountNumber})
                                </SelectItem>
                              ))
                            ) : (
                              <div className="px-3 py-2 text-sm text-muted-foreground">
                                {isRTL ? 'لا توجد حسابات بنكية. يرجى إضافة حساب بنكي أولاً' : 'No bank accounts. Please add a bank account first'}
                              </div>
                            )}
                          </SelectContent>
                        </Select>
                        {userBankAccounts.length === 0 && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <AlertCircle className="w-4 h-4" />
                            <span>{isRTL ? 'لا توجد حسابات بنكية. يرجى إضافة حساب بنكي أولاً' : 'No bank accounts. Please add a bank account first'}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Dialog open={showAddBankDialog} onOpenChange={setShowAddBankDialog}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" className="gap-2">
                            <Plus className="h-4 w-4" />
                            {isRTL ? 'أضف حساب بنكي' : 'Add Bank Account'}
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>{isRTL ? 'إضافة حساب بنكي' : 'Add Bank Account'}</DialogTitle>
                            <DialogDescription>
                              {isRTL ? 'أضف حسابك البنكي لإتمام عمليات الشحن' : 'Add your bank account to complete recharge operations'}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label>{isRTL ? 'اسم البنك' : 'Bank Name'}</Label>
                              <Input
                                value={newBankAccount.bankName}
                                onChange={(e) => setNewBankAccount({ ...newBankAccount, bankName: e.target.value })}
                                placeholder={isRTL ? 'أدخل اسم البنك' : 'Enter bank name'}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>{isRTL ? 'اسم الحساب' : 'Account Name'}</Label>
                              <Input
                                value={newBankAccount.accountName}
                                onChange={(e) => setNewBankAccount({ ...newBankAccount, accountName: e.target.value })}
                                placeholder={isRTL ? 'أدخل اسم الحساب' : 'Enter account name'}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>{isRTL ? 'رقم الحساب' : 'Account Number'}</Label>
                              <Input
                                value={newBankAccount.accountNumber}
                                onChange={(e) => setNewBankAccount({ ...newBankAccount, accountNumber: e.target.value })}
                                placeholder={isRTL ? 'أدخل رقم الحساب' : 'Enter account number'}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>{isRTL ? 'IBAN (اختياري)' : 'IBAN (Optional)'}</Label>
                              <Input
                                value={newBankAccount.iban}
                                onChange={(e) => setNewBankAccount({ ...newBankAccount, iban: e.target.value })}
                                placeholder={isRTL ? 'أدخل IBAN' : 'Enter IBAN'}
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <Checkbox
                                id="isDefault"
                                checked={newBankAccount.isDefault}
                                onCheckedChange={(checked) => setNewBankAccount({ ...newBankAccount, isDefault: checked as boolean })}
                              />
                              <Label htmlFor="isDefault" className="cursor-pointer">
                                {isRTL ? 'تعيين كحساب افتراضي' : 'Set as default account'}
                              </Label>
                            </div>
                          </div>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setShowAddBankDialog(false)}>
                              {isRTL ? 'إلغاء' : 'Cancel'}
                            </Button>
                            <Button onClick={handleAddBankAccount} disabled={addingBank}>
                              {addingBank ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  {isRTL ? 'جاري الإضافة...' : 'Adding...'}
                                </>
                              ) : (
                                isRTL ? 'إضافة' : 'Add'
                              )}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-foreground">{isRTL ? 'ملاحظات' : 'Notes'}</Label>
                      <Textarea 
                        placeholder={isRTL ? 'أي تفاصيل إضافية...' : 'Any additional details...'}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="min-h-[100px] bg-background border-border focus:border-primary resize-none"
                      />
                    </div>
                  </div>

                  {/* Receipt Upload */}
                  <div className="space-y-3">
                    <Label className="text-base font-medium text-foreground">{isRTL ? 'إيصال التحويل' : 'Transfer Receipt'}</Label>
                    <div 
                      className={cn(
                        "border-2 border-dashed rounded-xl p-6 transition-all duration-300 text-center relative overflow-hidden group cursor-pointer",
                        receiptPreview 
                          ? "border-primary bg-primary/5" 
                          : "border-border hover:border-primary/50 hover:bg-muted/50"
                      )}
                      onClick={() => document.getElementById('receipt-upload')?.click()}
                    >
                      <input
                        id="receipt-upload"
                        type="file"
                        accept="image/*,.pdf"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      
                      {receiptPreview ? (
                        <div className="relative z-20">
                          <div className="relative w-full h-48 rounded-lg overflow-hidden border border-border shadow-sm">
                            <img src={receiptPreview} alt="Receipt" className="w-full h-full object-contain bg-background" />
                          </div>
                          <div className="flex items-center justify-between mt-3">
                            <span className="text-sm font-medium text-foreground truncate max-w-[200px]">
                              {receiptImage?.name}
                            </span>
                            <Button 
                              variant="destructive" 
                              size="sm" 
                              onClick={(e) => {
                                e.stopPropagation();
                                setReceiptImage(null);
                                setReceiptPreview('');
                                setReceiptBase64('');
                              }}
                              className="h-8 px-3"
                            >
                              <X className="w-4 h-4 mr-1" />
                              {isRTL ? 'حذف' : 'Remove'}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-4">
                          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                            <Upload className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors" />
                          </div>
                          <p className="text-sm font-medium text-foreground mb-1">
                            {isRTL ? 'اسحب وأفلت الصورة هنا' : 'Drag & drop image here'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {isRTL ? 'أو انقر للاختيار' : 'or click to browse'}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Confirmation & Submit */}
                  <div className="pt-4 space-y-4">
                    <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/30 border border-border/50">
                      <Checkbox 
                        id="confirm" 
                        checked={confirmTransfer}
                        onCheckedChange={(c) => setConfirmTransfer(!!c)}
                        className="mt-1"
                      />
                      <div className="grid gap-1.5 leading-none">
                        <label
                          htmlFor="confirm"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer text-foreground"
                        >
                          {isRTL ? 'أؤكد أن جميع البيانات صحيحة' : 'I confirm all data is correct'}
                        </label>
                        <p className="text-xs text-muted-foreground">
                          {isRTL ? 'سيتم مراجعة الطلب خلال 24 ساعة' : 'Request will be reviewed within 24 hours'}
                        </p>
                      </div>
                    </div>

                    <Button 
                      className="w-full h-12 text-lg font-bold btn-premium shadow-lg shadow-primary/20"
                      onClick={handleSubmit}
                      disabled={submitting || !confirmTransfer}
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          {isRTL ? 'جاري الإرسال...' : 'Sending...'}
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="mr-2 h-5 w-5" />
                          {isRTL ? 'إرسال طلب الشحن' : 'Submit Request'}
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="visa">
              <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
                <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
                  <CreditCard className="w-10 h-10 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold text-foreground">
                  {isRTL ? 'الدفع الإلكتروني قريباً' : 'Online Payment Coming Soon'}
                </h3>
                <p className="text-muted-foreground max-w-md">
                  {isRTL 
                    ? 'نعمل حالياً على تفعيل بوابات الدفع الإلكتروني لتسهيل عملية الشحن.' 
                    : 'We are currently working on enabling online payment gateways to facilitate the top-up process.'}
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
