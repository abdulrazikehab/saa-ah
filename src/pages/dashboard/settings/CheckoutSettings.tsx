import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Save, ShoppingCart, UserPlus, Mail, Phone, ShieldCheck, Loader2 } from 'lucide-react';
import { coreApi } from '@/lib/api';

export default function CheckoutSettings() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    // Guest Checkout
    allowGuestCheckout: true,
    requireEmailForGuests: true,
    requirePhoneForGuests: true,
    forceAccountCreation: false,
    
    // KYC Requirements
    requireEmailVerification: false,
    requirePhoneVerification: false,
    requireIdVerification: false,
    idVerificationThreshold: 1000,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await coreApi.get('/checkout/settings').catch(() => null);
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
      await coreApi.put('/checkout/settings', settings);
      toast({
        title: 'تم الحفظ',
        description: 'تم حفظ إعدادات الطلبات بنجاح',
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
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold mb-2">إعدادات الطلبات</h2>
        <p className="text-gray-600 dark:text-gray-400">
          قم بتكوين خيارات الطلبات والتحقق من الهوية
        </p>
      </div>

      {/* Guest Checkout Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
              <ShoppingCart className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <CardTitle>الطلبات للضيوف</CardTitle>
              <CardDescription>
                السماح للعملاء بالطلب بدون إنشاء حساب
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Allow Guest Checkout */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="allowGuestCheckout" className="text-base font-medium">
                السماح بالطلبات للضيوف
              </Label>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                يمكن للعملاء الطلب بدون تسجيل دخول
              </p>
            </div>
            <Switch
              id="allowGuestCheckout"
              checked={settings.allowGuestCheckout}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, allowGuestCheckout: checked })
              }
            />
          </div>

          {settings.allowGuestCheckout && (
            <>
              {/* Require Email */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="requireEmailForGuests" className="text-base font-medium flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    طلب البريد الإلكتروني
                  </Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    يجب على الضيوف إدخال بريدهم الإلكتروني
                  </p>
                </div>
                <Switch
                  id="requireEmailForGuests"
                  checked={settings.requireEmailForGuests}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, requireEmailForGuests: checked })
                  }
                />
              </div>

              {/* Require Phone */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="requirePhoneForGuests" className="text-base font-medium flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    طلب رقم الهاتف
                  </Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    يجب على الضيوف إدخال رقم هاتفهم
                  </p>
                </div>
                <Switch
                  id="requirePhoneForGuests"
                  checked={settings.requirePhoneForGuests}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, requirePhoneForGuests: checked })
                  }
                />
              </div>

              {/* Force Account Creation */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="forceAccountCreation" className="text-base font-medium flex items-center gap-2">
                    <UserPlus className="h-4 w-4" />
                    إجبار إنشاء حساب
                  </Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    يجب على الضيوف إنشاء حساب بعد الطلب
                  </p>
                </div>
                <Switch
                  id="forceAccountCreation"
                  checked={settings.forceAccountCreation}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, forceAccountCreation: checked })
                  }
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* KYC Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <ShieldCheck className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <CardTitle>التحقق من الهوية (KYC)</CardTitle>
              <CardDescription>
                متطلبات التحقق من هوية العملاء
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Email Verification */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="requireEmailVerification" className="text-base font-medium">
                التحقق من البريد الإلكتروني
              </Label>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                يجب على العملاء تأكيد بريدهم الإلكتروني
              </p>
            </div>
            <Switch
              id="requireEmailVerification"
              checked={settings.requireEmailVerification}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, requireEmailVerification: checked })
              }
            />
          </div>

          {/* Phone Verification */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="requirePhoneVerification" className="text-base font-medium">
                التحقق من رقم الهاتف
              </Label>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                يجب على العملاء تأكيد رقم هاتفهم عبر SMS
              </p>
            </div>
            <Switch
              id="requirePhoneVerification"
              checked={settings.requirePhoneVerification}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, requirePhoneVerification: checked })
              }
            />
          </div>

          {/* ID Verification */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="requireIdVerification" className="text-base font-medium">
                التحقق من الهوية
              </Label>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                يجب على العملاء تحميل وثائق الهوية
              </p>
            </div>
            <Switch
              id="requireIdVerification"
              checked={settings.requireIdVerification}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, requireIdVerification: checked })
              }
            />
          </div>

          {/* ID Verification Threshold */}
          {settings.requireIdVerification && (
            <div>
              <Label htmlFor="idVerificationThreshold">
                حد التحقق من الهوية (ر.س)
              </Label>
              <Input
                id="idVerificationThreshold"
                type="number"
                value={settings.idVerificationThreshold}
                onChange={(e) =>
                  setSettings({ ...settings, idVerificationThreshold: parseFloat(e.target.value) })
                }
                placeholder="1000"
              />
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                يتطلب التحقق من الهوية للطلبات التي تزيد عن هذا المبلغ
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          size="lg"
          onClick={handleSave}
          disabled={loading}
          className="bg-gradient-to-r from-indigo-600 to-purple-600"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              جاري الحفظ...
            </>
          ) : (
            <>
              <Save className="mr-2 h-5 w-5" />
              حفظ الإعدادات
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
