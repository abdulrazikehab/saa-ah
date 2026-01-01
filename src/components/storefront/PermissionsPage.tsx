import { useEffect, useState, useCallback } from 'react';
import { Shield, Users, Eye, Key, CheckCircle, XCircle, Package, ShoppingCart, BarChart3, Settings, Loader2, Edit, Search } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { customerEmployeesService, CustomerEmployee } from '@/services/customer-employees.service';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';

interface PermissionInfo {
  id: string;
  label: string;
  description: string;
  icon: any;
  category: string;
}

const PERMISSION_INFO: Record<string, PermissionInfo> = {
  'product:create': { id: 'product:create', label: 'Create Products', description: 'Can create new products', icon: Package, category: 'Products' },
  'product:read': { id: 'product:read', label: 'View Products', description: 'Can view product information', icon: Eye, category: 'Products' },
  'product:update': { id: 'product:update', label: 'Edit Products', description: 'Can modify existing products', icon: Settings, category: 'Products' },
  'product:delete': { id: 'product:delete', label: 'Delete Products', description: 'Can remove products', icon: XCircle, category: 'Products' },
  'product:manage': { id: 'product:manage', label: 'Manage Products', description: 'Full product management access', icon: Package, category: 'Products' },
  'order:create': { id: 'order:create', label: 'Create Orders', description: 'Can create new orders', icon: ShoppingCart, category: 'Orders' },
  'order:read': { id: 'order:read', label: 'View Orders', description: 'Can view order information', icon: Eye, category: 'Orders' },
  'order:update': { id: 'order:update', label: 'Update Orders', description: 'Can modify existing orders', icon: Settings, category: 'Orders' },
  'order:delete': { id: 'order:delete', label: 'Delete Orders', description: 'Can remove orders', icon: XCircle, category: 'Orders' },
  'order:manage': { id: 'order:manage', label: 'Manage Orders', description: 'Full order management access', icon: ShoppingCart, category: 'Orders' },
  'customer:create': { id: 'customer:create', label: 'Create Customers', description: 'Can create new customer accounts', icon: Users, category: 'Customers' },
  'customer:read': { id: 'customer:read', label: 'View Customers', description: 'Can view customer information', icon: Eye, category: 'Customers' },
  'customer:update': { id: 'customer:update', label: 'Update Customers', description: 'Can modify customer data', icon: Settings, category: 'Customers' },
  'customer:delete': { id: 'customer:delete', label: 'Delete Customers', description: 'Can remove customers', icon: XCircle, category: 'Customers' },
  'customer:manage': { id: 'customer:manage', label: 'Manage Customers', description: 'Full customer management access', icon: Users, category: 'Customers' },
  'inventory:read': { id: 'inventory:read', label: 'View Inventory', description: 'Can view stock levels', icon: Eye, category: 'Inventory' },
  'inventory:update': { id: 'inventory:update', label: 'Update Inventory', description: 'Can modify stock levels', icon: Settings, category: 'Inventory' },
  'inventory:manage': { id: 'inventory:manage', label: 'Manage Inventory', description: 'Full inventory control', icon: Package, category: 'Inventory' },
  'analytics:read': { id: 'analytics:read', label: 'View Analytics', description: 'Can view reports and analytics', icon: BarChart3, category: 'Analytics' },
  'analytics:manage': { id: 'analytics:manage', label: 'Manage Analytics', description: 'Full analytics access', icon: BarChart3, category: 'Analytics' },
  'settings:read': { id: 'settings:read', label: 'View Settings', description: 'Can view store settings', icon: Eye, category: 'Settings' },
  'settings:update': { id: 'settings:update', label: 'Update Settings', description: 'Can modify store settings', icon: Settings, category: 'Settings' },
  'mobile:merchant:access': { id: 'mobile:merchant:access', label: 'Mobile App Access', description: 'Can access merchant features in mobile app', icon: Shield, category: 'Mobile App' },
  'mobile:merchant:orders': { id: 'mobile:merchant:orders', label: 'Mobile Orders Management', description: 'Can manage orders via mobile app', icon: ShoppingCart, category: 'Mobile App' },
  'mobile:merchant:products': { id: 'mobile:merchant:products', label: 'Mobile Products Management', description: 'Can manage products via mobile app', icon: Package, category: 'Mobile App' },
  'mobile:merchant:customers': { id: 'mobile:merchant:customers', label: 'Mobile Customers View', description: 'Can view customers via mobile app', icon: Users, category: 'Mobile App' },
  'mobile:merchant:analytics': { id: 'mobile:merchant:analytics', label: 'Mobile Analytics View', description: 'Can view analytics via mobile app', icon: BarChart3, category: 'Mobile App' },
};

