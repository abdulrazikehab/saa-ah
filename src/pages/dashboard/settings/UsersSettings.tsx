import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Users, Plus, Edit, Trash2 } from 'lucide-react';
import { coreApi } from '@/lib/api';

interface User {
  id: string;
  email: string;
  name?: string;
  role: string;
  createdAt: string;
}

export default function UsersSettings() {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await coreApi.get('/users').catch(() => []);
      setUsers(Array.isArray(response) ? response : []);
    } catch (error: any) {
      toast({
        title: 'تعذر تحميل المستخدمين',
        description: 'حدث خطأ أثناء تحميل المستخدمين. يرجى تحديث الصفحة.',
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
        <Button>
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
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.name || '-'}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{getRoleBadge(user.role)}</TableCell>
                  <TableCell>{new Date(user.createdAt).toLocaleDateString('ar-SA')}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

