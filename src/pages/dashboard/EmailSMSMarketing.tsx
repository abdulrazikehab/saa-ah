import { useState, useEffect, useCallback } from 'react';
import { Mail, MessageSquare, Plus, Send, Calendar, Users, BarChart3, Edit, Trash2, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { coreApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

interface Campaign {
  id: string;
  name: string;
  type: 'EMAIL' | 'SMS';
  subject?: string;
  message: string;
  segment: 'ALL' | 'LOYAL' | 'INACTIVE' | 'CUSTOM';
  schedule: 'IMMEDIATE' | 'SCHEDULED' | 'RECURRING';
  scheduledDate?: string;
  recurringDays?: string[];
  status: 'DRAFT' | 'SCHEDULED' | 'SENT' | 'RUNNING';
  sent: number;
  opened?: number;
  clicked?: number;
  converted?: number;
  createdAt: string;
}

export default function EmailSMSMarketing() {
  const { toast } = useToast();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isAddCampaignOpen, setIsAddCampaignOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    type: 'EMAIL' as const,
    subject: '',
    message: '',
    segment: 'ALL' as const,
    schedule: 'IMMEDIATE' as const,
    scheduledDate: '',
    recurringDays: [] as string[],
  });

  const loadCampaigns = useCallback(async () => {
    try {
      const data = await coreApi.get('/marketing/email-sms', { requireAuth: true });
      setCampaigns(data.campaigns || []);
    } catch (error) {
      console.error('Failed to load campaigns:', error);
      toast({
        title: 'تعذر تحميل الحملات',
        description: 'حدث خطأ أثناء تحميل الحملات. يرجى تحديث الصفحة.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadCampaigns();
  }, [loadCampaigns]);

  const saveCampaign = async () => {
    try {
      setSaving(true);
      await coreApi.post('/marketing/email-sms', formData, { requireAuth: true });
      toast({
        title: 'نجح',
        description: 'تم إنشاء الحملة بنجاح',
      });
      setIsAddCampaignOpen(false);
      resetForm();
      loadCampaigns();
    } catch (error) {
      console.error('Failed to save campaign:', error);
      toast({
        title: 'تعذر حفظ الحملة',
        description: 'حدث خطأ أثناء حفظ الحملة. يرجى المحاولة مرة أخرى.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const deleteCampaign = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الحملة؟')) return;

    try {
      await coreApi.delete(`/marketing/email-sms/${id}`, { requireAuth: true });
      toast({ title: 'نجح', description: 'تم حذف الحملة بنجاح' });
      loadCampaigns();
    } catch (error) {
      console.error('Failed to delete campaign:', error);
      toast({
        title: 'تعذر حذف الحملة',
        description: 'حدث خطأ أثناء حذف الحملة. يرجى المحاولة مرة أخرى.',
        variant: 'destructive',
      });
    }
  };

  const toggleRecurringDay = (day: string) => {
    const days = formData.recurringDays.includes(day)
      ? formData.recurringDays.filter(d => d !== day)
      : [...formData.recurringDays, day];
    setFormData({ ...formData, recurringDays: days });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'EMAIL',
      subject: '',
      message: '',
      segment: 'ALL',
      schedule: 'IMMEDIATE',
      scheduledDate: '',
      recurringDays: [],
    });
  };

  const getStatusBadge = (status: string) => {
    const config = {
      DRAFT: { label: 'مسودة', className: 'bg-gray-500/10 text-gray-700 border-gray-500/20' },
      SCHEDULED: { label: 'مجدولة', className: 'bg-blue-500/10 text-blue-700 border-blue-500/20' },
      SENT: { label: 'تم الإرسال', className: 'bg-green-500/10 text-green-700 border-green-500/20' },
      RUNNING: { label: 'قيد التشغيل', className: 'bg-purple-500/10 text-purple-700 border-purple-500/20' },
    };
    const { label, className } = config[status as keyof typeof config] || config.DRAFT;
    return <Badge variant="outline" className={className}>{label}</Badge>;
  };

  const weekDays = [
    { value: 'MON', label: 'الإثنين' },
    { value: 'TUE', label: 'الثلاثاء' },
    { value: 'WED', label: 'الأربعاء' },
    { value: 'THU', label: 'الخميس' },
    { value: 'FRI', label: 'الجمعة' },
    { value: 'SAT', label: 'السبت' },
    { value: 'SUN', label: 'الأحد' },
  ];

  const stats = {
    totalCampaigns: campaigns.length,
    sentCampaigns: campaigns.filter(c => c.status === 'SENT').length,
    totalSent: campaigns.reduce((sum, c) => sum + c.sent, 0),
    avgOpenRate: campaigns.length > 0 
      ? (campaigns.reduce((sum, c) => sum + ((c.opened || 0) / (c.sent || 1) * 100), 0) / campaigns.length).toFixed(1)
      : '0',
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">التسويق عبر البريد والرسائل</h1>
          <p className="text-sm text-gray-500 mt-1">إدارة حملات البريد الإلكتروني والرسائل النصية</p>
        </div>
        <Dialog open={isAddCampaignOpen} onOpenChange={setIsAddCampaignOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" onClick={resetForm}>
              <Plus className="h-4 w-4" />
              إنشاء حملة
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>إنشاء حملة جديدة</DialogTitle>
              <DialogDescription>
                قم بإنشاء حملة بريد إلكتروني أو رسائل نصية
              </DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="content" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="content">المحتوى</TabsTrigger>
                <TabsTrigger value="audience">الجمهور</TabsTrigger>
                <TabsTrigger value="schedule">الجدولة</TabsTrigger>
              </TabsList>

              <TabsContent value="content" className="space-y-4 mt-4">
                <div>
                  <Label>اسم الحملة</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="حملة منتصف الأسبوع"
                  />
                </div>

                <div>
                  <Label>نوع الحملة</Label>
                  <Select value={formData.type} onValueChange={(value: any) => setFormData({ ...formData, type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EMAIL">بريد إلكتروني</SelectItem>
                      <SelectItem value="SMS">رسالة نصية</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.type === 'EMAIL' && (
                  <div>
                    <Label>عنوان الرسالة</Label>
                    <Input
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      placeholder="عرض خاص لك!"
                    />
                  </div>
                )}

                <div>
                  <Label>محتوى الرسالة</Label>
                  <Textarea
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder={formData.type === 'EMAIL' 
                      ? 'مرحباً {{name}}،\n\nلديك عرض خاص...'
                      : 'عرض خاص! خصم 20% على جميع المنتجات. استخدم الكود: MIDWEEK'
                    }
                    rows={8}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    يمكنك استخدام: {'{'}{'{'} name {'}'}{'}'}, {'{'}{'{'} email {'}'}{'}'}, {'{'}{'{'} phone {'}'}{'}'}
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="audience" className="space-y-4 mt-4">
                <div>
                  <Label>الجمهور المستهدف</Label>
                  <Select value={formData.segment} onValueChange={(value: any) => setFormData({ ...formData, segment: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">جميع العملاء</SelectItem>
                      <SelectItem value="LOYAL">العملاء المخلصون</SelectItem>
                      <SelectItem value="INACTIVE">العملاء غير النشطين</SelectItem>
                      <SelectItem value="CUSTOM">مخصص</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Card className="bg-blue-50 dark:bg-blue-900/10 border-blue-200">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <Users className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-blue-900 dark:text-blue-100">نصيحة</p>
                        <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                          استهدف العملاء غير النشطين في منتصف الأسبوع لتحفيز المبيعات
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="schedule" className="space-y-4 mt-4">
                <div>
                  <Label>نوع الجدولة</Label>
                  <Select value={formData.schedule} onValueChange={(value: any) => setFormData({ ...formData, schedule: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="IMMEDIATE">إرسال فوري</SelectItem>
                      <SelectItem value="SCHEDULED">جدولة لمرة واحدة</SelectItem>
                      <SelectItem value="RECURRING">جدولة متكررة</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.schedule === 'SCHEDULED' && (
                  <div>
                    <Label>تاريخ ووقت الإرسال</Label>
                    <Input
                      type="datetime-local"
                      value={formData.scheduledDate}
                      onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                    />
                  </div>
                )}

                {formData.schedule === 'RECURRING' && (
                  <div>
                    <Label>أيام التكرار</Label>
                    <div className="grid grid-cols-4 gap-2 mt-2">
                      {weekDays.map((day) => (
                        <Button
                          key={day.value}
                          type="button"
                          variant={formData.recurringDays.includes(day.value) ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => toggleRecurringDay(day.value)}
                        >
                          {day.label}
                        </Button>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      مثالي لحملات منتصف الأسبوع (الثلاثاء، الأربعاء، الخميس)
                    </p>
                  </div>
                )}

                <Card className="bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <Calendar className="h-5 w-5 text-yellow-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-yellow-900 dark:text-yellow-100">حملة تقلب المبيعات</p>
                        <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                          قم بجدولة حملات متكررة في منتصف الأسبوع لتحفيز المبيعات في الأيام الأقل نشاطاً
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddCampaignOpen(false)}>
                إلغاء
              </Button>
              <Button onClick={saveCampaign} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin ml-2" />
                    جاري الإنشاء...
                  </>
                ) : (
                  formData.schedule === 'IMMEDIATE' ? 'إرسال الآن' : 'جدولة الحملة'
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
                <p className="text-sm text-gray-600 dark:text-gray-400">إجمالي الحملات</p>
                <p className="text-2xl font-bold mt-1">{stats.totalCampaigns}</p>
              </div>
              <Mail className="h-8 w-8 text-blue-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-r-4 border-r-green-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">حملات مرسلة</p>
                <p className="text-2xl font-bold mt-1">{stats.sentCampaigns}</p>
              </div>
              <Send className="h-8 w-8 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-r-4 border-r-purple-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">إجمالي المرسل</p>
                <p className="text-2xl font-bold mt-1">{stats.totalSent}</p>
              </div>
              <Users className="h-8 w-8 text-purple-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-r-4 border-r-cyan-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">معدل الفتح</p>
                <p className="text-2xl font-bold mt-1">{stats.avgOpenRate}%</p>
              </div>
              <BarChart3 className="h-8 w-8 text-cyan-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Campaigns Table */}
      <Card>
        <CardContent className="p-0">
          {campaigns.length === 0 ? (
            <div className="text-center py-12">
              <Mail className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold mb-2">لا توجد حملات</h3>
              <p className="text-gray-500 mb-4">ابدأ بإنشاء حملتك الأولى</p>
              <Button onClick={() => setIsAddCampaignOpen(true)}>
                <Plus className="h-4 w-4 ml-2" />
                إنشاء حملة
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الحملة</TableHead>
                  <TableHead>النوع</TableHead>
                  <TableHead>الجمهور</TableHead>
                  <TableHead>المرسل</TableHead>
                  <TableHead>الفتح</TableHead>
                  <TableHead>النقرات</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.map((campaign) => (
                  <TableRow key={campaign.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{campaign.name}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(campaign.createdAt).toLocaleDateString('ar-SA')}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {campaign.type === 'EMAIL' ? (
                          <><Mail className="h-3 w-3 ml-1" /> بريد</>
                        ) : (
                          <><MessageSquare className="h-3 w-3 ml-1" /> SMS</>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {campaign.segment === 'ALL' && 'الكل'}
                      {campaign.segment === 'LOYAL' && 'مخلصون'}
                      {campaign.segment === 'INACTIVE' && 'غير نشطين'}
                      {campaign.segment === 'CUSTOM' && 'مخصص'}
                    </TableCell>
                    <TableCell className="font-semibold">{campaign.sent}</TableCell>
                    <TableCell>
                      {campaign.opened ? `${((campaign.opened / campaign.sent) * 100).toFixed(1)}%` : '-'}
                    </TableCell>
                    <TableCell>
                      {campaign.clicked ? `${((campaign.clicked / campaign.sent) * 100).toFixed(1)}%` : '-'}
                    </TableCell>
                    <TableCell>{getStatusBadge(campaign.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteCampaign(campaign.id)}>
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
