import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Save, CreditCard, DollarSign, Loader2, CheckCircle, Lock } from 'lucide-react';
import { tenantService, TenantData } from '@/services/tenant.service';
import { coreApi } from '@/lib/api';

interface PaymentGateway {
  id: string;
  name: string;
  provider: string;
  isActive: boolean;
  credentials?: any;
  settings?: any;
}

const PROVIDER_INFO: Record<string, { name: string; nameAr: string; description: string; descriptionAr: string; icon: any; color: string }> = {
  HYPERPAY: {
    name: 'HyperPay',
    nameAr: 'هايبر باي',
    description: 'بوابة الدفع الإلكتروني',
    descriptionAr: 'بوابة الدفع الإلكتروني',
    icon: CreditCard,
    color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600',
  },
  STRIPE: {
    name: 'Stripe',
    nameAr: 'سترايب',
    description: 'بوابة دفع عالمية',
    descriptionAr: 'بوابة دفع عالمية',
    icon: CreditCard,
    color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600',
  },
  PAYPAL: {
    name: 'PayPal',
    nameAr: 'باي بال',
    description: 'Global Payment Gateway',
    descriptionAr: 'بوابة دفع عالمية',
    icon: CreditCard,
    color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600',
  },
  NEOLEAP: {
    name: 'Neoleap',
    nameAr: 'نيوليب',
    description: 'Saudi Payment Gateway',
    descriptionAr: 'بوابة دفع سعودية',
    icon: CreditCard,
    color: 'bg-green-100 dark:bg-green-900/30 text-green-600',
  },
  CASH_ON_DELIVERY: {
    name: 'Cash on Delivery',
    nameAr: 'الدفع عند الاستلام',
    description: 'قبول الدفع نقداً عند التسليم',
    descriptionAr: 'قبول الدفع نقداً عند التسليم',
    icon: DollarSign,
    color: 'bg-green-100 dark:bg-green-900/30 text-green-600',
  },
};

