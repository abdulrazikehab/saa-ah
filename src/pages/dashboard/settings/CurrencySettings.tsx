import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X, DollarSign, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { coreApi } from '@/lib/api';

interface Currency {
  id: string;
  code: string;
  name: string;
  nameAr?: string;
  symbol: string;
  exchangeRate: number;
  isActive: boolean;
}

interface CurrencySettings {
  baseCurrency: string;
  autoUpdateRates: boolean;
  lastUpdated?: string;
}

export default function CurrencySettings() {
  const { toast } = useToast();
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [settings, setSettings] = useState<CurrencySettings | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
  const [editingCurrency, setEditingCurrency] = useState<Currency | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    nameAr: '',
    symbol: '',
    exchangeRate: 1,
  });
  const [settingsData, setSettingsData] = useState({
    baseCurrency: 'SAR',
    autoUpdateRates: false,
  });

  useEffect(() => {
    loadCurrencies();
    loadSettings();
  }, []);

  const loadCurrencies = async () => {
    try {
      const response = await coreApi.get('/currencies');
      // Validate response is an array of valid currency objects
      if (Array.isArray(response)) {
        const validCurrencies = response.filter((c: any) =>
          c && typeof c === 'object' && c.id && c.code && !('error' in c)
        ) as Currency[];
        setCurrencies(validCurrencies);
      } else {
        setCurrencies([]);
      }
    } catch (error: any) {
      setCurrencies([]);
      toast({
        title: 'تعذر تحميل العملات',
        description: 'حدث خطأ أثناء تحميل العملات. يرجى تحديث الصفحة.',
        variant: 'destructive',
      });
    }
  };

  const loadSettings = async () => {
    try {
      const response = await coreApi.get('/currencies/settings');
      // Validate response is a valid settings object
      if (response && typeof response === 'object' && !('error' in response) && response.baseCurrency) {
        setSettings(response);
        setSettingsData({
          baseCurrency: String(response.baseCurrency || 'SAR'),
          autoUpdateRates: Boolean(response.autoUpdateRates || false),
        });
      }
    } catch (error: any) {
      // Settings might not exist yet, that's okay
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingCurrency) {
        await coreApi.put(`/currencies/${editingCurrency.code}`, {
          ...formData,
          exchangeRate: parseFloat(formData.exchangeRate.toString()),
        });
        toast({
          title: 'نجح',
          description: 'تم تحديث العملة بنجاح',
        });
      } else {
        await coreApi.post('/currencies', {
          ...formData,
          exchangeRate: parseFloat(formData.exchangeRate.toString()),
        });
        toast({
          title: 'نجح',
          description: 'تم إضافة العملة بنجاح',
        });
      }
      setIsDialogOpen(false);
      resetForm();
      loadCurrencies();
    } catch (error: any) {
      toast({
        title: 'تعذر حفظ العملة',
        description: 'حدث خطأ أثناء حفظ العملة. يرجى المحاولة مرة أخرى.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setLoading(true);
    try {
      await coreApi.put('/currencies/settings', settingsData);
      toast({
        title: 'نجح',
        description: 'تم حفظ إعدادات العملة بنجاح',
      });
      setIsSettingsDialogOpen(false);
      loadSettings();
      loadCurrencies(); // Reload to update exchange rates
    } catch (error: any) {
      toast({
        title: 'تعذر حفظ الإعدادات',
        description: 'حدث خطأ أثناء حفظ الإعدادات. يرجى المحاولة مرة أخرى.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (currency: Currency) => {
    setEditingCurrency(currency);
    setFormData({
      code: currency.code,
      name: currency.name,
      nameAr: currency.nameAr || '',
      symbol: currency.symbol,
      exchangeRate: Number(currency.exchangeRate),
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (code: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه العملة؟')) return;

    try {
      await coreApi.delete(`/currencies/${code}`);
      toast({
        title: 'نجح',
        description: 'تم حذف العملة بنجاح',
      });
      loadCurrencies();
    } catch (error: any) {
      toast({
        title: 'تعذر حذف العملة',
        description: 'حدث خطأ أثناء حذف العملة. يرجى المحاولة مرة أخرى.',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      nameAr: '',
      symbol: '',
      exchangeRate: 1,
    });
    setEditingCurrency(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">إدارة العملات</h2>
          <p className="text-gray-600 dark:text-gray-400">إدارة العملات وأسعار الصرف</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsSettingsDialogOpen(true)}>
            <DollarSign className="h-4 w-4 mr-2" />
            إعدادات العملة
          </Button>
          <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            إضافة عملة
          </Button>
        </div>
      </div>

      {settings && (
        <Card>
          <CardHeader>
            <CardTitle>إعدادات العملة الأساسية</CardTitle>
            <CardDescription>العملة الأساسية: {String(settings.baseCurrency || '')}</CardDescription>
          </CardHeader>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>قائمة العملات</CardTitle>
          <CardDescription>جميع العملات المتاحة في النظام</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الكود</TableHead>
                <TableHead>الاسم</TableHead>
                <TableHead>الرمز</TableHead>
                <TableHead>سعر الصرف</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currencies.map((currency) => (
                <TableRow key={currency.id}>
                  <TableCell>
                    <span className="font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                      {String(currency.code || '')}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{String(currency.name || '')}</div>
                      {currency.nameAr && typeof currency.nameAr === 'string' && (
                        <div className="text-sm text-gray-500">{currency.nameAr}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{String(currency.symbol || '')}</TableCell>
                  <TableCell>
                    {Number(currency.exchangeRate).toFixed(4)}
                    {currency.code === settings?.baseCurrency && (
                      <span className="ml-2 text-xs text-gray-500">(أساسي)</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded text-xs ${
                      currency.isActive ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                    }`}>
                      {currency.isActive ? 'نشط' : 'غير نشط'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(currency)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(currency.code)}>
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingCurrency ? 'تعديل عملة' : 'إضافة عملة جديدة'}</DialogTitle>
            <DialogDescription>املأ المعلومات التالية لإضافة عملة جديدة</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="code">كود العملة (ISO) *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  required
                  placeholder="مثال: USD, SAR, EUR"
                  className="font-mono"
                  disabled={!!editingCurrency}
                />
                <p className="text-xs text-gray-500 mt-1">كود ISO 4217 (3 أحرف)</p>
              </div>
              <div>
                <Label htmlFor="symbol">الرمز</Label>
                <Input
                  id="symbol"
                  value={formData.symbol}
                  onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                  required
                  placeholder="مثال: $, SAR, €"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">اسم العملة *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="مثال: US Dollar"
                />
              </div>
              <div>
                <Label htmlFor="nameAr">اسم العملة (عربي)</Label>
                <Input
                  id="nameAr"
                  value={formData.nameAr}
                  onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                  placeholder="مثال: الدولار الأمريكي"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="exchangeRate">سعر الصرف *</Label>
              <Input
                id="exchangeRate"
                type="number"
                min="0"
                step="0.0001"
                value={formData.exchangeRate}
                onChange={(e) => setFormData({ ...formData, exchangeRate: parseFloat(e.target.value) || 0 })}
                required
                placeholder="1.0000"
              />
              <p className="text-xs text-gray-500 mt-1">سعر الصرف مقابل العملة الأساسية (العملة الأساسية = 1.0000)</p>
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

      <Dialog open={isSettingsDialogOpen} onOpenChange={setIsSettingsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>إعدادات العملة</DialogTitle>
            <DialogDescription>اختر العملة الأساسية وإعدادات أسعار الصرف</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="baseCurrency">العملة الأساسية *</Label>
              <Select
                value={settingsData.baseCurrency}
                onValueChange={(value) => setSettingsData({ ...settingsData, baseCurrency: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((currency) => (
                    <SelectItem key={currency.code} value={currency.code}>
                      {currency.code} - {currency.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">العملة الأساسية التي يتم حساب جميع أسعار الصرف بالنسبة لها</p>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="autoUpdateRates">تحديث تلقائي لأسعار الصرف</Label>
                <p className="text-xs text-gray-500">تحديث أسعار الصرف تلقائياً من مصادر خارجية</p>
              </div>
              <Switch
                id="autoUpdateRates"
                checked={settingsData.autoUpdateRates}
                onCheckedChange={(checked) => setSettingsData({ ...settingsData, autoUpdateRates: checked })}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsSettingsDialogOpen(false)}>
                <X className="h-4 w-4 mr-2" />
                إلغاء
              </Button>
              <Button onClick={handleSaveSettings} disabled={loading}>
                <Save className="h-4 w-4 mr-2" />
                {loading ? 'جاري الحفظ...' : 'حفظ'}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

