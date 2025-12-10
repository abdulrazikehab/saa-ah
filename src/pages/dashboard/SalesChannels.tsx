import { useState, useEffect, useCallback } from 'react';
import { Store, ShoppingCart, Package, Smartphone, TrendingUp, Settings as SettingsIcon, Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { coreApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface SalesChannel {
  id: string;
  name: string;
  nameAr: string;
  type: 'LOCAL' | 'WHOLESALE' | 'SALLA_POINT' | 'SOCIAL_MEDIA';
  enabled: boolean;
  icon: string;
  description: string;
  descriptionAr: string;
  stats: {
    orders: number;
    revenue: number;
    products: number;
  };
  config?: Record<string, unknown>;
}

export default function SalesChannels() {
  const { toast } = useToast();
  const [channels, setChannels] = useState<SalesChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadChannels = useCallback(async () => {
    try {
      const data = await coreApi.get('/sales-channels', { requireAuth: true });
      setChannels(data.channels || [
        {
          id: 'local',
          name: 'Local Store',
          nameAr: 'محلي',
          type: 'LOCAL',
          enabled: true,
          icon: '🏪',
          description: 'Your main online store',
          descriptionAr: 'متجرك الإلكتروني الرئيسي',
          stats: { orders: 0, revenue: 0, products: 0 },
          config: {}
        },
        {
          id: 'wholesale',
          name: 'Wholesale Market',
          nameAr: 'سوق الجملة',
          type: 'WHOLESALE',
          enabled: false,
          icon: '📦',
          description: 'Sell in bulk to other businesses',
          descriptionAr: 'البيع بالجملة للشركات الأخرى',
          stats: { orders: 0, revenue: 0, products: 0 },
          config: {
            minOrderQuantity: 10,
            discountPercentage: 15
          }
        },
        {
          id: 'salla-point',
          name: 'Salla Point',
          nameAr: 'سلة بوينت',
          type: 'SALLA_POINT',
          enabled: false,
          icon: '📱',
          description: 'POS system for physical stores',
          descriptionAr: 'نظام نقاط البيع للمتاجر الفعلية',
          stats: { orders: 0, revenue: 0, products: 0 },
          config: {
            locations: []
          }
        },
        {
          id: 'social',
          name: 'Social Media',
          nameAr: 'وسائل التواصل',
          type: 'SOCIAL_MEDIA',
          enabled: false,
          icon: '📲',
          description: 'Sell on Instagram, Facebook, TikTok',
          descriptionAr: 'البيع عبر إنستغرام، فيسبوك، تيك توك',
          stats: { orders: 0, revenue: 0, products: 0 },
          config: {
            platforms: []
          }
        }
      ]);
    } catch (error) {
      console.error('Failed to load sales channels:', error);
      toast({
        title: 'خطأ',
        description: 'فشل تحميل قنوات البيع',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadChannels();
  }, [loadChannels]);

  const toggleChannel = async (id: string, enabled: boolean) => {
    try {
      setSaving(true);
      await coreApi.put(`/sales-channels/${id}`, { enabled }, { requireAuth: true });
      setChannels(channels.map(ch => ch.id === id ? { ...ch, enabled } : ch));
      toast({
        title: 'نجح',
        description: `تم ${enabled ? 'تفعيل' : 'تعطيل'} القناة بنجاح`,
      });
    } catch (error) {
      console.error('Failed to toggle channel:', error);
      toast({
        title: 'خطأ',
        description: 'فشل تحديث القناة',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const updateChannelConfig = async (id: string, config: Record<string, unknown>) => {
    try {
      setSaving(true);
      await coreApi.put(`/sales-channels/${id}/config`, { config }, { requireAuth: true });
      setChannels(channels.map(ch => ch.id === id ? { ...ch, config } : ch));
      toast({ title: 'نجح', description: 'تم حفظ الإعدادات بنجاح' });
    } catch (error) {
      console.error('Failed to update config:', error);
      toast({
        title: 'خطأ',
        description: 'فشل حفظ الإعدادات',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const totalStats = channels.reduce(
    (acc, ch) => ({
      orders: acc.orders + ch.stats.orders,
      revenue: acc.revenue + ch.stats.revenue,
      products: acc.products + ch.stats.products,
    }),
    { orders: 0, revenue: 0, products: 0 }
  );

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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">قنوات البيع</h1>
          <p className="text-sm text-gray-500 mt-1">إدارة قنوات البيع المختلفة</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-r-4 border-r-blue-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">إجمالي الطلبات</p>
                <p className="text-2xl font-bold mt-1">{totalStats.orders}</p>
              </div>
              <ShoppingCart className="h-8 w-8 text-blue-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-r-4 border-r-green-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">إجمالي المبيعات</p>
                <p className="text-2xl font-bold mt-1">{totalStats.revenue.toFixed(2)} ريال</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-r-4 border-r-purple-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">المنتجات المتاحة</p>
                <p className="text-2xl font-bold mt-1">{totalStats.products}</p>
              </div>
              <Package className="h-8 w-8 text-purple-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sales Channels */}
      <div className="grid grid-cols-1 gap-6">
        {channels.map((channel) => (
          <Card key={channel.id} className={channel.enabled ? 'border-primary' : ''}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-4xl">{channel.icon}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle>{channel.nameAr}</CardTitle>
                      {channel.enabled ? (
                        <Badge className="bg-green-500">مفعل</Badge>
                      ) : (
                        <Badge variant="secondary">معطل</Badge>
                      )}
                    </div>
                    <CardDescription>{channel.descriptionAr}</CardDescription>
                  </div>
                </div>
                <Switch
                  checked={channel.enabled}
                  onCheckedChange={(checked) => toggleChannel(channel.id, checked)}
                  disabled={saving}
                />
              </div>
            </CardHeader>

            {channel.enabled && (
              <CardContent>
                <Tabs defaultValue="stats" className="w-full">
                  <TabsList>
                    <TabsTrigger value="stats">الإحصائيات</TabsTrigger>
                    <TabsTrigger value="settings">الإعدادات</TabsTrigger>
                  </TabsList>

                  <TabsContent value="stats" className="space-y-4 mt-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-lg">
                        <p className="text-sm text-gray-600 dark:text-gray-400">الطلبات</p>
                        <p className="text-2xl font-bold mt-1">{channel.stats.orders}</p>
                      </div>
                      <div className="p-4 bg-green-50 dark:bg-green-900/10 rounded-lg">
                        <p className="text-sm text-gray-600 dark:text-gray-400">المبيعات</p>
                        <p className="text-2xl font-bold mt-1">{channel.stats.revenue.toFixed(2)} ريال</p>
                      </div>
                      <div className="p-4 bg-purple-50 dark:bg-purple-900/10 rounded-lg">
                        <p className="text-sm text-gray-600 dark:text-gray-400">المنتجات</p>
                        <p className="text-2xl font-bold mt-1">{channel.stats.products}</p>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="settings" className="space-y-4 mt-4">
                    {channel.type === 'WHOLESALE' && (
                      <div className="space-y-4">
                        <div>
                          <Label>الحد الأدنى لكمية الطلب</Label>
                          <Input
                            type="number"
                            value={(channel.config?.minOrderQuantity as number) || 10}
                            onChange={(e) => updateChannelConfig(channel.id, {
                              ...channel.config,
                              minOrderQuantity: parseInt(e.target.value)
                            })}
                          />
                        </div>
                        <div>
                          <Label>نسبة الخصم (%)</Label>
                          <Input
                            type="number"
                            value={(channel.config?.discountPercentage as number) || 15}
                            onChange={(e) => updateChannelConfig(channel.id, {
                              ...channel.config,
                              discountPercentage: parseInt(e.target.value)
                            })}
                          />
                        </div>
                      </div>
                    )}

                    {channel.type === 'SALLA_POINT' && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <p className="font-medium">نقاط البيع</p>
                            <p className="text-sm text-gray-500">أضف مواقع نقاط البيع الخاصة بك</p>
                          </div>
                          <Button variant="outline">
                            <Plus className="h-4 w-4 ml-2" />
                            إضافة موقع
                          </Button>
                        </div>
                      </div>
                    )}

                    {channel.type === 'SOCIAL_MEDIA' && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex items-center gap-2">
                              <span className="text-2xl">📷</span>
                              <span className="font-medium">Instagram</span>
                            </div>
                            <Switch />
                          </div>
                          <div className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex items-center gap-2">
                              <span className="text-2xl">📘</span>
                              <span className="font-medium">Facebook</span>
                            </div>
                            <Switch />
                          </div>
                          <div className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex items-center gap-2">
                              <span className="text-2xl">🎵</span>
                              <span className="font-medium">TikTok</span>
                            </div>
                            <Switch />
                          </div>
                          <div className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex items-center gap-2">
                              <span className="text-2xl">👻</span>
                              <span className="font-medium">Snapchat</span>
                            </div>
                            <Switch />
                          </div>
                        </div>
                      </div>
                    )}

                    {channel.type === 'LOCAL' && (
                      <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-lg">
                        <p className="font-medium text-blue-900 dark:text-blue-100">متجرك الرئيسي</p>
                        <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                          هذه هي قناة البيع الرئيسية لمتجرك الإلكتروني
                        </p>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
