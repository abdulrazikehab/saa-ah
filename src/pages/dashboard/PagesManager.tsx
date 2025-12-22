import { useState, useEffect } from 'react';
import { coreApi } from '@/lib/api';
import { templateService, Template } from '@/services/template.service';
import { pageService } from '@/services/page.service';
import { Page } from '@/services/types';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Plus, Edit, Trash2, Search, Eye, Copy, FileText, 
  Sparkles, LayoutTemplate, Globe, Calendar, Loader2, Store, AlertCircle,
  Zap, ShoppingBag, RefreshCw
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/contexts/AuthContext';
import MarketSetupPrompt from '@/components/dashboard/MarketSetupPrompt';

export default function PagesManager() {
  const [pages, setPages] = useState<Page[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPages, setSelectedPages] = useState<Set<string>>(new Set());
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [newPageTitle, setNewPageTitle] = useState('');
  const [tenantSubdomain, setTenantSubdomain] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();

  const getPageUrl = (slug: string) => {
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    const port = window.location.port;
    const portPart = port ? `:${port}` : '';
    const subdomain = tenantSubdomain || 'default';
    
    // Base domain for production (saeaa.com)
    const baseDomain = 'saeaa.com';
    
    // For local development
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return `${protocol}//${subdomain}.localhost${portPart}/${slug}`;
    }
    
    // Always use subdomain format for production: subdomain.saeaa.com (e.g., market.saeaa.com)
    return `${protocol}//${subdomain}.${baseDomain}/${slug}`;
  };

  useEffect(() => {
    loadPages();
    loadTemplates();
    loadTenantInfo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Check if user has a market/store set up
  const hasMarket = !!(user?.tenantId && user.tenantId !== 'default' && user.tenantId !== 'system');
  
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
      setLoading(true);
      const tenantId = user?.tenantId;
      
      // Use pageService which handles the API call properly
      const data = await pageService.getPages(true);
      
      // Handle response - pageService already returns an array
      let pagesArray: Page[] = Array.isArray(data) ? data : [];
      
      // Filter out any invalid pages
      pagesArray = pagesArray.filter((page: Page) => 
        page && 
        typeof page === 'object' && 
        page.id && 
        !('error' in (page as unknown as Record<string, unknown>)) && 
        !('statusCode' in (page as unknown as Record<string, unknown>))
      );
      
      setPages(pagesArray);
    } catch (error) {
      console.error('Failed to load pages:', error);
      toast({
        title: 'خطأ في التحميل',
        description: 'فشل تحميل الصفحات. يرجى المحاولة مرة أخرى.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadTemplates = async () => {
    try {
      const data = await templateService.getTemplates();
      setTemplates(data);
    } catch (error) {
      console.error('Failed to load templates:', error);
    }
  };

  const handleCreatePage = async () => {
    if (!newPageTitle.trim()) return;
    
    try {
      setLoading(true);
      const slug = newPageTitle.toLowerCase().replace(/\s+/g, '-');
      await coreApi.createPage({
        title: newPageTitle,
        slug,
        content: { sections: [] },
        isPublished: false
      });
      
      toast({
        title: 'تم إنشاء الصفحة',
        description: 'تم إنشاء الصفحة بنجاح.',
      });
      
      setNewPageTitle('');
      setShowCreateDialog(false);
      loadPages();
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'فشل إنشاء الصفحة.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePage = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الصفحة؟')) return;
    
    try {
      setLoading(true);
      await coreApi.deletePage(id);
      toast({
        title: 'تم الحذف',
        description: 'تم حذف الصفحة بنجاح.',
      });
      loadPages();
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'فشل حذف الصفحة.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedPages.size === 0) return;
    if (!confirm(`هل أنت متأكد من حذف ${selectedPages.size} صفحة؟`)) return;
    
    try {
      setLoading(true);
      await Promise.all(Array.from(selectedPages).map(id => coreApi.deletePage(id)));
      toast({
        title: 'تم الحذف',
        description: `تم حذف ${selectedPages.size} صفحة بنجاح.`,
      });
      setSelectedPages(new Set());
      loadPages();
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'فشل حذف بعض الصفحات.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDuplicatePage = async (page: Page) => {
    try {
      setLoading(true);
      await coreApi.createPage({
        title: `${page.title} (نسخة)`,
        slug: `${page.slug}-copy-${Date.now()}`,
        content: page.content,
        isPublished: false
      });
      toast({
        title: 'تم النسخ',
        description: 'تم نسخ الصفحة بنجاح.',
      });
      loadPages();
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'فشل نسخ الصفحة.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFromTemplate = async (template: Template) => {
    try {
      setLoading(true);
      // Use template ID or name for slug if slug doesn't exist
      const templateSlug = template.name.toLowerCase().replace(/\s+/g, '-');
      await coreApi.createPage({
        title: template.name,
        slug: `${templateSlug}-${Date.now()}`,
        content: template.content as unknown as Record<string, unknown>,
        isPublished: false
      });
      toast({
        title: 'تم الإنشاء',
        description: 'تم إنشاء الصفحة من القالب بنجاح.',
      });
      setShowTemplateDialog(false);
      loadPages();
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'فشل إنشاء الصفحة من القالب.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const togglePageSelection = (id: string) => {
    const newSelection = new Set(selectedPages);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedPages(newSelection);
  };

  const toggleSelectAll = () => {
    if (selectedPages.size === pages.length) {
      setSelectedPages(new Set());
    } else {
      setSelectedPages(new Set(pages.map(p => p.id)));
    }
  };

  const handleAutoGenerateProductPages = async () => {
    try {
      setLoading(true);
      
      // Ensure we have a valid tenant
      if (!user?.tenantId || user.tenantId === 'default' || user.tenantId === 'system') {
        toast({
          title: 'خطأ في الإعداد',
          description: 'يجب إعداد المتجر أولاً قبل إنشاء الصفحات. يرجى الانتقال إلى إعداد المتجر.',
          variant: 'destructive',
        });
        navigate('/dashboard/market-setup');
        return;
      }
      
      // 1. Dashboard Page - Merchant Dashboard with stats and quick actions
      const dashboardPageContent = {
        sections: [
          {
            type: 'merchant-dashboard',
            props: {
              title: 'لوحة التحكم الذكية',
              titleAr: 'لوحة التحكم الذكية',
              subtitle: 'نظرة عامة شاملة على أداء متجرك ونشاطك',
              subtitleAr: 'نظرة عامة شاملة على أداء متجرك ونشاطك',
              showStats: true,
              showQuickActions: true,
              showRecentActivity: true,
              theme: 'premium'
            }
          }
        ],
        backgroundColor: 'transparent',
        isDarkMode: false,
        containerClassName: 'bg-grid-pattern'
      };

      // 2. Product List Page - Detailed product table with search
      const productListPageContent = {
        sections: [
          {
            type: 'product-list',
            props: {
              title: 'إدارة المنتجات',
              titleAr: 'إدارة المنتجات',
              showFilters: true,
              showSearch: true,
              showExport: true,
              layout: 'professional'
            }
          }
        ],
        backgroundColor: '#ffffff',
        isDarkMode: false
      };

      // 3. Store Page - Shopping cart sidebar + brand cards grid
      const storePageContent = {
        sections: [
          {
            type: 'hero',
            props: {
              title: 'متجر البطاقات الرقمية',
              titleAr: 'متجر البطاقات الرقمية',
              subtitle: 'أفضل البطاقات الرقمية بأفضل الأسعار',
              subtitleAr: 'أفضل البطاقات الرقمية بأفضل الأسعار',
              buttonText: 'تصفح الآن',
              backgroundImage: 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80&w=2070&auto=format&fit=crop',
              overlayOpacity: 0.6,
              textAlign: 'center',
              contentPosition: 'center',
              minHeight: '400px',
              animationType: 'animate-aurora'
            }
          },
          {
            type: 'store-page',
            props: {
              title: 'منصة التجارة الإلكترونية',
              titleAr: 'منصة التجارة الإلكترونية',
              showCart: true,
              showCategories: true,
              layout: 'grid'
            }
          }
        ],
        backgroundColor: '#ffffff',
        isDarkMode: false
      };

      // 4. Support/Tickets Page
      const supportPageContent = {
        sections: [
          {
            type: 'support-tickets',
            props: {
              title: 'مركز الدعم والمساعدة',
              titleAr: 'مركز الدعم والمساعدة',
              showNewTicketButton: true,
              showStatusBadges: true
            }
          }
        ],
        backgroundColor: '#ffffff',
        isDarkMode: false
      };

      // 5. Favorites Page
      const favoritesPageContent = {
        sections: [
          {
            type: 'favorites-page',
            props: {
              title: 'البطاقات المفضلة',
              titleAr: 'البطاقات المفضلة',
              emptyStateText: 'لا توجد بطاقات مفضلة حالياً',
              showAddToCart: true
            }
          }
        ],
        backgroundColor: '#ffffff',
        isDarkMode: false
      };

      // 6. Balance Operations Page
      const balanceOperationsPageContent = {
        sections: [
          {
            type: 'balance-operations',
            props: {
              title: 'سجل العمليات المالية',
              titleAr: 'سجل العمليات المالية',
              showFilters: true,
              showExport: true
            }
          }
        ],
        backgroundColor: '#ffffff',
        isDarkMode: false
      };

      // 7. Employees Page
      const employeesPageContent = {
        sections: [
          {
            type: 'employees-page',
            props: {
              title: 'إدارة فريق العمل',
              titleAr: 'إدارة فريق العمل',
              showGroups: true,
              showPermissions: true
            }
          }
        ],
        backgroundColor: '#ffffff',
        isDarkMode: false
      };

      // 8. Charge Wallet Page
      const chargeWalletPageContent = {
        sections: [
          {
            type: 'charge-wallet',
            props: {
              title: 'شحن رصيد المحفظة',
              titleAr: 'شحن رصيد المحفظة',
              showBankTransfer: true,
              showOnlinePayment: true
            }
          }
        ],
        backgroundColor: '#ffffff',
        isDarkMode: false
      };

      // 9. Reports Page
      const reportsPageContent = {
        sections: [
          {
            type: 'reports-page',
            props: {
              title: 'التقارير والتحليلات',
              titleAr: 'التقارير والتحليلات',
              showCharts: true,
              showSummary: true,
              dateRange: 'last_30_days'
            }
          }
        ],
        backgroundColor: '#f5f5f5',
        isDarkMode: false
      };

      // 10. Profile Page
      const profilePageContent = {
        sections: [
          {
            type: 'profile-page',
            props: {
              title: 'إعدادات الحساب',
              titleAr: 'إعدادات الحساب',
              showSecuritySettings: true,
              showNotificationSettings: true
            }
          }
        ],
        backgroundColor: '#f5f5f5',
        isDarkMode: false
      };

      // 11. Categories Hierarchy Page
      const categoriesHierarchyPageContent = {
        sections: [
          {
            type: 'categories-hierarchy',
            props: {
              title: 'تصفح الأقسام والمنتجات',
              titleAr: 'تصفح الأقسام والمنتجات',
              subtitle: 'اكتشف مجموعتنا الواسعة من البطاقات الرقمية',
              subtitleAr: 'اكتشف مجموعتنا الواسعة من البطاقات الرقمية',
              productsPerCategory: 12,
              productsColumns: 4,
              productsLayout: 'grid',
              showAddToCart: true,
              theme: 'aurora'
            }
          }
        ],
        backgroundColor: '#ffffff',
        isDarkMode: false
      };

      // Check for existing pages to prevent duplicates
      const existingPages = await coreApi.getPages().catch(() => [] as Page[]);
      const existingSlugs = new Set((Array.isArray(existingPages) ? existingPages : []).map((p: Page) => p.slug));

      // Filter out pages that already exist
      const pagesToCreate = [
        { slug: 'merchant-dashboard', content: dashboardPageContent, title: 'لوحة التحكم - التاجر', seoTitle: 'لوحة التحكم - التاجر', seoDescription: 'لوحة تحكم التاجر مع الإحصائيات والإجراءات السريعة' },
        { slug: 'products-list', content: productListPageContent, title: 'قائمة المنتجات', seoTitle: 'قائمة المنتجات', seoDescription: 'قائمة تفصيلية بجميع المنتجات مع البحث والفلترة' },
        { slug: 'store', content: storePageContent, title: 'المتجر - منصة التجارة الإلكترونية', seoTitle: 'المتجر - منصة التجارة الإلكترونية', seoDescription: 'متجر البطاقات الرقمية مع سلة الشراء واختيار العلامات التجارية' },
        { slug: 'support', content: supportPageContent, title: 'الدعم', seoTitle: 'الدعم', seoDescription: 'صفحة الدعم وإدارة التذاكر' },
        { slug: 'favorites', content: favoritesPageContent, title: 'البطاقات المفضلة', seoTitle: 'البطاقات المفضلة', seoDescription: 'البطاقات المفضلة مع سلة الشراء' },
        { slug: 'balance-operations', content: balanceOperationsPageContent, title: 'عمليات شحن الرصيد', seoTitle: 'عمليات شحن الرصيد', seoDescription: 'عرض جميع عمليات شحن الرصيد' },
        { slug: 'employees', content: employeesPageContent, title: 'قائمة الموظفين', seoTitle: 'قائمة الموظفين', seoDescription: 'إدارة الموظفين والمجموعات' },
        { slug: 'charge-wallet', content: chargeWalletPageContent, title: 'شحن الرصيد', seoTitle: 'شحن الرصيد', seoDescription: 'شحن رصيد المحفظة' },
        { slug: 'reports', content: reportsPageContent, title: 'التقارير', seoTitle: 'التقارير', seoDescription: 'تقارير المنتجات والطلبات' },
        { slug: 'profile', content: profilePageContent, title: 'الملف الشخصي', seoTitle: 'الملف الشخصي', seoDescription: 'الملف الشخصي للتاجر' },
        { slug: 'categories', content: categoriesHierarchyPageContent, title: 'الفئات والمنتجات', seoTitle: 'الفئات والمنتجات', seoDescription: 'تصفح الفئات والفئات الفرعية والمنتجات' }
      ].filter(page => !existingSlugs.has(page.slug));

      if (pagesToCreate.length === 0) {
        toast({
          title: 'جميع الصفحات موجودة',
          description: 'جميع الصفحات المطلوبة موجودة بالفعل',
          variant: 'default',
        });
        return;
      }

      // Create only new pages
      const pages = await Promise.all(
        pagesToCreate.map(page =>
          coreApi.createPage({
            title: page.title,
            slug: page.slug,
            content: page.content,
            isPublished: true,
            seoTitle: page.seoTitle,
            seoDescription: page.seoDescription
          })
        )
      );

      toast({
        title: 'تم الإنشاء بنجاح',
        description: `تم إنشاء ${pages.length} صفحة احترافية جديدة تلقائياً`,
        variant: 'default',
      });

      // Reload pages after a short delay to ensure backend has processed
      setTimeout(() => {
        loadPages();
      }, 500);
    } catch (error: any) {
      console.error('Failed to auto-generate pages:', error);
      toast({
        title: 'خطأ في الإنشاء',
        description: error?.message || 'حدث خطأ أثناء إنشاء الصفحات. يرجى المحاولة مرة أخرى.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredPages = pages.filter(page =>
    page.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    page.slug?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Clear selection when search changes
  useEffect(() => {
    setSelectedPages(new Set());
  }, [searchQuery]);

  const stats = {
    total: pages.length,
    published: pages.filter(p => p.isPublished).length,
    drafts: pages.filter(p => !p.isPublished).length,
  };

  // Early return after all hooks
  if (!hasMarket) {
    return <MarketSetupPrompt />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary via-orange-500 to-teal-500 bg-clip-text text-transparent">
            إدارة الصفحات
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            أنشئ وأدر صفحات موقعك الإلكتروني
          </p>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            size="lg" 
            className="border-2"
            onClick={loadPages}
            disabled={loading}
          >
            <RefreshCw className={`h-5 w-5 ml-2 ${loading ? 'animate-spin' : ''}`} />
            تحديث
          </Button>
          
          <Button 
            variant="outline" 
            size="lg" 
            className="border-2 border-primary/20 hover:border-primary/40 text-primary"
            onClick={handleAutoGenerateProductPages}
            disabled={loading}
          >
            <Sparkles className="h-5 w-5 ml-2 text-primary" />
            إنشاء صفحات المنتجات تلقائياً
          </Button>

          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20">
                <Plus className="h-5 w-5 ml-2" />
                صفحة جديدة
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>إنشاء صفحة جديدة</DialogTitle>
                <DialogDescription>
                  أدخل عنوان الصفحة التي تريد إنشاءها.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">عنوان الصفحة</label>
                  <Input 
                    placeholder="مثال: من نحن، اتصل بنا..." 
                    value={newPageTitle}
                    onChange={(e) => setNewPageTitle(e.target.value)}
                  />
                </div>
                <Button className="w-full" onClick={handleCreatePage} disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'إنشاء الصفحة'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card border-2 border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-primary"></div>
              إجمالي الصفحات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{stats.total}</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-2 border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-success"></div>
              منشورة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-success">{stats.published}</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-2 border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-accent"></div>
              مسودات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-accent">{stats.drafts}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-card p-4 rounded-xl border-2 border-border shadow-sm">
        <div className="relative w-full md:w-96">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input 
            placeholder="بحث في الصفحات..." 
            className="pr-10 h-11 border-border focus:border-primary"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-2 w-full md:w-auto">
          {selectedPages.size > 0 && (
            <Button 
              variant="destructive" 
              onClick={handleBulkDelete}
              className="shadow-lg shadow-red-100"
            >
              <Trash2 className="h-4 w-4 ml-2" />
              حذف المختار ({selectedPages.size})
            </Button>
          )}
          
          <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-2">
                <LayoutTemplate className="h-4 w-4 ml-2" />
                القوالب الجاهزة
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>اختر من القوالب الجاهزة</DialogTitle>
                <DialogDescription>
                  قوالب مصممة باحترافية لتسريع عملية بناء موقعك.
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                {templates.map((template) => (
                  <Card key={template.id} className="overflow-hidden hover:border-primary transition-colors cursor-pointer group">
                    <div className="aspect-video bg-muted flex items-center justify-center relative overflow-hidden">
                      {template.thumbnail ? (
                        <img src={template.thumbnail} alt={template.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      ) : (
                        <LayoutTemplate className="h-12 w-12 text-muted-foreground" />
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button onClick={() => handleCreateFromTemplate(template)}>استخدام هذا القالب</Button>
                      </div>
                    </div>
                    <CardHeader className="p-4">
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <CardDescription>{template.description}</CardDescription>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Pages Table */}
      <div className="bg-card rounded-xl border-2 border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-muted/50 border-b-2 border-border">
              <tr>
                <th className="p-4 w-12">
                  <Checkbox 
                    checked={selectedPages.size === pages.length && pages.length > 0}
                    onCheckedChange={toggleSelectAll}
                  />
                </th>
                <th className="p-4 font-bold text-foreground">الصفحة</th>
                <th className="p-4 font-bold text-foreground">الرابط (Slug)</th>
                <th className="p-4 font-bold text-foreground">الحالة</th>
                <th className="p-4 font-bold text-foreground">تاريخ التحديث</th>
                <th className="p-4 font-bold text-foreground text-left">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading && pages.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                    <p className="mt-2 text-muted-foreground">جاري تحميل الصفحات...</p>
                  </td>
                </tr>
              ) : filteredPages.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center">
                    <div className="bg-muted w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FileText className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground text-lg">لا توجد صفحات حالياً</p>
                    <Button 
                      variant="link" 
                      className="text-primary mt-2"
                      onClick={() => setShowCreateDialog(true)}
                    >
                      أنشئ صفحتك الأولى الآن
                    </Button>
                  </td>
                </tr>
              ) : (
                filteredPages.map((page) => (
                  <tr key={page.id} className="hover:bg-muted/30 transition-colors group border-b border-border last:border-0">
                    <td className="p-4">
                      <Checkbox 
                        checked={selectedPages.has(page.id)}
                        onCheckedChange={() => togglePageSelection(page.id)}
                      />
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-bold text-foreground">{page.title}</p>
                          <p className="text-xs text-muted-foreground">ID: {page.id.substring(0, 8)}...</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <code className="bg-muted px-2 py-1 rounded text-sm text-muted-foreground">
                        /{page.slug}
                      </code>
                    </td>
                    <td className="p-4">
                      {page.isPublished ? (
                        <Badge className="bg-success/10 text-success border-success/20 hover:bg-success/20">منشورة</Badge>
                      ) : (
                        <Badge variant="outline" className="text-accent border-accent/30 bg-accent/5">مسودة</Badge>
                      )}
                    </td>
                    <td className="p-4 text-muted-foreground text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {new Date(page.updatedAt).toLocaleDateString('ar-SA')}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 justify-start">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="hover:bg-primary/10 hover:text-primary"
                          onClick={() => navigate(`/builder/${page.id}`)}
                        >
                          <Edit className="h-4 w-4 ml-2" />
                          تعديل
                        </Button>
                        
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="hover:bg-[hsl(var(--teal)/0.1)] hover:text-[hsl(var(--teal))]"
                          asChild
                        >
                          <a href={getPageUrl(page.slug)} target="_blank" rel="noopener noreferrer">
                            <Eye className="h-4 w-4 ml-2" />
                            عرض
                          </a>
                        </Button>

                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="hover:bg-gray-100">
                              <Plus className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="w-48 p-2">
                            <div className="flex flex-col gap-1">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="justify-start font-normal"
                                onClick={() => handleDuplicatePage(page)}
                              >
                                <Copy className="h-4 w-4 ml-2" />
                                تكرار
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="justify-start font-normal text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => handleDeletePage(page.id)}
                              >
                                <Trash2 className="h-4 w-4 ml-2" />
                                حذف
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
