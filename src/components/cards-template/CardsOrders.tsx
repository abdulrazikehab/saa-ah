import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Package, Plus, ShoppingBag, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Order {
  id: string;
  date: string;
  cardsCount: number;
  value: number;
  currency: string;
  status: 'pending' | 'completed' | 'cancelled';
  createdBy: string;
}

export default function CardsOrders() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const navigate = useNavigate();
  
  const [orders] = useState<Order[]>([]);

  const getStatusBadge = (status: Order['status']) => {
    const statusConfig = {
      pending: { 
        label: isRTL ? 'معلق' : 'Pending', 
        className: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
        icon: <Clock className="w-3 h-3 mr-1" />
      },
      completed: { 
        label: isRTL ? 'مكتمل' : 'Completed', 
        className: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
        icon: <CheckCircle2 className="w-3 h-3 mr-1" />
      },
      cancelled: { 
        label: isRTL ? 'ملغى' : 'Cancelled', 
        className: 'bg-red-500/10 text-red-600 border-red-500/20',
        icon: <XCircle className="w-3 h-3 mr-1" />
      },
    };
    return statusConfig[status];
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4 md:p-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <Card className="bg-card border-border/50 shadow-xl overflow-hidden">
        {/* Header */}
        <CardHeader className="border-b border-border/50 bg-muted/30 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-accent/5 opacity-50"></div>
          <div className="flex items-center justify-between relative z-10">
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10 border border-primary/20 shadow-sm">
                <ShoppingBag className="w-6 h-6 text-primary" />
              </div>
              {t('sections.customerOrders.title')}
            </CardTitle>
            <Button 
              onClick={() => navigate('/dashboard/cards/store')}
              className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-primary-foreground shadow-lg shadow-primary/20"
            >
              <Plus className="h-5 w-5 mr-2" />
              {isRTL ? 'إنشاء طلب' : 'Create Order'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50 bg-muted/30">
                  <th className={`${isRTL ? 'text-right' : 'text-left'} py-4 px-6 text-sm font-semibold text-muted-foreground`}>
                    {t('sections.customerOrders.orderNumber')}
                  </th>
                  <th className={`${isRTL ? 'text-right' : 'text-left'} py-4 px-6 text-sm font-semibold text-muted-foreground`}>
                    {t('sections.customerOrders.date')}
                  </th>
                  <th className="text-right py-4 px-6 text-sm font-semibold text-muted-foreground">
                    {isRTL ? 'عدد البطاقات' : 'Cards Count'}
                  </th>
                  <th className="text-right py-4 px-6 text-sm font-semibold text-muted-foreground">
                    {isRTL ? 'القيمة' : 'Value'}
                  </th>
                  <th className="text-right py-4 px-6 text-sm font-semibold text-muted-foreground">
                    {isRTL ? 'الحالة' : 'Status'}
                  </th>
                  <th className="text-right py-4 px-6 text-sm font-semibold text-muted-foreground">
                    {isRTL ? 'بواسطة' : 'Created By'}
                  </th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-20">
                      <div className="flex flex-col items-center">
                        <div className="p-6 rounded-2xl bg-muted/30 mb-6 border border-border/50">
                          <Package className="h-16 w-16 text-muted-foreground/50" />
                        </div>
                        <p className="text-foreground text-lg font-medium mb-2">
                          {isRTL ? 'لا توجد طلبات' : 'No Orders Yet'}
                        </p>
                        <p className="text-muted-foreground text-sm mb-6">
                          {isRTL ? 'ابدأ بإنشاء طلبك الأول' : 'Start by creating your first order'}
                        </p>
                        <Button 
                          onClick={() => navigate('/dashboard/cards/store')}
                          className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-primary-foreground"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          {isRTL ? 'إنشاء طلب جديد' : 'Create New Order'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr 
                      key={order.id} 
                      className="border-b border-border/50 hover:bg-muted/30 transition-colors cursor-pointer"
                    >
                      <td className="py-4 px-6 text-sm font-mono text-muted-foreground">#{order.id.slice(0, 8)}</td>
                      <td className="py-4 px-6 text-sm text-foreground">{order.date}</td>
                      <td className="py-4 px-6 text-sm text-foreground font-medium">{order.cardsCount}</td>
                      <td className="py-4 px-6 text-sm font-bold text-emerald-600">
                        {order.value.toFixed(2)} {order.currency}
                      </td>
                      <td className="py-4 px-6">
                        <Badge className={`${getStatusBadge(order.status).className} border flex items-center w-fit`}>
                          {getStatusBadge(order.status).icon}
                          {getStatusBadge(order.status).label}
                        </Badge>
                      </td>
                      <td className="py-4 px-6 text-sm text-foreground">{order.createdBy}</td>
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
