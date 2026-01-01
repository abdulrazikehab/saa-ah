import { useEffect, useState, useCallback } from 'react';
import { Users, UserPlus, Search, Shield, Trash2, Edit, Check, Phone, Copy, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { staffService, StaffUser } from '@/services/staff.service';
import { coreApi } from '@/lib/api';

const AVAILABLE_PERMISSIONS = [
  { id: 'manage_products', label: 'إدارة المنتجات' },
  { id: 'manage_orders', label: 'إدارة الطلبات' },
  { id: 'manage_customers', label: 'إدارة العملاء' },
  { id: 'manage_settings', label: 'إدارة الإعدادات' },
  { id: 'view_analytics', label: 'عرض التقارير' },
];

interface Customer {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
}

export default function EmployeesManager() {
  const { toast } = useToast();
  const [staff, setStaff] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffPhone, setNewStaffPhone] = useState('');
  const [newStaffRole, setNewStaffRole] = useState<string>('');
  const [newStaffPermissions, setNewStaffPermissions] = useState<string[]>([]);
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [generatedEmail, setGeneratedEmail] = useState('');
  const [passwordCopied, setPasswordCopied] = useState(false);

  const loadStaff = useCallback(async () => {
    try {
      setLoading(true);
      const response = await staffService.getStaffUsers();
      setStaff(response.data || []);
    } catch (error) {
      console.error('Failed to load staff:', error);
      toast({
        title: 'تعذر تحميل بيانات الموظفين',
        description: 'حدث خطأ أثناء تحميل بيانات الموظفين. يرجى تحديث الصفحة.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadStaff();
  }, [loadStaff]);

  useEffect(() => {
    if (isAddDialogOpen) {
      loadCustomers();
    }
  }, [isAddDialogOpen]);

  const loadCustomers = async () => {
    try {
      setLoadingCustomers(true);
      
      // Try to get customers from dashboard endpoint first
      let customersData: any[] = [];
      try {
        const response = await coreApi.get('/dashboard/customers', { requireAuth: true });
        console.log('🛒 EmployeesManager: Dashboard customers response:', response);
        
        // Backend returns { customers: [...], total: number, page: number, limit: number }
        if (Array.isArray(response)) {
          customersData = response;
        } else if (response && typeof response === 'object') {
          // Handle different response formats
          if (Array.isArray(response.customers)) {
            customersData = response.customers;
          } else if (Array.isArray(response.data)) {
            customersData = response.data;
          } else if (response.data && Array.isArray(response.data.customers)) {
            customersData = response.data.customers;
          }
        }
      } catch (dashboardError) {
        console.warn('🛒 EmployeesManager: Dashboard endpoint failed, trying auth service directly:', dashboardError);
        
        // Fallback: Try to get customers directly from auth service
        try {
          const authBaseUrl = import.meta.env.VITE_AUTH_API_URL || 'http://localhost:3001';
          const token = localStorage.getItem('accessToken') || document.cookie.split('accessToken=')[1]?.split(';')[0] || '';
          
          const authResponse = await fetch(`${authBaseUrl}/customers?page=1&limit=1000`, {
            headers: {
              'Authorization': token ? `Bearer ${token}` : '',
              'Content-Type': 'application/json',
            },
            credentials: 'include',
          });
          
          if (authResponse.ok) {
            const authData = await authResponse.json();
            console.log('🛒 EmployeesManager: Auth service customers response:', authData);
            
            if (Array.isArray(authData)) {
              customersData = authData;
            } else if (authData.data && Array.isArray(authData.data)) {
              customersData = authData.data;
            } else if (authData.customers && Array.isArray(authData.customers)) {
              customersData = authData.customers;
            }
          } else {
            console.error('🛒 EmployeesManager: Auth service returned error:', authResponse.status, authResponse.statusText);
          }
        } catch (authError) {
          console.error('🛒 EmployeesManager: Auth service fallback also failed:', authError);
        }
      }
      
      console.log('🛒 EmployeesManager: Extracted customers data:', customersData);
      
      // Get unique customers by email and map to Customer interface
      const uniqueCustomers = customersData.reduce((acc: Customer[], customer: any) => {
        if (!customer || !customer.email) {
          console.warn('🛒 EmployeesManager: Skipping invalid customer:', customer);
          return acc;
        }
        
        const email = customer.email.toLowerCase().trim();
        if (!acc.find(c => c.email.toLowerCase() === email)) {
          acc.push({
            id: customer.id || customer.email || `customer-${acc.length}`,
            email: customer.email,
            firstName: customer.firstName || customer.name || customer.customerName || '',
            lastName: customer.lastName || '',
            phone: customer.phone || customer.customerPhone || '',
          });
        }
        return acc;
      }, []);
      
      console.log('🛒 EmployeesManager: Unique customers:', uniqueCustomers);
      setCustomers(uniqueCustomers);
      
      if (uniqueCustomers.length === 0) {
        console.warn('🛒 EmployeesManager: No customers found. Make sure customers are created in the market.');
        toast({
          title: 'لا يوجد عملاء',
          description: 'لم يتم العثور على عملاء. تأكد من إنشاء العملاء في المتجر أولاً.',
          variant: 'default',
        });
      }
    } catch (error) {
      console.error('🛒 EmployeesManager: Failed to load customers:', error);
      const errorMessage = error instanceof Error ? error.message : 'حدث خطأ أثناء تحميل قائمة العملاء';
      toast({
        title: 'تعذر تحميل العملاء',
        description: errorMessage,
        variant: 'destructive',
      });
      setCustomers([]);
    } finally {
      setLoadingCustomers(false);
    }
  };

  const handleAddStaff = async () => {
    if (!newStaffEmail) {
      toast({
        title: 'البريد الإلكتروني مطلوب',
        description: 'يرجى إدخال البريد الإلكتروني للموظف',
        variant: 'destructive',
      });
      return;
    }

    if (newStaffRole === 'STORE_MANAGER' && selectedCustomers.length === 0) {
      toast({
        title: 'العملاء مطلوبون',
        description: 'يرجى اختيار العملاء للمدير المتجر',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await staffService.createStaff({
        email: newStaffEmail,
        phone: newStaffPhone,
        role: newStaffRole,
        permissions: newStaffPermissions,
        assignedCustomers: selectedCustomers,
      });
      
      // If password was auto-generated, show it in a dialog
      const responseData = response as any;
      if (responseData.password) {
        setGeneratedPassword(responseData.password);
        setGeneratedEmail(newStaffEmail);
        setPasswordDialogOpen(true);
        // Also log to console for easy copy
        console.log(`Employee Password for ${newStaffEmail}: ${responseData.password}`);
      } else {
        toast({
          title: 'تم بنجاح',
          description: 'تم إضافة الموظف بنجاح',
        });
      }
      
      setIsAddDialogOpen(false);
      setNewStaffEmail('');
      setNewStaffPhone('');
      setNewStaffRole('');
      setNewStaffPermissions([]);
      setSelectedCustomers([]);
      loadStaff();
    } catch (error) {
      console.error('Failed to create staff:', error);
      toast({
        title: 'تعذر إضافة الموظف',
        description: 'حدث خطأ أثناء إضافة الموظف. يرجى المحاولة مرة أخرى.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteStaff = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الموظف؟')) return;

    try {
      await staffService.deleteStaff(id);
      toast({
        title: 'تم بنجاح',
        description: 'تم حذف الموظف بنجاح',
      });
      loadStaff();
    } catch (error) {
      console.error('Failed to delete staff:', error);
      toast({
        title: 'تعذر حذف الموظف',
        description: 'حدث خطأ أثناء حذف الموظف. يرجى المحاولة مرة أخرى.',
        variant: 'destructive',
      });
    }
  };

  const togglePermission = (permissionId: string) => {
    setNewStaffPermissions(prev => 
      prev.includes(permissionId)
        ? prev.filter(p => p !== permissionId)
        : [...prev, permissionId]
    );
  };

  const getInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase();
  };

  const copyPassword = async () => {
    try {
      await navigator.clipboard.writeText(generatedPassword);
      setPasswordCopied(true);
      toast({
        title: 'تم النسخ',
        description: 'تم نسخ كلمة المرور إلى الحافظة',
      });
      setTimeout(() => setPasswordCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy password:', error);
      toast({
        title: 'فشل النسخ',
        description: 'تعذر نسخ كلمة المرور. يرجى نسخها يدوياً.',
        variant: 'destructive',
      });
    }
  };

  const filteredStaff = staff.filter(user => 
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">الموظفين</h2>
          <p className="text-muted-foreground">إدارة فريق العمل وصلاحياتهم</p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <UserPlus className="h-4 w-4" />
              إضافة موظف
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>إضافة موظف جديد</DialogTitle>
              <DialogDescription>
                أدخل البريد الإلكتروني للموظف وحدد الصلاحيات الممنوحة له.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="email">البريد الإلكتروني *</Label>
                <Input 
                  id="email" 
                  placeholder="employee@example.com" 
                  value={newStaffEmail}
                  onChange={(e) => setNewStaffEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">رقم الهاتف</Label>
                <Input 
                  id="phone" 
                  placeholder="+966 5XX XXX XXX" 
                  value={newStaffPhone}
                  onChange={(e) => setNewStaffPhone(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">الدور</Label>
                <Select 
                  value={newStaffRole || "__none__"} 
                  onValueChange={(value) => setNewStaffRole(value === "__none__" ? '' : value)}
                >
                  <SelectTrigger id="role">
                    <SelectValue placeholder="اختر الدور" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">بدون دور محدد</SelectItem>
                    <SelectItem value="STORE_MANAGER">مدير متجرك</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {newStaffRole === 'STORE_MANAGER' && (
                <div className="space-y-2">
                  <Label>اختر العملاء *</Label>
                  {loadingCustomers ? (
                    <div className="text-sm text-gray-500 p-3 border rounded-lg flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
                      جاري تحميل العملاء...
                    </div>
                  ) : customers.length === 0 ? (
                    <div className="text-sm text-gray-500 p-3 border rounded-lg bg-gray-50 dark:bg-gray-900">
                      <p className="mb-2">لا يوجد عملاء مسجلين في المتجر</p>
                      <p className="text-xs">سيتم عرض العملاء هنا عند وجود طلبات أو عملاء مسجلين</p>
                    </div>
                  ) : (
                    <div className="max-h-60 overflow-y-auto border rounded-lg p-4 space-y-2 bg-gray-50 dark:bg-gray-900">
                      <p className="text-xs text-gray-500 mb-2">تم العثور على {customers.length} عميل</p>
                      {customers.map((customer) => (
                        <div key={customer.id} className="flex items-center space-x-2 space-x-reverse p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
                          <Checkbox 
                            id={`customer-${customer.id}`}
                            checked={selectedCustomers.includes(customer.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedCustomers([...selectedCustomers, customer.id]);
                              } else {
                                setSelectedCustomers(selectedCustomers.filter(id => id !== customer.id));
                              }
                            }}
                          />
                          <label 
                            htmlFor={`customer-${customer.id}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                          >
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold">{customer.firstName || customer.email}</span>
                                {customer.lastName && (
                                  <span className="text-gray-600 dark:text-gray-400">{customer.lastName}</span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <span>{customer.email}</span>
                                {customer.phone && (
                                  <>
                                    <span>•</span>
                                    <span>{customer.phone}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </label>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              <div className="space-y-2">
                <Label>الصلاحيات</Label>
                <div className="grid grid-cols-2 gap-2 border rounded-lg p-4">
                  {AVAILABLE_PERMISSIONS.map((permission) => (
                    <div key={permission.id} className="flex items-center space-x-2 space-x-reverse">
                      <Checkbox 
                        id={permission.id} 
                        checked={newStaffPermissions.includes(permission.id)}
                        onCheckedChange={() => togglePermission(permission.id)}
                      />
                      <label 
                        htmlFor={permission.id} 
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {permission.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>إلغاء</Button>
              <Button onClick={handleAddStaff} disabled={isSubmitting}>
                {isSubmitting ? 'جاري الإضافة...' : 'إضافة الموظف'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="border-b">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="البحث بالبريد الإلكتروني..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
            </div>
          ) : filteredStaff.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold mb-2">لا يوجد موظفين</h3>
              <p className="text-gray-500">قم بإضافة موظفين لمساعدتك في إدارة المتجر</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الموظف</TableHead>
                  <TableHead>الصلاحيات</TableHead>
                  <TableHead>تاريخ الإضافة</TableHead>
                  <TableHead className="w-[100px]">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStaff.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${user.email}`} />
                          <AvatarFallback>{getInitials(user.email)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex flex-wrap gap-1">
                          {user.staffPermissions.length > 0 ? (
                            user.staffPermissions.map((p, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {AVAILABLE_PERMISSIONS.find(ap => ap.id === p.permission)?.label || p.permission}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-muted-foreground text-sm">لا توجد صلاحيات</span>
                          )}
                        </div>
                        {(user as any).role === 'STORE_MANAGER' && (
                          <Badge variant="outline" className="text-xs mt-1">
                            مدير متجرك
                          </Badge>
                        )}
                        {(user as any).phone && (
                          <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                            <Phone className="h-3 w-3" />
                            {(user as any).phone}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(user.createdAt).toLocaleDateString('ar-SA')}
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => handleDeleteStaff(user.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Password Dialog */}
      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>تم إنشاء الموظف بنجاح</DialogTitle>
            <DialogDescription>
              تم إنشاء حساب الموظف. يرجى نسخ كلمة المرور التالية وإعطائها للموظف.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>البريد الإلكتروني</Label>
              <Input value={generatedEmail} readOnly className="font-mono" />
            </div>
            
            <div className="space-y-2">
              <Label>كلمة المرور المؤقتة</Label>
              <div className="flex gap-2">
                <Input 
                  value={generatedPassword} 
                  readOnly 
                  className="font-mono text-lg font-bold" 
                  type="text"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={copyPassword}
                  className="shrink-0"
                >
                  {passwordCopied ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <Alert>
              <AlertDescription>
                <strong>مهم:</strong> سيتعين على الموظف تغيير كلمة المرور عند تسجيل الدخول لأول مرة.
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button onClick={() => setPasswordDialogOpen(false)}>
              فهمت
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
