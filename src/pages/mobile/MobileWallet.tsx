import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, 
  Wallet, 
  PlusCircle, 
  History, 
  Building2,
  CreditCard,
  TrendingUp,
  ArrowUpRight,
  ArrowDownLeft,
  Loader2 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { walletService } from '@/services/wallet.service';
import { coreApi } from '@/lib/api';
import { formatCurrency } from '@/lib/currency-utils';
import { useStoreSettings } from '@/contexts/StoreSettingsContext';
import { cn } from '@/lib/utils';

interface WalletTransaction {
  id: string;
  type: 'CREDIT' | 'DEBIT';
  amount: number;
  description?: string;
  createdAt: string;
  status: string;
}

interface AppConfig {
  primaryColor?: string;
  secondaryColor?: string;
  [key: string]: unknown;
}

export default function MobileWallet() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { settings } = useStoreSettings();
  const isRTL = i18n.language === 'ar';
  const currency = settings?.defaultCurrency || 'SAR';

  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<AppConfig | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [balanceRes, transactionsRes, configRes] = await Promise.all([
          walletService.getBalance().catch(() => ({ balance: 0 })),
          walletService.getTransactions(1, 10).catch(() => ({ data: [] })),
          coreApi.get('/app-builder/config').catch(() => null),
        ]);
        
        setBalance(Number(balanceRes.balance) || 0);
        setTransactions(Array.isArray(transactionsRes) ? transactionsRes : transactionsRes?.data || []);
        setConfig(configRes?.config || configRes);
      } catch (error) {
        console.error('Failed to load wallet data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const primaryColor = config?.primaryColor || '#2563eb';

  const quickActions = [
    {
      id: 'recharge',
      icon: PlusCircle,
      label: t('wallet.recharge', 'Recharge'),
      labelAr: 'شحن الرصيد',
      route: '/account/recharge',
      color: 'bg-green-500',
    },
    {
      id: 'history',
      icon: History,
      label: t('wallet.history', 'History'),
      labelAr: 'السجل',
      route: '/account/recharge-history',
      color: 'bg-blue-500',
    },
    {
      id: 'bank-accounts',
      icon: Building2,
      label: t('wallet.bankAccounts', 'Bank Accounts'),
      labelAr: 'الحسابات البنكية',
      route: '/bank-accounts',
      color: 'bg-purple-500',
    },
    {
      id: 'payment-methods',
      icon: CreditCard,
      label: t('wallet.paymentMethods', 'Cards'),
      labelAr: 'البطاقات',
      route: '/account/payment-methods',
      color: 'bg-orange-500',
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="pb-24 bg-background min-h-screen">
      {/* Header */}
      <div className="bg-card p-4 shadow-sm sticky top-0 z-10 flex items-center gap-3 border-b border-border">
        <button onClick={() => navigate(-1)} className="p-1 rounded-full hover:bg-muted text-foreground">
          <ArrowLeft className={cn("w-5 h-5", isRTL && "rotate-180")} />
        </button>
        <h1 className="text-lg font-bold text-foreground">{t('wallet.title', 'My Wallet')}</h1>
      </div>

      {/* Balance Card */}
      <div className="p-4">
        <div 
          className="rounded-3xl p-6 text-white relative overflow-hidden shadow-xl"
          style={{ background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}cc)` }}
        >
          {/* Decorative circles */}
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-black/10 rounded-full blur-2xl" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                <Wallet className="w-6 h-6" />
              </div>
              <div>
                <p className="text-white/80 text-sm">{t('wallet.availableBalance', 'Available Balance')}</p>
                <h2 className="text-3xl font-black tracking-tight">
                  {formatCurrency(balance, currency as string)}
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-4 mt-6 pt-4 border-t border-white/20">
              <Button 
                className="flex-1 bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm"
                onClick={() => navigate('/account/recharge')}
              >
                <PlusCircle className="w-4 h-4 mr-2" />
                {t('wallet.recharge', 'Recharge')}
              </Button>
              <Button 
                variant="outline"
                className="flex-1 bg-transparent border-white/30 text-white hover:bg-white/10"
                onClick={() => navigate('/account/recharge-history')}
              >
                <History className="w-4 h-4 mr-2" />
                {t('wallet.history', 'History')}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-4 pb-4">
        <div className="grid grid-cols-4 gap-3">
          {quickActions.map((action) => (
            <button
              key={action.id}
              className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-card border border-border hover:bg-muted/50 transition-colors"
              onClick={() => navigate(action.route)}
            >
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", action.color)}>
                <action.icon className="w-5 h-5 text-white" />
              </div>
              <span className="text-[10px] font-medium text-muted-foreground text-center leading-tight">
                {isRTL ? action.labelAr : action.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="px-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-foreground">{t('wallet.recentTransactions', 'Recent Transactions')}</h3>
          <button 
            className="text-xs text-primary font-medium"
            onClick={() => navigate('/account/recharge-history')}
          >
            {t('common.viewAll', 'View All')}
          </button>
        </div>

        {transactions.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-2xl border border-border">
            <TrendingUp className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground text-sm">{t('wallet.noTransactions', 'No transactions yet')}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {transactions.slice(0, 5).map((tx) => (
              <div 
                key={tx.id} 
                className="flex items-center gap-3 p-3 bg-card rounded-xl border border-border"
              >
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center",
                  tx.type === 'CREDIT' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                )}>
                  {tx.type === 'CREDIT' ? (
                    <ArrowDownLeft className="w-5 h-5" />
                  ) : (
                    <ArrowUpRight className="w-5 h-5" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground text-sm truncate">
                    {tx.description || (tx.type === 'CREDIT' ? t('wallet.credit') : t('wallet.debit'))}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(tx.createdAt).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                <span className={cn(
                  "font-bold text-sm",
                  tx.type === 'CREDIT' ? 'text-green-600' : 'text-red-600'
                )}>
                  {tx.type === 'CREDIT' ? '+' : '-'}{formatCurrency(tx.amount, currency as string)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
