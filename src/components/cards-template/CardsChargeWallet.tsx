import { useState, useEffect } from 'react';
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
import { ImagePlus, Plus, Upload, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { coreApi } from '@/lib/api';

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
        const [banksData, accountsData] = await Promise.all([
          coreApi.get('/wallet/banks', { requireAuth: true }).catch(() => []),
          coreApi.get('/wallet/bank-accounts', { requireAuth: true }).catch(() => []),
        ]);
        setBanks(Array.isArray(banksData) ? banksData : []);
        setUserBankAccounts(Array.isArray(accountsData) ? accountsData : []);
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      await coreApi.post('/wallet/bank-accounts', newBankAccount, { requireAuth: true });
      toast.success(isRTL ? 'تم إضافة الحساب البنكي بنجاح' : 'Bank account added successfully');
      setShowAddBankDialog(false);
      setNewBankAccount({ bankName: '', accountName: '', accountNumber: '', iban: '', isDefault: false });
      // Reload bank accounts
      const accountsData = await coreApi.get('/wallet/bank-accounts', { requireAuth: true });
      setUserBankAccounts(Array.isArray(accountsData) ? accountsData : []);
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
      <div className="p-6 flex items-center justify-center min-h-[400px]" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">{isRTL ? 'جاري التحميل...' : 'Loading...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <Card className="max-w-4xl mx-auto">
        <CardHeader className="border-b bg-muted/30">
          <CardTitle className="text-xl">
            {isRTL ? 'شحن الرصيد' : 'Charge Wallet'}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Form Section */}
            <div className="space-y-6">
              {/* Payment Method Tabs */}
              <Tabs value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as 'cash' | 'visa')}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="cash">{isRTL ? 'نقدي' : 'Cash'}</TabsTrigger>
                  <TabsTrigger value="visa">{isRTL ? 'فيزا' : 'Visa'}</TabsTrigger>
                </TabsList>
              </Tabs>

              {/* Bank Selection */}
              <div className="space-y-2">
                <Label>{isRTL ? 'البنك' : 'Bank'}</Label>
                <Select value={selectedBank} onValueChange={setSelectedBank}>
                  <SelectTrigger>
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

              {/* Bank Account Details */}
              {selectedBankDetails && (
                <div className="p-4 bg-muted/50 rounded-lg space-y-2 text-sm">
                  <h4 className="font-semibold mb-3">
                    {isRTL ? 'بيانات الحساب البنكي' : 'Bank Account Details'}
                  </h4>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{isRTL ? 'اسم البنك :' : 'Bank Name:'}</span>
                    <span>{isRTL ? selectedBankDetails.nameAr : selectedBankDetails.name}</span>
                  </div>
                  {selectedBankDetails.accountName && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{isRTL ? 'اسم الحساب :' : 'Account Name:'}</span>
                      <span>{selectedBankDetails.accountName}</span>
                    </div>
                  )}
                  {selectedBankDetails.accountNumber && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{isRTL ? 'رقم الحساب :' : 'Account Number:'}</span>
                      <span>{selectedBankDetails.accountNumber}</span>
                    </div>
                  )}
                  {selectedBankDetails.iban && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">IBAN :</span>
                      <span>{selectedBankDetails.iban}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Add Bank Account Dialog */}
              <Dialog open={showAddBankDialog} onOpenChange={setShowAddBankDialog}>
                <DialogTrigger asChild>
                  <Button variant="link" className="text-primary p-0 h-auto">
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

              {/* Source Bank */}
              <div className="space-y-2">
                <Label>{isRTL ? 'الحساب المحول منه (اختياري)' : 'Source Account (Optional)'}</Label>
                <Select value={sourceBank} onValueChange={setSourceBank}>
                  <SelectTrigger>
                    <SelectValue placeholder={isRTL ? 'اختر حساب البنك' : 'Select Bank Account'} />
                  </SelectTrigger>
                  <SelectContent>
                    {userBankAccounts.length > 0 ? (
                      userBankAccounts.map(account => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.bankName} - {account.accountNumber}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="px-2 py-1.5 text-sm text-muted-foreground">
                        {isRTL ? 'لا توجد حسابات بنكية' : 'No bank accounts'}
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Amount */}
              <div className="space-y-2">
                <Label>{isRTL ? 'قيمة الرصيد' : 'Amount'}</Label>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={isRTL ? 'ادخل قيمة الرصيد' : 'Enter amount'}
                />
              </div>

              {/* Currency */}
              <div className="space-y-2">
                <Label>{isRTL ? 'العملة' : 'Currency'}</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger>
                    <SelectValue placeholder={isRTL ? 'اختر العملة' : 'Select Currency'} />
                  </SelectTrigger>
                  <SelectContent>
                    {currencies.map(curr => (
                      <SelectItem key={curr.id} value={curr.id}>
                        {curr.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label>{isRTL ? 'ملاحظات إضافية' : 'Additional Notes'}</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={isRTL ? 'اكتب ملاحظاتك' : 'Write your notes'}
                  rows={3}
                />
              </div>

              {/* Confirm Checkbox */}
              <div className="flex items-center gap-2">
                <Checkbox
                  id="confirm"
                  checked={confirmTransfer}
                  onCheckedChange={(checked) => setConfirmTransfer(checked as boolean)}
                />
                <Label htmlFor="confirm" className="text-sm cursor-pointer">
                  {isRTL ? 'أؤكد قيامي بالتحويل البنكي قبل تأكيد الطلب' : 'I confirm completing the bank transfer before submitting'}
                </Label>
              </div>

              {/* Submit Button */}
              <Button 
                onClick={handleSubmit} 
                className="w-full bg-primary hover:bg-primary/90"
                disabled={submitting || loading}
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {isRTL ? 'جاري الإرسال...' : 'Submitting...'}
                  </>
                ) : (
                  isRTL ? 'إرسال' : 'Submit'
                )}
              </Button>
            </div>

            {/* Receipt Upload Section */}
            <div className="space-y-4">
              <Label>{isRTL ? 'صورة الإيصال' : 'Receipt Image'}</Label>
              <div 
                className={cn(
                  "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors min-h-[300px] flex flex-col items-center justify-center",
                  receiptPreview ? "border-primary" : "border-muted-foreground/25"
                )}
                onClick={() => document.getElementById('receipt-upload')?.click()}
              >
                {receiptPreview ? (
                  <img 
                    src={receiptPreview} 
                    alt="Receipt" 
                    className="max-w-full max-h-64 object-contain rounded"
                  />
                ) : (
                  <>
                    <ImagePlus className="h-16 w-16 text-muted-foreground/50 mb-4" />
                    <p className="text-sm text-muted-foreground mb-4">
                      {isRTL 
                        ? 'يجب أن يكون صورة الإيصال ملف من النوع: pdf, jpg, png, jpeg' 
                        : 'Receipt must be: pdf, jpg, png, jpeg'}
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        document.getElementById('receipt-upload')?.click();
                      }}
                      className="mt-2"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {isRTL ? 'رفع ملف' : 'Upload File'}
                    </Button>
                  </>
                )}
                <input
                  id="receipt-upload"
                  type="file"
                  accept="image/jpeg,image/png,image/jpg,application/pdf"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
              {receiptImage && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    setReceiptImage(null);
                    setReceiptPreview('');
                    setReceiptBase64('');
                  }}
                  className="w-full"
                >
                  {isRTL ? 'إزالة الصورة' : 'Remove Image'}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
