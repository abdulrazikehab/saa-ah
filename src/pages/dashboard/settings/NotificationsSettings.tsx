import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Save, Bell, Mail, MessageSquare } from 'lucide-react';
import { coreApi } from '@/lib/api';

export default function NotificationsSettings() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    emailNotifications: true,
    orderNotifications: true,
    customerNotifications: true,
    inventoryNotifications: true,
    marketingNotifications: false,
    pushNotifications: false,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await coreApi.get('/notifications/settings').catch(() => null);
      if (response) {
        setSettings(response);
      }
    } catch (error: any) {
      // Settings might not exist yet
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await coreApi.put('/notifications/settings', settings);
      toast({
        title: 'تم الحفظ',
        description: 'تم حفظ إعدادات الإشعارات بنجاح',
      });
    } catch (error: any) {
      toast({
        title: 'تعذر حفظ الإعدادات',
        description: 'حدث خطأ أثناء حفظ الإعدادات. يرجى المحاولة مرة أخرى.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">إعدادات الإشعارات</h2>
        <p className="text-gray-600 dark:text-gray-400">
          إدارة تفضيلات الإشعارات
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            الإشعارات البريدية
          </CardTitle>
          <CardDescription>تحديد أنواع الإشعارات التي تريد استلامها عبر البريد الإلكتروني</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>تفعيل الإشعارات البريدية</Label>
              <p className="text-sm text-gray-500">استلام جميع الإشعارات عبر البريد الإلكتروني</p>
            </div>
            <Switch
              checked={settings.emailNotifications}
              onCheckedChange={(checked) => setSettings({ ...settings, emailNotifications: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>إشعارات الطلبات</Label>
              <p className="text-sm text-gray-500">إشعارات عند إنشاء أو تحديث الطلبات</p>
            </div>
            <Switch
              checked={settings.orderNotifications}
              onCheckedChange={(checked) => setSettings({ ...settings, orderNotifications: checked })}
              disabled={!settings.emailNotifications}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>إشعارات العملاء</Label>
              <p className="text-sm text-gray-500">إشعارات عند تسجيل عملاء جدد</p>
            </div>
            <Switch
              checked={settings.customerNotifications}
              onCheckedChange={(checked) => setSettings({ ...settings, customerNotifications: checked })}
              disabled={!settings.emailNotifications}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>إشعارات المخزون</Label>
              <p className="text-sm text-gray-500">إشعارات عند انخفاض المخزون</p>
            </div>
            <Switch
              checked={settings.inventoryNotifications}
              onCheckedChange={(checked) => setSettings({ ...settings, inventoryNotifications: checked })}
              disabled={!settings.emailNotifications}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>إشعارات التسويق</Label>
              <p className="text-sm text-gray-500">إشعارات عن العروض والترويجات</p>
            </div>
            <Switch
              checked={settings.marketingNotifications}
              onCheckedChange={(checked) => setSettings({ ...settings, marketingNotifications: checked })}
              disabled={!settings.emailNotifications}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            الإشعارات الفورية
          </CardTitle>
          <CardDescription>إشعارات فورية في المتصفح</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>الإشعارات الفورية</Label>
              <p className="text-sm text-gray-500">إشعارات فورية في المتصفح</p>
            </div>
            <Switch
              checked={settings.pushNotifications}
              onCheckedChange={(checked) => setSettings({ ...settings, pushNotifications: checked })}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={loading}>
          <Save className="mr-2 h-4 w-4" />
          {loading ? 'جاري الحفظ...' : 'حفظ'}
        </Button>
      </div>
    </div>
  );
}

