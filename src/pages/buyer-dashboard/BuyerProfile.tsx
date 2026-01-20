import { useState, useEffect } from 'react';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Shield,
  Key,
  Eye,
  EyeOff,
  Camera,
  Save,
  RefreshCw,
  Smartphone,
  Monitor,
  Laptop,
  Clock,
  CheckCircle2,
  AlertCircle,
  LogOut,
  Bell,
  Lock,
  Globe
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface Session {
  id: string;
  device: string;
  deviceType: 'mobile' | 'desktop' | 'tablet';
  browser: string;
  location: string;
  ip: string;
  lastActive: string;
  isCurrent: boolean;
}

interface NotificationSettings {
  email: boolean;
  push: boolean;
  sms: boolean;
  orderUpdates: boolean;
  promotions: boolean;
  newProducts: boolean;
  newsletter: boolean;
}

export default function BuyerProfile() {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [sessionToLogout, setSessionToLogout] = useState<string | null>(null);

  // Profile form
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [language, setLanguage] = useState(i18n.language);

  // Password form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Sessions
  const [sessions, setSessions] = useState<Session[]>([
    {
      id: '1',
      device: 'Windows PC',
      deviceType: 'desktop',
      browser: 'Chrome 120',
      location: 'الرياض، المملكة العربية السعودية',
      ip: '192.168.1.xxx',
      lastActive: new Date().toISOString(),
      isCurrent: true
    },
    {
      id: '2',
      device: 'iPhone 15',
      deviceType: 'mobile',
      browser: 'Safari',
      location: 'الرياض، المملكة العربية السعودية',
      ip: '192.168.1.xxx',
      lastActive: new Date(Date.now() - 86400000).toISOString(),
      isCurrent: false
    }
  ]);

  // Notification settings
  const [notifications, setNotifications] = useState<NotificationSettings>({
    email: true,
    push: true,
    sms: false,
    orderUpdates: true,
    promotions: true,
    newProducts: true,
    newsletter: false
  });

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      // TODO: Call API to update profile
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast({
        title: 'تم الحفظ',
        description: 'تم تحديث معلوماتك الشخصية بنجاح',
      });
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'فشل في حفظ التغييرات',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({
        title: 'خطأ',
        description: 'يرجى ملء جميع الحقول',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: 'خطأ',
        description: 'كلمة المرور الجديدة غير متطابقة',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword.length < 8) {
      toast({
        title: 'خطأ',
        description: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      // TODO: Call API to change password
      await new Promise(resolve => setTimeout(resolve, 1000));
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast({
        title: 'تم التغيير',
        description: 'تم تغيير كلمة المرور بنجاح',
      });
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'فشل في تغيير كلمة المرور',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogoutSession = async (sessionId: string) => {
    try {
      // TODO: Call API to logout session
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      toast({
        title: 'تم',
        description: 'تم تسجيل الخروج من الجلسة',
      });
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'فشل في تسجيل الخروج',
        variant: 'destructive',
      });
    }
    setLogoutConfirmOpen(false);
    setSessionToLogout(null);
  };

  const handleLogoutAllSessions = async () => {
    try {
      // TODO: Call API to logout all sessions
      setSessions(prev => prev.filter(s => s.isCurrent));
      toast({
        title: 'تم',
        description: 'تم تسجيل الخروج من جميع الأجهزة الأخرى',
      });
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'فشل في تسجيل الخروج',
        variant: 'destructive',
      });
    }
  };

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'mobile': return <Smartphone className="h-5 w-5" />;
      case 'tablet': return <Laptop className="h-5 w-5" />;
      default: return <Monitor className="h-5 w-5" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-heading font-bold gradient-text flex items-center gap-3">
          <User className="h-8 w-8 text-primary" />
          الملف الشخصي والإعدادات
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          إدارة معلوماتك الشخصية وإعدادات الأمان
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="bg-muted/50 h-auto p-1 flex-wrap">
          <TabsTrigger value="profile" className="data-[state=active]:bg-background gap-2">
            <User className="h-4 w-4" />
            المعلومات الشخصية
          </TabsTrigger>
          <TabsTrigger value="security" className="data-[state=active]:bg-background gap-2">
            <Shield className="h-4 w-4" />
            الأمان
          </TabsTrigger>
          <TabsTrigger value="sessions" className="data-[state=active]:bg-background gap-2">
            <Monitor className="h-4 w-4" />
            الجلسات
          </TabsTrigger>
          <TabsTrigger value="notifications" className="data-[state=active]:bg-background gap-2">
            <Bell className="h-4 w-4" />
            الإشعارات
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>المعلومات الشخصية</CardTitle>
              <CardDescription>تحديث بياناتك الأساسية</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar */}
              <div className="flex items-center gap-6">
                <div className="relative">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={user?.avatar} />
                    <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                      {name?.charAt(0)?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <Button
                    size="icon"
                    variant="secondary"
                    className="absolute bottom-0 right-0 h-8 w-8 rounded-full"
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                </div>
                <div>
                  <h3 className="font-semibold">{name || 'مستخدم'}</h3>
                  <p className="text-sm text-muted-foreground">{email}</p>
                  <Badge variant="soft-success" className="mt-2">
                    <CheckCircle2 className="h-3 w-3 ml-1" />
                    حساب موثق
                  </Badge>
                </div>
              </div>

              <Separator />

              {/* Form */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>الاسم الكامل</Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="أدخل اسمك"
                  />
                </div>
                <div className="space-y-2">
                  <Label>البريد الإلكتروني</Label>
                  <div className="relative">
                    <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pr-9"
                      placeholder="example@email.com"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>رقم الهاتف</Label>
                  <div className="relative">
                    <Phone className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="pr-9"
                      placeholder="+966 5xxxxxxxx"
                      dir="ltr"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>اللغة</Label>
                  <Select value={language} onValueChange={(val) => {
                    setLanguage(val);
                    i18n.changeLanguage(val);
                  }}>
                    <SelectTrigger>
                      <Globe className="h-4 w-4 ml-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ar">العربية</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>العنوان</Label>
                  <div className="relative">
                    <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="pr-9"
                      placeholder="المدينة، الدولة"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveProfile} disabled={loading} className="gap-2">
                  {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  حفظ التغييرات
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                تغيير كلمة المرور
              </CardTitle>
              <CardDescription>قم بتحديث كلمة المرور لتأمين حسابك</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>كلمة المرور الحالية</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="أدخل كلمة المرور الحالية"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute left-1 top-1/2 -translate-y-1/2 h-8 w-8"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>كلمة المرور الجديدة</Label>
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="أدخل كلمة المرور الجديدة"
                  />
                </div>
                <div className="space-y-2">
                  <Label>تأكيد كلمة المرور</Label>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="أعد إدخال كلمة المرور الجديدة"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={handleChangePassword} disabled={loading}>
                  {loading ? <RefreshCw className="h-4 w-4 animate-spin ml-2" /> : null}
                  تغيير كلمة المرور
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                المصادقة الثنائية
              </CardTitle>
              <CardDescription>إضافة طبقة حماية إضافية لحسابك</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-warning/10">
                    <Shield className="h-6 w-6 text-warning" />
                  </div>
                  <div>
                    <p className="font-medium">المصادقة الثنائية (2FA)</p>
                    <p className="text-sm text-muted-foreground">
                      غير مفعلة - قم بتفعيلها لحماية إضافية
                    </p>
                  </div>
                </div>
                <Button variant="outline">تفعيل</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sessions Tab */}
        <TabsContent value="sessions" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>الأجهزة والجلسات النشطة</CardTitle>
                  <CardDescription>الأجهزة التي سجلت الدخول منها</CardDescription>
                </div>
                <Button variant="outline" onClick={handleLogoutAllSessions}>
                  <LogOut className="h-4 w-4 ml-2" />
                  تسجيل خروج من الكل
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className={`flex items-center justify-between p-4 rounded-lg border ${
                    session.isCurrent ? 'bg-primary/5 border-primary/20' : ''
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-muted">
                      {getDeviceIcon(session.deviceType)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{session.device}</p>
                        {session.isCurrent && (
                          <Badge variant="soft-success" className="text-[10px]">الجلسة الحالية</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{session.browser}</p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span>{session.location}</span>
                        <span>•</span>
                        <Clock className="h-3 w-3" />
                        <span>
                          {session.isCurrent 
                            ? 'نشط الآن'
                            : new Date(session.lastActive).toLocaleString('ar-SA')
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                  {!session.isCurrent && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => {
                        setSessionToLogout(session.id);
                        setLogoutConfirmOpen(true);
                      }}
                    >
                      <LogOut className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>قنوات الإشعارات</CardTitle>
              <CardDescription>اختر كيف تريد تلقي الإشعارات</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">البريد الإلكتروني</p>
                    <p className="text-sm text-muted-foreground">تلقي الإشعارات عبر البريد</p>
                  </div>
                </div>
                <Switch
                  checked={notifications.email}
                  onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, email: checked }))}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <Bell className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">إشعارات المتصفح</p>
                    <p className="text-sm text-muted-foreground">إشعارات فورية في المتصفح</p>
                  </div>
                </div>
                <Switch
                  checked={notifications.push}
                  onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, push: checked }))}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">الرسائل النصية</p>
                    <p className="text-sm text-muted-foreground">تلقي SMS للتحديثات المهمة</p>
                  </div>
                </div>
                <Switch
                  checked={notifications.sms}
                  onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, sms: checked }))}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>تفضيلات الإشعارات</CardTitle>
              <CardDescription>اختر أنواع الإشعارات التي تريد تلقيها</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium">تحديثات الطلبات</p>
                  <p className="text-sm text-muted-foreground">إشعارات عند تغير حالة طلباتك</p>
                </div>
                <Switch
                  checked={notifications.orderUpdates}
                  onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, orderUpdates: checked }))}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium">العروض والخصومات</p>
                  <p className="text-sm text-muted-foreground">تنبيهات عن العروض الجديدة</p>
                </div>
                <Switch
                  checked={notifications.promotions}
                  onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, promotions: checked }))}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium">منتجات جديدة</p>
                  <p className="text-sm text-muted-foreground">إشعارات عند إضافة منتجات جديدة</p>
                </div>
                <Switch
                  checked={notifications.newProducts}
                  onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, newProducts: checked }))}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium">النشرة البريدية</p>
                  <p className="text-sm text-muted-foreground">تلقي آخر الأخبار والمقالات</p>
                </div>
                <Switch
                  checked={notifications.newsletter}
                  onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, newsletter: checked }))}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Logout Session Confirmation */}
      <AlertDialog open={logoutConfirmOpen} onOpenChange={setLogoutConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تسجيل الخروج</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من تسجيل الخروج من هذا الجهاز؟
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => sessionToLogout && handleLogoutSession(sessionToLogout)}
            >
              تسجيل الخروج
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

