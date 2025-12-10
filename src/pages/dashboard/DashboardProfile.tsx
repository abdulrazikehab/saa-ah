import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, User, Mail } from 'lucide-react';
import { authService } from '@/services/auth.service';
import { coreApi } from '@/lib/api';

export default function DashboardProfile() {
  const { user, refreshUser, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    avatar: '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        email: user.email || '',
        avatar: user.avatar || '',
      });
    }
  }, [user]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show preview immediately
    const previewUrl = URL.createObjectURL(file);
    setFormData(prev => ({ ...prev, avatar: previewUrl }));

    // Upload
    const formDataUpload = new FormData();
    formDataUpload.append('files', file);

    try {
      const res = await coreApi.post('/upload/images', formDataUpload, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        requireAuth: true,
      });
      
      if (res.files && res.files.length > 0) {
          const uploadedUrl = res.files[0].secureUrl || res.files[0].url;
          setFormData(prev => ({ ...prev, avatar: uploadedUrl }));
          toast({ title: 'تم رفع الصورة بنجاح' });
      }
    } catch (error) {
      console.error('Upload failed', error);
      toast({ title: 'فشل رفع الصورة', description: 'يرجى المحاولة مرة أخرى', variant: 'destructive' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authService.updateProfile(formData);
      await refreshUser(); // Refresh context
      toast({
        title: 'تم التحديث',
        description: 'تم تحديث الملف الشخصي بنجاح',
      });
    } catch (error) {
      console.error(error);
      toast({
        title: 'خطأ',
        description: 'فشل تحديث الملف الشخصي',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">الملف الشخصي</h1>
        <p className="text-muted-foreground mt-2">إدارة معلومات حسابك الشخصي</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>المعلومات الأساسية</CardTitle>
          <CardDescription>قم بتحديث اسمك وصورتك الشخصية</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Avatar Upload */}
            <div className="flex items-center gap-4">
              <div className="relative h-20 w-20 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden bg-muted">
                {formData.avatar ? (
                  <img src={formData.avatar} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  <User className="h-8 w-8 text-muted-foreground" />
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  onChange={handleFileChange}
                />
              </div>
              <div>
                <Label>الصورة الشخصية</Label>
                <p className="text-xs text-muted-foreground mt-1">
                  انقر لتغيير الصورة. يفضل استخدام صورة مربعة.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <div className="relative">
                <Mail className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  disabled
                  className="pr-10 bg-muted"
                />
              </div>
              <p className="text-xs text-muted-foreground">لا يمكن تغيير البريد الإلكتروني</p>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                حفظ التغييرات
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
