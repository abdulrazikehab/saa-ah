import React, { useEffect, useState } from 'react';
import { coreApi } from '@/lib/api';
import { Table, TableHeader, TableBody, TableRow, TableCell, TableHead } from '@/components/ui/table';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface Log {
  id: string;
  actorId: string;
  action: string;
  details?: string;
  createdAt: string;
}

export default function ActivityLogs() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await coreApi.get('/activity-log', { params: { page, limit: 20 } });
        setLogs(res.logs || res.data?.logs || []);
        setTotalPages(res.pagination?.totalPages || Math.ceil((res.pagination?.total || 0) / 20));
      } catch (error) {
        console.error('Failed to fetch activity logs:', error);
      } finally {
        setLoading(false);
      }
    })();
  }, [page]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>سجلات النشاط</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8">جاري التحميل…</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الإجراء</TableHead>
                <TableHead>المستخدم</TableHead>
                <TableHead>التفاصيل</TableHead>
                <TableHead>التاريخ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length > 0 ? (
                logs.map(l => (
                  <TableRow key={l.id}>
                    <TableCell>{l.action}</TableCell>
                    <TableCell>{l.actorId}</TableCell>
                    <TableCell>{l.details ? (() => {
                        try {
                            const details = JSON.parse(l.details);
                            return details.permissions?.join(', ') || '-';
                        } catch {
                            return '-';
                        }
                    })() : '-'}</TableCell>
                    <TableCell>{new Date(l.createdAt).toLocaleString('ar-EG')}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">لا توجد سجلات</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
