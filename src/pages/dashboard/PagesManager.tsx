import { useState, useEffect } from 'react';
import { coreApi } from '@/lib/api';
import { templateService, Template } from '@/services/template.service';
import { Page } from '@/services/types';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Plus, Edit, Trash2, Search, Eye, Copy, FileText, 
  Sparkles, LayoutTemplate, Globe, Calendar, Loader2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';

export default function PagesManager() {
  const [pages, setPages] = useState<Page[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [tenantSubdomain, setTenantSubdomain] = useState<string>('');
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Helper function to generate storefront URL
  const getStorefrontPageUrl = (slug: string): string => {
    const subdomain = tenantSubdomain || user?.tenantSubdomain || 'market';
    const protocol = window.location.protocol;
    const port = window.location.port;
    const portPart = port ? `:${port}` : '';
    
    // For local development
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return `${protocol}//${subdomain}.localhost${portPart}/${slug}`;
    }
    
    // For production
    return `${protocol}//${subdomain}.saa'ah.com/${slug}`;
  };

  useEffect(() => {
    loadPages();
    loadTemplates();
    loadTenantInfo();
  }, []);

  const loadTenantInfo = async () => {
    try {
      const config = await coreApi.get('/site-config', { requireAuth: true });
      if (config?.settings?.subdomain) {
        setTenantSubdomain(config.settings.subdomain);
      }
    } catch (error) {
      console.error('Failed to load tenant info:', error);
    }
  };

  const loadPages = async () => {
    try {
      const data = await coreApi.getPages();
      setPages(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load pages:', error);
      toast({
        title: 'خطأ',
        description: 'فشل تحميل الصفحات',
        variant: 'destructive',
      });
      setPages([]);
    } finally {
      setLoading(false);
    }
  };

  const loadTemplates = async () => {
    try {
      const data = await templateService.getTemplates();
      setTemplates(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load templates:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الصفحة؟')) return;

    try {
      await coreApi.deletePage(id);
      toast({ title: 'تم الحذف', description: 'تم حذف الصفحة بنجاح' });
      loadPages();
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'فشل حذف الصفحة',
        variant: 'destructive',
      });
    }
  };

  const handleDuplicate = async (page: Page) => {
    try {
      await coreApi.createPage({
        title: `${page.title} (نسخة)`,
        slug: `${page.slug}-copy-${Date.now()}`,
        content: page.content,
        isPublished: false,
      });
      toast({ title: 'تم النسخ', description: 'تم نسخ الصفحة بنجاح' });
      loadPages();
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'فشل نسخ الصفحة',
        variant: 'destructive',
      });
    }
  };

  const handleCreateFromTemplate = (templateId: string) => {
    setShowTemplateDialog(false);
    navigate(`/dashboard/pages/new?templateId=${templateId}`);
  };

  const filteredPages = pages.filter(page =>
    page.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    page.slug?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    total: pages.length,
    published: pages.filter(p => p.isPublished).length,
    drafts: pages.filter(p => !p.isPublished).length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            إدارة الصفحات
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2 text-lg">
            أنشئ وأدر صفحات موقعك الإلكتروني
          </p>
        </div>
        <div className="flex gap-3">
          <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="lg" className="border-2">
                <LayoutTemplate className="ml-2 h-5 w-5" />
                من قالب
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-2xl">اختر قالباً</DialogTitle>
                <DialogDescription>
                  ابدأ بقالب احترافي جاهز وخصصه حسب احتياجاتك
                </DialogDescription>
              </DialogHeader>
              <div className="grid md:grid-cols-2 gap-4 mt-4">
                {templates.map((template) => (
                  <Card 
                    key={template.id} 
                    className="cursor-pointer hover:shadow-lg transition-all border-2 hover:border-indigo-500"
                    onClick={() => handleCreateFromTemplate(template.id)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{template.name}</CardTitle>
                          <CardDescription className="mt-1">
                            {template.description}
                          </CardDescription>
                        </div>
                        <Badge className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
                          {template.category}
                        </Badge>
                      </div>
                    </CardHeader>
                    {template.preview && (
                      <CardContent>
                        <img 
                          src={template.preview} 
                          alt={template.name}
                          className="w-full h-40 object-cover rounded-lg"
                        />
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>
            </DialogContent>
          </Dialog>

          <Button 
            size="lg" 
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg"
            onClick={() => navigate('/dashboard/pages/new')}
          >
            <Plus className="ml-2 h-5 w-5" />
            صفحة جديدة
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-0 shadow-md">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">إجمالي الصفحات</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
              </div>
              <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
                <FileText className="h-6 w-6 text-indigo-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">منشورة</p>
                <p className="text-3xl font-bold text-green-600">{stats.published}</p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
                <Globe className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">مسودات</p>
                <p className="text-3xl font-bold text-yellow-600">{stats.drafts}</p>
              </div>
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl">
                <Edit className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card className="border-0 shadow-md">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              placeholder="ابحث عن صفحة..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10 h-12 border-2"
            />
          </div>
        </CardContent>
      </Card>

      {/* Pages Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-12 w-12 animate-spin text-indigo-600" />
        </div>
      ) : filteredPages.length === 0 ? (
        <Card className="border-0 shadow-lg">
          <CardContent className="py-16 text-center">
            <FileText className="h-20 w-20 mx-auto text-gray-400 mb-4" />
            <h3 className="text-2xl font-bold mb-2">
              {searchQuery ? 'لا توجد نتائج' : 'لا توجد صفحات بعد'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
              {searchQuery 
                ? 'جرب كلمات بحث مختلفة' 
                : 'ابدأ بإنشاء صفحتك الأولى من قالب أو من الصفر'}
            </p>
            {!searchQuery && (
              <div className="flex gap-3 justify-center">
                <Button onClick={() => setShowTemplateDialog(true)} variant="outline" size="lg">
                  <LayoutTemplate className="ml-2 h-5 w-5" />
                  تصفح القوالب
                </Button>
                <Button onClick={() => navigate('/dashboard/pages/new')} size="lg" className="bg-gradient-to-r from-indigo-600 to-purple-600">
                  <Plus className="ml-2 h-5 w-5" />
                  إنشاء صفحة
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPages.map((page) => (
            <Card key={page.id} className="border-0 shadow-md hover:shadow-xl transition-all group">
              <CardHeader>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <CardTitle className="text-xl mb-2 group-hover:text-indigo-600 transition-colors">
                      {page.title}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      /{page.slug}
                    </CardDescription>
                  </div>
                  <Badge 
                    variant={page.isPublished ? 'default' : 'secondary'}
                    className={page.isPublished 
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                      : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'}
                  >
                    {page.isPublished ? 'منشورة' : 'مسودة'}
                  </Badge>
                </div>
                {page.updatedAt && (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Calendar className="h-4 w-4" />
                    {new Date(page.updatedAt).toLocaleDateString('ar-SA')}
                  </div>
                )}
              </CardHeader>
              <Separator />
              <CardContent className="pt-4">
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 border-2"
                    onClick={() => navigate(`/dashboard/pages/${page.id}`)}
                  >
                    <Edit className="ml-2 h-4 w-4" />
                    تعديل
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-2"
                    onClick={() => handleDuplicate(page)}
                    title="نسخ الصفحة"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-2"
                    onClick={() => window.open(getStorefrontPageUrl(page.slug), '_blank')}
                    title="معاينة"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(page.id)}
                    title="حذف"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
