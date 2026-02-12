import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { coreApi } from '@/lib/api';
import { Table, TableHeader, TableBody, TableRow, TableCell, TableHead } from '@/components/ui/table';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTablePagination } from '@/components/common/DataTablePagination';
import { Download, Search, Calendar, Filter, FileText, User, Tag, Package } from 'lucide-react';
import { writeFile, utils } from 'xlsx';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

interface Log {
  id: string;
  actorId: string;
  actorName?: string;
  action: string;
  details?: string;
  createdAt: string;
  ipAddress?: string;
  userAgent?: string;
  entityType?: string; // product, order, customer, etc.
  entityId?: string;
}

export default function ActivityLogs() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  
  // State
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [entityTypeFilter, setEntityTypeFilter] = useState('all');

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number | undefined> = {
        page,
        limit,
        search: searchQuery || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        action: actionFilter !== 'all' ? actionFilter : undefined,
        entityType: entityTypeFilter !== 'all' ? entityTypeFilter : undefined,
      };

      const res = await coreApi.get('/activity-log', { params });
      
      // Handle different response structures
      const logsData = res.logs || res.data?.logs || res.data || [];
      const meta = res.pagination || res.meta || {};
      
      setLogs(logsData);
      setTotalItems(meta.total || logsData.length);
      setTotalPages(meta.totalPages || Math.ceil((meta.total || logsData.length) / limit));
    } catch (error) {
      console.error('Failed to fetch activity logs:', error);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [page, limit, searchQuery, startDate, endDate, actionFilter, entityTypeFilter]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const handleExport = () => {
    try {
      const exportData = logs.map(log => {
        let detailsText = '-';
        try {
          if (log.details) {
            const parsed = JSON.parse(log.details);
            detailsText = JSON.stringify(parsed);
          }
        } catch (e) {
          detailsText = log.details || '-';
        }

        return {
          [isRTL ? 'الإجراء' : 'Action']: log.action,
          [isRTL ? 'المستخدم' : 'User']: log.actorName || log.actorId,
          [isRTL ? 'نوع الكيان' : 'Entity Type']: log.entityType || '-',
          [isRTL ? 'التفاصيل' : 'Details']: detailsText,
          [isRTL ? 'التاريخ' : 'Date']: new Date(log.createdAt).toLocaleString(isRTL ? 'ar-SA' : 'en-US'),
          [isRTL ? 'IP' : 'IP']: log.ipAddress || '-',
        };
      });

      const ws = utils.json_to_sheet(exportData);
      const wb = utils.book_new();
      utils.book_append_sheet(wb, ws, 'Activity Logs');
      writeFile(wb, `activity_logs_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const parseDetails = (detailsStr?: string) => {
    if (!detailsStr) return <span className="text-muted-foreground">-</span>;
    try {
      const details = JSON.parse(detailsStr);
      return (
        <div className="text-xs max-w-[300px] truncate" title={JSON.stringify(details, null, 2)}>
          {Object.entries(details).map(([key, value]) => (
            <span key={key} className="mr-2">
              <span className="font-semibold opacity-70">{key}:</span> {String(value)}
            </span>
          ))}
        </div>
      );
    } catch {
      return <span className="text-xs text-muted-foreground">{detailsStr}</span>;
    }
  };

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-7 w-7 text-primary" />
            {isRTL ? 'سجل العمليات' : 'Operations Log'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isRTL ? 'تتبع جميع الأنشطة والعمليات في النظام' : 'Track all system activities and operations'}
          </p>
        </div>
        <Button onClick={handleExport} variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          {isRTL ? 'تصدير Excel' : 'Export Excel'}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">
            {isRTL ? 'تصفية وبحث' : 'Filter & Search'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{isRTL ? 'بحث' : 'Search'}</label>
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder={isRTL ? 'بحث بالمستخدم، التفاصيل...' : 'Search user, details...'} 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">{isRTL ? 'التاريخ' : 'Date Range'}</label>
              <div className="flex items-center gap-2">
                <Input 
                  type="date" 
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
                <span className="text-muted-foreground">-</span>
                <Input 
                  type="date" 
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{isRTL ? 'نوع الكيان' : 'Entity Type'}</label>
              <Select value={entityTypeFilter} onValueChange={setEntityTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder={isRTL ? 'الكل' : 'All'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{isRTL ? 'الكل' : 'All'}</SelectItem>
                  <SelectItem value="product">{isRTL ? 'منتج' : 'Product'}</SelectItem>
                  <SelectItem value="order">{isRTL ? 'طلب' : 'Order'}</SelectItem>
                  <SelectItem value="customer">{isRTL ? 'عميل' : 'Customer'}</SelectItem>
                  <SelectItem value="category">{isRTL ? 'تصنيف' : 'Category'}</SelectItem>
                  <SelectItem value="settings">{isRTL ? 'إعدادات' : 'Settings'}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{isRTL ? 'الإجراء' : 'Action'}</label>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger>
                  <SelectValue placeholder={isRTL ? 'الكل' : 'All'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{isRTL ? 'الكل' : 'All'}</SelectItem>
                  <SelectItem value="create">{isRTL ? 'إنشاء' : 'Create'}</SelectItem>
                  <SelectItem value="update">{isRTL ? 'تحديث' : 'Update'}</SelectItem>
                  <SelectItem value="delete">{isRTL ? 'حذف' : 'Delete'}</SelectItem>
                  <SelectItem value="login">{isRTL ? 'تسجيل دخول' : 'Login'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{isRTL ? 'الإجراء' : 'Action'}</TableHead>
                <TableHead>{isRTL ? 'المستخدم' : 'User'}</TableHead>
                <TableHead>{isRTL ? 'نوع الكيان' : 'Entity'}</TableHead>
                <TableHead>{isRTL ? 'التفاصيل' : 'Details'}</TableHead>
                <TableHead>{isRTL ? 'التاريخ' : 'Date'}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    {isRTL ? 'لا توجد سجلات مطابقة' : 'No matching logs found'}
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <Badge variant="outline" className={
                        log.action.includes('delete') ? 'bg-red-50 text-red-700 border-red-200' :
                        log.action.includes('create') ? 'bg-green-50 text-green-700 border-green-200' :
                        'bg-blue-50 text-blue-700 border-blue-200'
                      }>
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{log.actorName || log.actorId}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {log.entityType ? (
                        <div className="flex items-center gap-2">
                          {log.entityType === 'product' ? <Package className="h-4 w-4 text-muted-foreground" /> :
                           log.entityType === 'category' ? <Tag className="h-4 w-4 text-muted-foreground" /> :
                           <FileText className="h-4 w-4 text-muted-foreground" />}
                          <span className="capitalize">{log.entityType}</span>
                        </div>
                      ) : '-'}
                    </TableCell>
                    <TableCell>{parseDetails(log.details)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(log.createdAt).toLocaleString(isRTL ? 'ar-SA' : 'en-US')}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          
          <div className="p-4 border-t">
            <DataTablePagination
              currentPage={page}
              totalPages={totalPages}
              totalItems={totalItems}
              itemsPerPage={limit}
              onPageChange={setPage}
              onItemsPerPageChange={(val) => { setLimit(val); setPage(1); }}
              showItemsPerPage={true}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