// Store-level permissions (for customer employees, different from platform permissions)
const STORE_PERMISSION_GROUPS: { category: string; permissions: PermissionInfo[]; pageAccess?: string[] }[] = [
  {
    category: 'المنتجات',
    pageAccess: ['/store/products', '/products'],
    permissions: [
      { id: 'store:products:view', label: 'عرض المنتجات', description: 'القدرة على عرض المنتجات في المتجر', icon: Eye, category: 'المنتجات' },
      { id: 'store:products:create', label: 'إضافة منتجات', description: 'القدرة على إضافة منتجات جديدة', icon: Package, category: 'المنتجات' },
      { id: 'store:products:edit', label: 'تعديل المنتجات', description: 'القدرة على تعديل المنتجات', icon: Settings, category: 'المنتجات' },
      { id: 'store:products:delete', label: 'حذف المنتجات', description: 'القدرة على حذف المنتجات', icon: XCircle, category: 'المنتجات' },
    ],
  },
  {
    category: 'الطلبات',
    pageAccess: ['/store/orders', '/orders'],
    permissions: [
      { id: 'store:orders:view', label: 'عرض الطلبات', description: 'القدرة على عرض الطلبات', icon: Eye, category: 'الطلبات' },
      { id: 'store:orders:create', label: 'إنشاء طلبات', description: 'القدرة على إنشاء طلبات جديدة', icon: ShoppingCart, category: 'الطلبات' },
      { id: 'store:orders:edit', label: 'تعديل الطلبات', description: 'القدرة على تعديل الطلبات', icon: Settings, category: 'الطلبات' },
      { id: 'store:orders:cancel', label: 'إلغاء الطلبات', description: 'القدرة على إلغاء الطلبات', icon: XCircle, category: 'الطلبات' },
    ],
  },
  {
    category: 'العملاء',
    pageAccess: ['/store/customers'],
    permissions: [
      { id: 'store:customers:view', label: 'عرض العملاء', description: 'القدرة على عرض معلومات العملاء', icon: Eye, category: 'العملاء' },
      { id: 'store:customers:edit', label: 'تعديل العملاء', description: 'القدرة على تعديل بيانات العملاء', icon: Settings, category: 'العملاء' },
    ],
  },
  {
    category: 'المتجر',
    pageAccess: ['/store', '/'],
    permissions: [
      { id: 'store:home:view', label: 'عرض الصفحة الرئيسية', description: 'القدرة على عرض الصفحة الرئيسية للمتجر', icon: Eye, category: 'المتجر' },
      { id: 'store:cart:view', label: 'عرض السلة', description: 'القدرة على عرض سلة التسوق', icon: ShoppingCart, category: 'المتجر' },
      { id: 'store:cart:manage', label: 'إدارة السلة', description: 'القدرة على إضافة/حذف من السلة', icon: Settings, category: 'المتجر' },
      { id: 'store:checkout:access', label: 'الوصول للدفع', description: 'القدرة على الوصول لصفحة الدفع', icon: ShoppingCart, category: 'المتجر' },
    ],
  },
  {
    category: 'المحفظة',
    pageAccess: ['/store/wallet', '/account/recharge'],
    permissions: [
      { id: 'store:wallet:view', label: 'عرض الرصيد', description: 'القدرة على عرض رصيد المحفظة', icon: Eye, category: 'المحفظة' },
      { id: 'store:wallet:recharge', label: 'شحن الرصيد', description: 'القدرة على شحن الرصيد', icon: Settings, category: 'المحفظة' },
    ],
  },
  {
    category: 'الملف الشخصي',
    pageAccess: ['/store/profile', '/account'],
    permissions: [
      { id: 'store:profile:view', label: 'عرض الملف الشخصي', description: 'القدرة على عرض الملف الشخصي', icon: Eye, category: 'الملف الشخصي' },
      { id: 'store:profile:edit', label: 'تعديل الملف الشخصي', description: 'القدرة على تعديل الملف الشخصي', icon: Settings, category: 'الملف الشخصي' },
    ],
  },
  {
    category: 'تطبيق التاجر (الجوال)',
    pageAccess: ['/mobile/merchant'],
    permissions: [
      { id: 'mobile:merchant:access', label: 'الوصول لتطبيق التاجر', description: 'القدرة على الوصول لميزات التاجر في التطبيق', icon: Shield, category: 'تطبيق التاجر' },
      { id: 'mobile:merchant:orders', label: 'إدارة الطلبات (الجوال)', description: 'القدرة على إدارة الطلبات من التطبيق', icon: ShoppingCart, category: 'تطبيق التاجر' },
      { id: 'mobile:merchant:products', label: 'إدارة المنتجات (الجوال)', description: 'القدرة على إدارة المنتجات من التطبيق', icon: Package, category: 'تطبيق التاجر' },
      { id: 'mobile:merchant:customers', label: 'عرض العملاء (الجوال)', description: 'القدرة على عرض العملاء من التطبيق', icon: Users, category: 'تطبيق التاجر' },
      { id: 'mobile:merchant:analytics', label: 'عرض التحليلات (الجوال)', description: 'القدرة على عرض التحليلات من التطبيق', icon: BarChart3, category: 'تطبيق التاجر' },
    ],
  },
];

