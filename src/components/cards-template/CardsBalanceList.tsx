import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package } from 'lucide-react';

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
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  
  const [transactions] = useState<BalanceTransaction[]>([]);

  const getStatusBadge = (status: BalanceTransaction['status']) => {
    const statusConfig = {
      pending: { label: isRTL ? 'معلق' : 'Pending', variant: 'secondary' as const },
      approved: { label: isRTL ? 'مقبول' : 'Approved', variant: 'default' as const },
      rejected: { label: isRTL ? 'مرفوض' : 'Rejected', variant: 'destructive' as const },
    };
    return statusConfig[status];
  };

  return (
    <div className="p-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <Card>
        <CardHeader className="border-b bg-muted/30">
          <CardTitle className="text-xl">
            {isRTL ? 'عمليات شحن الرصيد' : 'Balance Transactions'}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/20">
                  <th className="text-right py-4 px-6 text-sm font-medium text-muted-foreground">
                    {isRTL ? 'الرقم التعريفي' : 'ID'}
                  </th>
                  <th className="text-right py-4 px-6 text-sm font-medium text-muted-foreground">
                    {isRTL ? 'تاريخ العملية' : 'Date'}
                  </th>
                  <th className="text-right py-4 px-6 text-sm font-medium text-muted-foreground">
                    {isRTL ? 'الوصف' : 'Description'}
                  </th>
                  <th className="text-right py-4 px-6 text-sm font-medium text-muted-foreground">
                    {isRTL ? 'الإجراء' : 'Action'}
                  </th>
                  <th className="text-right py-4 px-6 text-sm font-medium text-muted-foreground">
                    {isRTL ? 'الحالة' : 'Status'}
                  </th>
                  <th className="text-right py-4 px-6 text-sm font-medium text-muted-foreground">
                    {isRTL ? 'القيمة' : 'Amount'}
                  </th>
                </tr>
              </thead>
              <tbody>
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-16">
                      <Package className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
                      <p className="text-muted-foreground text-lg">
                        {isRTL ? 'لا توجد بيانات' : 'No data'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  transactions.map((transaction) => (
                    <tr key={transaction.id} className="border-b hover:bg-muted/10">
                      <td className="py-4 px-6 text-sm">{transaction.id}</td>
                      <td className="py-4 px-6 text-sm">{transaction.date}</td>
                      <td className="py-4 px-6 text-sm">{transaction.description}</td>
                      <td className="py-4 px-6 text-sm">{transaction.action}</td>
                      <td className="py-4 px-6">
                        <Badge variant={getStatusBadge(transaction.status).variant}>
                          {getStatusBadge(transaction.status).label}
                        </Badge>
                      </td>
                      <td className="py-4 px-6 text-sm font-medium">
                        {transaction.amount} {transaction.currency}
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
