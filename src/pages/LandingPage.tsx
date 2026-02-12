import { useState, useEffect, useRef, ElementType } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useScroll, useSpring, AnimatePresence } from 'framer-motion';
import {
  Store,
  Sparkles,
  Zap,
  Globe,
  BarChart3,
  Package,
  ArrowLeft,
  Check,
  Star,
  Menu,
  X,
  Rocket,
  ShoppingBag,
  Award,
  Orbit,
  Layers,
  Users,
  Cpu,
  Network,
  TrendingUp,
  Plus,
  Minus,
} from 'lucide-react';
import publicService, { Partner, Plan, PlatformStats, Testimonial } from '@/services/public.service';
import { getLogoUrl } from '@/config/logo.config';
import { VersionFooter } from '@/components/common/VersionFooter';
import { cn } from '@/lib/utils';
import { SplashScreen } from '@/components/common/SplashScreen';
import { AIChatHelper } from '@/components/chat/AIChatHelper';
import { ThemeCustomizer } from '@/components/ui/ThemeCustomizer';
import { LaptopFrame, PhoneFrame } from '@/components/landing/DeviceFrames';
import { StaticDashboardPreview } from '@/components/landing/StaticDashboardPreview';
import { WelcomeSaudiLottie } from '@/components/landing/WelcomeSaudiLottie';

// =======================
// Cold Theme Helpers
// =======================
const coldGradMain = 'from-blue-600 via-cyan-500 to-indigo-600';
const coldGradText = 'from-sky-400 via-cyan-400 to-indigo-400';
const coldGlowShadow = 'shadow-cyan-500/40';

