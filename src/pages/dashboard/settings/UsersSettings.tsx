import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Users, Plus, Edit, Trash2, Loader2 } from 'lucide-react';
import { coreApi } from '@/lib/api';

interface User {
  id: string;
  email: string;
  name?: string;
  role: string;
  createdAt: string;
}

const getErrorMessage = (error: unknown): string => {
  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message);
  }
  if (error && typeof error === 'object' && 'response' in error) {
    const response = (error as { response?: { data?: { message?: string } } }).response;
    if (response?.data?.message) {
      return response.data.message;
    }
  }
  return 'حدث خطأ غير متوقع';
};

export default function UsersSettings() {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    role: 'STAFF',
    password: '',
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const resetForm = () => {
    setFormData({
      email: '',
      name: '',
      role: 'STAFF',
      password: '',
    });
    setEditingUser(null);
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await coreApi.get('/user/list', { requireAuth: true });
      
      // Handle different response formats
      let usersData: User[] = [];
      if (response && typeof response === 'object') {
        if (Array.isArray(response)) {
          usersData = response;
        } else if (response.data && Array.isArray(response.data)) {
          usersData = response.data;
        } else if (response.users && Array.isArray(response.users)) {
          usersData = response.users;
        }
      }
      
      // Ensure we only set valid user arrays
      if (Array.isArray(usersData)) {
        setUsers(usersData);
      } else {
        setUsers([]);
      }
    } catch (error: any) {
      console.error('Failed to load users:', error);
      setUsers([]);
      toast({
        title: 'تعذر تحميل المستخدمين',
        description: error?.message || 'حدث خطأ أثناء تحميل المستخدمين. يرجى تحديث الصفحة.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingUser) {
        // Update existing user
        await coreApi.put(`/users/${encodeURIComponent(editingUser.id)}`, {
          email: formData.email,
          name: formData.name,
          role: formData.role,
        }, { requireAuth: true });
        toast({
          title: 'نجح',
          description: 'تم تحديث المستخدم بنجاح',
        });
      } else {
        // Create new user via staff endpoint
        await coreApi.post('/staff', {
          email: formData.email,
          name: formData.name,
          password: formData.password || undefined,
          role: formData.role,
        }, { requireAuth: true });
        toast({
          title: 'نجح',
          description: 'تم إضافة المستخدم بنجاح',
        });
      }
      setIsDialogOpen(false);
      resetForm();
      await loadUsers();
    } catch (error: unknown) {
      toast({
        title: 'تعذر حفظ المستخدم',
        description: getErrorMessage(error) || 'حدث خطأ أثناء حفظ المستخدم. يرجى المحاولة مرة أخرى.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      name: user.name || '',
      role: user.role,
      password: '', // Don't pre-fill password
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المستخدم؟')) return;

    try {
      await coreApi.delete(`/users/${encodeURIComponent(id)}`, { requireAuth: true });
      toast({
        title: 'نجح',
        description: 'تم حذف المستخدم بنجاح',
      });
      await loadUsers();
    } catch (error: unknown) {
      console.error('Failed to delete user:', error);
      toast({
        title: 'تعذر حذف المستخدم',
        description: getErrorMessage(error) || 'حدث خطأ أثناء حذف المستخدم. يرجى المحاولة مرة أخرى.',
        variant: 'destructive',
      });
    }
  };

  const getRoleBadge = (role: string) => {
    const roles: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      SHOP_OWNER: { label: 'صاحب المتجر', variant: 'default' },
      ADMIN: { label: 'مدير', variant: 'secondary' },
      STAFF: { label: 'موظف', variant: 'outline' },
    };
    const roleConfig = roles[role] || { label: role, variant: 'outline' as const };
    return <Badge variant={roleConfig.variant}>{roleConfig.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold mb-2">المستخدمين والصلاحيات</h2>
          <p className="text-gray-600 dark:text-gray-400">
            إدارة المستخدمين وصلاحياتهم
          </p>
        </div>
        <Button onClick={() => {
          resetForm();
          setIsDialogOpen(true);
        }}>
          <Plus className="mr-2 h-4 w-4" />
          إضافة مستخدم
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            قائمة المستخدمين
          </CardTitle>
          <CardDescription>جميع المستخدمين المسجلين في النظام</CardDescription>
        </CardHeader>
        <CardContent>
          {loading && users.length === 0 ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الاسم</TableHead>
                  <TableHead>البريد الإلكتروني</TableHead>
                  <TableHead>الدور</TableHead>
                  <TableHead>تاريخ الإنشاء</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      لا يوجد مستخدمين
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{String(user.name || '-')}</TableCell>
                      <TableCell>{String(user.email || '')}</TableCell>
                      <TableCell>{getRoleBadge(String(user.role || ''))}</TableCell>
                      <TableCell>{user.createdAt ? new Date(user.createdAt).toLocaleDateString('ar-SA') : '-'}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(user)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(user.id)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingUser ? 'تعديل المستخدم' : 'إضافة مستخدم جديد'}</DialogTitle>
            <DialogDescription>
              {editingUser ? 'قم بتعديل معلومات المستخدم' : 'أدخل معلومات المستخدم الجديد'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">الاسم</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="اسم المستخدم"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">البريد الإلكتروني *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="example@email.com"
                  required
                />
              </div>
              {!editingUser && (
                <div className="grid gap-2">
                  <Label htmlFor="password">كلمة المرور {!editingUser && '(اختياري)'}</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder={editingUser ? 'اتركه فارغاً للحفاظ على كلمة المرور الحالية' : 'سيتم إنشاء كلمة مرور تلقائياً إذا تركتها فارغة'}
                  />
                </div>
              )}
              <div className="grid gap-2">
                <Label htmlFor="role">الدور *</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => setFormData({ ...formData, role: value })}
                >
                  <SelectTrigger id="role">
                    <SelectValue placeholder="اختر الدور" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="STAFF">موظف</SelectItem>
                    <SelectItem value="ADMIN">مدير</SelectItem>
                    <SelectItem value="SHOP_OWNER">صاحب المتجر</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false);
                  resetForm();
                }}
              >
                إلغاء
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingUser ? 'حفظ التغييرات' : 'إضافة المستخدم'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

