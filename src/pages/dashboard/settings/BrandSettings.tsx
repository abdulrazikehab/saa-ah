import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { coreApi } from '@/lib/api';

interface Brand {
  id: string;
  name: string;
  nameAr?: string;
  code?: string;
  shortName?: string;
  brandType?: string;
  status: string;
  rechargeUsdValue?: number;
  usdValueForCoins?: number;
  safetyStock?: number;
  leadTime?: number;
  reorderPoint?: number;
  averageConsumptionPerMonth?: number;
  averageConsumptionPerDay?: number;
  abcAnalysis?: string;
  odooCategoryId?: string;
  createdAt: string;
}

export default function BrandSettings() {
  const { toast } = useToast();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    nameAr: '',
    code: '',
    shortName: '',
    brandType: '',
    status: 'Active',
    rechargeUsdValue: 0,
    usdValueForCoins: 0,
    safetyStock: 0,
    leadTime: 0,
    reorderPoint: 0,
    averageConsumptionPerMonth: 0,
    averageConsumptionPerDay: 0,
    abcAnalysis: 'C - Low Value',
    odooCategoryId: '',
  });

  useEffect(() => {
    loadBrands();
  }, []);

  const loadBrands = async () => {
    try {
      const response = await coreApi.get('/brands');
      setBrands(Array.isArray(response) ? response : []);
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error?.message || 'فشل تحميل العلامات التجارية',
        variant: 'destructive',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingBrand) {
        await coreApi.put(`/brands/${editingBrand.id}`, {
          ...formData,
          rechargeUsdValue: parseFloat(formData.rechargeUsdValue.toString()),
          usdValueForCoins: parseFloat(formData.usdValueForCoins.toString()),
          safetyStock: parseFloat(formData.safetyStock.toString()),
          reorderPoint: parseFloat(formData.reorderPoint.toString()),
          averageConsumptionPerMonth: parseFloat(formData.averageConsumptionPerMonth.toString()),
          averageConsumptionPerDay: parseFloat(formData.averageConsumptionPerDay.toString()),
        });
        toast({
          title: 'نجح',
          description: 'تم تحديث العلامة التجارية بنجاح',
        });
      } else {
        await coreApi.post('/brands', {
          ...formData,
          rechargeUsdValue: parseFloat(formData.rechargeUsdValue.toString()),
          usdValueForCoins: parseFloat(formData.usdValueForCoins.toString()),
          safetyStock: parseFloat(formData.safetyStock.toString()),
          reorderPoint: parseFloat(formData.reorderPoint.toString()),
          averageConsumptionPerMonth: parseFloat(formData.averageConsumptionPerMonth.toString()),
          averageConsumptionPerDay: parseFloat(formData.averageConsumptionPerDay.toString()),
        });
        toast({
          title: 'نجح',
          description: 'تم إضافة العلامة التجارية بنجاح',
        });
      }
      setIsDialogOpen(false);
      resetForm();
      loadBrands();
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error?.message || 'فشل حفظ العلامة التجارية',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (brand: Brand) => {
    setEditingBrand(brand);
    setFormData({
      name: brand.name,
      nameAr: brand.nameAr || '',
      code: brand.code || '',
      shortName: brand.shortName || '',
      brandType: brand.brandType || '',
      status: brand.status || 'Active',
      rechargeUsdValue: Number(brand.rechargeUsdValue) || 0,
      usdValueForCoins: Number(brand.usdValueForCoins) || 0,
      safetyStock: Number(brand.safetyStock) || 0,
      leadTime: Number(brand.leadTime) || 0,
      reorderPoint: Number(brand.reorderPoint) || 0,
      averageConsumptionPerMonth: Number(brand.averageConsumptionPerMonth) || 0,
      averageConsumptionPerDay: Number(brand.averageConsumptionPerDay) || 0,
      abcAnalysis: brand.abcAnalysis || 'C - Low Value',
      odooCategoryId: brand.odooCategoryId || '',
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه العلامة التجارية؟')) return;

    try {
      await coreApi.delete(`/brands/${id}`);
      toast({
        title: 'نجح',
        description: 'تم حذف العلامة التجارية بنجاح',
      });
      loadBrands();
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error?.message || 'فشل حذف العلامة التجارية',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      nameAr: '',
      code: '',
      shortName: '',
      brandType: '',
      status: 'Active',
      rechargeUsdValue: 0,
      usdValueForCoins: 0,
      safetyStock: 0,
      leadTime: 0,
      reorderPoint: 0,
      averageConsumptionPerMonth: 0,
      averageConsumptionPerDay: 0,
      abcAnalysis: 'C - Low Value',
      odooCategoryId: '',
    });
    setEditingBrand(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">إدارة العلامات التجارية</h2>
          <p className="text-gray-600 dark:text-gray-400">إضافة وإدارة العلامات التجارية للمنتجات</p>
        </div>
        <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          إضافة علامة تجارية
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>قائمة العلامات التجارية</CardTitle>
          <CardDescription>جميع العلامات التجارية المسجلة في النظام</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الاسم</TableHead>
                <TableHead>الكود</TableHead>
                <TableHead>النوع</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {brands.map((brand) => (
                <TableRow key={brand.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{brand.name}</div>
                      {brand.nameAr && (
                        <div className="text-sm text-gray-500">{brand.nameAr}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                      {brand.code || '-'}
                    </span>
                  </TableCell>
                  <TableCell>{brand.brandType || '-'}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded text-xs ${
                      brand.status === 'Active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                    }`}>
                      {brand.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(brand)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(brand.id)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingBrand ? 'تعديل علامة تجارية' : 'إضافة علامة تجارية جديدة'}</DialogTitle>
            <DialogDescription>املأ المعلومات التالية لإضافة علامة تجارية جديدة</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">اسم العلامة التجارية *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="nameAr">اسم العلامة التجارية (عربي)</Label>
                <Input
                  id="nameAr"
                  value={formData.nameAr}
                  onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="code">كود العلامة التجارية</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="مثال: E01006"
                />
              </div>
              <div>
                <Label htmlFor="shortName">الاسم المختصر</Label>
                <Input
                  id="shortName"
                  value={formData.shortName}
                  onChange={(e) => setFormData({ ...formData, shortName: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="brandType">نوع العلامة التجارية</Label>
                <Input
                  id="brandType"
                  value={formData.brandType}
                  onChange={(e) => setFormData({ ...formData, brandType: e.target.value })}
                  placeholder="مثال: اتصالات وانترنت"
                />
              </div>
              <div>
                <Label htmlFor="status">الحالة</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">نشط</SelectItem>
                    <SelectItem value="Inactive">غير نشط</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="rechargeUsdValue">قيمة إعادة الشحن (USD)</Label>
                <Input
                  id="rechargeUsdValue"
                  type="number"
                  step="0.01"
                  value={formData.rechargeUsdValue}
                  onChange={(e) => setFormData({ ...formData, rechargeUsdValue: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label htmlFor="usdValueForCoins">قيمة العملات (USD)</Label>
                <Input
                  id="usdValueForCoins"
                  type="number"
                  step="0.01"
                  value={formData.usdValueForCoins}
                  onChange={(e) => setFormData({ ...formData, usdValueForCoins: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="safetyStock">مخزون الأمان</Label>
                <Input
                  id="safetyStock"
                  type="number"
                  step="0.01"
                  value={formData.safetyStock}
                  onChange={(e) => setFormData({ ...formData, safetyStock: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label htmlFor="leadTime">وقت التوريد (أيام)</Label>
                <Input
                  id="leadTime"
                  type="number"
                  value={formData.leadTime}
                  onChange={(e) => setFormData({ ...formData, leadTime: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="reorderPoint">نقطة إعادة الطلب</Label>
                <Input
                  id="reorderPoint"
                  type="number"
                  step="0.01"
                  value={formData.reorderPoint}
                  onChange={(e) => setFormData({ ...formData, reorderPoint: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label htmlFor="abcAnalysis">تحليل ABC</Label>
                <Select
                  value={formData.abcAnalysis}
                  onValueChange={(value) => setFormData({ ...formData, abcAnalysis: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A - High Value">A - قيمة عالية</SelectItem>
                    <SelectItem value="B - Medium Value">B - قيمة متوسطة</SelectItem>
                    <SelectItem value="C - Low Value">C - قيمة منخفضة</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="averageConsumptionPerMonth">متوسط الاستهلاك الشهري</Label>
                <Input
                  id="averageConsumptionPerMonth"
                  type="number"
                  step="0.01"
                  value={formData.averageConsumptionPerMonth}
                  onChange={(e) => setFormData({ ...formData, averageConsumptionPerMonth: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label htmlFor="averageConsumptionPerDay">متوسط الاستهلاك اليومي</Label>
                <Input
                  id="averageConsumptionPerDay"
                  type="number"
                  step="0.01"
                  value={formData.averageConsumptionPerDay}
                  onChange={(e) => setFormData({ ...formData, averageConsumptionPerDay: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="odooCategoryId">معرف فئة Odoo</Label>
              <Input
                id="odooCategoryId"
                value={formData.odooCategoryId}
                onChange={(e) => setFormData({ ...formData, odooCategoryId: e.target.value })}
                placeholder="يتم تعيينه بعد المزامنة مع Odoo"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setIsDialogOpen(false); resetForm(); }}>
                <X className="h-4 w-4 mr-2" />
                إلغاء
              </Button>
              <Button type="submit" disabled={loading}>
                <Save className="h-4 w-4 mr-2" />
                {loading ? 'جاري الحفظ...' : 'حفظ'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

