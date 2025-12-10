import React, { useEffect, useState } from 'react';
import { coreApi } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface ReportData {
  totalOrders: number;
  revenue: number;
  totalTransactions: number;
  activityCount: number;
}

export default function Reports() {
  const [data, setData] = useState<ReportData | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await coreApi.get('/reports/overview');
        setData(res.data);
      } catch (error) {
        console.error('Failed to load reports:', error);
      }
    })();
  }, []);

  if (!data) return <div className="p-8 text-center">جاري التحميل…</div>;

  return (
    <div className="space-y-6">
        <h2 className="text-2xl font-bold tracking-tight">التقارير</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">عدد الطلبات المكتملة</CardTitle>
            </CardHeader>
            <CardContent>
            <div className="text-2xl font-bold">{data.totalOrders}</div>
            </CardContent>
        </Card>

        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الإيرادات الإجمالية</CardTitle>
            </CardHeader>
            <CardContent>
            <div className="text-2xl font-bold">{Number(data.revenue).toLocaleString('ar-EG')} د.إ</div>
            </CardContent>
        </Card>

        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">عدد المعاملات المكتملة</CardTitle>
            </CardHeader>
            <CardContent>
            <div className="text-2xl font-bold">{data.totalTransactions}</div>
            </CardContent>
        </Card>

        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">عدد سجلات النشاط</CardTitle>
            </CardHeader>
            <CardContent>
            <div className="text-2xl font-bold">{data.activityCount}</div>
            </CardContent>
        </Card>
        </div>
    </div>
  );
}
