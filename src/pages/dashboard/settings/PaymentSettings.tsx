import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Save, CreditCard, DollarSign, Loader2, CheckCircle, Lock } from 'lucide-react';
import { tenantService, TenantData } from '@/services/tenant.service';

export default function PaymentSettings() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [tenant, setTenant] = useState<TenantData | null>(null);
  const [settings, setSettings] = useState({
    hyperPayEnabled: false,
    hyperPayEntityId: '',
    hyperPayAccessToken: '',
    hyperPayTestMode: true,
    hyperPayCurrency: 'SAR',
    stripeEnabled: false,
    stripePublishableKey: '',
    stripeSecretKey: '',
    payPalEnabled: false,
    payPalClientId: '',
    payPalSecret: '',
    payPalMode: 'sandbox',
    neoleapEnabled: false,
    neoleapClientId: '',
    neoleapClientSecret: '',
    neoleapTerminalId: '',
    neoleapMode: 'test',
    codEnabled: true,
  });

  useEffect(() => {
    const init = async () => {
      try {
        await Promise.all([loadSettings(), loadTenant()]);
      } finally {
        setInitialLoading(false);
      }
    };
    init();
  }, []);

  const loadTenant = async () => {
    try {
      const data = await tenantService.getCurrentUserTenant();
      setTenant(data);
    } catch (error) {
      console.error('Failed to load tenant:', error);
    }
  };

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/payment/settings', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/payment/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        toast({
          title: 'تم الحفظ',
          description: 'تم حفظ إعدادات الدفع بنجاح',
        });
      } else {
        throw new Error('Failed to save');
      }
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'فشل حفظ الإعدادات',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const testHyperPayConnection = async () => {
    setTesting(true);
    try {
      const response = await fetch('/api/payment/hyperpay/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          entityId: settings.hyperPayEntityId,
          accessToken: settings.hyperPayAccessToken,
          testMode: settings.hyperPayTestMode,
        }),
      });

      if (response.ok) {
        toast({
          title: 'نجح الاتصال',
          description: 'تم الاتصال بـ HyperPay بنجاح',
        });
      } else {
        throw new Error('Connection failed');
      }
    } catch (error) {
      toast({
        title: 'فشل الاتصال',
        description: 'تحقق من بيانات الاعتماد',
        variant: 'destructive',
      });
    } finally {
      setTesting(false);
    }
  };

  const hasFeature = (feature: string) => {
    // If no plan loaded yet, assume false (or true for basic features if we want)
    if (!tenant?.subscriptionPlan) return false;
    return tenant.subscriptionPlan.features.includes(feature);
  };

  const renderLockedOverlay = (featureName: string) => (
    <div className="absolute inset-0 bg-gray-100/50 dark:bg-gray-900/50 backdrop-blur-[1px] z-10 flex items-center justify-center rounded-xl">
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg flex flex-col items-center gap-2 border border-gray-200 dark:border-gray-700">
        <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full">
          <Lock className="w-5 h-5 text-gray-500" />
        </div>
        <p className="font-medium text-sm">Upgrade to use {featureName}</p>
        <Button size="sm" variant="outline" onClick={() => window.location.href = '/dashboard/subscription'}>
          View Plans
        </Button>
      </div>
    </div>
  );

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold mb-2">إعدادات الدفع</h2>
        <p className="text-gray-600 dark:text-gray-400">
          قم بتكوين بوابات الدفع لمتجرك
        </p>
      </div>

      {/* HyperPay Settings */}
      <Card className="relative">
        {!hasFeature('payment_gateway_hyperpay') && renderLockedOverlay('HyperPay')}
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <CreditCard className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <CardTitle>HyperPay</CardTitle>
                <CardDescription>بوابة الدفع الإلكتروني</CardDescription>
              </div>
            </div>
            <Switch
              checked={settings.hyperPayEnabled}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, hyperPayEnabled: checked })
              }
              disabled={!hasFeature('payment_gateway_hyperpay')}
            />
          </div>
        </CardHeader>
        
        {settings.hyperPayEnabled && (
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="hyperPayEntityId">Entity ID *</Label>
                <Input
                  id="hyperPayEntityId"
                  value={settings.hyperPayEntityId}
                  onChange={(e) =>
                    setSettings({ ...settings, hyperPayEntityId: e.target.value })
                  }
                  placeholder="8a8294174b7ecb28014b9699220015ca"
                />
              </div>

              <div>
                <Label htmlFor="hyperPayAccessToken">Access Token *</Label>
                <Input
                  id="hyperPayAccessToken"
                  type="password"
                  value={settings.hyperPayAccessToken}
                  onChange={(e) =>
                    setSettings({ ...settings, hyperPayAccessToken: e.target.value })
                  }
                  placeholder="OGE4Mjk0MTc0YjdlY2IyODE0Yjk2OTkyMjAwMTVjYXxzeXpBN3p2UVE="
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="hyperPayCurrency">العملة</Label>
                <select
                  id="hyperPayCurrency"
                  value={settings.hyperPayCurrency}
                  onChange={(e) =>
                    setSettings({ ...settings, hyperPayCurrency: e.target.value })
                  }
                  className="w-full h-10 px-3 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
                >
                  <option value="SAR">ريال سعودي (SAR)</option>
                  <option value="AED">درهم إماراتي (AED)</option>
                  <option value="KWD">دينار كويتي (KWD)</option>
                  <option value="USD">دولار أمريكي (USD)</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-6">
                <Switch
                  id="hyperPayTestMode"
                  checked={settings.hyperPayTestMode}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, hyperPayTestMode: checked })
                  }
                />
                <Label htmlFor="hyperPayTestMode" className="cursor-pointer">
                  وضع الاختبار
                </Label>
              </div>
            </div>

            <Button
              variant="outline"
              onClick={testHyperPayConnection}
              disabled={testing || !settings.hyperPayEntityId || !settings.hyperPayAccessToken}
            >
              {testing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  جاري الاختبار...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  اختبار الاتصال
                </>
              )}
            </Button>
          </CardContent>
        )}
      </Card>

      {/* Stripe Settings */}
      <Card className="relative">
        {!hasFeature('payment_gateway_stripe') && renderLockedOverlay('Stripe')}
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <CreditCard className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <CardTitle>Stripe</CardTitle>
                <CardDescription>بوابة دفع عالمية</CardDescription>
              </div>
            </div>
            <Switch
              checked={settings.stripeEnabled}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, stripeEnabled: checked })
              }
              disabled={!hasFeature('payment_gateway_stripe')}
            />
          </div>
        </CardHeader>
        
        {settings.stripeEnabled && (
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="stripePublishableKey">Publishable Key</Label>
              <Input
                id="stripePublishableKey"
                value={settings.stripePublishableKey}
                onChange={(e) =>
                  setSettings({ ...settings, stripePublishableKey: e.target.value })
                }
                placeholder="pk_test_..."
              />
            </div>

            <div>
              <Label htmlFor="stripeSecretKey">Secret Key</Label>
              <Input
                id="stripeSecretKey"
                type="password"
                value={settings.stripeSecretKey}
                onChange={(e) =>
                  setSettings({ ...settings, stripeSecretKey: e.target.value })
                }
                placeholder="sk_test_..."
              />
            </div>
          </CardContent>
        )}
      </Card>

      {/* PayPal Settings */}
      <Card className="relative">
        {!hasFeature('payment_gateway_paypal') && renderLockedOverlay('PayPal')}
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <CreditCard className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <CardTitle>PayPal</CardTitle>
                <CardDescription>Global Payment Gateway</CardDescription>
              </div>
            </div>
            <Switch
              checked={settings.payPalEnabled}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, payPalEnabled: checked })
              }
              disabled={!hasFeature('payment_gateway_paypal')}
            />
          </div>
        </CardHeader>
        
        {settings.payPalEnabled && (
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="payPalClientId">Client ID</Label>
              <Input
                id="payPalClientId"
                value={settings.payPalClientId}
                onChange={(e) =>
                  setSettings({ ...settings, payPalClientId: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="payPalSecret">Secret</Label>
              <Input
                id="payPalSecret"
                type="password"
                value={settings.payPalSecret}
                onChange={(e) =>
                  setSettings({ ...settings, payPalSecret: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="payPalMode">Mode</Label>
              <select
                id="payPalMode"
                value={settings.payPalMode}
                onChange={(e) =>
                  setSettings({ ...settings, payPalMode: e.target.value })
                }
                className="w-full h-10 px-3 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
              >
                <option value="sandbox">Sandbox</option>
                <option value="live">Live</option>
              </select>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Neoleap Settings */}
      <Card className="relative">
        {!hasFeature('payment_gateway_neoleap') && renderLockedOverlay('Neoleap')}
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <CreditCard className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <CardTitle>Neoleap</CardTitle>
                <CardDescription>Saudi Payment Gateway</CardDescription>
              </div>
            </div>
            <Switch
              checked={settings.neoleapEnabled}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, neoleapEnabled: checked })
              }
              disabled={!hasFeature('payment_gateway_neoleap')}
            />
          </div>
        </CardHeader>
        
        {settings.neoleapEnabled && (
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="neoleapClientId">Client ID</Label>
              <Input
                id="neoleapClientId"
                value={settings.neoleapClientId}
                onChange={(e) =>
                  setSettings({ ...settings, neoleapClientId: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="neoleapClientSecret">Client Secret</Label>
              <Input
                id="neoleapClientSecret"
                type="password"
                value={settings.neoleapClientSecret}
                onChange={(e) =>
                  setSettings({ ...settings, neoleapClientSecret: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="neoleapTerminalId">Terminal ID</Label>
              <Input
                id="neoleapTerminalId"
                value={settings.neoleapTerminalId}
                onChange={(e) =>
                  setSettings({ ...settings, neoleapTerminalId: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="neoleapMode">Mode</Label>
              <select
                id="neoleapMode"
                value={settings.neoleapMode}
                onChange={(e) =>
                  setSettings({ ...settings, neoleapMode: e.target.value })
                }
                className="w-full h-10 px-3 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
              >
                <option value="test">Test</option>
                <option value="live">Live</option>
              </select>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Cash on Delivery */}
      <Card className="relative">
        {!hasFeature('payment_gateway_cod') && renderLockedOverlay('Cash on Delivery')}
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <CardTitle>الدفع عند الاستلام</CardTitle>
                <CardDescription>قبول الدفع نقداً عند التسليم</CardDescription>
              </div>
            </div>
            <Switch
              checked={settings.codEnabled}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, codEnabled: checked })
              }
              disabled={!hasFeature('payment_gateway_cod')}
            />
          </div>
        </CardHeader>
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
