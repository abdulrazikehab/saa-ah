import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  ShoppingCart, User, Search, Menu, X, Sun, Moon, Globe, ChevronDown, ChevronRight,
  Heart, Sparkles, Phone, Mail, MapPin, LogOut, Package, Settings, Bell,
  FileText, PanelLeftOpen, Wallet, ShoppingBag, CheckCircle, AlertCircle, Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { CustomerLogin } from './CustomerLogin';
import { CustomerSignup } from './CustomerSignup';
import { PagesSidebar } from './PagesSidebar';
import { coreApi } from '@/lib/api';
import { useTranslation } from 'react-i18next';
import { useCart } from '@/contexts/CartContext';
import { cn } from '@/lib/utils';
import { isMainDomain } from '@/lib/domain';
import { UserProfile, SiteConfig, Category, Link as SiteLink } from '@/services/types';
import { walletService } from '@/services/wallet.service';

// Notification types for store events
interface StoreNotification {
  id: string;
  type: 'order' | 'product' | 'promo' | 'wallet' | 'info';
  title: string;
  titleAr: string;
  message: string;
  messageAr: string;
  timestamp: Date;
  read: boolean;
  link?: string;
}

interface StorefrontHeaderProps {
  cartItemCount?: number;
  onSearch?: (query: string) => void;
}

