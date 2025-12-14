import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { coreApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface Button {
  label: string;
  url: string;
  variant: 'primary' | 'secondary' | 'outline';
  openInNewTab: boolean;
}

export default function HeaderFooterSettings() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [headerButtons, setHeaderButtons] = useState<Button[]>([]);
  const [footerButtons, setFooterButtons] = useState<Button[]>([]);
  const [editingHeaderIndex, setEditingHeaderIndex] = useState<number | null>(null);
  const [editingFooterIndex, setEditingFooterIndex] = useState<number | null>(null);

  const [headerButtonForm, setHeaderButtonForm] = useState<Button>({
    label: '',
    url: '',
    variant: 'primary',
    openInNewTab: false,
  });

  const [footerButtonForm, setFooterButtonForm] = useState<Button>({
    label: '',
    url: '',
    variant: 'primary',
    openInNewTab: false,
  });

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const config = await coreApi.get('/site-config', { requireAuth: true });
      setHeaderButtons(config.header?.buttons || []);
      setFooterButtons(config.footer?.buttons || []);
    } catch (error) {
      console.error('Failed to load config:', error);
      toast({
        title: 'تعذر تحميل الإعدادات',
        description: 'حدث خطأ أثناء تحميل الإعدادات. يرجى تحديث الصفحة.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    try {
      setSaving(true);
      await coreApi.put('/site-config', {
        header: { buttons: headerButtons },
        footer: { buttons: footerButtons },
      }, { requireAuth: true });
      
      toast({
        title: 'نجح',
        description: 'تم حفظ الإعدادات بنجاح',
      });
    } catch (error) {
      console.error('Failed to save config:', error);
      toast({
        title: 'تعذر حفظ الإعدادات',
        description: 'حدث خطأ أثناء حفظ الإعدادات. يرجى المحاولة مرة أخرى.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const addHeaderButton = () => {
    if (!headerButtonForm.label || !headerButtonForm.url) {
      toast({
        title: 'حقول مطلوبة ناقصة',
        description: 'يرجى ملء اسم الزر والرابط قبل الإضافة',
        variant: 'destructive',
      });
      return;
    }

    if (editingHeaderIndex !== null) {
      const updated = [...headerButtons];
      updated[editingHeaderIndex] = headerButtonForm;
      setHeaderButtons(updated);
      setEditingHeaderIndex(null);
    } else {
      setHeaderButtons([...headerButtons, headerButtonForm]);
    }

    setHeaderButtonForm({ label: '', url: '', variant: 'primary', openInNewTab: false });
  };

  const addFooterButton = () => {
    if (!footerButtonForm.label || !footerButtonForm.url) {
      toast({
        title: 'حقول مطلوبة ناقصة',
        description: 'يرجى ملء اسم الزر والرابط قبل الإضافة',
        variant: 'destructive',
      });
      return;
    }

    if (editingFooterIndex !== null) {
      const updated = [...footerButtons];
      updated[editingFooterIndex] = footerButtonForm;
      setFooterButtons(updated);
      setEditingFooterIndex(null);
    } else {
      setFooterButtons([...footerButtons, footerButtonForm]);
    }

    setFooterButtonForm({ label: '', url: '', variant: 'primary', openInNewTab: false });
  };

  const editHeaderButton = (index: number) => {
    setHeaderButtonForm(headerButtons[index]);
    setEditingHeaderIndex(index);
  };

  const editFooterButton = (index: number) => {
    setFooterButtonForm(footerButtons[index]);
    setEditingFooterIndex(index);
  };

  const deleteHeaderButton = (index: number) => {
    setHeaderButtons(headerButtons.filter((_, i) => i !== index));
  };

  const deleteFooterButton = (index: number) => {
    setFooterButtons(footerButtons.filter((_, i) => i !== index));
  };

  const cancelHeaderEdit = () => {
    setEditingHeaderIndex(null);
    setHeaderButtonForm({ label: '', url: '', variant: 'primary', openInNewTab: false });
  };

  const cancelFooterEdit = () => {
    setEditingFooterIndex(null);
    setFooterButtonForm({ label: '', url: '', variant: 'primary', openInNewTab: false });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">إعدادات الأزرار</h1>
          <p className="text-sm text-gray-500 mt-1">إدارة أزرار الهيدر والفوتر</p>
        </div>
        <Button onClick={saveConfig} disabled={saving} className="gap-2">
          <Save className="h-4 w-4" />
          {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
        </Button>
      </div>

      <Tabs defaultValue="header" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="header">أزرار الهيدر</TabsTrigger>
          <TabsTrigger value="footer">أزرار الفوتر</TabsTrigger>
        </TabsList>

        {/* Header Buttons Tab */}
        <TabsContent value="header" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>إضافة زر جديد للهيدر</CardTitle>
              <CardDescription>الأزرار ستظهر في شريط التنقل العلوي</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="header-label">نص الزر</Label>
                  <Input
                    id="header-label"
                    value={headerButtonForm.label}
                    onChange={(e) => setHeaderButtonForm({ ...headerButtonForm, label: e.target.value })}
                    placeholder="مثال: تواصل معنا"
                  />
                </div>
                <div>
                  <Label htmlFor="header-url">الرابط</Label>
                  <Input
                    id="header-url"
                    value={headerButtonForm.url}
                    onChange={(e) => setHeaderButtonForm({ ...headerButtonForm, url: e.target.value })}
                    placeholder="/contact أو https://example.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="header-variant">نوع الزر</Label>
                  <Select
                    value={headerButtonForm.variant}
                    onValueChange={(value: 'primary' | 'secondary' | 'outline') =>
                      setHeaderButtonForm({ ...headerButtonForm, variant: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="primary">أساسي (Primary)</SelectItem>
                      <SelectItem value="secondary">ثانوي (Secondary)</SelectItem>
                      <SelectItem value="outline">محدد (Outline)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <Label htmlFor="header-new-tab">فتح في تبويب جديد</Label>
                  <Switch
                    id="header-new-tab"
                    checked={headerButtonForm.openInNewTab}
                    onCheckedChange={(checked) =>
                      setHeaderButtonForm({ ...headerButtonForm, openInNewTab: checked })
                    }
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={addHeaderButton} className="gap-2">
                  {editingHeaderIndex !== null ? (
                    <>
                      <Save className="h-4 w-4" />
                      تحديث الزر
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      إضافة الزر
                    </>
                  )}
                </Button>
                {editingHeaderIndex !== null && (
                  <Button variant="outline" onClick={cancelHeaderEdit} className="gap-2">
                    <X className="h-4 w-4" />
                    إلغاء
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Header Buttons List */}
          {headerButtons.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>الأزرار الحالية ({headerButtons.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {headerButtons.map((button, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{button.label}</span>
                          <span className={`text-xs px-2 py-1 rounded ${
                            button.variant === 'primary' ? 'bg-primary/10 text-primary' :
                            button.variant === 'secondary' ? 'bg-gray-200 dark:bg-gray-700' :
                            'border border-primary text-primary'
                          }`}>
                            {button.variant}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">{button.url}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => editHeaderButton(index)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteHeaderButton(index)}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Footer Buttons Tab */}
        <TabsContent value="footer" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>إضافة زر جديد للفوتر</CardTitle>
              <CardDescription>الأزرار ستظهر في قسم التواصل بالفوتر</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="footer-label">نص الزر</Label>
                  <Input
                    id="footer-label"
                    value={footerButtonForm.label}
                    onChange={(e) => setFooterButtonForm({ ...footerButtonForm, label: e.target.value })}
                    placeholder="مثال: اشترك الآن"
                  />
                </div>
                <div>
                  <Label htmlFor="footer-url">الرابط</Label>
                  <Input
                    id="footer-url"
                    value={footerButtonForm.url}
                    onChange={(e) => setFooterButtonForm({ ...footerButtonForm, url: e.target.value })}
                    placeholder="/subscribe أو https://example.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="footer-variant">نوع الزر</Label>
                  <Select
                    value={footerButtonForm.variant}
                    onValueChange={(value: 'primary' | 'secondary' | 'outline') =>
                      setFooterButtonForm({ ...footerButtonForm, variant: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="primary">أساسي (Primary)</SelectItem>
                      <SelectItem value="secondary">ثانوي (Secondary)</SelectItem>
                      <SelectItem value="outline">محدد (Outline)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <Label htmlFor="footer-new-tab">فتح في تبويب جديد</Label>
                  <Switch
                    id="footer-new-tab"
                    checked={footerButtonForm.openInNewTab}
                    onCheckedChange={(checked) =>
                      setFooterButtonForm({ ...footerButtonForm, openInNewTab: checked })
                    }
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={addFooterButton} className="gap-2">
                  {editingFooterIndex !== null ? (
                    <>
                      <Save className="h-4 w-4" />
                      تحديث الزر
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      إضافة الزر
                    </>
                  )}
                </Button>
                {editingFooterIndex !== null && (
                  <Button variant="outline" onClick={cancelFooterEdit} className="gap-2">
                    <X className="h-4 w-4" />
                    إلغاء
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Footer Buttons List */}
          {footerButtons.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>الأزرار الحالية ({footerButtons.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {footerButtons.map((button, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{button.label}</span>
                          <span className={`text-xs px-2 py-1 rounded ${
                            button.variant === 'primary' ? 'bg-primary/10 text-primary' :
                            button.variant === 'secondary' ? 'bg-gray-200 dark:bg-gray-700' :
                            'border border-primary text-primary'
                          }`}>
                            {button.variant}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">{button.url}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => editFooterButton(index)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteFooterButton(index)}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
