import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Wallet, Building2, CreditCard, ChevronRight, Loader2, Upload, AlertCircle, Clock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { walletService, Bank, CreateTopUpRequestDto } from '@/services/wallet.service';
import { coreApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useStoreSettings } from '@/contexts/StoreSettingsContext';
import { formatCurrency } from '@/lib/currency-utils';

export default function MobileRecharge() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { settings } = useStoreSettings();
  const { toast } = useToast();
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
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [appConfig, setAppConfig] = useState<any>(null);

  // Retrieve context configuration from MobileLayout
  const { appConfig: contextAppConfig } = useOutletContext<{ appConfig: any }>() || {};
  
  // Prioritize context config (live preview) over local state
  const config = contextAppConfig || appConfig || {};

  // Helper to get dynamic page title
  const getPageTitle = (pageId: string) => {
    const page = config.pages?.find((p: any) => p.id === pageId);
    if (!page) return null;
    return isRTL ? (page.titleAr || page.title) : page.title;
  };

  useEffect(() => {
    // Check Config Color
    coreApi.get('/app-builder/config').then(res => setAppConfig(res.config || res)).catch(() => {});

    // Block Staff
    if (user?.role === 'STAFF') return;

    const loadData = async () => {
      try {
        setIsLoading(true);
        const [walletData, banksData] = await Promise.all([
          walletService.getBalance().catch(() => ({ balance: 0 })),
          walletService.getBanks().catch(() => []),
        ]);
        
        setBalance(Number(walletData.balance) || 0);
        setBanks(banksData);
        if (banksData.length > 0) setSelectedBankId(banksData[0].id);
      } catch (error) {
        console.error("Failed to load recharge data", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [user]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: "Error", description: "File too large (max 5MB)", variant: "destructive" });
        return;
      }
      setReceiptImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setReceiptPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      toast({ title: t('sections.chargeWallet.invalidAmount', 'Invalid amount'), variant: "destructive" });
      return;
    }
    if (paymentMethod === 'BANK_TRANSFER' && !selectedBankId) {
      toast({ title: t('sections.chargeWallet.bankRequired', 'Select a bank'), variant: "destructive" });
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

      // TODO: Handle Image Upload if API supports it in the same call or separate
      // For now assuming API might need update for image but we submit data first
      await walletService.createTopUpRequest(topUpData);
      
      toast({ title: t('sections.chargeWallet.submitSuccess', 'Recharge requested!'), description: "We will review it shortly." });
      setTimeout(() => navigate('/account'), 1500);

    } catch (error: any) {
      toast({ title: "Failed", description: error.message || "Unknown error", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const primaryColor = config.primaryColor || '#000000';
  const quickAmounts = [50, 100, 200, 500];

  if (user?.role === 'STAFF') {
     return (
        <div className="p-8 flex flex-col items-center justify-center min-h-[50vh] text-center bg-background">
            <AlertCircle className="w-12 h-12 text-destructive mb-4" />
            <h2 className="text-xl font-bold mb-2 text-foreground">Not Allowed</h2>
            <p className="text-muted-foreground">Staff members cannot recharge wallet.</p>
            <Button onClick={() => navigate('/')} className="mt-6" variant="outline">Go Home</Button>
        </div>
     );
  }

  if (isLoading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[50vh] bg-background">
          <Loader2 className="animate-spin h-8 w-8 text-primary mb-4" />
          <p className="text-sm text-muted-foreground">Loading wallet...</p>
      </div>
    );
  }

  return (
    <div className="pb-20 bg-background min-h-screen">
      {/* Header */}
      <div className="bg-card p-4 items-center flex justify-between sticky top-0 z-10 shadow-sm border-b border-border">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-muted text-foreground">
             {isRTL ? <ChevronRight /> : <ArrowLeft />}
          </button>
          <span className="font-bold text-lg text-foreground">
             {getPageTitle('wallet') || t('sections.chargeWallet.title', 'Charge Wallet')}
          </span>
        </div>
        <button 
          onClick={() => navigate('/account/recharge-history')}
          className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-full border border-border hover:bg-muted bg-card"
          style={{ color: primaryColor }}
        >
          <Clock className="w-4 h-4" />
          {t('wallet.history', 'History')}
        </button>
      </div>

      <div className="p-4 space-y-6">
          {/* Current Balance */}
          <div 
            className="w-full rounded-2xl p-6 text-white shadow-lg relative overflow-hidden"
            style={{ background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)` }}
          >
             <div className="relative z-10">
                 <p className="text-white/80 text-sm font-medium mb-1">{t('sections.chargeWallet.currentBalance', 'Current Balance')}</p>
                 <h2 className="text-4xl font-bold">{formatCurrency(balance, settings?.currency || 'SAR')}</h2>
             </div>
             <Wallet className="absolute right-4 bottom-4 w-24 h-24 text-white/10" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
              {/* Amount */}
              <div className="space-y-3">
                  <Label className="font-bold text-foreground">{t('sections.chargeWallet.amount', 'Amount')}</Label>
                  <div className="relative">
                      <Input 
                        type="number" 
                        value={amount} 
                        onChange={e => setAmount(e.target.value)} 
                        className="h-14 text-lg font-bold pl-4 pr-12 rounded-xl border-border bg-card focus:ring-primary text-foreground"
                        placeholder="0.00"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">{settings?.currency || 'SAR'}</span>
                  </div>
                  <div className="flex gap-2">
                      {quickAmounts.map(val => (
                          <button 
                             key={val}
                             type="button"
                             onClick={() => setAmount(val.toString())}
                             className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${Number(amount) === val ? 'bg-primary/10 border-primary text-primary' : 'bg-card border-border text-muted-foreground'}`}
                             style={{ color: Number(amount) === val ? primaryColor : undefined, borderColor: Number(amount) === val ? primaryColor : undefined }}
                          >
                             {val}
                          </button>
                      ))}
                  </div>
              </div>

              {/* Payment Method */}
              <div className="space-y-3">
                  <Label className="font-bold text-foreground">{t('sections.chargeWallet.paymentMethod', 'Payment Method')}</Label>
                  <div className="grid grid-cols-2 gap-3">
                       <div 
                         onClick={() => setPaymentMethod('BANK_TRANSFER')}
                         className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col items-center gap-2 text-center ${paymentMethod === 'BANK_TRANSFER' ? 'border-primary bg-primary/5' : 'bg-card border-border'}`}
                         style={{ borderColor: paymentMethod === 'BANK_TRANSFER' ? primaryColor : undefined }}
                       >
                           <Building2 className={`w-6 h-6 ${paymentMethod === 'BANK_TRANSFER' ? 'text-primary' : 'text-muted-foreground'}`} style={{ color: paymentMethod === 'BANK_TRANSFER' ? primaryColor : undefined }} />
                           <span className={`text-xs font-bold ${paymentMethod === 'BANK_TRANSFER' ? 'text-primary' : 'text-muted-foreground'}`} style={{ color: paymentMethod === 'BANK_TRANSFER' ? primaryColor : undefined }}>{t('sections.chargeWallet.methods.bankTransfer', 'Bank Transfer')}</span>
                       </div>
                       {/* Add other methods as placeholders or real if possible */}
                       <div className="p-4 rounded-xl border bg-muted/50 border-border flex flex-col items-center gap-2 text-center opacity-60">
                           <CreditCard className="w-6 h-6 text-muted-foreground" />
                           <span className="text-xs font-bold text-muted-foreground">Online Payment (Soon)</span>
                       </div>
                  </div>
              </div>

              {/* Bank Transfer Details */}
              {paymentMethod === 'BANK_TRANSFER' && (
                  <div className="space-y-4 bg-card p-4 rounded-xl border border-border shadow-sm animate-in fade-in slide-in-from-top-2">
                       <div className="space-y-2">
                          <Label className="text-foreground">Select Bank</Label>
                          <select 
                            value={selectedBankId} 
                            onChange={e => setSelectedBankId(e.target.value)}
                            className="w-full p-3 rounded-lg border border-border bg-background text-foreground"
                          >
                             {banks.map(bank => (
                                 <option key={bank.id} value={bank.id}>{isRTL ? (bank.nameAr || bank.name) : bank.name}</option>
                             ))}
                          </select>
                       </div>

                       {selectedBankId && (
                           <div className="p-3 bg-muted rounded-lg text-sm space-y-1 text-muted-foreground">
                               {(() => {
                                   const b = banks.find(b => b.id === selectedBankId);
                                   if (!b) return null;
                                   return (
                                       <>
                                         <p><span className="font-bold text-foreground">Account:</span> {b.accountName}</p>
                                         <p><span className="font-bold text-foreground">IBAN:</span> {b.iban}</p>
                                       </>
                                   )
                               })()}
                           </div>
                       )}

                       <div className="space-y-2">
                          <Label className="text-foreground">Your Name (Sender)</Label>
                          <Input value={senderName} onChange={e => setSenderName(e.target.value)} placeholder="Full Name" className="bg-background border-border text-foreground" />
                       </div>
                       
                       <div className="space-y-2">
                          <Label className="text-foreground">Reference Number (Optional)</Label>
                          <Input value={transferReference} onChange={e => setTransferReference(e.target.value)} placeholder="Ref #" className="bg-background border-border text-foreground" />
                       </div>

                       <div className="space-y-2">
                          <Label className="text-foreground">Receipt Image</Label>
                          <div className="border-2 border-dashed border-border rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-muted transition-colors relative">
                              <input type="file" accept="image/*" onChange={handleImageChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                              {receiptPreview ? (
                                  <img src={receiptPreview} className="h-32 object-contain" alt="Receipt" />
                              ) : (
                                  <>
                                    <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                                    <span className="text-xs text-muted-foreground">Tap to upload receipt</span>
                                  </>
                              )}
                          </div>
                       </div>
                  </div>
              )}
              
              <Button 
                type="submit" 
                className="w-full h-12 text-lg font-bold rounded-xl shadow-lg shadow-primary/20 text-white"
                style={{ backgroundColor: primaryColor }}
                disabled={isSubmitting}
              >
                 {isSubmitting ? <Loader2 className="animate-spin" /> : t('sections.chargeWallet.submit', 'Submit Request')}
              </Button>
          </form>
      </div>
    </div>
  );
}