// 3D Particle Space Background (Cold colors)
const SpaceParticles = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();

    class Particle {
      x: number;
      y: number;
      z: number;
      size: number;
      baseX: number;
      baseY: number;
      density: number;

      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.z = Math.random() * 1500;
        this.size = Math.random() * 2 + 0.5;
        this.baseX = this.x;
        this.baseY = this.y;
        this.density = Math.random() * 30 + 1;
      }

      update(mouse: { x: number; y: number; radius: number }) {
        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy) || 0.0001;
        const forceDirectionX = dx / distance;
        const forceDirectionY = dy / distance;
        const maxDistance = mouse.radius;
        const force = (maxDistance - distance) / maxDistance;

        if (distance < mouse.radius) {
          const directionX = forceDirectionX * force * this.density;
          const directionY = forceDirectionY * force * this.density;
          this.x -= directionX;
          this.y -= directionY;
        } else {
          if (this.x !== this.baseX) {
            const dx2 = this.x - this.baseX;
            this.x -= dx2 / 10;
          }
          if (this.y !== this.baseY) {
            const dy2 = this.y - this.baseY;
            this.y -= dy2 / 10;
          }
        }

        this.z -= 2;
        if (this.z <= 0) {
          this.z = 1500;
          this.x = Math.random() * canvas.width;
          this.y = Math.random() * canvas.height;
          this.baseX = this.x;
          this.baseY = this.y;
        }
      }

      draw() {
        if (!ctx || !canvas) return;

        const scale = 1000 / this.z;
        const x2d = (this.x - canvas.width / 2) * scale + canvas.width / 2;
        const y2d = (this.y - canvas.height / 2) * scale + canvas.height / 2;
        const size2d = this.size * scale;

        const opacity = Math.max(0, 1 - this.z / 1500);

        // Cold palette: sky + cyan
        ctx.beginPath();
        ctx.fillStyle = `rgba(56, 189, 248, ${opacity * 0.75})`; // sky-400
        ctx.arc(x2d, y2d, size2d, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.fillStyle = `rgba(34, 211, 238, ${opacity * 0.55})`; // cyan-400
        ctx.arc(x2d + size2d, y2d, size2d * 0.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const particles: Particle[] = [];
    for (let i = 0; i < 300; i++) particles.push(new Particle());

    const mouse = { x: 0, y: 0, radius: 150 };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('resize', resizeCanvas);

    let animationId: number;
    const animate = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        p.update(mouse);
        p.draw();
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0" />;
};

// Cosmic Store Node Component (Cold colors)
const StoreNode = ({ index, total }: { store: unknown; index: number; total: number }) => {
  const angle = (index / total) * Math.PI * 2;
  const radius = 200;
  const x = Math.cos(angle) * radius;
  const y = Math.sin(angle) * radius;

  return (
    <motion.div
      className="absolute"
      style={{ left: '50%', top: '50%' }}
      initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
      animate={{
        x,
        y,
        opacity: 1,
        scale: 1,
      }}
      transition={{
        duration: 1,
        delay: index * 0.1,
        type: 'spring',
        stiffness: 100,
      }}
    >
      <motion.div whileHover={{ scale: 1.2, rotate: 360 }} className="relative w-20 h-20 -ml-10 -mt-10 cursor-pointer group">
        {/* Glow effect */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-cyan-600/40 via-sky-600/40 to-indigo-600/40 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {/* Store node */}
        <div className="relative w-full h-full rounded-2xl bg-gradient-to-br from-blue-700 via-cyan-700 to-indigo-700 border-2 border-white/20 flex items-center justify-center shadow-2xl backdrop-blur-sm">
          <Store className="w-8 h-8 text-white" />
        </div>

        {/* Connection line to center */}
        <svg className="absolute inset-0 w-full h-full -z-10" style={{ overflow: 'visible' }}>
          <motion.line
            x1="50%"
            y1="50%"
            x2={-x}
            y2={-y}
            stroke="url(#coldGradient)"
            strokeWidth="2"
            strokeDasharray="5,5"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1, delay: index * 0.1 }}
          />
          <defs>
            <linearGradient id="coldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(56, 189, 248, 0.45)" />
              <stop offset="100%" stopColor="rgba(34, 211, 238, 0.45)" />
            </linearGradient>
          </defs>
        </svg>

        {/* Store info tooltip */}
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap">
          <div className="px-4 py-2 rounded-lg bg-black/80 backdrop-blur-md border border-white/20 text-white text-sm font-bold">
            متجر #{index + 1}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

// Interactive Multi-Store Hub (Cold colors)
const MultiStoreHub = () => {
  const [storeCount, setStoreCount] = useState(6);

  return (
    <div className="relative w-full h-[600px] flex items-center justify-center">
      {/* Control panel */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 bg-black/60 backdrop-blur-xl border border-white/20 rounded-full px-6 py-3">
        <button
          onClick={() => setStoreCount(Math.max(3, storeCount - 1))}
          className="w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-500 flex items-center justify-center transition-colors"
        >
          <Minus className="w-4 h-4 text-white" />
        </button>
        <span className="text-white font-bold text-lg min-w-[80px] text-center">{storeCount} متاجر</span>
        <button
          onClick={() => setStoreCount(Math.min(12, storeCount + 1))}
          className="w-8 h-8 rounded-full bg-cyan-600 hover:bg-cyan-500 flex items-center justify-center transition-colors"
        >
          <Plus className="w-4 h-4 text-white" />
        </button>
      </div>

      {/* Central hub */}
      <motion.div className="relative z-10" animate={{ rotate: 360 }} transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}>
        <div
          className={cn(
            'w-40 h-40 rounded-full bg-gradient-to-br',
            'from-blue-600 via-cyan-500 to-indigo-600',
            'flex items-center justify-center shadow-2xl relative',
            'shadow-cyan-500/35'
          )}
        >
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-600 via-cyan-500 to-indigo-600 blur-2xl opacity-60 animate-pulse" />
          <div className="relative z-10 text-center">
            <Network className="w-16 h-16 text-white mx-auto mb-2" />
            <p className="text-white font-black text-sm">كون</p>
          </div>
        </div>
      </motion.div>

      {/* Orbiting stores */}
      <AnimatePresence>
        {[...Array(storeCount)].map((_, i) => (
          <StoreNode key={i} store={null} index={i} total={storeCount} />
        ))}
      </AnimatePresence>

      {/* Orbital rings */}
      {[1, 2, 3].map((ring) => (
        <motion.div
          key={ring}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10"
          style={{ width: ring * 200, height: ring * 200 }}
          animate={{ rotate: ring % 2 === 0 ? 360 : -360 }}
          transition={{ duration: 40 * ring, repeat: Infinity, ease: 'linear' }}
        />
      ))}
    </div>
  );
};

// Holographic Feature Card (FIXED + Cold colors)
const HolographicCard = ({
  icon: Icon,
  title,
  description,
  color,
  delay = 0,
}: {
  icon: ElementType;
  title: string;
  description: string;
  color: string; // tailwind gradient like "from-blue-600 to-cyan-600"
  delay?: number;
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, rotateX: -20 }}
      whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="relative group perspective-1000"
    >
      <motion.div
        animate={{
          rotateY: isHovered ? 10 : 0,
          rotateX: isHovered ? 10 : 0,
          z: isHovered ? 50 : 0,
        }}
        transition={{ duration: 0.3 }}
        className="relative p-8 rounded-3xl border border-white/10 backdrop-blur-xl overflow-hidden preserve-3d"
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%)',
        }}
      >
        {/* Cold gradient overlay on hover (NO broken string replace) */}
        <div className={cn('absolute inset-0 opacity-0 group-hover:opacity-55 transition-opacity duration-500', `bg-gradient-to-br ${color}`)} />

        {/* Holographic scan line */}
        <motion.div
          className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-white to-transparent"
          animate={{
            top: isHovered ? ['0%', '100%'] : '50%',
            opacity: isHovered ? [0, 1, 0] : 0,
          }}
          transition={{ duration: 2, repeat: isHovered ? Infinity : 0 }}
        />

        <div className="relative z-10 transform-gpu" style={{ transform: 'translateZ(30px)' }}>
          {/* Icon with glow */}
          <motion.div className="mb-6 inline-flex" animate={{ scale: isHovered ? 1.1 : 1, rotate: isHovered ? 360 : 0 }} transition={{ duration: 0.6 }}>
            <div className={cn('p-4 rounded-2xl relative', `bg-gradient-to-br ${color}`)}>
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/20 to-transparent" />
              <Icon className="w-10 h-10 text-white relative z-10" />
            </div>
          </motion.div>

          <h3 className="text-2xl font-black text-white mb-4">{title}</h3>
          <p className="text-gray-300 leading-relaxed">{description}</p>
        </div>

        {/* Corner accents */}
        <div className="absolute top-0 right-0 w-20 h-20 border-t-2 border-r-2 border-cyan-500/50 rounded-tr-3xl" />
        <div className="absolute bottom-0 left-0 w-20 h-20 border-b-2 border-l-2 border-sky-500/50 rounded-bl-3xl" />
      </motion.div>
    </motion.div>
  );
};

