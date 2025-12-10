import { useEffect, useState, useCallback } from 'react';
import { coreApi } from '@/lib/api';
import { Loader2, Save, Store, Globe, Mail, Phone, MapPin, Clock, CreditCard, DollarSign, Truck, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface StoreSettings {
  storeName: string;
  storeNameAr: string;
  storeDescription: string;
  storeDescriptionAr: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  postalCode: string;
  currency: string;
  timezone: string;
  language: string;
  taxEnabled: boolean;
  taxRate: number;
  shippingEnabled: boolean;
  inventoryTracking: boolean;
  lowStockThreshold: number;
  allowGuestCheckout: boolean;
  requireEmailVerification: boolean;
  maintenanceMode: boolean;
  storeLogoUrl?: string;
  googlePlayUrl?: string;
  appStoreUrl?: string;
  paymentMethods: string[];
  hyperpayConfig?: {
    entityId: string;
    accessToken: string;
    testMode: boolean;
  };
  blockVpnUsers: boolean;
}

const DEFAULT_SETTINGS: StoreSettings = {
  storeName: '',
  storeNameAr: '',
  storeDescription: '',
  storeDescriptionAr: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  country: 'SA',
  postalCode: '',
  currency: 'SAR',
  timezone: 'Asia/Riyadh',
  language: 'ar',
  taxEnabled: true,
  taxRate: 15,
  shippingEnabled: true,
  inventoryTracking: true,
  lowStockThreshold: 10,
  allowGuestCheckout: true,
  requireEmailVerification: false,
  maintenanceMode: false,
  storeLogoUrl: '',
  googlePlayUrl: '',
  appStoreUrl: '',
  paymentMethods: ['CASH_ON_DELIVERY'],
  hyperpayConfig: {
    entityId: '',
    accessToken: '',
    testMode: true,
  },
  blockVpnUsers: false,
};

export default function Settings() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      const data = await coreApi.get('/site-config', { requireAuth: true });
      if (data && data.settings) {
        setSettings({ ...DEFAULT_SETTINGS, ...data.settings });
      } else {
        setSettings(DEFAULT_SETTINGS);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
      toast({
        title: 'تنبيه',
        description: 'لم يتم العثور على إعدادات سابقة، تم تحميل الإعدادات الافتراضية',
        variant: 'default',
      });
      setSettings(DEFAULT_SETTINGS);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const updateSetting = <K extends keyof StoreSettings>(field: K, value: StoreSettings[K]) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      await coreApi.post('/site-config', { settings }, { requireAuth: true });
      toast({
        title: 'نجح',
        description: 'تم حفظ الإعدادات بنجاح',
      });
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast({
        title: 'خطأ',
        description: 'فشل حفظ الإعدادات',
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">إعدادات المتجر</h1>
          <p className="text-sm text-gray-500 mt-1">إدارة إعدادات المتجر والتكوينات</p>
        </div>
        <Button onClick={saveSettings} disabled={saving} size="lg" className="gap-2">
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              جاري الحفظ...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              حفظ الإعدادات
            </>
          )}
        </Button>
      </div>

      {/* Settings Tabs */}
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full max-w-5xl grid-cols-6">
          <TabsTrigger value="general">عام</TabsTrigger>
          <TabsTrigger value="contact">معلومات الاتصال</TabsTrigger>
          <TabsTrigger value="business">إعدادات الأعمال</TabsTrigger>
          <TabsTrigger value="payment">الدفع والشحن</TabsTrigger>
          <TabsTrigger value="security">الأمان</TabsTrigger>
          <TabsTrigger value="advanced">متقدم</TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Store className="w-5 h-5" />
                <CardTitle>معلومات المتجر الأساسية</CardTitle>
              </div>
              <CardDescription>قم بتكوين المعلومات الأساسية لمتجرك</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Store Logo Upload */}
              <div className="flex items-center gap-4 p-4 border rounded-lg bg-muted/20">
                {settings.storeLogoUrl ? (
                  <img src={settings.storeLogoUrl} alt="شعار المتجر" className="h-20 w-20 object-contain rounded-lg border bg-white" />
                ) : (
                  <div className="h-20 w-20 rounded-lg border border-dashed flex items-center justify-center bg-muted/50">
                    <Store className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
                <div className="space-y-2">
                  <Label>شعار المتجر</Label>
                  <Input
                    type="file"
                    accept="image/*"
                    className="max-w-xs"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const formData = new FormData();
                      formData.append('files', file);
                      try {
                        const res = await coreApi.post('/upload/images', formData, {
                            headers: { 'Content-Type': 'multipart/form-data' },
                            requireAuth: true
                        });
                        
                        if (res.files && res.files.length > 0) {
                            const uploadedUrl = res.files[0].secureUrl || res.files[0].url;
                            updateSetting('storeLogoUrl', uploadedUrl);
                            toast({ title: 'نجح', description: 'تم تحديث الشعار' });
                        }
                      } catch (err) {
                        console.error(err);
                        toast({ title: 'خطأ', description: 'فشل رفع الشعار', variant: 'destructive' });
                      }
                    }}
                  />
                  <p className="text-xs text-muted-foreground">يفضل استخدام صورة مربعة بحجم 500x500 بكسل</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="storeName">اسم المتجر (English)</Label>
                  <Input
                    id="storeName"
                    value={settings.storeName}
                    onChange={(e) => updateSetting('storeName', e.target.value)}
                    placeholder="My Store"
                  />
                </div>
                <div>
                  <Label htmlFor="storeNameAr">اسم المتجر (العربية)</Label>
                  <Input
                    id="storeNameAr"
                    value={settings.storeNameAr}
                    onChange={(e) => updateSetting('storeNameAr', e.target.value)}
                    placeholder="متجري"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="storeDescription">وصف المتجر (English)</Label>
                <Textarea
                  id="storeDescription"
                  value={settings.storeDescription}
                  onChange={(e) => updateSetting('storeDescription', e.target.value)}
                  placeholder="Store description..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="storeDescriptionAr">وصف المتجر (العربية)</Label>
                <Textarea
                  id="storeDescriptionAr"
                  value={settings.storeDescriptionAr}
                  onChange={(e) => updateSetting('storeDescriptionAr', e.target.value)}
                  placeholder="وصف المتجر..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="googlePlayUrl">رابط Google Play</Label>
                  <Input
                    id="googlePlayUrl"
                    value={settings.googlePlayUrl || ''}
                    onChange={(e) => updateSetting('googlePlayUrl', e.target.value)}
                    placeholder="https://play.google.com/..."
                  />
                </div>
                <div>
                  <Label htmlFor="appStoreUrl">رابط App Store</Label>
                  <Input
                    id="appStoreUrl"
                    value={settings.appStoreUrl || ''}
                    onChange={(e) => updateSetting('appStoreUrl', e.target.value)}
                    placeholder="https://apps.apple.com/..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="language">اللغة الافتراضية</Label>
                  <Select value={settings.language} onValueChange={(value) => updateSetting('language', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ar">العربية</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="fr">Français</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="currency">العملة</Label>
                  <Select value={settings.currency} onValueChange={(value) => updateSetting('currency', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SAR">ريال سعودي (SAR)</SelectItem>
                      <SelectItem value="AED">درهم إماراتي (AED)</SelectItem>
                      <SelectItem value="USD">دولار أمريكي (USD)</SelectItem>
                      <SelectItem value="EUR">يورو (EUR)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="timezone">المنطقة الزمنية</Label>
                <Select value={settings.timezone} onValueChange={(value) => updateSetting('timezone', value)}>
                  <SelectTrigger>
                    <Clock className="h-4 w-4 ml-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Asia/Riyadh">الرياض (GMT+3)</SelectItem>
                    <SelectItem value="Asia/Dubai">دبي (GMT+4)</SelectItem>
                    <SelectItem value="Africa/Cairo">القاهرة (GMT+2)</SelectItem>
                    <SelectItem value="Europe/London">لندن (GMT+0)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contact Information */}
        <TabsContent value="contact" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Phone className="w-5 h-5" />
                <CardTitle>معلومات الاتصال</CardTitle>
              </div>
              <CardDescription>معلومات الاتصال بالمتجر</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">البريد الإلكتروني</Label>
                  <div className="relative">
                    <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      value={settings.email}
                      onChange={(e) => updateSetting('email', e.target.value)}
                      placeholder="store@example.com"
                      className="pr-10"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="phone">رقم الهاتف</Label>
                  <div className="relative">
                    <Phone className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="phone"
                      type="tel"
                      value={settings.phone}
                      onChange={(e) => updateSetting('phone', e.target.value)}
                      placeholder="+966 50 123 4567"
                      className="pr-10"
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="address">العنوان</Label>
                <div className="relative">
                  <MapPin className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                  <Textarea
                    id="address"
                    value={settings.address}
                    onChange={(e) => updateSetting('address', e.target.value)}
                    placeholder="شارع الملك فهد، حي العليا"
                    rows={2}
                    className="pr-10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="city">المدينة</Label>
                  <Input
                    id="city"
                    value={settings.city}
                    onChange={(e) => updateSetting('city', e.target.value)}
                    placeholder="الرياض"
                  />
                </div>
                <div>
                  <Label htmlFor="country">الدولة</Label>
                  <Select value={settings.country} onValueChange={(value) => updateSetting('country', value)}>
                    <SelectTrigger>
                      <Globe className="h-4 w-4 ml-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SA">السعودية</SelectItem>
                      <SelectItem value="AE">الإمارات</SelectItem>
                      <SelectItem value="EG">مصر</SelectItem>
                      <SelectItem value="JO">الأردن</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="postalCode">الرمز البريدي</Label>
                  <Input
                    id="postalCode"
                    value={settings.postalCode}
                    onChange={(e) => updateSetting('postalCode', e.target.value)}
                    placeholder="12345"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Business Settings */}
        <TabsContent value="business" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>إعدادات الضرائب</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label>تفعيل الضرائب</Label>
                  <p className="text-sm text-gray-500">إضافة الضرائب على المنتجات</p>
                </div>
                <Switch
                  checked={settings.taxEnabled}
                  onCheckedChange={(checked) => updateSetting('taxEnabled', checked)}
                />
              </div>

              {settings.taxEnabled && (
                <div>
                  <Label htmlFor="taxRate">نسبة الضريبة (%)</Label>
                  <Input
                    id="taxRate"
                    type="number"
                    step="0.01"
                    value={settings.taxRate}
                    onChange={(e) => updateSetting('taxRate', parseFloat(e.target.value))}
                    placeholder="15"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>إعدادات المخزون</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label>تتبع المخزون</Label>
                  <p className="text-sm text-gray-500">تتبع كميات المنتجات تلقائياً</p>
                </div>
                <Switch
                  checked={settings.inventoryTracking}
                  onCheckedChange={(checked) => updateSetting('inventoryTracking', checked)}
                />
              </div>

              {settings.inventoryTracking && (
                <div>
                  <Label htmlFor="lowStockThreshold">حد التنبيه للمخزون المنخفض</Label>
                  <Input
                    id="lowStockThreshold"
                    type="number"
                    value={settings.lowStockThreshold}
                    onChange={(e) => updateSetting('lowStockThreshold', parseInt(e.target.value))}
                    placeholder="10"
                  />
                  <p className="text-xs text-gray-500 mt-1">سيتم تنبيهك عندما يصل المخزون لهذا الحد</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>إعدادات الشحن</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label>تفعيل الشحن</Label>
                  <p className="text-sm text-gray-500">السماح بشحن المنتجات للعملاء</p>
                </div>
                <Switch
                  checked={settings.shippingEnabled}
                  onCheckedChange={(checked) => updateSetting('shippingEnabled', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payment & Shipping Settings */}
        <TabsContent value="payment" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                <CardTitle>طرق الدفع</CardTitle>
              </div>
              <CardDescription>إدارة طرق الدفع المتاحة للعملاء</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                    <CreditCard className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <Label>الدفع عند الاستلام</Label>
                    <p className="text-sm text-gray-500">السماح بالدفع النقدي عند التوصيل</p>
                  </div>
                </div>
                <Switch 
                  checked={settings.paymentMethods.includes('CASH_ON_DELIVERY')}
                  onCheckedChange={(checked) => {
                    const methods = checked 
                      ? [...settings.paymentMethods, 'CASH_ON_DELIVERY']
                      : settings.paymentMethods.filter(m => m !== 'CASH_ON_DELIVERY');
                    updateSetting('paymentMethods', methods);
                  }}
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                    <CreditCard className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <Label>HyperPay (Visa/Mastercard/Mada)</Label>
                    <p className="text-sm text-gray-500">الدفع الإلكتروني عبر HyperPay</p>
                  </div>
                </div>
                <Switch 
                  checked={settings.paymentMethods.includes('HYPERPAY')}
                  onCheckedChange={(checked) => {
                    const methods = checked 
                      ? [...settings.paymentMethods, 'HYPERPAY']
                      : settings.paymentMethods.filter(m => m !== 'HYPERPAY');
                    updateSetting('paymentMethods', methods);
                  }}
                />
              </div>

              {settings.paymentMethods.includes('HYPERPAY') && (
                <div className="p-4 border rounded-lg bg-muted/20 space-y-4">
                  <h3 className="font-medium">إعدادات HyperPay</h3>
                  <div className="space-y-2">
                    <Label>Entity ID</Label>
                    <Input 
                      value={settings.hyperpayConfig?.entityId || ''}
                      onChange={(e) => updateSetting('hyperpayConfig', { ...settings.hyperpayConfig!, entityId: e.target.value })}
                      placeholder="Enter Entity ID"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Access Token</Label>
                    <Input 
                      type="password"
                      value={settings.hyperpayConfig?.accessToken || ''}
                      onChange={(e) => updateSetting('hyperpayConfig', { ...settings.hyperpayConfig!, accessToken: e.target.value })}
                      placeholder="Enter Access Token"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch 
                      checked={settings.hyperpayConfig?.testMode ?? true}
                      onCheckedChange={(checked) => updateSetting('hyperpayConfig', { ...settings.hyperpayConfig!, testMode: checked })}
                    />
                    <Label>وضع التجربة (Test Mode)</Label>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                    <DollarSign className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <Label>التحويل البنكي</Label>
                    <p className="text-sm text-gray-500">الدفع عبر التحويل المباشر</p>
                  </div>
                </div>
                <Switch 
                  checked={settings.paymentMethods.includes('BANK_TRANSFER')}
                  onCheckedChange={(checked) => {
                    const methods = checked 
                      ? [...settings.paymentMethods, 'BANK_TRANSFER']
                      : settings.paymentMethods.filter(m => m !== 'BANK_TRANSFER');
                    updateSetting('paymentMethods', methods);
                  }}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5" />
                <CardTitle>إعدادات الشحن</CardTitle>
              </div>
              <CardDescription>تكوين خيارات وأسعار الشحن</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label>تفعيل الشحن</Label>
                  <p className="text-sm text-gray-500">السماح بشحن المنتجات للعملاء</p>
                </div>
                <Switch
                  checked={settings.shippingEnabled}
                  onCheckedChange={(checked) => updateSetting('shippingEnabled', checked)}
                />
              </div>

              {settings.shippingEnabled && (
                <>
                  <div className="space-y-3">
                    <Label>شركات الشحن</Label>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-2">
                          <Truck className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">الشحن السريع</span>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-2">
                          <Truck className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">الشحن العادي</span>
                        </div>
                        <Switch defaultChecked />
                      </div>
                    </div>
                  </div>

                  <Button variant="outline" className="w-full">
                    إدارة طرق الشحن
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                <CardTitle>إعدادات الأمان</CardTitle>
              </div>
              <CardDescription>إدارة إعدادات الأمان والحماية للمتجر</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg border-orange-200 bg-orange-50 dark:bg-orange-900/10">
                <div>
                  <Label className="text-orange-900 dark:text-orange-100">حظر مستخدمي VPN</Label>
                  <p className="text-sm text-orange-700 dark:text-orange-300">منع المستخدمين الذين يستخدمون VPN من تسجيل الدخول أو التسجيل</p>
                </div>
                <Switch
                  checked={settings.blockVpnUsers}
                  onCheckedChange={(checked) => updateSetting('blockVpnUsers', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Advanced Settings */}
        <TabsContent value="advanced" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>إعدادات الطلبات</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label>السماح بالشراء كضيف</Label>
                  <p className="text-sm text-gray-500">السماح للزوار بالشراء بدون تسجيل</p>
                </div>
                <Switch
                  checked={settings.allowGuestCheckout}
                  onCheckedChange={(checked) => updateSetting('allowGuestCheckout', checked)}
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label>طلب تأكيد البريد الإلكتروني</Label>
                  <p className="text-sm text-gray-500">يجب على المستخدمين تأكيد بريدهم الإلكتروني</p>
                </div>
                <Switch
                  checked={settings.requireEmailVerification}
                  onCheckedChange={(checked) => updateSetting('requireEmailVerification', checked)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>وضع الصيانة</CardTitle>
              <CardDescription>إيقاف المتجر مؤقتاً للصيانة</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 border rounded-lg border-red-200 bg-red-50 dark:bg-red-900/10">
                <div>
                  <Label className="text-red-900 dark:text-red-100">تفعيل وضع الصيانة</Label>
                  <p className="text-sm text-red-700 dark:text-red-300">سيتم إيقاف المتجر عن العملاء</p>
                </div>
                <Switch
                  checked={settings.maintenanceMode}
                  onCheckedChange={(checked) => updateSetting('maintenanceMode', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save Button (Sticky) */}
      <div className="flex justify-end sticky bottom-0 bg-background py-4 border-t">
        <Button onClick={saveSettings} disabled={saving} size="lg" className="gap-2">
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              جاري الحفظ...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              حفظ الإعدادات
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
