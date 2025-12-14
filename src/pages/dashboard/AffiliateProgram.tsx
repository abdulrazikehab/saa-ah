import { useState, useEffect, useCallback } from 'react';
import { Users, Plus, DollarSign, TrendingUp, Link as LinkIcon, Copy, Check, Settings as SettingsIcon, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { coreApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface Affiliate {
  id: string;
  name: string;
  email: string;
  phone?: string;
  code: string;
  commissionType: 'PERCENTAGE' | 'FIXED';
  commissionValue: number;
  totalSales: number;
  totalCommission: number;
  clicks: number;
  conversions: number;
  status: 'ACTIVE' | 'PENDING' | 'SUSPENDED';
  joinedAt: string;
}

interface AffiliateSettings {
  enabled: boolean;
  commissionType: 'PERCENTAGE' | 'FIXED';
  commissionValue: number;
  cookieDuration: number;
  minPayout: number;
  autoApprove: boolean;
  allowSelfReferral: boolean;
}

export default function AffiliateProgram() {
  const { toast } = useToast();
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [settings, setSettings] = useState<AffiliateSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [inviteEmails, setInviteEmails] = useState('');

  const loadAffiliateData = useCallback(async () => {
    try {
      const [affiliatesData, settingsData] = await Promise.all([
        coreApi.get('/affiliate/affiliates', { requireAuth: true }),
        coreApi.get('/affiliate/settings', { requireAuth: true }),
      ]);

      setAffiliates(affiliatesData.affiliates || []);
      setSettings(settingsData.settings || {
        enabled: false,
        commissionType: 'PERCENTAGE',
        commissionValue: 10,
        cookieDuration: 30,
        minPayout: 100,
        autoApprove: false,
        allowSelfReferral: false,
      });
    } catch (error) {
      console.error('Failed to load affiliate data:', error);
      toast({
        title: 'تعذر تحميل بيانات برنامج الشركاء',
        description: 'حدث خطأ أثناء تحميل البيانات. يرجى تحديث الصفحة.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadAffiliateData();
  }, [loadAffiliateData]);

  const saveSettings = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      await coreApi.post('/affiliate/settings', settings, { requireAuth: true });
      toast({
        title: 'نجح',
        description: 'تم حفظ إعدادات برنامج الشركاء بنجاح',
      });
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast({
        title: 'تعذر حفظ الإعدادات',
        description: 'حدث خطأ أثناء حفظ الإعدادات. يرجى المحاولة مرة أخرى.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const inviteTopCustomers = async () => {
    try {
      setSaving(true);
      await coreApi.post('/affiliate/invite-top-customers', { count: 50 }, { requireAuth: true });
      toast({
        title: 'نجح',
        description: 'تم إرسال دعوات لأفضل 50 عميل',
      });
      setIsInviteDialogOpen(false);
    } catch (error) {
      console.error('Failed to invite customers:', error);
      toast({
        title: 'تعذر إرسال الدعوات',
        description: 'حدث خطأ أثناء إرسال دعوات العملاء. يرجى المحاولة مرة أخرى.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const inviteByEmail = async () => {
    if (!inviteEmails.trim()) return;
    
    try {
      setSaving(true);
      const emails = inviteEmails.split(',').map(e => e.trim()).filter(e => e);
      await coreApi.post('/affiliate/invite', { emails }, { requireAuth: true });
      toast({
        title: 'نجح',
        description: `تم إرسال ${emails.length} دعوة بنجاح`,
      });
      setInviteEmails('');
      setIsInviteDialogOpen(false);
    } catch (error) {
      console.error('Failed to send invites:', error);
      toast({
        title: 'تعذر إرسال الدعوات',
        description: 'حدث خطأ أثناء إرسال الدعوات. يرجى المحاولة مرة أخرى.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const copyAffiliateLink = (code: string) => {
    const link = `${window.location.origin}?ref=${code}`;
    navigator.clipboard.writeText(link);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
    toast({ title: 'تم النسخ', description: 'تم نسخ رابط الإحالة' });
  };

  const updateAffiliate = async (id: string, status: string) => {
    try {
      await coreApi.put(`/affiliate/affiliates/${id}`, { status }, { requireAuth: true });
      loadAffiliateData();
      toast({ title: 'نجح', description: 'تم تحديث حالة الشريك' });
    } catch (error) {
      console.error('Failed to update affiliate:', error);
      toast({
        title: 'تعذر تحديث حالة الشريك',
        description: 'حدث خطأ أثناء تحديث حالة الشريك. يرجى المحاولة مرة أخرى.',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const config = {
      ACTIVE: { label: 'نشط', className: 'bg-green-500/10 text-green-700 border-green-500/20' },
      PENDING: { label: 'قيد المراجعة', className: 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20' },
      SUSPENDED: { label: 'موقوف', className: 'bg-red-500/10 text-red-700 border-red-500/20' },
    };
    const { label, className } = config[status as keyof typeof config] || config.PENDING;
    return <Badge variant="outline" className={className}>{label}</Badge>;
  };

  const stats = {
    totalAffiliates: affiliates.length,
    activeAffiliates: affiliates.filter(a => a.status === 'ACTIVE').length,
    totalSales: affiliates.reduce((sum, a) => sum + a.totalSales, 0),
    totalCommission: affiliates.reduce((sum, a) => sum + a.totalCommission, 0),
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">برنامج الشركاء</h1>
          <p className="text-sm text-gray-500 mt-1">إدارة الشركاء والعمولات</p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Users className="h-4 w-4" />
                دعوة شركاء
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>دعوة شركاء جدد</DialogTitle>
                <DialogDescription>
                  قم بدعوة عملائك المميزين ليصبحوا شركاء
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <Label>دعوة أفضل 50 عميل</Label>
                  <p className="text-sm text-gray-500 mb-3">
                    سيتم إرسال دعوات تلقائية لأفضل 50 عميل بناءً على الولاء والمشتريات
                  </p>
                  <Button onClick={inviteTopCustomers} disabled={saving} className="w-full">
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin ml-2" />
                        جاري الإرسال...
                      </>
                    ) : (
                      'إرسال الدعوات'
                    )}
                  </Button>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">أو</span>
                  </div>
                </div>

                <div>
                  <Label>دعوة بالبريد الإلكتروني</Label>
                  <Input
                    value={inviteEmails}
                    onChange={(e) => setInviteEmails(e.target.value)}
                    placeholder="email1@example.com, email2@example.com"
                    className="mt-2"
                  />
                  <p className="text-xs text-gray-500 mt-1">افصل بين الإيميلات بفاصلة</p>
                  <Button onClick={inviteByEmail} disabled={saving || !inviteEmails.trim()} className="w-full mt-3">
                    إرسال الدعوات
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-r-4 border-r-blue-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">إجمالي الشركاء</p>
                <p className="text-2xl font-bold mt-1">{stats.totalAffiliates}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-r-4 border-r-green-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">شركاء نشطون</p>
                <p className="text-2xl font-bold mt-1">{stats.activeAffiliates}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-r-4 border-r-purple-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">إجمالي المبيعات</p>
                <p className="text-2xl font-bold mt-1">{stats.totalSales.toFixed(2)} ريال</p>
              </div>
              <DollarSign className="h-8 w-8 text-purple-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-r-4 border-r-cyan-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">إجمالي العمولات</p>
                <p className="text-2xl font-bold mt-1">{stats.totalCommission.toFixed(2)} ريال</p>
              </div>
              <DollarSign className="h-8 w-8 text-cyan-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="affiliates" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="affiliates">الشركاء</TabsTrigger>
          <TabsTrigger value="settings">الإعدادات</TabsTrigger>
        </TabsList>

        {/* Affiliates Tab */}
        <TabsContent value="affiliates" className="space-y-4">
          <Card>
            <CardContent className="p-0">
              {affiliates.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-xl font-semibold mb-2">لا يوجد شركاء</h3>
                  <p className="text-gray-500 mb-4">ابدأ بدعوة عملائك المميزين</p>
                  <Button onClick={() => setIsInviteDialogOpen(true)}>
                    <Users className="h-4 w-4 ml-2" />
                    دعوة شركاء
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>الشريك</TableHead>
                      <TableHead>الكود</TableHead>
                      <TableHead>العمولة</TableHead>
                      <TableHead>المبيعات</TableHead>
                      <TableHead>النقرات</TableHead>
                      <TableHead>التحويلات</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead>الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {affiliates.map((affiliate) => (
                      <TableRow key={affiliate.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{affiliate.name}</p>
                            <p className="text-sm text-gray-500">{affiliate.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <code className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-sm">
                              {affiliate.code}
                            </code>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => copyAffiliateLink(affiliate.code)}
                            >
                              {copiedCode === affiliate.code ? (
                                <Check className="h-3 w-3 text-green-600" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold">
                          {affiliate.commissionType === 'PERCENTAGE' 
                            ? `${affiliate.commissionValue}%`
                            : `${affiliate.commissionValue} ريال`
                          }
                        </TableCell>
                        <TableCell>{affiliate.totalSales.toFixed(2)} ريال</TableCell>
                        <TableCell>{affiliate.clicks}</TableCell>
                        <TableCell>{affiliate.conversions}</TableCell>
                        <TableCell>
                          <Select
                            value={affiliate.status}
                            onValueChange={(value) => updateAffiliate(affiliate.id, value)}
                          >
                            <SelectTrigger className="w-[140px]">
                              {getStatusBadge(affiliate.status)}
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ACTIVE">نشط</SelectItem>
                              <SelectItem value="PENDING">قيد المراجعة</SelectItem>
                              <SelectItem value="SUSPENDED">موقوف</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon">
                            <Download className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>إعدادات برنامج الشركاء</CardTitle>
                  <CardDescription>تكوين العمولات والشروط</CardDescription>
                </div>
                <Button onClick={saveSettings} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin ml-2" />
                      جاري الحفظ...
                    </>
                  ) : (
                    'حفظ التغييرات'
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label>تفعيل برنامج الشركاء</Label>
                  <p className="text-sm text-gray-500">السماح للعملاء بالانضمام كشركاء</p>
                </div>
                <Switch
                  checked={settings?.enabled ?? false}
                  onCheckedChange={(checked) => setSettings(settings ? { ...settings, enabled: checked } : null)}
                />
              </div>

              {settings?.enabled && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>نوع العمولة</Label>
                      <Select 
                        value={settings.commissionType} 
                        onValueChange={(value: any) => setSettings({ ...settings, commissionType: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PERCENTAGE">نسبة مئوية (%)</SelectItem>
                          <SelectItem value="FIXED">مبلغ ثابت (ريال)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>قيمة العمولة</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={settings.commissionValue}
                        onChange={(e) => setSettings({ ...settings, commissionValue: parseFloat(e.target.value) })}
                        placeholder="10"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>مدة الكوكيز (أيام)</Label>
                      <Input
                        type="number"
                        value={settings.cookieDuration}
                        onChange={(e) => setSettings({ ...settings, cookieDuration: parseInt(e.target.value) })}
                        placeholder="30"
                      />
                      <p className="text-xs text-gray-500 mt-1">المدة التي يتم فيها تتبع الإحالة</p>
                    </div>

                    <div>
                      <Label>الحد الأدنى للسحب (ريال)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={settings.minPayout}
                        onChange={(e) => setSettings({ ...settings, minPayout: parseFloat(e.target.value) })}
                        placeholder="100"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <Label>الموافقة التلقائية</Label>
                      <p className="text-sm text-gray-500">قبول الشركاء الجدد تلقائياً</p>
                    </div>
                    <Switch
                      checked={settings.autoApprove}
                      onCheckedChange={(checked) => setSettings({ ...settings, autoApprove: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <Label>السماح بالإحالة الذاتية</Label>
                      <p className="text-sm text-gray-500">السماح للشركاء باستخدام روابطهم الخاصة</p>
                    </div>
                    <Switch
                      checked={settings.allowSelfReferral}
                      onCheckedChange={(checked) => setSettings({ ...settings, allowSelfReferral: checked })}
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
