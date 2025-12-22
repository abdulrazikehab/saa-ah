import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  ShoppingCart, User, Search, Menu, X, Sun, Moon, Globe, ChevronDown, 
  Heart, Sparkles, Phone, Mail, MapPin, LogOut, Package, Settings, Bell
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { CustomerLogin } from './CustomerLogin';
import { CustomerSignup } from './CustomerSignup';
import { coreApi } from '@/lib/api';
import { useTranslation } from 'react-i18next';
import { useCart } from '@/contexts/CartContext';
import { cn } from '@/lib/utils';
import { isMainDomain } from '@/lib/domain';
import { UserProfile, SiteConfig, Category, Link as SiteLink } from '@/services/types';

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
  const [showCategories, setShowCategories] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Scroll detection for header styling
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
          if (Array.isArray(data)) {
            const validCategories = data.filter((c: Category) => 
              c && typeof c === 'object' && c.id && !('error' in c) && !('statusCode' in c)
            );
            setCategories(validCategories);
          } else if (data.categories && Array.isArray(data.categories)) {
            const validCategories = data.categories.filter((c: Category) => 
              c && typeof c === 'object' && c.id && !('error' in c) && !('statusCode' in c)
            );
            setCategories(validCategories);
          }
        }
      } catch (error) {
        console.error('Failed to load categories:', error);
        setCategories([]);
      }
    };
    loadCategories();
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

  const handleLogout = () => {
    localStorage.removeItem('customerToken');
    localStorage.removeItem('customerData');
    setCustomerData(null);
    window.location.reload();
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

  const storeName = language === 'ar' 
    ? (siteConfig?.settings?.storeNameAr || 'متجري')
    : (siteConfig?.settings?.storeName || 'My Store');

  const headerLinks = siteConfig?.header?.links || [
    { label: language === 'ar' ? 'الرئيسية' : 'Home', url: '/' },
    { label: language === 'ar' ? 'المنتجات' : 'Products', url: '/products' },
    { label: language === 'ar' ? 'العروض' : 'Offers', url: '/offers' },
    { label: language === 'ar' ? 'من نحن' : 'About', url: '/about' },
    { label: language === 'ar' ? 'اتصل بنا' : 'Contact', url: '/contact' },
  ];

  const headerButtons = siteConfig?.header?.buttons || [];

  const isActivePath = (path: string) => {
    return location.pathname === path || 
      (path !== '/' && location.pathname.startsWith(path));
  };

  return (
    <>
      <header className={cn(
        "sticky top-0 z-50 w-full transition-all duration-500",
        isScrolled 
          ? "shadow-lg" 
          : "shadow-none"
      )}>
        {/* Animated Gradient Top Bar */}
        <div className="absolute top-0 left-0 right-0 h-[2px] gradient-aurora animate-gradient bg-[length:300%_auto]" />
        
        {/* Top Info Bar */}
        <div className={cn(
          "relative overflow-hidden transition-all duration-500",
          isScrolled ? "h-0 opacity-0" : "h-auto opacity-100"
        )}>
          <div className="absolute inset-0 gradient-mesh opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-secondary/5" />
          
          <div className="container relative mx-auto px-4 py-2.5">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-6">
                <a href={`tel:${siteConfig?.settings?.phone || '+966501234567'}`} 
                   className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors group">
                  <Phone className="h-3.5 w-3.5 group-hover:animate-wiggle" />
                  <span className="hidden sm:inline">{siteConfig?.settings?.phone || '+966 50 123 4567'}</span>
                </a>
                <a href={`mailto:${siteConfig?.settings?.email || 'info@store.com'}`}
                   className="hidden md:flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors group">
                  <Mail className="h-3.5 w-3.5 group-hover:animate-wiggle" />
                  <span>{siteConfig?.settings?.email || 'info@store.com'}</span>
                </a>
              </div>
              
              <div className="flex items-center gap-4">
                {/* Promo Banner */}
                <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium animate-pulse">
                  <Sparkles className="h-3 w-3" />
                  <span>{language === 'ar' ? 'شحن مجاني للطلبات فوق 200 ر.س' : 'Free shipping over 200 SAR'}</span>
                </div>
                
                {/* Language Toggle */}
                <button
                  onClick={toggleLanguage}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all duration-300"
                >
                  <Globe className="h-4 w-4" />
                  <span className="text-xs font-semibold">{language === 'ar' ? 'EN' : 'عربي'}</span>
                </button>
                
                {/* Theme Toggle */}
                <button
                  onClick={() => setIsDarkMode(!isDarkMode)}
                  className="p-2 rounded-lg hover:bg-muted/50 transition-all duration-300 group"
                  aria-label={isDarkMode ? 'Light mode' : 'Dark mode'}
                >
                  {isDarkMode ? (
                    <Sun className="h-4 w-4 text-warning group-hover:rotate-180 transition-transform duration-500" />
                  ) : (
                    <Moon className="h-4 w-4 text-muted-foreground group-hover:rotate-12 transition-transform duration-300" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Header */}
        <div className={cn(
          "relative transition-all duration-300",
          isScrolled 
            ? "glass-effect-strong border-b border-border/30" 
            : "bg-background/95 backdrop-blur-sm border-b border-border/20"
        )}>
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between gap-6">
              {/* Logo */}
              <Link to="/" className="flex items-center gap-3 group">
                <div className="relative">
                  <div className="absolute inset-0 rounded-xl gradient-primary blur-lg opacity-0 group-hover:opacity-40 transition-opacity duration-500" />
                  {siteConfig?.settings?.storeLogoUrl ? (
                    <img 
                      src={siteConfig.settings.storeLogoUrl} 
                      alt={storeName}
                      className="relative h-12 w-12 object-contain rounded-xl transition-transform duration-300 group-hover:scale-110"
                    />
                  ) : (
                    <div className="relative h-12 w-12 gradient-primary rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:shadow-glow">
                      {storeName.charAt(0)}
                    </div>
                  )}
                </div>
                <span className="text-xl font-bold hidden sm:block gradient-text">
                  {storeName}
                </span>
              </Link>

              {/* Categories Dropdown */}
              <div className="hidden md:block relative">
                <button
                  onClick={() => setShowCategories(!showCategories)}
                  onMouseEnter={() => setShowCategories(true)}
                  className={cn(
                    "flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all duration-300",
                    showCategories 
                      ? "gradient-primary text-white shadow-glow" 
                      : "bg-primary/10 hover:bg-primary/20 text-foreground"
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
                  <div 
                    className="absolute top-full left-0 mt-2 w-72 rounded-2xl shadow-2xl border border-border/50 z-50 overflow-hidden animate-scale-in glass-effect-strong"
                    onMouseLeave={() => setShowCategories(false)}
                  >
                    <div className="py-2 max-h-96 overflow-y-auto scrollbar-thin">
                      {categories.length > 0 ? (
                        categories.map((category: Category, index: number) => (
                          <Link
                            key={category.id}
                            to={`/categories/${category.id}`}
                            className="flex items-center gap-4 px-4 py-3 hover:bg-primary/5 transition-all duration-300 group animate-slide-up"
                            style={{ animationDelay: `${index * 50}ms` }}
                            onClick={() => setShowCategories(false)}
                          >
                            {category.image ? (
                              <img 
                                src={category.image} 
                                alt={category.name}
                                className="w-10 h-10 rounded-lg object-cover ring-2 ring-border/50 group-hover:ring-primary/50 transition-all"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-lg gradient-mesh flex items-center justify-center">
                                <Package className="w-5 h-5 text-primary" />
                              </div>
                            )}
                            <div className="flex-1">
                              <div className="font-medium group-hover:text-primary transition-colors">
                                {String(category.name || '')}
                              </div>
                              {category.description && typeof category.description === 'string' && (
                                <div className="text-xs text-muted-foreground line-clamp-1">
                                  {category.description}
                                </div>
                              )}
                            </div>
                            <ChevronDown className="w-4 h-4 -rotate-90 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all" />
                          </Link>
                        ))
                      ) : (
                        <div className="px-4 py-8 text-center text-muted-foreground">
                          <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">{language === 'ar' ? 'لا توجد تصنيفات' : 'No categories available'}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Desktop Navigation */}
              <nav className="hidden lg:flex items-center gap-1">
                {headerLinks.map((link: SiteLink, index: number) => {
                  const label = String(language === 'ar' ? (link?.labelAr || link?.label || '') : (link?.label || ''));
                  const url = String(link?.url || '#');
                  const isActive = isActivePath(url);
                  
                  if (link.type === 'dropdown') {
                    return (
                      <div key={index} className="relative group">
                        <button className={cn(
                          "flex items-center gap-1.5 px-4 py-2 rounded-xl font-medium transition-all duration-300",
                          "hover:bg-muted/50"
                        )}>
                          {label}
                          <ChevronDown className="h-4 w-4 transition-transform group-hover:rotate-180" />
                        </button>
                        <div className="absolute top-full left-0 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                          <div className="w-48 rounded-xl shadow-xl border border-border/50 overflow-hidden glass-effect-strong">
                            {link.children && Array.isArray(link.children) && (link.children as SiteLink[]).map((child: SiteLink, childIndex: number) => {
                              const childLabel = String(language === 'ar' ? (child?.labelAr || child?.label || '') : (child?.label || ''));
                              return (
                                <Link
                                  key={childIndex}
                                  to={String(child?.url || '#')}
                                  className="block px-4 py-3 text-sm hover:bg-primary/5 hover:text-primary transition-colors"
                                >
                                  {childLabel}
                                </Link>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <Link
                      key={index}
                      to={url}
                      className={cn(
                        "relative px-4 py-2 rounded-xl font-medium transition-all duration-300 group",
                        isActive 
                          ? "text-primary" 
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <span className={cn(
                        "absolute inset-0 rounded-xl transition-all duration-300",
                        isActive ? "bg-primary/10" : "group-hover:bg-muted/50"
                      )} />
                      {isActive && (
                        <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-0.5 rounded-full gradient-primary" />
                      )}
                      <span className="relative">{label}</span>
                    </Link>
                  );
                })}
                
                {/* Custom Buttons */}
                {headerButtons.map((button: SiteLink & { variant?: string }, index: number) => {
                  const buttonLabel = String(button?.label || '');
                  const buttonUrl = String(button?.url || '#');
                  const isPrimary = button.variant === 'primary';
                  
                  return (
                    <Link
                      key={`btn-${index}`}
                      to={buttonUrl}
                      className={cn(
                        "px-5 py-2 rounded-xl font-semibold transition-all duration-300",
                        isPrimary 
                          ? "gradient-primary text-white hover:shadow-glow hover:scale-105" 
                          : "border-2 border-primary text-primary hover:bg-primary hover:text-white"
                      )}
                    >
                      {buttonLabel}
                    </Link>
                  );
                })}
              </nav>

              {/* Actions */}
              <div className="flex items-center gap-2">
                {/* Search Button */}
                <button
                  onClick={() => setShowSearch(!showSearch)}
                  className={cn(
                    "p-2.5 rounded-xl transition-all duration-300",
                    showSearch 
                      ? "bg-primary/10 text-primary" 
                      : "hover:bg-muted/50"
                  )}
                  aria-label="Search"
                >
                  <Search className="h-5 w-5" />
                </button>

                {/* Wishlist */}
                <Link
                  to="/wishlist"
                  className="hidden sm:flex p-2.5 rounded-xl hover:bg-muted/50 transition-all duration-300 group"
                >
                  <Heart className="h-5 w-5 group-hover:text-accent transition-colors" />
                </Link>

                {/* Cart */}
                <Link
                  to="/cart"
                  className="relative p-2.5 rounded-xl hover:bg-muted/50 transition-all duration-300 group"
                >
                  <ShoppingCart className="h-5 w-5 group-hover:text-primary transition-colors" />
                  {cartItemCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-[10px] font-bold gradient-accent text-white border-2 border-background animate-bounce-in shadow-glow-accent">
                      {cartItemCount}
                    </Badge>
                  )}
                </Link>

                {/* User Menu */}
                {customerData ? (
                  <div className="relative group">
                    <button className="flex items-center gap-2 p-2 rounded-xl hover:bg-muted/50 transition-all duration-300">
                      <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-white text-sm font-bold">
                        {String(customerData?.firstName?.charAt(0) || 'U')}
                      </div>
                      <span className="hidden md:inline text-sm font-medium max-w-[100px] truncate">
                        {String(customerData?.firstName || '')}
                      </span>
                      <ChevronDown className="h-4 w-4 hidden md:block transition-transform group-hover:rotate-180" />
                    </button>
                    
                    <div className="absolute right-0 top-full pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300">
                      <div className="w-56 rounded-2xl shadow-2xl border border-border/50 overflow-hidden glass-effect-strong">
                        <div className="p-4 border-b border-border/50 gradient-mesh">
                          <p className="font-semibold">{customerData?.firstName} {customerData?.lastName}</p>
                          <p className="text-sm text-muted-foreground truncate">{customerData?.email}</p>
                        </div>
                        <div className="py-2">
                          <Link
                            to="/account/orders"
                            className="flex items-center gap-3 px-4 py-2.5 hover:bg-primary/5 transition-colors"
                          >
                            <Package className="h-4 w-4 text-muted-foreground" />
                            <span>{language === 'ar' ? 'طلباتي' : 'My Orders'}</span>
                          </Link>
                          <Link
                            to="/account/profile"
                            className="flex items-center gap-3 px-4 py-2.5 hover:bg-primary/5 transition-colors"
                          >
                            <Settings className="h-4 w-4 text-muted-foreground" />
                            <span>{language === 'ar' ? 'الإعدادات' : 'Settings'}</span>
                          </Link>
                        </div>
                        <div className="py-2 border-t border-border/50">
                          <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-destructive hover:bg-destructive/5 transition-colors"
                          >
                            <LogOut className="h-4 w-4" />
                            <span>{language === 'ar' ? 'تسجيل الخروج' : 'Logout'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="hidden md:flex items-center gap-2">
                    {isMainDomain() ? (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowLogin(true)}
                          className="rounded-xl hover:bg-muted/50"
                        >
                          {language === 'ar' ? 'تسجيل الدخول' : 'Login'}
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => setShowSignup(true)}
                          className="rounded-xl gradient-primary text-white hover:shadow-glow transition-shadow"
                        >
                          {language === 'ar' ? 'إنشاء حساب' : 'Sign Up'}
                        </Button>
                      </>
                    ) : (
                      <>
                        <Link to="/auth/login">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="rounded-xl hover:bg-muted/50"
                          >
                            {language === 'ar' ? 'تسجيل الدخول' : 'Login'}
                          </Button>
                        </Link>
                        <Link to="/auth/signup">
                          <Button
                            size="sm"
                            className="rounded-xl gradient-primary text-white hover:shadow-glow transition-shadow"
                          >
                            {language === 'ar' ? 'إنشاء حساب' : 'Sign Up'}
                          </Button>
                        </Link>
                      </>
                    )}
                  </div>
                )}

                {/* Mobile Menu Button */}
                <button
                  onClick={() => setShowMobileMenu(!showMobileMenu)}
                  className="lg:hidden p-2.5 rounded-xl hover:bg-muted/50 transition-all duration-300"
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
              <form onSubmit={handleSearch} className="mt-4 animate-slide-down">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder={language === 'ar' ? 'ابحث عن المنتجات...' : 'Search products...'}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 h-12 text-lg rounded-xl border-2 border-border/50 focus:border-primary/50 bg-muted/30"
                    autoFocus
                  />
                  <Button 
                    type="submit" 
                    size="sm" 
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg gradient-primary text-white"
                  >
                    {language === 'ar' ? 'بحث' : 'Search'}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className="lg:hidden border-t border-border/30 glass-effect-strong animate-slide-down">
            <nav className="container mx-auto px-4 py-4 flex flex-col gap-2">
              {headerLinks.map((link: SiteLink, index: number) => {
                const label = String(language === 'ar' ? (link?.labelAr || link?.label || '') : (link?.label || ''));
                const url = String(link?.url || '#');
                const isActive = isActivePath(url);

                if (link.type === 'dropdown') {
                  return (
                    <div key={index} className="space-y-1 animate-slide-up" style={{ animationDelay: `${index * 50}ms` }}>
                      <div className="flex items-center gap-2 px-4 py-3 rounded-xl font-medium bg-muted/30">
                        {label}
                        <ChevronDown className="h-4 w-4 opacity-50" />
                      </div>
                      <div className="pr-4 border-r-2 border-primary/30 mr-4 space-y-1">
                        {link.children && Array.isArray(link.children) && (link.children as SiteLink[]).map((child: SiteLink, childIndex: number) => {
                          const childLabel = String(language === 'ar' ? (child?.labelAr || child?.label || '') : (child?.label || ''));
                          return (
                            <Link
                              key={childIndex}
                              to={String(child?.url || '#')}
                              className="block px-4 py-2.5 text-sm text-muted-foreground hover:text-primary transition-colors rounded-lg hover:bg-primary/5"
                              onClick={() => setShowMobileMenu(false)}
                            >
                              {childLabel}
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  );
                }

                return (
                  <Link
                    key={index}
                    to={url}
                    className={cn(
                      "px-4 py-3 rounded-xl font-medium transition-all duration-300 animate-slide-up",
                      isActive 
                        ? "bg-primary/10 text-primary" 
                        : "hover:bg-muted/50"
                    )}
                    style={{ animationDelay: `${index * 50}ms` }}
                    onClick={() => setShowMobileMenu(false)}
                  >
                    {label}
                  </Link>
                );
              })}
              
              {!customerData && (
                <div className="pt-4 border-t border-border/30 space-y-2 animate-slide-up" style={{ animationDelay: '200ms' }}>
                  {isMainDomain() ? (
                    <>
                      <Button
                        variant="outline"
                        className="w-full rounded-xl h-12"
                        onClick={() => {
                          setShowLogin(true);
                          setShowMobileMenu(false);
                        }}
                      >
                        {language === 'ar' ? 'تسجيل الدخول' : 'Login'}
                      </Button>
                      <Button
                        className="w-full rounded-xl h-12 gradient-primary text-white hover:shadow-glow"
                        onClick={() => {
                          setShowSignup(true);
                          setShowMobileMenu(false);
                        }}
                      >
                        {language === 'ar' ? 'إنشاء حساب' : 'Sign Up'}
                      </Button>
                    </>
                  ) : (
                    <>
                      <Link to="/auth/login" onClick={() => setShowMobileMenu(false)}>
                        <Button
                          variant="outline"
                          className="w-full rounded-xl h-12"
                        >
                          {language === 'ar' ? 'تسجيل الدخول' : 'Login'}
                        </Button>
                      </Link>
                      <Link to="/auth/signup" onClick={() => setShowMobileMenu(false)}>
                        <Button
                          className="w-full rounded-xl h-12 gradient-primary text-white hover:shadow-glow"
                        >
                          {language === 'ar' ? 'إنشاء حساب' : 'Sign Up'}
                        </Button>
                      </Link>
                    </>
                  )}
                </div>
              )}
            </nav>
          </div>
        )}
      </header>

      {/* Login Modal */}
      {showLogin && (
        <CustomerLogin
          onClose={() => setShowLogin(false)}
          onSwitchToSignup={() => {
            setShowLogin(false);
            setShowSignup(true);
          }}
          onLoginSuccess={() => {
            setShowLogin(false);
            window.location.reload();
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
