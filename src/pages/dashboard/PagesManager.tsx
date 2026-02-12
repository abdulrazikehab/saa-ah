import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { coreApi } from '@/lib/api';
import { templateService, Template } from '@/services/template.service';
import { pageService } from '@/services/page.service';
import { Page, SiteConfig, Link as SiteLink } from '@/services/types';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Plus, Edit, Trash2, Search, Eye, Copy, FileText, 
  LayoutTemplate, Globe, Calendar, Loader2, Store, AlertCircle,
  Zap, ShoppingBag, RefreshCw, Settings, MoreHorizontal, Check,
  PanelTop, PanelBottom, Sidebar as SidebarIcon,
  Home, Users, Wallet, BarChart3, ChevronRight
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

const SYSTEM_PAGE_TITLES: Record<string, { ar: string, en: string }> = {
  'home': { ar: 'الصفحة الرئيسية', en: 'Home' },
  'products': { ar: 'المنتجات', en: 'Products' },
  'categories': { ar: 'التصنيفات', en: 'Categories' },
  'cart': { ar: 'السلة', en: 'Cart' },
  'checkout': { ar: 'إتمام الطلب', en: 'Checkout' },
  'login': { ar: 'تسجيل الدخول', en: 'Login' },
  'signup': { ar: 'إنشاء حساب', en: 'Sign Up' },
  'about': { ar: 'من نحن', en: 'About Us' },
  'contact': { ar: 'تواصل معنا', en: 'Contact Us' },
  'faqs': { ar: 'الأسئلة الشائعة', en: 'FAQs' },
  'privacy-policy': { ar: 'سياسة الخصوصية', en: 'Privacy Policy' },
  'terms': { ar: 'الشروط والأحكام', en: 'Terms & Conditions' },
  'support': { ar: 'تذاكر الدعم', en: 'Support' },
  'customer-orders': { ar: 'طلباتي', en: 'My Orders' },
  'employees': { ar: 'الموظفين', en: 'Employees' },
  'reports': { ar: 'التقارير', en: 'Reports' },
  'wallet': { ar: 'المحفظة', en: 'Wallet' },
  'wishlist': { ar: 'المفضلة', en: 'Wishlist' },
  'profile': { ar: 'الملف الشخصي', en: 'Profile' },
  'notifications': { ar: 'الإشعارات', en: 'Notifications' },
  'settings': { ar: 'الإعدادات', en: 'Settings' },
  'addresses': { ar: 'العناوين', en: 'Addresses' },
  'inventory': { ar: 'مخزوني', en: 'My Inventory' },
  'charge-wallet': { ar: 'شحن المحفظة', en: 'Charge Wallet' },
  'balance-operations': { ar: 'عمليات الرصيد', en: 'Balance Operations' },
};

// Also create a mapping for alternate slugs to their canonical slugs
const SLUG_ALIASES: Record<string, string> = {
  'about-us': 'about',
  'contact-us': 'contact',
  'faq': 'faqs',
  'policy': 'privacy-policy',
  'orders': 'customer-orders',
};

