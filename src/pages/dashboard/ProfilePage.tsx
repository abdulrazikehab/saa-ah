import { useState, useEffect, useCallback } from 'react';
import { User, Mail, Phone, Building, Upload, Camera, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { coreApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';

interface ProfileData {
  name: string;
  email: string;
  phone: string;
  storeName: string;
  storeNameAr: string;
  storeDescription: string;
  storeDescriptionAr: string;
  logo: string;
  avatar: string;
  address: string;
  city: string;
  country: string;
  postalCode: string;
}

export default function ProfilePage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData>({
    name: '',
    email: '',
    phone: '',
    storeName: '',
    storeNameAr: '',
    storeDescription: '',
    storeDescriptionAr: '',
    logo: '',
    avatar: '',
    address: '',
    city: '',
    country: '',
    postalCode: '',
  });

  const [logoPreview, setLogoPreview] = useState<string>('');
  const [avatarPreview, setAvatarPreview] = useState<string>('');

  const loadProfile = useCallback(async () => {
    try {
      const data = await coreApi.get('/profile');
      setProfileData(data.profile || profileData);
      setLogoPreview(data.profile?.logo || '');
      setAvatarPreview(data.profile?.avatar || '');
    } catch (error) {
      console.error('Failed to load profile:', error);
      toast({
        title: 'خطأ',
        description: 'فشل تحميل الملف الشخصي',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setLogoPreview(result);
        setProfileData({ ...profileData, logo: result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setAvatarPreview(result);
        setProfileData({ ...profileData, avatar: result });
      };
      reader.readAsDataURL(file);
    }
  };

  const saveProfile = async () => {
    try {
      setSaving(true);
      await coreApi.post('/profile', profileData);
      toast({
        title: 'نجح',
        description: 'تم حفظ الملف الشخصي بنجاح',
      });
      // Reload to update header
      window.location.reload();
    } catch (error) {
      console.error('Failed to save profile:', error);
      toast({
        title: 'خطأ',
        description: 'فشل حفظ الملف الشخصي',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin w-12 h-12 text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">الملف الشخصي</h1>
          <p className="text-sm text-gray-500 mt-1">إدارة معلوماتك الشخصية ومتجرك</p>
        </div>
        <Button onClick={saveProfile} disabled={saving} size="lg" className="gap-2">
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              جاري الحفظ...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              حفظ التغييرات
            </>
          )}
        </Button>
      </div>

      {/* Profile Header Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
            {/* Avatar Upload */}
            <div className="flex flex-col items-center gap-3">
              <Avatar className="h-32 w-32">
                <AvatarImage src={avatarPreview} />
                <AvatarFallback className="text-3xl">
                  {profileData.name.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                <input
                  type="file"
                  id="avatar-upload"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('avatar-upload')?.click()}
                >
                  <Camera className="h-4 w-4 ml-2" />
                  تغيير الصورة
                </Button>
              </div>
            </div>

            {/* Store Logo Upload */}
            <div className="flex flex-col items-center gap-3">
              <div className="h-32 w-32 border-2 border-dashed rounded-lg flex items-center justify-center bg-gray-50 dark:bg-gray-800">
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo" className="h-full w-full object-contain p-2" />
                ) : (
                  <Building className="h-12 w-12 text-gray-400" />
                )}
              </div>
              <div>
                <input
                  type="file"
                  id="logo-upload"
                  accept="image/*"
                  className="hidden"
                  onChange={handleLogoUpload}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('logo-upload')?.click()}
                >
                  <Upload className="h-4 w-4 ml-2" />
                  رفع الشعار
                </Button>
              </div>
            </div>

            {/* Quick Info */}
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-1">{profileData.storeNameAr || 'اسم المتجر'}</h2>
              <p className="text-gray-500 mb-3">{profileData.email}</p>
              <div className="flex flex-wrap gap-2">
                <div className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                  {profileData.country || 'السعودية'}
                </div>
                <div className="px-3 py-1 bg-green-500/10 text-green-700 rounded-full text-sm">
                  نشط
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="personal" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="personal">المعلومات الشخصية</TabsTrigger>
          <TabsTrigger value="store">معلومات المتجر</TabsTrigger>
        </TabsList>

        {/* Personal Info Tab */}
        <TabsContent value="personal" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>المعلومات الشخصية</CardTitle>
              <CardDescription>قم بتحديث معلوماتك الشخصية</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>الاسم الكامل</Label>
                  <div className="relative">
                    <User className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      value={profileData.name}
                      onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                      placeholder="أحمد محمد"
                      className="pr-10"
                    />
                  </div>
                </div>

                <div>
                  <Label>البريد الإلكتروني</Label>
                  <div className="relative">
                    <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                      placeholder="email@example.com"
                      className="pr-10"
                    />
                  </div>
                </div>

                <div>
                  <Label>رقم الهاتف</Label>
                  <div className="relative">
                    <Phone className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                      placeholder="+966 50 123 4567"
                      className="pr-10"
                    />
                  </div>
                </div>

                <div>
                  <Label>المدينة</Label>
                  <Input
                    value={profileData.city}
                    onChange={(e) => setProfileData({ ...profileData, city: e.target.value })}
                    placeholder="الرياض"
                  />
                </div>

                <div>
                  <Label>الدولة</Label>
                  <Input
                    value={profileData.country}
                    onChange={(e) => setProfileData({ ...profileData, country: e.target.value })}
                    placeholder="السعودية"
                  />
                </div>

                <div>
                  <Label>الرمز البريدي</Label>
                  <Input
                    value={profileData.postalCode}
                    onChange={(e) => setProfileData({ ...profileData, postalCode: e.target.value })}
                    placeholder="12345"
                  />
                </div>
              </div>

              <div>
                <Label>العنوان</Label>
                <Textarea
                  value={profileData.address}
                  onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                  placeholder="العنوان الكامل"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Store Info Tab */}
        <TabsContent value="store" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>معلومات المتجر</CardTitle>
              <CardDescription>قم بتحديث معلومات متجرك</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>اسم المتجر (العربية)</Label>
                  <Input
                    value={profileData.storeNameAr}
                    onChange={(e) => setProfileData({ ...profileData, storeNameAr: e.target.value })}
                    placeholder="متجر الألعاب"
                  />
                </div>

                <div>
                  <Label>Store Name (English)</Label>
                  <Input
                    value={profileData.storeName}
                    onChange={(e) => setProfileData({ ...profileData, storeName: e.target.value })}
                    placeholder="Gaming Store"
                  />
                </div>
              </div>

              <div>
                <Label>وصف المتجر (العربية)</Label>
                <Textarea
                  value={profileData.storeDescriptionAr}
                  onChange={(e) => setProfileData({ ...profileData, storeDescriptionAr: e.target.value })}
                  placeholder="متجر متخصص في بيع بطاقات الألعاب الرقمية"
                  rows={4}
                />
              </div>

              <div>
                <Label>Store Description (English)</Label>
                <Textarea
                  value={profileData.storeDescription}
                  onChange={(e) => setProfileData({ ...profileData, storeDescription: e.target.value })}
                  placeholder="Specialized store for digital gaming cards"
                  rows={4}
                />
              </div>

              <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-lg">
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">معاينة الشعار</h4>
                <div className="flex items-center gap-4">
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo Preview" className="h-16 w-16 object-contain" />
                  ) : (
                    <div className="h-16 w-16 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
                      <Building className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                  <div>
                    <p className="font-semibold">{profileData.storeNameAr || 'اسم المتجر'}</p>
                    <p className="text-sm text-gray-500">{profileData.storeName || 'Store Name'}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save Button (Sticky) */}
      <div className="flex justify-end sticky bottom-0 bg-background py-4 border-t">
        <Button onClick={saveProfile} disabled={saving} size="lg" className="gap-2">
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              جاري الحفظ...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              حفظ التغييرات
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
