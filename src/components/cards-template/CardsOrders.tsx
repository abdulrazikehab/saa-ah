import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Package, Plus } from 'lucide-react';
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
      pending: { label: isRTL ? 'معلق' : 'Pending', variant: 'secondary' as const },
      completed: { label: isRTL ? 'مكتمل' : 'Completed', variant: 'default' as const },
      cancelled: { label: isRTL ? 'ملغى' : 'Cancelled', variant: 'destructive' as const },
    };
    return statusConfig[status];
  };

  return (
    <div className="p-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <Card>
        <CardHeader className="border-b bg-muted/30">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">
              {isRTL ? 'طلباتي' : 'My Orders'}
            </CardTitle>
            <Button 
              onClick={() => navigate('/dashboard/cards/store')}
              className="bg-primary hover:bg-primary/90"
            >
              <Plus className="h-4 w-4 mr-2" />
              {isRTL ? 'إنشاء طلب' : 'Create Order'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/20">
                  <th className="text-right py-4 px-6 text-sm font-medium text-muted-foreground">
                    {isRTL ? 'رقم الطلب' : 'Order #'}
                  </th>
                  <th className="text-right py-4 px-6 text-sm font-medium text-muted-foreground">
                    {isRTL ? 'تاريخ الطلب' : 'Order Date'}
                  </th>
                  <th className="text-right py-4 px-6 text-sm font-medium text-muted-foreground">
                    {isRTL ? 'عدد البطاقات' : 'Cards Count'}
                  </th>
                  <th className="text-right py-4 px-6 text-sm font-medium text-muted-foreground">
                    {isRTL ? 'القيمة' : 'Value'}
                  </th>
                  <th className="text-right py-4 px-6 text-sm font-medium text-muted-foreground">
                    {isRTL ? 'الحالة' : 'Status'}
                  </th>
                  <th className="text-right py-4 px-6 text-sm font-medium text-muted-foreground">
                    {isRTL ? 'بواسطة' : 'Created By'}
                  </th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-16">
                      <Package className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
                      <p className="text-muted-foreground text-lg">
                        {isRTL ? 'لا توجد بيانات' : 'No data'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr key={order.id} className="border-b hover:bg-muted/10">
                      <td className="py-4 px-6 text-sm">{order.id}</td>
                      <td className="py-4 px-6 text-sm">{order.date}</td>
                      <td className="py-4 px-6 text-sm">{order.cardsCount}</td>
                      <td className="py-4 px-6 text-sm font-medium">
                        {order.value} {order.currency}
                      </td>
                      <td className="py-4 px-6">
                        <Badge variant={getStatusBadge(order.status).variant}>
                          {getStatusBadge(order.status).label}
                        </Badge>
                      </td>
                      <td className="py-4 px-6 text-sm">{order.createdBy}</td>
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
