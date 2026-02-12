import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  ArrowLeft, BarChart3, TrendingUp, ShoppingBag, Users, 
  Calendar, Download, ChevronRight, Loader2, AlertCircle, RefreshCcw
} from 'lucide-react';
import { coreApi } from '@/lib/api';
import { reportService } from '@/services/report.service';
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { useStoreSettings } from '@/contexts/StoreSettingsContext';
import { formatCurrency } from '@/lib/currency-utils';

export default function MobileReports() {
  const { t, i18n } = useTranslation();
  const { settings } = useStoreSettings();
  const navigate = useNavigate();
  const isRTL = i18n.language === 'ar';
  
  const [activeConfig, setActiveConfig] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [overview, setOverview] = useState<any>(null);
  const [salesData, setSalesData] = useState<any[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const tenantId = localStorage.getItem('storefrontTenantId');
      
      const [configRes, overviewRes, salesRes] = await Promise.all([
        coreApi.get('/app-builder/config').catch(() => ({})),
        reportService.getOverview().catch(() => ({ totalOrders: 0, revenue: 0, totalTransactions: 0 })),
        reportService.getSalesReport(
            subDays(new Date(), 6), // Start date: 7 days ago
            new Date()              // End date: now
        ).catch(() => ({ byDate: [] }))
      ]);

      setActiveConfig(configRes.config || configRes);
      setOverview(overviewRes);
      
      // Ensure we have 7 days of data even if empty
      const last7Days = [];
      for (let i = 6; i >= 0; i--) {
          const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
          const entry = salesRes.byDate?.find((d: any) => d.date === date) || { date, amount: 0, count: 0 };
          last7Days.push(entry);
      }
      setSalesData(last7Days);

      // Fetch recent transactions (first page of wallet transactions)
      const transactionsRes = await coreApi.get('/wallet/transactions?page=1&limit=5').catch(() => ({ data: [] }));
      setRecentTransactions(transactionsRes.data || []);

    } catch (err: any) {
      console.error("Failed to load report data", err);
      setError("Failed to sync reports with system");
    } finally {
      setIsLoading(false);
    }
  };

  const primaryColor = activeConfig?.primaryColor || '#000000';

  const stats = [
    { 
        value: formatCurrency(overview?.revenue || 0, settings?.currency || 'SAR'), 
        sub: '',
        icon: TrendingUp, 
        color: 'text-green-600', 
        bg: 'bg-green-50 dark:bg-green-900/20' 
    },
    { 
        title: t('reports.totalOrders', 'Total Orders'), 
        value: `${overview?.totalOrders || 0}`, 
        sub: t('common.orders', 'Orders'),
        icon: ShoppingBag, 
        color: 'text-blue-600', 
        bg: 'bg-blue-50 dark:bg-blue-900/20' 
    },
    { 
        title: t('reports.totalTransactions', 'Transactions'), 
        value: `${overview?.totalTransactions || 0}`, 
        sub: t('common.items', 'Operations'),
        icon: BarChart3, 
        color: 'text-purple-600', 
        bg: 'bg-purple-50 dark:bg-purple-900/20' 
    },
  ];

  const maxSales = Math.max(...salesData.map(d => d.amount), 1);

  if (isLoading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" style={{ color: primaryColor }} />
        <p className="text-muted-foreground font-medium animate-pulse">Analyzing Business Data...</p>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background text-center">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-foreground mb-2">Sync Error</h2>
        <p className="text-muted-foreground mb-6">{error}</p>
        <button 
            onClick={loadAllData}
            className="px-6 py-3 bg-primary text-white rounded-2xl font-bold flex items-center gap-2"
            style={{ backgroundColor: primaryColor }}
        >
            <RefreshCcw size={18} /> {t('common.retry', 'Retry')}
        </button>
    </div>
  );

  return (
    <div className="pb-24 bg-background min-h-screen">
      {/* Header */}
      <div className="bg-card p-4 shadow-sm sticky top-0 z-10 flex items-center justify-between border-b border-border">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-1 rounded-full hover:bg-muted transition-colors text-foreground">
               <ArrowLeft className="w-5 h-5 rtl:rotate-180" />
            </button>
            <h1 className="text-lg font-bold text-foreground">{t('profile.reports', 'Analytics')}</h1>
          </div>
          <button className="p-2 text-muted-foreground hover:text-primary transition-colors"><Download size={20} /></button>
      </div>

      <div className="p-4 space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 gap-3">
              {stats.map((stat, idx) => (
                  <div key={idx} className="bg-card p-5 rounded-3xl shadow-sm border border-border flex items-center gap-5 active:scale-[0.98] transition-all">
                      <div className={`p-4 rounded-2xl ${stat.bg} ${stat.color} shadow-inner`}>
                          <stat.icon size={28} />
                      </div>
                      <div>
                          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mb-0.5">{stat.title}</p>
                          <div className="flex items-baseline gap-1.5">
                            <p className="text-2xl font-black text-foreground">{stat.value}</p>
                            {stat.sub && <p className="text-[10px] font-bold text-muted-foreground uppercase">{stat.sub}</p>}
                          </div>
                      </div>
                  </div>
              ))}
          </div>

          {/* Chart Section */}
          <div className="bg-card p-6 rounded-[32px] shadow-sm border border-border">
              <div className="flex justify-between items-center mb-8">
                  <div>
                    <h3 className="font-bold text-foreground">{t('reports.salesOverview', 'Weekly Sales')}</h3>
                    <p className="text-[10px] text-muted-foreground font-medium">Revenue trends for the last 7 days</p>
                  </div>
                  <div className="text-[10px] bg-muted px-2 py-1 rounded-lg text-muted-foreground font-bold flex items-center gap-1.5 border border-border">
                      <Calendar size={12} className="text-primary" style={{ color: primaryColor }} /> {t('reports.last7Days', 'Last 7 Days')}
                  </div>
              </div>

              <div className="h-56 flex items-end justify-between px-2 pb-6 relative">
                  {/* Grid Lines */}
                  <div className="absolute inset-0 flex flex-col justify-between py-6 pointer-events-none opacity-[0.03]">
                      {[1, 2, 3, 4].map(i => <div key={i} className="w-full border-t border-foreground"></div>)}
                  </div>

                  {salesData.map((day, i) => {
                      const height = (day.amount / maxSales) * 100;
                      return (
                        <div key={i} className="group relative flex flex-col items-center flex-1">
                            <div 
                                className="w-2.5 bg-primary/20 rounded-full transition-all duration-700 ease-out group-hover:bg-primary shadow-sm" 
                                style={{ 
                                    height: `${Math.max(height, 5)}%`, 
                                    backgroundColor: height > 0 ? primaryColor : `${primaryColor}15`,
                                    opacity: height > 0 ? 1 : 0.4
                                }}
                            ></div>
                            <span className="text-[9px] text-muted-foreground font-bold mt-3 uppercase tracking-tighter">
                                {format(new Date(day.date), 'EEE')}
                            </span>
                            
                            {/* Tooltip */}
                            <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                                <div className="bg-gray-900 text-white text-[10px] px-2 py-1 rounded shadow-xl whitespace-nowrap font-bold">
                                    {formatCurrency(day.amount, settings?.currency || 'SAR')}
                                </div>
                            </div>
                        </div>
                      );
                  })}
              </div>
          </div>

          {/* Recent Operations */}
          <div className="bg-card rounded-[32px] shadow-sm border border-border overflow-hidden">
              <div className="p-5 border-b border-border flex justify-between items-center">
                  <h3 className="font-bold text-foreground text-sm">{t('reports.recentActivity', 'Recent Activity')}</h3>
                  <button 
                    onClick={() => navigate('/account/recharge-history')}
                    className="text-[10px] font-black text-primary uppercase tracking-wider px-3 py-1 bg-primary/5 rounded-full" 
                    style={{ color: primaryColor }}
                  >
                    {t('common.viewAll', 'View All')}
                  </button>
              </div>
              <div className="divide-y divide-border">
                  {recentTransactions.length === 0 ? (
                      <div className="p-8 text-center text-muted-foreground text-xs italic">
                          No recent transactions found
                      </div>
                  ) : (
                    recentTransactions.map((tx: any) => (
                        <div key={tx.id} className="p-5 flex items-center justify-between active:bg-muted/50 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center border border-border shadow-sm ${tx.type === 'TOPUP' || tx.type === 'REFUND' || Number(tx.amount) > 0 ? 'bg-green-50 dark:bg-green-900/20 text-green-600' : 'bg-red-50 dark:bg-red-900/20 text-red-600'}`}>
                                    {tx.type === 'TOPUP' ? <TrendingUp size={20} /> : <ShoppingBag size={20} />}
                                </div>
                                <div className="max-w-[150px]">
                                    <p className="text-sm font-bold text-foreground truncate">{tx.description || tx.type}</p>
                                    <p className="text-[10px] text-muted-foreground font-medium">
                                        {format(new Date(tx.createdAt), 'MMM dd, HH:mm')}
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className={`text-sm font-black ${Number(tx.amount) > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                    {Number(tx.amount) > 0 ? '+' : ''}{formatCurrency(tx.amount, settings?.currency || 'SAR')}
                                </p>
                                <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">{tx.status}</p>
                            </div>
                        </div>
                    ))
                  )}
              </div>
          </div>
      </div>
    </div>
  );
}
