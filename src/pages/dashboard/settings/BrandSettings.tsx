import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X, Package, Download, Upload } from 'lucide-react';
import { read, utils, writeFile } from 'xlsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
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
    minQuantity: '',
    maxQuantity: '',
    enableSlider: false,
    applySliderToAllProducts: false,
  });

  useEffect(() => {
    loadBrands();
  }, []);

  const loadBrands = async () => {
    try {
      const response = await coreApi.getBrands();
      // Validate response is an array of valid brand objects
      if (Array.isArray(response)) {
        const validBrands = response.filter((b: any) =>
          b && typeof b === 'object' && b.id && !('error' in b)
        );
        setBrands(validBrands);
      } else {
        setBrands([]);
      }
    } catch (error: any) {
      setBrands([]);
      toast({
        title: 'تعذر تحميل العلامات التجارية',
        description: 'حدث خطأ أثناء تحميل العلامات التجارية. يرجى تحديث الصفحة.',
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
          minQuantity: formData.minQuantity ? parseInt(formData.minQuantity) : undefined,
          maxQuantity: formData.maxQuantity ? parseInt(formData.maxQuantity) : undefined,
          enableSlider: formData.enableSlider,
          applySliderToAllProducts: formData.applySliderToAllProducts,
        });
        toast({
          title: 'نجح',
          description: 'تم تحديث العلامة التجارية بنجاح',
        });
      } else {
        await coreApi.createBrand({
          ...formData,
          rechargeUsdValue: parseFloat(formData.rechargeUsdValue.toString()),
          usdValueForCoins: parseFloat(formData.usdValueForCoins.toString()),
          safetyStock: parseFloat(formData.safetyStock.toString()),
          reorderPoint: parseFloat(formData.reorderPoint.toString()),
          averageConsumptionPerMonth: parseFloat(formData.averageConsumptionPerMonth.toString()),
          averageConsumptionPerDay: parseFloat(formData.averageConsumptionPerDay.toString()),
          minQuantity: formData.minQuantity ? parseInt(formData.minQuantity) : undefined,
          maxQuantity: formData.maxQuantity ? parseInt(formData.maxQuantity) : undefined,
          enableSlider: formData.enableSlider,
          applySliderToAllProducts: formData.applySliderToAllProducts,
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
        title: 'تعذر حفظ العلامة التجارية',
        description: 'حدث خطأ أثناء حفظ العلامة التجارية. يرجى المحاولة مرة أخرى.',
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
      minQuantity: (brand as any).minQuantity?.toString() || '',
      maxQuantity: (brand as any).maxQuantity?.toString() || '',
      enableSlider: (brand as any).enableSlider || false,
      applySliderToAllProducts: (brand as any).applySliderToAllProducts || false,
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
        title: 'تعذر حذف العلامة التجارية',
        description: 'حدث خطأ أثناء حذف العلامة التجارية. يرجى المحاولة مرة أخرى.',
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
      minQuantity: '',
      maxQuantity: '',
      enableSlider: false,
      applySliderToAllProducts: false,
    });
    setEditingBrand(null);
  };

  const handleExport = () => {
    const headers = [
      'ID',
      'Name',
      'NameAr',
      'Code',
      'ShortName',
      'BrandType',
      'Status',
      'RechargeUsdValue',
      'UsdValueForCoins',
      'SafetyStock',
      'LeadTime',
      'ReorderPoint',
      'AverageConsumptionPerMonth',
      'AverageConsumptionPerDay',
      'AbcAnalysis',
      'OdooCategoryId',
      'CreatedAt'
    ];

    const exportData = brands.map(brand => ({
      ID: brand.id || '',
      Name: brand.name || '',
      NameAr: brand.nameAr || '',
      Code: brand.code || '',
      ShortName: brand.shortName || '',
      BrandType: brand.brandType || '',
      Status: brand.status || '',
      RechargeUsdValue: brand.rechargeUsdValue || 0,
      UsdValueForCoins: brand.usdValueForCoins || 0,
      SafetyStock: brand.safetyStock || 0,
      LeadTime: brand.leadTime || 0,
      ReorderPoint: brand.reorderPoint || 0,
      AverageConsumptionPerMonth: brand.averageConsumptionPerMonth || 0,
      AverageConsumptionPerDay: brand.averageConsumptionPerDay || 0,
      AbcAnalysis: brand.abcAnalysis || '',
      OdooCategoryId: brand.odooCategoryId || '',
      CreatedAt: brand.createdAt || '',
    }));

    const ws = utils.json_to_sheet(exportData, { header: headers });
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, 'Brands');
    writeFile(wb, 'brands_export.xlsx');
    
    toast({
      title: 'نجح',
      description: 'تم تصدير العلامات التجارية بنجاح',
    });
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      const data = await file.arrayBuffer();
      const workbook = read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = utils.sheet_to_json<{
        Name: string;
        NameAr?: string;
        Code?: string;
        ShortName?: string;
        BrandType?: string;
        Status?: string;
        RechargeUsdValue?: number | string;
        UsdValueForCoins?: number | string;
        SafetyStock?: number | string;
        LeadTime?: number | string;
        ReorderPoint?: number | string;
        AverageConsumptionPerMonth?: number | string;
        AverageConsumptionPerDay?: number | string;
        AbcAnalysis?: string;
        OdooCategoryId?: string;
      }>(worksheet, { defval: '' });

      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i];
        const rowNum = i + 2; // Excel row number (1-indexed + header)

        if (!row.Name || !row.Name.trim()) {
          errors.push(`Row ${rowNum}: Name is required`);
          errorCount++;
          continue;
        }

        try {
          await coreApi.createBrand({
            name: row.Name.trim(),
            nameAr: row.NameAr?.trim() || undefined,
            code: row.Code?.trim() || undefined,
            shortName: row.ShortName?.trim() || undefined,
            brandType: row.BrandType?.trim() || undefined,
            status: row.Status?.trim() || 'Active',
            rechargeUsdValue: row.RechargeUsdValue 
              ? (typeof row.RechargeUsdValue === 'string' ? parseFloat(row.RechargeUsdValue.replace(/[^\d.-]/g, '')) || 0 : row.RechargeUsdValue)
              : 0,
            usdValueForCoins: row.UsdValueForCoins
              ? (typeof row.UsdValueForCoins === 'string' ? parseFloat(row.UsdValueForCoins.replace(/[^\d.-]/g, '')) || 0 : row.UsdValueForCoins)
              : 0,
            safetyStock: row.SafetyStock
              ? (typeof row.SafetyStock === 'string' ? parseInt(row.SafetyStock.replace(/[^\d]/g, '')) || 0 : row.SafetyStock)
              : 0,
            leadTime: row.LeadTime
              ? (typeof row.LeadTime === 'string' ? parseInt(row.LeadTime.replace(/[^\d]/g, '')) || 0 : row.LeadTime)
              : 0,
            reorderPoint: row.ReorderPoint
              ? (typeof row.ReorderPoint === 'string' ? parseInt(row.ReorderPoint.replace(/[^\d]/g, '')) || 0 : row.ReorderPoint)
              : 0,
            averageConsumptionPerMonth: row.AverageConsumptionPerMonth
              ? (typeof row.AverageConsumptionPerMonth === 'string' ? parseFloat(row.AverageConsumptionPerMonth.replace(/[^\d.-]/g, '')) || 0 : row.AverageConsumptionPerMonth)
              : 0,
            averageConsumptionPerDay: row.AverageConsumptionPerDay
              ? (typeof row.AverageConsumptionPerDay === 'string' ? parseFloat(row.AverageConsumptionPerDay.replace(/[^\d.-]/g, '')) || 0 : row.AverageConsumptionPerDay)
              : 0,
            abcAnalysis: row.AbcAnalysis?.trim() || undefined,
            odooCategoryId: row.OdooCategoryId?.trim() || undefined,
          });
          successCount++;
        } catch (error: any) {
          const errorMsg = error?.message || 'Unknown error';
          errors.push(`Row ${rowNum} (${row.Name}): ${errorMsg}`);
          errorCount++;
        }
      }

      const errorText = errors.length > 0 
        ? `\n\nErrors:\n${errors.slice(0, 10).join('\n')}${errors.length > 10 ? `\n... and ${errors.length - 10} more errors` : ''}`
        : '';

      toast({
        title: successCount > 0 ? 'نجح الاستيراد' : 'فشل الاستيراد',
        description: `تم استيراد ${successCount} علامة تجارية${successCount !== 1 ? '' : ''}${errorCount > 0 ? `، فشل ${errorCount}` : ''}${errorText}`,
        variant: errorCount > successCount ? 'destructive' : 'default',
      });
      
      loadBrands();
      e.target.value = '';
    } catch (error: any) {
      toast({ 
        title: 'تعذر استيراد العلامات التجارية', 
        description: error?.message || 'حدث خطأ أثناء قراءة ملف الاستيراد. تأكد من صحة تنسيق الملف.', 
        variant: 'destructive' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">إدارة العلامات التجارية</h2>
          <p className="text-gray-600 dark:text-gray-400">إضافة وإدارة العلامات التجارية للمنتجات</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            تصدير
          </Button>
          <label>
            <Button variant="outline" asChild>
              <span>
                <Upload className="h-4 w-4 mr-2" />
                استيراد
              </span>
            </Button>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleImport}
              className="hidden"
            />
          </label>
          <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            إضافة علامة تجارية
          </Button>
        </div>
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
                      <div className="font-medium">{String(brand.name || '')}</div>
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

            {/* Quantity Slider Section for Supplier API Integration */}
            <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="enableSlider" className="text-base font-semibold">
                    شريط الكمية للشراء (Slider)
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    تفعيل شريط اختيار الكمية عند الشراء - سيتم تطبيقه على جميع منتجات هذه العلامة التجارية
                  </p>
                </div>
                <Switch
                  id="enableSlider"
                  checked={formData.enableSlider}
                  onCheckedChange={(checked) => setFormData({ ...formData, enableSlider: checked })}
                />
              </div>
              
              {formData.enableSlider && (
                <>
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div>
                      <Label htmlFor="minQuantity">الحد الأدنى للكمية</Label>
                      <Input
                        id="minQuantity"
                        type="number"
                        min="1"
                        value={formData.minQuantity}
                        onChange={(e) => setFormData({ ...formData, minQuantity: e.target.value })}
                        placeholder="1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="maxQuantity">الحد الأقصى للكمية</Label>
                      <Input
                        id="maxQuantity"
                        type="number"
                        min="1"
                        value={formData.maxQuantity}
                        onChange={(e) => setFormData({ ...formData, maxQuantity: e.target.value })}
                        placeholder="100"
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 pt-2">
                    <Switch
                      id="applySliderToAllProducts"
                      checked={formData.applySliderToAllProducts}
                      onCheckedChange={(checked) => setFormData({ ...formData, applySliderToAllProducts: checked })}
                    />
                    <Label htmlFor="applySliderToAllProducts" className="text-sm">
                      تطبيق على جميع منتجات هذه العلامة التجارية
                    </Label>
                  </div>
                </>
              )}
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

