import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, TrendingUp, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';

interface BalanceTransaction {
  id: string;
  date: string;
  description: string;
  action: string;
  status: 'pending' | 'approved' | 'rejected';
  amount: number;
  currency: string;
}

export default function CardsBalanceList() {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  
  const [transactions] = useState<BalanceTransaction[]>([]);

  const getStatusBadge = (status: BalanceTransaction['status']) => {
    const statusConfig = {
      pending: { 
        label: isRTL ? 'معلق' : 'Pending', 
        className: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20 hover:bg-yellow-500/20' 
      },
      approved: { 
        label: isRTL ? 'مقبول' : 'Approved', 
        className: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/20' 
      },
      rejected: { 
        label: isRTL ? 'مرفوض' : 'Rejected', 
        className: 'bg-red-500/10 text-red-600 border-red-500/20 hover:bg-red-500/20' 
      },
    };
    return statusConfig[status];
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4 md:p-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <Card className="glass-card border-border/50 shadow-xl overflow-hidden bg-card/50 backdrop-blur-sm">
        {/* Header */}
        <CardHeader className="border-b border-border/50 bg-muted/30 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-accent/5 opacity-50"></div>
          <div className="flex items-center justify-between relative z-10">
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10 border border-primary/20 shadow-sm">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
              {isRTL ? 'عمليات شحن الرصيد' : 'Balance Transactions'}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50 bg-muted/30">
                  <th className="text-right py-4 px-6 text-sm font-semibold text-muted-foreground">
                    {isRTL ? 'الرقم التعريفي' : 'ID'}
                  </th>
                  <th className="text-right py-4 px-6 text-sm font-semibold text-muted-foreground">
                    {isRTL ? 'تاريخ العملية' : 'Date'}
                  </th>
                  <th className="text-right py-4 px-6 text-sm font-semibold text-muted-foreground">
                    {isRTL ? 'الوصف' : 'Description'}
                  </th>
                  <th className="text-right py-4 px-6 text-sm font-semibold text-muted-foreground">
                    {isRTL ? 'الإجراء' : 'Action'}
                  </th>
                  <th className="text-right py-4 px-6 text-sm font-semibold text-muted-foreground">
                    {isRTL ? 'الحالة' : 'Status'}
                  </th>
                  <th className="text-right py-4 px-6 text-sm font-semibold text-muted-foreground">
                    {isRTL ? 'القيمة' : 'Amount'}
                  </th>
                </tr>
              </thead>
              <tbody>
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-20">
                      <div className="flex flex-col items-center">
                        <div className="p-6 rounded-2xl bg-muted/30 mb-6 border border-border/50">
                          <Package className="h-16 w-16 text-muted-foreground/50" />
                        </div>
                        <p className="text-foreground text-lg font-medium mb-2">
                          {isRTL ? 'لا توجد عمليات' : 'No Transactions'}
                        </p>
                        <p className="text-muted-foreground text-sm">
                          {isRTL ? 'لم يتم تسجيل أي عمليات شحن رصيد بعد' : 'No balance transactions have been recorded yet'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  transactions.map((transaction) => (
                    <tr 
                      key={transaction.id} 
                      className="border-b border-border/50 hover:bg-muted/30 transition-colors group"
                    >
                      <td className="py-4 px-6 text-sm text-muted-foreground font-mono">
                        #{transaction.id.slice(0, 8)}
                      </td>
                      <td className="py-4 px-6 text-sm text-foreground">{transaction.date}</td>
                      <td className="py-4 px-6 text-sm text-foreground">{transaction.description}</td>
                      <td className="py-4 px-6 text-sm">
                        <span className="flex items-center gap-2 text-foreground">
                          {transaction.action === 'credit' ? (
                            <ArrowDownCircle className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <ArrowUpCircle className="w-4 h-4 text-red-500" />
                          )}
                          {transaction.action}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <Badge className={`${getStatusBadge(transaction.status).className} border`}>
                          {getStatusBadge(transaction.status).label}
                        </Badge>
                      </td>
                      <td className="py-4 px-6 text-sm font-bold text-foreground">
                        <span className={transaction.amount >= 0 ? 'text-emerald-600' : 'text-red-600'}>
                          {transaction.amount >= 0 ? '+' : ''}{transaction.amount} {transaction.currency}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
