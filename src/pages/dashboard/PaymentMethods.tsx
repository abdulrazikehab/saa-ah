import { useState, useEffect, useCallback } from 'react';
import { CreditCard, Save, Loader2, Check, X, Settings as SettingsIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { coreApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface PaymentConfig {
  entityId?: string;
  accessToken?: string;
  currency?: string;
  brands?: string[];
  publishableKey?: string;
  secretKey?: string;
  clientId?: string;
  clientSecret?: string;
  instructions?: string;
  instructionsAr?: string;
  bankName?: string;
  accountNumber?: string;
  iban?: string;
  [key: string]: string | number | string[] | undefined;
}

interface PaymentMethod {
  id: string;
  name: string;
  nameAr: string;
  type: 'HYPERPAY' | 'STRIPE' | 'PAYPAL' | 'CASH_ON_DELIVERY' | 'BANK_TRANSFER';
  enabled: boolean;
  config: PaymentConfig;
  testMode: boolean;
  icon: string;
}

export default function PaymentMethods() {
  const { toast } = useToast();
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadPaymentMethods = useCallback(async () => {
    try {
      const data = await coreApi.get('/payment/methods', { requireAuth: true });
      setMethods(data.methods || [
        {
          id: 'hyperpay',
          name: 'HyperPay',
          nameAr: 'هايبر باي',
          type: 'HYPERPAY',
          enabled: false,
          testMode: true,
          icon: '💳',
          config: {
            entityId: '',
            accessToken: '',
            currency: 'SAR',
            brands: ['VISA', 'MASTER', 'MADA']
          }
        },
        {
          id: 'stripe',
          name: 'Stripe',
          nameAr: 'سترايب',
          type: 'STRIPE',
          enabled: false,
          testMode: true,
          icon: '💳',
          config: {
            publishableKey: '',
            secretKey: '',
            currency: 'SAR'
          }
        },
        {
          id: 'paypal',
          name: 'PayPal',
          nameAr: 'باي بال',
          type: 'PAYPAL',
          enabled: false,
          testMode: true,
          icon: '🅿️',
          config: {
            clientId: '',
            clientSecret: '',
            currency: 'USD'
          }
        },
        {
          id: 'cod',
          name: 'Cash on Delivery',
          nameAr: 'الدفع عند الاستلام',
          type: 'CASH_ON_DELIVERY',
          enabled: true,
          testMode: false,
          icon: '💵',
          config: {
            instructions: 'سيتم الدفع عند استلام الطلب',
            instructionsAr: 'سيتم الدفع عند استلام الطلب'
          }
        },
        {
          id: 'bank',
          name: 'Bank Transfer',
          nameAr: 'تحويل بنكي',
          type: 'BANK_TRANSFER',
          enabled: false,
          testMode: false,
          icon: '🏦',
          config: {
            bankName: '',
            accountNumber: '',
            iban: '',
            instructions: ''
          }
        }
      ]);
    } catch (error) {
      console.error('Failed to load payment methods:', error);
      toast({
        title: 'تعذر تحميل طرق الدفع',
        description: 'حدث خطأ أثناء تحميل طرق الدفع. يرجى تحديث الصفحة.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadPaymentMethods();
  }, [loadPaymentMethods]);

  const toggleMethod = (id: string) => {
    setMethods(methods.map(m => 
      m.id === id ? { ...m, enabled: !m.enabled } : m
    ));
  };

  const toggleTestMode = (id: string) => {
    setMethods(methods.map(m => 
      m.id === id ? { ...m, testMode: !m.testMode } : m
    ));
  };

  const updateConfig = (id: string, key: string, value: any) => {
    setMethods(methods.map(m => 
      m.id === id ? { ...m, config: { ...m.config, [key]: value } } : m
    ));
  };

  const savePaymentMethods = async () => {
    setSaving(true);
    try {
      await coreApi.post('/payment/methods', { methods }, { requireAuth: true });
      toast({
        title: 'نجح',
        description: 'تم حفظ إعدادات الدفع بنجاح',
      });
    } catch (error) {
      console.error('Failed to save payment methods:', error);
      toast({
        title: 'تعذر حفظ إعدادات الدفع',
        description: 'حدث خطأ أثناء حفظ إعدادات الدفع. يرجى المحاولة مرة أخرى.',
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">طرق الدفع</h1>
          <p className="text-sm text-gray-500 mt-1">إدارة بوابات الدفع والتكاملات</p>
        </div>
        <Button onClick={savePaymentMethods} disabled={saving} size="lg" className="gap-2">
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              جاري الحفظ...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              حفظ التغييرات
            </>
          )}
        </Button>
      </div>

      {/* Payment Methods Grid */}
      <div className="grid grid-cols-1 gap-6">
        {methods.map((method) => (
          <Card key={method.id} className={method.enabled ? 'border-green-500 border-2' : ''}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{method.icon}</span>
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {method.nameAr}
                      {method.enabled && (
                        <Badge className="bg-green-500">
                          <Check className="h-3 w-3 ml-1" />
                          مفعل
                        </Badge>
                      )}
                      {!method.enabled && (
                        <Badge variant="secondary">
                          <X className="h-3 w-3 ml-1" />
                          معطل
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription>{method.name}</CardDescription>
                  </div>
                </div>
                <Switch
                  checked={method.enabled}
                  onCheckedChange={() => toggleMethod(method.id)}
                />
              </div>
            </CardHeader>

            {method.enabled && (
              <CardContent className="space-y-4">
                {/* Test Mode Toggle */}
                {method.type !== 'CASH_ON_DELIVERY' && method.type !== 'BANK_TRANSFER' && (
                  <div className="flex items-center justify-between p-4 bg-yellow-50 dark:bg-yellow-900/10 rounded-lg border border-yellow-200 dark:border-yellow-800">
                    <div>
                      <Label>وضع الاختبار</Label>
                      <p className="text-sm text-gray-500">استخدام بيئة الاختبار للمعاملات</p>
                    </div>
                    <Switch
                      checked={method.testMode}
                      onCheckedChange={() => toggleTestMode(method.id)}
                    />
                  </div>
                )}

                {/* HyperPay Configuration */}
                {method.type === 'HYPERPAY' && (
                  <Tabs defaultValue="credentials" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="credentials">بيانات الاعتماد</TabsTrigger>
                      <TabsTrigger value="settings">الإعدادات</TabsTrigger>
                    </TabsList>

                    <TabsContent value="credentials" className="space-y-4 mt-4">
                      <div>
                        <Label>Entity ID</Label>
                        <Input
                          value={method.config.entityId || ''}
                          onChange={(e) => updateConfig(method.id, 'entityId', e.target.value)}
                          placeholder="8ac7a4c77e8e7e7e017e8e8e8e8e8e8e"
                        />
                      </div>
                      <div>
                        <Label>Access Token</Label>
                        <Input
                          type="password"
                          value={method.config.accessToken || ''}
                          onChange={(e) => updateConfig(method.id, 'accessToken', e.target.value)}
                          placeholder="OGFjN2E0Yzc3ZThlN2U3ZQ=="
                        />
                      </div>
                    </TabsContent>

                    <TabsContent value="settings" className="space-y-4 mt-4">
                      <div>
                        <Label>العملة</Label>
                        <Select 
                          value={method.config.currency || 'SAR'} 
                          onValueChange={(value) => updateConfig(method.id, 'currency', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="SAR">ريال سعودي (SAR)</SelectItem>
                            <SelectItem value="AED">درهم إماراتي (AED)</SelectItem>
                            <SelectItem value="USD">دولار أمريكي (USD)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </TabsContent>
                  </Tabs>
                )}

                {/* Stripe Configuration */}
                {method.type === 'STRIPE' && (
                  <div className="space-y-4">
                    <div>
                      <Label>Publishable Key</Label>
                      <Input
                        value={method.config.publishableKey || ''}
                        onChange={(e) => updateConfig(method.id, 'publishableKey', e.target.value)}
                        placeholder="pk_test_..."
                      />
                    </div>
                    <div>
                      <Label>Secret Key</Label>
                      <Input
                        type="password"
                        value={method.config.secretKey || ''}
                        onChange={(e) => updateConfig(method.id, 'secretKey', e.target.value)}
                        placeholder="sk_test_..."
                      />
                    </div>
                    <div>
                      <Label>العملة</Label>
                      <Select 
                        value={method.config.currency || 'SAR'} 
                        onValueChange={(value) => updateConfig(method.id, 'currency', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="SAR">ريال سعودي (SAR)</SelectItem>
                          <SelectItem value="AED">درهم إماراتي (AED)</SelectItem>
                          <SelectItem value="USD">دولار أمريكي (USD)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {/* PayPal Configuration */}
                {method.type === 'PAYPAL' && (
                  <div className="space-y-4">
                    <div>
                      <Label>Client ID</Label>
                      <Input
                        value={method.config.clientId || ''}
                        onChange={(e) => updateConfig(method.id, 'clientId', e.target.value)}
                        placeholder="AeA1..."
                      />
                    </div>
                    <div>
                      <Label>Client Secret</Label>
                      <Input
                        type="password"
                        value={method.config.clientSecret || ''}
                        onChange={(e) => updateConfig(method.id, 'clientSecret', e.target.value)}
                        placeholder="ELK..."
                      />
                    </div>
                    <div>
                      <Label>العملة</Label>
                      <Select 
                        value={method.config.currency || 'USD'} 
                        onValueChange={(value) => updateConfig(method.id, 'currency', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USD">دولار أمريكي (USD)</SelectItem>
                          <SelectItem value="EUR">يورو (EUR)</SelectItem>
                          <SelectItem value="SAR">ريال سعودي (SAR)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {/* Cash on Delivery Configuration */}
                {method.type === 'CASH_ON_DELIVERY' && (
                  <div className="space-y-4">
                    <div>
                      <Label>تعليمات الدفع (العربية)</Label>
                      <Input
                        value={method.config.instructionsAr || ''}
                        onChange={(e) => updateConfig(method.id, 'instructionsAr', e.target.value)}
                        placeholder="سيتم الدفع عند استلام الطلب"
                      />
                    </div>
                    <div>
                      <Label>Payment Instructions (English)</Label>
                      <Input
                        value={method.config.instructions || ''}
                        onChange={(e) => updateConfig(method.id, 'instructions', e.target.value)}
                        placeholder="Payment will be collected upon delivery"
                      />
                    </div>
                  </div>
                )}

                {/* Bank Transfer Configuration */}
                {method.type === 'BANK_TRANSFER' && (
                  <div className="space-y-4">
                    <div>
                      <Label>اسم البنك</Label>
                      <Input
                        value={method.config.bankName || ''}
                        onChange={(e) => updateConfig(method.id, 'bankName', e.target.value)}
                        placeholder="البنك الأهلي السعودي"
                      />
                    </div>
                    <div>
                      <Label>رقم الحساب</Label>
                      <Input
                        value={method.config.accountNumber || ''}
                        onChange={(e) => updateConfig(method.id, 'accountNumber', e.target.value)}
                        placeholder="1234567890"
                      />
                    </div>
                    <div>
                      <Label>IBAN</Label>
                      <Input
                        value={method.config.iban || ''}
                        onChange={(e) => updateConfig(method.id, 'iban', e.target.value)}
                        placeholder="SA1234567890123456789012"
                      />
                    </div>
                    <div>
                      <Label>تعليمات التحويل</Label>
                      <Input
                        value={method.config.instructions || ''}
                        onChange={(e) => updateConfig(method.id, 'instructions', e.target.value)}
                        placeholder="يرجى إرسال إيصال التحويل عبر البريد الإلكتروني"
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {/* Save Button (Sticky) */}
      <div className="flex justify-end sticky bottom-0 bg-background py-4 border-t">
        <Button onClick={savePaymentMethods} disabled={saving} size="lg" className="gap-2">
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              جاري الحفظ...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              حفظ التغييرات
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
