import { useEffect, useState, useCallback } from 'react';
import { Shield, Users, Search, Loader2, CheckCircle, Edit, Package, ShoppingCart, BarChart3, Settings, Eye, XCircle, UserCheck, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { staffService, StaffUser } from '@/services/staff.service';
import { apiClient } from '@/services/core/api-client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface PermissionInfo {
  id: string;
  label: string;
  description: string;
  icon: any;
  category: string;
}

const PERMISSION_GROUPS: { category: string; permissions: PermissionInfo[]; dashboardAccess?: string[] }[] = [
  {
    category: 'المنتجات',
    dashboardAccess: ['/dashboard/products', '/dashboard/categories', '/dashboard/prices'],
    permissions: [
      { id: 'product:create', label: 'إنشاء المنتجات', description: 'القدرة على إنشاء منتجات جديدة - الوصول إلى صفحة المنتجات', icon: Package, category: 'المنتجات' },
      { id: 'product:read', label: 'عرض المنتجات', description: 'القدرة على عرض معلومات المنتجات - الوصول إلى قائمة المنتجات', icon: Eye, category: 'المنتجات' },
      { id: 'product:update', label: 'تعديل المنتجات', description: 'القدرة على تعديل المنتجات الموجودة - تعديل بيانات المنتجات', icon: Settings, category: 'المنتجات' },
      { id: 'product:delete', label: 'حذف المنتجات', description: 'القدرة على حذف المنتجات - إزالة المنتجات من المتجر', icon: XCircle, category: 'المنتجات' },
      { id: 'product:manage', label: 'إدارة المنتجات', description: 'صلاحيات كاملة لإدارة المنتجات - الوصول الكامل لجميع صفحات المنتجات', icon: Package, category: 'المنتجات' },
    ],
  },
  {
    category: 'الطلبات',
    dashboardAccess: ['/dashboard/orders'],
    permissions: [
      { id: 'order:create', label: 'إنشاء الطلبات', description: 'القدرة على إنشاء طلبات جديدة - إضافة طلبات يدوياً', icon: ShoppingCart, category: 'الطلبات' },
      { id: 'order:read', label: 'عرض الطلبات', description: 'القدرة على عرض معلومات الطلبات - الوصول إلى صفحة الطلبات', icon: Eye, category: 'الطلبات' },
      { id: 'order:update', label: 'تحديث الطلبات', description: 'القدرة على تعديل الطلبات الموجودة - تحديث حالة الطلبات', icon: Settings, category: 'الطلبات' },
      { id: 'order:delete', label: 'حذف الطلبات', description: 'القدرة على حذف الطلبات - إلغاء أو حذف الطلبات', icon: XCircle, category: 'الطلبات' },
      { id: 'order:manage', label: 'إدارة الطلبات', description: 'صلاحيات كاملة لإدارة الطلبات - الوصول الكامل لصفحة الطلبات', icon: ShoppingCart, category: 'الطلبات' },
    ],
  },
  {
    category: 'العملاء',
    dashboardAccess: ['/dashboard/customers'],
    permissions: [
      { id: 'customer:create', label: 'إنشاء العملاء', description: 'القدرة على إنشاء حسابات عملاء جديدة - إضافة عملاء جدد', icon: Users, category: 'العملاء' },
      { id: 'customer:read', label: 'عرض العملاء', description: 'القدرة على عرض معلومات العملاء - الوصول إلى صفحة العملاء', icon: Eye, category: 'العملاء' },
      { id: 'customer:update', label: 'تحديث العملاء', description: 'القدرة على تعديل بيانات العملاء - تحديث معلومات العملاء', icon: Settings, category: 'العملاء' },
      { id: 'customer:delete', label: 'حذف العملاء', description: 'القدرة على حذف العملاء - إزالة حسابات العملاء', icon: XCircle, category: 'العملاء' },
      { id: 'customer:manage', label: 'إدارة العملاء', description: 'صلاحيات كاملة لإدارة العملاء - الوصول الكامل لصفحة العملاء', icon: Users, category: 'العملاء' },
    ],
  },
  {
    category: 'المخزون',
    dashboardAccess: ['/dashboard/products'],
    permissions: [
      { id: 'inventory:read', label: 'عرض المخزون', description: 'القدرة على عرض مستويات المخزون - عرض كميات المخزون', icon: Eye, category: 'المخزون' },
      { id: 'inventory:update', label: 'تحديث المخزون', description: 'القدرة على تعديل مستويات المخزون - تحديث كميات المنتجات', icon: Settings, category: 'المخزون' },
      { id: 'inventory:manage', label: 'إدارة المخزون', description: 'صلاحيات كاملة للتحكم في المخزون - إدارة كاملة للمخزون', icon: Package, category: 'المخزون' },
    ],
  },
  {
    category: 'التحليلات',
    dashboardAccess: ['/dashboard/reports'],
    permissions: [
      { id: 'analytics:read', label: 'عرض التحليلات', description: 'القدرة على عرض التقارير والتحليلات - الوصول إلى صفحة التقارير', icon: BarChart3, category: 'التحليلات' },
      { id: 'analytics:manage', label: 'إدارة التحليلات', description: 'صلاحيات كاملة للوصول إلى التحليلات - الوصول الكامل للتقارير', icon: BarChart3, category: 'التحليلات' },
    ],
  },
  {
    category: 'الإعدادات',
    dashboardAccess: ['/dashboard/settings'],
    permissions: [
      { id: 'settings:read', label: 'عرض الإعدادات', description: 'القدرة على عرض إعدادات المتجر - عرض صفحة الإعدادات', icon: Eye, category: 'الإعدادات' },
      { id: 'settings:update', label: 'تحديث الإعدادات', description: 'القدرة على تعديل إعدادات المتجر - تعديل إعدادات المتجر', icon: Settings, category: 'الإعدادات' },
    ],
  },
];

