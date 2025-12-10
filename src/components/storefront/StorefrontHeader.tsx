import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, Search, Menu, X, Sun, Moon, Globe, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CustomerLogin } from './CustomerLogin';
import { CustomerSignup } from './CustomerSignup';
import { coreApi } from '@/lib/api';

import { useCart } from '@/contexts/CartContext';

interface StorefrontHeaderProps {
  cartItemCount?: number;
  onSearch?: (query: string) => void;
}

export function StorefrontHeader({ cartItemCount: propCount = 0, onSearch }: StorefrontHeaderProps) {
  const { cart } = useCart();
  const cartItemCount = cart?.items?.reduce((total, item) => total + (item.quantity || 1), 0) || propCount;
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [language, setLanguage] = useState<'ar' | 'en'>('ar');
  const [customerData, setCustomerData] = useState<any>(null);
  const [siteConfig, setSiteConfig] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [showCategories, setShowCategories] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Check for showLogin in location state
  useEffect(() => {
    if (location.state && (location.state as any).showLogin) {
      setShowLogin(true);
      // Clear the state so it doesn't reopen on refresh
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  // Load customer data from localStorage
  useEffect(() => {
    const token = localStorage.getItem('customerToken');
    const data = localStorage.getItem('customerData');
    if (token && data) {
      setCustomerData(JSON.parse(data));
    }
  }, []);

  // Load site configuration
  useEffect(() => {
    const loadSiteConfig = async () => {
      try {
        const hasAdminToken = !!localStorage.getItem('accessToken');
        const searchParams = new URLSearchParams(window.location.search);
        const themePreviewId = searchParams.get('theme_preview');
        
        let url = '/site-config';
        if (themePreviewId) {
          url += `?themeId=${themePreviewId}`;
        }
        
        const config = await coreApi.get(url, { requireAuth: hasAdminToken });
        setSiteConfig(config);
        if (config.settings?.language) {
          setLanguage(config.settings.language);
        }
        
        // Apply theme colors
        if (config.settings?.colors) {
          console.log('🎨 Applying theme colors:', config.settings.colors);
          Object.entries(config.settings.colors).forEach(([key, value]) => {
            document.documentElement.style.setProperty(key, value as string);
          });
        } else {
          console.log('⚠️ No theme colors found in config settings');
        }
      } catch (error) {
        console.error('Failed to load site config:', error);
      }
    };
    loadSiteConfig();
  }, []);

  // Load categories
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await coreApi.get('/categories');
        setCategories(Array.isArray(data) ? data : (data.categories || []));
      } catch (error) {
        console.error('Failed to load categories:', error);
      }
    };
    loadCategories();
  }, []);

  // Toggle dark mode
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchQuery);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('customerToken');
    localStorage.removeItem('customerData');
    setCustomerData(null);
    window.location.reload();
  };

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'ar' ? 'en' : 'ar');
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

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-white dark:bg-gray-900 shadow-sm">
        {/* Top Bar */}
        <div className="bg-gradient-to-r from-primary/10 to-purple-500/10 dark:from-primary/20 dark:to-purple-500/20">
          <div className="container mx-auto px-4 py-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-4">
                <span className="text-gray-600 dark:text-gray-300">
                  {language === 'ar' ? '📞 اتصل بنا:' : '📞 Call us:'} {siteConfig?.settings?.phone || '+966 50 123 4567'}
                </span>
                <span className="hidden md:inline text-gray-600 dark:text-gray-300">
                  {language === 'ar' ? '✉️ البريد:' : '✉️ Email:'} {siteConfig?.settings?.email || 'info@store.com'}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={toggleLanguage}
                  className="flex items-center gap-1 text-gray-600 dark:text-gray-300 hover:text-primary transition-colors"
                >
                  <Globe className="h-4 w-4" />
                  <span className="text-xs font-medium">{language === 'ar' ? 'EN' : 'عربي'}</span>
                </button>
                <button
                  onClick={() => setIsDarkMode(!isDarkMode)}
                  className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  aria-label={isDarkMode ? 'Light mode' : 'Dark mode'}
                >
                  {isDarkMode ? (
                    <Sun className="h-4 w-4 text-yellow-500" />
                  ) : (
                    <Moon className="h-4 w-4 text-gray-600" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Header */}
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group">
              {siteConfig?.settings?.storeLogoUrl ? (
                <img 
                  src={siteConfig.settings.storeLogoUrl} 
                  alt={storeName}
                  className="h-10 w-10 object-contain rounded-lg group-hover:scale-110 transition-transform"
                />
              ) : (
                <div className="h-10 w-10 bg-gradient-to-br from-primary to-purple-600 rounded-lg flex items-center justify-center text-white font-bold group-hover:scale-110 transition-transform">
                  {storeName.charAt(0)}
                </div>
              )}
              <span className="text-xl font-bold text-gray-900 dark:text-white hidden sm:block">
                {storeName}
              </span>
            </Link>

            {/* Categories Dropdown Button */}
            <div className="relative group">
              <button
                onClick={() => setShowCategories(!showCategories)}
                onMouseEnter={() => setShowCategories(true)}
                className="flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 dark:bg-primary/20 dark:hover:bg-primary/30 rounded-lg transition-colors"
              >
                <ChevronDown className={`h-4 w-4 transition-transform ${showCategories ? 'rotate-180' : ''}`} />
                <span className="font-medium text-gray-900 dark:text-white">
                  {language === 'ar' ? 'التصنيفات' : 'Categories'}
                </span>
              </button>
              
              {/* Categories Dropdown Menu */}
              {showCategories && (
                <div 
                  className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-xl border dark:border-gray-700 z-50 max-h-96 overflow-y-auto"
                  onMouseLeave={() => setShowCategories(false)}
                >
                  <div className="py-2">
                    {categories.length > 0 ? (
                      categories.map((category: any) => (
                        <Link
                          key={category.id}
                          to={`/categories/${category.id}`}
                          className="block px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-primary/10 dark:hover:bg-primary/20 hover:text-primary dark:hover:text-primary transition-colors"
                          onClick={() => setShowCategories(false)}
                        >
                          <div className="flex items-center gap-3">
                            {category.image && (
                              <img 
                                src={category.image} 
                                alt={category.name}
                                className="w-8 h-8 rounded object-cover"
                              />
                            )}
                            <div>
                              <div className="font-medium">{category.name}</div>
                              {category.description && (
                                <div className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
                                  {category.description}
                                </div>
                              )}
                            </div>
                          </div>
                        </Link>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 text-center">
                        {language === 'ar' ? 'لا توجد تصنيفات' : 'No categories available'}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-6">
              {headerLinks.map((link: any, index: number) => {
                const label = language === 'ar' ? (link.labelAr || link.label) : link.label;
                
                if (link.type === 'dropdown') {
                  return (
                    <div key={index} className="relative group z-50">
                      <button className="flex items-center gap-1 text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary font-medium transition-colors py-2">
                        {label}
                        <ChevronDown className="h-4 w-4" />
                      </button>
                      <div className="absolute top-full left-0 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all transform translate-y-2 group-hover:translate-y-0">
                        <div className="py-1">
                          {link.children?.map((child: any, childIndex: number) => {
                            const childLabel = language === 'ar' ? (child.labelAr || child.label) : child.label;
                            return (
                              <Link
                                key={childIndex}
                                to={child.url}
                                className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-primary dark:hover:text-primary"
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
                    to={link.url}
                    className="text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary font-medium transition-colors relative group"
                  >
                    {label}
                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300"></span>
                  </Link>
                );
              })}
              {/* Custom Buttons */}
              {headerButtons.map((button: any, index: number) => {
                const buttonClasses = button.variant === 'primary' 
                  ? 'bg-primary text-white hover:bg-primary/90'
                  : button.variant === 'secondary'
                  ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600'
                  : 'border-2 border-primary text-primary hover:bg-primary hover:text-white';
                
                return button.url.startsWith('http') ? (
                  <a
                    key={`btn-${index}`}
                    href={button.url}
                    target={button.openInNewTab ? '_blank' : '_self'}
                    rel={button.openInNewTab ? 'noopener noreferrer' : undefined}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${buttonClasses}`}
                  >
                    {button.label}
                  </a>
                ) : (
                  <Link
                    key={`btn-${index}`}
                    to={button.url}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${buttonClasses}`}
                  >
                    {button.label}
                  </Link>
                );
              })}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {/* Search Button */}
              <button
                onClick={() => setShowSearch(!showSearch)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                aria-label="Search"
              >
                <Search className="h-5 w-5 text-gray-600 dark:text-gray-300" />
              </button>

              {/* Cart */}
              <Link
                to="/cart"
                className="relative p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
              >
                <ShoppingCart className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                {cartItemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {cartItemCount}
                  </span>
                )}
              </Link>

              {/* User Menu */}
              {customerData ? (
                <div className="relative group">
                  <button className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                    <User className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                    <span className="hidden md:inline text-sm font-medium text-gray-700 dark:text-gray-300">
                      {customerData.firstName}
                    </span>
                  </button>
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                    <Link
                      to="/account/orders"
                      className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-t-lg"
                    >
                      {language === 'ar' ? 'طلباتي' : 'My Orders'}
                    </Link>
                    <Link
                      to="/account/profile"
                      className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      {language === 'ar' ? 'الملف الشخصي' : 'Profile'}
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-b-lg"
                    >
                      {language === 'ar' ? 'تسجيل الخروج' : 'Logout'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="hidden md:flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowLogin(true)}
                  >
                    {language === 'ar' ? 'تسجيل الدخول' : 'Login'}
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setShowSignup(true)}
                  >
                    {language === 'ar' ? 'إنشاء حساب' : 'Sign Up'}
                  </Button>
                </div>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
              >
                {showMobileMenu ? (
                  <X className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                ) : (
                  <Menu className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                )}
              </button>
            </div>
          </div>

          {/* Search Bar */}
          {showSearch && (
            <form onSubmit={handleSearch} className="mt-4 animate-in slide-in-from-top">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type="search"
                  placeholder={language === 'ar' ? 'ابحث عن المنتجات...' : 'Search products...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 h-12 text-lg"
                  autoFocus
                />
              </div>
            </form>
          )}
        </div>

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className="lg:hidden border-t dark:border-gray-700 bg-white dark:bg-gray-900 animate-in slide-in-from-top">
            <nav className="container mx-auto px-4 py-4 flex flex-col gap-2">
              {headerLinks.map((link: any, index: number) => {
                const label = language === 'ar' ? (link.labelAr || link.label) : link.label;

                if (link.type === 'dropdown') {
                  return (
                    <div key={index} className="space-y-1">
                      <div className="px-4 py-2 font-medium text-gray-900 dark:text-white flex items-center gap-2">
                        {label}
                        <ChevronDown className="h-4 w-4 opacity-50" />
                      </div>
                      <div className="pl-4 border-l-2 border-gray-100 dark:border-gray-800 ml-4 space-y-1">
                        {link.children?.map((child: any, childIndex: number) => {
                          const childLabel = language === 'ar' ? (child.labelAr || child.label) : child.label;
                          return (
                            <Link
                              key={childIndex}
                              to={child.url}
                              className="block px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary"
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
                    to={link.url}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    {label}
                  </Link>
                );
              })}
              {/* Custom Buttons in Mobile Menu */}
              {headerButtons.map((button: any, index: number) => {
                const buttonClasses = button.variant === 'primary' 
                  ? 'bg-primary text-white hover:bg-primary/90'
                  : button.variant === 'secondary'
                  ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600'
                  : 'border-2 border-primary text-primary hover:bg-primary hover:text-white';
                
                return button.url.startsWith('http') ? (
                  <a
                    key={`mobile-btn-${index}`}
                    href={button.url}
                    target={button.openInNewTab ? '_blank' : '_self'}
                    rel={button.openInNewTab ? 'noopener noreferrer' : undefined}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors text-center ${buttonClasses}`}
                    onClick={() => setShowMobileMenu(false)}
                  >
                    {button.label}
                  </a>
                ) : (
                  <Link
                    key={`mobile-btn-${index}`}
                    to={button.url}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors text-center ${buttonClasses}`}
                    onClick={() => setShowMobileMenu(false)}
                  >
                    {button.label}
                  </Link>
                );
              })}
              {!customerData && (
                <>
                  <button
                    onClick={() => {
                      setShowLogin(true);
                      setShowMobileMenu(false);
                    }}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-left"
                  >
                    {language === 'ar' ? 'تسجيل الدخول' : 'Login'}
                  </button>
                  <button
                    onClick={() => {
                      setShowSignup(true);
                      setShowMobileMenu(false);
                    }}
                    className="px-4 py-2 bg-primary text-white hover:bg-primary/90 rounded-lg transition-colors text-left"
                  >
                    {language === 'ar' ? 'إنشاء حساب' : 'Sign Up'}
                  </button>
                </>
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
