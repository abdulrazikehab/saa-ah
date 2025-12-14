import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { coreApi } from '@/lib/api';

interface Unit {
  id: string;
  name: string;
  nameAr?: string;
  code: string;
  symbol?: string;
  cost: number;
  isActive: boolean;
  description?: string;
  createdAt: string;
}

export default function UnitSettings() {
  const { toast } = useToast();
  const [units, setUnits] = useState<Unit[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    nameAr: '',
    code: '',
    symbol: '',
    cost: 0,
    description: '',
  });

  useEffect(() => {
    loadUnits();
  }, []);

  const loadUnits = async () => {
    try {
      const response = await coreApi.get('/units');
      setUnits(Array.isArray(response) ? response : []);
    } catch (error: any) {
      toast({
        title: 'تعذر تحميل الوحدات',
        description: 'حدث خطأ أثناء تحميل الوحدات. يرجى تحديث الصفحة.',
        variant: 'destructive',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingUnit) {
        await coreApi.put(`/units/${editingUnit.id}`, {
          ...formData,
          cost: parseFloat(formData.cost.toString()),
        });
        toast({
          title: 'نجح',
          description: 'تم تحديث الوحدة بنجاح',
        });
      } else {
        await coreApi.post('/units', {
          ...formData,
          cost: parseFloat(formData.cost.toString()),
        });
        toast({
          title: 'نجح',
          description: 'تم إضافة الوحدة بنجاح',
        });
      }
      setIsDialogOpen(false);
      resetForm();
      loadUnits();
    } catch (error: any) {
      toast({
        title: 'تعذر حفظ الوحدة',
        description: 'حدث خطأ أثناء حفظ الوحدة. يرجى المحاولة مرة أخرى.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (unit: Unit) => {
    setEditingUnit(unit);
    setFormData({
      name: unit.name,
      nameAr: unit.nameAr || '',
      code: unit.code,
      symbol: unit.symbol || '',
      cost: Number(unit.cost),
      description: unit.description || '',
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الوحدة؟')) return;

    try {
      await coreApi.delete(`/units/${id}`);
      toast({
        title: 'نجح',
        description: 'تم حذف الوحدة بنجاح',
      });
      loadUnits();
    } catch (error: any) {
      toast({
        title: 'تعذر حذف الوحدة',
        description: 'حدث خطأ أثناء حذف الوحدة. يرجى المحاولة مرة أخرى.',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      nameAr: '',
      code: '',
      symbol: '',
      cost: 0,
      description: '',
    });
    setEditingUnit(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">إدارة الوحدات</h2>
          <p className="text-gray-600 dark:text-gray-400">إضافة وإدارة وحدات القياس مع تكلفتها بالعملة الأساسية</p>
        </div>
        <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          إضافة وحدة
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>قائمة الوحدات</CardTitle>
          <CardDescription>جميع وحدات القياس المسجلة في النظام</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الاسم</TableHead>
                <TableHead>الكود</TableHead>
                <TableHead>الرمز</TableHead>
                <TableHead>التكلفة (العملة الأساسية)</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {units.map((unit) => (
                <TableRow key={unit.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{unit.name}</div>
                      {unit.nameAr && (
                        <div className="text-sm text-gray-500">{unit.nameAr}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                      {unit.code}
                    </span>
                  </TableCell>
                  <TableCell>{unit.symbol || '-'}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Package className="h-4 w-4" />
                      {Number(unit.cost).toFixed(2)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded text-xs ${
                      unit.isActive ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                    }`}>
                      {unit.isActive ? 'نشط' : 'غير نشط'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(unit)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(unit.id)}>
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingUnit ? 'تعديل وحدة' : 'إضافة وحدة جديدة'}</DialogTitle>
            <DialogDescription>املأ المعلومات التالية لإضافة وحدة قياس جديدة</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">اسم الوحدة *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="مثال: قطعة"
                />
              </div>
              <div>
                <Label htmlFor="nameAr">اسم الوحدة (عربي)</Label>
                <Input
                  id="nameAr"
                  value={formData.nameAr}
                  onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                  placeholder="مثال: قطعة"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="code">كود الوحدة *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  required
                  placeholder="مثال: PC"
                  className="font-mono"
                />
                <p className="text-xs text-gray-500 mt-1">يستخدم كمعرف فريد للوحدة</p>
              </div>
              <div>
                <Label htmlFor="symbol">الرمز</Label>
                <Input
                  id="symbol"
                  value={formData.symbol}
                  onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                  placeholder="مثال: pcs"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="cost">التكلفة (بالعملة الأساسية) *</Label>
              <Input
                id="cost"
                type="number"
                min="0"
                step="0.01"
                value={formData.cost}
                onChange={(e) => setFormData({ ...formData, cost: parseFloat(e.target.value) || 0 })}
                required
                placeholder="0.00"
              />
              <p className="text-xs text-gray-500 mt-1">التكلفة بالعملة الأساسية المحددة في إعدادات العملة</p>
            </div>

            <div>
              <Label htmlFor="description">الوصف</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
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

