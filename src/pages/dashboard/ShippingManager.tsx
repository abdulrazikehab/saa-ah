import { useState, useEffect, useCallback } from 'react';
import { Truck, Plus, Edit, Trash2, Save, Loader2, MapPin, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { coreApi } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ShippingZone {
  id: string;
  name: string;
  nameAr: string;
  countries: string[];
  cities?: string[];
  enabled: boolean;
  methods: ShippingMethod[];
}

interface ShippingMethod {
  id: string;
  name: string;
  nameAr: string;
  type: 'FLAT_RATE' | 'FREE' | 'WEIGHT_BASED' | 'PRICE_BASED' | 'COURIER';
  enabled: boolean;
  cost: number;
  minOrderAmount?: number;
  estimatedDays: string;
  config?: Record<string, unknown>;
}

export default function ShippingManager() {
  const { toast } = useToast();
  const [zones, setZones] = useState<ShippingZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isAddZoneOpen, setIsAddZoneOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<ShippingZone | null>(null);
  const [shippingEnabled, setShippingEnabled] = useState(true);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    nameAr: '',
    countries: [] as string[],
    cities: [] as string[],
  });

  const loadShippingZones = useCallback(async () => {
    try {
      const data = await coreApi.get('/shipping/zones', { requireAuth: true });
      setZones(data.zones || []);
      setShippingEnabled(data.enabled !== false);
    } catch (error) {
      console.error('Failed to load shipping zones:', error);
      toast({
        title: 'تعذر تحميل مناطق الشحن',
        description: 'حدث خطأ أثناء تحميل مناطق الشحن. يرجى تحديث الصفحة.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadShippingZones();
  }, [loadShippingZones]);

  const addZone = () => {
    const newZone: ShippingZone = {
      id: Date.now().toString(),
      name: formData.name,
      nameAr: formData.nameAr,
      countries: formData.countries,
      cities: formData.cities,
      enabled: true,
      methods: []
    };

    setZones([...zones, newZone]);
    setIsAddZoneOpen(false);
    resetForm();
  };

  const addMethodToZone = (zoneId: string) => {
    const newMethod: ShippingMethod = {
      id: Date.now().toString(),
      name: 'Flat Rate',
      nameAr: 'سعر ثابت',
      type: 'FLAT_RATE',
      enabled: true,
      cost: 0,
      estimatedDays: '3-5'
    };

    setZones(zones.map(zone => 
      zone.id === zoneId 
        ? { ...zone, methods: [...zone.methods, newMethod] }
        : zone
    ));
  };

  const updateMethod = (zoneId: string, methodId: string, field: keyof ShippingMethod, value: ShippingMethod[keyof ShippingMethod]) => {
    setZones(zones.map(zone => 
      zone.id === zoneId 
        ? {
            ...zone,
            methods: zone.methods.map(method =>
              method.id === methodId ? { ...method, [field]: value } : method
            )
          }
        : zone
    ));
  };

  const removeMethod = (zoneId: string, methodId: string) => {
    setZones(zones.map(zone => 
      zone.id === zoneId 
        ? { ...zone, methods: zone.methods.filter(m => m.id !== methodId) }
        : zone
    ));
  };

  const removeZone = (zoneId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه المنطقة؟')) return;
    setZones(zones.filter(z => z.id !== zoneId));
  };

  const toggleZone = (zoneId: string) => {
    setZones(zones.map(zone => 
      zone.id === zoneId ? { ...zone, enabled: !zone.enabled } : zone
    ));
  };

  const saveShippingConfig = async () => {
    setSaving(true);
    try {
      await coreApi.post('/shipping/zones', { zones, enabled: shippingEnabled }, { requireAuth: true });
      toast({
        title: 'نجح',
        description: 'تم حفظ إعدادات الشحن بنجاح',
      });
    } catch (error) {
      console.error('Failed to save shipping config:', error);
      toast({
        title: 'تعذر حفظ إعدادات الشحن',
        description: 'حدث خطأ أثناء حفظ إعدادات الشحن. يرجى المحاولة مرة أخرى.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      nameAr: '',
      countries: [],
      cities: [],
    });
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">إدارة الشحن</h1>
          <p className="text-sm text-gray-500 mt-1">تكوين مناطق الشحن وطرق التوصيل</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Label>تفعيل الشحن</Label>
            <Switch
              checked={shippingEnabled}
              onCheckedChange={setShippingEnabled}
            />
          </div>
          <Button onClick={saveShippingConfig} disabled={saving} size="lg" className="gap-2">
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

      {/* Global Shipping Toggle Warning */}
      {!shippingEnabled && (
        <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-900/10">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Truck className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="font-medium text-yellow-900 dark:text-yellow-100">الشحن معطل</p>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                  الشحن معطل حالياً. مناسب للمنتجات الرقمية فقط. قم بتفعيله إذا كنت تبيع منتجات مادية.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Zone Button */}
      <Dialog open={isAddZoneOpen} onOpenChange={setIsAddZoneOpen}>
        <DialogTrigger asChild>
          <Button className="gap-2" onClick={resetForm}>
            <Plus className="h-4 w-4" />
            إضافة منطقة شحن
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>إضافة منطقة شحن جديدة</DialogTitle>
            <DialogDescription>
              حدد المنطقة الجغرافية وطرق الشحن المتاحة
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>اسم المنطقة (English)</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Saudi Arabia"
                />
              </div>
              <div>
                <Label>اسم المنطقة (العربية)</Label>
                <Input
                  value={formData.nameAr}
                  onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                  placeholder="المملكة العربية السعودية"
                />
              </div>
            </div>

            <div>
              <Label>الدول (مفصولة بفاصلة)</Label>
              <Input
                value={formData.countries.join(', ')}
                onChange={(e) => setFormData({ ...formData, countries: e.target.value.split(',').map(c => c.trim()) })}
                placeholder="SA, AE, KW"
              />
            </div>

            <div>
              <Label>المدن (اختياري)</Label>
              <Input
                value={formData.cities?.join(', ') || ''}
                onChange={(e) => setFormData({ ...formData, cities: e.target.value.split(',').map(c => c.trim()) })}
                placeholder="الرياض, جدة, الدمام"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddZoneOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={addZone}>
              إضافة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Shipping Zones */}
      <div className="space-y-4">
        {zones.length === 0 ? (
          <Card>
            <CardContent className="pt-12 pb-12 text-center">
              <MapPin className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold mb-2">لا توجد مناطق شحن</h3>
              <p className="text-gray-500 mb-4">ابدأ بإضافة منطقة شحن جديدة</p>
              <Button onClick={() => setIsAddZoneOpen(true)}>
                <Plus className="h-4 w-4 ml-2" />
                إضافة منطقة شحن
              </Button>
            </CardContent>
          </Card>
        ) : (
          zones.map((zone) => (
            <Card key={zone.id} className={zone.enabled ? '' : 'opacity-60'}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-primary" />
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {zone.nameAr}
                        {zone.enabled ? (
                          <Badge className="bg-green-500">مفعل</Badge>
                        ) : (
                          <Badge variant="secondary">معطل</Badge>
                        )}
                      </CardTitle>
                      <CardDescription>
                        {zone.countries.join(', ')}
                        {zone.cities && zone.cities.length > 0 && ` • ${zone.cities.join(', ')}`}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={zone.enabled}
                      onCheckedChange={() => toggleZone(zone.id)}
                    />
                    <Button variant="ghost" size="icon" onClick={() => removeZone(zone.id)}>
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Shipping Methods */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold">طرق الشحن</Label>
                    <Button size="sm" variant="outline" onClick={() => addMethodToZone(zone.id)}>
                      <Plus className="h-3 w-3 ml-1" />
                      إضافة طريقة
                    </Button>
                  </div>

                  {zone.methods.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">لا توجد طرق شحن</p>
                  ) : (
                    zone.methods.map((method) => (
                      <div key={method.id} className="p-4 border rounded-lg space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Truck className="h-4 w-4" />
                            <Label className="font-medium">{method.nameAr}</Label>
                          </div>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={method.enabled}
                              onCheckedChange={(checked) => updateMethod(zone.id, method.id, 'enabled', checked)}
                            />
                            <Button variant="ghost" size="icon" onClick={() => removeMethod(zone.id, method.id)}>
                              <Trash2 className="h-3 w-3 text-red-600" />
                            </Button>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <Label className="text-xs">النوع</Label>
                            <Select 
                              value={method.type} 
                              onValueChange={(value: ShippingMethod['type']) => updateMethod(zone.id, method.id, 'type', value)}
                            >
                              <SelectTrigger className="h-9">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="FLAT_RATE">سعر ثابت</SelectItem>
                                <SelectItem value="FREE">مجاني</SelectItem>
                                <SelectItem value="WEIGHT_BASED">حسب الوزن</SelectItem>
                                <SelectItem value="PRICE_BASED">حسب السعر</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label className="text-xs">التكلفة (ريال)</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={method.cost}
                              onChange={(e) => updateMethod(zone.id, method.id, 'cost', parseFloat(e.target.value))}
                              className="h-9"
                            />
                          </div>

                          <div>
                            <Label className="text-xs">مدة التوصيل</Label>
                            <Input
                              value={method.estimatedDays}
                              onChange={(e) => updateMethod(zone.id, method.id, 'estimatedDays', e.target.value)}
                              placeholder="3-5 أيام"
                              className="h-9"
                            />
                          </div>
                        </div>

                        {method.type === 'FREE' && (
                          <div>
                            <Label className="text-xs">الحد الأدنى للطلب (ريال)</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={method.minOrderAmount || 0}
                              onChange={(e) => updateMethod(zone.id, method.id, 'minOrderAmount', parseFloat(e.target.value))}
                              placeholder="200"
                              className="h-9"
                            />
                            <p className="text-xs text-gray-500 mt-1">شحن مجاني للطلبات فوق هذا المبلغ</p>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Save Button (Sticky) */}
      <div className="flex justify-end sticky bottom-0 bg-background py-4 border-t">
        <Button onClick={saveShippingConfig} disabled={saving} size="lg" className="gap-2">
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
