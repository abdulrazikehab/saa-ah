import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Save, ShieldCheck, UserCheck, FileCheck } from 'lucide-react';
import { coreApi } from '@/lib/api';

export default function KycSettings() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    kycEnabled: false,
    requireKycForOrders: false,
    requireKycForLargePayments: true,
    kycThreshold: 10000,
    requireIdVerification: false,
    requireAddressVerification: false,
    autoApproveKyc: false,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await coreApi.get('/kyc/settings').catch(() => null);
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
      await coreApi.put('/kyc/settings', settings);
      toast({
        title: 'تم الحفظ',
        description: 'تم حفظ إعدادات التحقق من الهوية بنجاح',
      });
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error?.message || 'فشل حفظ الإعدادات',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">التحقق من الهوية (KYC)</h2>
        <p className="text-gray-600 dark:text-gray-400">
          إعدادات التحقق من هوية العملاء
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            الإعدادات العامة
          </CardTitle>
          <CardDescription>تفعيل وتعطيل التحقق من الهوية</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>تفعيل التحقق من الهوية</Label>
              <p className="text-sm text-gray-500">تفعيل نظام التحقق من الهوية للعملاء</p>
            </div>
            <Switch
              checked={settings.kycEnabled}
              onCheckedChange={(checked) => setSettings({ ...settings, kycEnabled: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>التحقق للطلبات</Label>
              <p className="text-sm text-gray-500">طلب التحقق من الهوية لجميع الطلبات</p>
            </div>
            <Switch
              checked={settings.requireKycForOrders}
              onCheckedChange={(checked) => setSettings({ ...settings, requireKycForOrders: checked })}
              disabled={!settings.kycEnabled}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>التحقق للمدفوعات الكبيرة</Label>
              <p className="text-sm text-gray-500">طلب التحقق من الهوية للمدفوعات الكبيرة</p>
            </div>
            <Switch
              checked={settings.requireKycForLargePayments}
              onCheckedChange={(checked) => setSettings({ ...settings, requireKycForLargePayments: checked })}
              disabled={!settings.kycEnabled}
            />
          </div>

          {settings.requireKycForLargePayments && (
            <div>
              <Label htmlFor="threshold">حد المبلغ (ريال)</Label>
              <Input
                id="threshold"
                type="number"
                value={settings.kycThreshold}
                onChange={(e) => setSettings({ ...settings, kycThreshold: parseFloat(e.target.value) || 0 })}
                disabled={!settings.kycEnabled}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            متطلبات التحقق
          </CardTitle>
          <CardDescription>تحديد متطلبات التحقق من الهوية</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>التحقق من الهوية</Label>
              <p className="text-sm text-gray-500">طلب صورة الهوية الشخصية</p>
            </div>
            <Switch
              checked={settings.requireIdVerification}
              onCheckedChange={(checked) => setSettings({ ...settings, requireIdVerification: checked })}
              disabled={!settings.kycEnabled}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>التحقق من العنوان</Label>
              <p className="text-sm text-gray-500">طلب إثبات العنوان</p>
            </div>
            <Switch
              checked={settings.requireAddressVerification}
              onCheckedChange={(checked) => setSettings({ ...settings, requireAddressVerification: checked })}
              disabled={!settings.kycEnabled}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>الموافقة التلقائية</Label>
              <p className="text-sm text-gray-500">الموافقة التلقائية على التحقق (غير موصى به)</p>
            </div>
            <Switch
              checked={settings.autoApproveKyc}
              onCheckedChange={(checked) => setSettings({ ...settings, autoApproveKyc: checked })}
              disabled={!settings.kycEnabled}
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

