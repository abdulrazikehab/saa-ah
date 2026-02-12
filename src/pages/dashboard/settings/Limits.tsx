import { useEffect, useState, useCallback } from 'react';
import { coreApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, AlertCircle, Info, Plus, Trash2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useTranslation } from 'react-i18next';
import { getCurrencySymbol } from '@/lib/currency-utils';

interface TierLimit {
  tierId: string;
  tierName: string;
  baseLimit: number;
  increasePerPurchase: number;
}

interface PurchaseLimitsConfig {
  id?: string;
  tenantId: string;
  defaultLimitAmount: number;
  tierLimits: Record<string, { baseLimit: number; increasePerPurchase: number }>;
  customerLimitTracking: Record<string, { purchaseCount: number; currentLimit: number }>;
  creditCardTracking: Record<string, { customerEmail: string; usageCount: number; totalAmount: number }>;
  enableCreditCardTracking: boolean;
  enablePurchaseCountIncrease: boolean;
}

export default function Limits() {
  const { toast } = useToast();
  const { t, i18n } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [currentLang, setCurrentLang] = useState(i18n.language);
  const [, forceUpdate] = useState(0);
  
  // Sync current language state with i18n instance
  useEffect(() => {
    setCurrentLang(i18n.language);
  }, [i18n.language]);

  const [saving, setSaving] = useState(false);
  const [baseCurrency, setBaseCurrency] = useState<string>('SAR');
  const [currencySymbol, setCurrencySymbol] = useState<string>('ر.س');
  const [config, setConfig] = useState<PurchaseLimitsConfig>({
    tenantId: '',
    defaultLimitAmount: 1000,
    tierLimits: {},
    customerLimitTracking: {},
    creditCardTracking: {},
    enableCreditCardTracking: true,
    enablePurchaseCountIncrease: true,
  });

  const [tierLimits, setTierLimits] = useState<TierLimit[]>([]);
  const [newTierLimit, setNewTierLimit] = useState<Partial<TierLimit>>({
    tierId: '',
    tierName: '',
    baseLimit: 5000,
    increasePerPurchase: 100,
  });

  const loadLimits = useCallback(async () => {
    try {
      setLoading(true);
      const data = await coreApi.get('/dashboard/purchase-limits', { requireAuth: true });
      setConfig(data);

      // Convert tier limits from object to array for easier editing
      const tiers: TierLimit[] = Object.entries(data.tierLimits || {}).map(([tierId, limits]: [string, { baseLimit: number; increasePerPurchase: number }]) => ({
        tierId,
        tierName: tierId, // We'll use tierId as name, you may want to fetch actual tier names
        baseLimit: limits.baseLimit,
        increasePerPurchase: limits.increasePerPurchase,
      }));
      setTierLimits(tiers);
    } catch (error) {
      console.error('Failed to load limits:', error);
      toast({
        title: t('common.error', 'Error'),
        description: t('dashboard.limits.loadError', 'Failed to load limit settings'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [t, toast]);

  // Load base currency and symbol
  const loadCurrency = useCallback(async () => {
    try {
      const settings = await coreApi.get('/currencies/settings', { requireAuth: true });
      if (settings && settings.baseCurrency) {
        const currencyCode = String(settings.baseCurrency);
        setBaseCurrency(currencyCode);
        
        // Get currency symbol from currencies API
        try {
          const currencies = await coreApi.get('/currencies', { requireAuth: true });
          if (Array.isArray(currencies)) {
            const currencyData = currencies.find((c: { code: string; symbol?: string }) => c?.code === currencyCode);
            if (currencyData?.symbol) {
              setCurrencySymbol(currencyData.symbol);
            } else {
              setCurrencySymbol(getCurrencySymbol(currencyCode));
            }
          } else {
            setCurrencySymbol(getCurrencySymbol(currencyCode));
          }
        } catch (err) {
          setCurrencySymbol(getCurrencySymbol(currencyCode));
        }
      }
    } catch (error) {
      // Use defaults if settings fail
      setBaseCurrency('SAR');
      setCurrencySymbol('ر.س');
    }
  }, []);

  const loadCustomerTiers = useCallback(async () => {
    try {
      // Load customer tiers to populate the dropdown
      // You may need to adjust this based on your customer tier API
      await coreApi.get('/dashboard/customer-tiers', { requireAuth: true }).catch(() => []);
      // Store tiers for reference if needed
    } catch (error) {
      console.error('Failed to load customer tiers:', error);
    }
  }, []);

  useEffect(() => {
    loadCurrency();
    loadLimits();
    loadCustomerTiers();
  }, [loadCurrency, loadLimits, loadCustomerTiers]);

  const handleSave = async () => {
    try {
      setSaving(true);

      // Convert tier limits array back to object format
      const tierLimitsObj: Record<string, { baseLimit: number; increasePerPurchase: number }> = {};
      tierLimits.forEach((tier) => {
        if (tier.tierId) {
          tierLimitsObj[tier.tierId] = {
            baseLimit: tier.baseLimit,
            increasePerPurchase: tier.increasePerPurchase,
          };
        }
      });

      const payload = {
        ...config,
        tierLimits: tierLimitsObj,
      };

      await coreApi.put('/dashboard/purchase-limits', payload, { requireAuth: true });

      toast({
        title: t('common.success', 'Success'),
        description: t('dashboard.limits.saveSuccess', 'Limits saved successfully'),
        variant: 'default',
      });

      // Reload to get updated data
      await loadLimits();
    } catch (error) {
      console.error('Failed to save limits:', error);
      toast({
        title: t('common.error', 'Error'),
        description: t('dashboard.limits.saveError', 'Failed to save limit settings'),
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const addTierLimit = () => {
    if (!newTierLimit.tierId || !newTierLimit.tierName) {
      toast({
        title: 'خطأ',
        description: 'يرجى إدخال معرف المستوى واسم المستوى',
        variant: 'destructive',
      });
      return;
    }

    const exists = tierLimits.find((t) => t.tierId === newTierLimit.tierId);
    if (exists) {
      toast({
        title: 'خطأ',
        description: 'هذا المستوى موجود بالفعل',
        variant: 'destructive',
      });
      return;
    }

    setTierLimits([
      ...tierLimits,
      {
        tierId: newTierLimit.tierId!,
        tierName: newTierLimit.tierName!,
        baseLimit: newTierLimit.baseLimit || 5000,
        increasePerPurchase: newTierLimit.increasePerPurchase || 100,
      },
    ]);

    setNewTierLimit({
      tierId: '',
      tierName: '',
      baseLimit: 5000,
      increasePerPurchase: 100,
    });
  };

  const removeTierLimit = (tierId: string) => {
    setTierLimits(tierLimits.filter((t) => t.tierId !== tierId));
  };

  const updateTierLimit = (tierId: string, field: keyof TierLimit, value: number | string) => {
    setTierLimits(
      tierLimits.map((t) => (t.tierId === tierId ? { ...t, [field]: value } : t)),
    );
  };

  // Get translation values - always use t() function which respects current language
  // The t() function will automatically return Arabic if language is 'ar'
  const titleText = t('dashboard.purchaseLimits.title', 'Limits Settings');
  const subtitleText = t('dashboard.purchaseLimits.subtitle', 'Set purchase limits for customers based on verification status and tier');
  
  // Debug logging
  useEffect(() => {
    const arBundle = i18n.getResourceBundle('ar', 'translation');
    console.log('🌐 Limits - Language:', i18n.language, '| Key check:', arBundle?.dashboard?.purchaseLimits?.title);
  }, [i18n.language, i18n]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <div className="space-y-6" key={`limits-${i18n.language}`}>
      <div>
        <h1 className="text-3xl font-bold">{titleText}</h1>
        <p className="text-muted-foreground mt-2">
          {subtitleText}
        </p>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>{t('dashboard.purchaseLimits.howItWorks', 'How Limits Work')}</AlertTitle>
        <AlertDescription>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li>{t('dashboard.purchaseLimits.howItWorksDesc1', 'Unregistered/Unverified customers use the default limit')}</li>
            <li>{t('dashboard.purchaseLimits.howItWorksDesc2', 'Verified customers use the limit assigned to their tier')}</li>
            <li>{t('dashboard.purchaseLimits.howItWorksDesc3', 'Limit increases automatically with each purchase if enabled')}</li>
            <li>{t('dashboard.purchaseLimits.howItWorksDesc4', 'If the same credit card is used by another customer, the default limit applies')}</li>
          </ul>
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>{t('dashboard.purchaseLimits.defaultLimits', 'Default Limits')}</CardTitle>
          <CardDescription>
            {t('dashboard.purchaseLimits.defaultLimitsDesc', 'Default limit for unregistered or unverified customers')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="defaultLimit">{t('dashboard.purchaseLimits.defaultLimitAmount', 'Default Limit')} ({currencySymbol})</Label>
            <Input
              id="defaultLimit"
              type="number"
              value={config.defaultLimitAmount}
              onChange={(e) =>
                setConfig({ ...config, defaultLimitAmount: Number(e.target.value) })
              }
              min="0"
              step="0.01"
            />
            <p className="text-sm text-muted-foreground">
              {t('dashboard.purchaseLimits.defaultLimitHint', 'Maximum amount an unregistered/unverified customer can purchase')}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('dashboard.purchaseLimits.tierLimits', 'Tier Limits')}</CardTitle>
          <CardDescription>
            {t('dashboard.purchaseLimits.tierLimitsDesc', 'Set custom limits for each customer tier based on verification status')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            {tierLimits.map((tier) => (
              <div key={tier.tierId} className="flex gap-4 items-end p-4 border rounded-lg">
                <div className="flex-1 space-y-2">
                  <div>
                    <Label>{t('dashboard.purchaseLimits.tierId', 'Tier ID')}</Label>
                    <Input
                      value={tier.tierId}
                      onChange={(e) => updateTierLimit(tier.tierId, 'tierId', e.target.value)}
                      disabled
                    />
                  </div>
                  <div>
                    <Label>{t('dashboard.purchaseLimits.tierName', 'Tier Name')}</Label>
                    <Input
                      value={tier.tierName}
                      onChange={(e) => updateTierLimit(tier.tierId, 'tierName', e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex-1 space-y-2">
                  <div>
                    <Label>{t('dashboard.purchaseLimits.baseLimit', 'Base Limit')} ({currencySymbol})</Label>
                    <Input
                      type="number"
                      value={tier.baseLimit}
                      onChange={(e) =>
                        updateTierLimit(tier.tierId, 'baseLimit', Number(e.target.value))
                      }
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <Label>{t('dashboard.purchaseLimits.increasePerPurchase', 'Increase Per Purchase')} ({currencySymbol})</Label>
                    <Input
                      type="number"
                      value={tier.increasePerPurchase}
                      onChange={(e) =>
                        updateTierLimit(
                          tier.tierId,
                          'increasePerPurchase',
                          Number(e.target.value),
                        )
                      }
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => removeTierLimit(tier.tierId)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          <Separator />

          <div className="space-y-4 p-4 border border-dashed rounded-lg">
            <h3 className="font-semibold">{t('dashboard.purchaseLimits.addNewTier', 'Add New Tier')}</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="newTierId">{t('dashboard.purchaseLimits.tierId', 'Tier ID')}</Label>
                <Input
                  id="newTierId"
                  value={newTierLimit.tierId}
                  onChange={(e) => setNewTierLimit({ ...newTierLimit, tierId: e.target.value })}
                  placeholder="tier-1"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newTierName">{t('dashboard.purchaseLimits.tierName', 'Tier Name')}</Label>
                <Input
                  id="newTierName"
                  value={newTierLimit.tierName}
                  onChange={(e) =>
                    setNewTierLimit({ ...newTierLimit, tierName: e.target.value })
                  }
                  placeholder="VIP"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newBaseLimit">{t('dashboard.purchaseLimits.baseLimit', 'Base Limit')} ({currencySymbol})</Label>
                <Input
                  id="newBaseLimit"
                  type="number"
                  value={newTierLimit.baseLimit}
                  onChange={(e) =>
                    setNewTierLimit({ ...newTierLimit, baseLimit: Number(e.target.value) })
                  }
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newIncrease">{t('dashboard.purchaseLimits.increasePerPurchase', 'Increase Per Purchase')} ({currencySymbol})</Label>
                <Input
                  id="newIncrease"
                  type="number"
                  value={newTierLimit.increasePerPurchase}
                  onChange={(e) =>
                    setNewTierLimit({ ...newTierLimit, increasePerPurchase: Number(e.target.value) })
                  }
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
            <Button onClick={addTierLimit} variant="outline">
              <Plus className="h-4 w-4 ml-2" />
              {t('dashboard.purchaseLimits.addTier', 'Add Tier')}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('dashboard.purchaseLimits.advancedSettings', 'Advanced Settings')}</CardTitle>
          <CardDescription>{t('dashboard.purchaseLimits.advancedSettingsDesc', 'Enable or disable limit tracking features')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>{t('dashboard.purchaseLimits.enablePurchaseCountIncrease', 'Enable Limit Increase Based on Purchase Count')}</Label>
              <p className="text-sm text-muted-foreground">
                {t('dashboard.purchaseLimits.enablePurchaseCountIncreaseDesc', 'When enabled, the customer limit will automatically increase with each successful purchase')}
              </p>
            </div>
            <Switch
              checked={config.enablePurchaseCountIncrease}
              onCheckedChange={(checked) =>
                setConfig({ ...config, enablePurchaseCountIncrease: checked })
              }
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>{t('dashboard.purchaseLimits.enableCreditCardTracking', 'Enable Credit Card Tracking')}</Label>
              <p className="text-sm text-muted-foreground">
                {t('dashboard.purchaseLimits.enableCreditCardTrackingDesc', 'When enabled, if the same credit card is used by another customer, the default limit will be applied')}
              </p>
            </div>
            <Switch
              checked={config.enableCreditCardTracking}
              onCheckedChange={(checked) =>
                setConfig({ ...config, enableCreditCardTracking: checked })
              }
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 ml-2 animate-spin" />
              {t('dashboard.purchaseLimits.saving', 'Saving...')}
            </>
          ) : (
            <>
              <Save className="h-4 w-4 ml-2" />
              {t('dashboard.purchaseLimits.save', 'Save Changes')}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
