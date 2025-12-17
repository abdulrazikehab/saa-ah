import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Store, TrendingUp, Users, Sparkles, Shield, Zap, 
  Globe, CreditCard, BarChart3, Package, ArrowRight,
  Check, Star, Smartphone, ChevronRight, Moon, Sun, Crown, Building2, Loader2, Menu, X
} from 'lucide-react';
import publicService, { Partner, Plan, PlatformStats, Testimonial } from '@/services/public.service';
import { getLogoUrl } from '@/config/logo.config';
import { VersionFooter } from '@/components/common/VersionFooter';

export default function LandingPage() {
  const [isDark, setIsDark] = useState(true);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Apply theme to document
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [partnersData, plansData, statsData, testimonialsData] = await Promise.all([
          publicService.getPartners(),
          publicService.getPlans(),
          publicService.getStats(),
          publicService.getTestimonials(3),
        ]);
        
        setPartners(partnersData);
        setPlans(plansData);
        setStats(statsData);
        setTestimonials(testimonialsData);
      } catch (error) {
        console.error('Failed to fetch landing page data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Icon mapping for plans
  const getPlanIcon = (code: string) => {
    switch (code?.toUpperCase()) {
      case 'STARTER':
        return <Zap className="w-5 h-5" />;
      case 'PROFESSIONAL':
        return <Crown className="w-5 h-5" />;
      case 'ENTERPRISE':
        return <Building2 className="w-5 h-5" />;
      default:
        return <CreditCard className="w-5 h-5" />;
    }
  };

  // Default stats if API fails
  const displayStats = stats || {
    stores: '10,000+',
    orders: '50M+',
    uptime: '99.9%',
    support: '24/7',
  };

  // Default partners if none from API
  const displayPartners = partners.length > 0 ? partners : [
    {
      id: 'asus-default',
      name: 'ASUS',
      nameAr: 'أسس',
      logo: '/partners/asus-logo.png',
      description: 'Products supplier partner',
      descriptionAr: 'شريك توريد المنتجات',
    },
    {
      id: 'smartline-default',
      name: 'Smart Line',
      nameAr: 'سمارت لاين',
      logo: '/partners/smartline-logo.png',
      description: 'Marketing and social media partner',
      descriptionAr: 'شريك التسويق والسوشيال ميديا',
    },
  ];

  // Default testimonials if none from API
  const displayTestimonials = testimonials.length > 0 ? testimonials : [
    {
      id: '1',
      name: 'أحمد محمد',
      nameEn: 'Ahmed Mohammed',
      role: 'مالك متجر الإلكترونيات',
      roleEn: 'Electronics Store Owner',
      content: 'منصة رائعة! زادت مبيعاتي 300% في 6 أشهر.',
      contentEn: 'Amazing platform! My sales increased 300% in 6 months.',
      rating: 5,
    },
    {
      id: '2',
      name: 'فاطمة علي',
      nameEn: 'Fatima Ali',
      role: 'مالكة متجر الأزياء',
      roleEn: 'Fashion Store Owner',
      content: 'سهولة الاستخدام والدعم الممتاز جعلا تجربتي استثنائية.',
      contentEn: 'Ease of use and excellent support made my experience exceptional.',
      rating: 5,
    },
    {
      id: '3',
      name: 'خالد سعيد',
      nameEn: 'Khaled Saeed',
      role: 'مالك متجر رقمي',
      roleEn: 'Digital Store Owner',
      content: 'أفضل منصة جربتها. التقارير مفيدة جداً.',
      contentEn: 'Best platform I have tried. The reports are very useful.',
      rating: 5,
    },
  ];


  return (
    <div className={`min-h-screen ${isDark ? 'bg-slate-900' : 'bg-white'} transition-colors duration-300`}>
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 ${isDark ? 'bg-slate-900/80' : 'bg-white/80'} backdrop-blur-2xl border-b ${isDark ? 'border-slate-800/50' : 'border-gray-200/50'} shadow-lg ${isDark ? 'shadow-slate-900/20' : 'shadow-gray-900/5'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-18 sm:h-20 md:h-22">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 sm:gap-4 group">
              <div className={`relative p-2 sm:p-2.5 rounded-xl ${isDark ? 'bg-slate-800/50 border border-slate-700/50' : 'bg-gray-100/50 border border-gray-200/50'} backdrop-blur-sm group-hover:scale-105 transition-all duration-300 shadow-md`}>
                <img 
                  src={getLogoUrl()} 
                  alt="Saeaa - سِعَة" 
                  className="h-7 sm:h-9 md:h-10 w-auto"
                />
                <div className={`absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500/0 to-blue-500/0 group-hover:from-purple-500/20 group-hover:to-blue-500/20 transition-all duration-300`}></div>
              </div>
              <div className="hidden sm:flex flex-col">
                <span className={`text-lg sm:text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} leading-tight`}>Saeaa</span>
                <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'} font-medium`}>سِعَة</span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-1 lg:gap-2">
              <a 
                href="#features" 
                className={`relative px-4 py-2 rounded-lg ${isDark ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-all duration-300 font-medium text-sm lg:text-base group`}
              >
                <span className="relative z-10">المميزات</span>
                <span className={`absolute inset-0 rounded-lg ${isDark ? 'bg-slate-800/50' : 'bg-gray-100/50'} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></span>
              </a>
              <a 
                href="#pricing" 
                className={`relative px-4 py-2 rounded-lg ${isDark ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-all duration-300 font-medium text-sm lg:text-base group`}
              >
                <span className="relative z-10">الأسعار</span>
                <span className={`absolute inset-0 rounded-lg ${isDark ? 'bg-slate-800/50' : 'bg-gray-100/50'} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></span>
              </a>
              <a 
                href="#testimonials" 
                className={`relative px-4 py-2 rounded-lg ${isDark ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-all duration-300 font-medium text-sm lg:text-base group`}
              >
                <span className="relative z-10">آراء العملاء</span>
                <span className={`absolute inset-0 rounded-lg ${isDark ? 'bg-slate-800/50' : 'bg-gray-100/50'} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></span>
              </a>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              {/* Dark Mode Toggle */}
              <button
                onClick={() => setIsDark(!isDark)}
                className={`relative p-2.5 sm:p-3 rounded-xl ${isDark ? 'bg-slate-800/80 hover:bg-slate-700/80' : 'bg-gray-100/80 hover:bg-gray-200/80'} backdrop-blur-sm transition-all duration-300 hover:scale-110 shadow-md group`}
                aria-label="Toggle dark mode"
              >
                {isDark ? (
                  <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400 group-hover:rotate-180 transition-transform duration-500" />
                ) : (
                  <Moon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700 group-hover:rotate-12 transition-transform duration-300" />
                )}
              </button>
              
              {/* Desktop Auth Links */}
              <Link
                to="/login"
                className={`hidden sm:inline-block px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl ${isDark ? 'text-gray-300 hover:text-white hover:bg-slate-800/50' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/50'} transition-all duration-300 font-semibold text-sm sm:text-base backdrop-blur-sm`}
              >
                تسجيل الدخول
              </Link>
              <Link
                to="/register"
                className="hidden sm:inline-flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 text-white px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl font-bold hover:from-purple-700 hover:via-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg shadow-purple-900/30 hover:shadow-purple-900/50 hover:scale-105 text-sm sm:text-base relative overflow-hidden group"
              >
                <span className="relative z-10">ابدأ مجاناً</span>
                <ArrowRight className="w-4 h-4 relative z-10 group-hover:translate-x-1 transition-transform" />
                <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-blue-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </Link>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className={`md:hidden p-2.5 rounded-xl ${isDark ? 'bg-slate-800/80 hover:bg-slate-700/80' : 'bg-gray-100/80 hover:bg-gray-200/80'} backdrop-blur-sm transition-all duration-300 hover:scale-110 shadow-md`}
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? (
                  <X className="w-5 h-5 text-gray-400" />
                ) : (
                  <Menu className="w-5 h-5 text-gray-400" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className={`md:hidden border-t ${isDark ? 'border-slate-800/50' : 'border-gray-200/50'} py-4 space-y-2 animate-slide-down`}>
              <a 
                href="#features" 
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-4 py-3 rounded-xl ${isDark ? 'text-gray-300 hover:bg-slate-800/80 hover:text-white' : 'text-gray-600 hover:bg-gray-100/80 hover:text-gray-900'} transition-all duration-300 font-medium backdrop-blur-sm`}
              >
                المميزات
              </a>
              <a 
                href="#pricing" 
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-4 py-3 rounded-xl ${isDark ? 'text-gray-300 hover:bg-slate-800/80 hover:text-white' : 'text-gray-600 hover:bg-gray-100/80 hover:text-gray-900'} transition-all duration-300 font-medium backdrop-blur-sm`}
              >
                الأسعار
              </a>
              <a 
                href="#testimonials" 
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-4 py-3 rounded-xl ${isDark ? 'text-gray-300 hover:bg-slate-800/80 hover:text-white' : 'text-gray-600 hover:bg-gray-100/80 hover:text-gray-900'} transition-all duration-300 font-medium backdrop-blur-sm`}
              >
                آراء العملاء
              </a>
              <div className={`pt-3 border-t ${isDark ? 'border-slate-800/50' : 'border-gray-200/50'} space-y-2`}>
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-4 py-3 rounded-xl ${isDark ? 'text-gray-300 hover:bg-slate-800/80 hover:text-white' : 'text-gray-600 hover:bg-gray-100/80 hover:text-gray-900'} transition-all duration-300 font-semibold backdrop-blur-sm text-center`}
                >
                  تسجيل الدخول
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="group block px-4 py-3 rounded-xl bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 text-white font-bold hover:from-purple-700 hover:via-blue-700 hover:to-purple-700 transition-all duration-300 text-center shadow-lg shadow-purple-900/30 relative overflow-hidden"
                >
                  <span className="relative z-10">ابدأ مجاناً</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-blue-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className={`pt-24 sm:pt-28 md:pt-32 pb-16 sm:pb-20 md:pb-24 px-4 sm:px-6 lg:px-8 ${isDark ? 'bg-gradient-to-b from-slate-900 via-slate-800/95 to-slate-900' : 'bg-gradient-to-b from-gray-50 via-white to-gray-50'} relative overflow-hidden`}>
        {/* Background Gradients */}
        <div className={`absolute top-20 left-10 w-48 h-48 sm:w-72 sm:h-72 ${isDark ? 'bg-purple-900/30' : 'bg-purple-200/50'} rounded-full mix-blend-screen filter blur-3xl opacity-30 animate-blob`}></div>
        <div className={`absolute top-40 right-10 w-48 h-48 sm:w-72 sm:h-72 ${isDark ? 'bg-blue-900/30' : 'bg-blue-200/50'} rounded-full mix-blend-screen filter blur-3xl opacity-30 animate-blob animation-delay-2000`}></div>
        <div className={`absolute bottom-20 left-1/2 -translate-x-1/2 w-64 h-64 sm:w-96 sm:h-96 ${isDark ? 'bg-pink-900/20' : 'bg-pink-200/40'} rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-blob animation-delay-4000`}></div>
        
        {/* Grid Pattern Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] opacity-40"></div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 items-center">
            {/* Left - Content */}
            <div className="text-center lg:text-right relative z-10">
              <div className={`inline-flex items-center gap-2 ${isDark ? 'bg-slate-800/80 border-slate-700/50' : 'bg-purple-50/90 border-purple-200/50'} border rounded-full px-4 sm:px-5 py-2 sm:py-2.5 mb-6 sm:mb-8 backdrop-blur-md shadow-lg ${isDark ? 'shadow-purple-900/20' : 'shadow-purple-200/50'}`}>
                <Sparkles className={`w-4 h-4 sm:w-5 sm:h-5 ${isDark ? 'text-purple-400' : 'text-purple-600'} animate-pulse`} />
                <span className={`${isDark ? 'text-purple-300' : 'text-purple-700'} text-xs sm:text-sm font-bold`}>منصة التجارة الإلكترونية #1</span>
              </div>

              <h1 className={`text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold ${isDark ? 'text-white' : 'text-gray-900'} mb-6 sm:mb-8 leading-[1.1] tracking-tight`}>
                <span className="block mb-2">ابدأ متجرك الإلكتروني</span>
                <span className="block bg-gradient-to-r from-purple-400 via-blue-400 to-purple-500 bg-clip-text text-transparent animate-gradient">
                  في 5 دقائق فقط
                </span>
              </h1>

              <p className={`text-lg sm:text-xl md:text-2xl ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-8 sm:mb-10 leading-relaxed max-w-2xl mx-auto lg:mx-0 font-medium`}>
                منصة شاملة لإنشاء وإدارة متجرك الإلكتروني بكل احترافية.
                <span className={`block mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'} text-base sm:text-lg`}>
                  بدون خبرة تقنية، بدون تعقيدات، فقط نجاح مضمون.
                </span>
              </p>

              <div className="flex flex-col sm:flex-row gap-4 sm:gap-5 mb-8 sm:mb-10 justify-center lg:justify-start">
                <Link
                  to="/register"
                  className="group inline-flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 text-white px-8 sm:px-10 py-4 sm:py-5 rounded-2xl font-bold hover:from-purple-700 hover:via-blue-700 hover:to-purple-700 transition-all shadow-2xl shadow-purple-900/30 hover:shadow-purple-900/50 hover:scale-105 text-base sm:text-lg relative overflow-hidden"
                >
                  <span className="relative z-10">ابدأ الآن مجاناً</span>
                  <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 group-hover:translate-x-1 transition-transform relative z-10" />
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-blue-400 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </Link>
              </div>

              <div className={`flex flex-wrap items-center justify-center lg:justify-start gap-5 sm:gap-7 text-sm sm:text-base ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                <div className="flex items-center gap-2.5 group">
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-green-500/20 flex items-center justify-center group-hover:bg-green-500/30 transition-colors">
                    <Check className="w-4 h-4 sm:w-5 sm:h-5 text-green-400 flex-shrink-0" />
                  </div>
                  <span className="font-semibold">مجاني تماماً</span>
                </div>
                <div className="flex items-center gap-2.5 group">
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-green-500/20 flex items-center justify-center group-hover:bg-green-500/30 transition-colors">
                    <Check className="w-4 h-4 sm:w-5 sm:h-5 text-green-400 flex-shrink-0" />
                  </div>
                  <span className="font-semibold">بدون بطاقة ائتمان</span>
                </div>
                <div className="flex items-center gap-2.5 group">
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-green-500/20 flex items-center justify-center group-hover:bg-green-500/30 transition-colors">
                    <Check className="w-4 h-4 sm:w-5 sm:h-5 text-green-400 flex-shrink-0" />
                  </div>
                  <span className="font-semibold">إعداد فوري</span>
                </div>
              </div>
            </div>

            {/* Right - Image/Illustration */}
            <div className="relative hidden lg:block">
              <div className={`relative ${isDark ? 'bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700' : 'bg-gradient-to-br from-white to-gray-50 border-gray-200'} rounded-3xl p-6 sm:p-8 shadow-2xl border`}>
                <div className={`${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'} rounded-2xl p-4 sm:p-6 shadow-xl border`}>
                  <div className="flex items-center gap-3 mb-4 sm:mb-6">
                    <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-red-500/80"></div>
                    <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-yellow-500/80"></div>
                    <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-green-500/80"></div>
                  </div>
                  <div className="space-y-3 sm:space-y-4">
                    <div className={`h-3 sm:h-4 ${isDark ? 'bg-slate-800' : 'bg-gray-100'} rounded w-3/4`}></div>
                    <div className={`h-3 sm:h-4 ${isDark ? 'bg-slate-800' : 'bg-gray-100'} rounded w-1/2`}></div>
                    <div className="grid grid-cols-3 gap-3 sm:gap-4 mt-4 sm:mt-6">
                      <div className="h-16 sm:h-24 bg-gradient-to-br from-purple-900/50 to-purple-800/50 rounded-lg border border-purple-500/20"></div>
                      <div className="h-16 sm:h-24 bg-gradient-to-br from-blue-900/50 to-blue-800/50 rounded-lg border border-blue-500/20"></div>
                      <div className="h-16 sm:h-24 bg-gradient-to-br from-pink-900/50 to-pink-800/50 rounded-lg border border-pink-500/20"></div>
                    </div>
                    <div className="h-10 sm:h-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg mt-4 sm:mt-6 opacity-80"></div>
                  </div>
                </div>
              </div>
              {/* Floating elements */}
              <div className={`absolute -top-4 -right-4 sm:-top-6 sm:-right-6 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} rounded-2xl p-3 sm:p-4 shadow-xl border animate-float hidden xl:block`}>
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-900/30 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-green-400" />
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm font-semibold text-white">+300%</div>
                    <div className="text-[10px] sm:text-xs text-gray-400">نمو المبيعات</div>
                  </div>
                </div>
              </div>
              <div className={`absolute -bottom-4 -left-4 sm:-bottom-6 sm:-left-6 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} rounded-2xl p-3 sm:p-4 shadow-xl border animate-float hidden xl:block`} style={{ animationDelay: '1s' }}>
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-900/30 rounded-xl flex items-center justify-center">
                    <Users className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm font-semibold text-white">{displayStats.stores}</div>
                    <div className="text-[10px] sm:text-xs text-gray-400">عميل سعيد</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className={`py-16 sm:py-20 relative ${isDark ? 'bg-slate-900/50' : 'bg-gray-50/50'} border-y ${isDark ? 'border-slate-800/50' : 'border-gray-200/50'}`}>
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-blue-500/5 to-purple-500/5"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
            {[
              { number: displayStats.stores, label: 'متجر نشط', icon: Store },
              { number: displayStats.orders || '50M+', label: 'طلب معالج', icon: Package },
              { number: displayStats.uptime, label: 'وقت تشغيل', icon: Zap },
              { number: displayStats.support, label: 'دعم فني', icon: Shield }
            ].map((stat, index) => (
              <div key={index} className={`group text-center p-6 sm:p-8 rounded-2xl ${isDark ? 'bg-slate-800/50 border border-slate-700/50 hover:bg-slate-800/70 hover:border-purple-500/30' : 'bg-white border border-gray-200/50 hover:bg-gray-50 hover:border-purple-300/50'} transition-all duration-300 hover:shadow-xl hover:-translate-y-1`}>
                <div className={`w-12 h-12 sm:w-14 sm:h-14 mx-auto mb-4 rounded-xl ${isDark ? 'bg-purple-500/10' : 'bg-purple-100'} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <stat.icon className={`w-6 h-6 sm:w-7 sm:h-7 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
                </div>
                <div className="text-3xl sm:text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-purple-400 via-blue-400 to-purple-500 bg-clip-text text-transparent mb-2">
                  {stat.number}
                </div>
                <div className={`text-sm sm:text-base font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trusted Partners - Dynamic */}
      <section className={`py-16 sm:py-20 md:py-24 relative ${isDark ? 'bg-gradient-to-b from-slate-900 via-slate-800/95 to-slate-900' : 'bg-gradient-to-b from-white via-gray-50/50 to-white'}`}>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-12 sm:mb-16">
            <div className={`inline-flex items-center gap-2 ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-purple-50 border-purple-200'} border rounded-full px-4 py-2 mb-4 backdrop-blur-sm`}>
              <Users className={`w-4 h-4 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
              <span className={`${isDark ? 'text-purple-300' : 'text-purple-700'} text-sm font-semibold`}>شركاؤنا</span>
            </div>
            <h2 className={`text-3xl sm:text-4xl md:text-5xl font-extrabold ${isDark ? 'text-white' : 'text-gray-900'} mb-4 sm:mb-6`}>
              شركاؤنا الموثوقون
            </h2>
            <p className={`text-lg sm:text-xl md:text-2xl ${isDark ? 'text-gray-400' : 'text-gray-600'} max-w-2xl mx-auto`}>
              نتعاون مع أفضل الشركات لتقديم خدمات متميزة
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
            </div>
          ) : (
            <div className={`grid ${displayPartners.length === 1 ? 'md:grid-cols-1 max-w-md' : displayPartners.length === 2 ? 'md:grid-cols-2' : 'md:grid-cols-3'} gap-4 sm:gap-6 md:gap-8 max-w-4xl mx-auto`}>
              {displayPartners.map((partner, index) => (
                <a 
                  key={partner.id}
                  href={partner.website || '#'}
                  target={partner.website ? '_blank' : undefined}
                  rel={partner.website ? 'noopener noreferrer' : undefined}
                  className={`group relative overflow-hidden ${isDark ? 'bg-gradient-to-br from-slate-800/80 to-slate-900/80 border-slate-700/50' : 'bg-white/90 border-gray-200/50'} border rounded-2xl p-6 sm:p-8 md:p-10 hover:border-purple-500/50 transition-all duration-300 hover:shadow-2xl ${isDark ? 'hover:shadow-purple-900/30' : 'hover:shadow-purple-500/20'} hover:-translate-y-2 ${partner.website ? 'cursor-pointer' : 'cursor-default'} backdrop-blur-sm`}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 to-blue-500/0 group-hover:from-purple-500/10 group-hover:to-blue-500/10 transition-all duration-300 rounded-2xl"></div>
                  <div className="flex flex-col items-center text-center relative z-10">
                    <div className={`w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 mb-6 sm:mb-8 ${isDark ? 'bg-white/10' : 'bg-gray-100'} backdrop-blur-md rounded-2xl p-3 sm:p-4 md:p-5 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg`}>
                      <img 
                        src={partner.logo || `/partners/${partner.name.toLowerCase().replace(/\s+/g, '')}-logo.png`} 
                        alt={partner.name} 
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/partners/default-partner.png';
                        }}
                      />
                    </div>
                    <h3 className={`text-lg sm:text-xl md:text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-2 sm:mb-3`}>
                      {partner.name} {partner.nameAr !== partner.name && `- ${partner.nameAr}`}
                    </h3>
                    <p className={`text-sm sm:text-base ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-2 sm:mb-4`}>{partner.descriptionAr || partner.description}</p>
                    {partner.website && (
                      <div className="mt-4 sm:mt-6 inline-flex items-center gap-2 text-purple-400 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-xs sm:text-sm">زيارة الموقع</span>
                        <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
                      </div>
                    )}
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Features */}
      <section id="features" className={`py-16 sm:py-20 md:py-24 px-4 sm:px-6 lg:px-8 relative ${isDark ? 'bg-slate-900' : 'bg-white'}`}>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-500/5 to-transparent"></div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-12 sm:mb-16 md:mb-20">
            <div className={`inline-flex items-center gap-2 ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-purple-50 border-purple-200'} border rounded-full px-4 py-2 mb-6 backdrop-blur-sm`}>
              <Sparkles className={`w-4 h-4 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
              <span className={`${isDark ? 'text-purple-300' : 'text-purple-700'} text-sm font-semibold`}>المميزات</span>
            </div>
            <h2 className={`text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold ${isDark ? 'text-white' : 'text-gray-900'} mb-4 sm:mb-6`}>
              كل ما تحتاجه لنجاح متجرك
            </h2>
            <p className={`text-lg sm:text-xl md:text-2xl ${isDark ? 'text-gray-400' : 'text-gray-600'} max-w-3xl mx-auto`}>
              أدوات احترافية ومميزات متقدمة لإدارة متجرك بكفاءة عالية
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
            {[
              {
                icon: Store,
                title: 'تصميم احترافي',
                description: 'قوالب جاهزة وقابلة للتخصيص بالكامل',
                color: 'purple'
              },
              {
                icon: BarChart3,
                title: 'تحليلات متقدمة',
                description: 'تتبع مبيعاتك بتقارير تفصيلية',
                color: 'blue'
              },
              {
                icon: Users,
                title: 'إدارة العملاء',
                description: 'برامج ولاء وعروض خاصة',
                color: 'pink'
              },
              {
                icon: CreditCard,
                title: 'بوابات دفع متعددة',
                description: 'تكامل مع جميع بوابات الدفع',
                color: 'green'
              },
              {
                icon: Package,
                title: 'إدارة المخزون',
                description: 'تتبع تلقائي مع تنبيهات ذكية',
                color: 'orange'
              },
              {
                icon: Smartphone,
                title: 'متجاوب مع الجوال',
                description: 'يعمل بسلاسة على جميع الأجهزة',
                color: 'cyan'
              }
            ].map((feature, index) => {
              const colorClasses = {
                purple: {
                  bg: isDark ? 'bg-purple-900/30' : 'bg-purple-100/50',
                  text: 'text-purple-400'
                },
                blue: {
                  bg: isDark ? 'bg-blue-900/30' : 'bg-blue-100/50',
                  text: 'text-blue-400'
                },
                pink: {
                  bg: isDark ? 'bg-pink-900/30' : 'bg-pink-100/50',
                  text: 'text-pink-400'
                },
                green: {
                  bg: isDark ? 'bg-green-900/30' : 'bg-green-100/50',
                  text: 'text-green-400'
                },
                orange: {
                  bg: isDark ? 'bg-orange-900/30' : 'bg-orange-100/50',
                  text: 'text-orange-400'
                },
                cyan: {
                  bg: isDark ? 'bg-cyan-900/30' : 'bg-cyan-100/50',
                  text: 'text-cyan-400'
                }
              };
              const colors = colorClasses[feature.color as keyof typeof colorClasses] || colorClasses.purple;
              
              return (
                <div
                  key={index}
                  className={`group relative p-6 sm:p-8 md:p-10 ${isDark ? 'bg-slate-800/60 border-slate-700/50 hover:bg-slate-800/80 hover:border-purple-500/50' : 'bg-gray-50/80 border-gray-200/50 hover:bg-white hover:border-purple-300/50'} border rounded-2xl hover:shadow-2xl transition-all duration-300 cursor-pointer backdrop-blur-sm hover:-translate-y-2 overflow-hidden`}
                >
                  <div className={`absolute top-0 right-0 w-32 h-32 ${colors.bg} rounded-full blur-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-300`}></div>
                  <div className={`w-16 h-16 ${colors.bg} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg`}>
                    <feature.icon className={`w-8 h-8 ${colors.text}`} />
                  </div>
                  <h3 className={`text-xl sm:text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-3 sm:mb-4 relative z-10`}>{feature.title}</h3>
                  <p className={`text-base sm:text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'} leading-relaxed relative z-10`}>{feature.description}</p>
                  <div className="mt-6 flex items-center text-purple-400 font-semibold opacity-0 group-hover:opacity-100 transition-all duration-300 relative z-10">
                    <span className="text-sm sm:text-base">اعرف المزيد</span>
                    <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 mr-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing Section - Dynamic */}
      <section id="pricing" className={`py-16 sm:py-20 md:py-24 px-4 sm:px-6 lg:px-8 relative ${isDark ? 'bg-gradient-to-b from-slate-900 via-slate-800/95 to-slate-900' : 'bg-gradient-to-b from-gray-50 via-white to-gray-50'}`}>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-12 sm:mb-16 md:mb-20">
            <div className={`inline-flex items-center gap-2 ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-purple-50 border-purple-200'} border rounded-full px-4 py-2 mb-6 backdrop-blur-sm`}>
              <CreditCard className={`w-4 h-4 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
              <span className={`${isDark ? 'text-purple-300' : 'text-purple-700'} text-sm font-semibold`}>الأسعار</span>
            </div>
            <h2 className={`text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold ${isDark ? 'text-white' : 'text-gray-900'} mb-4 sm:mb-6`}>
              خطط الأسعار
            </h2>
            <p className={`text-lg sm:text-xl md:text-2xl ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              اختر الخطة المناسبة لنمو أعمالك
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
            </div>
          ) : plans.length > 0 ? (
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8 max-w-5xl mx-auto">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className={`relative ${isDark ? 'bg-slate-800/80 border-slate-700/50' : 'bg-white/90 border-gray-200/50'} ${plan.isPopular ? 'border-2 border-purple-500 shadow-2xl shadow-purple-500/30 scale-105' : ''} border rounded-2xl p-6 sm:p-8 md:p-10 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 backdrop-blur-sm overflow-hidden`}
                >
                  {plan.isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-5 py-1.5 bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 text-white text-xs sm:text-sm font-bold rounded-full shadow-lg z-10">
                      ⭐ الأكثر شعبية
                    </div>
                  )}
                  {plan.isPopular && (
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-blue-500/10"></div>
                  )}
                  
                  <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                    <div className={`p-1.5 sm:p-2 rounded-lg ${plan.isPopular ? 'bg-purple-500/10 text-purple-500' : isDark ? 'bg-gray-500/10 text-gray-400' : 'bg-gray-100 text-gray-600'}`}>
                      {getPlanIcon(plan.code)}
                    </div>
                    <div>
                      <h3 className={`text-lg sm:text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{plan.name}</h3>
                      {plan.nameAr && (
                        <p className={`text-xs sm:text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{plan.nameAr}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="mb-4 sm:mb-6">
                    {Number(plan.price) === 0 ? (
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl sm:text-3xl md:text-4xl font-bold text-green-500">مجاني</span>
                        <span className="text-[10px] sm:text-xs bg-green-500/10 text-green-500 px-1.5 sm:px-2 py-0.5 rounded-full">للأبد</span>
                      </div>
                    ) : (
                      <div className="flex items-baseline gap-1 flex-wrap">
                        <span className={`text-2xl sm:text-3xl md:text-4xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{plan.price}</span>
                        <span className={`text-sm sm:text-base ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{plan.currency}</span>
                        <span className={`text-xs sm:text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                          /{plan.billingCycle === 'MONTHLY' ? 'شهر' : plan.billingCycle === 'YEARLY' ? 'سنة' : 'مدى الحياة'}
                        </span>
                      </div>
                    )}
                    {plan.description && (
                      <p className={`text-xs sm:text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mt-2`}>{plan.descriptionAr || plan.description}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
                    {(plan.featuresAr?.length > 0 ? plan.featuresAr : plan.features)?.slice(0, 5).map((feature, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs sm:text-sm">
                        <Check className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 flex-shrink-0" />
                        <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>{feature}</span>
                      </div>
                    ))}
                  </div>
                  
                  <Link
                    to="/register"
                    className={`block w-full text-center py-2.5 sm:py-3 rounded-xl font-semibold text-sm sm:text-base ${Number(plan.price) === 0
                      ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700'
                      : plan.isPopular 
                        ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700' 
                        : isDark 
                          ? 'bg-slate-700 text-white hover:bg-slate-600' 
                          : 'bg-gray-100 text-gray-900 hover:bg-gray-200'} transition-all`}
                  >
                    {Number(plan.price) === 0 ? 'ابدأ مجاناً' : 'ابدأ الآن'}
                  </Link>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      {/* Testimonials - Dynamic */}
      <section id="testimonials" className={`py-16 sm:py-20 md:py-24 px-4 sm:px-6 lg:px-8 relative ${isDark ? 'bg-slate-900' : 'bg-white'}`}>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-500/5 to-transparent"></div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-12 sm:mb-16 md:mb-20">
            <div className={`inline-flex items-center gap-2 ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-blue-50 border-blue-200'} border rounded-full px-4 py-2 mb-6 backdrop-blur-sm`}>
              <Star className={`w-4 h-4 ${isDark ? 'text-yellow-400' : 'text-yellow-500'} fill-current`} />
              <span className={`${isDark ? 'text-yellow-300' : 'text-yellow-700'} text-sm font-semibold`}>آراء العملاء</span>
            </div>
            <h2 className={`text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold ${isDark ? 'text-white' : 'text-gray-900'} mb-4 sm:mb-6`}>
              ماذا يقول عملاؤنا
            </h2>
            <p className={`text-lg sm:text-xl md:text-2xl ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              آلاف التجار يثقون في Saeaa
            </p>
          </div>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
            {displayTestimonials.map((testimonial) => (
              <div
                key={testimonial.id}
                className={`group relative p-6 sm:p-8 md:p-10 ${isDark ? 'bg-slate-800/60 border-slate-700/50 hover:border-purple-500/50 hover:bg-slate-800/80' : 'bg-white/90 border-gray-200/50 hover:border-purple-300/50 hover:bg-white'} border rounded-2xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 overflow-hidden backdrop-blur-sm`}
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="flex gap-1 mb-4 sm:mb-6 relative z-10">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 sm:w-6 sm:h-6 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className={`text-base sm:text-lg ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-6 sm:mb-8 leading-relaxed relative z-10 font-medium`}>"{testimonial.content}"</p>
                <div className="flex items-center gap-4 sm:gap-5 relative z-10">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-purple-500 via-blue-500 to-purple-600 rounded-full flex-shrink-0 shadow-lg ring-2 ring-purple-500/20"></div>
                  <div>
                    <div className={`text-base sm:text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{testimonial.name}</div>
                    <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{testimonial.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className={`py-20 sm:py-24 md:py-28 px-4 sm:px-6 lg:px-8 ${isDark ? 'bg-gradient-to-r from-purple-900 via-blue-900 to-purple-900' : 'bg-gradient-to-r from-purple-100 via-blue-100 to-purple-100'} relative overflow-hidden`}>
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 via-blue-500/20 to-purple-500/20"></div>
        <div className="absolute top-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className={`text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold ${isDark ? 'text-white' : 'text-gray-900'} mb-6 sm:mb-8 leading-tight`}>
            جاهز لبدء متجرك الإلكتروني؟
          </h2>
          <p className={`text-lg sm:text-xl md:text-2xl ${isDark ? 'text-purple-100' : 'text-purple-800'} mb-10 sm:mb-12 font-medium`}>
            انضم إلى آلاف التجار الناجحين وابدأ رحلتك اليوم
          </p>
          <Link
            to="/register"
            className={`group inline-flex items-center gap-3 ${isDark ? 'bg-white text-purple-900 hover:bg-gray-50' : 'bg-purple-600 text-white hover:bg-purple-700'} px-10 sm:px-12 md:px-16 py-4 sm:py-5 md:py-6 rounded-2xl font-bold hover:shadow-2xl transition-all duration-300 text-lg sm:text-xl hover:scale-105 relative overflow-hidden`}
          >
            <span className="relative z-10">ابدأ مجاناً الآن</span>
            <ArrowRight className="w-6 h-6 sm:w-7 sm:h-7 group-hover:translate-x-1 transition-transform relative z-10" />
            <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-blue-400 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className={`py-8 sm:py-12 px-4 sm:px-6 lg:px-8 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-gray-50 border-gray-200'} border-t`}>
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <img 
                src={getLogoUrl()} 
                alt="Saeaa - سِعَة" 
                className="h-8 sm:h-10 w-auto"
              />
            </div>
            <div className={`text-xs sm:text-sm text-center md:text-right ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
              © 2025 Saeaa - سِعَة. جميع الحقوق محفوظة.
            </div>
          </div>
          <VersionFooter className={`mt-3 sm:mt-4 pt-3 sm:pt-4 border-t ${isDark ? 'border-slate-800 text-slate-400' : 'border-gray-200 text-gray-500'}`} />
        </div>
      </footer>

      <style>{`
        @keyframes blob {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes slide-down {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slide-down {
          animation: slide-down 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