export default function PermissionsPage() {
  const { user } = useAuth();
  const [staffUser, setStaffUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [employees, setEmployees] = useState<CustomerEmployee[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<CustomerEmployee | null>(null);
  const [editingPermissions, setEditingPermissions] = useState<string[]>([]);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadEmployees = useCallback(async () => {
    try {
      setLoadingEmployees(true);
      const response = await customerEmployeesService.getCustomerEmployees(1, 100);
      setEmployees(response.data || []);
    } catch (error: any) {
      console.error('Failed to load employees:', error);
      
      // Handle specific error cases
      if (error?.response?.status === 400 || error?.status === 400) {
        // This often happens if a shop owner tries to access customer features
        // or if the customer token is invalid for this endpoint
        toast({
          title: 'تنبيه',
          description: 'لا يمكن تحميل الموظفين. قد لا تملك الصلاحيات اللازمة.',
          variant: 'default',
        });
      } else {
        toast({
          title: 'خطأ',
          description: 'فشل تحميل قائمة الموظفين',
          variant: 'destructive',
        });
      }
    } finally {
      setLoadingEmployees(false);
    }
  }, [toast]);

  useEffect(() => {
    const loadUserPermissions = async () => {
      // Only load staff permissions if user is actually a staff member
      // But we deny staff access, so this won't be needed for the display
      // However, keep it for store owners who might want to see permissions
      if (!user) {
        setLoading(false);
        return;
      }

      // If user is STAFF, we already denied access above, but handle gracefully
      if (user.role === 'STAFF') {
        setLoading(false);
        return;
      }

      // For store owners or other roles, we can still try to load staff data if they have staffId
      // But for customers, we should show customer-related permissions instead
      setLoading(false);
    };

    loadUserPermissions();
    
    // Load employees if customer
    const customerToken = localStorage.getItem('customerToken');
    const customerData = localStorage.getItem('customerData');
    const isCustomer = !!(customerToken && customerData);
    if (isCustomer) {
      loadEmployees();
    }
  }, [user, toast, loadEmployees]);
  
  const handleEditPermissions = (employee: CustomerEmployee) => {
    setSelectedEmployee(employee);
    const currentPermissions = employee.permissions || [];
    setEditingPermissions([...currentPermissions]);
    setIsEditDialogOpen(true);
  };

  const togglePermission = (permission: string) => {
    setEditingPermissions(prev => {
      if (prev.includes(permission)) {
        return prev.filter(p => p !== permission);
      } else {
        return [...prev, permission];
      }
    });
  };

  const handleSavePermissions = async () => {
    if (!selectedEmployee) return;

    try {
      setSaving(true);
      await customerEmployeesService.updatePermissions(selectedEmployee.id, editingPermissions);
      toast({
        title: 'نجح',
        description: 'تم تحديث الصلاحيات بنجاح',
      });
      setIsEditDialogOpen(false);
      setSelectedEmployee(null);
      loadEmployees();
    } catch (error: any) {
      console.error('Failed to update permissions:', error);
      toast({
        title: 'خطأ',
        description: error?.message || 'فشل تحديث الصلاحيات',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const filteredEmployees = employees.filter((emp) =>
    emp.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Deny access to employees/staff
  if (user && user.role === 'STAFF') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Access Restricted</h1>
          <p className="text-gray-600">This page is not accessible to store employees.</p>
        </div>
      </div>
    );
  }

  // Check if user is a customer (has customerToken)
  const customerToken = localStorage.getItem('customerToken');
  const customerData = localStorage.getItem('customerData');
  const isCustomer = !!(customerToken && customerData);
  
  // Handle both array of objects and array of strings
  const permissionsArray = staffUser?.staffPermissions || [];
  const permissions = permissionsArray
    .map((p: any) => typeof p === 'string' ? p : p.permission)
    .filter((p: string) => p && !p.startsWith('employee:')) || [];
  
  // Group permissions by category
  const permissionsByCategory: Record<string, string[]> = {};
  permissions.forEach(permission => {
    const info = PERMISSION_INFO[permission];
    if (info) {
      if (!permissionsByCategory[info.category]) {
        permissionsByCategory[info.category] = [];
      }
      permissionsByCategory[info.category].push(permission);
    }
  });

  // Customer permissions (default customer access)
  const customerPermissions = [
    'order:read',
    'customer:read',
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
            <Shield className="w-8 h-8 text-purple-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            {isCustomer ? 'صلاحيات العملاء' : 'My Permissions'}
          </h1>
          <p className="text-lg text-gray-600">
            {isCustomer 
              ? 'عرض ما يمكنك رؤيته والوصول إليه في المتجر'
              : 'View what you can see and access in the store dashboard'
            }
          </p>
        </div>

        {/* Permissions Overview */}
        {isCustomer && permissions.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8">
            <div className="text-center mb-6">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Customer Permissions</h2>
              <p className="text-gray-600 mb-6">
                As a customer, you have access to the following:
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex-shrink-0 mt-1">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <ShoppingCart className="w-5 h-5 text-green-600" />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <h3 className="font-semibold text-gray-900">View Orders</h3>
                  </div>
                  <p className="text-sm text-gray-600">View your order history and track orders</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex-shrink-0 mt-1">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-green-600" />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <h3 className="font-semibold text-gray-900">Manage Profile</h3>
                  </div>
                  <p className="text-sm text-gray-600">Update your personal information and preferences</p>
                </div>
              </div>
            </div>
          </div>
        ) : permissions.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <XCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No Permissions Assigned</h2>
            <p className="text-gray-600">
              You don't have any specific permissions assigned. Please contact your store owner.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(permissionsByCategory).map(([category, categoryPermissions]) => (
              <div key={category} className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-purple-600" />
                  {category}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {categoryPermissions.map(permission => {
                    const info = PERMISSION_INFO[permission];
                    if (!info) return null;
                    const Icon = info.icon;
                    return (
                      <div
                        key={permission}
                        className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        <div className="flex-shrink-0 mt-1">
                          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                            <Icon className="w-5 h-5 text-purple-600" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <h3 className="font-semibold text-gray-900">{info.label}</h3>
                          </div>
                          <p className="text-sm text-gray-600">{info.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Employee Management Section - Only for customers */}
        {isCustomer && (
          <div className="mt-12 bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <Users className="w-6 h-6 text-purple-600" />
                  {isCustomer ? 'إدارة صلاحيات الموظفين' : 'Manage Employee Permissions'}
                </h2>
                <p className="text-gray-600">
                  {isCustomer 
                    ? 'قم بإدارة ما يمكن لموظفيك رؤيته والوصول إليه'
                    : 'Manage what your employees can see and access'
                  }
                </p>
              </div>
            </div>

            <div className="mb-4">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={isCustomer ? 'ابحث عن موظف...' : 'Search employee...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>

            {loadingEmployees ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : filteredEmployees.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchQuery ? (isCustomer ? 'لا توجد نتائج' : 'No results') : (isCustomer ? 'لا يوجد موظفين' : 'No employees')}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredEmployees.map((employee) => {
                  const employeePermissions = employee.permissions || [];
                  
                  return (
                    <div
                      key={employee.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                          <Users className="w-5 h-5 text-purple-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{employee.name || employee.email}</p>
                          <p className="text-sm text-gray-600">{employee.email}</p>
                          {employeePermissions.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {employeePermissions.slice(0, 3).map((perm) => {
                                // Find permission info from store permissions
                                const info = STORE_PERMISSION_GROUPS
                                  .flatMap(g => g.permissions)
                                  .find(p => p.id === perm);
                                return info ? (
                                  <Badge key={perm} variant="secondary" className="text-xs">
                                    {info.label}
                                  </Badge>
                                ) : (
                                  <Badge key={perm} variant="secondary" className="text-xs">
                                    {perm}
                                  </Badge>
                                );
                              })}
                              {employeePermissions.length > 3 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{employeePermissions.length - 3}
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditPermissions(employee)}
                      >
                        <Edit className="h-4 w-4 ml-2" />
                        {isCustomer ? 'تعديل الصلاحيات' : 'Edit Permissions'}
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Edit Permissions Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {isCustomer ? 'تعديل صلاحيات الموظف' : 'Edit Employee Permissions'}
              </DialogTitle>
              <DialogDescription>
                {selectedEmployee?.name || selectedEmployee?.email}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
              {STORE_PERMISSION_GROUPS.map((group) => (
                <div key={group.category} className="space-y-3">
                  <h3 className="font-semibold text-gray-900">{group.category}</h3>
                  <div className="space-y-2">
                    {group.permissions.map((permission) => {
                      const Icon = permission.icon;
                      const isChecked = editingPermissions.includes(permission.id);
                      return (
                        <div
                          key={permission.id}
                          className="flex items-start gap-3 p-3 border rounded-lg hover:bg-gray-50"
                        >
                          <Checkbox
                            checked={isChecked}
                            onCheckedChange={() => togglePermission(permission.id)}
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Icon className="w-4 h-4 text-purple-600" />
                              <Label className="font-medium cursor-pointer">
                                {permission.label}
                              </Label>
                            </div>
                            <p className="text-sm text-gray-600">{permission.description}</p>
                            {group.pageAccess && (
                              <p className="text-xs text-gray-500 mt-1">
                                {isCustomer ? 'الوصول إلى:' : 'Access to:'} {group.pageAccess.join(', ')}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                {isCustomer ? 'إلغاء' : 'Cancel'}
              </Button>
              <Button onClick={handleSavePermissions} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    {isCustomer ? 'جاري الحفظ...' : 'Saving...'}
                  </>
                ) : (
                  isCustomer ? 'حفظ الصلاحيات' : 'Save Permissions'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

