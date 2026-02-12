import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Wallet, CreditCard, Building2, ArrowRight, ArrowLeft, AlertCircle } from 'lucide-react';
import { walletService, Bank, CreateTopUpRequestDto, type Wallet as IWallet } from '@/services/wallet.service';
import { coreApi } from '@/lib/api';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useTranslation } from 'react-i18next';
import { useStoreSettings } from '@/contexts/StoreSettingsContext';
import { formatCurrency } from '@/lib/currency-utils';

export default function RechargeBalance() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t, i18n } = useTranslation();
  const { settings } = useStoreSettings();
  const isRTL = i18n.language === 'ar';
  
  const [balance, setBalance] = useState<number>(0);
  const [amount, setAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'BANK_TRANSFER' | 'VISA' | 'MASTERCARD' | 'MADA' | 'APPLE_PAY' | 'STC_PAY'>('BANK_TRANSFER');
  const [banks, setBanks] = useState<Bank[]>([]);
  const [selectedBankId, setSelectedBankId] = useState<string>('');
  const [senderName, setSenderName] = useState<string>('');
  const [transferReference, setTransferReference] = useState<string>('');
  const [receiptImage, setReceiptImage] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [walletCurrency, setWalletCurrency] = useState<string>('SAR');
  const [currencies, setCurrencies] = useState<{ code: string; exchangeRate: number }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [walletData, banksData, currenciesResponse] = await Promise.all([
        walletService.getBalance().catch(() => ({ balance: 0, currency: 'SAR' } as unknown as IWallet)),
        walletService.getBanks().catch(() => []),
        coreApi.get('/currencies').catch(() => []),
      ]);
      
      setBalance(Number(walletData.balance) || 0);
      setWalletCurrency(walletData.currency || 'SAR');
      
      if (Array.isArray(currenciesResponse)) {
        setCurrencies(currenciesResponse.map((c: { code: string; exchangeRate: string | number }) => ({
          code: c.code,
          exchangeRate: Number(c.exchangeRate)
        })));
      }

      setBanks(banksData);
      if (banksData.length > 0) {
        setSelectedBankId(banksData[0].id);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      toast({
        title: t('sections.chargeWallet.loadError', 'Failed to load data'),
        description: t('sections.chargeWallet.loadErrorDesc', 'An error occurred while loading data. Please try again.'),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [t, toast]);

  const convertCurrency = (amount: number, fromCurrency: string, toCurrency: string) => {
    if (fromCurrency === toCurrency) return amount;
    if (currencies.length === 0) return amount;

    const fromRate = currencies.find(c => c.code === fromCurrency)?.exchangeRate || 1;
    const toRate = currencies.find(c => c.code === toCurrency)?.exchangeRate || 1;
    
    return amount * (toRate / fromRate);
  };

  // Block STAFF users from accessing recharge page
  useEffect(() => {
    if (user?.role === 'STAFF') {
      navigate('/');
      toast({
        title: t('sections.chargeWallet.notAllowed', 'Not Allowed'),
        description: t('sections.chargeWallet.staffNotAllowed', 'Staff are not allowed to recharge balance'),
        variant: 'destructive',
      });
    }
  }, [user, navigate, toast, t]);

  useEffect(() => {
    if (user?.role !== 'STAFF') {
      loadData();
    }
  }, [user, loadData]);

  // If STAFF user, show blocked message
  if (user?.role === 'STAFF') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container py-8 max-w-4xl">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{t('sections.chargeWallet.notAllowed', 'Not Allowed')}</AlertTitle>
            <AlertDescription>
              {t('sections.chargeWallet.staffNotAllowedDesc', 'Staff members are not allowed to recharge balance. Please contact the store owner to add balance.')}
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: t('sections.chargeWallet.fileSizeError', 'File size too large'),
          description: t('sections.chargeWallet.fileSizeErrorDesc', 'Maximum file size is 5MB'),
          variant: 'destructive',
        });
        return;
      }
      setReceiptImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || Number(amount) <= 0) {
      toast({
        title: t('sections.chargeWallet.invalidAmount', 'Invalid amount'),
        description: t('sections.chargeWallet.invalidAmountDesc', 'Please enter a valid amount greater than zero'),
        variant: 'destructive',
      });
      return;
    }

    if (paymentMethod === 'BANK_TRANSFER' && !selectedBankId) {
      toast({
        title: t('sections.chargeWallet.bankRequired', 'Bank required'),
        description: t('sections.chargeWallet.bankRequiredDesc', 'Please select a bank'),
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      const topUpData: CreateTopUpRequestDto = {
        amount: Number(amount),
        currency: settings?.currency || 'SAR',
        paymentMethod,
        bankId: paymentMethod === 'BANK_TRANSFER' ? selectedBankId : undefined,
        senderName: senderName || undefined,
        transferReference: transferReference || undefined,
        notes: notes || undefined,
      };

      // If there's a receipt image, we need to upload it separately
      // For now, we'll create the request and handle image upload if the API supports it
      await walletService.createTopUpRequest(topUpData);
      
      toast({
        title: t('sections.chargeWallet.submitSuccess', 'Recharge request sent successfully'),
        description: t('sections.chargeWallet.submitSuccessDesc', 'Your request will be reviewed soon and balance will be added to your wallet'),
      });
      
      // Navigate to orders page or show success message
      setTimeout(() => {
        navigate('/account/orders');
      }, 2000);
    } catch (error: unknown) {
      console.error('Failed to create top-up request:', error);
      const errorMessage = error instanceof Error ? error.message : t('common.somethingWentWrong', 'Something went wrong');
      toast({
        title: t('sections.chargeWallet.submitError', 'Failed to send recharge request'),
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const quickAmounts = [50, 100, 200, 500, 1000];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container py-8">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-12 w-12 animate-spin text-indigo-600" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="container py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            {t('sections.chargeWallet.title', 'Charge Balance')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            {t('sections.chargeWallet.desc', 'Add balance to your wallet to benefit from our services')}
          </p>
        </div>

        {/* Current Balance Card */}
        <Card className="mb-6 border-0 shadow-lg bg-gradient-to-br from-indigo-600 to-purple-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90 mb-2">{t('sections.chargeWallet.currentBalance', 'Current Balance')}</p>
                <p className="text-4xl font-bold">{formatCurrency(convertCurrency(balance, walletCurrency, settings?.currency || 'SAR'), settings?.currency || 'SAR')}</p>
              </div>
              <Wallet className="h-16 w-16 opacity-50" />
            </div>
          </CardContent>
        </Card>

        {/* Recharge Form */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl">{t('sections.chargeWallet.addNewBalance', 'Add New Balance')}</CardTitle>
            <CardDescription>{t('sections.chargeWallet.choosePaymentMethod', 'Choose payment method and enter amount')}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Amount Input */}
              <div className="space-y-2">
                <Label htmlFor="amount">{t('sections.chargeWallet.amount', 'Amount')} ({settings?.currency || 'SAR'})</Label>
                <Input
                  id="amount"
                  type="number"
                  min="1"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={t('sections.chargeWallet.amount', 'Amount')}
                  className="text-lg"
                  required
                />
                
                {/* Quick Amount Buttons */}
                <div className="flex flex-wrap gap-2 mt-3">
                  {quickAmounts.map((quickAmount) => (
                    <Button
                      key={quickAmount}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setAmount(quickAmount.toString())}
                      className="rounded-lg"
                    >
                      {formatCurrency(quickAmount, settings?.currency || 'SAR')}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Payment Method */}
              <div className="space-y-2">
                <Label>{t('sections.chargeWallet.paymentMethod', 'Payment Method')}</Label>
                <RadioGroup value={paymentMethod} onValueChange={(value: string) => setPaymentMethod(value as 'BANK_TRANSFER' | 'VISA' | 'MASTERCARD' | 'MADA' | 'APPLE_PAY' | 'STC_PAY')}>
                  <div className="flex items-center space-x-2 space-x-reverse p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                    <RadioGroupItem value="BANK_TRANSFER" id="bank" />
                    <Label htmlFor="bank" className="flex-1 cursor-pointer flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      {t('sections.chargeWallet.methods.bankTransfer', 'Bank Transfer')}
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                    <RadioGroupItem value="VISA" id="visa" />
                    <Label htmlFor="visa" className="flex-1 cursor-pointer flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Visa
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                    <RadioGroupItem value="MASTERCARD" id="mastercard" />
                    <Label htmlFor="mastercard" className="flex-1 cursor-pointer flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Mastercard
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                    <RadioGroupItem value="MADA" id="mada" />
                    <Label htmlFor="mada" className="flex-1 cursor-pointer flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      {t('payment.mada.name', 'Mada')}
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Bank Selection (for bank transfer) */}
              {paymentMethod === 'BANK_TRANSFER' && (
                <div className="space-y-2">
                  <Label htmlFor="bank">{t('sections.chargeWallet.bank', 'Bank')}</Label>
                  <select
                    id="bank"
                    value={selectedBankId}
                    onChange={(e) => setSelectedBankId(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg bg-background"
                    required
                  >
                    {banks.map((bank) => (
                      <option key={bank.id} value={bank.id}>
                        {isRTL ? (bank.nameAr || bank.name) : (bank.name || bank.nameAr)}
                      </option>
                    ))}
                  </select>
                  
                  {selectedBankId && (
                    <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      {banks.find(b => b.id === selectedBankId) && (
                        <>
                          <p className="font-semibold mb-2">{t('sections.chargeWallet.bankInfo', 'Bank Account Information:')}</p>
                          <div className="space-y-1 text-sm">
                            <p><span className="font-medium">{t('sections.chargeWallet.accountName', 'Account Name:')}</span> {banks.find(b => b.id === selectedBankId)?.accountName}</p>
                            <p><span className="font-medium">{t('sections.chargeWallet.accountNumber', 'Account Number:')}</span> {banks.find(b => b.id === selectedBankId)?.accountNumber}</p>
                            <p><span className="font-medium">{t('sections.chargeWallet.iban', 'IBAN:')}</span> {banks.find(b => b.id === selectedBankId)?.iban}</p>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* Sender Name */}
                  <div className="mt-4 space-y-2">
                    <Label htmlFor="senderName">{t('sections.chargeWallet.transferrerName', 'Transferrer Name')}</Label>
                    <Input
                      id="senderName"
                      value={senderName}
                      onChange={(e) => setSenderName(e.target.value)}
                      placeholder={t('sections.chargeWallet.transferrerNamePlaceholder', 'Enter transferrer name')}
                    />
                  </div>

                  {/* Transfer Reference */}
                  <div className="space-y-2">
                    <Label htmlFor="transferReference">{t('sections.balanceOperations.id', 'ID')}</Label>
                    <Input
                      id="transferReference"
                      value={transferReference}
                      onChange={(e) => setTransferReference(e.target.value)}
                      placeholder={t('sections.balanceOperations.id', 'ID')}
                    />
                  </div>

                  {/* Receipt Upload */}
                  <div className="space-y-2">
                    <Label htmlFor="receipt">{t('sections.chargeWallet.receipt', 'Receipt Image')}</Label>
                    <div className="flex items-center gap-4">
                      <Input
                        id="receipt"
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="flex-1"
                      />
                      {receiptPreview && (
                        <img src={receiptPreview} alt="Receipt preview" className="h-20 w-20 object-cover rounded-lg" />
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">{t('sections.supportTickets.description', 'Description')}</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={t('sections.chargeWallet.notesPlaceholder', 'Any additional notes...')}
                  rows={3}
                />
              </div>

              {/* Submit Button */}
              <div className="flex gap-4 pt-4">
                <Button
                  type="submit"
                  size="lg"
                  disabled={isSubmitting}
                  className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className={`${isRTL ? 'ml-2' : 'mr-2'} h-4 w-4 animate-spin`} />
                      {t('sections.chargeWallet.submitting', 'Submitting...')}
                    </>
                  ) : (
                    <>
                      {t('sections.chargeWallet.submit', 'Submit')}
                      {isRTL ? <ArrowLeft className="mr-2 h-4 w-4" /> : <ArrowRight className="ml-2 h-4 w-4" />}
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={() => navigate('/account/orders')}
                >
                  {t('common.cancel', 'Cancel')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}




