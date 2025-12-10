import { useEffect, useState, useCallback } from 'react';
import { Users, UserPlus, Search, Shield, Trash2, Edit, Check } from 'lucide-react';
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
import { staffService, StaffUser } from '@/services/staff.service';

const AVAILABLE_PERMISSIONS = [
  { id: 'manage_products', label: 'إدارة المنتجات' },
  { id: 'manage_orders', label: 'إدارة الطلبات' },
  { id: 'manage_customers', label: 'إدارة العملاء' },
  { id: 'manage_settings', label: 'إدارة الإعدادات' },
  { id: 'view_analytics', label: 'عرض التقارير' },
];

export default function EmployeesManager() {
  const { toast } = useToast();
  const [staff, setStaff] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffPermissions, setNewStaffPermissions] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadStaff = useCallback(async () => {
    try {
      setLoading(true);
      const response = await staffService.getStaffUsers();
      setStaff(response.data || []);
    } catch (error) {
      console.error('Failed to load staff:', error);
      toast({
        title: 'خطأ',
        description: 'فشل تحميل بيانات الموظفين',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadStaff();
  }, [loadStaff]);

  const handleAddStaff = async () => {
    if (!newStaffEmail) {
      toast({
        title: 'خطأ',
        description: 'الرجاء إدخال البريد الإلكتروني',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      await staffService.createStaff({
        email: newStaffEmail,
        permissions: newStaffPermissions,
      });
      
      toast({
        title: 'تم بنجاح',
        description: 'تم إضافة الموظف بنجاح',
      });
      
      setIsAddDialogOpen(false);
      setNewStaffEmail('');
      setNewStaffPermissions([]);
      loadStaff();
    } catch (error) {
      console.error('Failed to create staff:', error);
      toast({
        title: 'خطأ',
        description: 'فشل إضافة الموظف',
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
        title: 'خطأ',
        description: 'فشل حذف الموظف',
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
                <Label htmlFor="email">البريد الإلكتروني</Label>
                <Input 
                  id="email" 
                  placeholder="employee@example.com" 
                  value={newStaffEmail}
                  onChange={(e) => setNewStaffEmail(e.target.value)}
                />
              </div>
              
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
    </div>
  );
}
