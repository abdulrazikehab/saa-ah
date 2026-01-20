import { useState, useEffect, useCallback } from 'react';
import { CreditCard, Save, Loader2, CheckCircle, XCircle, Globe, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { coreApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface PaymentOption {
  id: string;
  paymentMethodId: string;
  provider: string;
  name: string;
  isEnabled: boolean;
  displayOrder: number;
  isGlobal: boolean;
  credentials?: any;
  settings?: any;
}

export default function PaymentOptions() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [options, setOptions] = useState<PaymentOption[]>([]);

  const loadPaymentOptions = useCallback(async () => {
    try {
      setLoading(true);
      const data = await coreApi.get('/payment-options', { requireAuth: true });
      setOptions(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error('Failed to load payment options:', error);
      toast({
        title: 'تعذر تحميل خيارات الدفع',
        description: 'حدث خطأ أثناء تحميل خيارات الدفع. يرجى تحديث الصفحة.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadPaymentOptions();
  }, [loadPaymentOptions]);

  const toggleOption = async (paymentMethodId: string) => {
    try {
      const option = options.find(opt => opt.paymentMethodId === paymentMethodId);
      const newEnabledState = !option?.isEnabled;

      // Optimistic update
      setOptions(prev =>
        prev.map(opt =>
          opt.paymentMethodId === paymentMethodId
            ? { ...opt, isEnabled: newEnabledState }
            : opt
        )
      );

      // Update on server
      await coreApi.put(`/payment-options/${paymentMethodId}`, {
        isEnabled: newEnabledState,
        displayOrder: option?.displayOrder || 0,
      }, { requireAuth: true });

      toast({
        title: 'نجح',
        description: newEnabledState
          ? 'تم تفعيل طريقة الدفع'
          : 'تم إلغاء تفعيل طريقة الدفع',
      });
    } catch (error: any) {
      console.error('Failed to toggle payment option:', error);
      // Revert optimistic update
      loadPaymentOptions();
      toast({
        title: 'خطأ',
        description: error?.response?.data?.message || 'فشل تحديث خيار الدفع',
        variant: 'destructive',
      });
    }
  };

  const saveAllOptions = async () => {
    try {
      setSaving(true);
      const updates = options.map(opt => ({
        paymentMethodId: opt.paymentMethodId,
        isEnabled: opt.isEnabled,
        displayOrder: opt.displayOrder,
      }));

      await coreApi.put('/payment-options/bulk', updates, { requireAuth: true });

      toast({
        title: 'نجح',
        description: 'تم حفظ جميع خيارات الدفع بنجاح',
      });
    } catch (error: any) {
      console.error('Failed to save payment options:', error);
      toast({
        title: 'خطأ',
        description: 'فشل حفظ خيارات الدفع',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const getProviderBadge = (provider: string) => {
    const badges: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
      HYPERPAY: { label: 'HyperPay', variant: 'default' },
      NEOLEAP: { label: 'Neoleap', variant: 'secondary' },
      STRIPE: { label: 'Stripe', variant: 'outline' },
      PAYPAL: { label: 'PayPal', variant: 'outline' },
      CASH_ON_DELIVERY: { label: 'COD', variant: 'secondary' },
    };
    return badges[provider] || { label: provider, variant: 'outline' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">خيارات الدفع</h2>
          <p className="text-gray-400">
            اختر طرق الدفع المتاحة لعملائك في التطبيق. يمكنك تفعيل أو إلغاء تفعيل أي طريقة دفع.
          </p>
        </div>
        <Button onClick={saveAllOptions} disabled={saving} className="gap-2">
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              جاري الحفظ...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              حفظ الكل
            </>
          )}
        </Button>
      </div>

      <Alert className="bg-blue-500/10 border-blue-500/20">
        <CreditCard className="h-4 w-4" />
        <AlertDescription className="text-gray-300">
          طرق الدفع المعروضة هنا هي البوابات التي تم إضافتها من لوحة الإدارة الرئيسية. يمكنك تفعيل أو إلغاء تفعيل أي طريقة لعملائك.
        </AlertDescription>
      </Alert>

      {options.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CreditCard className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-400">لا توجد طرق دفع متاحة</p>
            <p className="text-sm text-gray-500 mt-2">
              يرجى إضافة بوابات الدفع من لوحة الإدارة الرئيسية أولاً
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {options.map((option) => {
            const badge = getProviderBadge(option.provider);
            return (
              <Card
                key={option.id}
                className={`transition-all ${
                  option.isEnabled
                    ? 'border-green-500/50 bg-green-500/5'
                    : 'border-gray-700 bg-gray-800/30'
                }`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className="text-lg">{option.name}</CardTitle>
                        {option.isGlobal && (
                          <Badge variant="outline" className="text-xs">
                            <Globe className="w-3 h-3 mr-1" />
                            عام
                          </Badge>
                        )}
                      </div>
                      <CardDescription className="flex items-center gap-2">
                        <Badge variant={badge.variant}>{badge.label}</Badge>
                        {option.isEnabled ? (
                          <span className="text-green-400 text-xs flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            مفعل
                          </span>
                        ) : (
                          <span className="text-gray-500 text-xs flex items-center gap-1">
                            <XCircle className="w-3 h-3" />
                            معطل
                          </span>
                        )}
                      </CardDescription>
                    </div>
                    <Switch
                      checked={option.isEnabled}
                      onCheckedChange={() => toggleOption(option.paymentMethodId)}
                    />
                  </div>
                </CardHeader>
                {option.isEnabled && (
                  <CardContent>
                    <div className="text-xs text-gray-400">
                      سيتم عرض هذه الطريقة لعملائك في التطبيق
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

