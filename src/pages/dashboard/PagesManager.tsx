import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
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
  LayoutTemplate, Globe, Calendar, Loader2, Store, AlertCircle,
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
import { tenantService } from '@/services/tenant.service';

export default function PagesManager() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
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

  // Helper function to extract subdomain from hostname
  const extractSubdomainFromHostname = (hostname: string): string | null => {
    // Remove port if present
    const cleanHostname = hostname.split(':')[0];
    
    // For local development with subdomain (e.g., asus1.localhost or tenant-508aeb7f.localhost)
    if (cleanHostname.includes('.localhost')) {
      const parts = cleanHostname.split('.localhost');
      if (parts[0] && parts[0] !== 'localhost' && parts[0] !== '127') {
        return parts[0];
      }
      return null;
    }
    
    // For localhost without subdomain or 127.0.0.1
    if (cleanHostname === 'localhost' || cleanHostname === '127.0.0.1') {
      return null;
    }
    
    // For production subdomains (e.g., market.saeaa.com)
    if (cleanHostname.endsWith('.saeaa.com') && cleanHostname !== 'saeaa.com' && cleanHostname !== 'www.saeaa.com') {
      const parts = cleanHostname.split('.');
      if (parts.length >= 3 && parts[0] !== 'www' && parts[0] !== 'app') {
        return parts[0];
      }
    }
    
    if (cleanHostname.endsWith('.saeaa.net') && cleanHostname !== 'saeaa.net' && cleanHostname !== 'www.saeaa.net') {
      const parts = cleanHostname.split('.');
      if (parts.length >= 3 && parts[0] !== 'www' && parts[0] !== 'app') {
        return parts[0];
      }
    }
    
    return null;
  };

  const getPageUrl = (slug: string) => {
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    const port = window.location.port;
    const portPart = port ? `:${port}` : '';
    
    // Priority: 1. tenantSubdomain (from API), 2. user.tenantSubdomain, 3. extracted from hostname (only if it's a valid subdomain)
    // Don't use extractedSubdomain if it looks like a tenant ID (e.g., tenant-508aeb7f)
    const extractedSubdomain = extractSubdomainFromHostname(hostname);
    
    // Determine the correct subdomain to use
    let subdomain: string;
    if (tenantSubdomain) {
      // Use the subdomain from API (most reliable)
      subdomain = tenantSubdomain;
    } else if (user?.tenantSubdomain) {
      // Use user's tenantSubdomain from auth context
      subdomain = user.tenantSubdomain;
    } else if (extractedSubdomain && !extractedSubdomain.startsWith('tenant-')) {
      // Only use extracted subdomain if it doesn't look like a tenant ID
      subdomain = extractedSubdomain;
    } else {
      // Last resort: use 'default' or show error
      console.warn('No valid subdomain found for preview URL. Using default.');
      subdomain = 'default';
    }
    
    console.log('🔗 Generating preview URL:', {
      slug,
      tenantSubdomain,
      userTenantSubdomain: user?.tenantSubdomain,
      extractedSubdomain,
      finalSubdomain: subdomain,
      hostname
    });
    
    // Detect base domain from current hostname
    let baseDomain = 'saeaa.com';
    if (hostname.includes('saeaa.net')) {
      baseDomain = 'saeaa.net';
    } else if (hostname.includes('saeaa.com')) {
      baseDomain = 'saeaa.com';
    }
    
    // For local development
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.includes('.localhost')) {
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
      console.log('🔍 Loading tenant info for preview URLs...');
      
      // First, try to get subdomain from tenant API (most reliable)
      const tenant = await tenantService.getCurrentUserTenant();
      console.log('📡 Tenant API response:', tenant);
      
      if (tenant?.subdomain) {
        console.log('✅ Using subdomain from tenant API:', tenant.subdomain);
        setTenantSubdomain(tenant.subdomain);
        return;
      }
      
      // Fallback: Try to get from site-config
      try {
        const config = await coreApi.get('/site-config', { requireAuth: true });
        console.log('📡 Site-config response:', config);
        if (config?.settings?.subdomain) {
          console.log('✅ Using subdomain from site-config:', config.settings.subdomain);
          setTenantSubdomain(config.settings.subdomain);
          return;
        }
      } catch (configError) {
        console.warn('⚠️ Failed to load subdomain from site-config:', configError);
      }
      
      // Fallback: Use user's tenantSubdomain if available
      if (user?.tenantSubdomain) {
        console.log('✅ Using subdomain from user context:', user.tenantSubdomain);
        setTenantSubdomain(user.tenantSubdomain);
        return;
      }
      
      // Last fallback: Extract subdomain from current hostname (only if it's not a tenant ID)
      const hostname = window.location.hostname;
      const extracted = extractSubdomainFromHostname(hostname);
      if (extracted && !extracted.startsWith('tenant-')) {
        console.log('✅ Using extracted subdomain from hostname:', extracted);
        setTenantSubdomain(extracted);
      } else {
        console.warn('⚠️ Could not determine subdomain. Preview URLs may not work correctly.');
      }
    } catch (error) {
      console.error('❌ Failed to load tenant info:', error);
      // Fallback: Extract subdomain from current hostname
      const hostname = window.location.hostname;
      const extracted = extractSubdomainFromHostname(hostname);
      if (extracted && !extracted.startsWith('tenant-')) {
        console.log('✅ Using extracted subdomain as fallback:', extracted);
        setTenantSubdomain(extracted);
      } else if (user?.tenantSubdomain) {
        // Use user's tenantSubdomain as last resort
        console.log('✅ Using user tenantSubdomain as last resort:', user.tenantSubdomain);
        setTenantSubdomain(user.tenantSubdomain);
      }
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
    if (!confirm(t('pages.manager.deleteConfirm'))) return;
    
    try {
      setLoading(true);
      await coreApi.deletePage(id);
      toast({
        title: t('common.success'),
        description: t('pages.manager.deleteSuccess'),
      });
      loadPages();
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('pages.manager.deleteError'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedPages.size === 0) return;
    if (!confirm(t('pages.manager.bulkDeleteConfirm', { count: selectedPages.size }))) return;
    
    try {
      setLoading(true);
      await Promise.all(Array.from(selectedPages).map(id => coreApi.deletePage(id)));
      toast({
        title: t('common.success'),
        description: t('pages.manager.bulkDeleteSuccess', { count: selectedPages.size }),
      });
      setSelectedPages(new Set());
      loadPages();
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('pages.manager.bulkDeleteError'),
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

  const handleCreateDigitalCardsStore = async () => {
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
      
      // Check for existing pages to prevent duplicates
      const existingPages = await coreApi.getPages().catch(() => [] as Page[]);
      const existingSlugs = new Set((Array.isArray(existingPages) ? existingPages : []).map((p: Page) => p.slug));

      // Customer Orders Page - Display all customer orders with status
      const customerOrdersPageContent = {
        sections: [
          {
            type: 'customer-orders',
            props: {
              title: 'My Orders',
              titleAr: 'طلباتي',
              titleEn: 'My Orders',
              subtitle: 'View all your orders with the status of each order',
              subtitleAr: 'عرض جميع طلباتك مع حالة كل طلب',
              subtitleEn: 'View all your orders with the status of each order',
              showSearch: true,
              showFilters: true,
              showStatusBadge: true,
              itemsPerPage: 10,
              layout: 'table'
            }
          }
        ],
        backgroundColor: 'transparent',
        isDarkMode: false
      };

      // Store Page - Main digital cards store
      const storePageContent = {
        sections: [
          {
            type: 'hero',
            props: {
              title: 'Digital Cards Store',
              titleAr: 'متجر البطاقات الرقمية',
              titleEn: 'Digital Cards Store',
              subtitle: 'Best digital cards at the best prices',
              subtitleAr: 'أفضل البطاقات الرقمية بأفضل الأسعار',
              subtitleEn: 'Best digital cards at the best prices',
              buttonText: 'Browse Now',
              buttonTextAr: 'تصفح الآن',
              buttonTextEn: 'Browse Now',
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
              title: 'Store',
              titleAr: 'المتجر',
              titleEn: 'Store',
              showCart: true,
              showBrands: true,
              layout: 'grid'
            }
          }
        ],
        backgroundColor: 'transparent',
        isDarkMode: false
      };

      // Categories Page
      const categoriesPageContent = {
        sections: [
          {
            type: 'categories-hierarchy',
            props: {
              title: 'Browse Categories & Products',
              titleAr: 'تصفح الأقسام والمنتجات',
              titleEn: 'Browse Categories & Products',
              subtitle: 'Discover our wide range of digital cards',
              subtitleAr: 'اكتشف مجموعتنا الواسعة من البطاقات الرقمية',
              subtitleEn: 'Discover our wide range of digital cards',
              productsPerCategory: 12,
              productsColumns: 4,
              productsLayout: 'grid',
              showAddToCart: true,
              theme: 'aurora'
            }
          }
        ],
        backgroundColor: 'transparent',
        isDarkMode: false
      };

      // Profile Page
      const profilePageContent = {
        sections: [
          {
            type: 'profile-page',
            props: {
              title: 'Account Settings',
              titleAr: 'إعدادات الحساب',
              titleEn: 'Account Settings',
              showSecuritySettings: true,
              showNotificationSettings: true
            }
          }
        ],
        backgroundColor: 'transparent',
        isDarkMode: false
      };

      // Charge Wallet Page
      const chargeWalletPageContent = {
        sections: [
          {
            type: 'charge-wallet',
            props: {
              title: 'Charge Wallet',
              titleAr: 'شحن رصيد المحفظة',
              titleEn: 'Charge Wallet',
              showBankTransfer: true,
              showOnlinePayment: true
            }
          }
        ],
        backgroundColor: 'transparent',
        isDarkMode: false
      };

      // Favorites Page
      const favoritesPageContent = {
        sections: [
          {
            type: 'favorites-page',
            props: {
              title: 'Favorite Cards',
              titleAr: 'البطاقات المفضلة',
              titleEn: 'Favorite Cards',
              showCart: true,
              layout: 'grid'
            }
          }
        ],
        backgroundColor: 'transparent',
        isDarkMode: false
      };

      // Support Page
      const supportPageContent = {
        sections: [
          {
            type: 'support-tickets',
            props: {
              title: 'Support Tickets',
              titleAr: 'تذاكر الدعم الفني',
              titleEn: 'Support Tickets',
              showCreateButton: true,
              showStatusFilter: true
            }
          }
        ],
        backgroundColor: 'transparent',
        isDarkMode: false
      };

      // Filter out pages that already exist
      const pagesToCreate = [
        { 
          slug: 'store', 
          content: storePageContent, 
          title: 'Store', 
          titleAr: 'المتجر - متجر البطاقات الرقمية', 
          titleEn: 'Store - Digital Cards Store',
          seoTitle: 'Store', 
          seoTitleAr: 'المتجر - متجر البطاقات الرقمية', 
          seoTitleEn: 'Store - Digital Cards Store',
          seoDescription: 'Digital cards store with shopping cart and brand selection',
          seoDescAr: 'متجر البطاقات الرقمية مع سلة الشراء واختيار العلامات التجارية',
          seoDescEn: 'Digital cards store with shopping cart and brand selection'
        },
        { 
          slug: 'customer-orders', 
          content: customerOrdersPageContent, 
          title: 'My Orders', 
          titleAr: 'طلباتي', 
          titleEn: 'My Orders',
          seoTitle: 'My Orders', 
          seoTitleAr: 'طلباتي', 
          seoTitleEn: 'My Orders',
          seoDescription: 'View all your orders with status',
          seoDescAr: 'عرض جميع طلباتك مع حالة كل طلب',
          seoDescEn: 'View all your orders with status'
        },
        { 
          slug: 'categories', 
          content: categoriesPageContent, 
          title: 'Categories & Products', 
          titleAr: 'الفئات والمنتجات', 
          titleEn: 'Categories & Products',
          seoTitle: 'Categories & Products', 
          seoTitleAr: 'الفئات والمنتجات', 
          seoTitleEn: 'Categories & Products',
          seoDescription: 'Browse categories, subcategories and products',
          seoDescAr: 'تصفح الفئات والفئات الفرعية والمنتجات',
          seoDescEn: 'Browse categories, subcategories and products'
        },
        { 
          slug: 'profile', 
          content: profilePageContent, 
          title: 'Profile', 
          titleAr: 'الملف الشخصي', 
          titleEn: 'Profile',
          seoTitle: 'Profile', 
          seoTitleAr: 'الملف الشخصي', 
          seoTitleEn: 'Profile',
          seoDescription: 'Customer profile',
          seoDescAr: 'الملف الشخصي للعميل',
          seoDescEn: 'Customer profile'
        },
        { 
          slug: 'charge-wallet', 
          content: chargeWalletPageContent, 
          title: 'Charge Wallet', 
          titleAr: 'شحن الرصيد', 
          titleEn: 'Charge Wallet',
          seoTitle: 'Charge Wallet', 
          seoTitleAr: 'شحن الرصيد', 
          seoTitleEn: 'Charge Wallet',
          seoDescription: 'Charge wallet balance',
          seoDescAr: 'شحن رصيد المحفظة',
          seoDescEn: 'Charge wallet balance'
        },
        { 
          slug: 'favorites', 
          content: favoritesPageContent, 
          title: 'Favorite Cards', 
          titleAr: 'البطاقات المفضلة', 
          titleEn: 'Favorite Cards',
          seoTitle: 'Favorite Cards', 
          seoTitleAr: 'البطاقات المفضلة', 
          seoTitleEn: 'Favorite Cards',
          seoDescription: 'Favorite cards with shopping cart',
          seoDescAr: 'البطاقات المفضلة مع سلة الشراء',
          seoDescEn: 'Favorite cards with shopping cart'
        },
        { 
          slug: 'support', 
          content: supportPageContent, 
          title: 'Support', 
          titleAr: 'الدعم', 
          titleEn: 'Support',
          seoTitle: 'Support', 
          seoTitleAr: 'الدعم', 
          seoTitleEn: 'Support',
          seoDescription: 'Support page and ticket management',
          seoDescAr: 'صفحة الدعم وإدارة التذاكر',
          seoDescEn: 'Support page and ticket management'
        }
      ].filter(page => !existingSlugs.has(page.slug));

      if (pagesToCreate.length === 0) {
        toast({
          title: t('pages.allPagesExist', 'All pages exist'),
          description: t('pages.allDigitalCardsPagesExist', 'All digital cards store pages already exist'),
          variant: 'default',
        });
        return;
      }

      // Create only new pages
      const pages = await Promise.all(
        pagesToCreate.map(page =>
          coreApi.createPage({
            title: page.title,
            titleAr: page.titleAr,
            titleEn: page.titleEn,
            slug: page.slug,
            content: page.content,
            isPublished: true,
            seoTitle: page.seoTitle,
            seoTitleAr: page.seoTitleAr,
            seoTitleEn: page.seoTitleEn,
            seoDescription: page.seoDescription,
            seoDescAr: page.seoDescAr,
            seoDescEn: page.seoDescEn
          })
        )
      );

      toast({
        title: t('pages.createdSuccessfully', 'Created Successfully'),
        description: t('pages.digitalCardsCreated', `Successfully created ${pages.length} pages for digital cards store`, { count: pages.length }),
        variant: 'default',
      });

      // Reload pages after a short delay to ensure backend has processed
      setTimeout(() => {
        loadPages();
      }, 500);
    } catch (error: unknown) {
      const err = error as { message?: string };
      console.error('Failed to create digital cards store pages:', err);
      toast({
        title: t('pages.creationError', 'Creation Error'),
        description: err?.message || t('pages.digitalCardsCreationError', 'An error occurred while creating digital cards store pages. Please try again.'),
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
            {t('dashboard.pages.title', 'إدارة الصفحات')}
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            {t('dashboard.pages.description', 'أنشئ وأدر صفحات موقعك الإلكتروني')}
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
            className="border-2 border-teal-500/20 hover:border-teal-500/40 text-teal-600 dark:text-teal-400"
            onClick={handleCreateDigitalCardsStore}
            disabled={loading}
          >
            <Store className="h-5 w-5 ml-2" />
            متجر البطاقات الرقمية
          </Button>

          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20" id="tour-pages-add-btn">
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
              {t('pages.manager.status.published')}
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
              {t('pages.manager.filters.draft')}
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
          <Search className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground`} />
          <Input 
            placeholder={t('pages.manager.searchPlaceholder')} 
            className={`${isRTL ? 'pr-10' : 'pl-10'} h-11 border-border focus:border-primary`}
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
              <Trash2 className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
              {t('pages.manager.bulkDelete')} ({selectedPages.size})
            </Button>
          )}
          
          <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-2">
                <LayoutTemplate className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                {t('pages.manager.templates')}
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
        <div className="overflow-x-auto table-responsive">
          <table className="w-full">
            <thead className="bg-muted/50 border-b-2 border-border">
              <tr>
                <th className="p-4 w-12">
                  <Checkbox 
                    checked={selectedPages.size === pages.length && pages.length > 0}
                    onCheckedChange={toggleSelectAll}
                  />
                </th>
                <th className="p-4 font-bold text-foreground">{t('pages.manager.table.page')}</th>
                <th className="p-4 font-bold text-foreground">{t('pages.manager.table.slug')}</th>
                <th className="p-4 font-bold text-foreground">{t('pages.manager.table.status')}</th>
                <th className="p-4 font-bold text-foreground">{t('pages.manager.table.lastUpdated')}</th>
                <th className="p-4 font-bold text-foreground">{t('pages.manager.table.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading && pages.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                    <p className="mt-2 text-muted-foreground">{t('pages.manager.loading')}</p>
                  </td>
                </tr>
              ) : filteredPages.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center">
                    <div className="bg-muted w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FileText className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground text-lg">{t('pages.manager.noPages')}</p>
                    <Button 
                      variant="link" 
                      className="text-primary mt-2"
                      onClick={() => setShowCreateDialog(true)}
                    >
                      {t('pages.manager.createFirst')}
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
                        <Badge className="bg-success/10 text-success border-success/20 hover:bg-success/20">{t('pages.manager.status.published')}</Badge>
                      ) : (
                        <Badge variant="outline" className="text-accent border-accent/30 bg-accent/5">{t('pages.manager.status.draft')}</Badge>
                      )}
                    </td>
                    <td className="p-4 text-muted-foreground text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {new Date(page.updatedAt).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US')}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className={`flex items-center gap-2 ${isRTL ? 'justify-start' : 'justify-end'}`}>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="hover:bg-primary/10 hover:text-primary"
                          onClick={() => navigate(`/builder/${page.id}`)}
                        >
                          <Edit className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                          {t('pages.manager.actions.edit')}
                        </Button>
                        
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="hover:bg-[hsl(var(--teal)/0.1)] hover:text-[hsl(var(--teal))]"
                          asChild
                        >
                          <a href={getPageUrl(page.slug)} target="_blank" rel="noopener noreferrer">
                            <Eye className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                            {t('pages.manager.actions.preview')}
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
                                <Copy className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                                {t('pages.manager.actions.duplicate')}
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="justify-start font-normal text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => handleDeletePage(page.id)}
                              >
                                <Trash2 className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                                {t('pages.manager.actions.delete')}
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
