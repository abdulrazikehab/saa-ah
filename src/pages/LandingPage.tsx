import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useScroll, useSpring, useMotionValue, useMotionTemplate, AnimatePresence } from 'framer-motion';
import { 
  Store, TrendingUp, Users, Sparkles, Shield, Zap, 
  Globe, BarChart3, Package, ArrowLeft,
  Check, Star, Moon, Sun, Menu, X,
  Rocket, Play, LayoutDashboard, ShoppingBag, Handshake
} from 'lucide-react';
import publicService, { Partner, Plan, PlatformStats, Testimonial } from '@/services/public.service';
import { getLogoUrl } from '@/config/logo.config';
import { VersionFooter } from '@/components/common/VersionFooter';
import { cn } from '@/lib/utils';
import { SplashScreen } from '@/components/common/SplashScreen';
import { InteractiveBackground } from '@/components/landing/InteractiveBackground';

// --- UI Components ---

const HeroHighlight = ({ children }: { children: React.ReactNode }) => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function handleMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  return (
    <div
      className="relative flex items-center justify-center w-full group"
      onMouseMove={handleMouseMove}
    >
      <div 
        className="absolute inset-0 pointer-events-none opacity-20 dark:opacity-20"
        style={{
          backgroundImage: 'radial-gradient(#888 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }}
      />
      <motion.div
        className="pointer-events-none absolute inset-0 opacity-0 transition duration-300 group-hover:opacity-100"
        style={{
          backgroundImage: 'radial-gradient(var(--primary) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          WebkitMaskImage: useMotionTemplate`
            radial-gradient(
              200px circle at ${mouseX}px ${mouseY}px,
              black 0%,
              transparent 100%
            )
          `,
          maskImage: useMotionTemplate`
            radial-gradient(
              200px circle at ${mouseX}px ${mouseY}px,
              black 0%,
              transparent 100%
            )
          `,
        }}
      />
      {children}
    </div>
  );
};

const BentoCard = ({ title, description, icon: Icon, className, delay = 0 }: { 
  title: string; 
  description: string; 
  icon: React.ElementType; 
  className?: string; 
  delay?: number; 
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5, delay }}
    className={cn(
      "group relative overflow-hidden rounded-3xl border border-border/50 bg-card/50 p-8 hover:bg-card/80 transition-colors text-right",
      className
    )}
  >
    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
    <div className="relative z-10 flex flex-col h-full">
      <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:scale-110 transition-transform duration-300">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="mb-2 text-xl font-bold">{title}</h3>
      <p className="text-muted-foreground flex-grow">{description}</p>
    </div>
  </motion.div>
);

const PricingCard = ({ plan, onStart }: { plan: Plan, onStart: (e: React.MouseEvent) => void }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    whileHover={{ y: -10 }}
    className={cn(
      "relative flex flex-col rounded-3xl border p-8 transition-all duration-300 text-right",
      plan.isPopular 
        ? "border-primary bg-card shadow-2xl shadow-primary/10 z-10 scale-105" 
        : "border-border/50 bg-card/50 hover:border-primary/30 hover:shadow-xl"
    )}
  >
    {plan.isPopular && (
      <div className="absolute -top-4 left-0 right-0 mx-auto w-fit rounded-full bg-gradient-to-r from-primary to-secondary px-4 py-1 text-xs font-bold text-white shadow-lg">
        الأكثر طلباً
      </div>
    )}
    
    <div className="mb-6">
      <h3 className="text-xl font-bold">{plan.nameAr || plan.name}</h3>
      {plan.nameAr && plan.name !== plan.nameAr && <p className="text-sm text-muted-foreground">{plan.name}</p>}
    </div>

    <div className="mb-6 flex items-baseline gap-1 flex-row-reverse justify-end">
      {Number(plan.price) === 0 ? (
        <span className="text-4xl font-bold text-foreground">مجاناً</span>
      ) : (
        <>
          <span className="text-sm text-muted-foreground">/{plan.billingCycle === 'MONTHLY' ? 'شهر' : 'سنة'}</span>
          <span className="text-muted-foreground">{plan.currency}</span>
          <span className="text-4xl font-bold text-foreground">{plan.price}</span>
        </>
      )}
    </div>

    <div className="flex-grow space-y-4 mb-8">
      {(plan.featuresAr?.length > 0 ? plan.featuresAr : plan.features)?.slice(0, 6).map((feature, i) => (
        <div key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
          <Check className="h-5 w-5 shrink-0 text-primary" />
          <span>{feature}</span>
        </div>
      ))}
    </div>

    <button
      onClick={onStart}
      className={cn(
        "w-full rounded-xl py-3 font-semibold transition-all duration-300",
        plan.isPopular
          ? "bg-primary text-white hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/25"
          : "bg-muted text-foreground hover:bg-muted/80"
      )}
    >
      {Number(plan.price) === 0 ? 'ابدأ مجاناً' : 'اشترك الآن'}
    </button>
  </motion.div>
);

// --- Main Component ---

export default function LandingPage() {
  const [isDark, setIsDark] = useState(true);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showSplash, setShowSplash] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const navigate = useNavigate();
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  const handleStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowSplash(true);
  };

  const handleSplashFinish = () => {
    setShowSplash(false);
    navigate('/login');
  };

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
      
      // Define fallbacks first so they are available in catch block
      const defaultPartners: Partner[] = [
        { 
          id: 'smartline', 
          name: 'Smart Line', 
          nameAr: 'سمارت لاين', 
          logo: '/partners/smartline-logo.png', 
          description: 'Marketing and Social Media Partner', 
          descriptionAr: 'شريك التسويق والسوشيال ميديا' 
        },
        { 
          id: 'asus', 
          name: 'ASUS', 
          nameAr: 'أسس', 
          logo: '/partners/asus-logo.png', 
          description: 'Product Supply Partner', 
          descriptionAr: 'شريك توريد المنتجات' 
        },
      ];

      const defaultPlans: Plan[] = [
        {
          id: 'free',
          code: 'FREE',
          name: 'Free',
          nameAr: 'المجانية',
          description: 'Perfect for starting your journey',
          descriptionAr: 'مثالية لبدء رحلتك في التجارة الإلكترونية',
          price: '0',
          currency: '$',
          billingCycle: 'monthly',
          features: ['10 Products', 'Saeaa Subdomain', 'Basic Analytics', 'Community Support'],
          featuresAr: ['10 منتجات', 'نطاق فرعي سعة', 'تحليلات أساسية', 'دعم المجتمع'],
          limits: { products: 10, orders: 100, storage: 1, staff: 1, customDomains: 0 },
          isPopular: false,
          sortOrder: 1
        },
        {
          id: 'pro',
          code: 'PRO',
          name: 'Professional',
          nameAr: 'الاحترافية',
          description: 'Everything you need to grow',
          descriptionAr: 'كل ما تحتاجه لتنمية تجارتك باحترافية',
          price: '29',
          currency: '$',
          billingCycle: 'monthly',
          features: ['Unlimited Products', 'Custom Domain', 'Advanced Analytics', 'Priority Support', 'Marketing Tools'],
          featuresAr: ['منتجات غير محدودة', 'نطاق خاص', 'تحليلات متقدمة', 'دعم ذو أولوية', 'أدوات تسويقية'],
          limits: { products: 1000000, orders: 1000000, storage: 100, staff: 5, customDomains: 1 },
          isPopular: true,
          sortOrder: 2
        },
        {
          id: 'enterprise',
          code: 'ENTERPRISE',
          name: 'Enterprise',
          nameAr: 'الشركات',
          description: 'Advanced features for large scale',
          descriptionAr: 'حلول متقدمة للشركات الكبيرة والمتعددة',
          price: '99',
          currency: '$',
          billingCycle: 'monthly',
          features: ['Multi-store Management', 'API Access', 'Dedicated Manager', 'Custom Integrations', 'SLA Guarantee'],
          featuresAr: ['إدارة متاجر متعددة', 'وصول برمجي API', 'مدير حساب مخصص', 'ربط مخصص', 'ضمان مستوى الخدمة'],
          limits: { products: 1000000, orders: 1000000, storage: 1000, staff: 50, customDomains: 10 },
          isPopular: false,
          sortOrder: 3
        }
      ];

      const defaultStats: PlatformStats = {
        stores: '10,000+',
        orders: '500,000+',
        products: '1.2M+',
        uptime: '99.9%',
        support: '24/7'
      };

      const defaultTestimonials: Testimonial[] = [
        {
          id: '1',
          name: 'Ahmed Mansour',
          nameEn: 'Ahmed Mansour',
          role: 'صاحب متجر أزياء',
          roleEn: 'Fashion Store Owner',
          content: 'سعة غيرت طريقتي في العمل. استطعت إطلاق متجري في يوم واحد فقط وبدأت البيع فوراً.',
          contentEn: 'Saeaa changed the way I work. I was able to launch my store in just one day and started selling immediately.',
          rating: 5
        },
        {
          id: '2',
          name: 'Sarah Al-Otaibi',
          nameEn: 'Sarah Al-Otaibi',
          role: 'مصممة مجوهرات',
          roleEn: 'Jewelry Designer',
          content: 'التصاميم المتوفرة في المنصة مذهلة وتعكس فخامة منتجاتي. الدعم الفني دائماً موجود للمساعدة.',
          contentEn: 'The designs available on the platform are stunning and reflect the luxury of my products. Technical support is always there to help.',
          rating: 5
        },
        {
          id: '3',
          name: 'Khalid Ibrahim',
          nameEn: 'Khalid Ibrahim',
          role: 'مدير شركة تقنية',
          roleEn: 'Tech Company Manager',
          content: 'أفضل منصة تجارة إلكترونية استخدمتها. السرعة والأداء لا يعلى عليهما.',
          contentEn: 'The best e-commerce platform I have ever used. Speed and performance are second to none.',
          rating: 5
        }
      ];

      try {
        const [partnersData, plansData, statsData, testimonialsData] = await Promise.all([
          publicService.getPartners().catch(() => []),
          publicService.getPlans().catch(() => []),
          publicService.getStats().catch(() => null),
          publicService.getTestimonials(10).catch(() => []),
        ]);

        setPartners(defaultPartners); // Force only these two as requested
        setPlans(plansData.length > 0 ? plansData : defaultPlans);
        setStats(statsData || defaultStats);
        setTestimonials(testimonialsData.length > 0 ? testimonialsData : defaultTestimonials);
      } catch (error) {
        console.error('Failed to fetch landing page data:', error);
        // Ensure fallbacks are set even on total failure
        setPartners(defaultPartners);
        setPlans(defaultPlans);
        setStats(defaultStats);
        setTestimonials(defaultTestimonials);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const displayStats = stats || {
    stores: '+10,000',
    orders: '+50M',
    uptime: '99.9%',
    support: '24/7',
  };

  const features = [
    {
      icon: LayoutDashboard,
      title: 'بناء بالسحب والإفلات',
      description: 'صمم واجهات متجرك بسهولة تامة باستخدام أدوات مرئية بديهية. لا حاجة لأي خبرة برمجية.',
      className: "md:col-span-2"
    },
    {
      icon: ShoppingBag,
      title: 'إدارة المنتجات',
      description: 'تحكم كامل في المخزون، المتغيرات، والمنتجات الرقمية بكل سهولة.',
      className: "md:col-span-1"
    },
    {
      icon: BarChart3,
      title: 'تحليلات متقدمة',
      description: 'رؤى فورية حول المبيعات، الزوار، ومعدلات التحويل لاتخاذ قرارات مدروسة.',
      className: "md:col-span-1"
    },
    {
      icon: Globe,
      title: 'البيع عالمياً',
      description: 'دعم كامل لتعدد العملات واللغات للوصول إلى العملاء في جميع أنحاء العالم.',
      className: "md:col-span-2"
    },
  ];

  return (
    <div dir="rtl" className={cn(
      "min-h-screen transition-colors duration-500 font-sans selection:bg-primary/30",
      isDark ? "bg-background text-foreground" : "bg-white text-gray-900"
    )}>
      {showSplash && <SplashScreen onFinish={handleSplashFinish} />}
      
      {/* Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-primary z-[100] origin-right"
        style={{ scaleX }}
      />

      {/* Navigation */}
      <nav className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
        isScrolled 
          ? "bg-background/80 backdrop-blur-md border-b border-border/50 shadow-sm" 
          : "bg-transparent"
      )}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <Link to="/" className="flex items-center gap-3 group">
              <motion.div 
                className="relative"
                animate={{ 
                  y: [0, -4, 0],
                }}
                transition={{ 
                  duration: 4, 
                  repeat: Infinity, 
                  ease: "easeInOut" 
                }}
              >
                <div className="absolute inset-0 rounded-xl bg-primary/20 blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <motion.div 
                  className="relative p-2 rounded-xl bg-card border border-border/50 group-hover:border-primary/50 transition-colors"
                  whileHover={{ scale: 1.1, rotate: [0, -5, 5, 0] }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <img src={getLogoUrl()} alt="Saeaa" className="h-8 w-auto" />
                </motion.div>
              </motion.div>
              <div className="flex flex-col">
                <span className="text-xl font-bold tracking-tight">Saeaa</span>
                <span className="text-xs text-muted-foreground">سِعَة</span>
              </div>
            </Link>

            <div className="hidden md:flex items-center gap-8">
              {[
                { label: 'المميزات', href: '#features' },
                { label: 'الأسعار', href: '#pricing' },
                { label: 'آراء العملاء', href: '#testimonials' }
              ].map((item) => (
                <a 
                  key={item.href}
                  href={item.href}
                  className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                >
                  {item.label}
                </a>
              ))}
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsDark(!isDark)}
                className="p-2 rounded-full hover:bg-muted transition-colors"
              >
                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              
              <Link
                to="/login"
                className="hidden sm:block text-sm font-medium hover:text-primary transition-colors"
              >
                تسجيل الدخول
              </Link>
              <Link
                to="/register"
                onClick={handleStart}
                className="hidden sm:flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-full text-sm font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
              >
                ابدأ مجاناً
                <ArrowLeft className="w-4 h-4" />
              </Link>

              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="fixed top-20 left-0 right-0 z-40 bg-background border-b border-border md:hidden overflow-hidden"
          >
            <div className="p-4 space-y-4">
              {[
                { label: 'المميزات', href: '#features' },
                { label: 'الأسعار', href: '#pricing' },
                { label: 'آراء العملاء', href: '#testimonials' }
              ].map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-lg font-medium py-2"
                >
                  {item.label}
                </a>
              ))}
              <div className="pt-4 border-t border-border space-y-3">
                <Link
                  to="/login"
                  className="block w-full text-center py-3 rounded-xl bg-muted font-medium"
                >
                  تسجيل الدخول
                </Link>
                <Link
                  to="/register"
                  onClick={(e) => {
                    setMobileMenuOpen(false);
                    handleStart(e);
                  }}
                  className="block w-full text-center py-3 rounded-xl bg-primary text-primary-foreground font-bold"
                >
                  ابدأ مجاناً
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <InteractiveBackground />


        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8 border border-primary/20"
          >
            <Sparkles className="w-4 h-4" />
            <span>مستقبل التجارة الإلكترونية بين يديك</span>
          </motion.div>

          <HeroHighlight>
            <div className="relative z-20 max-w-4xl mx-auto">
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="text-5xl sm:text-7xl md:text-8xl font-bold tracking-tight mb-8 leading-tight"
              >
                أنشئ متجر أحلامك <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-secondary animate-gradient bg-[length:200%_auto]">
                  في دقائق معدودة
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed"
              >
                منصة متكاملة تمنحك كل الأدوات لإطلاق متجر إلكتروني احترافي دون الحاجة لأي خبرة برمجية.
                تصاميم مذهلة، دعم متواصل، ونمو مضمون.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="flex flex-col sm:flex-row items-center justify-center gap-4"
              >
                <Link
                  to="/register"
                  onClick={handleStart}
                  className="min-w-[200px] h-14 flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-full font-bold text-lg hover:scale-105 transition-transform shadow-xl shadow-primary/25"
                >
                  ابدأ التجربة المجانية
                  <ArrowLeft className="w-5 h-5" />
                </Link>
                <button className="min-w-[200px] h-14 flex items-center justify-center gap-2 bg-card border border-border hover:border-primary/50 rounded-full font-semibold text-lg hover:bg-muted transition-colors">
                  <Play className="w-5 h-5 fill-current" />
                  شاهد العرض
                </button>
              </motion.div>
            </div>
          </HeroHighlight>

        </div>

        {/* Dashboard Preview - Full Width */}
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5, type: "spring" }}
          className="mt-20 relative w-full"
        >
          <div className="relative border-y border-border/50 bg-card/50 backdrop-blur-xl shadow-2xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5" />
            <div className="relative group/video">
              <video 
                id="hero-video"
                src="https://res.cloudinary.com/purplecards/video/upload/v1766391136/InShot_20251222_100910381_mulske.mp4"
                autoPlay 
                loop 
                muted={isMuted}
                playsInline
                className="relative w-full h-auto shadow-inner"
              />
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="absolute bottom-8 left-8 z-30 p-4 rounded-full bg-black/50 backdrop-blur-md text-white border border-white/20 hover:bg-black/70 transition-all opacity-0 group-hover/video:opacity-100"
              >
                {isMuted ? (
                  <div className="flex items-center gap-2 px-2">
                    <Zap className="w-5 h-5 fill-current" />
                    <span className="text-sm font-bold">تشغيل الصوت</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-2">
                    <Sparkles className="w-5 h-5" />
                    <span className="text-sm font-bold">كتم الصوت</span>
                  </div>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Stats Section */}
      <section className="py-20 border-y border-border/50 bg-muted/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { label: 'متجر نشط', value: displayStats.stores, icon: Store },
              { label: 'طلب مكتمل', value: displayStats.orders, icon: Package },
              { label: 'وقت التشغيل', value: displayStats.uptime, icon: Zap },
              { label: 'دعم فني', value: displayStats.support, icon: Shield },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.5 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="text-center"
              >
                <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <stat.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-4xl font-bold mb-2" dir="ltr">{stat.value}</h3>
                <p className="text-muted-foreground font-medium">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-32 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">كل ما تحتاجه للنجاح</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              مزايا قوية وأدوات احترافية صممت خصيصاً لتنمية تجارتك ومضاعفة أرباحك.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <BentoCard
                key={i}
                {...feature}
                delay={i * 0.1}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-32 bg-muted/30 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">باقات أسعار مرنة وشفافة</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              اختر الخطة المثالية لمرحلة نمو مشروعك. لا توجد رسوم خفية.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan) => (
              <PricingCard key={plan.id} plan={plan} onStart={handleStart} />
            ))}
          </div>
        </div>
      </section>

      {/* Partners Section */}
      <section className="py-32 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary border border-primary/20 mb-6"
            >
              <Handshake className="w-4 h-4" />
              <span className="text-sm font-bold">شركاؤنا</span>
            </motion.div>
            <h2 className="text-4xl md:text-6xl font-bold mb-6">شركاؤنا الموثوقون</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              نتعاون مع أفضل الشركات لتقديم خدمات متميزة
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {partners.map((partner, i) => (
              <motion.div
                key={partner.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
                className="group relative"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative h-full bg-card/50 backdrop-blur-xl border border-border/50 rounded-3xl p-8 md:p-12 hover:border-primary/50 transition-all duration-500 flex flex-col items-center text-center">
                  <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl bg-background/80 border border-border/50 p-4 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500 shadow-xl">
                    <img 
                      src={partner.logo} 
                      alt={partner.name} 
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <h3 className="text-2xl md:text-3xl font-bold mb-4">
                    {partner.name} - {partner.nameAr}
                  </h3>
                  <p className="text-lg text-muted-foreground">
                    {partner.descriptionAr}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-32 overflow-hidden bg-muted/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
          <div className="text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">آراء عملائنا</h2>
            <p className="text-xl text-muted-foreground">
              اكتشف لماذا يثق آلاف التجار ورواد الأعمال في منصة سِعَة.
            </p>
          </div>
        </div>

        <div className="relative flex overflow-x-hidden group">
          <div className="animate-marquee flex gap-8 py-4 whitespace-nowrap group-hover:[animation-play-state:paused]">
            {[...testimonials, ...testimonials, ...testimonials, ...testimonials].map((t, i) => t && (
              <div
                key={`${t.id}-${i}`}
                className="w-[350px] md:w-[450px] flex-shrink-0 rounded-3xl border border-border/50 bg-card p-8 hover:border-primary/50 transition-all duration-300 hover:shadow-xl text-right"
              >
                <div className="flex gap-1 mb-4 justify-end">
                  {[...Array(t.rating || 5)].map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                  ))}
                </div>
                <p className="text-lg mb-6 whitespace-normal line-clamp-4 leading-relaxed italic">
                  "{t.content}"
                </p>
                <div className="flex items-center gap-4 flex-row-reverse">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center text-primary font-bold text-xl border border-primary/10">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-lg">{t.name}</p>
                    <p className="text-sm text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-primary z-0">
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20" />
          <div className="absolute inset-0 bg-gradient-to-t from-primary to-transparent" />
        </div>
        
        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center text-primary-foreground">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-6xl font-bold mb-8"
          >
            هل أنت مستعد للانطلاق؟
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-xl md:text-2xl opacity-90 mb-12"
          >
            انضم إلى آلاف التجار الناجحين وابدأ رحلتك نحو الريادة اليوم.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <Link
              to="/register"
              onClick={handleStart}
              className="inline-flex items-center gap-3 bg-white text-primary px-10 py-5 rounded-full font-bold text-xl hover:scale-105 hover:shadow-2xl transition-all"
            >
              ابدأ رحلتك المجانية
              <Rocket className="w-6 h-6" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-16 text-right">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div className="col-span-2">
              <Link to="/" className="flex items-center gap-3 mb-6">
                <img src={getLogoUrl()} alt="Saeaa" className="h-10 w-auto" />
                <span className="text-2xl font-bold">Saeaa</span>
              </Link>
              <p className="text-muted-foreground max-w-md">
                المنصة المتكاملة للتجارة الإلكترونية، صممت لتساعدك في بدء وإدارة وتنمية مشروعك التجاري بكل احترافية.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-6">المنصة</h4>
              <ul className="space-y-4 text-muted-foreground">
                <li><a href="#features" className="hover:text-primary transition-colors">المميزات</a></li>
                <li><a href="#pricing" className="hover:text-primary transition-colors">الأسعار</a></li>
                <li><a href="#testimonials" className="hover:text-primary transition-colors">آراء العملاء</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-6">الشركة</h4>
              <ul className="space-y-4 text-muted-foreground">
                <li><Link to="/about" className="hover:text-primary transition-colors">من نحن</Link></li>
                <li><Link to="/contact" className="hover:text-primary transition-colors">تواصل معنا</Link></li>
                <li><Link to="/privacy" className="hover:text-primary transition-colors">سياسة الخصوصية</Link></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © 2025 Saeaa - سِعَة. جميع الحقوق محفوظة.
            </p>
            <VersionFooter />
          </div>
        </div>
      </footer>
    </div>
  );
}