export default function PermissionsManager() {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [staff, setStaff] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStaff, setSelectedStaff] = useState<StaffUser | null>(null);
  const [editingPermissions, setEditingPermissions] = useState<string[]>([]);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // If user is STAFF, show read-only view of their own permissions
  const isStaffView = user && user.role === 'STAFF';

  const loadStaff = useCallback(async () => {
    try {
      setLoading(true);
      
      // If STAFF user, show only their own permissions
      if (isStaffView && user) {
        const response = await staffService.getStaffUser(user.id);
        // Normalize the response to match StaffUser format
        const normalizedStaff = {
          id: response.id,
          email: response.email,
          name: response.name,
          phone: response.phone,
          role: response.role,
          createdAt: response.createdAt,
          updatedAt: response.updatedAt,
          staffPermissions: response.staffPermissions || [],
        };
        setStaff([normalizedStaff]);
        setLoading(false);
        return;
      }
      
      // SHOP_OWNER and SUPER_ADMIN can see all staff
      console.log('Loading staff users...');
      const response = await staffService.getStaffUsers(1, 100);
      console.log('Staff users response:', response);
      
      // Ensure we have data array
      const staffData = response?.data || response || [];
      console.log('Staff data:', staffData);
      
      // Normalize the data structure
      const normalizedStaff = Array.isArray(staffData) ? staffData.map((user: any) => ({
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        staffPermissions: user.staffPermissions || [],
      })) : [];
      
      console.log('Normalized staff:', normalizedStaff);
      setStaff(normalizedStaff);
    } catch (error: any) {
      console.error('Failed to load staff:', error);
      toast({
        title: 'خطأ',
        description: error?.message || 'فشل تحميل بيانات الموظفين',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast, isStaffView, user]);

  useEffect(() => {
    loadStaff();
  }, [loadStaff]);

  const handleEditPermissions = (staffUser: StaffUser) => {
    setSelectedStaff(staffUser);
    // Extract actual permissions (filter out metadata permissions)
    const permissions = staffUser.staffPermissions || [];
    const actualPermissions = permissions
      .map((p: any) => typeof p === 'string' ? p : p.permission)
      .filter((p: string) => p && !p.startsWith('employee:')) || [];
    console.log('Editing permissions for:', staffUser.email, actualPermissions);
    setEditingPermissions(actualPermissions);
    setIsEditDialogOpen(true);
  };

  const togglePermission = (permissionId: string) => {
    if (editingPermissions.includes(permissionId)) {
      setEditingPermissions(editingPermissions.filter(p => p !== permissionId));
    } else {
      setEditingPermissions([...editingPermissions, permissionId]);
    }
  };

  const handleSavePermissions = async () => {
    if (!selectedStaff) return;

    // Check permission before saving - only owners/admins can save
    if (isStaffView || (user && user.role !== 'SHOP_OWNER' && user.role !== 'SUPER_ADMIN')) {
      toast({
        variant: 'destructive',
        title: 'غير مصرح',
        description: 'فقط أصحاب المتاجر والمدراء يمكنهم تعديل الصلاحيات. إذا كنت تحتاج صلاحيات إضافية، يرجى التحدث مع مدير المتجر.',
      });
      return;
    }

    try {
      setSaving(true);
      console.log('Saving permissions for staff:', selectedStaff.id, editingPermissions);
      
      const result = await staffService.updatePermissions(selectedStaff.id, editingPermissions);
      console.log('Permissions update result:', result);
      
      toast({
        title: 'نجح',
        description: 'تم تحديث الصلاحيات بنجاح',
      });

      // Reload staff to get updated permissions
      await loadStaff();
      setIsEditDialogOpen(false);
      setSelectedStaff(null);
      setEditingPermissions([]);
    } catch (error: any) {
      console.error('Failed to save permissions:', error);
      toast({
        title: 'خطأ',
        description: error?.message || 'فشل تحديث الصلاحيات',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const filteredStaff = staff.filter(user =>
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getPermissionLabel = (permissionId: string): string => {
    for (const group of PERMISSION_GROUPS) {
      const perm = group.permissions.find(p => p.id === permissionId);
      if (perm) return perm.label;
    }
    return permissionId;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6 text-purple-600" />
            {isStaffView ? 'صلاحياتي' : 'إدارة الصلاحيات'}
          </h2>
          <p className="text-muted-foreground mt-1">
            {isStaffView 
              ? 'عرض الصلاحيات الممنوحة لك - إذا كنت تحتاج صلاحيات إضافية، يرجى التحدث مع مدير المتجر'
              : 'تحكم في ما يمكن للموظفين رؤيته والوصول إليه في لوحة التحكم'
            }
          </p>
        </div>
        <Button
          variant="outline"
          onClick={loadStaff}
          disabled={loading}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          تحديث
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="البحث بالبريد الإلكتروني..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredStaff.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold mb-2">لا يوجد موظفين</h3>
              <p className="text-gray-500">قم بإضافة موظفين أولاً من تبويب الموظفين</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{isStaffView ? 'أنت' : 'الموظف'}</TableHead>
                  <TableHead>الصلاحيات {isStaffView ? 'الممنوحة لك' : 'الحالية'}</TableHead>
                  {!isStaffView && <TableHead className="w-[150px]">إجراءات</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStaff.map((user) => {
                  // Handle both array of objects and array of strings
                  const permissions = user.staffPermissions || [];
                  const actualPermissions = permissions
                    .map((p: any) => typeof p === 'string' ? p : p.permission)
                    .filter((p: string) => p && !p.startsWith('employee:')) || [];
                  
                  return (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                            <UserCheck className="w-5 h-5 text-purple-600" />
                          </div>
                          <div>
                            <p className="font-medium">{user.email}</p>
                            {user.name && (
                              <p className="text-sm text-gray-500">{user.name}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          {actualPermissions.length > 0 ? (
                            actualPermissions.map((permission: string, idx: number) => (
                              <Badge key={`${permission}-${idx}`} variant="secondary" className="text-xs">
                                {getPermissionLabel(permission)}
                              </Badge>
                            ))
                          ) : (
                            <div className="space-y-1">
                              <span className="text-muted-foreground text-sm block">لا توجد صلاحيات ممنوحة</span>
                              {isStaffView && (
                                <span className="text-xs text-orange-600 dark:text-orange-400 block">
                                  يرجى التواصل مع مدير المتجر للحصول على الصلاحيات اللازمة
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      {!isStaffView && (
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditPermissions(user)}
                            className="gap-2"
                          >
                            <Edit className="h-4 w-4" />
                            تعديل الصلاحيات
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Permissions Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              تعديل صلاحيات {selectedStaff?.email}
            </DialogTitle>
            <DialogDescription>
              اختر ما يمكن لهذا الموظف رؤيته والوصول إليه
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {PERMISSION_GROUPS.map((group) => (
              <div key={group.category} className="border rounded-lg p-4">
                <div className="mb-4">
                  <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                    <Shield className="h-5 w-5 text-purple-600" />
                    {group.category}
                  </h3>
                  {group.dashboardAccess && group.dashboardAccess.length > 0 && (
                    <div className="text-xs text-gray-500 mb-3 flex items-center gap-2 flex-wrap">
                      <span className="font-medium">صفحات لوحة التحكم:</span>
                      {group.dashboardAccess.map((path, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {path}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {group.permissions.map((permission) => {
                    const isChecked = editingPermissions.includes(permission.id);
                    const Icon = permission.icon;
                    return (
                      <label
                        key={permission.id}
                        className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                          isChecked
                            ? 'bg-purple-50 border-purple-500 dark:bg-purple-900/20'
                            : 'bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700 hover:border-gray-300'
                        }`}
                      >
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={() => togglePermission(permission.id)}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Icon className="w-4 h-4 text-purple-600" />
                            <span className="font-medium text-sm">{permission.label}</span>
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-400">{permission.description}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleSavePermissions} disabled={saving} className="gap-2">
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  جاري الحفظ...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  حفظ الصلاحيات
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

