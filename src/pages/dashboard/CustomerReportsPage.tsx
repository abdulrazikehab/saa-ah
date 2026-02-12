import { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Users, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar,
  Activity,
  DollarSign,
  Download,
  Filter,
  Search,
  UserCheck,
  UserX,
  Pause,
  Tag,
  CreditCard,
  TrendingUp,
  Building2,
  Eye
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { coreApi, authApi } from '@/lib/api';
import { staffService } from '@/services/staff.service';
import { transactionService } from '@/services/transaction.service';
import { formatCurrency, formatNumber } from '@/lib/currency-utils';
import { writeFile, utils } from 'xlsx';
import { DataTablePagination } from '@/components/common/DataTablePagination';

// Customer interface based on requirements
interface CustomerReport {
  id: string;
  serialNumber: number;
  name: string;
  email: string;
  phone?: string;
  region?: string;
  address?: string;
  status: 'active' | 'inactive' | 'suspended';
  tier: 'K' | 'A' | 'B' | 'C' | 'special';
  activityType?: 'online' | 'telecom' | 'games' | 'grocery' | 'other';
  lastRechargeDate?: string;
  accountManager?: string;
  totalSpent: number;
  ordersCount: number;
  createdAt: string;
}

// Activity type translations
const activityTypeLabels: Record<string, string> = {
  online: 'اونلاين',
  telecom: 'اتصالات',
  games: 'العاب',
  grocery: 'بقالة',
  other: 'أخرى'
};

// Tier color mappings
const tierColors: Record<string, string> = {
  K: 'bg-red-100 text-red-800 border-red-300',
  A: 'bg-teal-100 text-teal-800 border-teal-300',
  B: 'bg-blue-100 text-blue-800 border-blue-300',
  C: 'bg-green-100 text-green-800 border-green-300',
  special: 'bg-purple-100 text-purple-800 border-purple-300'
};

// Status translations
const statusLabels: Record<string, { label: string; color: string }> = {
  active: { label: 'نشط', color: 'bg-green-100 text-green-800' },
  inactive: { label: 'غير نشط', color: 'bg-gray-100 text-gray-800' },
  suspended: { label: 'موقوف مؤقتاً', color: 'bg-yellow-100 text-yellow-800' }
};

export default function CustomerReportsPage() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const { toast } = useToast();
  
  // State
  const [customers, setCustomers] = useState<CustomerReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [activityFilter, setActivityFilter] = useState<string>('all');
  const [employeeFilter, setEmployeeFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  
  // Additional state for employees and transactions
  const [employees, setEmployees] = useState<any[]>([]);
  const [tenantId, setTenantId] = useState<string>('');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerReport | null>(null);
  const [isTransactionsOpen, setIsTransactionsOpen] = useState(false);
  const [customerTransactions, setCustomerTransactions] = useState<any[]>([]);
  const [transactionsLoading, setTransactionsLoading] = useState(false);

  // Stats
  const stats = useMemo(() => {
    return {
      total: customers.length,
      active: customers.filter(c => c.status === 'active').length,
      inactive: customers.filter(c => c.status === 'inactive').length,
      suspended: customers.filter(c => c.status === 'suspended').length,
      tierK: customers.filter(c => c.tier === 'K').length,
      tierA: customers.filter(c => c.tier === 'A').length,
      tierB: customers.filter(c => c.tier === 'B').length,
      tierC: customers.filter(c => c.tier === 'C').length,
    };
  }, [customers]);

  // Load employees and tenant ID
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // Get tenant ID from local storage or auth
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const user = JSON.parse(userStr);
          setTenantId(user.tenantId || '');
        }

        // Load employees
        const response = await staffService.getStaffUsers(1, 100);
        setEmployees(response.data || []);
      } catch (error) {
        console.error('Failed to load initial data:', error);
      }
    };
    loadInitialData();
  }, []);

  // Load customers
  const loadCustomers = useCallback(async () => {
    try {
      setLoading(true);
      
      // Use the reports endpoint which returns full customer data with order stats
      const response = await coreApi.get('/reports/customers', { requireAuth: true });
      
      // Handle response structure
      let rawData: any[] = [];
      if (Array.isArray(response)) {
        rawData = response;
      } else if (response && typeof response === 'object') {
        const r = response as { data?: any[]; customers?: any[] };
        rawData = r.data || r.customers || [];
      }
      
      // Map to CustomerReport format
      const mappedCustomers: CustomerReport[] = rawData.map((c, index: number) => {
        return {
          id: c.id || '',
          serialNumber: index + 1,
          name: c.name || c.email?.split('@')[0] || 'غير محدد',
          email: c.email || '',
          phone: c.phone || '',
          region: c.region || '',
          address: c.address || '',
          status: (c.status as 'active' | 'inactive' | 'suspended') || 'active',
          tier: (c.tier as 'K' | 'A' | 'B' | 'C' | 'special') || 'C',
          activityType: (c.activityType as 'online' | 'telecom' | 'games' | 'grocery' | 'other') || 'other',
          lastRechargeDate: c.lastRechargeDate || null,
          accountManager: c.accountManager || '',
          totalSpent: c.totalSpent || 0,
          ordersCount: c.ordersCount || c.orders || 0,
          createdAt: c.createdAt || new Date().toISOString(),
        };
      });
      
      setCustomers(mappedCustomers);
    } catch (error) {
      console.error('Failed to load customers:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في تحميل بيانات العملاء',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  // Filtered customers
  const filteredCustomers = useMemo(() => {
    return customers.filter(customer => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (!customer.name.toLowerCase().includes(query) &&
            !customer.email.toLowerCase().includes(query) &&
            !customer.phone?.includes(query)) {
          return false;
        }
      }
      
      // Status filter
      if (statusFilter !== 'all' && customer.status !== statusFilter) {
        return false;
      }
      
      // Tier filter
      if (tierFilter !== 'all' && customer.tier !== tierFilter) {
        return false;
      }
      
      // Activity filter
      if (activityFilter !== 'all' && customer.activityType !== activityFilter) {
        return false;
      }

      // Employee filter
      if (employeeFilter !== 'all' && customer.accountManager !== employeeFilter) {
        return false;
      }
      
      return true;
    });
  }, [customers, searchQuery, statusFilter, tierFilter, activityFilter, employeeFilter]);

  // Paginated customers
  const paginatedCustomers = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredCustomers.slice(startIndex, startIndex + pageSize);
  }, [filteredCustomers, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredCustomers.length / pageSize);

  // Export to Excel
  const handleExport = () => {
    try {
      const exportData = filteredCustomers.map((customer, index) => ({
        'الرقم التسلسلي': index + 1,
        'رقم العميل': customer.id,
        'اسم العميل': customer.name,
        'البريد الإلكتروني': customer.email,
        'رقم الجوال': customer.phone || '',
        'المنطقة': customer.region || '',
        'العنوان': customer.address || '',
        'حالة العميل': statusLabels[customer.status]?.label || customer.status,
        'تصنيف العميل': `فئة ${customer.tier}`,
        'نوع النشاط': activityTypeLabels[customer.activityType || 'other'],
        'آخر تاريخ شحن': customer.lastRechargeDate || '',
        'الموظف المسؤول': customer.accountManager || '',
        'إجمالي المشتريات': customer.totalSpent,
        'عدد الطلبات': customer.ordersCount,
        'تاريخ التسجيل': new Date(customer.createdAt).toLocaleDateString('ar-SA'),
      }));

      const ws = utils.json_to_sheet(exportData);
      const wb = utils.book_new();
      utils.book_append_sheet(wb, ws, 'تقرير العملاء');
      writeFile(wb, `تقرير_العملاء_${new Date().toISOString().split('T')[0]}.xlsx`);
      
      toast({
        title: 'تم التصدير',
        description: 'تم تصدير تقرير العملاء بنجاح'
      });
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'فشل في تصدير التقرير',
        variant: 'destructive'
      });
    }
  };

  // Handle preview transactions
  const handlePreviewTransactions = async (customer: CustomerReport) => {
    setSelectedCustomer(customer);
    setIsTransactionsOpen(true);
    setTransactionsLoading(true);
    setCustomerTransactions([]);

    try {
      // Use coreApi directly to avoid strict tenantId requirement if needed, 
      // or use transactionService if tenantId is available
      const response = await transactionService.getTransactions(tenantId || 'default', { 
        customerEmail: customer.email,
        limit: 50 
      }); 
      setCustomerTransactions(response.transactions || []);
    } catch (error) {
      console.error('Failed to load transactions:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في تحميل سجل المعاملات',
        variant: 'destructive'
      });
    } finally {
      setTransactionsLoading(false);
    }
  };

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-7 w-7 text-primary" />
            إدارة وتقارير العملاء
          </h1>
          <p className="text-muted-foreground mt-1">
            عرض وإدارة بيانات العملاء وتقاريرهم
          </p>
        </div>
        <Button onClick={handleExport} className="gap-2">
          <Download className="h-4 w-4" />
          تصدير Excel
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">إجمالي العملاء</p>
                <p className="text-2xl font-bold">{formatNumber(stats.total)}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/50 dark:to-green-900/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">نشط</p>
                <p className="text-2xl font-bold">{formatNumber(stats.active)}</p>
              </div>
              <UserCheck className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950/50 dark:to-gray-900/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">غير نشط</p>
                <p className="text-2xl font-bold">{formatNumber(stats.inactive)}</p>
              </div>
              <UserX className="h-8 w-8 text-gray-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950/50 dark:to-yellow-900/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">موقوف</p>
                <p className="text-2xl font-bold">{formatNumber(stats.suspended)}</p>
              </div>
              <Pause className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/50 dark:to-red-900/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">فئة K</p>
                <p className="text-2xl font-bold">{formatNumber(stats.tierK)}</p>
              </div>
              <Tag className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-950/50 dark:to-teal-900/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">فئة A</p>
                <p className="text-2xl font-bold">{formatNumber(stats.tierA)}</p>
              </div>
              <Tag className="h-8 w-8 text-teal-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-sky-50 to-sky-100 dark:from-sky-950/50 dark:to-sky-900/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">فئة B</p>
                <p className="text-2xl font-bold">{formatNumber(stats.tierB)}</p>
              </div>
              <Tag className="h-8 w-8 text-sky-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/50 dark:to-emerald-900/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">فئة C</p>
                <p className="text-2xl font-bold">{formatNumber(stats.tierC)}</p>
              </div>
              <Tag className="h-8 w-8 text-emerald-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="البحث بالاسم أو البريد أو رقم الجوال..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="حالة العميل" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                <SelectItem value="active">نشط</SelectItem>
                <SelectItem value="inactive">غير نشط</SelectItem>
                <SelectItem value="suspended">موقوف</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={tierFilter} onValueChange={setTierFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="تصنيف العميل" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الفئات</SelectItem>
                <SelectItem value="K">فئة K</SelectItem>
                <SelectItem value="A">فئة A</SelectItem>
                <SelectItem value="B">فئة B</SelectItem>
                <SelectItem value="C">فئة C</SelectItem>
                <SelectItem value="special">سعر خاص</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={activityFilter} onValueChange={setActivityFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="نوع النشاط" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الأنشطة</SelectItem>
                <SelectItem value="online">اونلاين</SelectItem>
                <SelectItem value="telecom">اتصالات</SelectItem>
                <SelectItem value="games">العاب</SelectItem>
                <SelectItem value="grocery">بقالة</SelectItem>
                <SelectItem value="other">أخرى</SelectItem>
              </SelectContent>
            </Select>

            <Select value={employeeFilter} onValueChange={setEmployeeFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="الموظف المسؤول" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الموظفين</SelectItem>
                {employees.map((emp) => (
                  <SelectItem key={emp.id} value={emp.name || emp.email}>
                    {emp.name || emp.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Customers Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            بيانات العملاء
          </CardTitle>
          <CardDescription>
            عرض {formatNumber(filteredCustomers.length)} عميل من إجمالي {formatNumber(customers.length)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-center w-[80px]">#</TableHead>
                      <TableHead>اسم العميل</TableHead>
                      <TableHead>البريد الإلكتروني</TableHead>
                      <TableHead>رقم الجوال</TableHead>
                      <TableHead>المنطقة</TableHead>
                      <TableHead className="text-center">الحالة</TableHead>
                      <TableHead className="text-center">التصنيف</TableHead>
                      <TableHead className="text-center">نوع النشاط</TableHead>
                      <TableHead>آخر شحن</TableHead>
                      <TableHead>الموظف المسؤول</TableHead>
                      <TableHead className="text-left">إجمالي المشتريات</TableHead>
                      <TableHead className="text-center">إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedCustomers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={12} className="text-center py-12 text-muted-foreground">
                          <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                          <p>لا توجد بيانات عملاء</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedCustomers.map((customer, index) => (
                        <TableRow key={customer.id} className="hover:bg-muted/50">
                          <TableCell className="text-center font-medium">
                            {formatNumber((currentPage - 1) * pageSize + index + 1)}
                          </TableCell>
                          <TableCell className="font-medium">{customer.name}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Mail className="h-3 w-3 text-muted-foreground" />
                              {customer.email}
                            </div>
                          </TableCell>
                          <TableCell>
                            {customer.phone ? (
                              <div className="flex items-center gap-1">
                                <Phone className="h-3 w-3 text-muted-foreground" />
                                {formatNumber(customer.phone)}
                              </div>
                            ) : '-'}
                          </TableCell>
                          <TableCell>
                            {customer.region ? (
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3 text-muted-foreground" />
                                {customer.region}
                              </div>
                            ) : '-'}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge className={statusLabels[customer.status]?.color}>
                              {statusLabels[customer.status]?.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className={tierColors[customer.tier]}>
                              فئة {customer.tier}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="secondary">
                              {activityTypeLabels[customer.activityType || 'other']}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {customer.lastRechargeDate ? (
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3 text-muted-foreground" />
                                {new Date(customer.lastRechargeDate).toLocaleDateString('ar-SA')}
                              </div>
                            ) : '-'}
                          </TableCell>
                          <TableCell>
                            {customer.accountManager ? (
                              <div className="flex items-center gap-1">
                                <Building2 className="h-3 w-3 text-muted-foreground" />
                                {customer.accountManager}
                              </div>
                            ) : '-'}
                          </TableCell>
                          <TableCell className="text-left font-medium">
                            {formatCurrency(customer.totalSpent || 0)}
                          </TableCell>
                          <TableCell className="text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handlePreviewTransactions(customer)}
                              title="عرض المعاملات"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-4">
                  <DataTablePagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    itemsPerPage={pageSize}
                    totalItems={filteredCustomers.length}
                    onPageChange={setCurrentPage}
                    onItemsPerPageChange={(size) => {
                      setPageSize(size);
                      setCurrentPage(1);
                    }}
                  />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Transactions Dialog */}
      <Dialog open={isTransactionsOpen} onOpenChange={setIsTransactionsOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>سجل معاملات العميل</DialogTitle>
            <DialogDescription>
              عرض سجل المعاملات للعميل: {selectedCustomer?.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-4">
            {transactionsLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : customerTransactions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <CreditCard className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>لا توجد معاملات لهذا العميل</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>رقم العملية</TableHead>
                    <TableHead>التاريخ</TableHead>
                    <TableHead>المبلغ</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>طريقة الدفع</TableHead>
                    <TableHead>الوصف</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customerTransactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell className="font-mono text-xs">{tx.id.substring(0, 8)}...</TableCell>
                      <TableCell>
                        {new Date(tx.createdAt).toLocaleDateString('ar-SA')} {new Date(tx.createdAt).toLocaleTimeString('ar-SA')}
                      </TableCell>
                      <TableCell className="font-bold">
                        {formatCurrency(tx.amount)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          tx.status === 'COMPLETED' ? 'default' : 
                          tx.status === 'PENDING' ? 'secondary' : 
                          tx.status === 'FAILED' ? 'destructive' : 'outline'
                        }>
                          {tx.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{tx.paymentProvider || tx.paymentMethodType || '-'}</TableCell>
                      <TableCell className="max-w-[200px] truncate" title={tx.description}>
                        {tx.description || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
