import { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Menu, 
  X, 
  Search, 
  User, 
  ShoppingCart, 
  Heart,
  Wallet,
  LogOut,
  ChevronDown,
  Moon,
  Sun,
  Globe,
  CreditCard,
  Home,
  Package
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { coreApi } from '@/lib/api';

interface Brand {
  id: string;
  name: string;
  nameAr?: string;
}

export default function CardsLayout() {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  
  const [brands, setBrands] = useState<Brand[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    loadData();
    
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadWallet();
    }
  }, [isAuthenticated]);

  const loadData = async () => {
    try {
      const brandsRes = await coreApi.getBrands().catch(() => []);
      setBrands(Array.isArray(brandsRes) ? brandsRes.slice(0, 6) : []);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const loadWallet = async () => {
    try {
      const walletRes = await coreApi.get('/wallet', { requireAuth: true }).catch(() => ({ balance: 0 }));
      setWalletBalance(walletRes.balance || 0);
    } catch (error) {
      console.error('Error loading wallet:', error);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/cards?search=${encodeURIComponent(searchQuery)}`);
      setMobileMenuOpen(false);
    }
  };

  const toggleLanguage = () => {
    const newLang = i18n.language === 'ar' ? 'en' : 'ar';
    i18n.changeLanguage(newLang);
    localStorage.setItem('language', newLang);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        isScrolled ? "bg-slate-900/95 backdrop-blur-xl shadow-lg" : "bg-transparent"
      )}>
        <div className="container">
          {/* Top Bar */}
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
                <CreditCard className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold text-white hidden sm:block">
                {isRTL ? 'بطاقاتي' : 'MyCards'}
              </span>
            </Link>

            {/* Desktop Search */}
            <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-xl mx-8">
              <div className="relative w-full">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  type="text"
                  placeholder={isRTL ? 'ابحث عن البطاقات...' : 'Search for cards...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pr-10 bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:border-purple-400 rounded-xl"
                />
              </div>
            </form>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-2">
              {/* Language */}
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleLanguage}
                className="text-slate-300 hover:text-white hover:bg-white/10"
              >
                <Globe className="h-5 w-5" />
              </Button>

              {isAuthenticated ? (
                <>
                  {/* Wallet */}
                  <Link to="/account/wallet">
                    <Button variant="ghost" className="text-slate-300 hover:text-white hover:bg-white/10 gap-2">
                      <Wallet className="h-5 w-5" />
                      <span className="font-semibold text-purple-400">
                        {walletBalance.toFixed(2)}
                      </span>
                    </Button>
                  </Link>

                  {/* Favorites */}
                  <Link to="/account/favorites">
                    <Button variant="ghost" size="icon" className="text-slate-300 hover:text-white hover:bg-white/10">
                      <Heart className="h-5 w-5" />
                    </Button>
                  </Link>

                  {/* User Menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="text-slate-300 hover:text-white hover:bg-white/10 gap-2">
                        <div className="w-8 h-8 rounded-full bg-purple-500/30 flex items-center justify-center">
                          <User className="h-4 w-4" />
                        </div>
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-slate-800 border-white/10 w-56">
                      <div className="px-3 py-2">
                        <p className="text-sm font-medium text-white">{user?.email}</p>
                      </div>
                      <DropdownMenuSeparator className="bg-white/10" />
                      <DropdownMenuItem asChild>
                        <Link to="/account/cards" className="flex items-center gap-2 cursor-pointer">
                          <Package className="h-4 w-4" />
                          {isRTL ? 'بطاقاتي' : 'My Cards'}
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/account/wallet" className="flex items-center gap-2 cursor-pointer">
                          <Wallet className="h-4 w-4" />
                          {isRTL ? 'المحفظة' : 'Wallet'}
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/account/favorites" className="flex items-center gap-2 cursor-pointer">
                          <Heart className="h-4 w-4" />
                          {isRTL ? 'المفضلة' : 'Favorites'}
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-white/10" />
                      <DropdownMenuItem onClick={handleLogout} className="flex items-center gap-2 text-red-400 cursor-pointer">
                        <LogOut className="h-4 w-4" />
                        {isRTL ? 'تسجيل الخروج' : 'Logout'}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <Link to="/auth/login">
                    <Button variant="ghost" className="text-white hover:bg-white/10">
                      {isRTL ? 'تسجيل الدخول' : 'Login'}
                    </Button>
                  </Link>
                  <Link to="/auth/signup">
                    <Button className="bg-purple-600 hover:bg-purple-700">
                      {isRTL ? 'إنشاء حساب' : 'Sign Up'}
                    </Button>
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden text-white">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side={isRTL ? "right" : "left"} className="bg-slate-900 border-white/10 w-80">
                <SheetHeader>
                  <SheetTitle className="text-white flex items-center gap-2">
                    <CreditCard className="h-6 w-6 text-purple-400" />
                    {isRTL ? 'بطاقاتي' : 'MyCards'}
                  </SheetTitle>
                </SheetHeader>
                
                <div className="mt-6 space-y-6">
                  {/* Mobile Search */}
                  <form onSubmit={handleSearch}>
                    <div className="relative">
                      <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        type="text"
                        placeholder={isRTL ? 'ابحث...' : 'Search...'}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pr-10 bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                      />
                    </div>
                  </form>

                  {/* Mobile Nav */}
                  <nav className="space-y-2">
                    <Link 
                      to="/" 
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 text-slate-300"
                    >
                      <Home className="h-5 w-5" />
                      {isRTL ? 'الرئيسية' : 'Home'}
                    </Link>
                    <Link 
                      to="/cards" 
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 text-slate-300"
                    >
                      <CreditCard className="h-5 w-5" />
                      {isRTL ? 'جميع البطاقات' : 'All Cards'}
                    </Link>
                    
                    {isAuthenticated && (
                      <>
                        <Link 
                          to="/account/cards" 
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 text-slate-300"
                        >
                          <Package className="h-5 w-5" />
                          {isRTL ? 'بطاقاتي' : 'My Cards'}
                        </Link>
                        <Link 
                          to="/account/wallet" 
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 text-slate-300"
                        >
                          <Wallet className="h-5 w-5" />
                          {isRTL ? 'المحفظة' : 'Wallet'}
                          <Badge className="ml-auto bg-purple-500/30 text-purple-300">
                            {walletBalance.toFixed(2)}
                          </Badge>
                        </Link>
                        <Link 
                          to="/account/favorites" 
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 text-slate-300"
                        >
                          <Heart className="h-5 w-5" />
                          {isRTL ? 'المفضلة' : 'Favorites'}
                        </Link>
                      </>
                    )}
                  </nav>

                  {/* Mobile Auth */}
                  <div className="pt-4 border-t border-white/10">
                    {isAuthenticated ? (
                      <Button 
                        variant="ghost" 
                        className="w-full justify-start text-red-400 hover:bg-red-500/10"
                        onClick={handleLogout}
                      >
                        <LogOut className="h-5 w-5 mr-3" />
                        {isRTL ? 'تسجيل الخروج' : 'Logout'}
                      </Button>
                    ) : (
                      <div className="space-y-2">
                        <Link to="/auth/login" onClick={() => setMobileMenuOpen(false)}>
                          <Button variant="outline" className="w-full border-white/20 text-white">
                            {isRTL ? 'تسجيل الدخول' : 'Login'}
                          </Button>
                        </Link>
                        <Link to="/auth/signup" onClick={() => setMobileMenuOpen(false)}>
                          <Button className="w-full bg-purple-600 hover:bg-purple-700">
                            {isRTL ? 'إنشاء حساب' : 'Sign Up'}
                          </Button>
                        </Link>
                      </div>
                    )}
                  </div>

                  {/* Language Toggle */}
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start text-slate-300 hover:bg-white/5"
                    onClick={toggleLanguage}
                  >
                    <Globe className="h-5 w-5 mr-3" />
                    {i18n.language === 'ar' ? 'English' : 'العربية'}
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Brands Bar */}
          {brands.length > 0 && (
            <div className="hidden md:flex items-center gap-4 py-2 border-t border-white/10">
              {brands.map((brand) => (
                <Link
                  key={brand.id}
                  to={`/cards?brand=${brand.id}`}
                  className="text-sm text-slate-400 hover:text-purple-400 transition-colors"
                >
                  {isRTL ? String(brand.nameAr || brand.name || '') : String(brand.name || '')}
                </Link>
              ))}
              <Link
                to="/cards"
                className="text-sm text-purple-400 hover:text-purple-300 transition-colors ml-auto"
              >
                {isRTL ? 'عرض الكل →' : 'View All →'}
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-16 md:pt-24">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-black/50 border-t border-white/10 py-12 mt-16">
        <div className="container">
          <div className="grid md:grid-cols-4 gap-8">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
                  <CreditCard className="h-6 w-6 text-white" />
                </div>
                <span className="text-xl font-bold text-white">
                  {isRTL ? 'بطاقاتي' : 'MyCards'}
                </span>
              </div>
              <p className="text-slate-400 text-sm">
                {isRTL 
                  ? 'أسرع وأسهل طريقة للحصول على البطاقات الرقمية'
                  : 'The fastest and easiest way to get digital cards'
                }
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-white font-semibold mb-4">{isRTL ? 'روابط سريعة' : 'Quick Links'}</h4>
              <div className="space-y-2">
                <Link to="/cards" className="block text-slate-400 hover:text-purple-400 text-sm">
                  {isRTL ? 'جميع البطاقات' : 'All Cards'}
                </Link>
                <Link to="/about" className="block text-slate-400 hover:text-purple-400 text-sm">
                  {isRTL ? 'من نحن' : 'About Us'}
                </Link>
                <Link to="/contact" className="block text-slate-400 hover:text-purple-400 text-sm">
                  {isRTL ? 'اتصل بنا' : 'Contact Us'}
                </Link>
              </div>
            </div>

            {/* Support */}
            <div>
              <h4 className="text-white font-semibold mb-4">{isRTL ? 'الدعم' : 'Support'}</h4>
              <div className="space-y-2">
                <Link to="/faq" className="block text-slate-400 hover:text-purple-400 text-sm">
                  {isRTL ? 'الأسئلة الشائعة' : 'FAQ'}
                </Link>
                <Link to="/terms" className="block text-slate-400 hover:text-purple-400 text-sm">
                  {isRTL ? 'الشروط والأحكام' : 'Terms & Conditions'}
                </Link>
                <Link to="/privacy" className="block text-slate-400 hover:text-purple-400 text-sm">
                  {isRTL ? 'سياسة الخصوصية' : 'Privacy Policy'}
                </Link>
              </div>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-white font-semibold mb-4">{isRTL ? 'تواصل معنا' : 'Contact'}</h4>
              <div className="space-y-2 text-slate-400 text-sm">
                <p>support@example.com</p>
                <p>+966 50 000 0000</p>
              </div>
            </div>
          </div>

          <div className="border-t border-white/10 mt-8 pt-8 text-center text-slate-500 text-sm">
            <p>
              © {new Date().getFullYear()} {isRTL ? 'جميع الحقوق محفوظة' : 'All rights reserved'}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

