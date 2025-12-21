import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Store, TrendingUp, Users, Sparkles, Shield, Zap, 
  Globe, CreditCard, BarChart3, Package, ArrowRight,
  Check, Star, Smartphone, ChevronRight, Moon, Sun, Crown, Building2, Loader2, Menu, X,
  Rocket, Heart, Clock, Award, Play, ChevronDown
} from 'lucide-react';
import publicService, { Partner, Plan, PlatformStats, Testimonial } from '@/services/public.service';
import { getLogoUrl } from '@/config/logo.config';
import { VersionFooter } from '@/components/common/VersionFooter';
import { cn } from '@/lib/utils';

export default function LandingPage() {
  const [isDark, setIsDark] = useState(true);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

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

  const displayStats = stats || {
    stores: '10,000+',
    orders: '50M+',
    uptime: '99.9%',
    support: '24/7',
  };

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

  const features = [
    {
      icon: Store,
      title: 'تصميم احترافي',
      description: 'قوالب جاهزة وقابلة للتخصيص بالكامل مع دعم كامل للغة العربية',
      gradient: 'from-primary to-primary/80'
    },
    {
      icon: BarChart3,
      title: 'تحليلات متقدمة',
      description: 'تتبع مبيعاتك بتقارير تفصيلية ورؤى ذكية لتنمية أعمالك',
      gradient: 'from-secondary to-secondary/80'
    },
    {
      icon: Users,
      title: 'إدارة العملاء',
      description: 'برامج ولاء وعروض خاصة لزيادة ولاء عملائك',
      gradient: 'from-accent to-accent/80'
    },
    {
      icon: CreditCard,
      title: 'بوابات دفع متعددة',
      description: 'تكامل مع جميع بوابات الدفع المحلية والعالمية',
      gradient: 'from-primary to-secondary'
    },
    {
      icon: Package,
      title: 'إدارة المخزون',
      description: 'تتبع تلقائي مع تنبيهات ذكية عند انخفاض المخزون',
      gradient: 'from-secondary to-accent'
    },
    {
      icon: Smartphone,
      title: 'متجاوب مع الجوال',
      description: 'يعمل بسلاسة على جميع الأجهزة والشاشات',
      gradient: 'from-accent to-primary'
    }
  ];


  return (
    <div className={cn(
      "min-h-screen transition-colors duration-500",
      isDark ? "bg-background" : "bg-white"
    )}>
      {/* Navigation */}
      <nav className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
        isScrolled 
          ? "glass-effect-strong shadow-lg border-b border-border/30" 
          : "bg-transparent"
      )}>
        {/* Animated top line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] gradient-aurora animate-gradient bg-[length:300%_auto]" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group">
              <div className="relative">
                <div className="absolute inset-0 rounded-xl gradient-primary blur-lg opacity-0 group-hover:opacity-50 transition-opacity duration-500" />
                <div className="relative p-2.5 rounded-xl bg-card/80 backdrop-blur-sm border border-border/50 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <img 
                    src={getLogoUrl()} 
                    alt="Saeaa - سِعَة" 
                    className="h-12 w-auto"
                  />
                </div>
              </div>
              <div className="hidden sm:flex flex-col">
                <span className="text-lg font-bold gradient-text">Saeaa</span>
                <span className="text-xs text-muted-foreground">سِعَة</span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-2">
              {[
                { label: 'المميزات', href: '#features' },
                { label: 'الأسعار', href: '#pricing' },
                { label: 'آراء العملاء', href: '#testimonials' },
              ].map((item) => (
                <a 
                  key={item.href}
                  href={item.href}
                  className="relative px-4 py-2 rounded-xl text-muted-foreground hover:text-foreground transition-colors font-medium group"
                >
                  <span className="absolute inset-0 rounded-xl bg-muted/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span className="relative">{item.label}</span>
                </a>
              ))}
            </div>

            <div className="flex items-center gap-3">
              {/* Theme Toggle */}
              <button
                onClick={() => setIsDark(!isDark)}
                className="p-2.5 rounded-xl hover:bg-muted/50 transition-all duration-300 group"
                aria-label="Toggle dark mode"
              >
                {isDark ? (
                  <Sun className="w-5 h-5 text-warning group-hover:rotate-180 transition-transform duration-500" />
                ) : (
                  <Moon className="w-5 h-5 text-muted-foreground group-hover:rotate-12 transition-transform duration-300" />
                )}
              </button>
              
              {/* Desktop Auth Links */}
              <Link
                to="/login"
                className="hidden sm:block px-4 py-2 rounded-xl text-muted-foreground hover:text-foreground transition-colors font-medium"
              >
                تسجيل الدخول
              </Link>
              <Link
                to="/register"
                className="hidden sm:inline-flex items-center gap-2 gradient-primary text-white px-5 py-2.5 rounded-xl font-semibold hover:shadow-glow transition-all duration-300 hover:scale-105 group"
              >
                <span>ابدأ مجاناً</span>
                <ArrowRight className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              </Link>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2.5 rounded-xl hover:bg-muted/50 transition-all"
              >
                {mobileMenuOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-border/30 py-4 space-y-2 animate-slide-down">
              {[
                { label: 'المميزات', href: '#features' },
                { label: 'الأسعار', href: '#pricing' },
                { label: 'آراء العملاء', href: '#testimonials' },
              ].map((item) => (
                <a 
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-3 rounded-xl text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors font-medium"
                >
                  {item.label}
                </a>
              ))}
              <div className="pt-3 border-t border-border/30 space-y-2">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-3 rounded-xl text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors font-medium text-center"
                >
                  تسجيل الدخول
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-3 rounded-xl gradient-primary text-white font-semibold text-center shadow-glow"
                >
                  ابدأ مجاناً
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-32 overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 gradient-mesh opacity-50" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background" />
        
        {/* Animated Orbs */}
        <div className="absolute top-20 left-10 w-72 h-72 rounded-full bg-primary/20 blur-3xl animate-blob" />
        <div className="absolute top-40 right-10 w-72 h-72 rounded-full bg-secondary/20 blur-3xl animate-blob animation-delay-2000" />
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-accent/15 blur-3xl animate-blob animation-delay-4000" />
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-grid-pattern opacity-30" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Content */}
            <div className="text-center lg:text-right">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8 animate-fade-in">
                <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                <span className="text-primary text-sm font-semibold">منصة التجارة الإلكترونية #1</span>
              </div>

              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6 animate-slide-up">
                <span className="text-foreground">ابدأ متجرك</span>
                <br />
                <span className="gradient-text-aurora animate-gradient bg-[length:200%_auto]">
                  في 5 دقائق فقط
                </span>
              </h1>

              <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-xl mx-auto lg:mx-0 animate-slide-up animation-delay-200">
                منصة شاملة لإنشاء وإدارة متجرك الإلكتروني بكل احترافية.
                <span className="block mt-2 text-base">
                  بدون خبرة تقنية، بدون تعقيدات، فقط نجاح مضمون.
                </span>
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-10 animate-slide-up animation-delay-400">
                <Link
                  to="/register"
                  className="group inline-flex items-center justify-center gap-2 gradient-primary text-white px-8 py-4 rounded-2xl font-bold hover:shadow-glow transition-all duration-300 hover:scale-105 text-lg"
                >
                  <span>ابدأ الآن مجاناً</span>
                  <ArrowRight className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                </Link>
                <a
                  href="#features"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-semibold border-2 border-border hover:border-primary/50 hover:bg-primary/5 transition-all text-lg group"
                >
                  <Play className="w-5 h-5 text-primary" />
                  <span>شاهد الفيديو</span>
                </a>
              </div>

              {/* Trust Badges */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 text-sm animate-slide-up animation-delay-500">
                {[
                  { icon: Check, label: 'مجاني تماماً' },
                  { icon: Check, label: 'بدون بطاقة ائتمان' },
                  { icon: Check, label: 'إعداد فوري' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 group">
                    <div className="w-6 h-6 rounded-full bg-success/20 flex items-center justify-center group-hover:bg-success/30 transition-colors">
                      <item.icon className="w-4 h-4 text-success" />
                    </div>
                    <span className="text-muted-foreground font-medium">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Hero Visual */}
            <div className="relative hidden lg:block animate-fade-in animation-delay-500">
              <div className="relative glass-card p-8 rounded-3xl shadow-2xl">
                {/* Browser Mockup */}
                <div className="bg-card rounded-2xl p-6 shadow-xl border border-border/50">
                  <div className="flex items-center gap-2 mb-6">
                    <div className="w-3 h-3 rounded-full bg-destructive/60" />
                    <div className="w-3 h-3 rounded-full bg-warning/60" />
                    <div className="w-3 h-3 rounded-full bg-success/60" />
                  </div>
                  <div className="space-y-4">
                    <div className="h-4 bg-muted rounded w-3/4 animate-shimmer" />
                    <div className="h-4 bg-muted rounded w-1/2 animate-shimmer animation-delay-200" />
                    <div className="grid grid-cols-3 gap-4 mt-6">
                      <div className="h-24 rounded-xl gradient-primary opacity-80" />
                      <div className="h-24 rounded-xl gradient-secondary opacity-80" />
                      <div className="h-24 rounded-xl gradient-accent opacity-80" />
                    </div>
                    <div className="h-12 gradient-primary rounded-xl mt-6" />
                  </div>
                </div>
              </div>
              
              {/* Floating Cards */}
              <div className="absolute -top-6 -right-6 glass-card p-4 rounded-2xl shadow-xl animate-float hidden xl:flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-success/20 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-success" />
                </div>
                <div>
                  <div className="text-sm font-bold text-success">+300%</div>
                  <div className="text-xs text-muted-foreground">نمو المبيعات</div>
                </div>
              </div>
              
              <div className="absolute -bottom-6 -left-6 glass-card p-4 rounded-2xl shadow-xl animate-float animation-delay-1000 hidden xl:flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-secondary/20 flex items-center justify-center">
                  <Users className="w-6 h-6 text-secondary" />
                </div>
                <div>
                  <div className="text-sm font-bold">{displayStats.stores}</div>
                  <div className="text-xs text-muted-foreground">عميل سعيد</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce hidden md:block">
          <ChevronDown className="w-6 h-6 text-muted-foreground" />
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 relative">
        <div className="absolute inset-0 gradient-mesh opacity-30" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {[
              { number: displayStats.stores, label: 'متجر نشط', icon: Store, color: 'primary' },
              { number: displayStats.orders || '50M+', label: 'طلب معالج', icon: Package, color: 'secondary' },
              { number: displayStats.uptime, label: 'وقت تشغيل', icon: Zap, color: 'success' },
              { number: displayStats.support, label: 'دعم فني', icon: Shield, color: 'accent' }
            ].map((stat, index) => (
              <div 
                key={index} 
                className="group text-center p-8 rounded-2xl bg-card border border-border/50 hover:border-primary/50 transition-all duration-500 hover:shadow-xl hover:-translate-y-2 animate-scale-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className={cn(
                  "w-14 h-14 mx-auto mb-4 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform",
                  stat.color === 'primary' && "bg-primary/10",
                  stat.color === 'secondary' && "bg-secondary/10",
                  stat.color === 'success' && "bg-success/10",
                  stat.color === 'accent' && "bg-accent/10"
                )}>
                  <stat.icon className={cn(
                    "w-7 h-7",
                    stat.color === 'primary' && "text-primary",
                    stat.color === 'secondary' && "text-secondary",
                    stat.color === 'success' && "text-success",
                    stat.color === 'accent' && "text-accent"
                  )} />
                </div>
                <div className="text-3xl md:text-4xl font-bold gradient-text mb-2">
                  {stat.number}
                </div>
                <div className="text-muted-foreground font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Partners Section */}
      <section className="py-20 relative">
        <div className="absolute inset-0 bg-muted/30" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/10 border border-secondary/20 mb-4">
              <Users className="w-4 h-4 text-secondary" />
              <span className="text-secondary text-sm font-semibold">شركاؤنا</span>
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              شركاؤنا الموثوقون
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              نتعاون مع أفضل الشركات لتقديم خدمات متميزة
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className={cn(
              "grid gap-6 max-w-4xl mx-auto",
              displayPartners.length === 1 && "md:grid-cols-1 max-w-md",
              displayPartners.length === 2 && "md:grid-cols-2",
              displayPartners.length >= 3 && "md:grid-cols-3"
            )}>
              {displayPartners.map((partner, index) => (
                <a 
                  key={partner.id}
                  href={partner.website || '#'}
                  target={partner.website ? '_blank' : undefined}
                  rel={partner.website ? 'noopener noreferrer' : undefined}
                  className="group glass-card p-8 rounded-2xl hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 animate-scale-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="w-24 h-24 mb-6 bg-muted/50 rounded-2xl p-4 group-hover:scale-110 transition-transform">
                      <img 
                        src={partner.logo || `/partners/${partner.name.toLowerCase().replace(/\s+/g, '')}-logo.png`} 
                        alt={partner.name} 
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/partners/default-partner.png';
                        }}
                      />
                    </div>
                    <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                      {partner.name} {partner.nameAr !== partner.name && `- ${partner.nameAr}`}
                    </h3>
                    <p className="text-muted-foreground text-sm">{partner.descriptionAr || partner.description}</p>
                    {partner.website && (
                      <div className="mt-4 flex items-center gap-2 text-primary text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                        <span>زيارة الموقع</span>
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 relative">
        <div className="absolute inset-0 gradient-mesh opacity-20" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-primary text-sm font-semibold">المميزات</span>
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              كل ما تحتاجه لنجاح متجرك
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              أدوات احترافية ومميزات متقدمة لإدارة متجرك بكفاءة عالية
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group p-8 rounded-2xl bg-card border border-border/50 hover:border-primary/50 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 animate-scale-in relative overflow-hidden"
                style={{ animationDelay: `${index * 75}ms` }}
              >
                {/* Gradient Overlay on Hover */}
                <div className={cn(
                  "absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 bg-gradient-to-br",
                  feature.gradient
                )} />
                
                <div className={cn(
                  "w-14 h-14 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform bg-gradient-to-br",
                  feature.gradient
                )}>
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                
                <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
                
                <div className="mt-6 flex items-center text-primary text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  <span>اعرف المزيد</span>
                  <ChevronRight className="w-4 h-4 mr-1" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 relative">
        <div className="absolute inset-0 bg-muted/30" />
        <div className="absolute inset-0 bg-grid-pattern opacity-20" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 mb-4">
              <CreditCard className="w-4 h-4 text-accent" />
              <span className="text-accent text-sm font-semibold">الأسعار</span>
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              خطط الأسعار
            </h2>
            <p className="text-lg text-muted-foreground">
              اختر الخطة المناسبة لنمو أعمالك
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : plans.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {plans.map((plan, index) => (
                <div
                  key={plan.id}
                  className={cn(
                    "relative rounded-2xl p-8 transition-all duration-500 hover:-translate-y-2 animate-scale-in",
                    plan.isPopular 
                      ? "bg-card border-2 border-primary shadow-2xl shadow-primary/20 scale-105 lg:scale-110" 
                      : "bg-card border border-border/50 hover:border-primary/50 hover:shadow-xl"
                  )}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {plan.isPopular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 gradient-primary text-white text-sm font-bold rounded-full shadow-lg">
                      ⭐ الأكثر شعبية
                    </div>
                  )}
                  
                  <div className="flex items-center gap-3 mb-4">
                    <div className={cn(
                      "p-2 rounded-lg",
                      plan.isPopular ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                    )}>
                      {getPlanIcon(plan.code)}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">{plan.name}</h3>
                      {plan.nameAr && <p className="text-sm text-muted-foreground">{plan.nameAr}</p>}
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    {Number(plan.price) === 0 ? (
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-success">مجاني</span>
                        <span className="text-xs bg-success/10 text-success px-2 py-0.5 rounded-full">للأبد</span>
                      </div>
                    ) : (
                      <div className="flex items-baseline gap-1 flex-wrap">
                        <span className="text-3xl font-bold">{plan.price}</span>
                        <span className="text-muted-foreground">{plan.currency}</span>
                        <span className="text-sm text-muted-foreground">
                          /{plan.billingCycle === 'MONTHLY' ? 'شهر' : plan.billingCycle === 'YEARLY' ? 'سنة' : 'مدى الحياة'}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-3 mb-6">
                    {(plan.featuresAr?.length > 0 ? plan.featuresAr : plan.features)?.slice(0, 5).map((feature, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-success flex-shrink-0" />
                        <span className="text-muted-foreground">{feature}</span>
                      </div>
                    ))}
                  </div>
                  
                  <Link
                    to="/register"
                    className={cn(
                      "block w-full text-center py-3 rounded-xl font-semibold transition-all",
                      Number(plan.price) === 0
                        ? "gradient-aurora text-white hover:shadow-glow"
                        : plan.isPopular 
                          ? "gradient-primary text-white hover:shadow-glow" 
                          : "bg-muted hover:bg-muted/80"
                    )}
                  >
                    {Number(plan.price) === 0 ? 'ابدأ مجاناً' : 'ابدأ الآن'}
                  </Link>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-24 relative">
        <div className="absolute inset-0 gradient-mesh opacity-20" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-warning/10 border border-warning/20 mb-4">
              <Star className="w-4 h-4 text-warning fill-warning" />
              <span className="text-warning text-sm font-semibold">آراء العملاء</span>
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              ماذا يقول عملاؤنا
            </h2>
            <p className="text-lg text-muted-foreground">
              آلاف التجار يثقون في Saeaa
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayTestimonials.map((testimonial, index) => (
              <div
                key={testimonial.id}
                className="group p-8 rounded-2xl bg-card border border-border/50 hover:border-warning/50 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 animate-scale-in relative overflow-hidden"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-warning/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className="flex gap-1 mb-6 relative">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-warning text-warning" />
                  ))}
                </div>
                
                <p className="text-muted-foreground mb-8 leading-relaxed relative">
                  "{testimonial.content}"
                </p>
                
                <div className="flex items-center gap-4 relative">
                  <div className="w-12 h-12 gradient-primary rounded-full shadow-lg" />
                  <div>
                    <div className="font-bold">{testimonial.name}</div>
                    <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 gradient-primary" />
        <div className="absolute inset-0 bg-grid-pattern opacity-10" />
        
        {/* Animated Orbs */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8 relative">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
            جاهز لبدء متجرك الإلكتروني؟
          </h2>
          <p className="text-xl text-white/80 mb-10">
            انضم إلى آلاف التجار الناجحين وابدأ رحلتك اليوم
          </p>
          <Link
            to="/register"
            className="group inline-flex items-center gap-3 bg-white text-primary px-10 py-5 rounded-2xl font-bold hover:shadow-2xl transition-all duration-300 hover:scale-105 text-lg"
          >
            <span>ابدأ مجاناً الآن</span>
            <ArrowRight className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img src={getLogoUrl()} alt="Saeaa - سِعَة" className="h-14 w-auto" />
            </div>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              © 2025 Saeaa - سِعَة. جميع الحقوق محفوظة.
              <Heart className="w-3 h-3 text-accent fill-accent mx-1" />
            </p>
          </div>
          <VersionFooter className="mt-4 pt-4 border-t border-border/30 text-muted-foreground" />
        </div>
      </footer>
    </div>
  );
}
