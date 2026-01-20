import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useScroll, useSpring, useMotionValue, useMotionTemplate, AnimatePresence } from 'framer-motion';
import { Store, TrendingUp, Sparkles, Shield, Zap, Globe, BarChart3, Package, ArrowLeft, Check, Star, Moon, Sun, Menu, X, Rocket, Play, LayoutDashboard, ShoppingBag, HeadphonesIcon, Award } from 'lucide-react';
import publicService, { Partner, Plan, PlatformStats, Testimonial } from '@/services/public.service';
import { getLogoUrl } from '@/config/logo.config';
import { VersionFooter } from '@/components/common/VersionFooter';
import { cn } from '@/lib/utils';
import { SplashScreen } from '@/components/common/SplashScreen';
import { AIChatHelper } from '@/components/chat/AIChatHelper';
import { ThemeCustomizer } from '@/components/ui/ThemeCustomizer';
import { LaptopFrame, PhoneFrame } from '@/components/landing/DeviceFrames';
import { StaticDashboardPreview } from '@/components/landing/StaticDashboardPreview';

const BentoCard = ({ title, description, icon: Icon, className, delay = 0 }: { title: string; description: string; icon: React.ElementType; className?: string; delay?: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 20, rotateX: -15 }}
    whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.6, delay }}
    whileHover={{ y: -8, scale: 1.02 }}
    className={cn("group relative overflow-hidden rounded-3xl border border-border backdrop-blur-xl p-8 text-right shadow-xl hover:shadow-2xl transition-all duration-500 bg-gradient-to-br from-card/80 via-card/60 to-card/40", className)}
    style={{ transformStyle: 'preserve-3d', perspective: '1000px' }}
  >
    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10" />
    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/20 to-transparent rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
    <div className="relative z-10 flex flex-col h-full">
      <motion.div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 border border-primary/30 shadow-lg" whileHover={{ rotate: 360, scale: 1.1 }} transition={{ duration: 0.6 }}>
        <Icon className="h-8 w-8 text-primary" />
      </motion.div>
      <h3 className="mb-3 text-2xl font-bold text-foreground">{title}</h3>
      <p className="text-muted-foreground flex-grow leading-relaxed text-base">{description}</p>
      <div className="mt-6 flex items-center gap-2 text-primary font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
        <span>اكتشف المزيد</span>
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-2 transition-transform" />
      </div>
    </div>
  </motion.div>
);

const PricingCard = ({ plan, onStart }: { plan: Plan; onStart: (e: React.MouseEvent) => void }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    whileHover={{ y: -12, scale: 1.03 }}
    className={cn("relative flex flex-col rounded-3xl border p-10 transition-all duration-500 text-right backdrop-blur-xl bg-gradient-to-br from-card via-card/90 to-card/70 shadow-2xl", plan.isPopular ? "border-primary ring-2 ring-primary/20 z-10 scale-105 shadow-primary/20" : "border-border hover:border-primary/30")}
  >
    {plan.isPopular && (
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -top-5 left-0 right-0 mx-auto w-fit">
        <div className="rounded-full bg-gradient-to-r from-primary via-secondary to-primary px-6 py-2 text-sm font-bold text-white shadow-xl shadow-primary/50">⭐ الأكثر طلباً</div>
      </motion.div>
    )}
    <div className="relative z-10 mb-8">
      <h3 className="text-2xl font-bold mb-2 text-foreground">{plan.nameAr || plan.name}</h3>
    </div>
    <div className="relative z-10 mb-8">
      {Number(plan.price) === 0 ? (
        <div className="flex items-center justify-end gap-3">
          <span className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-l from-primary to-secondary">مجاناً</span>
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-primary" />
          </div>
        </div>
      ) : (
        <div className="flex items-baseline gap-2 flex-row-reverse justify-end">
          <span className="text-base text-muted-foreground font-medium">/{plan.billingCycle === 'MONTHLY' ? 'شهر' : 'سنة'}</span>
          <span className="text-muted-foreground text-xl">{plan.currency}</span>
          <span className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-l from-primary to-secondary">{plan.price}</span>
        </div>
      )}
    </div>
    <div className="flex-grow space-y-4 mb-10 relative z-10">
      {(plan.featuresAr?.length > 0 ? plan.featuresAr : plan.features)?.slice(0, 5).map((feature, i) => (
        <motion.div key={i} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="flex items-start gap-3 text-base">
          <div className="shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center border border-primary/30">
            <Check className="h-4 w-4 text-primary" />
          </div>
          <span className="text-muted-foreground">{feature}</span>
        </motion.div>
      ))}
    </div>
    <button onClick={onStart} className={cn("relative z-10 w-full rounded-xl py-4 font-bold text-lg transition-all duration-300 overflow-hidden group/btn", plan.isPopular ? "bg-gradient-to-r from-primary to-secondary text-white shadow-xl shadow-primary/30 hover:shadow-2xl hover:shadow-primary/50" : "bg-muted text-foreground hover:bg-muted/80 border border-border hover:border-primary/30")}>
      <span className="relative z-10">{Number(plan.price) === 0 ? 'ابدأ مجاناً' : 'اشترك الآن'}</span>
    </button>
  </motion.div>
);