const SYSTEM_PAGES = Object.keys(SYSTEM_PAGE_TITLES);

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
  const [newPageSlug, setNewPageSlug] = useState('');
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<Page | null>(null);
  const [editForm, setEditForm] = useState({ title: '', slug: '', isPublished: false });
  const [tenantSubdomain, setTenantSubdomain] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showSidebarEditor, setShowSidebarEditor] = useState(false);
  const [sidebarHiddenPages, setSidebarHiddenPages] = useState<Set<string>>(new Set());
  const [siteConfig, setSiteConfig] = useState<SiteConfig | null>(null);

  // Real save function for sidebar config
  const handleSaveSidebarConfig = async () => {
    try {
        setLoading(true);
        const updatedConfig = {
            ...siteConfig,
            settings: {
                ...siteConfig?.settings,
                sidebarHidden: Array.from(sidebarHiddenPages)
            }
        };
        await coreApi.post('/site-config', updatedConfig, { requireAuth: true });
        setSiteConfig(updatedConfig);
        toast({
            title: t('common.success'),
            description: isRTL ? 'تم حفظ التغييرات بنجاح' : 'Changes saved successfully',
        });
        setShowSidebarEditor(false);
    } catch (e) {
        console.error('Failed to save sidebar config:', e);
        toast({ title: t('common.error'), variant: 'destructive' });
    } finally {
        setLoading(false);
    }
  };

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
    
    // For production subdomains (e.g., market.kawn.com)
    if (cleanHostname.endsWith('.kawn.com') && cleanHostname !== 'kawn.com' && cleanHostname !== 'www.kawn.com') {
      const parts = cleanHostname.split('.');
      if (parts.length >= 3 && parts[0] !== 'www' && parts[0] !== 'app') {
        return parts[0];
      }
    }
    
    if (cleanHostname.endsWith('.kawn.net') && cleanHostname !== 'kawn.net' && cleanHostname !== 'www.kawn.net') {
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
    let baseDomain = 'kawn.com';
    if (hostname.includes('kawn.net')) {
      baseDomain = 'kawn.net';
    } else if (hostname.includes('kawn.com')) {
      baseDomain = 'kawn.com';
    }
    
    // For local development
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.includes('.localhost')) {
      return `${protocol}//${subdomain}.localhost${portPart}/${slug}`;
    }
    
    // Always use subdomain format for production: subdomain.kawn.com (e.g., market.kawn.com)
    const urlSlug = slug === 'home' ? '' : slug;
    return `${protocol}//${subdomain}.${baseDomain}/${urlSlug}`;
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
      
      // Fetch pages and site config in parallel
      const [data, siteConfigRes] = await Promise.all([
        pageService.getPages(true),
        coreApi.get('/site-config', { requireAuth: true }).catch(err => {
            console.warn("Could not load site config", err);
            return { settings: {}, header: { links: [] }, footer: { links: [] } };
        })
      ]);
      
      setSiteConfig(siteConfigRes);
      const siteSettings = siteConfigRes?.settings || {};
      
      if (siteSettings.sidebarHidden) {
          setSidebarHiddenPages(new Set(siteSettings.sidebarHidden));
      }

      // Check if balance/wallet is enabled
      const paymentMethods = siteSettings.paymentMethods as string[] | undefined;
      const showBalancePages = siteSettings.buyByBalance || (Array.isArray(paymentMethods) && paymentMethods.includes('wallet'));

      // Handle response - pageService already returns an array
      let pagesArray: Page[] = Array.isArray(data) ? data : [];
      
      // Filter out any invalid pages
      pagesArray = pagesArray.filter((page: Page) => 
        page && typeof page === 'object' && page.id && 
        !('error' in (page as unknown as Record<string, unknown>))
      );

      // Deduplicate pages: if we have both an alias slug (e.g., 'about-us') and its canonical version ('about'),
      // keep only the canonical version. Also merge any aliased slugs into their canonical versions.
      const slugsInArray = new Set(pagesArray.map(p => p.slug));
      
      // Filter out aliased pages if the canonical version exists
      pagesArray = pagesArray.filter((page: Page) => {
        const canonicalSlug = SLUG_ALIASES[page.slug];
        // If this page's slug is an alias and the canonical version exists, filter it out
        if (canonicalSlug && slugsInArray.has(canonicalSlug)) {
          console.log(`Filtering out aliased page ${page.slug} in favor of canonical ${canonicalSlug}`);
          return false;
        }
        return true;
      });

      // Normalize slugs using aliases - collect existing slugs including their canonical forms
      const existingSlugs = new Set<string>();
      pagesArray.forEach(p => {
        existingSlugs.add(p.slug);
        // Also add the canonical slug if this is an aliased slug
        const canonical = SLUG_ALIASES[p.slug];
        if (canonical) existingSlugs.add(canonical);
        // And add any aliases that point to this slug
        Object.entries(SLUG_ALIASES).forEach(([alias, target]) => {
          if (target === p.slug) existingSlugs.add(alias);
        });
      });
      
      // Filter SYSTEM_PAGES based on config
      const filteredSystemPages = SYSTEM_PAGES.filter(slug => {
          if ((slug === 'charge-wallet' || slug === 'balance-operations') && !showBalancePages) return false;
          return true;
      });

      // Only add virtual pages for system pages that don't exist (checking both canonical and aliases)
      const missingSystemPages = filteredSystemPages.filter(slug => !existingSlugs.has(slug));

      const virtualPages = missingSystemPages.map(slug => {
        let content = {};
        const isDigital = siteSettings.storeType === 'DIGITAL_CARDS';
        const storeName = siteSettings.storeName || siteSettings.storeNameAr;
        
        // Populate default content based on Store Type & Slug
        if (slug === 'about') {
            const desc = siteSettings.storeDescription || siteSettings.descriptionAr || (isDigital ? (isRTL ? 'متجر البطاقات الرقمية الأول' : 'The #1 Digital Cards Store') : (isRTL ? 'أهلاً بك في متجرنا' : 'Welcome to our store.'));
            const name = storeName || (isRTL ? 'من نحن' : 'About Us');
            
            content = {
                sections: [{
                    type: 'about-section',
                    props: {
                        title: name,
                        subtitle: desc,
                        description: isRTL 
                           ? 'نحن متخصصون في تقديم أفضل الخدمات والمنتجات لعملائنا بجودة عالية وأسعار منافسة.' 
                           : 'We specialize in providing the best services and products to our customers with high quality and competitive prices.',
                        stats: [
                           { value: '100%', label: isRTL ? 'جودة مضمونة' : 'Quality Guaranteed' },
                           { value: '24/7', label: isRTL ? 'دعم مستمر' : 'Continuous Support' },
                        ],
                        showImage: true,
                        imageUrl: isDigital 
                            ? 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2070'
                            : 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2070'
                    }
                }]
            };
        } else if (slug === 'contact') {
            content = {
                sections: [{
                    type: 'contact-section',
                    props: {
                        title: isRTL ? 'تواصل معنا' : 'Contact Us',
                        subtitle: isRTL ? 'نحن هنا لمساعدتك دائماً' : 'We are here to help you always',
                        email: siteSettings.email || 'support@example.com',
                        phone: siteSettings.phone || '+966 50 000 0000',
                        address: siteSettings.address || (isRTL ? 'المملكة العربية السعودية' : 'Saudi Arabia'),
                        showForm: true,
                        showContactInfo: true,
                    }
                }]
            };
        } else if (slug === 'faqs') {
            content = {
                sections: [{
                    type: 'faq-section',
                    props: {
                        title: isRTL ? 'الأسئلة الشائعة' : 'Frequently Asked Questions',
                        items: [
                           { question: isRTL ? 'كيف أقوم بالطلب؟' : 'How do I place an order?', answer: isRTL ? 'تصفح المنتجات، أضفها للسلة، ثم انتقل لإتمام الدفع.' : 'Browse products, add to cart, then proceed to checkout.' },
                           { question: isRTL ? 'كم مدة التوصيل؟' : 'How long is delivery?', answer: isRTL ? 'عادة ما يتم التوصيل خلال 1-3 أيام عمل حسب موقعك.' : 'Delivery usually takes 1-3 business days depending on your location.' },
                        ]
                    }
                }]
            };
        } else if (slug === 'privacy-policy' || slug === 'terms') {
            content = {
                sections: [{
                    type: 'text',
                    props: {
                        title: isRTL ? 'الشروط والسياسات' : 'Terms & Policies',
                        text: isRTL ? 'هنا يمكنك كتابة سياستكم وشروطكم للحفاظ على حقوقكم وحقوق عملائكم.' : 'Here you can write your policies and terms to protect your rights and your customers rights.',
                        textAlign: isRTL ? 'right' : 'left',
                        padding: 'large'
                    }
                }]
            };
        } else if (slug === 'support') {
            content = {
                sections: [{
                    type: 'support-tickets',
                    props: {
                        title: isRTL ? 'تذاكر الدعم' : 'Support Tickets',
                    }
                }]
            };
        } else if (slug === 'customer-orders') {
            content = {
                sections: [{
                    type: 'customer-orders',
                    props: {
                        title: isRTL ? 'طلباتي' : 'My Orders',
                        showSearch: true,
                        showFilters: true
                    }
                }]
            };
        } else if (slug === 'charge-wallet') {
            content = {
                sections: [{
                    type: 'charge-wallet',
                    props: {
                        title: isRTL ? 'شحن المحفظة' : 'Recharge Wallet',
                        showBankTransfer: true,
                        showOnlinePayment: true
                    }
                }]
            };
        } else if (slug === 'home') {
             const title = isRTL ? 'الرئيسية' : 'Home';
             const sub = isRTL ? 'اكتشف أفضل المنتجات' : 'Discover best products';
             if (isDigital) {
                  content = {
                      sections: [{
                          type: 'hero',
                          props: {
                              title: storeName || (isRTL ? 'متجر البطاقات' : 'Card Store'),
                              subtitle: isRTL ? 'بطاقاتك الرقمية في مكان واحد' : 'Your digital cards in one place',
                              backgroundImage: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=2000',
                              overlayOpacity: 0.6,
                              minHeight: '500px',
                              textAlign: 'center',
                              buttonText: isRTL ? 'تصفح البطاقات' : 'Browse Cards',
                              buttonLink: '/products',
                              animationType: 'animate-pulse'
                          }
                      }, {
                          type: 'text',
                          props: { 
                              title: isRTL ? 'ليش تختارنا؟' : 'Why Us?',
                              text: isRTL ? 'تسليم فوري للأكواد، ضمان تشغيل، ودعم فني على مدار الساعة.' : 'Instant code delivery, working guarantee, and 24/7 support.',
                              textAlign: 'center',
                              backgroundColor: '#f8f9fa',
                              padding: 'large'
                          }
                      }]
                  };
             } else {
                  content = {
                      sections: [{
                          type: 'hero',
                          props: {
                              title: storeName || (isRTL ? 'مرحباً بك' : 'Welcome'),
                              subtitle: isRTL ? 'تسوق أحدث المنتجات العصرية' : 'Shop the latest trendy products',
                              backgroundImage: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2070',
                              overlayOpacity: 0.5,
                              minHeight: '600px',
                              textAlign: 'center',
                              buttonText: isRTL ? 'تسوق الآن' : 'Shop Now',
                              buttonLink: '/products'
                          }
                      }, {
                          type: 'text',
                          props: { 
                              title: isRTL ? 'عروضنا' : 'Our Offers',
                              text: isRTL ? 'خصومات تصل إلى 50% على تشكيلة مختارة.' : 'Up to 50% discount on selected items.',
                              textAlign: 'center',
                              padding: 'large'
                          }
                      }]
                  };
             }
        } else if (slug === 'wishlist') {
            content = {
                sections: [{
                    type: 'favorites-page',
                    props: {
                        title: isRTL ? 'المفضلة' : 'Wishlist',
                        emptyMessage: isRTL ? 'لا توجد منتجات في المفضلة' : 'No products in wishlist'
                    }
                }]
            };
        } else if (slug === 'profile') {
            content = {
                sections: [{
                    type: 'profile-page',
                    props: {
                        title: isRTL ? 'الملف الشخصي' : 'Profile',
                        showAvatar: true,
                        showStats: true
                    }
                }]
            };
        } else if (slug === 'login' || slug === 'signup') {
            content = {
                sections: [{
                    type: 'auth-section',
                    props: {
                        defaultMode: slug,
                        heroTitle: slug === 'login' ? (isRTL ? 'مرحباً بعودتك' : 'Welcome Back') : (isRTL ? 'انضم إلينا' : 'Join Us Today'),
                        heroSubtitle: isRTL ? 'أدر متجرك بكل سهولة' : 'Manage your store with ease'
                    }
                }]
            };
        } else if (slug === 'cart') {
            content = {
                sections: [{
                    type: 'cart-section',
                    props: {
                        title: isRTL ? 'سلة التسوق' : 'Shopping Cart',
                    }
                }]
            };
        } else if (slug === 'checkout') {
            content = {
                sections: [{
                    type: 'checkout-section',
                    props: {
                        title: isRTL ? 'إتمام الطلب' : 'Checkout',
                    }
                }]
            };
        } else if (slug === 'products') {
            content = {
                sections: [{
                    type: 'products',
                    props: {
                        title: isRTL ? 'منتجاتنا' : 'Our Products',
                        limit: 12,
                        layout: 'grid',
                        columns: '4',
                        showPrice: true,
                        showAddToCart: true
                    }
                }]
            };
        } else if (slug === 'categories') {
            content = {
                sections: [{
                    type: 'categories-hierarchy',
                    props: {
                        title: isRTL ? 'تصفح الأقسام' : 'Browse Categories',
                        subtitle: isRTL ? 'استكشف مجموعتنا الواسعة من الأقسام' : 'Explore our wide range of categories',
                        productsPerCategory: 8
                    }
                }]
            };
        } else if (slug === 'notifications') {
            content = {
                sections: [{
                    type: 'notifications-section',
                    props: {
                        title: isRTL ? 'الإشعارات' : 'Notifications'
                    }
                }]
            };
        } else if (slug === 'settings') {
            content = {
                sections: [{
                    type: 'settings-section',
                    props: {
                        title: isRTL ? 'الإعدادات' : 'Settings',
                        showLanguage: true,
                        showTheme: true,
                        showNotifications: true
                    }
                }]
            };
        } else if (slug === 'addresses') {
            content = {
                sections: [{
                    type: 'addresses-section',
                    props: {
                        title: isRTL ? 'العناوين' : 'Addresses',
                        addButtonText: isRTL ? 'إضافة عنوان' : 'Add Address'
                    }
                }]
            };
        } else if (slug === 'inventory') {
            content = {
                sections: [{
                    type: 'inventory-section',
                    props: {
                        title: isRTL ? 'مخزوني' : 'My Inventory',
                        showSearch: true,
                        showFilters: true
                    }
                }]
            };
        }
        // If no specific content, create a generic text section
        if (!content || Object.keys(content).length === 0) {
            const pageTitle = SYSTEM_PAGE_TITLES[slug];
            content = {
                sections: [{
                    type: 'text',
                    props: {
                        title: pageTitle ? (isRTL ? pageTitle.ar : pageTitle.en) : slug,
                        text: isRTL ? 'محتوى هذه الصفحة' : 'Content for this page',
                        textAlign: 'center',
                        padding: 'large'
                    }
                }]
            };
        }

        // Safe access to SYSTEM_PAGE_TITLES with fallback
        const pageTitle = SYSTEM_PAGE_TITLES[slug] || { ar: slug, en: slug };
        
        return {
            id: `virtual-${slug}`,
            title: isRTL ? pageTitle.ar : pageTitle.en,
            titleAr: pageTitle.ar,
            titleEn: pageTitle.en,
            slug: slug,
            content: content,
            isPublished: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        } as Page;
      });
      
      setPages([...pagesArray, ...virtualPages]);
    } catch (error) {
      console.error('Failed to load pages:', error);
      toast({
        title: t('common.error', 'خطأ'),
        description: t('pages.manager.loadingError', 'فشل تحميل الصفحات.'),
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
      // Use provided slug or generate from title
      const slug = newPageSlug.trim() 
        ? newPageSlug.toLowerCase().replace(/\s+/g, '-') 
        : newPageTitle.toLowerCase().replace(/\s+/g, '-');
      
      // Default page content with a hero section and text section
      const defaultContent = {
        sections: [
          {
            type: 'hero',
            props: {
              title: newPageTitle,
              titleAr: newPageTitle,
              titleEn: newPageTitle,
              subtitle: 'Welcome to this page',
              subtitleAr: 'مرحباً بك في هذه الصفحة',
              subtitleEn: 'Welcome to this page',
              buttonText: 'Get Started',
              buttonTextAr: 'ابدأ الآن',
              buttonTextEn: 'Get Started',
              backgroundImage: 'https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2070&auto=format&fit=crop',
              overlayOpacity: 0.5,
              textAlign: 'center',
              contentPosition: 'center',
              minHeight: '400px',
              animationType: 'animate-aurora'
            }
          },
          {
            type: 'text',
            props: {
              title: 'Content Section',
              titleAr: 'قسم المحتوى',
              titleEn: 'Content Section',
              text: 'This is a default content section. You can edit this page to customize it according to your needs.',
              textAr: 'هذا قسم محتوى افتراضي. يمكنك تعديل هذه الصفحة لتخصيصها حسب احتياجاتك.',
              textEn: 'This is a default content section. You can edit this page to customize it according to your needs.',
              textAlign: 'center',
              padding: 'large'
            }
          }
        ],
        backgroundColor: 'transparent',
        isDarkMode: false
      };
      
      await coreApi.createPage({
        title: newPageTitle,
        slug,
        content: defaultContent,
        isPublished: true
      });
      
      toast({
        title: t('common.success', 'تم بنجاح'),
        description: t('pages.manager.createSuccess', 'تم إنشاء الصفحة بنجاح.'),
      });
      
      setNewPageTitle('');
      setNewPageSlug('');
      setShowCreateDialog(false);
      loadPages();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : t('pages.manager.createError', 'فشل إنشاء الصفحة.');
      toast({
        title: t('common.error', 'خطأ'),
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const openEditDialog = (page: Page) => {
    setEditingPage(page);
    setEditForm({
      title: page.title,
      slug: page.slug,
      isPublished: page.isPublished
    });
    setIsEditOpen(true);
  };

  const handleUpdatePage = async () => {
    if (!editingPage || !editForm.title.trim() || !editForm.slug.trim()) return;

    try {
      setLoading(true);
      await coreApi.updatePage(editingPage.id, {
        title: editForm.title,
        slug: editForm.slug.toLowerCase().replace(/\s+/g, '-'),
        isPublished: editForm.isPublished
      });

      toast({
        title: t('common.success', 'تم بنجاح'),
        description: t('pages.manager.updateSuccess', 'تم تحديث الصفحة بنجاح.'),
      });

      setIsEditOpen(false);
      setEditingPage(null);
      loadPages();
    } catch (error: unknown) {
      console.error('Update page error:', error);
      const errorMessage = error instanceof Error ? error.message : t('pages.manager.updateError', 'فشل تحديث الصفحة.');
      toast({
        title: t('common.error', 'خطأ'),
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditDesign = async (page: Page) => {
    if (page.id.startsWith('virtual-')) {
      try {
        setLoading(true);
        toast({
          title: t('common.loading', 'جاري التحضير...'),
          description: t('pages.manager.creatingVirtual', 'جاري تهيئة الصفحة للتعديل...'),
        });

        // Create the page first
        const createdPage = await coreApi.createPage({
          title: page.title,
          slug: page.slug,
          content: page.content || {},
          isPublished: true,
          titleAr: page.titleAr,
          titleEn: page.titleEn
        }) as Page | { id?: string; data?: { id: string } };

        const newId = (createdPage as Page)?.id || (createdPage as { id?: string })?.id || (createdPage as { data?: { id: string } })?.data?.id;
        
        if (newId) {
            navigate(`/builder/${newId}`);
        } else {
            // Fallback
            await loadPages();
        }
      } catch (error) {
        console.error('Failed to initialize page:', error);
        toast({
          title: t('common.error'),
          description: t('pages.manager.createError'),
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    } else {
      navigate(`/builder/${page.id}`);
    }
  };

  const handleDeletePage = async (id: string) => {
    const pageToDelete = pages.find(p => p.id === id);
    if (pageToDelete && SYSTEM_PAGES.includes(pageToDelete.slug)) {
      toast({
        title: t('common.error'),
        description: t('pages.manager.deleteSystemPageError', 'Cannot delete system pages'),
        variant: 'destructive',
      });
      return;
    }

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

    // Filter out system pages
    const pagesToDelete = pages.filter(p => selectedPages.has(p.id) && !SYSTEM_PAGES.includes(p.slug));
    const systemPagesCount = selectedPages.size - pagesToDelete.length;

    if (systemPagesCount > 0) {
      toast({
        title: t('common.warning'),
        description: t('pages.manager.skipSystemPages', { count: systemPagesCount, defaultValue: `Skipping ${systemPagesCount} system pages` }),
      });
    }

    if (pagesToDelete.length === 0) return;

    if (!confirm(t('pages.manager.bulkDeleteConfirm', { count: pagesToDelete.length }))) return;
    
    try {
      setLoading(true);
      await Promise.all(pagesToDelete.map(p => coreApi.deletePage(p.id)));
      toast({
        title: t('common.success'),
        description: t('pages.manager.bulkDeleteSuccess', { count: pagesToDelete.length }),
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
        title: t('common.success', 'تم الإنشاء'),
        description: t('pages.manager.templateSuccess', 'تم إنشاء الصفحة من القالب بنجاح.'),
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
    // Only select pages that are NOT system pages
    const deletablePages = pages.filter(p => !SYSTEM_PAGES.includes(p.slug));
    const allDeletableSelected = deletablePages.length > 0 && deletablePages.every(p => selectedPages.has(p.id));

    if (allDeletableSelected) {
      setSelectedPages(new Set());
    } else {
      setSelectedPages(new Set(deletablePages.map(p => p.id)));
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
      
      // Check for existing pages
      const existingPages = await coreApi.getPages().catch(() => [] as Page[]);
      const existingSlugsMap = new Map((Array.isArray(existingPages) ? existingPages : []).map((p: Page) => [p.slug, p.id]));

      // Define pages content
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

      // Home Page
      const homePageContent = {
        sections: [
          {
            type: 'hero',
            props: {
                title: 'مرحباً بك في متجرنا',
                subtitle: 'اكتشف أفضل المنتجات',
                buttonText: 'تسوق الآن',
                buttonLink: '/products',
                textAlign: 'center',
                backgroundColor: '#000000',
                textColor: '#ffffff',
                overlayOpacity: 0.5,
                backgroundImage: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2070'
            }
          },
          {
            type: 'products',
            props: {
                title: 'منتجات مميزة',
                limit: 8,
                layout: 'grid',
                columns: '4',
                showPrice: true
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

      // Employees Page
      const employeesPageContent = {
        sections: [
          {
            type: 'hero',
            props: {
              title: 'Team Management',
              titleAr: 'إدارة الفريق',
              titleEn: 'Team Management',
              subtitle: 'Manage your employees and their permissions',
              subtitleAr: 'إدارة موظفيك وصلاحياتهم',
              subtitleEn: 'Manage your employees and their permissions',
              backgroundImage: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=2070&auto=format&fit=crop',
              overlayOpacity: 0.6,
              textAlign: 'center',
              contentPosition: 'center',
              minHeight: '300px',
              animationType: 'animate-aurora'
            }
          },
          {
            type: 'employees-page',
            props: {
              titleAr: 'قائمة الموظفين'
            }
          }
        ],
        backgroundColor: 'transparent',
        isDarkMode: false
      };

      // Reports Page
      const reportsPageContent = {
        sections: [
          {
            type: 'hero',
            props: {
              title: 'Reports & Analytics',
              titleAr: 'التقارير والتحليلات',
              titleEn: 'Reports & Analytics',
              subtitle: 'Gain insights into your store performance',
              subtitleAr: 'احصل على رؤى حول أداء متجرك',
              subtitleEn: 'Gain insights into your store performance',
              backgroundImage: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop',
              overlayOpacity: 0.6,
              textAlign: 'center',
              contentPosition: 'center',
              minHeight: '300px',
              animationType: 'animate-aurora'
            }
          },
          {
            type: 'reports-page',
            props: {
              titleAr: 'التقارير'
            }
          }
        ],
        backgroundColor: 'transparent',
        isDarkMode: false
      };

      // Balance Operations Page
      const balanceOperationsPageContent = {
        sections: [
          {
            type: 'hero',
            props: {
              title: 'Balance Operations',
              titleAr: 'عمليات الرصيد',
              titleEn: 'Balance Operations',
              subtitle: 'Track your wallet history and transactions',
              subtitleAr: 'تتبع سجل محفظتك وعملياتك',
              subtitleEn: 'Track your wallet history and transactions',
              backgroundImage: 'https://images.unsplash.com/photo-1580519542036-c47de6196ba5?q=80&w=2070&auto=format&fit=crop',
              overlayOpacity: 0.6,
              textAlign: 'center',
              contentPosition: 'center',
              minHeight: '300px',
              animationType: 'animate-aurora'
            }
          },
          {
            type: 'balance-operations',
            props: {
              titleAr: 'عمليات شحن الرصيد'
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

      // Contact Page
      const contactPageContent = {
        sections: [
          {
            type: 'contact-section',
            props: {
                title: 'تواصل معنا',
                subtitle: 'نحن هنا لمساعدتك دائماً',
                email: 'support@example.com',
                phone: '+966 50 000 0000',
                address: 'المملكة العربية السعودية',
                showForm: true,
                showContactInfo: true
            }
          }
        ],
        backgroundColor: 'transparent',
        isDarkMode: false
      };

      // About Page
      const aboutPageContent = {
        sections: [
          {
            type: 'about-section',
            props: {
                title: 'من نحن',
                subtitle: 'قصتنا ورؤيتنا',
                description: 'نحن متخصصون في تقديم أفضل الخدمات والمنتجات لعملائنا بجودة عالية وأسعار منافسة.',
                stats: [
                    { value: '100%', label: 'جودة مضمونة' },
                    { value: '24/7', label: 'دعم مستمر' },
                ],
                showImage: true
            }
          }
        ],
        backgroundColor: 'transparent',
        isDarkMode: false
      };

      // NEW: Explicitly delete unwanted old default pages
      const slugsToDelete = ['about-us', 'faqs', 'faq', 'contact-us'];
      for (const slugToDel of slugsToDelete) {
        const id = existingSlugsMap.get(slugToDel);
        if (id) {
          try {
            await coreApi.deletePage(id);
            existingSlugsMap.delete(slugToDel);
          } catch (e) {
            console.warn(`Failed to auto-delete ${slugToDel}:`, e);
          }
        }
      }

      const requiredPages = [
        {
          slug: 'home',
          title: 'Home',
          titleAr: 'الرئيسية',
          seoTitleAr: 'الصفحة الرئيسية',
          seoDescAr: 'مرحباً بك في متجرنا',
          content: homePageContent
        },
        { 
          slug: 'charge-wallet', 
          title: 'Charge Wallet', 
          titleAr: 'شحن الرصيد', 
          seoTitleAr: 'شحن الرصيد',
          seoDescAr: 'شحن رصيد المحفظة الخاص بك',
          content: chargeWalletPageContent
        },
        { 
          slug: 'balance-operations', 
          title: 'Balance Operations', 
          titleAr: 'عمليات شحن الرصيد', 
          seoTitleAr: 'عمليات شحن الرصيد',
          seoDescAr: 'سجل عمليات شحن الرصيد',
          content: balanceOperationsPageContent
        },
        { 
          slug: 'support', 
          title: 'Support', 
          titleAr: 'الدعم', 
          seoTitleAr: 'الدعم الفني',
          seoDescAr: 'تواصل مع الدعم الفني',
          content: supportPageContent
        },
        { 
          slug: 'employees', 
          title: 'Employees', 
          titleAr: 'قائمة الموظفين', 
          seoTitleAr: 'إدارة الموظفين',
          seoDescAr: 'إدارة صلاحيات وموظفي المتجر',
          content: employeesPageContent
        },
        { 
          slug: 'reports', 
          title: 'Reports', 
          titleAr: 'التقارير', 
          seoTitleAr: 'التقارير المالية',
          seoDescAr: 'تقارير المبيعات والأداء',
          content: reportsPageContent
        },
        {
          slug: 'customer-orders',
          title: 'My Orders',
          titleAr: 'طلباتي',
          seoTitleAr: 'طلباتي',
          seoDescAr: 'عرض ومتابعة طلباتي',
          content: customerOrdersPageContent
        },
        {
          slug: 'contact',
          title: 'تواصل معنا',
          titleAr: 'تواصل معنا',
          seoTitleAr: 'تواصل معنا',
          seoDescAr: 'تواصل معنا للاستفسارات والدعم',
          content: contactPageContent
        },
        {
          slug: 'about',
          title: 'من نحن',
          titleAr: 'من نحن',
          seoTitleAr: 'من نحن',
          seoDescAr: 'قصتنا ورؤيتنا',
          content: aboutPageContent
        }
      ];

      const updatesPromise = requiredPages.map(async (page) => {
         const existingId = existingSlugsMap.get(page.slug);
         if (existingId) {
             // Update existing page to ensure it's published and has correct content
             const updateData: any = {
                 isPublished: true,
                 title: page.titleAr,
                 seoTitleAr: page.seoTitleAr
             };
             
             // Only update content for non-creative pages, or if we want to force reset.
             // For Home, About, Contact, we might want to preserve user content if it exists.
             // But 'Reset' implies resetting.
             // EXCEPT Home page is very sensitive. Let's protect it if it exists.
             if (page.slug !== 'home' && page.slug !== '/') {
                updateData.content = page.content;
             }

             await coreApi.updatePage(existingId, updateData);
             return { type: 'updated', slug: page.slug };
         } else {
             // Create new page
             await coreApi.createPage({
                title: page.titleAr,
                slug: page.slug,
                content: page.content,
                isPublished: true,
                seoTitleAr: page.seoTitleAr,
                seoDescAr: page.seoDescAr
             });
             return { type: 'created', slug: page.slug };
         }
      });

      const results = await Promise.all(updatesPromise);
      const createdCount = results.filter(r => r.type === 'created').length;
      const updatedCount = results.filter(r => r.type === 'updated').length;

      toast({
        title: t('common.success', 'تم تحديث الصفحات'),
        description: t('pages.manager.resetSuccess', `تم إنشاء ${createdCount} صفحة وتحديث ${updatedCount} صفحة.`),
        variant: 'default',
      });

      // Reload pages after a short delay to ensure backend has processed
      setTimeout(() => {
        loadPages();
      }, 500);
    } catch (error: unknown) {
      const err = error as { message?: string };
      console.error('Failed to create/update digital cards store pages:', err);
      toast({
        title: t('pages.creationError', 'Creation Error'),
        description: err?.message || t('pages.digitalCardsCreationError', 'An error occurred while creating digital cards store pages. Please try again.'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRegeneratePages = async () => {
    try {
      setLoading(true);
      const response = await coreApi.post('/tenants/regenerate-pages', {}, { requireAuth: true });
      
      if (response.success) {
        toast({
          title: t('common.success', 'نجح'),
          description: response.message || `تم إنشاء ${response.created || 0} صفحة وتحديث ${response.updated || 0} صفحة`,
          variant: 'default',
        });
        // Reload pages to show newly created ones
        await loadPages();
      } else {
        toast({
          title: t('common.error', 'خطأ'),
          description: response.message || t('dashboard.pages.regenerateError', 'فشل في إنشاء الصفحات'),
          variant: 'destructive',
        });
      }
    } catch (error: unknown) {
      console.error('Failed to regenerate pages:', error);
      const errorMessage = error instanceof Error ? error.message : t('dashboard.pages.regenerateError', 'فشل في إنشاء الصفحات');
      toast({
        title: t('common.error', 'خطأ'),
        description: errorMessage,
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
            {isRTL ? 'تحديث' : 'Refresh'}
          </Button>
          
          {/* Button removed as pages are now created by default during store setup */}
          {/* {siteConfig?.settings?.storeType === 'DIGITAL_CARDS' && (
            <Button 
                variant="outline" 
                size="lg" 
                className="border-primary text-primary hover:bg-primary/10 transition-all font-bold"
                onClick={handleCreateDigitalCardsStore}
                disabled={loading}
            >
                <LayoutTemplate className={`h-5 w-5 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                {isRTL ? 'إعداد صفحات المتجر الرقمي' : 'Setup Digital Pages'}
            </Button>
          )} */}



          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20" id="tour-pages-add-btn">
                <Plus className="h-5 w-5 ml-2" />
                {t('pages.manager.newPage', 'صفحة جديدة')}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('pages.manager.createDialog.title', 'إنشاء صفحة جديدة')}</DialogTitle>
                <DialogDescription>
                  {t('pages.manager.createDialog.description', 'أدخل تفاصيل الصفحة الجديدة أدناه.')}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t('pages.manager.form.title', 'عنوان الصفحة')}</label>
                  <Input 
                    placeholder={t('pages.manager.form.titlePlaceholder', 'مثال: من نحن')} 
                    value={newPageTitle}
                    onChange={(e) => {
                      setNewPageTitle(e.target.value);
                      // Auto-generate slug from title if slug is empty
                      if (!newPageSlug) {
                        setNewPageSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'));
                      }
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t('pages.manager.form.slug', 'الرابط (Slug)')}</label>
                  <Input 
                    placeholder="about-us" 
                    value={newPageSlug}
                    onChange={(e) => setNewPageSlug(e.target.value)}
                    dir="ltr"
                  />
                  <p className="text-xs text-muted-foreground">
                    {getPageUrl(newPageSlug || 'your-page')}
                  </p>
                </div>
                <Button className="w-full" onClick={handleCreatePage} disabled={loading || !newPageTitle}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : t('common.create', 'إنشاء الصفحة')}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        
          <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('pages.manager.editDialog.title', 'تعديل بيانات الصفحة')}</DialogTitle>
                <DialogDescription>
                  {t('pages.manager.editDialog.description', 'قم بتعديل العنوان، الرابط، وحالة النشر.')}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t('pages.manager.form.title', 'عنوان الصفحة')}</label>
                  <Input 
                    value={editForm.title}
                    onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t('pages.manager.form.slug', 'الرابط (Slug)')}</label>
                  <Input 
                    value={editForm.slug}
                    onChange={(e) => setEditForm(prev => ({ ...prev, slug: e.target.value }))}
                    dir="ltr"
                    disabled={editingPage && SYSTEM_PAGES.includes(editingPage.slug)}
                  />
                  {editingPage && SYSTEM_PAGES.includes(editingPage.slug) && (
                    <p className="text-xs text-yellow-600">
                      {t('pages.manager.systemPageWarning', 'لا يمكن تغيير رابط صفحة النظام.')}
                    </p>
                  )}
                </div>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Checkbox 
                    id="edit-published" 
                    checked={editForm.isPublished}
                    onCheckedChange={(checked) => setEditForm(prev => ({ ...prev, isPublished: !!checked }))}
                  />
                  <label 
                    htmlFor="edit-published" 
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {t('pages.manager.form.published', 'نشر الصفحة')}
                  </label>
                </div>
                <Button className="w-full" onClick={handleUpdatePage} disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : t('common.save', 'حفظ التغييرات')}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="pages" className="space-y-6">
        <TabsList className="bg-muted p-1 rounded-lg w-auto inline-flex">
             <TabsTrigger value="pages" className="px-4">{t('pages.tabs.pages', 'الصفحات')}</TabsTrigger>
             <TabsTrigger value="components" className="px-4">{t('pages.tabs.components', 'مكونات التصميم')}</TabsTrigger>
        </TabsList>
        
        <TabsContent value="pages" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-card border-2 border-border">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-primary"></div>
                    {t('pages.manager.stats.total', 'إجمالي الصفحات')}
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
                        <DialogTitle>{t('pages.manager.templatesDialog.title', 'اختر من القوالب الجاهزة')}</DialogTitle>
                        <DialogDescription>
                        {t('pages.manager.templatesDialog.description', 'قوالب مصممة باحترافية لتسريع عملية بناء موقعك.')}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                        {templates.map((template) => (
                        <Card key={template.id} className="overflow-hidden hover:border-primary transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl cursor-pointer group">
                            <div className="aspect-video bg-muted flex items-center justify-center relative overflow-hidden">
                            {template.thumbnail ? (
                                <img src={template.thumbnail} alt={template.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                            ) : (
                                <LayoutTemplate className="h-12 w-12 text-muted-foreground" />
                            )}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Button onClick={() => handleCreateFromTemplate(template)}>
                                {t('pages.manager.useTemplate', 'استخدام هذا القالب')}
                                </Button>
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
                                disabled={SYSTEM_PAGES.includes(page.slug)}
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
                                variant="outline" 
                                size="sm" 
                                className="border-primary/20 text-primary hover:bg-primary/10 hover:border-primary/50 transition-all font-medium"
                                onClick={() => handleEditDesign(page)}
                                >
                                <LayoutTemplate className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                                {t('pages.manager.actions.builder', 'المحرر')}
                                </Button>
                                
                                <Button
                                variant="ghost"
                                size="sm"
                                className="text-foreground hover:bg-muted"
                                onClick={() => openEditDialog(page)}
                                >
                                <Settings className="h-4 w-4" />
                                <span className="sr-only">{t('common.settings', 'إعدادات')}</span>
                                </Button>

                                <Dialog>
                                <DialogTrigger asChild>
                                    <Button variant="ghost" size="sm" className="w-8 h-8 p-0 hover:bg-muted rounded-full">
                                    <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="w-56 p-2 gap-1">
                                    <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="w-full justify-start font-normal"
                                    asChild
                                    >
                                    <a href={getPageUrl(page.slug)} target="_blank" rel="noopener noreferrer">
                                        <Eye className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                                        {t('pages.manager.actions.preview', 'معاينة')}
                                    </a>
                                    </Button>
                                    <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="w-full justify-start font-normal"
                                    onClick={() => handleDuplicatePage(page)}
                                    >
                                    <Copy className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                                    {t('pages.manager.actions.duplicate', 'نسخ')}
                                    </Button>
                                    <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="w-full justify-start font-normal text-red-600 hover:text-red-700 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                        onClick={() => handleDeletePage(page.id)}
                                        disabled={SYSTEM_PAGES.includes(page.slug)}
                                    >
                                    <Trash2 className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                                    {t('pages.manager.actions.delete', 'حذف')}
                                    </Button>
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
        </TabsContent>

        <TabsContent value="components" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Header Card */}
                <Card className="group hover:border-primary cursor-pointer transition-all duration-300 border-2 border-border shadow-sm hover:shadow-xl overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 transition-all group-hover:bg-primary/10" />
                    <CardHeader className="pb-4">
                        <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mb-2 transition-transform group-hover:scale-110">
                             <PanelTop className="h-6 w-6 text-blue-600 dark:text-blue-400"/>
                        </div>
                        <CardTitle className="text-xl font-bold">
                             {isRTL ? 'قائمة الرأس (Header)' : 'Header Navigation'}
                        </CardTitle>
                        <CardDescription className="text-sm font-medium">
                            {isRTL ? 'تخصيص القائمة العلوية والشعار' : 'Customize top navigation and logo'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {siteConfig?.header?.logo && (
                            <div className="mb-4 flex items-center justify-between p-2.5 border-2 border-primary/20 rounded-xl bg-primary/5 shadow-inner">
                                <div className="flex items-center gap-3">
                                    <div className="p-1 bg-white rounded-lg shadow-sm border border-primary/10">
                                        <img src={siteConfig.header.logo} alt="Logo" className="h-6 object-contain" />
                                    </div>
                                    <div className="h-4 w-[1px] bg-primary/20 mx-0.5" />
                                    <div className="flex items-center gap-1.5 text-[10px] font-black text-primary uppercase tracking-tighter">
                                        <LayoutTemplate className="h-3 w-3" />
                                        <span>{isRTL ? 'التصنيفات' : 'Categories'}</span>
                                    </div>
                                </div>
                                <div className="flex gap-2.5 opacity-60">
                                    <Search className="h-3.5 w-3.5 text-primary" />
                                    <ShoppingBag className="h-3.5 w-3.5 text-primary" />
                                </div>
                            </div>
                        )}
                         <div className="mb-6 space-y-2 border-2 border-dashed rounded-xl p-4 bg-muted/20 group-hover:bg-white dark:group-hover:bg-gray-900 transition-colors shadow-inner">
                              <p className="text-[10px] font-black mb-3 text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                 <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                                 {isRTL ? 'روابط القائمة المخصصة' : 'Custom Menu Links'}
                              </p>
                              {siteConfig?.header?.links?.length > 0 ? (
                                  siteConfig.header.links.slice(0, 4).map((link: SiteLink) => (
                                      <div key={link.id} className="flex items-center justify-between text-xs font-bold leading-none p-1.5 rounded-md hover:bg-blue-50 transition-colors">
                                          <div className="flex items-center gap-2.5">
                                             <div className="w-1.5 h-1.5 rounded-full bg-blue-500/30" />
                                             <span className="truncate">{isRTL ? link.labelAr : link.label}</span>
                                          </div>
                                          <ChevronRight className={`h-3 w-3 opacity-20 ${isRTL ? 'rotate-180' : ''}`} />
                                      </div>
                                  ))
                              ) : (
                                 <div className="text-xs text-muted-foreground py-2 italic font-medium opacity-60 flex items-center gap-2">
                                      <AlertCircle className="h-3 w-3" />
                                      {isRTL ? 'لا توجد روابط إضافية حالياً' : 'No extra links currently'}
                                 </div>
                              )}
                              {siteConfig?.header?.links?.length > 4 && <div className="text-[9px] text-blue-600 font-extrabold pl-4 pt-1">+ {siteConfig.header.links.length - 4} {isRTL ? 'روابط أخرى' : 'more items'}</div>}
                          </div>
                        <Button 
                            variant="default" 
                            className="w-full h-11 bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 transition-all font-bold" 
                            onClick={() => navigate('/dashboard/navigation')}
                        >
                            <LayoutTemplate className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                            {isRTL ? 'تعديل التصميم' : 'Edit Design'}
                        </Button>
                    </CardContent>
                </Card>

                {/* Sidebar Card */}
                <Card className="group hover:border-primary cursor-pointer transition-all duration-300 border-2 border-border shadow-sm hover:shadow-xl overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full -mr-16 -mt-16 transition-all group-hover:bg-orange-500/10" />
                    <CardHeader className="pb-4">
                        <div className="w-12 h-12 rounded-xl bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center mb-2 transition-transform group-hover:scale-110">
                             <SidebarIcon className="h-6 w-6 text-orange-500"/>
                        </div>
                        <CardTitle className="text-xl font-bold">
                             {isRTL ? 'القائمة الجانبية (Sidebar)' : 'Sidebar Menu'}
                        </CardTitle>
                        <CardDescription className="text-sm font-medium">
                            {isRTL ? 'تخصيص القائمة الجانبية للتطبيق' : 'Customize mobile sidebar menu'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                         <div className="mb-6 space-y-2 border-2 border-dashed rounded-xl p-4 bg-muted/20 group-hover:bg-white dark:group-hover:bg-gray-900 transition-colors shadow-inner">
                             <p className="text-[10px] font-black mb-1 text-muted-foreground uppercase tracking-widest">{isRTL ? 'القائمة الرئيسية' : 'Main Menu'}:</p>
                             
                             {/* Fixed Storefront Links */}
                             <div className="flex items-center justify-between text-xs font-bold p-1 bg-orange-500/5 rounded-md text-orange-600">
                                 <div className="flex items-center gap-2.5">
                                    <Home className="h-3.5 w-3.5" />
                                    <span className="truncate">{isRTL ? 'الرئيسية' : 'Home'}</span>
                                 </div>
                                 <ChevronRight className={`h-3 w-3 opacity-30 ${isRTL ? 'rotate-180' : ''}`} />
                             </div>
                             <div className="flex items-center justify-between text-xs font-bold p-1 bg-orange-500/5 rounded-md text-orange-600">
                                 <div className="flex items-center gap-2.5">
                                    <ShoppingBag className="h-3.5 w-3.5" />
                                    <span className="truncate">{isRTL ? 'المنتجات' : 'Products'}</span>
                                 </div>
                                 <ChevronRight className={`h-3 w-3 opacity-30 ${isRTL ? 'rotate-180' : ''}`} />
                             </div>

                             {/* Custom Sidebar Links from config */}
                             {siteConfig?.sidebar?.links?.length > 0 && (
                                <div className="pt-2 space-y-1">
                                    {siteConfig.sidebar?.links?.slice(0, 3).map((link: SiteLink) => (
                                        <div key={link.id} className="flex items-center justify-between text-xs font-bold p-1 hover:bg-orange-50 rounded-md transition-colors">
                                            <div className="flex items-center gap-2.5 pl-1">
                                                <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                                                <span className="truncate">{isRTL ? link.labelAr : link.label}</span>
                                            </div>
                                            <ChevronRight className={`h-3 w-3 opacity-20 ${isRTL ? 'rotate-180' : ''}`} />
                                        </div>
                                    ))}
                                    {siteConfig.sidebar.links.length > 3 && <div className="text-[9px] text-orange-600 font-black pl-4">+ {siteConfig.sidebar.links.length - 3} {isRTL ? 'روابط إضافية' : 'more items'}</div>}
                                </div>
                             )}

                             <div className="pt-2 pb-1 border-t border-orange-500/10 text-[9px] font-black text-orange-500/60 tracking-tighter uppercase">
                                {isRTL ? 'صفحات المتجر (ما اخترته)' : 'STORE PAGES (VISIBLES)'}
                             </div>

                             {pages.filter(p => !sidebarHiddenPages.has(p.slug) && p.slug !== 'home' && p.slug !== 'products').length > 0 ? (
                                 pages.filter(p => !sidebarHiddenPages.has(p.slug) && p.slug !== 'home' && p.slug !== 'products').slice(0, 5).map(p => {
                                     const slug = p.slug.toLowerCase();
                                     let Icon = FileText;
                                     if (slug.includes('wallet') || slug.includes('balance') || p.title.includes('رصيد')) Icon = Wallet;
                                     if (slug.includes('report') || p.title.includes('تقارير')) Icon = BarChart3;
                                     if (slug.includes('support') || p.title.includes('دعم')) Icon = FileText;
                                     if (slug.includes('order') || p.title.includes('طلب')) Icon = ShoppingBag;
                                     if (slug.includes('employee') || p.title.includes('موظف')) Icon = Users;

                                     return (
                                         <div key={p.id} className="flex items-center justify-between text-xs font-semibold opacity-70 px-1 py-0.5">
                                             <div className="flex items-center gap-3">
                                                 <Icon className="h-3 w-3 text-orange-500/40" />
                                                 <span className="truncate">{p.title}</span>
                                             </div>
                                             <ChevronRight className={`h-3 w-3 opacity-10 ${isRTL ? 'rotate-180' : ''}`} />
                                         </div>
                                     );
                                 })
                             ) : (
                                <div className="text-[10px] text-muted-foreground py-1 italic opacity-50">{isRTL ? 'لا توجد صفحات إضافية ظاهرة' : 'No extra pages visible'}</div>
                             )}
                             {pages.filter(p => !sidebarHiddenPages.has(p.slug) && p.slug !== 'home' && p.slug !== 'products').length > 5 && (
                                <div className="text-[9px] text-muted-foreground/60 italic font-medium pl-6">
                                    + {pages.filter(p => !sidebarHiddenPages.has(p.slug) && p.slug !== 'home' && p.slug !== 'products').length - 5} {isRTL ? 'صفحات أخرى' : 'other pages'}
                                </div>
                             )}
                         </div>
                         <div className="flex gap-3">
                             <Button 
                                 variant="default" 
                                 className="flex-1 h-11 bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/20 transition-all font-bold" 
                                 onClick={() => navigate('/dashboard/navigation?tab=sidebar')}
                             >
                                 <LayoutTemplate className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                                 {isRTL ? 'تعديل التصميم' : 'Edit Design'}
                             </Button>
                             <Button 
                                 variant="outline" 
                                 className="h-11 border-2 border-orange-500/20 text-orange-600 hover:bg-orange-50 hover:border-orange-500/50 transition-all font-bold" 
                                 onClick={() => setShowSidebarEditor(true)}
                             >
                                <Settings className="h-4 w-4" />
                             </Button>
                         </div>
                    </CardContent>
                </Card>

                {/* Footer Card */}
                <Card className="group hover:border-primary cursor-pointer transition-all duration-300 border-2 border-border shadow-sm hover:shadow-xl overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 rounded-full -mr-16 -mt-16 transition-all group-hover:bg-teal-500/10" />
                    <CardHeader className="pb-4">
                        <div className="w-12 h-12 rounded-xl bg-teal-50 dark:bg-teal-900/20 flex items-center justify-center mb-2 transition-transform group-hover:scale-110">
                             <PanelBottom className="h-6 w-6 text-teal-600 dark:text-teal-400"/>
                        </div>
                        <CardTitle className="text-xl font-bold">
                             {isRTL ? 'تذييل الصفحة (Footer)' : 'Page Footer'}
                        </CardTitle>
                        <CardDescription className="text-sm font-medium">
                             {isRTL ? 'تخصيص روابط ومعلومات الفوتر' : 'Customize footer links and info'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="mb-6 space-y-2 border-2 border-dashed rounded-xl p-4 bg-muted/20 group-hover:bg-white dark:group-hover:bg-gray-900 transition-colors">
                             <p className="text-[10px] font-black mb-2 text-muted-foreground uppercase tracking-widest">{isRTL ? 'معاينة الروابط' : 'Links Preview'}:</p>
                             {siteConfig?.footer?.links?.length > 0 ? (
                                 siteConfig.footer.links.slice(0, 3).map((link: SiteLink) => (
                                     <div key={link.id} className="flex items-center gap-3 text-xs font-semibold">
                                         <div className="w-2 h-2 rounded-full bg-teal-500/40" />
                                         <span className="truncate">{isRTL ? link.labelAr : link.label}</span>
                                     </div>
                                 ))
                             ) : (
                                <div className="text-xs text-muted-foreground py-2 italic">{isRTL ? 'لا توجد روابط' : 'No links available'}</div>
                             )}
                             {siteConfig?.footer?.links?.length > 3 && <div className="text-[10px] text-muted-foreground font-bold pl-5 pt-1 opacity-70">+ {siteConfig.footer.links.length - 3} more...</div>}
                         </div>
                        <Button 
                            variant="outline" 
                            className="w-full h-11 border-2 border-teal-500/20 text-teal-600 hover:bg-teal-50 hover:border-teal-500/50 transition-all font-bold" 
                            onClick={() => navigate('/dashboard/navigation?tab=footer')}
                        >
                            <LayoutTemplate className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                            {isRTL ? 'تعديل التصميم' : 'Edit Design'}
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </TabsContent>
      </Tabs>
      <Dialog open={showSidebarEditor} onOpenChange={setShowSidebarEditor}>
        <DialogContent className="max-w-md">
            <DialogHeader>
                <DialogTitle>{isRTL ? 'تخصيص القائمة الجانبية' : 'Customize Sidebar'}</DialogTitle>
                <DialogDescription>
                    {isRTL ? 'اختر الصفحات التي تود إظهارها في القائمة الجانبية.' : 'Select pages to monitor in the sidebar menu.'}
                </DialogDescription>
            </DialogHeader>
            <div className="max-h-[300px] overflow-y-auto space-y-2 py-4 px-1">
                {pages.map(page => {
                    const isFixed = page.slug === 'home' || page.slug === 'products';
                    return (
                        <div 
                            key={page.id} 
                            className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${isFixed ? 'bg-muted/30 border-dashed opacity-70' : 'hover:bg-muted/50'}`}
                        >
                            <div className="flex items-center gap-3">
                                <span className={`text-sm font-bold ${isFixed ? 'text-muted-foreground' : ''}`}>
                                    {page.title}
                                </span>
                                {isFixed && <Badge variant="secondary" className="text-[9px] h-4 px-1">{isRTL ? 'نظام' : 'Fixed'}</Badge>}
                            </div>
                            {isFixed ? (
                                <div className="h-5 w-5 rounded-md border-2 border-primary/20 bg-primary/10 flex items-center justify-center">
                                    <Check className="h-3 w-3 text-primary" />
                                </div>
                            ) : (
                                <Checkbox 
                                    className="h-5 w-5 rounded-md"
                                    checked={!sidebarHiddenPages.has(page.slug)}
                                    onCheckedChange={(checked) => {
                                        const newHidden = new Set(sidebarHiddenPages);
                                        if (checked) {
                                            newHidden.delete(page.slug);
                                        } else {
                                            newHidden.add(page.slug);
                                        }
                                        setSidebarHiddenPages(newHidden);
                                    }}
                                />
                            )}
                        </div>
                    );
                })}
            </div>
            <Button onClick={handleSaveSidebarConfig} disabled={loading} className="w-full">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : t('common.save', 'Save Changes')}
            </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
