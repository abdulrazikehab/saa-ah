import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FileText, ChevronRight, ChevronDown, Sparkles, Home, ShoppingBag, Store, Users, Wallet, BarChart3, User, PanelLeftClose } from 'lucide-react';
import { cn } from '@/lib/utils';
import { coreApi } from '@/lib/api';
import { useTranslation } from 'react-i18next';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { useStoreSettings } from '@/contexts/StoreSettingsContext';
import { useAuth } from '@/contexts/AuthContext';

interface PagesSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  logoUrl?: string;
  storeName?: string;
  onPageSelect?: (page: NavigationPage) => void;
}

interface NavigationPage {
  id: string;
  title: string;
  titleAr?: string;
  titleEn?: string;
  slug: string;
  url: string;
  type?: string; // To distinguish between custom pages and system pages if needed
}

export function PagesSidebar({ isOpen, onClose, logoUrl, storeName, onPageSelect }: PagesSidebarProps) {
  const { i18n } = useTranslation();
  const language = i18n.language as 'ar' | 'en';
  const isRTL = language === 'ar';
  const location = useLocation();
  const navigate = useNavigate();
  const [pages, setPages] = useState<NavigationPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSection, setExpandedSection] = useState(true);
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const { settings } = useStoreSettings();
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    const loadPages = async (retryCount = 0) => {
      try {
        setLoading(true);
        const data = await coreApi.get('/public/navigation-pages', { requireAuth: false });
        console.log('[PagesSidebar] Navigation pages response:', data);
        
        // Handle different response formats
        let pagesArray: NavigationPage[] = [];
        
        if (Array.isArray(data)) {
          // Response is directly an array
          pagesArray = data;
        } else if (data && data.pages && Array.isArray(data.pages)) {
          // Response is { pages: [...] }
          pagesArray = data.pages;
        } else if (data && Array.isArray(data.data)) {
          // Response is { data: [...] }
          pagesArray = data.data;
        } else if (data && typeof data === 'object') {
          // Try to find any array property
          const arrayKey = Object.keys(data).find(key => Array.isArray((data as any)[key]));
          if (arrayKey) {
            pagesArray = (data as any)[arrayKey];
          } else {
            console.warn('[PagesSidebar] No array found in response:', data);
          }
        } else {
          console.warn('[PagesSidebar] Invalid response format:', data);
        }
        
        // Validate and map pages to ensure they have required fields
        const validPages = pagesArray
          .filter((page: any) => page && page.id && page.slug)
          .map((page: any) => ({
            id: page.id,
            title: page.title || page.titleAr || page.titleEn || 'Untitled',
            titleAr: page.titleAr,
            titleEn: page.titleEn,
            slug: page.slug,
            url: (() => {
              const cleanSlug = (page.slug || '').replace(/^page\//, '').replace(/^\//, '');
              if (cleanSlug === 'home' || cleanSlug === 'store') return '/';
              if (cleanSlug === 'products') return '/products';
              if (cleanSlug === 'support') return `/support`;
              if (page.url?.startsWith('http')) return page.url;
              return `/${cleanSlug}`;
            })(),
            type: page.type,
          }));
        
        // Create a Set of existing slugs for faster lookup
        const existingSlugs = new Set(validPages.map((p: any) => p.slug));

        // Inject Default System Pages if they don't exist
        const systemDefaults = [
           { id: 'virtual-about-us', slug: 'about-us', title: 'About Us', titleAr: 'من نحن', type: 'system' },
           { id: 'virtual-faqs', slug: 'faqs', title: 'FAQs', titleAr: 'الأسئلة الشائعة', type: 'system' },
           { id: 'virtual-contact', slug: 'contact', title: 'Contact Us', titleAr: 'اتصل بنا', type: 'system' },
           { id: 'virtual-support', slug: 'support', title: 'Support', titleAr: 'الدعم الفني', type: 'system' },
           { id: 'virtual-privacy', slug: 'privacy', title: 'Privacy Policy', titleAr: 'سياسة الخصوصية', type: 'system' },
        ];

        // Conditional Wallet Pages
        if (settings?.paymentMethods?.includes('wallet') || settings?.buyByBalance) {
            if (!existingSlugs.has('charge-wallet')) {
                systemDefaults.push({ id: 'virtual-charge-wallet', slug: 'charge-wallet', title: 'Charge Wallet', titleAr: 'شحن المحفظة', type: 'system' });
            }
            if (!existingSlugs.has('balance-operations')) {
                systemDefaults.push({ id: 'virtual-balance-operations', slug: 'balance-operations', title: 'Transactions', titleAr: 'سجل العمليات', type: 'system' });
            }
        }
        
        const mergedPages = [...validPages];
        systemDefaults.forEach(def => {
            // Check for duplicate slug OR duplicate title (case-insensitive)
            const exists = validPages.some(p => 
                p.slug === def.slug || 
                (p.title && p.title.toLowerCase() === def.title.toLowerCase()) ||
                (p.titleEn && p.titleEn.toLowerCase() === def.title.toLowerCase()) ||
                (p.titleAr && p.titleAr === def.titleAr)
            );

            if (!exists) {
                mergedPages.push({
                    id: def.id,
                    title: def.title,
                    titleAr: def.titleAr,
                    titleEn: def.title,
                    slug: def.slug,
                    url: `/${def.slug}`,
                    type: def.type
                });
            }
        });

        // Filter out hidden pages based on settings AND auth status
        const filteredPages = mergedPages.filter(p => {
             // 1. Check settings hidden list
             if (settings?.sidebarHidden && Array.isArray(settings.sidebarHidden)) {
                 if (settings.sidebarHidden.includes(p.slug)) return false;
             }

             // 2. Filter Auth pages (Always hide from sidebar as they are in header/actions)
             const authSlugs = ['login', 'register', 'sign-in', 'sign-up', 'forgot-password', 'reset-password'];
             if (authSlugs.includes(p.slug.toLowerCase())) return false;
             
             // 3. Filter "Cart" and "Checkout" as they have dedicated icons/flows usually
             // unless explicitly requested? Assuming they clutter the sidebar.
             // But user didn't explicitly ask for Cart removal, just "sign in sign up".
             // Keeping Cart/Checkout might be useful if they want direct access.
             
             return true;
        });

        console.log('[PagesSidebar] Final pages count:', filteredPages.length);
        setPages(filteredPages);
      } catch (error: any) {
        console.error('[PagesSidebar] Failed to load navigation pages:', error);
        
        // Retry logic...
        if (retryCount === 0 && (error?.status === 0 || error?.isNetworkError)) {
           // ... existing retry logic
           setTimeout(() => loadPages(1), 1000);
           return;
        }

        // On error, still show defaults at least
        setPages([
           { id: 'virtual-about-us', slug: 'about-us', title: 'About Us', titleAr: 'من نحن', url: '/about-us', type: 'system' },
           { id: 'virtual-faqs', slug: 'faqs', title: 'FAQs', titleAr: 'الأسئلة الشائعة', url: '/faqs', type: 'system' },
        ]);
      } finally {
        setLoading(false);
      }
    };
    
    if (isOpen) {
      loadPages();
    }
  }, [isOpen, settings, isAuthenticated]);

  // Update selected page when route changes
  useEffect(() => {
    const currentPage = pages.find(p => location.pathname === `/${p.slug}` || location.pathname === p.url);
    if (currentPage) {
      setSelectedPageId(currentPage.id);
    } else {
      setSelectedPageId(null);
    }
  }, [location.pathname, pages]);

  // Handle page selection
  const handlePageClick = (page: NavigationPage) => {
    setSelectedPageId(page.id);
    if (onPageSelect) {
      onPageSelect(page);
    }
    navigate(`/${page.slug}`);
    // Don't auto-close - let user close manually or navigate
  };

  const isActivePath = (path: string) => {
    return location.pathname === path;
  };

  // Helper to get icon for page based on title or slug (optional enhancement)
  const getPageIcon = (page: NavigationPage) => {
    const title = (page.title || '').toLowerCase();
    const titleAr = (page.titleAr || '').toLowerCase();
    const titleEn = (page.titleEn || '').toLowerCase();
    const slug = (page.slug || '').toLowerCase();
    
    if (title.includes('employee') || title.includes('staff') || titleAr.includes('موظف') || slug.includes('employee')) return Users;
    if (title.includes('wallet') || title.includes('balance') || titleAr.includes('رصيد') || titleAr.includes('محفظة') || slug.includes('wallet') || slug.includes('balance')) return Wallet;
    if (title.includes('report') || titleAr.includes('تقارير') || slug.includes('report')) return BarChart3;
    if (title.includes('profile') || titleAr.includes('ملف') || slug.includes('profile')) return User;
    if (title.includes('order') || titleAr.includes('طلب') || slug.includes('order')) return ShoppingBag;
    if (title.includes('favorite') || titleAr.includes('مفضل') || slug.includes('favorite')) return Store;
    if (title.includes('support') || titleAr.includes('دعم') || slug.includes('support')) return FileText;
    if (title.includes('categor') || titleAr.includes('فئ') || slug.includes('categor')) return Store;
    if (title.includes('store') || titleAr.includes('متجر') || slug.includes('store')) return Store;
    return FileText;
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] transition-all duration-500",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      {/* Sidebar */}
      <div
        className={cn(
          "fixed top-0 bottom-0 w-[320px] max-w-[90vw] z-[101] transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) flex flex-col",
          "bg-background/95 backdrop-blur-xl border-r shadow-2xl dark:bg-[#0f172a]/95",
          isRTL ? "right-0 border-l border-r-0 rounded-l-3xl" : "left-0 rounded-r-3xl",
          isOpen 
            ? "translate-x-0" 
            : isRTL ? "translate-x-full" : "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4 border-b border-border/50">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-muted/20 transition-colors text-muted-foreground hover:text-foreground"
              aria-label={language === 'ar' ? 'إغلاق' : 'Close'}
            >
              <PanelLeftClose className="h-5 w-5" />
            </button>
            <span className="text-base font-medium text-foreground">
              {language === 'ar' ? 'تصفح صفحات المتجر' : 'Browse Store Pages'}
            </span>
          </div>
          
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center overflow-hidden shadow-inner">
            {logoUrl ? (
              <img 
                src={logoUrl} 
                alt={storeName || "Store Logo"} 
                className="w-full h-full object-contain p-1.5" 
              />
            ) : (
              <Store className="h-5 w-5 text-primary" />
            )}
          </div>
        </div>

        {/* Removed decorative divider as we used border-b above */}
        
        {/* Main Navigation Cards */}
        <div className="px-5 space-y-3 mb-6 mt-6">
          <Link
            to="/"
            onClick={onClose}
            className={cn(
              "group flex items-center justify-between p-4 rounded-2xl transition-all duration-300 border",
              location.pathname === '/'
                ? "bg-primary/10 border-primary/30 shadow-lg shadow-primary/10"
                : "bg-muted/30 border-transparent hover:bg-muted/50 hover:border-border/50"
            )}
          >
            <div className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300",
              location.pathname === '/' 
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30" 
                : "bg-muted text-muted-foreground group-hover:bg-primary/20 group-hover:text-primary"
            )}>
              <Home className="h-6 w-6" />
            </div>
            <span className={cn(
              "flex-1 px-4 text-lg font-medium transition-colors",
              location.pathname === '/' ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
            )}>
              {language === 'ar' ? 'الرئيسية' : 'Home'}
            </span>
          </Link>
          
          <Link
            to="/products"
            onClick={onClose}
            className={cn(
              "group flex items-center justify-between p-4 rounded-2xl transition-all duration-300 border",
              location.pathname === '/products'
                ? "bg-primary/10 border-primary/30 shadow-lg shadow-primary/10"
                : "bg-muted/30 border-transparent hover:bg-muted/50 hover:border-border/50"
            )}
          >
            <div className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300",
              location.pathname === '/products' 
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30" 
                : "bg-muted text-muted-foreground group-hover:bg-primary/20 group-hover:text-primary"
            )}>
              <ShoppingBag className="h-6 w-6" />
            </div>
            <span className={cn(
              "flex-1 px-4 text-lg font-medium transition-colors",
              location.pathname === '/products' ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
            )}>
              {language === 'ar' ? 'المنتجات' : 'Products'}
            </span>
          </Link>
        </div>

        {/* Pages Section */}
        <div className="flex-1 overflow-hidden flex flex-col px-5">
          <button
            onClick={() => setExpandedSection(!expandedSection)}
            className="flex items-center justify-between w-full py-3 text-primary hover:text-primary/80 transition-colors group"
          >
            <span className="text-sm font-bold tracking-wide uppercase">
              {language === 'ar' ? 'صفحات المتجر' : 'Store Pages'}
            </span>
            <ChevronDown className={cn(
              "h-4 w-4 transition-transform duration-300",
              !expandedSection && "rotate-180"
            )} />
          </button>

          {expandedSection && (
            <ScrollArea className="flex-1 -mx-2 px-2">
              <div className="space-y-2 pb-6 pt-2">
                {loading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-16 rounded-2xl bg-slate-800/30 animate-pulse" />
                    ))}
                  </div>
                ) : pages.length > 0 ? (
                  pages.map((page, index) => {
                    const Icon = getPageIcon(page);
                    const isActive = isActivePath(`/${page.slug}`);
                    const isSelected = selectedPageId === page.id;
                    
                    return (
                        <button
                        key={page.id}
                        onClick={() => handlePageClick(page)}
                        className={cn(
                          "group flex items-center justify-between p-3 rounded-2xl transition-all duration-300 border w-full text-left",
                          isActive || isSelected
                            ? "bg-primary/10 border-primary/20"
                            : "bg-transparent border-transparent hover:bg-muted/50 hover:border-border/50"
                        )}
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300",
                          isActive || isSelected
                            ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                            : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                        )}>
                          <Icon className="h-5 w-5" />
                        </div>
                        
                        <span className={cn(
                          "flex-1 px-3 text-base font-medium transition-colors",
                          isActive || isSelected ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                        )}>
                          {isRTL ? (page.titleAr || page.title) : (page.titleEn || page.title)}
                        </span>
                        
                        <ChevronRight className={cn(
                          "h-4 w-4 transition-all duration-300",
                          isRTL && "rotate-180",
                          isActive || isSelected
                            ? "text-primary translate-x-1 rtl:-translate-x-1" 
                            : "text-muted-foreground group-hover:text-foreground"
                        )} />
                      </button>
                    );
                  })
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center opacity-50">
                    <FileText className="h-10 w-10 text-slate-500 mb-3" />
                    <p className="text-sm text-slate-400">
                      {language === 'ar' ? 'لا توجد صفحات إضافية' : 'No additional pages'}
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 mt-auto">
          <div className="relative overflow-hidden rounded-2xl bg-slate-900 border border-white/5 p-4 group">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-400">
                <Sparkles className="h-4 w-4 text-amber-500" />
                <span className="text-xs font-medium">
                  {language === 'ar' 
                    ? `${pages.length} صفحة متاحة` 
                    : `${pages.length} page${pages.length !== 1 ? 's' : ''} available`}
                </span>
              </div>
              <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
