import { useEffect, useState } from 'react';
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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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

  useEffect(() => {
    loadLimits();
    loadCustomerTiers();
  }, []);

  const loadLimits = async () => {
    try {
      setLoading(true);
      const data = await coreApi.get('/dashboard/purchase-limits', { requireAuth: true });
      setConfig(data);

      // Convert tier limits from object to array for easier editing
      const tiers: TierLimit[] = Object.entries(data.tierLimits || {}).map(([tierId, limits]: [string, any]) => ({
        tierId,
        tierName: tierId, // We'll use tierId as name, you may want to fetch actual tier names
        baseLimit: limits.baseLimit,
        increasePerPurchase: limits.increasePerPurchase,
      }));
      setTierLimits(tiers);
    } catch (error) {
      console.error('Failed to load limits:', error);
      toast({
        title: 'خطأ',
        description: 'فشل تحميل إعدادات الحدود',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadCustomerTiers = async () => {
    try {
      // Load customer tiers to populate the dropdown
      // You may need to adjust this based on your customer tier API
      const tiers = await coreApi.get('/dashboard/customer-tiers', { requireAuth: true }).catch(() => []);
      // Store tiers for reference if needed
    } catch (error) {
      console.error('Failed to load customer tiers:', error);
    }
  };

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
        title: 'تم الحفظ',
        description: 'تم حفظ إعدادات الحدود بنجاح',
        variant: 'default',
      });

      // Reload to get updated data
      await loadLimits();
    } catch (error) {
      console.error('Failed to save limits:', error);
      toast({
        title: 'خطأ',
        description: 'فشل حفظ إعدادات الحدود',
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">إعدادات الحدود</h1>
        <p className="text-muted-foreground mt-2">
          حدد حدود الشراء للعملاء بناءً على حالة التحقق والطبقة
        </p>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>كيف تعمل الحدود</AlertTitle>
        <AlertDescription>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li>العملاء غير المسجلين/غير الم verified يستخدمون الحد الافتراضي</li>
            <li>العملاء الم verified يستخدمون الحد المخصص لطبقتهم</li>
            <li>الحد يزيد تلقائياً مع كل عملية شراء إذا كان مفعلاً</li>
            <li>إذا تم استخدام نفس البطاقة الائتمانية من قبل عميل آخر، يتم تطبيق الحد الافتراضي</li>
          </ul>
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>الحدود الافتراضية</CardTitle>
          <CardDescription>
            الحد الافتراضي للعملاء غير المسجلين أو غير الم verified
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="defaultLimit">الحد الافتراضي (ر.س)</Label>
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
              الحد الأقصى للمبلغ الذي يمكن للعميل غير المسجل/غير الم verified شراؤه
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>حدود الطبقات (Tiers)</CardTitle>
          <CardDescription>
            تعيين حدود مخصصة لكل طبقة عملاء حسب حالة التحقق
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            {tierLimits.map((tier) => (
              <div key={tier.tierId} className="flex gap-4 items-end p-4 border rounded-lg">
                <div className="flex-1 space-y-2">
                  <div>
                    <Label>معرف المستوى</Label>
                    <Input
                      value={tier.tierId}
                      onChange={(e) => updateTierLimit(tier.tierId, 'tierId', e.target.value)}
                      disabled
                    />
                  </div>
                  <div>
                    <Label>اسم المستوى</Label>
                    <Input
                      value={tier.tierName}
                      onChange={(e) => updateTierLimit(tier.tierId, 'tierName', e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex-1 space-y-2">
                  <div>
                    <Label>الحد الأساسي (ر.س)</Label>
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
                    <Label>الزيادة لكل عملية شراء (ر.س)</Label>
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
            <h3 className="font-semibold">إضافة طبقة جديدة</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="newTierId">معرف المستوى</Label>
                <Input
                  id="newTierId"
                  value={newTierLimit.tierId}
                  onChange={(e) => setNewTierLimit({ ...newTierLimit, tierId: e.target.value })}
                  placeholder="tier-1"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newTierName">اسم المستوى</Label>
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
                <Label htmlFor="newBaseLimit">الحد الأساسي (ر.س)</Label>
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
                <Label htmlFor="newIncrease">الزيادة لكل عملية شراء (ر.س)</Label>
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
              إضافة طبقة
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>الإعدادات المتقدمة</CardTitle>
          <CardDescription>تفعيل أو تعطيل ميزات تتبع الحدود</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>تفعيل زيادة الحد بناءً على عدد المشتريات</Label>
              <p className="text-sm text-muted-foreground">
                عندما يكون مفعلاً، سيزداد حد العميل تلقائياً مع كل عملية شراء ناجحة
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
              <Label>تفعيل تتبع البطاقات الائتمانية</Label>
              <p className="text-sm text-muted-foreground">
                عندما يكون مفعلاً، إذا تم استخدام نفس البطاقة الائتمانية من قبل عميل آخر،
                سيتم تطبيق الحد الافتراضي
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
              جاري الحفظ...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 ml-2" />
              حفظ التغييرات
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
