import { useEffect, useState } from 'react';
import { 
  ArrowRight, Shield, Users, CreditCard, 
  Globe, Lock, CheckCircle2, Zap, Headphones, 
  Smartphone, Gamepad2, ShoppingBag, Tv, Gift, 
  Building2, Award, Star, Sparkles, Search,
  BadgeCheck, Loader2, FolderOpen
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { productService, coreApi } from '@/lib/api';
import type { Category, Product, SiteSettings, SiteConfig } from '@/services/types';
import { useStoreSettings } from '@/contexts/StoreSettingsContext';
import { formatCurrency } from '@/lib/currency-utils';

interface PublicStats {
  products: number;
  categories: number;
  brands: number;
}

export function DigitalCardsLanding() {
  const navigate = useNavigate();
  const { settings } = useStoreSettings();
  const [isVisible, setIsVisible] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [counts, setCounts] = useState({ products: 0, categories: 0, brands: 0 });
  const [featuredProduct, setFeaturedProduct] = useState<Product | null>(null);
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Slider Demo State
  const [sliderConfig, setSliderConfig] = useState({
    min: 10,
    max: 1000,
    step: 10,
    pricePerUnit: 0.15,
    unitName: 'Coin'
  });
  const [testValue, setTestValue] = useState(10);
  const [isTestVisible, setIsTestVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    
    window.addEventListener('scroll', handleScroll);
    
    const fetchData = async () => {
      try {
        const [catsResponse, prodsResponse, configResponse, countsResponse] = await Promise.all([
          productService.getCategories({ limit: 8 }),
          productService.getProducts({ limit: 1 }),
          coreApi.get<SiteConfig>('/site-config'),
          coreApi.get<PublicStats>('/stats/public').catch(() => ({ products: 0, categories: 0, brands: 0 }))
        ]);

        if (configResponse?.settings) {
          setSiteSettings(configResponse.settings);
        }

        if (countsResponse) {
          setCounts({
            products: countsResponse.products || 0,
            categories: countsResponse.categories || 0,
            brands: countsResponse.brands || 0
          });
        }

        // Handle Categories
        let cats: Category[] = [];
        if (catsResponse && typeof catsResponse === 'object' && 'categories' in catsResponse) {
           cats = (catsResponse as { categories: Category[] }).categories;
        } else if (Array.isArray(catsResponse)) {
           cats = catsResponse as Category[];
        }
        setCategories(cats.slice(0, 8));

        // Handle Featured Product
        if (prodsResponse) {
          // Check if it has 'data' property (paginated)
          if (typeof prodsResponse === 'object' && 'data' in prodsResponse) {
             const data = (prodsResponse as { data: Product[] }).data;
             if (data.length > 0) setFeaturedProduct(data[0]);
          } else if (Array.isArray(prodsResponse)) {
             // Array response
             const prods = prodsResponse as Product[];
             if (prods.length > 0) setFeaturedProduct(prods[0]);
          }
        }
      } catch (error) {
        console.error('Failed to fetch storefront data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const features = [
    {
      icon: Zap,
      title: 'تسليم فوري',
      description: 'استلم بطاقتك في ثوانٍ معدودة',
      gradient: 'from-primary/80 to-primary',
      stat: '< 3 ثوان'
    },
    {
      icon: Shield,
      title: 'دفع آمن',
      description: 'معاملات مشفرة بأعلى معايير الأمان',
      gradient: 'from-secondary/80 to-secondary',
      stat: 'SSL 256-bit'
    },
    {
      icon: Headphones,
      title: 'دعم 24/7',
      description: 'فريق الدعم متاح على مدار الساعة',
      gradient: 'from-primary/60 to-secondary/60',
      stat: 'متاح دائماً'
    },
    {
      icon: BadgeCheck,
      title: 'ضمان الجودة',
      description: 'بطاقات أصلية 100% مع ضمان استرجاع',
      gradient: 'from-secondary to-primary',
      stat: 'مضمون'
    }
  ];

  const testimonials = [
    {
      name: 'أحمد محمد',
      rating: 5,
      text: 'خدمة ممتازة وسريعة جداً. استلمت البطاقة فوراً',
      date: '2024-01-28'
    },
    {
      name: 'فاطمة علي',
      rating: 5,
      text: 'أفضل موقع للبطاقات الرقمية. أسعار منافسة',
      date: '2024-01-25'
    },
    {
      name: 'محمد العنزي',
      rating: 4,
      text: 'تجربة رائعة ودعم فني محترف',
      date: '2024-01-20'
    }
  ];

  // Helper to get icon based on category name (fallback if no image)
  const getCategoryIcon = (name: string) => {
    if (name.toLowerCase().includes('game') || name.includes('لعبة')) return <Gamepad2 className="w-8 h-8" />;
    if (name.toLowerCase().includes('card') || name.includes('بطاقة')) return <CreditCard className="w-8 h-8" />;
    if (name.toLowerCase().includes('shop') || name.includes('تسوق')) return <ShoppingBag className="w-8 h-8" />;
    return <Gift className="w-8 h-8" />;
  };



  const getSignupSubtitle = () => {
    if (siteSettings?.customerRegistrationRequestEnabled) return "قدم طلبك الآن للانضمام إلى شبكة عملائنا";
    if (siteSettings?.businessModel === 'B2B') return "سجل شركتك الآن وتمتع بأسعار الجملة";
    return "سجل حساب جديد واحصل على خصم 10% على أول عملية شراء";
  };

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-primary text-white transition-all duration-500 pt-20 pb-40">
        {/* Animated Background Shapes */}
        <div className="absolute inset-0 pointer-events-none">
          <div 
            className="absolute top-20 right-20 w-72 h-72 bg-white/10 rounded-full blur-3xl opacity-50 animate-pulse"
            style={{ transform: `translateY(${scrollY * 0.2}px)` }}
          />
          <div 
            className="absolute bottom-20 left-20 w-96 h-96 bg-white/10 rounded-full blur-3xl opacity-50 animate-pulse animation-delay-2000"
            style={{ transform: `translateY(${scrollY * -0.15}px)` }}
          />
          {/* Subtle Dots Pattern */}
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
        </div>

        <div className="container relative z-10">
          <div className={cn(
            "max-w-4xl mx-auto text-center transition-all duration-1000",
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          )}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 mb-8 animate-bounce-slow">
              <Sparkles className="w-4 h-4 text-warning" />
              <span className="text-sm font-semibold">أفضل المنتجات بأفضل الأسعار</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold mb-8 leading-[1.2]">
              مرحباً بك في
              <span className="block mt-2">متجرنا الإلكتروني</span>
            </h1>

            <p className="text-xl md:text-2xl text-white/80 mb-12 max-w-2xl mx-auto leading-relaxed">
              اكتشف تشكيلة متنوعة من المنتجات عالية الجودة بأسعار منافسة
            </p>

            {/* Search Bar */}
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                if (searchQuery.trim()) {
                  navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
                } else {
                  navigate('/products');
                }
              }}
              className="bg-white/10 backdrop-blur-xl rounded-2xl p-2 border border-white/20 shadow-2xl mb-16 max-w-2xl mx-auto group focus-within:ring-4 focus-within:ring-white/10 transition-all"
            >
              <div className="flex gap-2">
                <Button 
                  type="submit"
                  size="lg" 
                  className="h-14 px-10 bg-white text-primary hover:bg-white/90 font-bold rounded-xl shadow-lg transition-transform hover:scale-105 active:scale-95 flex items-center gap-2"
                >
                  <Search className="w-5 h-5" />
                  اكتشف المزيد
                </Button>
                <div className="flex-1 relative">
                  <Input 
                    placeholder="ابحث عن بطاقة..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-14 text-white placeholder:text-white/60 border-0 focus-visible:ring-0 text-lg bg-transparent text-right pr-4"
                  />
                </div>
              </div>
            </form>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 md:gap-16 max-w-2xl mx-auto border-t border-white/10 pt-12 animate-fade-in animation-delay-500">
              <div className="text-center group cursor-default">
                <div className="text-4xl md:text-5xl font-black mb-2 transition-transform group-hover:scale-110">+{counts.brands}</div>
                <div className="flex items-center justify-center gap-2 text-white/60 text-sm font-bold uppercase tracking-wider">
                   <Building2 className="w-4 h-4" />
                   {counts.brands === 1 ? 'علامة تجارية' : 'علامة تجارية'}
                </div>
              </div>
              <div className="text-center group cursor-default">
                <div className="text-4xl md:text-5xl font-black mb-2 transition-transform group-hover:scale-110">+{counts.categories}</div>
                <div className="flex items-center justify-center gap-2 text-white/60 text-sm font-bold uppercase tracking-wider">
                   <FolderOpen className="w-4 h-4" />
                   {counts.categories === 1 ? 'تصنيف' : 'تصنيف'}
                </div>
              </div>
              <div className="text-center group cursor-default">
                <div className="text-4xl md:text-5xl font-black mb-2 transition-transform group-hover:scale-110">+{counts.products}</div>
                <div className="flex items-center justify-center gap-2 text-white/60 text-sm font-bold uppercase tracking-wider">
                   <ShoppingBag className="w-4 h-4" />
                   {counts.products === 1 ? 'منتج' : 'منتج'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Wave Divider */}
        <div className="absolute bottom-0 left-0 right-0 w-full overflow-hidden leading-[0]">
          <svg className="relative block w-[calc(100%+1.3px)] h-[80px]" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M0,0 C150,110 400,110 600,60 C800,10 1050,10 1200,120 L1200,120 L0,120 Z" className="fill-background"></path>
          </svg>
        </div>
      </section>

      {/* Hero Content Extra (Optional: for bigger screens or floating elements) */}
      <div className="container relative z-10 -mt-20">
        <div className="max-w-6xl mx-auto">
          <div className="relative hidden lg:block">
            <div 
              className="relative"
              style={{ transform: `translateY(${Math.sin(scrollY * 0.01) * 20}px)` }}
            >
                  {/* Glow Effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-accent to-secondary rounded-3xl blur-3xl opacity-30" />
                  
                  {/* Card */}
                  <Card className="relative bg-card border-2 border-white/10 shadow-2xl overflow-hidden">
                    <CardContent className="p-8">
                      {featuredProduct ? (
                        <>
                          <div className="flex items-center justify-between mb-6">
                            <Badge className="bg-accent/20 text-accent border-accent/30">
                              الأكثر مبيعاً
                            </Badge>
                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                              <Gamepad2 className="w-6 h-6" />
                            </div>
                          </div>
                          
                          <h3 className="text-2xl font-bold text-card-foreground mb-2 line-clamp-1">{featuredProduct.name}</h3>
                          <p className="text-muted-foreground mb-6 line-clamp-2">{featuredProduct.description || 'بطاقة رقمية فورية'}</p>
                          
                          <div className="flex items-baseline gap-2 mb-6">
                            <span className="text-4xl font-bold text-primary">
                              {formatCurrency(featuredProduct.price, settings?.currency || 'SAR')}
                            </span>
                          </div>
                        </>
                      ) : (
                         <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                            {isLoading ? <Loader2 className="w-8 h-8 animate-spin mb-2" /> : <p>لا توجد منتجات مميزة (Fallback)</p>}
                         </div>
                      )}

                      <Button 
                        className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground group"
                        onClick={() => navigate(featuredProduct ? `/products/${featuredProduct.id}` : '/products')}
                      >
                        {featuredProduct ? 'اشتري الآن' : 'تصفح المتجر'}
                        <ArrowRight className="mr-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                      </Button>

                      <div className="mt-6 pt-6 border-t border-border flex items-center justify-between text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Zap className="w-4 h-4 text-accent" />
                          <span>تسليم فوري</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4 text-primary" />
                          <span>ضمان 100%</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Floating Badges */}
                  <div className="absolute -top-4 -left-4 bg-secondary text-secondary-foreground px-4 py-2 rounded-xl shadow-lg font-bold animate-bounce hidden sm:block">
                    خصم حصري
                  </div>
                  <div className="absolute -bottom-4 -right-4 bg-accent text-accent-foreground px-4 py-2 rounded-xl shadow-lg font-bold hidden sm:block">
                    جديد
                  </div>
                </div>
              </div>
            </div>
          </div>

      <div className="container py-16 space-y-20">
        {/* Top Categories */}
        <section>
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              الفئات الأكثر طلباً
            </h2>
            <p className="text-xl text-muted-foreground">
              تصفح أشهر البطاقات الرقمية والأكثر مبيعاً
            </p>
          </div>

          {isLoading ? (
             <div className="flex justify-center p-12">
               <Loader2 className="w-8 h-8 animate-spin text-primary" />
             </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-4">
              {categories.map((category, index) => (
                <div
                  key={category.id || index}
                  className="group cursor-pointer"
                  onClick={() => navigate(`/categories/${category.id}`)}
                >
                  <div className="relative">
                    <div className={cn(
                      "aspect-square rounded-2xl bg-gradient-to-br from-primary/10 to-secondary/10 p-1 transition-all duration-300 group-hover:scale-110 group-hover:shadow-xl group-hover:from-primary group-hover:to-secondary",
                    )}>
                      <div className="w-full h-full bg-card rounded-xl flex items-center justify-center text-primary group-hover:text-primary-foreground group-hover:bg-transparent transition-colors">
                         {/* Use image if available, else icon */}
                         {category.image ? (
                           <img src={category.image} alt={category.name} className="w-full h-full object-cover rounded-xl" />
                         ) : (
                           <div className="scale-150">
                             {getCategoryIcon(category.name)}
                           </div>
                         )}
                      </div>
                    </div>
                  </div>
                  <p className="text-center mt-3 font-semibold text-sm group-hover:text-primary transition-colors">
                    {category.name}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Features */}
        <section className="bg-secondary/5 rounded-3xl p-12 relative overflow-hidden">
          {/* Background Decoration */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary/5 rounded-full blur-3xl" />
          
          <div className="relative">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
                لماذا نحن الأفضل؟
              </h2>
              <p className="text-xl text-muted-foreground">
                نقدم لك أفضل تجربة شراء للبطاقات الرقمية
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, index) => (
                <Card 
                  key={index}
                  className="group hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border-2 hover:border-primary/50 relative overflow-hidden bg-card"
                >
                  <div className={cn(
                    "absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-opacity",
                    feature.gradient
                  )} />
                  
                  <CardContent className="p-6 relative">
                    <div className={cn(
                      "w-14 h-14 rounded-2xl bg-gradient-to-br mb-4 flex items-center justify-center shadow-lg text-white",
                      feature.gradient
                    )}>
                      <feature.icon className="w-7 h-7" />
                    </div>
                    
                    <h3 className="text-xl font-bold mb-2 text-card-foreground">{feature.title}</h3>
                    <p className="text-sm mb-4 text-muted-foreground">
                      {feature.description}
                    </p>
                    
                    <Badge variant="secondary" className="font-mono text-xs">
                      {feature.stat}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section>
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4">خطوات بسيطة</Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
              كيف تشتري بطاقتك؟
            </h2>
            <p className="text-xl text-muted-foreground">
              ثلاث خطوات فقط وستحصل على بطاقتك
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                step: '01',
                icon: Search,
                title: 'اختر البطاقة',
                description: 'تصفح وابحث عن البطاقة المناسبة لك من بين مئات الخيارات',
                color: 'from-primary to-primary/60'
              },
              {
                step: '02',
                icon: CreditCard,
                title: 'أتمم الدفع',
                description: 'اختر طريقة الدفع المناسبة وأكمل عملية الشراء بأمان',
                color: 'from-secondary to-secondary/60'
              },
              {
                step: '03',
                icon: Gift,
                title: 'استلم البطاقة',
                description: 'احصل على كود البطاقة فوراً في رسالة نصية أو بريد إلكتروني',
                color: 'from-accent to-accent/60'
              }
            ].map((step, index) => (
              <div key={index} className="relative">
                {/* Connection Line */}
                {index < 2 && (
                  <div className="hidden md:block absolute top-20 left-full w-full h-0.5 bg-gradient-to-r from-muted to-muted/50 -z-10" />
                )}
                
                <Card className="text-center relative overflow-hidden group hover:shadow-xl transition-all duration-300 bg-card">
                  <CardContent className="p-8">
                    <div className="relative inline-block mb-6">
                      <div className={cn(
                        "absolute inset-0 bg-gradient-to-r rounded-full blur-xl opacity-50 group-hover:opacity-75 transition-opacity",
                        step.color
                      )} />
                      <div className={cn(
                        "relative w-20 h-20 rounded-full bg-gradient-to-r flex items-center justify-center text-white",
                        step.color
                      )}>
                        <step.icon className="w-10 h-10" />
                      </div>
                    </div>
                    
                    <div className="text-6xl font-bold text-muted/30 mb-4 select-none">
                      {step.step}
                    </div>
                    
                    <h3 className="text-2xl font-bold mb-3 text-card-foreground">{step.title}</h3>
                    <p className="leading-relaxed text-muted-foreground">
                      {step.description}
                    </p>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </section>

        {/* Testimonials */}
        <section className="bg-primary rounded-3xl p-12 text-primary-foreground relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 left-10 w-32 h-32 border-2 border-white rounded-full" />
            <div className="absolute bottom-10 right-10 w-40 h-40 border-2 border-white rounded-lg rotate-45" />
          </div>
          
          <div className="relative">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                آراء عملائنا
              </h2>
              <p className="text-xl text-primary-foreground/80">
                تجارب حقيقية من عملاء راضين
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {testimonials.map((testimonial, index) => (
                <Card key={index} className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20 transition-all text-white">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-1 mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="w-5 h-5 text-accent fill-accent" />
                      ))}
                    </div>
                    
                    <p className="mb-4 leading-relaxed opacity-90">
                      "{testimonial.text}"
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{testimonial.name}</p>
                        <p className="text-sm opacity-75">{testimonial.date}</p>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                        ✓
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="relative">
          <Card className="overflow-hidden border-2 border-primary/20 shadow-2xl">
            <CardContent className="p-0">
              <div className="grid lg:grid-cols-2">
                {/* Left Side */}
                <div className="p-12 flex flex-col justify-center bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
                  <Badge className="w-fit bg-white/20 text-white border-0 mb-6">
                    ابدأ الآن
                  </Badge>
                  
                  <h2 className="text-4xl md:text-5xl font-bold mb-4">
                    جاهز للبدء؟
                  </h2>
                  <p className="text-xl mb-8 opacity-90">
                    {getSignupSubtitle()}
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-4">

                    <Button 
                      size="lg"
                      variant="outline"
                      className="h-14 px-8 bg-transparent border-2 border-primary-foreground/50 text-primary-foreground hover:bg-primary-foreground/10 hover:border-primary-foreground"
                      onClick={() => navigate('/products')}
                    >
                      تصفح المنتجات
                    </Button>
                  </div>
                </div>

                {/* Right Side */}
                <div className="p-12 bg-secondary/10 flex items-center justify-center">
                  <div className="grid grid-cols-2 gap-4 max-w-md">
                    {[
                      { icon: Zap, label: 'تسليم فوري', value: '< 3s' },
                      { icon: Shield, label: 'دفع آمن', value: '100%' },
                      { icon: Users, label: 'عملاء', value: '+500K' },
                      { icon: Star, label: 'تقييم', value: '4.8/5' }
                    ].map((stat, index) => (
                      <div key={index} className="bg-card rounded-2xl p-6 text-center shadow-lg hover:shadow-xl transition-shadow">
                        <stat.icon className="w-8 h-8 mx-auto mb-3 text-primary" />
                        <div className="text-2xl font-bold text-card-foreground mb-1">
                          {stat.value}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {stat.label}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>


      </div>

      {/* Footer Trust Bar */}
      <div className="bg-muted/30 py-8 border-t border-border">
        <div className="container">
          <div className="flex flex-wrap justify-center items-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              <span>موثوق من +500,000 عميل</span>
            </div>
            <div className="hidden sm:block w-px h-6 bg-border" />
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-secondary" />
              <span>معتمد من أشهر المنصات</span>
            </div>
            <div className="hidden sm:block w-px h-6 bg-border" />
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-accent" />
              <span>معاملات مشفرة SSL</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}