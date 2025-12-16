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
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [tenantSubdomain, setTenantSubdomain] = useState<string>('');
  const [selectedPages, setSelectedPages] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Helper function to generate storefront URL
  // Always generates subdomain format: subdomain.saeaa.com (e.g., market.saeaa.com)
  const getStorefrontPageUrl = (slug: string): string => {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    const port = window.location.port;
    const portPart = port ? `:${port}` : '';
    const subdomain = tenantSubdomain || user?.tenantSubdomain || 'market';
    
    // Detect base domain for subdomain generation
    let baseDomain = 'saeaa.com';
    if (hostname.includes('saeaa.net')) {
      baseDomain = 'saeaa.net';
    } else if (hostname.includes('saeaa.com')) {
      baseDomain = 'saeaa.com';
    }
    
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
  }, []);
  
  // Check if user has a market/store set up (must be after all hooks)
  const hasMarket = !!(user?.tenantId && user.tenantId !== 'default' && user.tenantId !== 'system');
  
  // Show market setup prompt if no market
  if (!hasMarket) {
    return <MarketSetupPrompt />;
  }

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
      console.log('🔄 Loading pages...', { 
        tenantId, 
        hostname: window.location.hostname, 
        hasUser: !!user,
        userTenantId: user?.tenantId 
      });
      
      // Use pageService which handles the API call properly
      const data = await pageService.getPages();
      console.log('📄 Pages API response:', { 
        data, 
        isArray: Array.isArray(data), 
        length: Array.isArray(data) ? data.length : 'N/A',
        type: typeof data 
      });
      
      // Handle different response formats
      let pagesArray: Page[] = [];
      if (Array.isArray(data)) {
        pagesArray = data;
      } else if (data && typeof data === 'object' && 'data' in data && Array.isArray(data.data)) {
        pagesArray = data.data;
      } else if (data && typeof data === 'object' && 'pages' in data && Array.isArray(data.pages)) {
        pagesArray = data.pages;
      }
      
      // Filter out any invalid pages
      pagesArray = pagesArray.filter((page: any) => 
        page && 
        typeof page === 'object' && 
        page.id && 
        !('error' in page) && 
        !('statusCode' in page)
      );
      
      console.log('Processed pages:', pagesArray.length, pagesArray);
      setPages(pagesArray);
      
      if (pagesArray.length === 0 && tenantId && tenantId !== 'default' && tenantId !== 'system') {
        console.warn('No pages found. Tenant ID:', tenantId, 'This might indicate a data loading issue.');
      }
    } catch (error: any) {
      console.error('Failed to load pages:', error);
      toast({
        title: 'تعذر تحميل الصفحات',
        description: error?.message || 'حدث خطأ أثناء تحميل الصفحات. يرجى المحاولة مرة أخرى.',
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
      // Remove from selected pages if it was selected
      const newSelected = new Set(selectedPages);
      newSelected.delete(id);
      setSelectedPages(newSelected);
    } catch (error) {
      toast({
        title: 'تعذر حذف الصفحة',
        description: 'حدث خطأ أثناء حذف الصفحة. يرجى المحاولة مرة أخرى.',
        variant: 'destructive',
      });
    }
  };

  const handleBulkDelete = async () => {
    if (selectedPages.size === 0) return;
    
    const count = selectedPages.size;
    if (!confirm(`هل أنت متأكد من حذف ${count} صفحة؟`)) return;

    try {
      const deletePromises = Array.from(selectedPages).map(id => coreApi.deletePage(id));
      await Promise.all(deletePromises);
      toast({ 
        title: 'تم الحذف', 
        description: `تم حذف ${count} صفحة بنجاح` 
      });
      setSelectedPages(new Set());
      loadPages();
    } catch (error) {
      toast({
        title: 'تعذر حذف الصفحات',
        description: 'حدث خطأ أثناء حذف الصفحات. يرجى المحاولة مرة أخرى.',
        variant: 'destructive',
      });
    }
  };

  const togglePageSelection = (pageId: string) => {
    const newSelection = new Set(selectedPages);
    if (newSelection.has(pageId)) {
      newSelection.delete(pageId);
    } else {
      newSelection.add(pageId);
    }
    setSelectedPages(newSelection);
  };

  const selectAll = () => {
    if (selectedPages.size === filteredPages.length) {
      setSelectedPages(new Set());
    } else {
      setSelectedPages(new Set(filteredPages.map(p => p.id)));
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
        title: 'تعذر نسخ الصفحة',
        description: 'حدث خطأ أثناء نسخ الصفحة. يرجى المحاولة مرة أخرى.',
        variant: 'destructive',
      });
    }
  };

  const handleCreateFromTemplate = (templateId: string) => {
    setShowTemplateDialog(false);
    // Encode templateId to handle special characters like + in base64 IDs
    navigate(`/dashboard/pages/new?templateId=${encodeURIComponent(templateId)}`);
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
              title: 'لوحة التحكم',
              titleAr: 'لوحة التحكم',
              subtitle: 'نظرة عامة على أداء متجرك',
              subtitleAr: 'نظرة عامة على أداء متجرك'
            }
          }
        ],
        backgroundColor: '#f8f9fa',
        isDarkMode: false
      };

      // 2. Product List Page - Detailed product table with search
      const productListPageContent = {
        sections: [
          {
            type: 'product-list',
            props: {
              title: 'قائمة المنتجات',
              titleAr: 'قائمة المنتجات'
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
            type: 'store-page',
            props: {
              title: 'منصة التجارة الإلكترونية',
              titleAr: 'منصة التجارة الإلكترونية'
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
              title: 'الدعم',
              titleAr: 'الدعم'
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
              titleAr: 'البطاقات المفضلة'
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
              title: 'عمليات شحن الرصيد',
              titleAr: 'عمليات شحن الرصيد'
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
              title: 'قائمة الموظفين',
              titleAr: 'قائمة الموظفين'
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
              title: 'شحن الرصيد',
              titleAr: 'شحن الرصيد'
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
              title: 'التقارير',
              titleAr: 'التقارير'
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
              title: 'الملف الشخصي',
              titleAr: 'الملف الشخصي'
            }
          }
        ],
        backgroundColor: '#f5f5f5',
        isDarkMode: false
      };

      // 11. Categories Hierarchy Page - Categories with subcategories and products
      const categoriesHierarchyPageContent = {
        sections: [
          {
            type: 'categories-hierarchy',
            props: {
              title: 'الفئات والمنتجات',
              titleAr: 'الفئات والمنتجات',
              subtitle: 'تصفح الفئات والفئات الفرعية والمنتجات',
              subtitleAr: 'تصفح الفئات والفئات الفرعية والمنتجات',
              productsPerCategory: 12,
              productsColumns: 4,
              productsLayout: 'grid',
              showAddToCart: true
            }
          }
        ],
        backgroundColor: '#ffffff',
        isDarkMode: false
      };

      // Check for existing pages to prevent duplicates
      const existingPages = await coreApi.getPages().catch(() => []);
      const existingSlugs = new Set((Array.isArray(existingPages) ? existingPages : []).map((p: any) => p.slug));

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
        description: `تم إنشاء ${pages.length} صفحة جديدة تلقائياً`,
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

  return (
    <div className="space-y-6">
      {/* Market Setup Notice - Show when user doesn't have a market */}
      {!hasMarket && (
        <Alert className="border-amber-300 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-600">
          <Store className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-800 dark:text-amber-200">لم تقم بإعداد متجرك بعد</AlertTitle>
          <AlertDescription className="text-amber-700 dark:text-amber-300">
            يمكنك إنشاء الصفحات الآن، ولكن لن تكون مرئية للعملاء حتى تقوم بإعداد متجرك.{' '}
            <Link to="/dashboard/market-setup" className="font-semibold underline hover:no-underline">
              إعداد المتجر الآن
            </Link>
          </AlertDescription>
        </Alert>
      )}

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
          <Button 
            variant="outline" 
            size="lg" 
            className="border-2"
            onClick={loadPages}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="ml-2 h-5 w-5 animate-spin" />
            ) : (
              <RefreshCw className="ml-2 h-5 w-5" />
            )}
            تحديث
          </Button>
          <Button 
            variant="outline" 
            size="lg" 
            className="border-2 border-purple-500 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20"
            onClick={handleAutoGenerateProductPages}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="ml-2 h-5 w-5 animate-spin" />
            ) : (
              <Zap className="ml-2 h-5 w-5" />
            )}
            إنشاء صفحات المنتجات تلقائياً
          </Button>
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

      {/* Search and Bulk Actions */}
      <Card className="border-0 shadow-md">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="relative flex-1 w-full sm:w-auto">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                placeholder="ابحث عن صفحة..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10 h-12 border-2"
              />
            </div>
            {filteredPages.length > 0 && (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={selectedPages.size === filteredPages.length && filteredPages.length > 0}
                    onCheckedChange={selectAll}
                    id="select-all"
                  />
                  <label
                    htmlFor="select-all"
                    className="text-sm font-medium cursor-pointer"
                  >
                    تحديد الكل ({selectedPages.size})
                  </label>
                </div>
                {selectedPages.size > 0 && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleBulkDelete}
                  >
                    <Trash2 className="ml-2 h-4 w-4" />
                    حذف المحدد ({selectedPages.size})
                  </Button>
                )}
              </div>
            )}
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
            <Card key={page.id} className="border-0 shadow-md hover:shadow-xl transition-all group relative">
              <div className="absolute top-4 left-4 z-10">
                <Checkbox
                  checked={selectedPages.has(page.id)}
                  onCheckedChange={() => togglePageSelection(page.id)}
                  id={`page-${page.id}`}
                />
              </div>
              <CardHeader>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 pr-8">
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
                    onClick={() => navigate(`/dashboard/pages/${encodeURIComponent(page.id)}`)}
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
