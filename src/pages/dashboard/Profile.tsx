import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Mail, Building2, Globe, Save, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { coreApi } from '@/lib/api';

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    tenantName: '',
    subdomain: '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        tenantName: user.tenantName || '',
        subdomain: user.tenantSubdomain || '',
      });
    }
  }, [user]);

  const handleSave = async () => {
    setLoading(true);
    try {
      // Update user profile via API
      await coreApi.put('/auth/profile', {
        name: formData.name,
      });

      toast({
        title: 'تم الحفظ',
        description: 'تم تحديث الملف الشخصي بنجاح',
      });

      // Refresh user data
      await refreshUser();
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast({
        title: 'تعذر تحديث الملف الشخصي',
        description: 'حدث خطأ أثناء تحديث الملف الشخصي. يرجى المحاولة مرة أخرى.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          الملف الشخصي
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2 text-lg">
          إدارة معلومات حسابك الشخصي
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Profile Information */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              المعلومات الشخصية
            </CardTitle>
            <CardDescription>
              قم بتحديث معلومات حسابك الشخصي
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Avatar */}
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={user?.avatar || user?.tenantLogo || undefined} alt={user?.name} />
                <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-blue-600 text-white text-2xl">
                  {user?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                <Button variant="outline" size="sm">
                  <Upload className="ml-2 h-4 w-4" />
                  تغيير الصورة
                </Button>
                <p className="text-xs text-gray-500 mt-2">
                  JPG, PNG أو GIF (حد أقصى 2MB)
                </p>
              </div>
            </div>

            {/* Name */}
            <div>
              <Label htmlFor="name">الاسم</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="أدخل اسمك"
              />
            </div>

            {/* Email */}
            <div>
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <div className="relative">
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  disabled
                  className="pr-10 bg-gray-50 dark:bg-gray-900"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                لا يمكن تغيير البريد الإلكتروني
              </p>
            </div>

            <Button onClick={handleSave} disabled={loading} className="w-full">
              <Save className="ml-2 h-4 w-4" />
              {loading ? 'جاري الحفظ...' : 'حفظ التغييرات'}
            </Button>
          </CardContent>
        </Card>

        {/* Store Information */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              معلومات المتجر
            </CardTitle>
            <CardDescription>
              معلومات متجرك الإلكتروني
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Store Name */}
            <div>
              <Label htmlFor="tenantName">اسم المتجر</Label>
              <Input
                id="tenantName"
                value={formData.tenantName}
                disabled
                className="bg-gray-50 dark:bg-gray-900"
              />
            </div>

            {/* Subdomain */}
            <div>
              <Label htmlFor="subdomain">النطاق الفرعي</Label>
              <div className="relative">
                <Globe className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="subdomain"
                  value={formData.subdomain}
                  disabled
                  className="pr-10 bg-gray-50 dark:bg-gray-900"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                رابط متجرك: {formData.subdomain}.localhost:8080
              </p>
            </div>

            {/* Store URL */}
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                رابط متجرك
              </p>
              <a
                href={`http://${formData.subdomain}.localhost:8080`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline break-all"
              >
                http://{formData.subdomain}.localhost:8080
              </a>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <strong>معرف المستأجر:</strong> {user?.tenantId || 'N/A'}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                <strong>الدور:</strong> {user?.role || 'N/A'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