// Cosmic Pricing Card with 3D effect (Cold colors)
const CosmicPricingCard = ({ plan }: { plan: Plan }) => {
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    setRotateY((x - centerX) / 15);
    setRotateX((centerY - y) / 15);
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative perspective-1000"
      style={{
        transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
        transition: 'transform 0.1s ease-out',
      }}
    >
      <div
        className={cn(
          'relative p-8 rounded-3xl backdrop-blur-2xl border-2 overflow-hidden preserve-3d',
          plan.isPopular
            ? 'border-cyan-500/40 bg-gradient-to-br from-blue-900/40 via-cyan-900/30 to-indigo-900/40'
            : 'border-white/10 bg-gradient-to-br from-white/5 via-white/[0.02] to-transparent'
        )}
      >
        {/* Animated particles in background */}
        {plan.isPopular && (
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-white rounded-full"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
                animate={{
                  y: [0, -20, 0],
                  opacity: [0.2, 1, 0.2],
                  scale: [1, 1.5, 1],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  delay: i * 0.2,
                }}
              />
            ))}
          </div>
        )}

        {plan.isPopular && (
          <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
            <div className={cn('px-6 py-2 rounded-full text-white text-sm font-black shadow-2xl border border-white/20', `bg-gradient-to-r ${coldGradMain}`, coldGlowShadow)}>
              <span className="relative z-10 flex items-center gap-2">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                الأكثر اختياراً
              </span>
            </div>
          </motion.div>
        )}

        <div className="relative z-10" style={{ transform: 'translateZ(30px)' }}>
          <h3 className={cn('text-3xl font-black mb-6 bg-gradient-to-l bg-clip-text text-transparent', coldGradText)}>{plan.nameAr || plan.name}</h3>

          <div className="mb-8">
            {Number(plan.price) === 0 ? (
              <div className="flex items-center justify-end gap-3">
                <span className={cn('text-6xl font-black bg-gradient-to-l bg-clip-text text-transparent', coldGradText)}>مجاناً</span>
                <motion.div animate={{ rotate: 360, scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity }}>
                  <Sparkles className="w-12 h-12 text-cyan-400" />
                </motion.div>
              </div>
            ) : (
              <div className="flex items-baseline gap-2 flex-row-reverse justify-end">
                <span className="text-sm text-gray-400">/{plan.billingCycle === 'MONTHLY' ? 'شهر' : 'سنة'}</span>
                <span className="text-gray-400 text-xl">{plan.currency}</span>
                <span className={cn('text-7xl font-black bg-gradient-to-l bg-clip-text text-transparent', coldGradText)}>{plan.price}</span>
              </div>
            )}
          </div>

          <div className="space-y-4 mb-10">
            {(plan.featuresAr?.length > 0 ? plan.featuresAr : plan.features)?.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex items-start gap-3 group"
              >
                <div className="shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-sky-500/25 to-cyan-500/25 flex items-center justify-center border border-cyan-400/30 group-hover:scale-110 transition-transform">
                  <Check className="h-4 w-4 text-cyan-300" />
                </div>
                <span className="text-gray-300 text-lg">{feature}</span>
              </motion.div>
            ))}
          </div>

          <motion.button
            onClick={() => window.open('/register', '_blank')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={cn(
              'w-full py-5 rounded-2xl font-black text-xl transition-all duration-300 relative overflow-hidden group',
              plan.isPopular
                ? cn(`bg-gradient-to-r ${coldGradMain} text-white shadow-2xl`, coldGlowShadow)
                : 'bg-white/10 text-white border-2 border-white/20 hover:bg-white/20'
            )}
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              {Number(plan.price) === 0 ? 'ابدأ مجاناً' : 'انطلق الآن'}
              <Rocket className="w-5 h-5" />
            </span>
            {plan.isPopular && (
              <motion.div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent" animate={{ x: ['-200%', '200%'] }} transition={{ duration: 3, repeat: Infinity }} />
            )}
          </motion.button>
        </div>

        {/* 3D depth layers */}
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/5 to-transparent pointer-events-none" style={{ transform: 'translateZ(10px)' }} />
      </div>
    </motion.div>
  );
};
// Tabs Showcase Component (Cold colors)
const TabsShowcase = () => {
    const [active, setActive] = useState(0);
    const tabs = [
        { name: "المتاجر", icon: Store },
        { name: "المنتجات", icon: Package },
        { name: "التحليلات", icon: BarChart3 }
    ];

    const content = [
        {
            title: "إدارة مركزية للمتاجر",
            desc: "تحكم في هوية، إعدادات، ونطاقات متاجرك من لوحة واحدة.",
            stats: [
                { label: "وقت الإعداد", val: "2 دقيقة" },
                { label: "التوفر", val: "99.9%" }
            ]
        },
        {
            title: "مخزون ذكي ومتزامن",
            desc: "تتبع منتجاتك، كمياتك، وتزامنها عبر جميع قنوات البيع لحظياً.",
            stats: [
                { label: "تزامن", val: "فوري" },
                { label: "المنتجات", val: "لا محدود" }
            ]
        },
        {
            title: "رؤى لاتخاذ القرار",
            desc: "تقارير مالية، تحليل سلوك العملاء، ومؤشرات أداء متقدمة.",
            stats: [
                { label: "دقة البيانات", val: "100%" },
                { label: "التحديث", val: "مباشر" }
            ]
        }
    ];

    return (
        <div className="w-full max-w-4xl mx-auto mt-12 mb-16 relative z-20 text-right" dir="rtl">
            <div className="relative bg-black/40 backdrop-blur-2xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl shadow-cyan-900/20">
                {/* Tabs Header */}
                <div className="flex border-b border-white/10">
                    {tabs.map((tab, i) => (
                        <button
                            key={i}
                            onClick={() => setActive(i)}
                            className={cn(
                                "flex-1 flex items-center justify-center gap-2 py-5 text-sm md:text-base font-bold transition-all relative outline-none",
                                active === i ? "text-cyan-300 bg-white/5" : "text-gray-400 hover:text-white hover:bg-white/5"
                            )}
                        >
                            <tab.icon className={cn("w-4 h-4 md:w-5 md:h-5", active === i ? "text-cyan-300" : "text-gray-500")} />
                            {tab.name}
                            {active === i && (
                                <motion.div
                                    layoutId="activeTabIndicator"
                                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)]"
                                />
                            )}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="p-8 md:p-12 min-h-[350px] flex items-center relative overflow-hidden">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={active}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                            className="w-full grid md:grid-cols-2 gap-12 items-center"
                        >
                            <div className="space-y-6">
                                <h3 className="text-2xl md:text-3xl font-black text-white">{content[active].title}</h3>
                                <p className="text-gray-300 leading-relaxed text-lg">{content[active].desc}</p>
                                <div className="flex gap-8 pt-4 border-t border-white/10 mt-6">
                                     {content[active].stats.map((stat, idx) => (
                                         <div key={idx}>
                                             <div className="text-cyan-400 font-bold text-2xl mb-1">{stat.val}</div>
                                             <div className="text-gray-500 text-sm font-medium">{stat.label}</div>
                                         </div>
                                     ))}
                                </div>
                            </div>
                            {/* Graphic Placeholder */}
                            <div className="relative h-56 rounded-2xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-white/10 flex items-center justify-center overflow-hidden group">
                                <div className="absolute inset-0 bg-grid-white/[0.05]" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                
                                <motion.div 
                                    animate={{ rotate: 360 }} 
                                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                                    className="text-white/10"
                                >
                                    <Orbit className="w-32 h-32" />
                                </motion.div>
                                
                                <div className="absolute bottom-4 right-4 left-4 p-4 bg-black/40 backdrop-blur-md rounded-xl border border-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400">
                                            <Sparkles className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <div className="text-white font-bold text-sm">ميزة ذكية</div>
                                            <div className="text-gray-400 text-xs">تعمل بالذكاء الاصطناعي</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};
export default function KounLanding() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showSplash, setShowSplash] = useState(false);
  const navigate = useNavigate();
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    document.title = 'كون - Koun | عالم التجارة متعدد الأبعاد';
    document.documentElement.classList.add('dark');
    localStorage.setItem('darkMode', 'true');
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      const defPlans: Plan[] = [
        {
          id: 'free',
          code: 'FREE',
          name: 'النجم',
          nameAr: 'النجم',
          description: '',
          descriptionAr: '',
          price: '0',
          currency: '$',
          billingCycle: 'monthly',
          features: ['متجر واحد', '50 منتج', 'نطاق فرعي', 'تحليلات أساسية', 'دعم المجتمع'],
          featuresAr: ['متجر واحد', '50 منتج', 'نطاق فرعي', 'تحليلات أساسية', 'دعم المجتمع'],
          limits: { products: 50, orders: 100, storage: 1, staff: 1, customDomains: 0 },
          isPopular: false,
          sortOrder: 1,
        },
        {
          id: 'pro',
          code: 'PRO',
          name: 'المجرة',
          nameAr: 'المجرة',
          description: '',
          descriptionAr: '',
          price: '99',
          currency: '$',
          billingCycle: 'monthly',
          features: ['5 متاجر متزامنة', 'منتجات غير محدودة', 'نطاقات مخصصة', 'AI متقدم', 'ربط ذكي بين المتاجر', 'دعم أولوية 24/7'],
          featuresAr: ['5 متاجر متزامنة', 'منتجات غير محدودة', 'نطاقات مخصصة', 'AI متقدم', 'ربط ذكي بين المتاجر', 'دعم أولوية 24/7'],
          limits: { products: 1000000, orders: 1000000, storage: 100, staff: 10, customDomains: 5 },
          isPopular: true,
          sortOrder: 2,
        },
        {
          id: 'enterprise',
          code: 'ENTERPRISE',
          name: 'الكون',
          nameAr: 'الكون',
          description: '',
          descriptionAr: '',
          price: '299',
          currency: '$',
          billingCycle: 'monthly',
          features: ['متاجر غير محدودة', 'إدارة مركزية موحدة', 'API كامل', 'White Label', 'مدير حساب مخصص', 'تخصيص كامل', 'SLA 99.99%'],
          featuresAr: ['متاجر غير محدودة', 'إدارة مركزية موحدة', 'API كامل', 'White Label', 'مدير حساب مخصص', 'تخصيص كامل', 'SLA 99.99%'],
          limits: { products: 1000000, orders: 1000000, storage: 1000, staff: 100, customDomains: 100 },
          isPopular: false,
          sortOrder: 3,
        },
      ];
      const defStats: PlatformStats = { stores: '25,000+', orders: '2.5M+', products: '5M+', uptime: '99.99%', support: '24/7' };
      const defTest: Testimonial[] = [
        {
          id: '1',
          name: 'أحمد الشمري',
          nameEn: '',
          role: 'مدير 12 متجر إلكتروني',
          roleEn: '',
          content: 'كون سمحت لي بإدارة جميع متاجري من مكان واحد. وفرت علي 80% من الوقت والجهد!',
          contentEn: '',
          rating: 5,
        },
        {
          id: '2',
          name: 'نورة العتيبي',
          nameEn: '',
          role: 'مؤسسة شبكة متاجر',
          roleEn: '',
          content: 'الربط الذكي بين المتاجر والذكاء الاصطناعي غيّر قواعد اللعبة تماماً. مبيعاتي تضاعفت 3 مرات!',
          contentEn: '',
          rating: 5,
        },
        {
          id: '3',
          name: 'خالد المطيري',
          nameEn: '',
          role: 'رائد أعمال رقمي',
          roleEn: '',
          content: 'التصميم الفضائي والتجربة الفريدة جعلت منصتي تبرز بين المنافسين. عملائي مبهورون!',
          contentEn: '',
          rating: 5,
        },
      ];

      try {
        const [plData, sData, tData] = await Promise.all([
          publicService.getPlans().catch(() => []),
          publicService.getStats().catch(() => null),
          publicService.getTestimonials(10).catch(() => []),
        ]);
        setPlans(plData.length > 0 ? plData : defPlans);
        setStats(sData || defStats);
        setTestimonials(tData.length > 0 ? tData : defTest);
      } catch {
        setPlans(defPlans);
        setStats(defStats);
        setTestimonials(defTest);
      }
    };
    fetchData();
  }, []);

  const displayStats = stats || { stores: '25,000+', orders: '2.5M+', uptime: '99.99%', support: '24/7' };

  const multitenantFeatures = [
    {
      icon: Layers,
      title: 'إدارة متعددة المتاجر',
      description: 'أدِر عشرات المتاجر من لوحة تحكم واحدة قوية. كل متجر بهويته المستقلة ولكن تحت سيطرتك الكاملة.',
      color: 'from-blue-600 to-cyan-600',
    },
    {
      icon: Network,
      title: 'ربط ذكي بالـ AI',
      description: 'اربط متاجرك بذكاء - شارك المنتجات، العملاء، والمخزون بينها تلقائياً مع توصيات AI ذكية.',
      color: 'from-indigo-600 to-sky-600',
    },
    {
      icon: Cpu,
      title: 'تحليلات موحدة',
      description: 'احصل على رؤية شاملة لأداء جميع متاجرك مع تحليلات AI متقدمة وتقارير مفصلة في الوقت الفعلي.',
      color: 'from-cyan-600 to-blue-600',
    },
    {
      icon: Users,
      title: 'فِرَق متعددة',
      description: 'وزّع الأدوار والصلاحيات على فرق مختلفة لكل متجر مع تحكم دقيق في الوصول والإدارة.',
      color: 'from-sky-600 to-indigo-600',
    },
  ];

  return (
    <div dir="rtl" className="min-h-screen bg-black text-white overflow-x-hidden relative">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@200;300;400;500;700;800;900&display=swap');
        * { font-family: 'Tajawal', sans-serif; }

        .perspective-1000 { perspective: 1000px; }
        .preserve-3d { transform-style: preserve-3d; }

        @keyframes shimmer {
          0% { background-position: -1000px 0; }
          100% { background-position: 1000px 0; }
        }

        .animate-shimmer {
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.10), transparent);
          background-size: 1000px 100%;
          animation: shimmer 3s infinite;
        }
      `}</style>

      {/* 3D Particle Background */}
      <SpaceParticles />

      {/* Gradient orbs (Cold) */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-cyan-600/25 blur-[100px]"
          animate={{ scale: [1, 1.2, 1], opacity: [0.25, 0.45, 0.25] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-blue-600/25 blur-[100px]"
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.45, 0.25, 0.45] }}
          transition={{ duration: 10, repeat: Infinity }}
        />
      </div>

      {showSplash && <SplashScreen onFinish={() => { setShowSplash(false); navigate('/login'); }} />}

      {/* Progress Bar (Cold) */}
      <motion.div
        className={cn(
          'fixed top-0 left-0 right-0 h-1 z-[100] origin-right',
          `bg-gradient-to-r ${coldGradMain}`,
          'shadow-2xl shadow-cyan-500/30'
        )}
        style={{ scaleX }}
      />

      {/* Navigation */}
      <nav
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-500',
          isScrolled ? 'bg-black/90 backdrop-blur-2xl border-b border-white/10 shadow-2xl' : 'bg-transparent'
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <Link to="/" className="flex items-center gap-3 group">
              <motion.div whileHover={{ scale: 1.05 }} transition={{ duration: 0.3 }} className="relative">
                <img
                  src={getLogoUrl()}
                  alt="كون"
                  className="h-14 w-auto object-contain"
                />
              </motion.div>
              <div className="flex flex-col">
                <span className={cn('text-2xl font-black bg-gradient-to-l bg-clip-text text-transparent', coldGradText)}>كون</span>
                <span className="text-xs text-gray-400 font-bold">عالم التجارة متعدد الأبعاد</span>
              </div>
            </Link>

            <div className="hidden md:flex items-center gap-8">
              {[
                { label: 'المتاجر المتعددة', href: '#multitenant' },
                { label: 'المميزات', href: '#features' },
                { label: 'الأسعار', href: '#pricing' },
              ].map((item) => (
                <a key={item.href} href={item.href} className="text-sm font-bold text-gray-300 hover:text-white transition-colors relative group">
                  {item.label}
                  <span className="absolute -bottom-1 left-0 w-0 h-1 bg-gradient-to-r from-sky-500 to-cyan-500 rounded-full group-hover:w-full transition-all duration-300" />
                </a>
              ))}
            </div>

            <div className="flex items-center gap-4">
              <Link to="/login" target="_blank" className="hidden sm:block text-sm font-bold text-gray-300 hover:text-white transition-colors">
                تسجيل الدخول
              </Link>
              <Link
                to="/register"
                target="_blank"
                className={cn(
                  'hidden sm:flex items-center gap-2 px-6 py-3 rounded-xl font-black text-sm text-white shadow-2xl hover:scale-105 transition-all relative overflow-hidden group',
                  `bg-gradient-to-r ${coldGradMain}`,
                  'shadow-cyan-500/30 hover:shadow-cyan-500/50'
                )}
              >
                <span className="relative z-10">انطلق للفضاء</span>
                <Rocket className="w-4 h-4 relative z-10 group-hover:rotate-45 transition-transform" />
                <div className="absolute inset-0 animate-shimmer" />
              </Link>
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 text-gray-300 hover:text-white">
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
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-0 right-0 z-40 bg-black/95 backdrop-blur-2xl border-b border-white/10 md:hidden"
          >
            <div className="p-6 space-y-4">
              {[
                { label: 'المتاجر المتعددة', href: '#multitenant' },
                { label: 'المميزات', href: '#features' },
                { label: 'الأسعار', href: '#pricing' },
              ].map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-lg font-bold py-3 text-gray-300 hover:text-white transition-colors"
                >
                  {item.label}
                </a>
              ))}
              <div className="pt-4 border-t border-white/10 space-y-3">
                <Link
                  to="/login"
                  target="_blank"
                  className="block w-full text-center py-3 rounded-xl bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 transition-all"
                >
                  تسجيل الدخول
                </Link>
                <Link
                  to="/register"
                  target="_blank"
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn('block w-full text-center py-3 rounded-xl text-white font-black hover:scale-105 transition-all', `bg-gradient-to-r ${coldGradMain}`)}
                >
                  انطلق للفضاء
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="relative z-10">
        {/* Hero Section */}
        <section className="relative min-h-screen flex items-center justify-center pt-32 pb-20 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }} className="text-right space-y-8">
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ duration: 0.6, type: 'spring' }}
                  className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-gradient-to-r from-blue-900/40 via-cyan-900/30 to-indigo-900/40 border border-cyan-500/25 backdrop-blur-xl"
                >
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}>
                    <Orbit className="w-5 h-5 text-cyan-300" />
                  </motion.div>
                  <span className={cn('text-sm font-black bg-gradient-to-l bg-clip-text text-transparent', coldGradText)}>
                    منصة التجارة الإلكترونية متعددة المتاجر الأولى في المنطقة
                  </span>
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black leading-tight"
                >
                  <span className="block mb-4 text-white">ابنِ</span>
                  <span className={cn('block mb-4 bg-gradient-to-l bg-clip-text text-transparent', coldGradText)}>متجرك</span>
                  <span className="block text-white">الإلكتروني</span>
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                  className="text-xl md:text-2xl text-gray-300 leading-relaxed max-w-xl"
                >
                  في <span className="font-black text-cyan-300">كون</span>، كل متجر هو نجم في مجرتك التجارية. أدِر عشرات المتاجر من مركز تحكم واحد، بسرعة الضوء وبساطة مذهلة.
                </motion.p>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.6 }} className="flex flex-col sm:flex-row items-center justify-end gap-4">
                  <Link to="/register" target="_blank" className="group relative px-10 py-5 rounded-2xl font-black text-xl text-white overflow-hidden shadow-2xl">
                    <div className={cn('absolute inset-0', `bg-gradient-to-r ${coldGradMain}`)} />
                    <div className={cn('absolute inset-0 opacity-0 group-hover:opacity-100 blur-2xl transition-opacity', `bg-gradient-to-r ${coldGradMain}`)} />
                    <div className="absolute inset-0 animate-shimmer" />
                    <span className="relative z-10 flex items-center gap-3">
                      ابدأ رحلتك المجانية
                      <motion.div animate={{ x: [0, 5, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
                        <Rocket className="w-6 h-6" />
                      </motion.div>
                    </span>
                  </Link>
                </motion.div>

                {/* Stats */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.8 }} className="flex items-center justify-end gap-8 pt-8">
                  {[
                    { value: displayStats.stores, label: 'متجر نشط' },
                    { value: displayStats.orders, label: 'معاملة' },
                    { value: displayStats.uptime, label: 'جاهزية' },
                  ].map((stat, i) => (
                    <motion.div key={i} className="text-center" whileHover={{ scale: 1.1 }}>
                      <div className={cn('text-4xl font-black bg-gradient-to-l bg-clip-text text-transparent mb-1', coldGradText)}>{stat.value}</div>
                      <div className="text-xs text-gray-400 font-bold">{stat.label}</div>
                    </motion.div>
                  ))}
                </motion.div>
              </motion.div>

              {/* 3D Dashboard Preview */}
              <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1, delay: 0.3 }} className="relative">
                <div className="relative">
                  {/* Glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/35 via-sky-500/35 to-indigo-500/35 blur-3xl rounded-3xl animate-pulse" />

                  {/* Laptop */}
                  <motion.div
                    className="relative z-10"
                    whileHover={{ rotateY: 5, rotateX: 5, scale: 1.02 }}
                    transition={{ duration: 0.3 }}
                    style={{ transformStyle: 'preserve-3d' }}
                  >
                    <LaptopFrame>
                      <StaticDashboardPreview isDark={true} />
                    </LaptopFrame>
                  </motion.div>

                  {/* Phone */}
                  <motion.div
                    initial={{ y: 50, x: -20, opacity: 0 }}
                    animate={{ y: 0, x: 0, opacity: 1 }}
                    transition={{ delay: 0.8, duration: 0.8 }}
                    className="absolute -bottom-10 -right-10 z-20"
                    whileHover={{ scale: 1.1, rotateZ: 0 }}
                    style={{ rotateZ: -5 }}
                  >
                    <PhoneFrame>
                      <StaticDashboardPreview mobile isDark={true} />
                    </PhoneFrame>
                  </motion.div>

                  {/* Floating cosmic elements */}
                  <motion.div
                    className={cn('absolute -top-10 -right-10 w-24 h-24 rounded-3xl flex items-center justify-center shadow-2xl', `bg-gradient-to-br ${coldGradMain}`, 'shadow-cyan-500/35')}
                    animate={{ y: [0, -20, 0], rotate: [0, 180, 360], scale: [1, 1.1, 1] }}
                    transition={{ duration: 6, repeat: Infinity }}
                  >
                    <Sparkles className="w-12 h-12 text-white" />
                  </motion.div>

                  <motion.div
                    className="absolute -bottom-5 -left-5 w-20 h-20 rounded-2xl bg-gradient-to-br from-sky-500 to-cyan-500 flex items-center justify-center shadow-2xl shadow-sky-500/35"
                    animate={{ y: [0, 20, 0], rotate: [0, -180, -360], scale: [1, 1.1, 1] }}
                    transition={{ duration: 7, repeat: Infinity }}
                  >
                    <Zap className="w-10 h-10 text-white" />
                  </motion.div>
                </div>

                {/* Welcome Animation */}
                <div className="mt-16 sm:mt-24 relative z-30">
                  <WelcomeSaudiLottie
                    // We use the built-in SVG Saudi Character by default.
                    // If you want to use a specific Lottie JSON in the future, uncomment and set the URL below:
                    // animationUrl="/assets/saudi-man.json"
                    title="مرحباً بك في كون"
                    subtitle="منصة المتاجر المتعددة… جاهز تبدأ؟"
                  />
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Interactive Multi-Store Hub Section */}
        <section id="multitenant" className="relative py-32 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-cyan-900/10 via-transparent to-indigo-900/10" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-20">
              <motion.div
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-gradient-to-r from-blue-900/30 via-cyan-900/25 to-indigo-900/30 border border-cyan-500/25 backdrop-blur-xl mb-6"
              >
                <Network className="w-5 h-5 text-cyan-300" />
                <span className="text-sm font-black text-cyan-300">Multi-Tenant Architecture</span>
              </motion.div>

              <h2 className="text-5xl md:text-7xl font-black mb-8">
                <span className={cn('bg-gradient-to-l bg-clip-text text-transparent', coldGradText)}>كون واحد</span>
                <br />
                <span className="text-white">متاجر لا نهائية</span>
              </h2>

              <p className="text-xl md:text-2xl text-gray-300 max-w-4xl mx-auto leading-relaxed mb-4">تخيّل أنك تدير مجرة كاملة من المتاجر الإلكترونية من مركز تحكم واحد.</p>
              <p className="text-lg text-gray-400 max-w-3xl mx-auto">كل متجر بهويته المستقلة، منتجاته الخاصة، وعملائه الفريدين - ولكن جميعها مترابطة بذكاء في نظام موحد.</p>
            </motion.div>

            {/* Interactive Hub Visualization */}
            <motion.div initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} className="mb-24">
              <MultiStoreHub />
            </motion.div>

            {/* Feature Cards */}
            <div className="grid md:grid-cols-2 gap-8">
              {multitenantFeatures.map((feature, index) => (
                <HolographicCard key={index} icon={feature.icon} title={feature.title} description={feature.description} color={feature.color} delay={index * 0.2} />
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="relative py-32 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-20">
              <span className="text-cyan-300 font-black text-sm tracking-wider mb-4 block">اختر مدارك في الكون</span>
              <h2 className="text-5xl md:text-7xl font-black mb-6 text-white">
                باقات <span className={cn('bg-gradient-to-l bg-clip-text text-transparent', coldGradText)}>كونية</span>
              </h2>
              <p className="text-xl text-gray-300 max-w-2xl mx-auto">من نجم واحد إلى كون كامل - لدينا الباقة المثالية لطموحك التجاري</p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">{plans.map((plan) => <CosmicPricingCard key={plan.id} plan={plan} />)}</div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="relative py-32 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-20">
              <h2 className="text-5xl md:text-6xl font-black mb-6 text-white">
                قصص <span className={cn('bg-gradient-to-l bg-clip-text text-transparent', coldGradText)}>نجاح</span> كونية
              </h2>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <motion.div
                  key={testimonial.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.2 }}
                  whileHover={{ scale: 1.05, rotateY: 5 }}
                  className="relative p-8 rounded-3xl bg-gradient-to-br from-white/5 via-white/[0.02] to-transparent border border-white/10 backdrop-blur-xl overflow-hidden group"
                  style={{ transformStyle: 'preserve-3d' }}
                >
                  {/* Holographic scan */}
                  <motion.div
                    className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-0 group-hover:opacity-100"
                    animate={{ top: ['0%', '100%'] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />

                  <div className="flex gap-1 mb-6 justify-center">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>

                  <p className="text-gray-300 leading-relaxed mb-6 text-center text-lg italic">"{testimonial.content}"</p>

                  <div className="flex flex-col items-center">
                    <div className={cn('w-20 h-20 rounded-full flex items-center justify-center text-white font-black text-2xl mb-3 shadow-lg', `bg-gradient-to-br ${coldGradMain}`, 'shadow-cyan-500/35')}>
                      {testimonial.name.charAt(0)}
                    </div>
                    <p className="font-black text-white text-lg">{testimonial.name}</p>
                    <p className="text-sm text-gray-400">{testimonial.role}</p>
                  </div>

                  {/* Corner accent */}
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-cyan-500/15 to-transparent rounded-bl-full" />
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-sky-500/15 to-transparent rounded-tr-full" />
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="relative py-32 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-900/20 via-cyan-900/20 to-indigo-900/20" />

          <div className="max-w-5xl mx-auto px-4 text-center relative z-10">
            <motion.div initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}>
              <motion.div animate={{ rotate: 360, scale: [1, 1.2, 1] }} transition={{ duration: 20, repeat: Infinity, ease: 'linear' }} className="inline-block mb-8">
                <Orbit className="w-24 h-24 text-cyan-300" />
              </motion.div>

              <h2 className="text-6xl md:text-8xl font-black mb-8">
                <span className="text-white">جاهز لفتح</span>
                <br />
                <span className={cn('bg-gradient-to-l bg-clip-text text-transparent', coldGradText)}>بوابة الكون؟</span>
              </h2>

              <p className="text-2xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
                انضم إلى آلاف رواد الأعمال الذين اختاروا كون لبناء إمبراطورياتهم التجارية. ابدأ رحلتك اليوم واكتشف إمكانيات لا محدودة.
              </p>


              <TabsShowcase />

              <Link
                to="/register"
                target="_blank"
                className={cn(
                  'inline-flex items-center gap-4 px-16 py-6 rounded-2xl font-black text-2xl text-white shadow-2xl hover:scale-110 transition-all relative overflow-hidden group',
                  `bg-gradient-to-r ${coldGradMain}`,
                  'shadow-cyan-500/35 hover:shadow-cyan-500/55'
                )}
              >
                <span className="relative z-10">انطلق الآن مجاناً</span>
                <motion.div animate={{ rotate: [0, 360] }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }} className="relative z-10">
                  <Rocket className="w-8 h-8" />
                </motion.div>
                <div className="absolute inset-0 animate-shimmer" />
              </Link>
            </motion.div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative border-t border-white/10 py-20 backdrop-blur-xl bg-black/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div className="col-span-2">
              <Link to="/" className="flex items-center gap-3 mb-6">
                <div className="relative">
                  <img src={getLogoUrl()} alt="كون" className="h-14 w-auto object-contain" />
                </div>
                <div>
                  <span className={cn('text-3xl font-black bg-gradient-to-l bg-clip-text text-transparent', coldGradText)}>كون</span>
                  <p className="text-xs text-gray-400 font-bold">عالم التجارة متعدد الأبعاد</p>
                </div>
              </Link>
              <p className="text-gray-400 leading-relaxed max-w-md text-lg">
                منصة التجارة الإلكترونية متعددة المتاجر الأكثر تطوراً وإبداعاً في المنطقة. نمكّن رواد الأعمال من بناء إمبراطوريات تجارية رقمية بسهولة فائقة وسرعة الضوء.
              </p>
            </div>

            <div>
              <h4 className="font-black mb-6 text-white text-xl">روابط سريعة</h4>
              <ul className="space-y-3 text-gray-400">
                <li>
                  <a href="#multitenant" className="hover:text-cyan-300 transition-colors text-lg">
                    المتاجر المتعددة
                  </a>
                </li>
                <li>
                  <a href="#features" className="hover:text-cyan-300 transition-colors text-lg">
                    المميزات
                  </a>
                </li>
                <li>
                  <a href="#pricing" className="hover:text-cyan-300 transition-colors text-lg">
                    الأسعار
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-black mb-6 text-white text-xl">الشركة</h4>
              <ul className="space-y-3 text-gray-400">
                <li>
                  <Link to="/about" className="hover:text-cyan-300 transition-colors text-lg">
                    من نحن
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="hover:text-cyan-300 transition-colors text-lg">
                    تواصل معنا
                  </Link>
                </li>
                <li>
                  <Link to="/privacy" className="hover:text-cyan-300 transition-colors text-lg">
                    الخصوصية
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-400">© 2025 كون - Koun. جميع الحقوق محفوظة في هذا الكون وما بعده.</p>
            <VersionFooter />
          </div>
        </div>
      </footer>

      <ThemeCustomizer />
      <AIChatHelper context={{ currentPage: 'landing' }} />
    </div>
  );
}