const TestimonialsCarousel = ({ testimonials }: { testimonials: Testimonial[] }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  useEffect(() => {
    if (testimonials.length === 0) return;
    const interval = setInterval(() => setActiveIndex((prev) => (prev + 1) % testimonials.length), 5000);
    return () => clearInterval(interval);
  }, [testimonials.length]);
  if (testimonials.length === 0) return null;
  const t = testimonials[activeIndex];
  return (
    <section id="testimonials" className="py-28 overflow-hidden relative bg-muted/50">
      <div className="absolute inset-0"><div className="absolute top-1/3 left-10 w-[300px] h-[300px] bg-accent/20 rounded-full blur-[100px]" /><div className="absolute bottom-1/3 right-10 w-[250px] h-[250px] bg-primary/20 rounded-full blur-[80px]" /></div>
      <div className="max-w-7xl mx-auto px-4 mb-16 relative z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center">
          <span className="text-primary font-bold text-sm tracking-wider mb-3 block">ماذا يقول عملاؤنا</span>
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">آراء عملائنا</h2>
        </motion.div>
      </div>
      <div className="relative max-w-4xl mx-auto px-4 h-[400px] flex items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.div key={activeIndex} initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: -20 }} transition={{ duration: 0.5 }} className="absolute w-full max-w-2xl">
            <div className="bg-card/50 backdrop-blur-md border border-border rounded-3xl p-8 md:p-12 text-center shadow-2xl relative">
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white shadow-lg"><span className="text-2xl font-serif">"</span></div>
              <div className="flex justify-center gap-1 mb-6 mt-4">{[...Array(t.rating || 5)].map((_, j) => <Star key={j} className="w-5 h-5 fill-yellow-500 text-yellow-500" />)}</div>
              <p className="text-xl md:text-2xl mb-8 leading-relaxed text-foreground font-medium">"{t.content}"</p>
              <div className="flex flex-col items-center gap-2">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-xl shadow-md mb-2">{t.name.charAt(0)}</div>
                <p className="font-bold text-lg text-foreground">{t.name}</p>
                <p className="text-sm text-muted-foreground">{t.role}</p>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="flex justify-center gap-3 mt-8 relative z-10">{testimonials.map((_, i) => <button key={i} onClick={() => setActiveIndex(i)} className={cn("h-2 rounded-full transition-all duration-300", i === activeIndex ? "bg-primary w-8" : "bg-border w-2 hover:bg-primary/50")} />)}</div>
    </section>
  );
};

const InteractiveMarquee = ({ children, speed = 1, className }: { children: React.ReactNode; speed?: number; className?: string }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const animRef = useRef<number>();
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const scroll = () => { if (!isDragging) { el.scrollLeft += speed; if (el.scrollLeft >= el.scrollWidth / 3) el.scrollLeft = 0; } animRef.current = requestAnimationFrame(scroll); };
    animRef.current = requestAnimationFrame(scroll);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [isDragging, speed]);
  const onDown = (e: React.MouseEvent) => { setIsDragging(true); setStartX(e.pageX - (ref.current?.offsetLeft || 0)); setScrollLeft(ref.current?.scrollLeft || 0); };
  const onMove = (e: React.MouseEvent) => { if (!isDragging) return; e.preventDefault(); const x = e.pageX - (ref.current?.offsetLeft || 0); if (ref.current) ref.current.scrollLeft = scrollLeft - (x - startX) * 1.5; };
  return <div ref={ref} className={cn("overflow-x-hidden whitespace-nowrap cursor-grab active:cursor-grabbing select-none", className)} onMouseDown={onDown} onMouseLeave={() => setIsDragging(false)} onMouseUp={() => setIsDragging(false)} onMouseMove={onMove}><div className="inline-flex items-center">{children}{children}{children}</div></div>;
};

