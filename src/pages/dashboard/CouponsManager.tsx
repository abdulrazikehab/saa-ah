import { useState, useEffect, useCallback } from 'react';
import { Ticket, Plus, Edit, Trash2, Save, Loader2, Copy, Check, Percent, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { coreApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Coupon {
  id: string;
  code: string;
  type: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_SHIPPING';
  value: number;
  minOrderAmount?: number;
  maxDiscount?: number;
  usageLimit?: number;
  usageCount: number;
  perUserLimit?: number;
  startDate?: string;
  endDate?: string;
  enabled: boolean;
  description: string;
  descriptionAr: string;
  applicableProducts?: string[];
  applicableCategories?: string[];
  createdAt: string;
}

export default function CouponsManager() {
  const { toast } = useToast();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    code: '',
    type: 'PERCENTAGE' as 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_SHIPPING',
    value: '',
    minOrderAmount: '',
    maxDiscount: '',
    usageLimit: '',
    perUserLimit: '',
    startDate: '',
    endDate: '',
    description: '',
    descriptionAr: '',
  });

  const loadCoupons = useCallback(async () => {
    try {
      const data = await coreApi.get('/coupons', { requireAuth: true });
      setCoupons(data.coupons || []);
    } catch (error) {
      console.error('Failed to load coupons:', error);
      toast({
        title: 'تعذر تحميل الكوبونات',
        description: 'حدث خطأ أثناء تحميل الكوبونات. يرجى تحديث الصفحة.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadCoupons();
  }, [loadCoupons]);

  const generateRandomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData({ ...formData, code });
  };

  const saveCoupon = async () => {
    try {
      setSaving(true);
      const couponData = {
        ...formData,
        value: parseFloat(formData.value),
        minOrderAmount: formData.minOrderAmount ? parseFloat(formData.minOrderAmount) : undefined,
        maxDiscount: formData.maxDiscount ? parseFloat(formData.maxDiscount) : undefined,
        usageLimit: formData.usageLimit ? parseInt(formData.usageLimit) : undefined,
        perUserLimit: formData.perUserLimit ? parseInt(formData.perUserLimit) : undefined,
      };

      if (editingCoupon) {
        await coreApi.put(`/coupons/${editingCoupon.id}`, couponData, { requireAuth: true });
        toast({ title: 'نجح', description: 'تم تحديث الكوبون بنجاح' });
      } else {
        await coreApi.post('/coupons', couponData, { requireAuth: true });
        toast({ title: 'نجح', description: 'تم إضافة الكوبون بنجاح' });
      }

      setIsAddDialogOpen(false);
      setEditingCoupon(null);
      resetForm();
      loadCoupons();
    } catch (error) {
      console.error('Failed to save coupon:', error);
      toast({
        title: 'تعذر حفظ الكوبون',
        description: 'حدث خطأ أثناء حفظ الكوبون. يرجى المحاولة مرة أخرى.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const deleteCoupon = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الكوبون؟')) return;

    try {
      await coreApi.delete(`/coupons/${id}`, { requireAuth: true });
      toast({ title: 'نجح', description: 'تم حذف الكوبون بنجاح' });
      loadCoupons();
    } catch (error) {
      console.error('Failed to delete coupon:', error);
      toast({
        title: 'تعذر حذف الكوبون',
        description: 'حدث خطأ أثناء حذف الكوبون. يرجى المحاولة مرة أخرى.',
        variant: 'destructive',
      });
    }
  };

  const toggleCoupon = async (id: string, enabled: boolean) => {
    try {
      await coreApi.put(`/coupons/${id}/toggle`, { enabled }, { requireAuth: true });
      loadCoupons();
    } catch (error) {
      console.error('Failed to toggle coupon:', error);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
    toast({ title: 'تم النسخ', description: 'تم نسخ كود الكوبون' });
  };

  const resetForm = () => {
    setFormData({
      code: '',
      type: 'PERCENTAGE',
      value: '',
      minOrderAmount: '',
      maxDiscount: '',
      usageLimit: '',
      perUserLimit: '',
      startDate: '',
      endDate: '',
      description: '',
      descriptionAr: '',
    });
  };

  const openEditDialog = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      type: coupon.type,
      value: coupon.value.toString(),
      minOrderAmount: coupon.minOrderAmount?.toString() || '',
      maxDiscount: coupon.maxDiscount?.toString() || '',
      usageLimit: coupon.usageLimit?.toString() || '',
      perUserLimit: coupon.perUserLimit?.toString() || '',
      startDate: coupon.startDate || '',
      endDate: coupon.endDate || '',
      description: coupon.description,
      descriptionAr: coupon.descriptionAr,
    });
    setIsAddDialogOpen(true);
  };

  const getTypeBadge = (type: string) => {
    const config = {
      PERCENTAGE: { label: 'نسبة مئوية', icon: Percent, className: 'bg-blue-500/10 text-blue-700 border-blue-500/20' },
      FIXED_AMOUNT: { label: 'مبلغ ثابت', icon: DollarSign, className: 'bg-green-500/10 text-green-700 border-green-500/20' },
      FREE_SHIPPING: { label: 'شحن مجاني', icon: Ticket, className: 'bg-purple-500/10 text-purple-700 border-purple-500/20' },
    };
    const { label, icon: Icon, className } = config[type as keyof typeof config];
    return (
      <Badge variant="outline" className={className}>
        <Icon className="h-3 w-3 ml-1" />
        {label}
      </Badge>
    );
  };

  const stats = {
    total: coupons.length,
    active: coupons.filter(c => c.enabled).length,
    expired: coupons.filter(c => c.endDate && new Date(c.endDate) < new Date()).length,
    totalUsage: coupons.reduce((sum, c) => sum + c.usageCount, 0),
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">كوبونات الخصم</h1>
          <p className="text-sm text-gray-500 mt-1">إدارة كوبونات الخصم والعروض الترويجية</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" onClick={resetForm}>
              <Plus className="h-4 w-4" />
              إضافة كوبون
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingCoupon ? 'تعديل الكوبون' : 'إضافة كوبون جديد'}</DialogTitle>
              <DialogDescription>
                قم بإنشاء كوبون خصم لعملائك
              </DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="basic">المعلومات الأساسية</TabsTrigger>
                <TabsTrigger value="restrictions">القيود والشروط</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4 mt-4">
                <div>
                  <Label>كود الكوبون</Label>
                  <div className="flex gap-2">
                    <Input
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      placeholder="SUMMER2025"
                      className="font-mono"
                    />
                    <Button type="button" variant="outline" onClick={generateRandomCode}>
                      توليد
                    </Button>
                  </div>
                </div>

                <div>
                  <Label>نوع الخصم</Label>
                 <Select value={formData.type} onValueChange={(value: any) => setFormData({ ...formData, type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PERCENTAGE">نسبة مئوية (%)</SelectItem>
                      <SelectItem value="FIXED_AMOUNT">مبلغ ثابت (ريال)</SelectItem>
                      <SelectItem value="FREE_SHIPPING">شحن مجاني</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.type !== 'FREE_SHIPPING' && (
                  <div>
                    <Label>قيمة الخصم</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.value}
                      onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                      placeholder={formData.type === 'PERCENTAGE' ? '10' : '50'}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {formData.type === 'PERCENTAGE' ? 'نسبة الخصم (%)' : 'المبلغ بالريال'}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>الوصف (العربية)</Label>
                    <Input
                      value={formData.descriptionAr}
                      onChange={(e) => setFormData({ ...formData, descriptionAr: e.target.value })}
                      placeholder="خصم الصيف"
                    />
                  </div>
                  <div>
                    <Label>Description (English)</Label>
                    <Input
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Summer Sale"
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="restrictions" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>الحد الأدنى للطلب (ريال)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.minOrderAmount}
                      onChange={(e) => setFormData({ ...formData, minOrderAmount: e.target.value })}
                      placeholder="100"
                    />
                  </div>
                  <div>
                    <Label>الحد الأقصى للخصم (ريال)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.maxDiscount}
                      onChange={(e) => setFormData({ ...formData, maxDiscount: e.target.value })}
                      placeholder="200"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>عدد مرات الاستخدام الكلي</Label>
                    <Input
                      type="number"
                      value={formData.usageLimit}
                      onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                      placeholder="100"
                    />
                  </div>
                  <div>
                    <Label>عدد مرات الاستخدام لكل عميل</Label>
                    <Input
                      type="number"
                      value={formData.perUserLimit}
                      onChange={(e) => setFormData({ ...formData, perUserLimit: e.target.value })}
                      placeholder="1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>تاريخ البداية</Label>
                    <Input
                      type="datetime-local"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>تاريخ الانتهاء</Label>
                    <Input
                      type="datetime-local"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                إلغاء
              </Button>
              <Button onClick={saveCoupon} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin ml-2" />
                    جاري الحفظ...
                  </>
                ) : (
                  editingCoupon ? 'تحديث' : 'إضافة'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-r-4 border-r-blue-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">إجمالي الكوبونات</p>
                <p className="text-2xl font-bold mt-1">{stats.total}</p>
              </div>
              <Ticket className="h-8 w-8 text-blue-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-r-4 border-r-green-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">كوبونات نشطة</p>
                <p className="text-2xl font-bold mt-1">{stats.active}</p>
              </div>
              <Check className="h-8 w-8 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-r-4 border-r-red-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">كوبونات منتهية</p>
                <p className="text-2xl font-bold mt-1">{stats.expired}</p>
              </div>
              <Ticket className="h-8 w-8 text-red-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-r-4 border-r-purple-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">مرات الاستخدام</p>
                <p className="text-2xl font-bold mt-1">{stats.totalUsage}</p>
              </div>
              <DollarSign className="h-8 w-8 text-purple-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Coupons Table */}
      <Card>
        <CardContent className="p-0">
          {coupons.length === 0 ? (
            <div className="text-center py-12">
              <Ticket className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold mb-2">لا توجد كوبونات</h3>
              <p className="text-gray-500 mb-4">ابدأ بإضافة كوبون خصم جديد</p>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="h-4 w-4 ml-2" />
                إضافة كوبون
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الكود</TableHead>
                  <TableHead>النوع</TableHead>
                  <TableHead>القيمة</TableHead>
                  <TableHead>الاستخدام</TableHead>
                  <TableHead>الصلاحية</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {coupons.map((coupon) => (
                  <TableRow key={coupon.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded font-mono text-sm">
                          {coupon.code}
                        </code>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => copyCode(coupon.code)}
                        >
                          {copiedCode === coupon.code ? (
                            <Check className="h-3 w-3 text-green-600" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>{getTypeBadge(coupon.type)}</TableCell>
                    <TableCell className="font-semibold">
                      {coupon.type === 'PERCENTAGE' && `${coupon.value}%`}
                      {coupon.type === 'FIXED_AMOUNT' && `${coupon.value} ريال`}
                      {coupon.type === 'FREE_SHIPPING' && 'مجاني'}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p>{coupon.usageCount} / {coupon.usageLimit || '∞'}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {coupon.endDate ? (
                        new Date(coupon.endDate) < new Date() ? (
                          <Badge variant="outline" className="bg-red-500/10 text-red-700">منتهي</Badge>
                        ) : (
                          new Date(coupon.endDate).toLocaleDateString('ar-SA')
                        )
                      ) : (
                        'دائم'
                      )}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={coupon.enabled}
                        onCheckedChange={(checked) => toggleCoupon(coupon.id, checked)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(coupon)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteCoupon(coupon.id)}>
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