export function StorefrontHeader({ cartItemCount: propCount = 0, onSearch }: StorefrontHeaderProps) {
  const { cart } = useCart();
  const { i18n } = useTranslation();
  const cartItemCount = cart?.items?.reduce((total, item) => total + (item.quantity || 1), 0) || propCount;
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [language, setLanguage] = useState<'ar' | 'en'>(i18n.language as 'ar' | 'en' || 'ar');
  const [customerData, setCustomerData] = useState<UserProfile | null>(null);
  const [siteConfig, setSiteConfig] = useState<SiteConfig | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [navigationPages, setNavigationPages] = useState<{ id: string; title: string; slug: string; url: string }[]>([]);
  const [showCategories, setShowCategories] = useState(false);
  const [showPagesSidebar, setShowPagesSidebar] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [notifications, setNotifications] = useState<StoreNotification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Scroll detection for header styling
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close user menu when clicking outside
  useEffect(() => {
    if (!showUserMenu) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const userMenuButton = target.closest('[data-user-menu-button]');
      const userMenuDropdown = target.closest('[data-user-menu-dropdown]');
      
      if (!userMenuButton && !userMenuDropdown) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showUserMenu]);

  // Close notifications when clicking outside
  useEffect(() => {
    if (!showNotifications) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const notificationsDropdown = target.closest('[data-notifications-dropdown]');
      const bellButton = target.closest('button')?.querySelector('svg');
      const isBellButton = bellButton && bellButton.getAttribute('class')?.includes('Bell');
      
      if (!notificationsDropdown && !isBellButton) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotifications]);

  useEffect(() => {
    const isMain = isMainDomain();

    if (location.state && (location.state as { showLogin?: boolean }).showLogin && isMain) {
      setShowLogin(true);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  useEffect(() => {
    const token = localStorage.getItem('customerToken');
    const data = localStorage.getItem('customerData');
    if (token && data) {
      setCustomerData(JSON.parse(data));
    }
  }, []);

  // Load wallet balance for logged-in customer
  useEffect(() => {
    const loadWalletBalance = async () => {
      if (customerData) {
        try {
          const wallet = await walletService.getBalance();
          // Ensure we use the actual balance from the wallet, default to 0 if not found
          const balance = wallet?.balance ? Number(wallet.balance) : 0;
          setWalletBalance(balance);
        } catch (error) {
          console.error('Failed to load wallet balance:', error);
          // Reset to 0 on error to ensure we don't show stale data
          setWalletBalance(0);
        }
      } else {
        // Reset balance when customer logs out
        setWalletBalance(0);
      }
    };
    loadWalletBalance();
  }, [customerData]);

  // Load store notifications (real events only)
  useEffect(() => {
    const loadNotifications = async () => {
      try {
        let storeNotifs: StoreNotification[] = [];
        
        // Fetch real notifications from API (only if customer is logged in)
        if (customerData) {
          try {
            const response = await coreApi.get('/notifications', { requireAuth: true }).catch(() => null);
            if (response && Array.isArray(response)) {
              storeNotifs = response.map((n: { 
                id: string; 
                type?: string; 
                titleEn?: string; 
                titleAr?: string; 
                bodyEn?: string; 
                bodyAr?: string; 
                createdAt?: string; 
                readAt?: string; 
                data?: Record<string, unknown>;
              }) => ({
                id: n.id,
                type: (n.type as 'order' | 'product' | 'promo' | 'wallet' | 'info') || 'info',
                title: n.titleEn || 'Notification',
                titleAr: n.titleAr || 'إشعار',
                message: n.bodyEn || '',
                messageAr: n.bodyAr || '',
                timestamp: new Date(n.createdAt || Date.now()),
                read: !!n.readAt,
                link: typeof n.data?.link === 'string' ? n.data.link : undefined,
              }));
            }
          } catch (e) {
            console.warn('Failed to fetch notifications API', e);
          }
        }
        
        setNotifications(storeNotifs);
      } catch (error) {
        console.error('Failed to load notifications:', error);
        setNotifications([]);
      }
    };
    
    loadNotifications();
  }, [customerData]);

  useEffect(() => {
    const loadSiteConfig = async () => {
      try {
        const searchParams = new URLSearchParams(window.location.search);
        const themePreviewId = searchParams.get('theme_preview');
        
        let url = '/site-config';
        if (themePreviewId) url += `?themeId=${themePreviewId}`;
        
        const config = await coreApi.get(url, { requireAuth: false });
        setSiteConfig(config);
        if (config.settings?.language) setLanguage(config.settings.language);
        
        if (config.settings?.colors) {
          Object.entries(config.settings.colors).forEach(([key, value]) => {
            document.documentElement.style.setProperty(key, value as string);
          });
        }
      } catch (error) {
        console.error('Failed to load site config:', error);
      }
    };
    loadSiteConfig();
  }, []);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await coreApi.get('/categories', { requireAuth: false });
        if (data && typeof data === 'object' && !('error' in data) && !('statusCode' in data)) {
          let allCategories: Category[] = [];
          if (Array.isArray(data)) {
            allCategories = data.filter((c: Category) => 
              c && typeof c === 'object' && c.id && !('error' in c) && !('statusCode' in c)
            );
          } else if (data.categories && Array.isArray(data.categories)) {
            allCategories = data.categories.filter((c: Category) => 
              c && typeof c === 'object' && c.id && !('error' in c) && !('statusCode' in c)
            );
          }
          
          // Filter to show only parent categories (categories without a parentId)
          const parentCategories = allCategories.filter((c: Category) => 
            !c.parentId || c.parentId === null || c.parentId === ''
          );
          
          setCategories(parentCategories);
        }
      } catch (error) {
        console.error('Failed to load categories:', error);
        setCategories([]);
      }
    };
    loadCategories();
  }, []);

  // Load navigation pages for subdomain storefronts
  useEffect(() => {
    const loadNavigationPages = async () => {
      try {
        const data = await coreApi.get('/public/navigation-pages', { requireAuth: false });
        if (data && data.pages && Array.isArray(data.pages)) {
          setNavigationPages(data.pages);
        }
      } catch (error) {
        console.error('Failed to load navigation pages:', error);
        setNavigationPages([]);
      }
    };
    loadNavigationPages();
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) onSearch(searchQuery);
  };

  const handleLogout = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    try {
      // Clear all customer-related data
      localStorage.removeItem('customerToken');
      localStorage.removeItem('customerData');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      
      // Clear cookies
      document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      document.cookie = 'refreshToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      document.cookie = 'customerToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      
      // Reset state
      setCustomerData(null);
      setWalletBalance(0);
      setShowUserMenu(false);
      
      // Navigate to home and reload to clear all state
      navigate('/', { replace: true });
      setTimeout(() => {
        window.location.reload();
      }, 100);
    } catch (error) {
      console.error('Logout error:', error);
      // Force reload even if there's an error
      window.location.href = '/';
    }
  };

  useEffect(() => {
    setLanguage(i18n.language as 'ar' | 'en');
  }, [i18n.language]);

  const toggleLanguage = () => {
    const newLang = language === 'ar' ? 'en' : 'ar';
    i18n.changeLanguage(newLang);
    localStorage.setItem('language', newLang);
    setLanguage(newLang);
    
    const dir = newLang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.dir = dir;
    document.documentElement.setAttribute('dir', dir);
    if (document.body) {
      document.body.dir = dir;
      document.body.setAttribute('dir', dir);
    }
  };

  const storeName = String(language === 'ar' 
    ? ((siteConfig?.settings as Record<string, unknown>)?.storeNameAr || 'متجري')
    : ((siteConfig?.settings as Record<string, unknown>)?.storeName || 'My Store'));

  // Build header links: default links
  const defaultLinks: SiteLink[] = [
    { label: language === 'ar' ? 'الرئيسية' : 'Home', labelAr: 'الرئيسية', url: '/' },
    { label: language === 'ar' ? 'المنتجات' : 'Products', labelAr: 'المنتجات', url: '/products' },
  ];
  
  const headerLinks = siteConfig?.header?.links || defaultLinks;
  const headerButtons = siteConfig?.header?.buttons || [];

  const isActivePath = (path: string) => {
    return location.pathname === path || 
      (path !== '/' && location.pathname.startsWith(path));
  };

  return (
    <>
      <header className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300",
        isScrolled 
          ? "shadow-lg glass-effect-strong border-b border-border/30" 
          : "bg-background/95 backdrop-blur-sm border-b border-border/20"
      )}>
        {/* Animated Gradient Top Bar */}
        <div className="absolute top-0 left-0 right-0 h-[2px] gradient-aurora animate-gradient bg-[length:300%_auto]" />
        
        {/* Single Unified Header */}
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Pages Sidebar Toggle Arrow - Before Logo */}
            {navigationPages.length > 0 && (
              <button
                onClick={() => setShowPagesSidebar(true)}
                className={cn(
                  "flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-300 shrink-0",
                  "bg-muted/50 hover:bg-primary/10 text-muted-foreground hover:text-primary",
                  "border border-border/50 hover:border-primary/30 hover:shadow-md"
                )}
                title={language === 'ar' ? 'الصفحات' : 'Pages'}
              >
                <ChevronRight className={cn(
                  "h-5 w-5 transition-transform",
                  language === 'ar' ? "rotate-180" : ""
                )} />
              </button>
            )}

            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group shrink-0">
              <div className="relative">
                <div className="absolute inset-0 rounded-xl gradient-primary blur-lg opacity-0 group-hover:opacity-40 transition-opacity duration-500" />
                {siteConfig?.settings?.storeLogoUrl ? (
                  <img 
                    src={String(siteConfig.settings.storeLogoUrl)} 
                    alt={storeName}
                    className="relative h-10 w-10 object-contain rounded-xl transition-transform duration-300 group-hover:scale-110"
                  />
                ) : (
                  <div className="relative h-10 w-10 gradient-primary rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:shadow-glow">
                    {storeName.charAt(0)}
                  </div>
                )}
              </div>
              <span className="text-lg font-bold hidden sm:block gradient-text">
                {storeName}
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1 flex-1 justify-center">
              {/* Categories Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowCategories(!showCategories)}
                  onMouseEnter={() => setShowCategories(true)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-300",
                    showCategories 
                      ? "gradient-primary text-white shadow-glow" 
                      : "hover:bg-muted/50 text-foreground"
                  )}
                >
                  <ChevronDown className={cn(
                    "h-4 w-4 transition-transform duration-300",
                    showCategories && "rotate-180"
                  )} />
                  <span>{language === 'ar' ? 'التصنيفات' : 'Categories'}</span>
                </button>
                
                {/* Categories Dropdown Menu */}
                {showCategories && (
                  <>
                    {/* Backdrop for mobile */}
                    <div 
                      className="fixed inset-0 z-40 lg:hidden"
                      onClick={() => setShowCategories(false)}
                    />
                    <div 
                      className={cn(
                        "absolute top-full mt-2 rounded-2xl shadow-2xl border border-border/50 z-50 overflow-hidden animate-scale-in glass-effect-strong",
                        language === 'ar' ? "right-0" : "left-0",
                        "w-64 sm:w-72 max-w-[calc(100vw-2rem)]"
                      )}
                      onMouseLeave={() => setShowCategories(false)}
                    >
                      <div className="py-2 max-h-[60vh] sm:max-h-80 overflow-y-auto scrollbar-thin">
                        {categories.length > 0 ? (
                          categories.map((category: Category, index: number) => (
                            <Link
                              key={category.id}
                              to={`/categories/${category.id}`}
                              className="flex items-center gap-3 px-4 py-2.5 hover:bg-primary/5 transition-all duration-300 group animate-slide-up"
                              style={{ animationDelay: `${index * 50}ms` }}
                              onClick={() => setShowCategories(false)}
                            >
                              {category.image ? (
                                <img 
                                  src={category.image} 
                                  alt={category.name}
                                  className="w-8 h-8 rounded-lg object-cover ring-2 ring-border/50 group-hover:ring-primary/50 transition-all shrink-0"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-lg gradient-mesh flex items-center justify-center shrink-0">
                                  <Package className="w-4 h-4 text-primary" />
                                </div>
                              )}
                              <span className="font-medium group-hover:text-primary transition-colors truncate">
                                {String(category.name || '')}
                              </span>
                            </Link>
                          ))
                        ) : (
                          <div className="px-4 py-6 text-center text-muted-foreground">
                            <Package className="w-6 h-6 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">{language === 'ar' ? 'لا توجد تصنيفات' : 'No categories'}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Header Links */}
              {headerLinks.map((link: SiteLink, index: number) => {
                const label = String(language === 'ar' ? (link?.labelAr || link?.label || '') : (link?.label || ''));
                const url = String(link?.url || '#');
                const isActive = isActivePath(url);

                return (
                  <Link
                    key={index}
                    to={url}
                    className={cn(
                      "relative px-4 py-2 rounded-xl font-medium transition-all duration-300 group",
                      isActive 
                        ? "text-primary bg-primary/10" 
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                  >
                    {label}
                  </Link>
                );
              })}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-1 sm:gap-2">
              {/* Pages Sidebar Arrow Button (Mobile only) */}
              {navigationPages.length > 0 && (
                <button
                  onClick={() => setShowPagesSidebar(true)}
                  className={cn(
                    "lg:hidden flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-300",
                    "bg-muted/50 hover:bg-primary/10 text-muted-foreground hover:text-primary",
                    "border border-border/50 hover:border-primary/30"
                  )}
                  title={language === 'ar' ? 'الصفحات' : 'Pages'}
                >
                  <ChevronRight className={cn(
                    "h-4 w-4",
                    language === 'ar' ? "rotate-180" : ""
                  )} />
                </button>
              )}

              {/* Language Toggle */}
              <button
                onClick={toggleLanguage}
                className="flex items-center gap-1 px-2 sm:px-3 py-2 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all duration-300"
                title={language === 'ar' ? 'Switch to English' : 'التبديل إلى العربية'}
              >
                <Globe className="h-4 w-4" />
                <span className="text-xs font-semibold hidden sm:inline">{language === 'ar' ? 'EN' : 'عربي'}</span>
              </button>
              
              {/* Theme Toggle */}
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="p-2 rounded-xl hover:bg-muted/50 transition-all duration-300 group"
                aria-label={isDarkMode ? 'Light mode' : 'Dark mode'}
                title={isDarkMode ? (language === 'ar' ? 'الوضع الفاتح' : 'Light mode') : (language === 'ar' ? 'الوضع الداكن' : 'Dark mode')}
              >
                {isDarkMode ? (
                  <Sun className="h-4 w-4 text-warning group-hover:rotate-180 transition-transform duration-500" />
                ) : (
                  <Moon className="h-4 w-4 text-muted-foreground group-hover:rotate-12 transition-transform duration-300" />
                )}
              </button>

              {/* Search Button */}
              <button
                onClick={() => setShowSearch(!showSearch)}
                className={cn(
                  "p-2 rounded-xl transition-all duration-300",
                  showSearch 
                    ? "bg-primary/10 text-primary" 
                    : "hover:bg-muted/50"
                )}
                aria-label="Search"
              >
                <Search className="h-4 w-4" />
              </button>

              {/* Notifications Bell */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className={cn(
                    "relative p-2 rounded-xl transition-all duration-300 group",
                    showNotifications ? "bg-primary/10 text-primary" : "hover:bg-muted/50"
                  )}
                >
                  <Bell className="h-4 w-4 group-hover:text-primary transition-colors" />
                  {notifications.filter(n => !n.read).length > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px] font-bold bg-red-500 text-white border-2 border-background animate-bounce-in">
                      {notifications.filter(n => !n.read).length}
                    </Badge>
                  )}
                </button>
                
                {/* Notifications Dropdown */}
                {showNotifications && (
                  <>
                    {/* Backdrop for mobile */}
                    <div 
                      className="fixed inset-0 z-40 lg:hidden"
                      onClick={() => setShowNotifications(false)}
                    />
                    <div 
                      data-notifications-dropdown
                      className={cn(
                        "absolute top-full mt-2 rounded-2xl shadow-2xl border border-border/50 z-50 overflow-hidden glass-effect-strong animate-scale-in",
                        language === 'ar' ? "right-0" : "left-0",
                        "w-80 sm:w-96 max-w-[calc(100vw-2rem)]"
                      )}
                    >
                      <div className="p-3 border-b border-border/50 flex items-center justify-between bg-muted/30">
                        <h3 className="font-semibold text-sm">
                          {language === 'ar' ? 'الإشعارات' : 'Notifications'}
                        </h3>
                        {notifications.length > 0 && (
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              try {
                                await coreApi.put('/notifications/read-all', {});
                                setNotifications(prev => prev.map(n => ({ ...n, read: true })));
                              } catch (error) {
                                console.error('Failed to mark all as read', error);
                              }
                            }}
                            className="text-xs text-primary hover:underline whitespace-nowrap ml-2"
                          >
                            {language === 'ar' ? 'تحديد الكل كمقروء' : 'Mark all read'}
                          </button>
                        )}
                      </div>
                      <div className="max-h-[60vh] sm:max-h-80 overflow-y-auto scrollbar-thin">
                        {notifications.length === 0 ? (
                          <div className="p-6 text-center text-muted-foreground">
                            <Bell className="h-8 w-8 mx-auto mb-2 opacity-30" />
                            <p className="text-sm">{language === 'ar' ? 'لا توجد إشعارات' : 'No notifications'}</p>
                          </div>
                        ) : (
                          <div className="divide-y divide-border/30">
                            {notifications.map((notif) => (
                              <div
                                key={notif.id}
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  try {
                                    if (!notif.read) {
                                      await coreApi.put(`/notifications/${notif.id}/read`, {});
                                      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n));
                                    }
                                    if (notif.link) {
                                      navigate(notif.link);
                                    }
                                    setShowNotifications(false);
                                  } catch (error) {
                                    console.error('Failed to mark notification as read', error);
                                  }
                                }}
                                className={cn(
                                  "flex items-start gap-3 p-3 cursor-pointer transition-colors",
                                  notif.read ? "bg-transparent hover:bg-muted/30" : "bg-primary/5 hover:bg-primary/10"
                                )}
                              >
                                <div className={cn(
                                  "p-2 rounded-lg shrink-0 flex-shrink-0",
                                  notif.type === 'order' && "bg-blue-500/10 text-blue-500",
                                  notif.type === 'product' && "bg-green-500/10 text-green-500",
                                  notif.type === 'promo' && "bg-orange-500/10 text-orange-500",
                                  notif.type === 'wallet' && "bg-purple-500/10 text-purple-500",
                                  notif.type === 'info' && "bg-gray-500/10 text-gray-500"
                                )}>
                                  {notif.type === 'order' && <ShoppingBag className="h-4 w-4" />}
                                  {notif.type === 'product' && <Package className="h-4 w-4" />}
                                  {notif.type === 'promo' && <Sparkles className="h-4 w-4" />}
                                  {notif.type === 'wallet' && <Wallet className="h-4 w-4" />}
                                  {notif.type === 'info' && <Info className="h-4 w-4" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-2">
                                    <p className="font-medium text-sm line-clamp-1 flex-1">
                                      {language === 'ar' ? notif.titleAr : notif.title}
                                    </p>
                                    {!notif.read && (
                                      <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />
                                    )}
                                  </div>
                                  <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                                    {language === 'ar' ? notif.messageAr : notif.message}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-1.5">
                                    {new Date(notif.timestamp).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', {
                                      year: 'numeric',
                                      month: 'short',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Wallet Balance (for logged-in users in digital card stores) */}
              {customerData && siteConfig && siteConfig.settings && siteConfig.settings.storeType === 'DIGITAL_CARDS' && (
                <Link 
                  to="/charge-wallet"
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors cursor-pointer"
                  title={language === 'ar' ? 'الرصيد - اضغط للشحن' : 'Balance - Click to recharge'}
                >
                  <Wallet className="h-4 w-4" />
                  <span>{walletBalance.toFixed(2)} {siteConfig?.settings?.currency === 'SAR' ? 'ر.س' : (siteConfig?.settings?.currency || 'ر.س')}</span>
                </Link>
              )}

              {/* Wishlist */}
              <Link
                to="/wishlist"
                className="hidden sm:flex p-2 rounded-xl hover:bg-muted/50 transition-all duration-300 group"
              >
                <Heart className="h-4 w-4 group-hover:text-accent transition-colors" />
              </Link>

              {/* Cart */}
              <Link
                to="/cart"
                className="relative p-2 rounded-xl hover:bg-muted/50 transition-all duration-300 group"
              >
                <ShoppingCart className="h-4 w-4 group-hover:text-primary transition-colors" />
                {cartItemCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px] font-bold gradient-accent text-white border-2 border-background animate-bounce-in shadow-glow-accent">
                    {cartItemCount}
                  </Badge>
                )}
              </Link>

              {/* User Menu */}
              {customerData ? (
                <div className="relative group">
                  <button 
                    data-user-menu-button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 p-2 rounded-xl hover:bg-muted/50 transition-all duration-300"
                  >
                    <div className="w-7 h-7 rounded-full gradient-primary flex items-center justify-center text-white text-xs font-bold">
                      {String(customerData?.firstName?.charAt(0) || 'U')}
                    </div>
                    <ChevronDown className={cn(
                      "h-4 w-4 hidden md:block transition-transform duration-300",
                      showUserMenu && "rotate-180"
                    )} />
                  </button>
                  
                  {showUserMenu && (
                    <>
                      {/* Backdrop for mobile */}
                      <div 
                        className="fixed inset-0 z-40 lg:hidden"
                        onClick={() => setShowUserMenu(false)}
                      />
                      <div 
                        data-user-menu-dropdown
                        className={cn(
                          "absolute top-full pt-2 transition-all duration-300 z-50",
                          language === 'ar' ? "left-0" : "right-0"
                        )}
                      >
                        <div className={cn(
                          "rounded-2xl shadow-2xl border border-border/50 overflow-hidden glass-effect-strong animate-scale-in",
                          "w-52 sm:w-56 max-w-[calc(100vw-2rem)]"
                        )}>
                          <div className="p-3 border-b border-border/50 gradient-mesh">
                            <p className="font-semibold text-sm truncate">{customerData?.firstName} {customerData?.lastName}</p>
                            <p className="text-xs text-muted-foreground truncate">{customerData?.email}</p>
                            {(customerData as any)?.isEmployee && (customerData as any)?.employerEmail && (
                              <p className="text-xs text-primary truncate mt-1">
                                {language === 'ar' ? 'موظف لدى: ' : 'Employee of: '}{(customerData as any).employerEmail}
                              </p>
                            )}
                          </div>
                          <div className="py-1">
                            <Link
                              to="/account/orders"
                              onClick={() => setShowUserMenu(false)}
                              className="flex items-center gap-3 px-4 py-2 hover:bg-primary/5 transition-colors text-sm"
                            >
                              <Package className="h-4 w-4 text-muted-foreground shrink-0" />
                              <span>{language === 'ar' ? 'طلباتي' : 'My Orders'}</span>
                            </Link>
                            <Link
                              to="/account/profile"
                              onClick={() => setShowUserMenu(false)}
                              className="flex items-center gap-3 px-4 py-2 hover:bg-primary/5 transition-colors text-sm"
                            >
                              <Settings className="h-4 w-4 text-muted-foreground shrink-0" />
                              <span>{language === 'ar' ? 'الإعدادات' : 'Settings'}</span>
                            </Link>
                          </div>
                          <div className="py-1 border-t border-border/50">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setShowUserMenu(false);
                                handleLogout(e);
                              }}
                              className="w-full flex items-center gap-3 px-4 py-2 text-destructive hover:bg-destructive/5 transition-colors text-sm"
                            >
                              <LogOut className="h-4 w-4 shrink-0" />
                              <span>{language === 'ar' ? 'تسجيل الخروج' : 'Logout'}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                  
                  {/* Desktop hover menu (only shows on hover when click menu is closed) */}
                  {!showUserMenu && (
                    <div 
                      className={cn(
                        "absolute top-full pt-2 opacity-0 invisible lg:group-hover:opacity-100 lg:group-hover:visible transition-all duration-300 z-50 hidden lg:block",
                        language === 'ar' ? "left-0" : "right-0"
                      )}
                    >
                      <div className={cn(
                        "rounded-2xl shadow-2xl border border-border/50 overflow-hidden glass-effect-strong",
                        "w-52 sm:w-56"
                      )}>
                        <div className="p-3 border-b border-border/50 gradient-mesh">
                          <p className="font-semibold text-sm truncate">{customerData?.firstName} {customerData?.lastName}</p>
                          <p className="text-xs text-muted-foreground truncate">{customerData?.email}</p>
                          {(customerData as any)?.isEmployee && (customerData as any)?.employerEmail && (
                            <p className="text-xs text-primary truncate mt-1">
                              {language === 'ar' ? 'موظف لدى: ' : 'Employee of: '}{(customerData as any).employerEmail}
                            </p>
                          )}
                        </div>
                        <div className="py-1">
                          <Link
                            to="/account/orders"
                            className="flex items-center gap-3 px-4 py-2 hover:bg-primary/5 transition-colors text-sm"
                          >
                            <Package className="h-4 w-4 text-muted-foreground shrink-0" />
                            <span>{language === 'ar' ? 'طلباتي' : 'My Orders'}</span>
                          </Link>
                          <Link
                            to="/account/profile"
                            className="flex items-center gap-3 px-4 py-2 hover:bg-primary/5 transition-colors text-sm"
                          >
                            <Settings className="h-4 w-4 text-muted-foreground shrink-0" />
                            <span>{language === 'ar' ? 'الإعدادات' : 'Settings'}</span>
                          </Link>
                        </div>
                        <div className="py-1 border-t border-border/50">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleLogout(e);
                            }}
                            className="w-full flex items-center gap-3 px-4 py-2 text-destructive hover:bg-destructive/5 transition-colors text-sm"
                          >
                            <LogOut className="h-4 w-4 shrink-0" />
                            <span>{language === 'ar' ? 'تسجيل الخروج' : 'Logout'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="hidden md:flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowLogin(true)}
                    className="rounded-xl hover:bg-muted/50 h-8 px-3 text-sm"
                  >
                    {language === 'ar' ? 'دخول' : 'Login'}
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setShowSignup(true)}
                    className="rounded-xl gradient-primary text-white hover:shadow-glow transition-shadow h-8 px-3 text-sm"
                  >
                    {language === 'ar' ? 'تسجيل' : 'Sign Up'}
                  </Button>
                </div>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="lg:hidden p-2 rounded-xl hover:bg-muted/50 transition-all duration-300"
              >
                {showMobileMenu ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          {/* Search Bar */}
          {showSearch && (
            <form onSubmit={handleSearch} className="mt-3 animate-slide-down">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder={language === 'ar' ? 'ابحث عن المنتجات...' : 'Search products...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-10 rounded-xl border-2 border-border/50 focus:border-primary/50 bg-muted/30"
                  autoFocus
                />
                <Button 
                  type="submit" 
                  size="sm" 
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg gradient-primary text-white h-7"
                >
                  {language === 'ar' ? 'بحث' : 'Search'}
                </Button>
              </div>
            </form>
          )}
        </div>

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className="lg:hidden border-t border-border/30 glass-effect-strong animate-slide-down">
            <nav className="container mx-auto px-4 py-4 flex flex-col gap-2">
              {/* Categories in Mobile */}
              <div className="space-y-1">
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl font-medium bg-muted/30">
                  <ChevronDown className="h-4 w-4" />
                  <span>{language === 'ar' ? 'التصنيفات' : 'Categories'}</span>
                </div>
                <div className="pl-4 border-l-2 border-primary/30 ml-4 space-y-1">
                  {categories.slice(0, 5).map((category) => (
                    <Link
                      key={category.id}
                      to={`/categories/${category.id}`}
                      className="block px-4 py-2 text-sm text-muted-foreground hover:text-primary transition-colors rounded-lg hover:bg-primary/5"
                      onClick={() => setShowMobileMenu(false)}
                    >
                      {String(category.name || '')}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Header Links */}
              {headerLinks.map((link: SiteLink, index: number) => {
                const label = String(language === 'ar' ? (link?.labelAr || link?.label || '') : (link?.label || ''));
                const url = String(link?.url || '#');
                const isActive = isActivePath(url);

                return (
                  <Link
                    key={index}
                    to={url}
                    className={cn(
                      "px-4 py-2 rounded-xl font-medium transition-all duration-300",
                      isActive 
                        ? "bg-primary/10 text-primary" 
                        : "hover:bg-muted/50"
                    )}
                    onClick={() => setShowMobileMenu(false)}
                  >
                    {label}
                  </Link>
                );
              })}

              {/* Pages Button in Mobile */}
              {navigationPages.length > 0 && (
                <button
                  onClick={() => {
                    setShowMobileMenu(false);
                    setShowPagesSidebar(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-300 hover:bg-muted/50 text-left"
                >
                  <PanelLeftOpen className="h-4 w-4" />
                  <span>{language === 'ar' ? 'الصفحات' : 'Pages'}</span>
                  <Badge variant="secondary" className="ml-auto text-xs">
                    {navigationPages.length}
                  </Badge>
                </button>
              )}
              
              {/* Wallet Balance in Mobile Menu (for digital card stores) */}
              {customerData && siteConfig && siteConfig.settings && siteConfig.settings.storeType === 'DIGITAL_CARDS' && (
                <Link
                  to="/charge-wallet"
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 text-primary font-medium hover:bg-primary/20 transition-colors"
                  onClick={() => setShowMobileMenu(false)}
                >
                  <Wallet className="h-4 w-4" />
                  <span>{language === 'ar' ? 'الرصيد' : 'Balance'}: {walletBalance.toFixed(2)} {siteConfig?.settings?.currency === 'SAR' ? 'ر.س' : (siteConfig?.settings?.currency || 'ر.س')}</span>
                </Link>
              )}

              {!customerData && (
                <div className="pt-4 border-t border-border/30 space-y-2">
                  <Button
                    variant="outline"
                    className="w-full rounded-xl h-10"
                    onClick={() => {
                      setShowLogin(true);
                      setShowMobileMenu(false);
                    }}
                  >
                    {language === 'ar' ? 'تسجيل الدخول' : 'Login'}
                  </Button>
                  <Button
                    className="w-full rounded-xl h-10 gradient-primary text-white hover:shadow-glow"
                    onClick={() => {
                      setShowSignup(true);
                      setShowMobileMenu(false);
                    }}
                  >
                    {language === 'ar' ? 'إنشاء حساب' : 'Sign Up'}
                  </Button>
                </div>
              )}
            </nav>
          </div>
        )}
      </header>

      {/* Pages Sidebar */}
      <PagesSidebar 
        isOpen={showPagesSidebar} 
        onClose={() => setShowPagesSidebar(false)} 
        logoUrl={siteConfig?.settings?.storeLogoUrl ? String(siteConfig.settings.storeLogoUrl) : undefined}
        storeName={storeName}
      />

      {/* Login Modal */}
      {showLogin && (
        <CustomerLogin
          onClose={() => setShowLogin(false)}
          onSwitchToSignup={() => {
            setShowLogin(false);
            setShowSignup(true);
          }}
          onLoginSuccess={async () => {
            setShowLogin(false);
            // Refresh customer data in header
            const customerData = localStorage.getItem('customerData');
            if (customerData) {
              try {
                const parsedCustomerData = JSON.parse(customerData);
                setCustomerData(parsedCustomerData);
                // Immediately refresh wallet balance after login
                try {
                  const wallet = await walletService.getBalance();
                  const balance = wallet?.balance ? Number(wallet.balance) : 0;
                  setWalletBalance(balance);
                } catch (error) {
                  console.error('Failed to load wallet balance after login:', error);
                  setWalletBalance(0);
                }
              } catch (e) {
                console.error('Failed to parse customer data', e);
              }
            }
            // Don't reload the page - just update the state
            // The customer data is already loaded, no need for full page reload
          }}
        />
      )}

      {/* Signup Modal */}
      {showSignup && (
        <CustomerSignup
          onClose={() => setShowSignup(false)}
          onSwitchToLogin={() => {
            setShowSignup(false);
            setShowLogin(true);
          }}
          onSignupSuccess={() => {
            setShowSignup(false);
            window.location.reload();
          }}
        />
      )}
    </>
  );
}
