import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Clock, CheckCircle, XCircle, Loader2, AlertCircle } from 'lucide-react';
import { walletService, TopUpRequest } from '@/services/wallet.service';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { useStoreSettings } from '@/contexts/StoreSettingsContext';
import { formatCurrency } from '@/lib/currency-utils';

export default function MobileRechargeHistory() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { settings } = useStoreSettings();
  const [requests, setRequests] = useState<TopUpRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const isRTL = i18n.language === 'ar';

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setIsLoading(true);
      const data = await walletService.getTopUpRequests();
      // Sort by date desc
      setRequests(data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (error) {
      console.error("Failed to load recharge history", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400 gap-1"><CheckCircle size={12} /> {t('wallet.status.approved', 'Approved')}</Badge>;
      case 'REJECTED':
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 gap-1"><XCircle size={12} /> {t('wallet.status.rejected', 'Rejected')}</Badge>;
      case 'CANCELLED':
        return <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300 gap-1"><AlertCircle size={12} /> {t('wallet.status.cancelled', 'Cancelled')}</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400 gap-1"><Clock size={12} /> {t('wallet.status.pending', 'Pending')}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen pb-20">
      {/* Header */}
      <div className="bg-card p-4 items-center flex gap-4 sticky top-0 z-10 shadow-sm mb-4 border-b border-border">
        <button onClick={() => navigate('/account/recharge')} className="p-2 -ml-2 rounded-full hover:bg-muted text-foreground">
           {isRTL ? <ArrowLeft className="rotate-180" /> : <ArrowLeft />}
        </button>
        <span className="font-bold text-lg text-foreground">{t('wallet.rechargeHistory', 'Recharge Requests')}</span>
      </div>

      <div className="px-4 space-y-3">
        {requests.length === 0 ? (
           <div className="text-center py-20 text-muted-foreground">
              <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>{t('wallet.noRequests', 'No recharge requests found')}</p>
           </div>
        ) : (
           requests.map(req => (
             <div key={req.id} className="bg-card p-4 rounded-xl shadow-sm border border-border">
                <div className="flex justify-between items-start mb-3">
                   <div>
                       <div className="font-bold text-lg text-foreground">
                         {formatCurrency(req.amount, req.currency || settings?.currency || 'SAR')}
                       </div>
                       <div className="text-xs text-muted-foreground mt-1">
                          {format(new Date(req.createdAt), 'dd MMM yyyy, HH:mm')}
                       </div>
                   </div>
                   {getStatusBadge(req.status)}
                </div>
                
                <div className="flex flex-col gap-2 text-sm bg-muted/50 p-3 rounded-lg">
                    <div className="flex justify-between">
                       <span className="text-muted-foreground">Method</span>
                       <span className="font-medium text-foreground">{req.paymentMethod.replace('_', ' ')}</span>
                    </div>
                    {req.bank && (
                      <div className="flex justify-between">
                         <span className="text-muted-foreground">Bank</span>
                         <span className="font-medium text-foreground">{isRTL ? (req.bank.nameAr || req.bank.name) : req.bank.name}</span>
                      </div>
                    )}
                    {req.transferReference && (
                       <div className="flex justify-between">
                          <span className="text-muted-foreground">Ref #</span>
                          <span className="font-mono text-foreground">{req.transferReference}</span>
                       </div>
                    )}
                    {req.rejectionReason && (
                       <div className="mt-2 text-red-600 dark:text-red-400 text-xs bg-red-50 dark:bg-red-900/20 p-2 rounded border border-red-100 dark:border-red-900/30">
                           <span className="font-bold">Reason:</span> {req.rejectionReason}
                       </div>
                    )}
                </div>
             </div>
           ))
        )}
      </div>
    </div>
  );
}