export default function LandingPage() {
  const [isDark, setIsDark] = useState(() => {
    // Check localStorage, default to light mode (false)
    const saved = localStorage.getItem('darkMode');
    return saved === 'true';
  });
  const [partners, setPartners] = useState<Partner[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showSplash, setShowSplash] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const navigate = useNavigate();
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });

  const handleStart = (e: React.MouseEvent) => { e.preventDefault(); setShowSplash(true); };
  const handleSplashFinish = () => { setShowSplash(false); navigate('/login'); };

  useEffect(() => { 
    const handleScroll = () => setIsScrolled(window.scrollY > 50); 
    window.addEventListener('scroll', handleScroll); 
    return () => window.removeEventListener('scroll', handleScroll); 
  }, []);
  useEffect(() => { 
    if (isDark) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
    // Save preference to localStorage
    localStorage.setItem('darkMode', String(isDark));
  }, [isDark]);
  useEffect(() => {
    const fetchData = async () => {
      const defPartners: Partner[] = [{ id: 'smartline', name: 'Smart Line', nameAr: 'سمارت لاين', logo: '/partners/smartline-logo.png', description: '', descriptionAr: 'شريك التسويق' }, { id: 'asus', name: 'ASUS', nameAr: 'أسس', logo: '/partners/asus-logo.png', description: '', descriptionAr: 'شريك المنتجات' }];
      const defPlans: Plan[] = [{ id: 'free', code: 'FREE', name: 'Free', nameAr: 'المجانية', description: '', descriptionAr: '', price: '0', currency: '$', billingCycle: 'monthly', features: ['10 منتجات', 'نطاق فرعي', 'تحليلات أساسية', 'دعم المجتمع'], featuresAr: ['10 منتجات', 'نطاق فرعي', 'تحليلات أساسية', 'دعم المجتمع'], limits: { products: 10, orders: 100, storage: 1, staff: 1, customDomains: 0 }, isPopular: false, sortOrder: 1 }, { id: 'pro', code: 'PRO', name: 'Professional', nameAr: 'الاحترافية', description: '', descriptionAr: '', price: '29', currency: '$', billingCycle: 'monthly', features: ['منتجات غير محدودة', 'نطاق خاص', 'تحليلات متقدمة', 'دعم ذو أولوية', 'أدوات تسويقية'], featuresAr: ['منتجات غير محدودة', 'نطاق خاص', 'تحليلات متقدمة', 'دعم ذو أولوية', 'أدوات تسويقية'], limits: { products: 1000000, orders: 1000000, storage: 100, staff: 5, customDomains: 1 }, isPopular: true, sortOrder: 2 }, { id: 'enterprise', code: 'ENTERPRISE', name: 'Enterprise', nameAr: 'الشركات', description: '', descriptionAr: '', price: '99', currency: '$', billingCycle: 'monthly', features: ['إدارة متاجر متعددة', 'وصول API', 'مدير حساب', 'ربط مخصص', 'ضمان SLA'], featuresAr: ['إدارة متاجر متعددة', 'وصول API', 'مدير حساب', 'ربط مخصص', 'ضمان SLA'], limits: { products: 1000000, orders: 1000000, storage: 1000, staff: 50, customDomains: 10 }, isPopular: false, sortOrder: 3 }];
      const defStats: PlatformStats = { stores: '10,000+', orders: '500,000+', products: '1.2M+', uptime: '99.9%', support: '24/7' };
      const defTest: Testimonial[] = [{ id: '1', name: 'أحمد منصور', nameEn: '', role: 'صاحب متجر', roleEn: '', content: 'سعة غيرت طريقتي في العمل. أطلقت متجري في يوم واحد!', contentEn: '', rating: 5 }, { id: '2', name: 'سارة العتيبي', nameEn: '', role: 'مصممة مجوهرات', roleEn: '', content: 'التصاميم مذهلة والدعم الفني دائماً موجود للمساعدة.', contentEn: '', rating: 5 }, { id: '3', name: 'خالد إبراهيم', nameEn: '', role: 'مدير شركة', roleEn: '', content: 'أفضل منصة تجارة إلكترونية. السرعة والأداء لا يعلى عليهما.', contentEn: '', rating: 5 }];
      try {
        const [pData, plData, sData, tData] = await Promise.all([publicService.getPartners().catch(() => []), publicService.getPlans().catch(() => []), publicService.getStats().catch(() => null), publicService.getTestimonials(10).catch(() => [])]);
        setPartners(defPartners); setPlans(plData.length > 0 ? plData : defPlans); setStats(sData || defStats); setTestimonials(tData.length > 0 ? tData : defTest);
      } catch { setPartners(defPartners); setPlans(defPlans); setStats(defStats); setTestimonials(defTest); }
    };
    fetchData();
  }, []);

  const displayStats = stats || { stores: '+10,000', orders: '+50M', uptime: '99.9%', support: '24/7' };
  const features = [
    { icon: LayoutDashboard, title: 'بناء بالسحب والإفلات', description: 'صمم واجهات متجرك بسهولة تامة باستخدام أدوات مرئية بديهية.', className: "md:col-span-2" },
    { icon: ShoppingBag, title: 'إدارة المنتجات', description: 'تحكم كامل في المخزون والمتغيرات والمنتجات الرقمية.', className: "" },
    { icon: BarChart3, title: 'تحليلات متقدمة', description: 'رؤى فورية حول المبيعات والزوار ومعدلات التحويل.', className: "" },
    { icon: Globe, title: 'البيع عالمياً', description: 'دعم كامل لتعدد العملات واللغات للوصول لجميع العملاء.', className: "md:col-span-2" },
    { icon: Zap, title: 'سرعة فائقة', description: 'أداء مثالي وتحميل سريع لتجربة تسوق سلسة.', className: "" },
    { icon: Shield, title: 'أمان عالي', description: 'حماية قوية لبيانات متجرك وعملائك مع SSL مجاني.', className: "" },
  ];

  return (
    <div dir="rtl" className={cn("min-h-screen flex flex-col transition-colors duration-500 font-sans selection:bg-primary/30", isDark ? "bg-background text-foreground" : "bg-white text-gray-900")}>
      <style>{`@keyframes gradient-x{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}.animate-gradient-x{background-size:200% 200%;animation:gradient-x 3s ease infinite}@keyframes pulse-slow{0%,100%{opacity:0.5}50%{opacity:0.8}}.animate-pulse-slow{animation:pulse-slow 4s ease-in-out infinite}`}</style>
      {showSplash && <SplashScreen onFinish={handleSplashFinish} />}
      <motion.div className="fixed top-0 left-0 right-0 h-1 bg-primary z-[100] origin-right" style={{ scaleX }} />

      {/* Nav */}
      <nav className={cn("fixed top-0 left-0 right-0 z-50 transition-all duration-500", isScrolled ? "bg-background/95 backdrop-blur-xl border-b border-border shadow-lg" : "bg-transparent")}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <Link to="/" className="flex items-center gap-3 group">
              <motion.div animate={{ y: [0, -3, 0] }} transition={{ duration: 3, repeat: Infinity }} className="relative p-1.5 rounded-xl bg-card border border-border group-hover:border-primary/50 transition-colors">
                <img src={getLogoUrl()} alt="Saeaa" className="h-14 w-auto" />
              </motion.div>
              <div className="flex flex-col"><span className="text-xl font-bold tracking-tight text-foreground">Saeaa</span><span className="text-xs text-muted-foreground">سِعَة</span></div>
            </Link>
            <div className="hidden md:flex items-center gap-8">{[{ label: 'المميزات', href: '#features' }, { label: 'الأسعار', href: '#pricing' }, { label: 'آراء العملاء', href: '#testimonials' }].map((item) => <a key={item.href} href={item.href} className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">{item.label}</a>)}</div>
            <div className="flex items-center gap-4">
              <button onClick={() => setIsDark(!isDark)} className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">{isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}</button>
              <Link to="/login" className="hidden sm:block text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">تسجيل الدخول</Link>
              <Link to="/register" onClick={handleStart} className="hidden sm:flex items-center gap-2 bg-gradient-to-r from-primary to-secondary text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all">ابدأ مجاناً<ArrowLeft className="w-4 h-4" /></Link>
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 text-muted-foreground">{mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}</button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>{mobileMenuOpen && (<motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="fixed top-20 left-0 right-0 z-40 bg-background/98 backdrop-blur-xl border-b border-border md:hidden overflow-hidden"><div className="p-4 space-y-4">{[{ label: 'المميزات', href: '#features' }, { label: 'الأسعار', href: '#pricing' }, { label: 'آراء العملاء', href: '#testimonials' }].map((item) => <a key={item.href} href={item.href} onClick={() => setMobileMenuOpen(false)} className="block text-lg font-medium py-2 text-muted-foreground hover:text-primary transition-colors">{item.label}</a>)}<div className="pt-4 border-t border-border space-y-3"><Link to="/login" className="block w-full text-center py-3 rounded-xl bg-muted text-muted-foreground font-medium">تسجيل الدخول</Link><Link to="/register" onClick={(e) => { setMobileMenuOpen(false); handleStart(e); }} className="block w-full text-center py-3 rounded-xl bg-gradient-to-r from-primary to-secondary text-white font-bold">ابدأ مجاناً</Link></div></div></motion.div>)}</AnimatePresence>

      <main className="flex-grow">
        {/* Hero */}
        <section className="relative pt-32 pb-32 overflow-hidden min-h-screen flex items-center bg-gradient-to-b from-transparent to-muted/50">
          <div className="absolute inset-0 overflow-hidden">
            <motion.div animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }} transition={{ duration: 8, repeat: Infinity }} className="absolute top-20 right-20 w-72 h-96 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-3xl backdrop-blur-3xl border border-primary/20 transform rotate-12" />
            <motion.div animate={{ y: [0, 20, 0], rotate: [0, -5, 0] }} transition={{ duration: 10, repeat: Infinity }} className="absolute bottom-20 left-20 w-80 h-80 bg-gradient-to-br from-secondary/10 to-accent/10 rounded-3xl backdrop-blur-3xl border border-secondary/20 transform -rotate-12" />
            <div className="absolute inset-0 opacity-30"><div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] bg-primary/20 rounded-full blur-[100px]" /><div className="absolute bottom-1/4 left-1/4 w-[350px] h-[350px] bg-secondary/20 rounded-full blur-[100px]" /></div>
          </div>
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }} className="text-right space-y-8">
                <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} whileHover={{ scale: 1.05 }} className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-gradient-to-r from-card/80 to-card/60 border border-primary/30 backdrop-blur-xl shadow-xl">
                  <span className="relative flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span></span>
                  <span className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-l from-primary to-secondary">متجرك مدعوم بالذكاء الاصطناعي</span>
                </motion.div>
                <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }} className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-relaxed">
                  <span className="block text-gray-900 dark:text-white mb-2">أنشئ <span className="text-primary">متجرك</span></span>
                  <span className="block text-gray-900 dark:text-white mb-2">الرقمي</span>
                  <span className="block text-secondary pt-4">بسهولة</span>
                </motion.h1>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.4 }} className="p-6 rounded-2xl bg-card/50 backdrop-blur-xl border border-border shadow-lg">
                  <p className="text-xl text-muted-foreground leading-relaxed">ابدأ رحلتك في عالم التجارة الإلكترونية مع منصة سِعَة. تصاميم عصرية، أدوات قوية، ودعم متواصل لنجاحك.</p>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.6 }} className="flex flex-col sm:flex-row items-center justify-end gap-4 pt-4">
                  <Link to="/register" onClick={handleStart} className="group min-w-[220px] h-16 flex items-center justify-center gap-3 bg-gradient-to-r from-primary via-secondary to-primary text-white rounded-2xl font-bold text-lg shadow-2xl shadow-primary/40 hover:shadow-primary/60 hover:scale-105 transition-all duration-500 animate-gradient-x relative overflow-hidden"><span className="relative z-10">ابدأ الآن مجاناً</span><ArrowLeft className="relative z-10 w-5 h-5 group-hover:-translate-x-2 transition-transform" /></Link>
                  {/* <button onClick={() => navigate('/dashboard/ai')} className="min-w-[220px] h-16 flex items-center justify-center gap-3 bg-card border-2 border-border hover:border-primary/50 rounded-2xl font-bold text-lg backdrop-blur-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"><Sparkles className="w-5 h-5 text-accent" />جرب سعة AI</button> */}
                </motion.div>
              </motion.div>
              <motion.div initial={{ opacity: 0, scale: 0.8, x: 20 }} animate={{ opacity: 1, scale: 1, x: 0 }} transition={{ duration: 1, delay: 0.3 }} className="relative flex items-center justify-center lg:justify-end min-h-[500px]" style={{ perspective: '1000px' }}>
                {/* Laptop - Desktop View */}
                <motion.div 
                  initial={{ y: 20, rotateY: -5 }}
                  animate={{ y: [0, -10, 0] }} 
                  transition={{ y: { duration: 6, repeat: Infinity, ease: "easeInOut" } }}
                  className="relative z-10 w-full max-w-[650px] lg:max-w-[750px]"
                >
                  <LaptopFrame>
                    <StaticDashboardPreview isDark={isDark} />
                  </LaptopFrame>
                </motion.div>

                {/* Phone - Mobile View - Overlapping */}
                <motion.div 
                  initial={{ y: 50, x: -20, opacity: 0 }}
                  animate={{ y: 0, x: 0, opacity: 1 }}
                  transition={{ delay: 0.8, duration: 0.8 }}
                  className="absolute -bottom-4 -right-2 md:-right-12 z-20"
                >
                  <PhoneFrame>
                    <StaticDashboardPreview mobile isDark={isDark} />
                  </PhoneFrame>
                </motion.div>

                <motion.div animate={{ y: [-15, 15, -15], rotate: [0, 10, 0] }} transition={{ duration: 4, repeat: Infinity }} className="absolute -top-12 right-12 w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center shadow-2xl shadow-primary/40 z-30"><Sparkles className="w-8 h-8 text-white" /></motion.div>
                <motion.div animate={{ y: [15, -15, 15], rotate: [0, -10, 0] }} transition={{ duration: 5, repeat: Infinity }} className="absolute -bottom-6 -left-6 w-16 h-16 bg-gradient-to-br from-secondary to-accent rounded-xl flex items-center justify-center shadow-2xl shadow-secondary/40"><Rocket className="w-8 h-8 text-white" /></motion.div>
              </motion.div>
            </div>
          </div>
        </section>



        {/* Video Section */}
        <section className="py-24 bg-gradient-to-b from-muted/50 to-background">
          <div className="max-w-7xl mx-auto px-4"><motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16"><span className="text-primary font-bold text-sm tracking-wider mb-3 block">شاهد كيف يعمل</span><h2 className="text-4xl md:text-5xl font-bold mb-6">أطلق متجرك في <span className="text-transparent bg-clip-text bg-gradient-to-l from-primary to-secondary">دقائق</span></h2></motion.div>
            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="max-w-4xl mx-auto"><div className="relative group"><div className="absolute -inset-4 bg-gradient-to-r from-primary/20 via-secondary/20 to-primary/20 rounded-3xl blur-2xl opacity-50 group-hover:opacity-75 transition-opacity" /><div className="relative rounded-2xl overflow-hidden border border-border shadow-2xl bg-card"><div className="bg-muted px-4 py-3 flex items-center gap-3 border-b border-border"><div className="flex gap-2"><div className="w-3 h-3 rounded-full bg-red-500" /><div className="w-3 h-3 rounded-full bg-yellow-500" /><div className="w-3 h-3 rounded-full bg-green-500" /></div><div className="flex-1 mx-4"><div className="bg-background rounded-lg px-4 py-1.5 text-xs text-muted-foreground text-center">your-store.saeaa.com</div></div></div><div className="relative group/video aspect-video"><video src="https://res.cloudinary.com/purplecards/video/upload/v1766391136/InShot_20251222_100910381_mulske.mp4" autoPlay loop muted={isMuted} playsInline className="w-full h-full object-cover" /><button onClick={() => setIsMuted(!isMuted)} className="absolute bottom-4 right-4 z-30 px-4 py-2 rounded-full bg-black/70 backdrop-blur-md text-white border border-white/20 hover:bg-black/90 transition-all opacity-0 group-hover/video:opacity-100 flex items-center gap-2">{isMuted ? <><Play className="w-4 h-4" /><span className="text-xs font-bold">تشغيل الصوت</span></> : <><Sparkles className="w-4 h-4" /><span className="text-xs font-bold">كتم</span></>}</button></div></div></div>
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 }} className="flex justify-center gap-8 mt-12">{[{ value: '20 دقيقة', label: 'متوسط وقت الإعداد' }, { value: '0 كود', label: 'بدون برمجة' }, { value: '100%', label: 'سهولة الاستخدام' }].map((s, i) => <div key={i} className="text-center"><p className="text-2xl md:text-3xl font-bold text-primary">{s.value}</p><p className="text-sm text-muted-foreground">{s.label}</p></div>)}</motion.div>
            </motion.div>
          </div>
        </section>

        {/* Stats */}
        <section className="py-24 relative overflow-hidden bg-card">
          <div className="absolute inset-0"><div className="absolute top-0 left-1/4 w-[400px] h-[400px] bg-primary/20 rounded-full blur-[150px] animate-pulse-slow" /></div>
          <div className="relative z-10 max-w-7xl mx-auto px-4"><motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16"><span className="text-primary font-bold text-sm tracking-wider">الأرقام تتكلم</span><h2 className="text-3xl md:text-4xl font-bold text-foreground mt-2">منصة موثوقة لنجاح تجارتك</h2></motion.div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">{[{ label: 'متجر نشط', value: displayStats.stores, icon: Store }, { label: 'طلب مكتمل', value: displayStats.orders, icon: Package }, { label: 'وقت التشغيل', value: displayStats.uptime, icon: Zap }, { label: 'دعم فني', value: displayStats.support, icon: Shield }].map((stat, i) => <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="text-center group"><div className="relative inline-block mb-6"><div className="absolute inset-0 bg-primary/20 rounded-full blur-xl scale-150 opacity-0 group-hover:opacity-100 transition-opacity duration-500" /><div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 border border-primary/20 flex items-center justify-center mx-auto group-hover:border-primary/40 transition-colors"><stat.icon className="w-7 h-7 text-primary" /></div></div><h3 className="text-4xl md:text-5xl font-black mb-3 text-foreground" dir="ltr">{stat.value}</h3><p className="text-muted-foreground font-medium text-lg">{stat.label}</p></motion.div>)}</div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="py-32 relative bg-gradient-to-b from-muted/50 via-background to-muted/50 overflow-hidden">
          <div className="absolute inset-0 opacity-30"><div className="absolute top-1/3 right-1/4 w-[300px] h-[300px] bg-primary/30 rounded-full blur-[100px]" /></div>
          <div className="relative z-10 max-w-7xl mx-auto px-4"><motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-20"><motion.span initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} className="inline-block text-primary font-bold text-sm tracking-wider mb-4 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">كل الأدوات في مكان واحد</motion.span><h2 className="text-5xl md:text-6xl font-black mb-6">مميزات <span className="text-transparent bg-clip-text bg-gradient-to-l from-primary to-secondary">استثنائية</span></h2><p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">أدوات احترافية ومزايا قوية صممت خصيصاً لتنمية تجارتك</p></motion.div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">{features.map((f, i) => <BentoCard key={i} icon={f.icon} title={f.title} description={f.description} className={f.className} delay={i * 0.1} />)}</div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="py-28 relative overflow-hidden bg-card">
          <div className="absolute inset-0"><div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[150px] animate-pulse-slow" /></div>
          <div className="relative z-10 max-w-7xl mx-auto px-4"><motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-20"><span className="text-primary font-bold text-sm tracking-wider mb-3 block">باقات مرنة</span><h2 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">أسعار شفافة بدون رسوم خفية</h2></motion.div>
            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">{plans.map((plan) => <PricingCard key={plan.id} plan={plan} onStart={handleStart} />)}</div>
          </div>
        </section>

        {/* Partners */}
        <section className="py-28 relative overflow-hidden bg-background">
          <div className="relative z-10 max-w-7xl mx-auto px-4"><motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16"><span className="text-primary font-bold text-sm tracking-wider mb-3 block">شركاؤنا</span><h2 className="text-4xl md:text-5xl font-bold mb-6">شركاؤنا الموثوقون</h2></motion.div>
            <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">{partners.map((p, i) => <motion.div key={p.id} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.2 }} className="group"><div className="relative h-full rounded-3xl p-8 flex flex-col items-center text-center bg-card border border-border hover:border-primary/30 transition-all"><div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/10 to-secondary/10 border border-primary/20 p-4 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500"><img src={p.logo} alt={p.name} className="w-full h-full object-contain" /></div><h3 className="text-xl font-bold mb-3">{p.name} - {p.nameAr}</h3><p className="text-muted-foreground">{p.descriptionAr}</p></div></motion.div>)}</div>
          </div>
        </section>

        <TestimonialsCarousel testimonials={testimonials} />

        {/* CTA */}
        <section className="py-28 relative overflow-hidden bg-card">
          <div className="absolute inset-0"><div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[150px]" /></div>
          <div className="relative z-10 max-w-4xl mx-auto px-4 text-center"><motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-6"><span className="text-primary font-bold text-sm tracking-wider">سعة يجعل كل شيء أسهل!</span></motion.div><motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="text-4xl md:text-5xl lg:text-6xl font-black mb-6 text-foreground">هل أنت جاهز لبدء تجارتك؟</motion.h2><motion.p initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }} className="text-lg md:text-xl text-muted-foreground mb-10">انضم إلى آلاف التجار الناجحين وابدأ رحلتك نحو الريادة اليوم.</motion.p><motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: 0.3 }}><Link to="/register" onClick={handleStart} className="inline-flex items-center gap-3 bg-gradient-to-r from-primary to-secondary text-white px-10 py-4 rounded-xl font-bold text-lg shadow-2xl shadow-primary/30 hover:shadow-primary/50 hover:scale-105 transition-all duration-300">ابدأ الآن مجاناً<Rocket className="w-5 h-5" /></Link></motion.div></div>
        </section>

        {/* Trust Badges */}
        <section className="py-16 bg-background border-t border-border">
          <div className="max-w-7xl mx-auto px-4"><motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12"><h3 className="text-2xl font-bold mb-2">لماذا تختار سِعَة؟</h3><p className="text-muted-foreground">الأمان والثقة في المقام الأول</p></motion.div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">{[{ icon: Shield, title: 'أمان SSL', desc: 'شهادات مجانية' }, { icon: Zap, title: 'سرعة فائقة', desc: 'تحميل في ثوانٍ' }, { icon: HeadphonesIcon, title: 'دعم 24/7', desc: 'فريق جاهز دائماً' }, { icon: Award, title: 'جودة مضمونة', desc: 'رضا 99.9%' }].map((b, i) => <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="text-center group"><div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary/10 to-secondary/10 border border-primary/20 flex items-center justify-center group-hover:scale-110 transition-transform"><b.icon className="w-8 h-8 text-primary" /></div><h4 className="font-bold mb-1">{b.title}</h4><p className="text-sm text-muted-foreground">{b.desc}</p></motion.div>)}</div>
          </div>
        </section>

        {/* Payment Gateways */}
        <section className="py-12 border-t border-border bg-card overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 mb-8 text-center"><h3 className="text-lg font-semibold text-muted-foreground">طرق دفع آمنة ومتعددة</h3></div>
          <div dir="ltr"><InteractiveMarquee speed={0.8} className="py-4">{[{ id: 'mada', c: <div className="h-12 px-6 bg-blue-600 text-white font-bold rounded-lg flex items-center italic tracking-widest shadow-sm">mada</div> }, { id: 'visa', c: <div className="h-12 px-2 text-blue-800 font-black text-4xl italic flex items-center tracking-tighter">VISA</div> }, { id: 'mc', c: <div className="flex items-center relative w-16 h-10"><div className="absolute left-0 w-10 h-10 bg-[#EB001B] rounded-full opacity-90"></div><div className="absolute right-0 w-10 h-10 bg-[#FF5F00] rounded-full opacity-90 mix-blend-multiply"></div></div> }, { id: 'apple', c: <div className="h-12 px-4 bg-black text-white rounded-lg flex items-center gap-1 font-medium shadow-sm"> Pay</div> }, { id: 'stc', c: <div className="h-12 px-4 text-[#4F008C] font-bold text-2xl flex items-center">stc pay</div> }, { id: 'tabby', c: <div className="h-12 px-4 bg-[#3EEDBF] text-black font-bold text-xl rounded-full flex items-center shadow-sm">tabby</div> }, { id: 'tamara', c: <div className="h-12 px-4 bg-[#E6B658] text-black font-bold text-xl rounded-full flex items-center shadow-sm">tamara</div> }].map((g, i) => <div key={i} className="inline-flex items-center justify-center mx-8 min-w-[100px] grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all duration-300 hover:scale-110 cursor-pointer">{g.c}</div>)}</InteractiveMarquee></div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-16 text-right relative overflow-hidden mt-auto">
        <div className="absolute inset-0 opacity-20"><div className="absolute top-0 right-1/4 w-[300px] h-[300px] bg-primary/10 rounded-full blur-[100px]" /></div>
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div className="col-span-2"><Link to="/" className="flex items-center gap-3 mb-6"><div className="p-2 rounded-xl bg-muted border border-border"><img src={getLogoUrl()} alt="Saeaa" className="h-10 w-auto" /></div><span className="text-2xl font-bold text-foreground">Saeaa</span></Link><p className="text-muted-foreground max-w-md leading-relaxed">المنصة المتكاملة للتجارة الإلكترونية، صممت لتساعدك في بدء وإدارة وتنمية مشروعك التجاري بكل احترافية.</p></div>
            <div><h4 className="font-bold mb-6 text-foreground">المنصة</h4><ul className="space-y-4 text-muted-foreground"><li><a href="#features" className="hover:text-primary transition-colors">المميزات</a></li><li><a href="#pricing" className="hover:text-primary transition-colors">الأسعار</a></li><li><a href="#testimonials" className="hover:text-primary transition-colors">آراء العملاء</a></li></ul></div>
            <div><h4 className="font-bold mb-6 text-foreground">الشركة</h4><ul className="space-y-4 text-muted-foreground"><li><Link to="/about" className="hover:text-primary transition-colors">من نحن</Link></li><li><Link to="/contact" className="hover:text-primary transition-colors">تواصل معنا</Link></li><li><Link to="/privacy" className="hover:text-primary transition-colors">سياسة الخصوصية</Link></li></ul></div>
          </div>
          <div className="pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4"><p className="text-sm text-muted-foreground">© 2025 Saeaa - سِعَة. جميع الحقوق محفوظة.</p><VersionFooter /></div>
        </div>
      </footer>
      <ThemeCustomizer />
      <AIChatHelper context={{ currentPage: 'landing' }} />
    </div>
  );
}
