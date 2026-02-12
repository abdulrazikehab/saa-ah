import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Plug, Plus, Edit, Trash2, Loader2 } from 'lucide-react';
import { coreApi } from '@/lib/api';

interface Integration {
  id: string;
  name: string;
  type: string;
  provider: string;
  isActive: boolean;
  createdAt: string;
  config?: any;
}

const INTEGRATION_TYPES = [
  { value: 'ANALYTICS', label: 'تحليلات' },
  { value: 'SHIPPING', label: 'الشحن' },
  { value: 'EMAIL', label: 'البريد الإلكتروني' },
  { value: 'SMS', label: 'رسائل SMS' },
  { value: 'PAYMENT', label: 'الدفع' },
  { value: 'SOCIAL', label: 'وسائل التواصل' },
  { value: 'ACCOUNTING', label: 'محاسبة' },
  { value: 'SUPPLIER', label: 'الموردين' },
];

const getErrorMessage = (error: unknown): string => {
  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message);
  }
  if (error && typeof error === 'object' && 'response' in error) {
    const response = (error as { response?: { data?: { message?: string } } }).response;
    if (response?.data?.message) {
      return response.data.message;
    }
  }
  return 'حدث خطأ غير متوقع';
};

export default function IntegrationsSettings() {
  const { toast } = useToast();
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingIntegration, setEditingIntegration] = useState<Integration | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'ANALYTICS',
    provider: '',
    config: '',
    isActive: true,
  });

  useEffect(() => {
    loadIntegrations();
  }, []);

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'ANALYTICS',
      provider: '',
      config: '',
      isActive: true,
    });
    setEditingIntegration(null);
  };

  const loadIntegrations = async () => {
    try {
      setLoading(true);
      const response = await coreApi.get('/integrations', { requireAuth: true }).catch(() => []);
      // Validate response is an array of valid integration objects
      if (Array.isArray(response)) {
        const validIntegrations = response.filter((i: any) =>
          i && typeof i === 'object' && i.id && !('error' in i)
        );
        setIntegrations(validIntegrations);
      } else {
        setIntegrations([]);
      }
    } catch (error: any) {
      setIntegrations([]);
      toast({
        title: 'تعذر تحميل التكاملات',
        description: getErrorMessage(error) || 'حدث خطأ أثناء تحميل التكاملات. يرجى تحديث الصفحة.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let config = {};
      if (formData.config.trim()) {
        try {
          config = JSON.parse(formData.config);
        } catch {
          toast({
            title: 'خطأ في التنسيق',
            description: 'يجب أن يكون التكوين بصيغة JSON صحيحة',
            variant: 'destructive',
          });
          setLoading(false);
          return;
        }
      }

      if (editingIntegration) {
        // Update existing integration
        await coreApi.put(`/integrations/${encodeURIComponent(editingIntegration.id)}`, {
          name: formData.name,
          isActive: formData.isActive,
          config,
        }, { requireAuth: true });
        toast({
          title: 'نجح',
          description: 'تم تحديث التكامل بنجاح',
        });
      } else {
        // Create new integration
        await coreApi.post('/integrations', {
          name: formData.name,
          type: formData.type,
          provider: formData.provider,
          config,
        }, { requireAuth: true });
        toast({
          title: 'نجح',
          description: 'تم إضافة التكامل بنجاح',
        });
      }
      setIsDialogOpen(false);
      resetForm();
      await loadIntegrations();
    } catch (error: unknown) {
      toast({
        title: 'تعذر حفظ التكامل',
        description: getErrorMessage(error) || 'حدث خطأ أثناء حفظ التكامل. يرجى المحاولة مرة أخرى.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (integration: Integration) => {
    setEditingIntegration(integration);
    setFormData({
      name: integration.name,
      type: integration.type,
      provider: integration.provider,
      config: integration.config ? JSON.stringify(integration.config, null, 2) : '',
      isActive: integration.isActive,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا التكامل؟')) return;

    try {
      await coreApi.delete(`/integrations/${encodeURIComponent(id)}`, { requireAuth: true });
      toast({
        title: 'نجح',
        description: 'تم حذف التكامل بنجاح',
      });
      await loadIntegrations();
    } catch (error: unknown) {
      console.error('Failed to delete integration:', error);
      toast({
        title: 'تعذر حذف التكامل',
        description: getErrorMessage(error) || 'حدث خطأ أثناء حذف التكامل. يرجى المحاولة مرة أخرى.',
        variant: 'destructive',
      });
    }
  };

  const handleToggleActive = async (integration: Integration) => {
    try {
      await coreApi.put(`/integrations/${encodeURIComponent(integration.id)}`, {
        isActive: !integration.isActive,
      }, { requireAuth: true });
      toast({
        title: 'نجح',
        description: `تم ${!integration.isActive ? 'تفعيل' : 'تعطيل'} التكامل بنجاح`,
      });
      await loadIntegrations();
    } catch (error: unknown) {
      toast({
        title: 'تعذر تحديث حالة التكامل',
        description: getErrorMessage(error) || 'حدث خطأ أثناء تحديث حالة التكامل.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold mb-2">التكاملات</h2>
          <p className="text-gray-600 dark:text-gray-400">
            إدارة التكاملات مع الخدمات الخارجية
          </p>
        </div>
        <Button onClick={() => {
          resetForm();
          setIsDialogOpen(true);
        }}>
          <Plus className="mr-2 h-4 w-4" />
          إضافة تكامل
        </Button>
      </div>

      {loading && integrations.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Loader2 className="h-8 w-8 mx-auto animate-spin text-gray-400 mb-4" />
            <p className="text-gray-500">جاري التحميل...</p>
          </CardContent>
        </Card>
      ) : integrations.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Plug className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500 dark:text-gray-400 mb-4">لا توجد تكاملات مضافة</p>
            <Button onClick={() => {
              resetForm();
              setIsDialogOpen(true);
            }}>
              <Plus className="mr-2 h-4 w-4" />
              إضافة تكامل جديد
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {integrations.map((integration) => (
            <Card key={integration.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                      <Plug className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <CardTitle>{String(integration.name || '')}</CardTitle>
                      <CardDescription>{String(integration.provider || '')}</CardDescription>
                    </div>
                  </div>
                  <Switch
                    checked={integration.isActive}
                    onCheckedChange={() => handleToggleActive(integration)}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex flex-col gap-2">
                    <Badge variant={integration.isActive ? 'default' : 'secondary'}>
                      {integration.isActive ? 'نشط' : 'غير نشط'}
                    </Badge>
                    <Badge variant="outline">
                      {INTEGRATION_TYPES.find(t => t.value === integration.type)?.label || integration.type}
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(integration)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(integration.id)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingIntegration ? 'تعديل التكامل' : 'إضافة تكامل جديد'}</DialogTitle>
            <DialogDescription>
              {editingIntegration ? 'قم بتعديل معلومات التكامل' : 'أدخل معلومات التكامل الجديد'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">اسم التكامل *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="مثل: Google Analytics"
                  required
                />
              </div>
              {!editingIntegration && (
                <>
                  <div className="grid gap-2">
                    <Label htmlFor="type">نوع التكامل *</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value) => setFormData({ ...formData, type: value })}
                    >
                      <SelectTrigger id="type">
                        <SelectValue placeholder="اختر نوع التكامل" />
                      </SelectTrigger>
                      <SelectContent>
                        {INTEGRATION_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="provider">مزود الخدمة *</Label>
                    <Input
                      id="provider"
                      value={formData.provider}
                      onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                      placeholder="مثل: google_analytics, twilio"
                      required={!editingIntegration}
                    />
                  </div>
                </>
              )}
              <div className="grid gap-2">
                <Label htmlFor="config">التكوين (JSON)</Label>
                <Textarea
                  id="config"
                  value={formData.config}
                  onChange={(e) => setFormData({ ...formData, config: e.target.value })}
                  placeholder='{"apiKey": "your-key", "apiSecret": "your-secret"}'
                  rows={6}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  أدخل إعدادات التكامل بصيغة JSON (اختياري)
                </p>
              </div>
              {editingIntegration && (
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                  />
                  <Label htmlFor="isActive">تفعيل التكامل</Label>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false);
                  resetForm();
                }}
              >
                إلغاء
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingIntegration ? 'حفظ التغييرات' : 'إضافة التكامل'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

