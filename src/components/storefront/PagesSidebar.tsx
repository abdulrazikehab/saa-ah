import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { X, FileText, ChevronRight, ChevronDown, Sparkles, Home, ShoppingBag, Store, Users, Wallet, BarChart3, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { coreApi } from '@/lib/api';
import { useTranslation } from 'react-i18next';
import { ScrollArea } from '@/components/ui/scroll-area';

interface PagesSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  logoUrl?: string;
  storeName?: string;
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

export function PagesSidebar({ isOpen, onClose, logoUrl, storeName }: PagesSidebarProps) {
  const { i18n } = useTranslation();
  const language = i18n.language as 'ar' | 'en';
  const isRTL = language === 'ar';
  const location = useLocation();
  const [pages, setPages] = useState<NavigationPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSection, setExpandedSection] = useState(true);

  useEffect(() => {
    const loadPages = async () => {
      try {
        setLoading(true);
        const data = await coreApi.get('/public/navigation-pages', { requireAuth: false });
        if (data && data.pages && Array.isArray(data.pages)) {
          setPages(data.pages);
        }
      } catch (error) {
        console.error('Failed to load navigation pages:', error);
        setPages([]);
      } finally {
        setLoading(false);
      }
    };
    
    if (isOpen) {
      loadPages();
    }
  }, [isOpen]);

  // Close sidebar when route changes
  useEffect(() => {
    onClose();
  }, [location.pathname]);

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
          "bg-[#0f172a] border-r border-white/5 shadow-2xl",
          isRTL ? "right-0 border-l border-r-0 rounded-l-3xl" : "left-0 rounded-r-3xl",
          isOpen 
            ? "translate-x-0" 
            : isRTL ? "translate-x-full" : "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/10 transition-colors text-slate-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
            <span className="text-base font-medium text-slate-200">
              {language === 'ar' ? 'تصفح صفحات المتجر' : 'Browse Store Pages'}
            </span>
          </div>
          
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center overflow-hidden shadow-inner">
            {logoUrl ? (
              <img 
                src={logoUrl} 
                alt={storeName || "Store Logo"} 
                className="w-full h-full object-contain p-1.5" 
              />
            ) : (
              <Store className="h-5 w-5 text-indigo-400" />
            )}
          </div>
        </div>

        <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent w-full mb-4" />

        {/* Main Navigation Cards */}
        <div className="px-5 space-y-3 mb-6">
          <Link
            to="/"
            onClick={onClose}
            className={cn(
              "group flex items-center justify-between p-4 rounded-2xl transition-all duration-300 border",
              location.pathname === '/'
                ? "bg-slate-800/80 border-indigo-500/30 shadow-lg shadow-indigo-500/10"
                : "bg-slate-900/50 border-white/5 hover:bg-slate-800 hover:border-white/10"
            )}
          >
            <div className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300",
              location.pathname === '/' 
                ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/30" 
                : "bg-slate-800 text-slate-400 group-hover:bg-slate-700 group-hover:text-white"
            )}>
              <Home className="h-6 w-6" />
            </div>
            <span className={cn(
              "flex-1 px-4 text-lg font-medium transition-colors",
              location.pathname === '/' ? "text-white" : "text-slate-400 group-hover:text-white"
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
                ? "bg-slate-800/80 border-indigo-500/30 shadow-lg shadow-indigo-500/10"
                : "bg-slate-900/50 border-white/5 hover:bg-slate-800 hover:border-white/10"
            )}
          >
            <div className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300",
              location.pathname === '/products' 
                ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/30" 
                : "bg-slate-800 text-slate-400 group-hover:bg-slate-700 group-hover:text-white"
            )}>
              <ShoppingBag className="h-6 w-6" />
            </div>
            <span className={cn(
              "flex-1 px-4 text-lg font-medium transition-colors",
              location.pathname === '/products' ? "text-white" : "text-slate-400 group-hover:text-white"
            )}>
              {language === 'ar' ? 'المنتجات' : 'Products'}
            </span>
          </Link>
        </div>

        {/* Pages Section */}
        <div className="flex-1 overflow-hidden flex flex-col px-5">
          <button
            onClick={() => setExpandedSection(!expandedSection)}
            className="flex items-center justify-between w-full py-3 text-amber-500 hover:text-amber-400 transition-colors group"
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
                    const isActive = isActivePath(`/page/${page.slug}`);
                    
                    return (
                      <Link
                        key={page.id}
                        to={`/page/${page.slug}`}
                        className={cn(
                          "group flex items-center justify-between p-3 rounded-2xl transition-all duration-300 border",
                          isActive
                            ? "bg-amber-500/10 border-amber-500/20"
                            : "bg-transparent border-transparent hover:bg-slate-800/50 hover:border-white/5"
                        )}
                        style={{ animationDelay: `${index * 50}ms` }}
                        onClick={onClose}
                      >
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300",
                          isActive
                            ? "bg-amber-500 text-white shadow-lg shadow-amber-500/20"
                            : "bg-slate-800/50 text-slate-400 group-hover:bg-slate-700 group-hover:text-white"
                        )}>
                          <Icon className="h-5 w-5" />
                        </div>
                        
                        <span className={cn(
                          "flex-1 px-3 text-base font-medium transition-colors",
                          isActive ? "text-amber-500" : "text-slate-400 group-hover:text-slate-200"
                        )}>
                          {isRTL ? (page.titleAr || page.title) : (page.titleEn || page.title)}
                        </span>
                        
                        <ChevronRight className={cn(
                          "h-4 w-4 transition-all duration-300",
                          isRTL && "rotate-180",
                          isActive 
                            ? "text-amber-500 translate-x-1 rtl:-translate-x-1" 
                            : "text-slate-600 group-hover:text-slate-400"
                        )} />
                      </Link>
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
