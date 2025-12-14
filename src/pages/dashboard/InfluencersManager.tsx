import { useState, useEffect, useCallback } from 'react';
import { Users, Plus, TrendingUp, DollarSign, Eye, Edit, Trash2, Link as LinkIcon, Copy, Check, Instagram, Youtube } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { coreApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface Influencer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  platform: 'INSTAGRAM' | 'YOUTUBE' | 'TIKTOK' | 'SNAPCHAT' | 'TWITTER';
  handle: string;
  followers: number;
  commissionType: 'PERCENTAGE' | 'FIXED' | 'PER_SALE';
  commissionValue: number;
  totalSales: number;
  totalCommission: number;
  clicks: number;
  conversions: number;
  status: 'ACTIVE' | 'PENDING' | 'PAUSED';
  joinedAt: string;
  avatar?: string;
}

export default function InfluencersManager() {
  const { toast } = useToast();
  const [influencers, setInfluencers] = useState<Influencer[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingInfluencer, setEditingInfluencer] = useState<Influencer | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    platform: 'INSTAGRAM' as 'INSTAGRAM' | 'YOUTUBE' | 'TIKTOK' | 'SNAPCHAT' | 'TWITTER',
    handle: '',
    followers: '',
    commissionType: 'PERCENTAGE' as 'PERCENTAGE' | 'FIXED' | 'PER_SALE',
    commissionValue: '',
  });

  const loadInfluencers = useCallback(async () => {
    try {
      const data = await coreApi.get('/influencers', { requireAuth: true });
      setInfluencers(data.influencers || []);
    } catch (error) {
      console.error('Failed to load influencers:', error);
      toast({
        title: 'تعذر تحميل المؤثرين',
        description: 'حدث خطأ أثناء تحميل المؤثرين. يرجى تحديث الصفحة.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadInfluencers();
  }, [loadInfluencers]);

  const saveInfluencer = async () => {
    try {
      setSaving(true);
      const influencerData = {
        ...formData,
        followers: parseInt(formData.followers),
        commissionValue: parseFloat(formData.commissionValue),
      };

      if (editingInfluencer) {
        await coreApi.put(`/influencers/${editingInfluencer.id}`, influencerData, { requireAuth: true });
        toast({ title: 'نجح', description: 'تم تحديث المؤثر بنجاح' });
      } else {
        await coreApi.post('/influencers', influencerData, { requireAuth: true });
        toast({ title: 'نجح', description: 'تم إضافة المؤثر بنجاح' });
      }

      setIsAddDialogOpen(false);
      setEditingInfluencer(null);
      resetForm();
      loadInfluencers();
    } catch (error) {
      console.error('Failed to save influencer:', error);
      toast({
        title: 'تعذر حفظ المؤثر',
        description: 'حدث خطأ أثناء حفظ المؤثر. يرجى المحاولة مرة أخرى.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const deleteInfluencer = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المؤثر؟')) return;

    try {
      await coreApi.delete(`/influencers/${id}`, { requireAuth: true });
      toast({ title: 'نجح', description: 'تم حذف المؤثر بنجاح' });
      loadInfluencers();
    } catch (error) {
      console.error('Failed to delete influencer:', error);
      toast({
        title: 'تعذر حذف المؤثر',
        description: 'حدث خطأ أثناء حذف المؤثر. يرجى المحاولة مرة أخرى.',
        variant: 'destructive',
      });
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await coreApi.put(`/influencers/${id}/status`, { status }, { requireAuth: true });
      loadInfluencers();
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const copyReferralLink = (id: string) => {
    const link = `${window.location.origin}?inf=${id}`;
    navigator.clipboard.writeText(link);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
    toast({ title: 'تم النسخ', description: 'تم نسخ رابط الإحالة' });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      platform: 'INSTAGRAM',
      handle: '',
      followers: '',
      commissionType: 'PERCENTAGE',
      commissionValue: '',
    });
  };

  const openEditDialog = (influencer: Influencer) => {
    setEditingInfluencer(influencer);
    setFormData({
      name: influencer.name,
      email: influencer.email,
      phone: influencer.phone || '',
      platform: influencer.platform,
      handle: influencer.handle,
      followers: influencer.followers.toString(),
      commissionType: influencer.commissionType,
      commissionValue: influencer.commissionValue.toString(),
    });
    setIsAddDialogOpen(true);
  };

  const getPlatformIcon = (platform: string) => {
    const icons = {
      INSTAGRAM: <Instagram className="h-4 w-4" />,
      YOUTUBE: <Youtube className="h-4 w-4" />,
      TIKTOK: <span className="text-sm">🎵</span>,
      SNAPCHAT: <span className="text-sm">👻</span>,
      TWITTER: <span className="text-sm">🐦</span>,
    };
    return icons[platform as keyof typeof icons];
  };

  const getStatusBadge = (status: string) => {
    const config = {
      ACTIVE: { label: 'نشط', className: 'bg-green-500/10 text-green-700 border-green-500/20' },
      PENDING: { label: 'قيد المراجعة', className: 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20' },
      PAUSED: { label: 'متوقف', className: 'bg-gray-500/10 text-gray-700 border-gray-500/20' },
    };
    const { label, className } = config[status as keyof typeof config] || config.PENDING;
    return <Badge variant="outline" className={className}>{label}</Badge>;
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const stats = {
    total: influencers.length,
    active: influencers.filter(i => i.status === 'ACTIVE').length,
    totalSales: influencers.reduce((sum, i) => sum + i.totalSales, 0),
    totalCommission: influencers.reduce((sum, i) => sum + i.totalCommission, 0),
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">المؤثرين</h1>
          <p className="text-sm text-gray-500 mt-1">إدارة شراكات المؤثرين والعمولات</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" onClick={resetForm}>
              <Plus className="h-4 w-4" />
              إضافة مؤثر
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingInfluencer ? 'تعديل مؤثر' : 'إضافة مؤثر جديد'}</DialogTitle>
              <DialogDescription>أدخل بيانات المؤثر وشروط العمولة</DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>الاسم</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="أحمد المؤثر"
                  />
                </div>
                <div>
                  <Label>البريد الإلكتروني</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="influencer@example.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>المنصة</Label>
                  <Select value={formData.platform} onValueChange={(value: any) => setFormData({ ...formData, platform: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INSTAGRAM">Instagram</SelectItem>
                      <SelectItem value="YOUTUBE">YouTube</SelectItem>
                      <SelectItem value="TIKTOK">TikTok</SelectItem>
                      <SelectItem value="SNAPCHAT">Snapchat</SelectItem>
                      <SelectItem value="TWITTER">Twitter</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>اسم المستخدم</Label>
                  <Input
                    value={formData.handle}
                    onChange={(e) => setFormData({ ...formData, handle: e.target.value })}
                    placeholder="@username"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>عدد المتابعين</Label>
                  <Input
                    type="number"
                    value={formData.followers}
                    onChange={(e) => setFormData({ ...formData, followers: e.target.value })}
                    placeholder="100000"
                  />
                </div>
                <div>
                  <Label>رقم الهاتف</Label>
                  <Input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+966 50 123 4567"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>نوع العمولة</Label>
                  <Select value={formData.commissionType} onValueChange={(value: any) => setFormData({ ...formData, commissionType: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PERCENTAGE">نسبة مئوية (%)</SelectItem>
                      <SelectItem value="FIXED">مبلغ ثابت (ريال)</SelectItem>
                      <SelectItem value="PER_SALE">لكل عملية بيع</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>قيمة العمولة</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.commissionValue}
                    onChange={(e) => setFormData({ ...formData, commissionValue: e.target.value })}
                    placeholder="10"
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                إلغاء
              </Button>
              <Button onClick={saveInfluencer} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : null}
                {editingInfluencer ? 'تحديث' : 'إضافة'}
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
                <p className="text-sm text-gray-600 dark:text-gray-400">إجمالي المؤثرين</p>
                <p className="text-2xl font-bold mt-1">{stats.total}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-r-4 border-r-green-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">مؤثرون نشطون</p>
                <p className="text-2xl font-bold mt-1">{stats.active}</p>
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

      {/* Influencers Table */}
      <Card>
        <CardContent className="p-0">
          {influencers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold mb-2">لا يوجد مؤثرون</h3>
              <p className="text-gray-500 mb-4">ابدأ بإضافة مؤثر جديد</p>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="h-4 w-4 ml-2" />
                إضافة مؤثر
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>المؤثر</TableHead>
                  <TableHead>المنصة</TableHead>
                  <TableHead>المتابعون</TableHead>
                  <TableHead>العمولة</TableHead>
                  <TableHead>المبيعات</TableHead>
                  <TableHead>التحويلات</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {influencers.map((influencer) => (
                  <TableRow key={influencer.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={influencer.avatar} />
                          <AvatarFallback>{influencer.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{influencer.name}</p>
                          <p className="text-sm text-gray-500">{influencer.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getPlatformIcon(influencer.platform)}
                        <span className="text-sm">{influencer.handle}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold">
                      {formatNumber(influencer.followers)}
                    </TableCell>
                    <TableCell>
                      {influencer.commissionType === 'PERCENTAGE' && `${influencer.commissionValue}%`}
                      {influencer.commissionType === 'FIXED' && `${influencer.commissionValue} ريال`}
                      {influencer.commissionType === 'PER_SALE' && `${influencer.commissionValue} ريال/بيع`}
                    </TableCell>
                    <TableCell className="font-semibold">
                      {influencer.totalSales.toFixed(2)} ريال
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p>{influencer.conversions} / {influencer.clicks}</p>
                        <p className="text-gray-500">
                          {influencer.clicks > 0 ? ((influencer.conversions / influencer.clicks) * 100).toFixed(1) : 0}%
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={influencer.status}
                        onValueChange={(value) => updateStatus(influencer.id, value)}
                      >
                        <SelectTrigger className="w-[140px]">
                          {getStatusBadge(influencer.status)}
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ACTIVE">نشط</SelectItem>
                          <SelectItem value="PENDING">قيد المراجعة</SelectItem>
                          <SelectItem value="PAUSED">متوقف</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => copyReferralLink(influencer.id)}
                          title="نسخ رابط الإحالة"
                        >
                          {copiedCode === influencer.id ? (
                            <Check className="h-4 w-4 text-green-600" />
                          ) : (
                            <LinkIcon className="h-4 w-4" />
                          )}
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(influencer)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteInfluencer(influencer.id)}>
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