export default function PaymentSettings() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [tenant, setTenant] = useState<TenantData | null>(null);
  const [availableGateways, setAvailableGateways] = useState<PaymentGateway[]>([]);
  const [gatewaySettings, setGatewaySettings] = useState<Record<string, any>>({});

  useEffect(() => {
    const init = async () => {
      try {
        await Promise.all([loadAvailableGateways(), loadTenant(), loadSettings()]);
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
    } catch (error: any) {
      // Silently fail - tenant data is optional
    }
  };

  const loadAvailableGateways = async () => {
    try {
      // Get available payment methods (includes admin-created global gateways)
      const methods = await coreApi.get('/payment/methods', { requireAuth: true });
      const gateways = Array.isArray(methods) ? methods : (methods as any)?.methods || [];
      setAvailableGateways(gateways);
    } catch (error: any) {
      console.error('Failed to load payment gateways:', error);
      toast({
        title: 'خطأ',
        description: 'فشل تحميل بوابات الدفع',
        variant: 'destructive',
      });
    }
  };

  const loadSettings = async () => {
    try {
      const response = await coreApi.get('/payment/settings', { requireAuth: true }).catch(() => null);
      if (response) {
        // Map settings to gateway-specific format
        const settingsMap: Record<string, any> = {};
        
        // HyperPay
        if (response.hyperPayEnabled) {
          settingsMap.HYPERPAY = {
            enabled: true,
            entityId: response.hyperPayEntityId || '',
            accessToken: response.hyperPayAccessToken || '',
            testMode: response.hyperPayTestMode ?? true,
            currency: response.hyperPayCurrency || 'SAR',
          };
        }
        
        // Stripe
        if (response.stripeEnabled) {
          settingsMap.STRIPE = {
            enabled: true,
            publishableKey: response.stripePublishableKey || '',
            secretKey: response.stripeSecretKey || '',
          };
        }
        
        // PayPal
        if (response.payPalEnabled) {
          settingsMap.PAYPAL = {
            enabled: true,
            clientId: response.payPalClientId || '',
            secret: response.payPalSecret || '',
            mode: response.payPalMode || 'sandbox',
          };
        }
        
        // Neoleap
        if (response.neoleapEnabled) {
          settingsMap.NEOLEAP = {
            enabled: true,
            clientId: response.neoleapClientId || '',
            clientSecret: response.neoleapClientSecret || '',
            terminalId: response.neoleapTerminalId || '',
            mode: response.neoleapMode || 'test',
          };
        }
        
        // Cash on Delivery
        if (response.codEnabled !== false) {
          settingsMap.CASH_ON_DELIVERY = {
            enabled: true,
          };
        }
        
        setGatewaySettings(settingsMap);
      }
    } catch (error: any) {
      // Settings might not exist yet
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // Transform gateway settings back to the format expected by backend
      const settings: any = {
        hyperPayEnabled: gatewaySettings.HYPERPAY?.enabled || false,
        hyperPayEntityId: gatewaySettings.HYPERPAY?.entityId || '',
        hyperPayAccessToken: gatewaySettings.HYPERPAY?.accessToken || '',
        hyperPayTestMode: gatewaySettings.HYPERPAY?.testMode ?? true,
        hyperPayCurrency: gatewaySettings.HYPERPAY?.currency || 'SAR',
        stripeEnabled: gatewaySettings.STRIPE?.enabled || false,
        stripePublishableKey: gatewaySettings.STRIPE?.publishableKey || '',
        stripeSecretKey: gatewaySettings.STRIPE?.secretKey || '',
        payPalEnabled: gatewaySettings.PAYPAL?.enabled || false,
        payPalClientId: gatewaySettings.PAYPAL?.clientId || '',
        payPalSecret: gatewaySettings.PAYPAL?.secret || '',
        payPalMode: gatewaySettings.PAYPAL?.mode || 'sandbox',
        neoleapEnabled: gatewaySettings.NEOLEAP?.enabled || false,
        neoleapClientId: gatewaySettings.NEOLEAP?.clientId || '',
        neoleapClientSecret: gatewaySettings.NEOLEAP?.clientSecret || '',
        neoleapTerminalId: gatewaySettings.NEOLEAP?.terminalId || '',
        neoleapMode: gatewaySettings.NEOLEAP?.mode || 'test',
        codEnabled: gatewaySettings.CASH_ON_DELIVERY?.enabled !== false,
      };

      await coreApi.put('/payment/settings', settings, { requireAuth: true });
      toast({
        title: 'تم الحفظ',
        description: 'تم حفظ إعدادات الدفع بنجاح',
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

  const testHyperPayConnection = async () => {
    setTesting(true);
    try {
      await coreApi.post('/payment/hyperpay/test', {
        entityId: gatewaySettings.HYPERPAY?.entityId,
        accessToken: gatewaySettings.HYPERPAY?.accessToken,
        testMode: gatewaySettings.HYPERPAY?.testMode,
      }, { requireAuth: true });
      toast({
        title: 'نجح الاتصال',
        description: 'تم الاتصال بـ HyperPay بنجاح',
      });
    } catch (error: any) {
      toast({
        title: 'فشل الاتصال',
        description: error?.message || 'تحقق من بيانات الاعتماد',
        variant: 'destructive',
      });
    } finally {
      setTesting(false);
    }
  };

  const hasFeature = (feature: string) => {
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

  const updateGatewaySetting = (provider: string, field: string, value: any) => {
    setGatewaySettings(prev => ({
      ...prev,
      [provider]: {
        ...prev[provider],
        [field]: value,
      },
    }));
  };

  const toggleGateway = (provider: string, enabled: boolean) => {
    setGatewaySettings(prev => ({
      ...prev,
      [provider]: {
        ...prev[provider],
        enabled,
      },
    }));
  };

  const renderGatewayCard = (gateway: PaymentGateway) => {
    const providerInfo = PROVIDER_INFO[gateway.provider] || {
      name: gateway.name,
      nameAr: gateway.name,
      description: '',
      descriptionAr: '',
      icon: CreditCard,
      color: 'bg-gray-100 dark:bg-gray-900/30 text-gray-600',
    };
    const Icon = providerInfo.icon;
    const isEnabled = gatewaySettings[gateway.provider]?.enabled || false;
    const featureKey = `payment_gateway_${gateway.provider.toLowerCase()}`;
    const hasAccess = hasFeature(featureKey);

    return (
      <Card key={gateway.id} className="relative">
        {!hasAccess && renderLockedOverlay(providerInfo.name)}
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${providerInfo.color}`}>
                <Icon className="h-6 w-6" />
              </div>
              <div>
                <CardTitle>{providerInfo.name}</CardTitle>
                <CardDescription>{providerInfo.descriptionAr || providerInfo.description}</CardDescription>
              </div>
            </div>
            <Switch
              checked={isEnabled}
              onCheckedChange={(checked) => toggleGateway(gateway.provider, checked)}
              disabled={!hasAccess}
            />
          </div>
        </CardHeader>
        
        {isEnabled && hasAccess && (
          <CardContent className="space-y-4">
            {gateway.provider === 'HYPERPAY' && (
              <>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor={`${gateway.id}-entityId`}>Entity ID *</Label>
                    <Input
                      id={`${gateway.id}-entityId`}
                      value={gatewaySettings.HYPERPAY?.entityId || ''}
                      onChange={(e) => updateGatewaySetting('HYPERPAY', 'entityId', e.target.value)}
                      placeholder="8a8294174b7ecb28014b9699220015ca"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`${gateway.id}-accessToken`}>Access Token *</Label>
                    <Input
                      id={`${gateway.id}-accessToken`}
                      type="password"
                      value={gatewaySettings.HYPERPAY?.accessToken || ''}
                      onChange={(e) => updateGatewaySetting('HYPERPAY', 'accessToken', e.target.value)}
                      placeholder="OGE4Mjk0MTc0YjdlY2IyODE0Yjk2OTkyMjAwMTVjYXxzeXpBN3p2UVE="
                    />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor={`${gateway.id}-currency`}>العملة</Label>
                    <select
                      id={`${gateway.id}-currency`}
                      value={gatewaySettings.HYPERPAY?.currency || 'SAR'}
                      onChange={(e) => updateGatewaySetting('HYPERPAY', 'currency', e.target.value)}
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
                      id={`${gateway.id}-testMode`}
                      checked={gatewaySettings.HYPERPAY?.testMode ?? true}
                      onCheckedChange={(checked) => updateGatewaySetting('HYPERPAY', 'testMode', checked)}
                    />
                    <Label htmlFor={`${gateway.id}-testMode`} className="cursor-pointer">
                      وضع الاختبار
                    </Label>
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={testHyperPayConnection}
                  disabled={testing || !gatewaySettings.HYPERPAY?.entityId || !gatewaySettings.HYPERPAY?.accessToken}
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
              </>
            )}

            {gateway.provider === 'STRIPE' && (
              <>
                <div>
                  <Label htmlFor={`${gateway.id}-publishableKey`}>Publishable Key</Label>
                  <Input
                    id={`${gateway.id}-publishableKey`}
                    value={gatewaySettings.STRIPE?.publishableKey || ''}
                    onChange={(e) => updateGatewaySetting('STRIPE', 'publishableKey', e.target.value)}
                    placeholder="pk_test_..."
                  />
                </div>
                <div>
                  <Label htmlFor={`${gateway.id}-secretKey`}>Secret Key</Label>
                  <Input
                    id={`${gateway.id}-secretKey`}
                    type="password"
                    value={gatewaySettings.STRIPE?.secretKey || ''}
                    onChange={(e) => updateGatewaySetting('STRIPE', 'secretKey', e.target.value)}
                    placeholder="sk_test_..."
                  />
                </div>
              </>
            )}

            {gateway.provider === 'PAYPAL' && (
              <>
                <div>
                  <Label htmlFor={`${gateway.id}-clientId`}>Client ID</Label>
                  <Input
                    id={`${gateway.id}-clientId`}
                    value={gatewaySettings.PAYPAL?.clientId || ''}
                    onChange={(e) => updateGatewaySetting('PAYPAL', 'clientId', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor={`${gateway.id}-secret`}>Secret</Label>
                  <Input
                    id={`${gateway.id}-secret`}
                    type="password"
                    value={gatewaySettings.PAYPAL?.secret || ''}
                    onChange={(e) => updateGatewaySetting('PAYPAL', 'secret', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor={`${gateway.id}-mode`}>Mode</Label>
                  <select
                    id={`${gateway.id}-mode`}
                    value={gatewaySettings.PAYPAL?.mode || 'sandbox'}
                    onChange={(e) => updateGatewaySetting('PAYPAL', 'mode', e.target.value)}
                    className="w-full h-10 px-3 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
                  >
                    <option value="sandbox">Sandbox</option>
                    <option value="live">Live</option>
                  </select>
                </div>
              </>
            )}

            {gateway.provider === 'NEOLEAP' && (
              <>
                <div>
                  <Label htmlFor={`${gateway.id}-clientId`}>Client ID</Label>
                  <Input
                    id={`${gateway.id}-clientId`}
                    value={gatewaySettings.NEOLEAP?.clientId || ''}
                    onChange={(e) => updateGatewaySetting('NEOLEAP', 'clientId', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor={`${gateway.id}-clientSecret`}>Client Secret</Label>
                  <Input
                    id={`${gateway.id}-clientSecret`}
                    type="password"
                    value={gatewaySettings.NEOLEAP?.clientSecret || ''}
                    onChange={(e) => updateGatewaySetting('NEOLEAP', 'clientSecret', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor={`${gateway.id}-terminalId`}>Terminal ID</Label>
                  <Input
                    id={`${gateway.id}-terminalId`}
                    value={gatewaySettings.NEOLEAP?.terminalId || ''}
                    onChange={(e) => updateGatewaySetting('NEOLEAP', 'terminalId', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor={`${gateway.id}-mode`}>Mode</Label>
                  <select
                    id={`${gateway.id}-mode`}
                    value={gatewaySettings.NEOLEAP?.mode || 'test'}
                    onChange={(e) => updateGatewaySetting('NEOLEAP', 'mode', e.target.value)}
                    className="w-full h-10 px-3 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
                  >
                    <option value="test">Test</option>
                    <option value="live">Live</option>
                  </select>
                </div>
              </>
            )}

            {gateway.provider === 'CASH_ON_DELIVERY' && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                لا حاجة لإعدادات إضافية للدفع عند الاستلام
              </p>
            )}
          </CardContent>
        )}
      </Card>
    );
  };

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

      {/* Display only admin-created gateways */}
      {availableGateways.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CreditCard className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600 dark:text-gray-400">
              لا توجد بوابات دفع متاحة حالياً. يرجى التواصل مع المسؤول لإضافة بوابات الدفع.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {availableGateways.map(renderGatewayCard)}
        </div>
      )}

      {/* Save Button */}
      {availableGateways.length > 0 && (
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
      )}
    </div>
  );
}
