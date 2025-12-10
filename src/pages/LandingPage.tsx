import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Store, TrendingUp, Users, Sparkles, Shield, Zap, 
  Globe, CreditCard, BarChart3, Package, ArrowRight,
  Check, Star, Smartphone, ChevronRight, Moon, Sun, Crown, Building2, Loader2
} from 'lucide-react';
import publicService, { Partner, Plan, PlatformStats, Testimonial } from '@/services/public.service';

export default function LandingPage() {
  const [isDark, setIsDark] = useState(true);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);

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
      <nav className={`fixed top-0 left-0 right-0 z-50 ${isDark ? 'bg-slate-900/80' : 'bg-white/80'} backdrop-blur-xl border-b ${isDark ? 'border-slate-800' : 'border-gray-200'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-3">
              <img 
                src="/branding/saaah-logo-full.png" 
                alt="Saa'ah - سِعَة" 
                className="h-12 w-auto"
              />
            </div>

            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className={`${isDark ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors font-medium`}>المميزات</a>
              <a href="#pricing" className={`${isDark ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors font-medium`}>الأسعار</a>
              <a href="#testimonials" className={`${isDark ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors font-medium`}>آراء العملاء</a>
            </div>

            <div className="flex items-center gap-4">
              {/* Dark Mode Toggle */}
              <button
                onClick={() => setIsDark(!isDark)}
                className={`p-2.5 rounded-xl ${isDark ? 'bg-slate-800 hover:bg-slate-700' : 'bg-gray-100 hover:bg-gray-200'} transition-all`}
                aria-label="Toggle dark mode"
              >
                {isDark ? (
                  <Sun className="w-5 h-5 text-yellow-400" />
                ) : (
                  <Moon className="w-5 h-5 text-gray-700" />
                )}
              </button>
              
              <Link
                to="/login"
                className={`${isDark ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors font-semibold`}
              >
                تسجيل الدخول
              </Link>
              <Link
                to="/register"
                className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg shadow-purple-900/20 hover:shadow-purple-900/40"
              >
                ابدأ مجاناً
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className={`pt-32 pb-20 px-4 sm:px-6 lg:px-8 ${isDark ? 'bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900' : 'bg-gradient-to-b from-gray-50 via-white to-gray-50'} relative overflow-hidden`}>
        {/* Background Gradients */}
        <div className={`absolute top-20 left-10 w-72 h-72 ${isDark ? 'bg-purple-900/20' : 'bg-purple-200/40'} rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-blob`}></div>
        <div className={`absolute top-40 right-10 w-72 h-72 ${isDark ? 'bg-blue-900/20' : 'bg-blue-200/40'} rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-blob animation-delay-2000`}></div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left - Content */}
            <div>
              <div className={`inline-flex items-center gap-2 ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-purple-50 border-purple-200'} border rounded-full px-4 py-2 mb-6 backdrop-blur-sm`}>
                <Sparkles className={`w-4 h-4 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
                <span className={`${isDark ? 'text-purple-300' : 'text-purple-700'} text-sm font-semibold`}>منصة التجارة الإلكترونية #1</span>
              </div>

              <h1 className={`text-5xl md:text-6xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-6 leading-tight`}>
                ابدأ متجرك الإلكتروني
                <span className="block bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent mt-2">
                  في 5 دقائق فقط
                </span>
              </h1>

              <p className={`text-xl ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-8 leading-relaxed`}>
                منصة شاملة لإنشاء وإدارة متجرك الإلكتروني بكل احترافية.
                بدون خبرة تقنية، بدون تعقيدات، فقط نجاح مضمون.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-4 rounded-xl font-semibold hover:from-purple-700 hover:to-blue-700 transition-all shadow-xl shadow-purple-900/20 hover:shadow-purple-900/40 group"
                >
                  <span>ابدأ الآن مجاناً</span>
                  <ArrowRight className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                </Link>
              </div>

              <div className={`flex items-center gap-6 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-400" />
                  <span>مجاني تماماً</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-400" />
                  <span>بدون بطاقة ائتمان</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-400" />
                  <span>إعداد فوري</span>
                </div>
              </div>
            </div>

            {/* Right - Image/Illustration */}
            <div className="relative">
              <div className={`relative ${isDark ? 'bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700' : 'bg-gradient-to-br from-white to-gray-50 border-gray-200'} rounded-3xl p-8 shadow-2xl border`}>
                <div className={`${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'} rounded-2xl p-6 shadow-xl border`}>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                  </div>
                  <div className="space-y-4">
                    <div className={`h-4 ${isDark ? 'bg-slate-800' : 'bg-gray-100'} rounded w-3/4`}></div>
                    <div className={`h-4 ${isDark ? 'bg-slate-800' : 'bg-gray-100'} rounded w-1/2`}></div>
                    <div className="grid grid-cols-3 gap-4 mt-6">
                      <div className="h-24 bg-gradient-to-br from-purple-900/50 to-purple-800/50 rounded-lg border border-purple-500/20"></div>
                      <div className="h-24 bg-gradient-to-br from-blue-900/50 to-blue-800/50 rounded-lg border border-blue-500/20"></div>
                      <div className="h-24 bg-gradient-to-br from-pink-900/50 to-pink-800/50 rounded-lg border border-pink-500/20"></div>
                    </div>
                    <div className="h-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg mt-6 opacity-80"></div>
                  </div>
                </div>
              </div>
              {/* Floating elements */}
              <div className={`absolute -top-6 -right-6 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} rounded-2xl p-4 shadow-xl border animate-float`}>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-900/30 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-green-400" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">+300%</div>
                    <div className="text-xs text-gray-400">نمو المبيعات</div>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-6 -left-6 bg-slate-800 rounded-2xl p-4 shadow-xl border border-slate-700 animate-float" style={{ animationDelay: '1s' }}>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-900/30 rounded-xl flex items-center justify-center">
                    <Users className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">{displayStats.stores}</div>
                    <div className="text-xs text-gray-400">عميل سعيد</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className={`py-16 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-gray-100 border-gray-200'} border-y`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { number: displayStats.stores, label: 'متجر نشط' },
              { number: displayStats.orders || '50M+', label: 'طلب معالج' },
              { number: displayStats.uptime, label: 'وقت تشغيل' },
              { number: displayStats.support, label: 'دعم فني' }
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent mb-2">
                  {stat.number}
                </div>
                <div className={isDark ? 'text-gray-400' : 'text-gray-600'}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trusted Partners - Dynamic */}
      <section className={`py-20 ${isDark ? 'bg-gradient-to-b from-slate-900 to-slate-800' : 'bg-gradient-to-b from-white to-gray-50'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className={`text-3xl md:text-4xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-4`}>شركاؤنا الموثوقون</h2>
            <p className={`text-xl ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>نتعاون مع أفضل الشركات لتقديم خدمات متميزة</p>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
            </div>
          ) : (
            <div className={`grid ${displayPartners.length === 1 ? 'md:grid-cols-1 max-w-md' : displayPartners.length === 2 ? 'md:grid-cols-2' : 'md:grid-cols-3'} gap-8 max-w-4xl mx-auto`}>
              {displayPartners.map((partner, index) => (
                <div 
                  key={partner.id} 
                  className={`group relative overflow-hidden ${isDark ? 'bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700' : 'bg-white border-gray-200'} border rounded-2xl p-8 hover:border-purple-500/50 transition-all hover:shadow-2xl ${isDark ? 'hover:shadow-purple-900/20' : 'hover:shadow-purple-500/20'}`}
                >
                  <div className="flex flex-col items-center text-center">
                    <div className={`w-24 h-24 mb-6 ${isDark ? 'bg-white/10' : 'bg-gray-100'} backdrop-blur-sm rounded-2xl p-4 group-hover:scale-110 transition-transform`}>
                      <img 
                        src={partner.logo || `/partners/${partner.name.toLowerCase().replace(/\s+/g, '')}-logo.png`} 
                        alt={partner.name} 
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/partners/default-partner.png';
                        }}
                      />
                    </div>
                    <h3 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-3`}>
                      {partner.name} {partner.nameAr !== partner.name && `- ${partner.nameAr}`}
                    </h3>
                    <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} mb-4`}>{partner.descriptionAr}</p>
                    <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'} leading-relaxed`}>
                      {partner.description}
                    </p>
                    <div className="mt-6 inline-flex items-center gap-2 text-purple-400 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-sm">تصفح المنتجات</span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Features */}
      <section id="features" className={`py-20 px-4 sm:px-6 lg:px-8 ${isDark ? 'bg-slate-900' : 'bg-white'}`}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className={`text-4xl md:text-5xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-4`}>
              كل ما تحتاجه لنجاح متجرك
            </h2>
            <p className={`text-xl ${isDark ? 'text-gray-400' : 'text-gray-600'} max-w-2xl mx-auto`}>
              أدوات احترافية ومميزات متقدمة لإدارة متجرك بكفاءة عالية
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
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
            ].map((feature, index) => (
              <div
                key={index}
                className={`group p-8 ${isDark ? 'bg-slate-800/50 border-slate-700 hover:bg-slate-800' : 'bg-gray-50 border-gray-200 hover:bg-white'} border rounded-2xl hover:border-purple-500/50 hover:shadow-xl transition-all cursor-pointer backdrop-blur-sm`}
              >
                <div className={`w-14 h-14 bg-${feature.color}-900/30 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <feature.icon className={`w-7 h-7 text-${feature.color}-400`} />
                </div>
                <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-3`}>{feature.title}</h3>
                <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} leading-relaxed`}>{feature.description}</p>
                <div className="mt-4 flex items-center text-purple-400 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-sm">اعرف المزيد</span>
                  <ChevronRight className="w-4 h-4 mr-1" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section - Dynamic */}
      <section id="pricing" className={`py-20 px-4 sm:px-6 lg:px-8 ${isDark ? 'bg-gradient-to-b from-slate-900 to-slate-800' : 'bg-gradient-to-b from-gray-50 to-white'}`}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className={`text-4xl md:text-5xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-4`}>
              خطط الأسعار
            </h2>
            <p className={`text-xl ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              اختر الخطة المناسبة لنمو أعمالك
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
            </div>
          ) : plans.length > 0 ? (
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className={`relative ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} ${plan.isPopular ? 'border-purple-500 shadow-lg shadow-purple-500/20' : ''} border rounded-2xl p-8 hover:shadow-xl transition-all`}
                >
                  {plan.isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xs font-semibold rounded-full">
                      الأكثر شعبية
                    </div>
                  )}
                  
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`p-2 rounded-lg ${plan.isPopular ? 'bg-purple-500/10 text-purple-500' : isDark ? 'bg-gray-500/10 text-gray-400' : 'bg-gray-100 text-gray-600'}`}>
                      {getPlanIcon(plan.code)}
                    </div>
                    <div>
                      <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{plan.name}</h3>
                      {plan.nameAr && (
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{plan.nameAr}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <div className="flex items-baseline gap-1">
                      <span className={`text-4xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{plan.price}</span>
                      <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>{plan.currency}</span>
                      <span className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                        /{plan.billingCycle === 'MONTHLY' ? 'شهر' : plan.billingCycle === 'YEARLY' ? 'سنة' : 'مدى الحياة'}
                      </span>
                    </div>
                    {plan.description && (
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mt-2`}>{plan.descriptionAr || plan.description}</p>
                    )}
                  </div>
                  
                  <div className="space-y-3 mb-6">
                    {(plan.featuresAr?.length > 0 ? plan.featuresAr : plan.features)?.slice(0, 5).map((feature, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-green-500" />
                        <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>{feature}</span>
                      </div>
                    ))}
                  </div>
                  
                  <Link
                    to="/register"
                    className={`block w-full text-center py-3 rounded-xl font-semibold ${plan.isPopular 
                      ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700' 
                      : isDark 
                        ? 'bg-slate-700 text-white hover:bg-slate-600' 
                        : 'bg-gray-100 text-gray-900 hover:bg-gray-200'} transition-all`}
                  >
                    ابدأ الآن
                  </Link>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      {/* Testimonials - Dynamic */}
      <section id="testimonials" className={`py-20 px-4 sm:px-6 lg:px-8 ${isDark ? 'bg-slate-900' : 'bg-white'}`}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className={`text-4xl md:text-5xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-4`}>
              ماذا يقول عملاؤنا
            </h2>
            <p className={`text-xl ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              آلاف التجار يثقون في Saa'ah
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {displayTestimonials.map((testimonial) => (
              <div
                key={testimonial.id}
                className={`p-8 ${isDark ? 'bg-slate-800 border-slate-700 hover:border-slate-600' : 'bg-white border-gray-200 hover:border-gray-300'} border rounded-2xl hover:shadow-xl transition-all`}
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-500 text-yellow-500" />
                  ))}
                </div>
                <p className={`${isDark ? 'text-gray-300' : 'text-gray-700'} mb-6 leading-relaxed`}>"{testimonial.content}"</p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full"></div>
                  <div>
                    <div className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{testimonial.name}</div>
                    <div className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>{testimonial.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className={`py-20 px-4 sm:px-6 lg:px-8 ${isDark ? 'bg-gradient-to-r from-purple-900 to-blue-900' : 'bg-gradient-to-r from-purple-100 to-blue-100'} relative overflow-hidden`}>
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className={`text-4xl md:text-5xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-6`}>
            جاهز لبدء متجرك الإلكتروني؟
          </h2>
          <p className={`text-xl ${isDark ? 'text-purple-200' : 'text-purple-700'} mb-12`}>
            انضم إلى آلاف التجار الناجحين وابدأ رحلتك اليوم
          </p>
          <Link
            to="/register"
            className={`inline-flex items-center gap-2 ${isDark ? 'bg-white text-purple-900 hover:bg-gray-100' : 'bg-purple-600 text-white hover:bg-purple-700'} px-12 py-5 rounded-xl font-bold hover:shadow-2xl transition-all text-lg group`}
          >
            <span>ابدأ مجاناً الآن</span>
            <ArrowRight className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className={`py-12 px-4 sm:px-6 lg:px-8 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-gray-50 border-gray-200'} border-t`}>
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img 
                src="/branding/saaah-logo-full.png" 
                alt="Saa'ah - سِعَة" 
                className="h-10 w-auto"
              />
            </div>
            <div className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
              © 2025 Saa'ah - سِعَة. جميع الحقوق محفوظة.
            </div>
          </div>
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
      `}</style>
    </div>
  );
}
