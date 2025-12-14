import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '@/services/core/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, User, Mail, Calendar, Shield, LogOut, Save } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface CustomerProfile {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatar?: string;
  createdAt?: string;
}

export default function AccountProfile() {
  const [user, setUser] = useState<CustomerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');

  const loadProfile = useCallback(async () => {
    try {
      // Get customer data from localStorage
      const customerData = localStorage.getItem('customerData');
      const customerToken = localStorage.getItem('customerToken');
      
      if (!customerData || !customerToken) {
        navigate('/');
        return;
      }

      const userData = JSON.parse(customerData) as CustomerProfile;
      setUser(userData);
      setFirstName(userData.firstName || '');
      setLastName(userData.lastName || '');
      setPhone(userData.phone || '');
    } catch (error) {
      console.error('Failed to load profile:', error);
      navigate('/');
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  async function handleSave() {
    if (!user) return;

    setIsSaving(true);
    try {
      const customerToken = localStorage.getItem('customerToken');
      
      // Update profile via customer API
      const response = await apiClient.fetch(`${apiClient.authUrl}/customers/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${customerToken}`,
        },
        body: JSON.stringify({
          firstName,
          lastName,
          phone,
        }),
      });

      // Update localStorage with new data
      localStorage.setItem('customerData', JSON.stringify(response));
      setUser(response);

      toast({
        title: 'تم الحفظ',
        description: 'تم تحديث معلومات الملف الشخصي بنجاح',
      });
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast({
        title: 'تعذر تحديث الملف الشخصي',
        description: 'حدث خطأ أثناء تحديث الملف الشخصي. يرجى المحاولة مرة أخرى.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem('customerToken');
    localStorage.removeItem('customerData');
    navigate('/');
    window.location.reload();
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container py-8">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-12 w-12 animate-spin text-indigo-600" />
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const userInitials = `${firstName?.[0] || ''}${lastName?.[0] || user.email[0]}`.toUpperCase();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              الملف الشخصي
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              إدارة معلوماتك الشخصية
            </p>
          </div>
          <Button variant="outline" onClick={handleLogout} className="border-2">
            <LogOut className="ml-2 h-4 w-4" />
            تسجيل الخروج
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Profile Summary Card */}
          <Card className="border-0 shadow-lg lg:col-span-1">
            <CardContent className="p-8 text-center">
              <Avatar className="h-32 w-32 mx-auto mb-6 border-4 border-indigo-100 dark:border-indigo-900">
                <AvatarImage src={user.avatar} alt={user.email} />
                <AvatarFallback className="text-3xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white">
                  {userInitials}
                </AvatarFallback>
              </Avatar>

              <h2 className="text-2xl font-bold mb-2">
                {firstName && lastName ? `${firstName} ${lastName}` : user.email.split('@')[0]}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">{user.email}</p>

              {user.createdAt && (
                <div className="space-y-4 text-right">
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      عضو منذ
                    </span>
                    <span className="font-medium">
                      {new Date(user.createdAt).toLocaleDateString('ar-SA', {
                        year: 'numeric',
                        month: 'long',
                      })}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Profile Edit Form */}
          <Card className="border-0 shadow-lg lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <User className="h-6 w-6" />
                معلومات الحساب
              </CardTitle>
              <CardDescription>تحديث معلوماتك الشخصية</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Email (Read-only) */}
              <div className="grid gap-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  البريد الإلكتروني
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={user.email}
                  disabled
                  className="bg-gray-50 dark:bg-gray-800"
                />
                <p className="text-xs text-gray-500">
                  لا يمكن تغيير البريد الإلكتروني
                </p>
              </div>

              {/* First Name */}
              <div className="grid gap-2">
                <Label htmlFor="firstName">الاسم الأول</Label>
                <Input
                  id="firstName"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="أدخل اسمك الأول"
                />
              </div>

              {/* Last Name */}
              <div className="grid gap-2">
                <Label htmlFor="lastName">اسم العائلة</Label>
                <Input
                  id="lastName"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="أدخل اسم عائلتك"
                />
              </div>

              {/* Phone */}
              <div className="grid gap-2">
                <Label htmlFor="phone">رقم الهاتف</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="05xxxxxxxx"
                  dir="ltr"
                />
              </div>

              {/* Save Button */}
              <div className="pt-4">
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="w-full h-12 text-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="ml-2 h-5 w-5 animate-spin" />
                      جاري الحفظ...
                    </>
                  ) : (
                    <>
                      <Save className="ml-2 h-5 w-5" />
                      حفظ التغييرات
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
