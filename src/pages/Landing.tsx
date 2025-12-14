import { 
  ArrowRight, Store, Globe, Palette, TrendingUp, Shield, Zap, Check, 
  Star, Users, Package, BarChart3, Sparkles, Play, ChevronRight, ShoppingCart
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageToggle } from '@/components/LanguageToggle';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { coreApi } from '@/lib/api';
import { useTranslation } from 'react-i18next';
import { VersionFooter } from '@/components/common/VersionFooter';
import { getLogoUrl, BRAND_NAME_AR, BRAND_NAME_EN, BRAND_TAGLINE_AR } from '@/config/logo.config';

export default function Landing() {
  const navigate = useNavigate();
  const { isAuthenticated, loading } = useAuth();
  const [logoUrl, setLogoUrl] = useState<string>(getLogoUrl());
  const { t, i18n } = useTranslation();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, loading, navigate]);

  // Fetch site configuration to get logo
  useEffect(() => {
    const fetchSiteConfig = async () => {
      try {
        const config = await coreApi.get('/site-config');
        if (config?.settings?.storeLogoUrl) {
          setLogoUrl(config.settings.storeLogoUrl);
          const favicon = document.getElementById('favicon') as HTMLLinkElement;
          if (favicon) {
            favicon.href = config.settings.storeLogoUrl;
          }
        }
      } catch (error) {
        console.error('Failed to fetch site config:', error);
      }
    };
    
    fetchSiteConfig();
  }, []);

  const features = [
    {
      icon: Store,
      title: t('landing.features.items.store.title'),
      description: t('landing.features.items.store.description'),
      gradient: 'from-primary to-primary/70'
    },
    {
      icon: Globe,
      title: t('landing.features.items.domain.title'),
      description: t('landing.features.items.domain.description'),
      gradient: 'from-accent to-accent/70'
    },
    {
      icon: Palette,
      title: t('landing.features.items.design.title'),
      description: t('landing.features.items.design.description'),
      gradient: 'from-secondary to-secondary/70'
    },
    {
      icon: TrendingUp,
      title: t('landing.features.items.analytics.title'),
      description: t('landing.features.items.analytics.description'),
      gradient: 'from-success to-success/70'
    },
    {
      icon: Shield,
      title: t('landing.features.items.security.title'),
      description: t('landing.features.items.security.description'),
      gradient: 'from-primary to-accent'
    },
    {
      icon: Zap,
      title: t('landing.features.items.performance.title'),
      description: t('landing.features.items.performance.description'),
      gradient: 'from-warning to-secondary'
    }
  ];

  const stats = [
    { value: '10,000+', label: t('landing.stats.activeStores'), icon: Store },
    { value: '50,000+', label: t('landing.stats.productsSold'), icon: Package },
    { value: '99%', label: t('landing.stats.customerSatisfaction'), icon: Users },
    { value: '24/7', label: t('landing.stats.support'), icon: Shield }
  ];

  const plans = [
    {
      name: t('landing.pricing.plans.free.name'),
      price: '0',
      period: t('landing.pricing.period'),
      description: t('landing.pricing.plans.free.description'),
      features: [
        t('landing.pricing.plans.free.features.products'),
        t('landing.pricing.plans.free.features.subdomain'),
        t('landing.pricing.plans.free.features.templates'),
        t('landing.pricing.plans.free.features.support'),
        t('landing.pricing.plans.free.features.storage')
      ],
      cta: t('landing.pricing.plans.free.cta'),
      popular: false,
      highlighted: false
    },
    {
      name: t('landing.pricing.plans.pro.name'),
      price: '99',
      period: t('landing.pricing.period'),
      description: t('landing.pricing.plans.pro.description'),
      features: [
        t('landing.pricing.plans.pro.features.products'),
        t('landing.pricing.plans.pro.features.domain'),
        t('landing.pricing.plans.pro.features.templates'),
        t('landing.pricing.plans.pro.features.support'),
        t('landing.pricing.plans.pro.features.analytics'),
        t('landing.pricing.plans.pro.features.payments'),
        t('landing.pricing.plans.pro.features.storage'),
        t('landing.pricing.plans.pro.features.watermark')
      ],
      cta: t('landing.pricing.plans.pro.cta'),
      popular: true,
      highlighted: true
    },
    {
      name: t('landing.pricing.plans.enterprise.name'),
      price: t('landing.pricing.plans.enterprise.price'),
      period: '',
      description: t('landing.pricing.plans.enterprise.description'),
      features: [
        t('landing.pricing.plans.enterprise.features.proFeatures'),
        t('landing.pricing.plans.enterprise.features.multiStore'),
        t('landing.pricing.plans.enterprise.features.api'),
        t('landing.pricing.plans.enterprise.features.accountManager'),
        t('landing.pricing.plans.enterprise.features.training'),
        t('landing.pricing.plans.enterprise.features.sla'),
        t('landing.pricing.plans.enterprise.features.storage'),
        t('landing.pricing.plans.enterprise.features.development')
      ],
      cta: t('landing.pricing.plans.enterprise.cta'),
      popular: false,
      highlighted: false
    }
  ];

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Navigation */}
      <nav className="border-b bg-background/90 backdrop-blur-xl sticky top-0 z-50 shadow-sm">
        <div className="container flex h-20 items-center justify-between">
          <Link to="/" className="flex items-center gap-4 group">
            <div className="relative">
              <div className="absolute -inset-2 bg-gradient-to-r from-primary via-accent to-secondary rounded-2xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity" />
              <div className="relative w-20 h-20 rounded-2xl overflow-hidden bg-background shadow-lg border border-border/50">
                <img 
                  src={logoUrl} 
                  alt={`${BRAND_NAME_EN} - ${BRAND_NAME_AR}`} 
                  className="w-full h-full object-contain p-2" 
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const parent = e.currentTarget.parentElement;
                    if (parent) {
                      parent.innerHTML = '<div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary to-accent"><svg class="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg></div>';
                    }
                  }} 
                />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-heading font-bold gradient-text">{BRAND_NAME_AR}</span>
              <span className="text-xs text-muted-foreground font-medium">{BRAND_NAME_EN}</span>
            </div>
          </Link>
          <div className="flex items-center gap-2 md:gap-3">
            <ThemeToggle />
            <div className="hidden sm:flex items-center gap-1">
              <Button variant="ghost" size="sm" onClick={() => i18n.changeLanguage('en')} className="text-xs">EN</Button>
              <Button variant="ghost" size="sm" onClick={() => i18n.changeLanguage('ar')} className="text-xs">AR</Button>
            </div>
            <LanguageToggle />
            <Link to="/auth/login">
              <Button variant="ghost" size="default" className="hidden sm:inline-flex font-semibold">
                {t('nav.login')}
              </Button>
            </Link>
            <Link to="/auth/signup">
              <Button size="default" className="gradient-primary shadow-lg hover:shadow-xl transition-shadow font-semibold">
                {t('landing.hero.startFree')}
                <ArrowRight className="mr-2 h-4 w-4 rtl:rotate-180" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden min-h-[90vh] flex items-center">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background" />
          <div className="absolute inset-0 bg-gradient-mesh opacity-70" />
          <div className="absolute inset-0 bg-dots-pattern opacity-30" />
        </div>
        
        {/* Floating Elements */}
        <div className="absolute top-20 left-[10%] w-64 h-64 bg-primary/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-[10%] w-80 h-80 bg-secondary/15 rounded-full blur-3xl animate-float-delayed" />
        <div className="absolute top-1/3 right-[20%] w-48 h-48 bg-accent/10 rounded-full blur-3xl animate-pulse-slow" />
        
        {/* Decorative Shapes */}
        <div className="absolute top-40 left-[5%] w-3 h-3 bg-primary rounded-full animate-pulse" />
        <div className="absolute top-60 right-[15%] w-2 h-2 bg-secondary rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
        <div className="absolute bottom-40 left-[20%] w-4 h-4 bg-accent/50 rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
        
        <div className="container relative py-20 md:py-32">
          <div className="mx-auto max-w-5xl text-center">
            {/* Logo Badge */}
            <div className="flex justify-center mb-8 animate-scale-in">
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-primary via-secondary to-accent rounded-3xl blur-2xl opacity-30 animate-pulse-slow" />
                <div className="relative w-28 h-28 md:w-36 md:h-36 rounded-2xl overflow-hidden bg-background shadow-2xl border border-border/50">
                  <img 
                    src={logoUrl} 
                    alt={`${BRAND_NAME_EN} Logo`}
                    className="w-full h-full object-contain p-2"
                  />
                </div>
              </div>
            </div>

            {/* Badge */}
            <Badge variant="soft-primary" className="mb-8 px-5 py-2.5 text-sm font-semibold animate-slide-up">
              <Sparkles className="mr-2 h-4 w-4" />
              {t('landing.hero.badge')}
            </Badge>

            {/* Heading */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-heading font-bold tracking-tight mb-8 leading-[1.1] animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <span className="text-foreground">
                {t('landing.hero.title')}
              </span>
              <br />
              <span className="relative">
                <span className="gradient-text">{t('landing.hero.titleHighlight')}</span>
                <svg className="absolute -bottom-2 left-0 w-full h-3 text-primary/30" viewBox="0 0 200 8" preserveAspectRatio="none">
                  <path d="M0 7 Q50 0 100 7 T200 7" stroke="currentColor" strokeWidth="3" fill="none" />
                </svg>
              </span>
            </h1>

            {/* Subheading */}
            <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed animate-slide-up" style={{ animationDelay: '0.2s' }}>
              {t('landing.hero.subtitle')}
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16 animate-slide-up" style={{ animationDelay: '0.3s' }}>
              <Link to="/auth/signup">
                <Button size="xl" className="gap-3 gradient-primary shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all w-full sm:w-auto">
                  <ShoppingCart className="h-5 w-5" />
                  {t('landing.hero.startFree')}
                  <ArrowRight className="h-5 w-5 rtl:rotate-180" />
                </Button>
              </Link>
              <Button size="xl" variant="outline" className="border-2 hover:bg-muted/50 gap-3 w-full sm:w-auto">
                <Play className="h-5 w-5" />
                {t('landing.hero.watchDemo')}
              </Button>
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-sm text-muted-foreground animate-fade-in" style={{ animationDelay: '0.4s' }}>
              {[
                { text: t('landing.hero.noCreditCard'), delay: '0s' },
                { text: t('landing.hero.readyIn5'), delay: '0.1s' },
                { text: t('landing.hero.support247'), delay: '0.2s' }
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 animate-slide-up" style={{ animationDelay: item.delay }}>
                  <div className="w-6 h-6 rounded-full bg-success/15 flex items-center justify-center">
                    <Check className="h-3.5 w-3.5 text-success" />
                  </div>
                  <span className="font-medium">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-accent/5 to-secondary/5" />
        <div className="container relative">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {stats.map((stat, index) => (
              <div 
                key={index} 
                className="text-center group p-6 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50 hover:border-primary/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <stat.icon className="h-6 w-6 text-primary" />
                </div>
                <div className="text-3xl md:text-4xl font-heading font-bold gradient-text mb-2">
                  {stat.value}
                </div>
                <div className="text-muted-foreground font-medium text-sm">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 relative">
        <div className="absolute inset-0 bg-gradient-mesh opacity-30" />
        <div className="container relative">
          <div className="text-center mb-16">
            <Badge variant="soft-secondary" className="mb-6 px-4 py-2">
              <Star className="mr-2 h-4 w-4" />
              {t('landing.features.badge')}
            </Badge>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-heading font-bold mb-6">
              <span className="text-foreground">{t('landing.features.title')}</span>
              <br />
              <span className="gradient-text">{t('landing.features.titleHighlight')}</span>
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
              {t('landing.features.subtitle')}
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card 
                key={index} 
                className="group border-border/50 hover:border-primary/30 bg-card/50 backdrop-blur-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-2 overflow-hidden"
              >
                <CardHeader className="pb-4">
                  <div className={`h-14 w-14 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                    <feature.icon className="h-7 w-7 text-white" />
                  </div>
                  <CardTitle className="text-xl mb-2 group-hover:text-primary transition-colors">{feature.title}</CardTitle>
                  <CardDescription className="text-base leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-24 bg-muted/30 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />
        <div className="container relative">
          <div className="text-center mb-16">
            <Badge variant="soft-success" className="mb-6 px-4 py-2">
              <BarChart3 className="mr-2 h-4 w-4" />
              {t('landing.pricing.badge')}
            </Badge>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-heading font-bold mb-6">
              <span className="text-foreground">{t('landing.pricing.title')}</span>
              <br />
              <span className="gradient-text">{t('landing.pricing.titleHighlight')}</span>
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
              {t('landing.pricing.subtitle')}
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
            {plans.map((plan, index) => (
              <Card 
                key={index} 
                className={`relative transition-all duration-300 ${
                  plan.highlighted 
                    ? 'md:scale-105 shadow-2xl border-2 border-primary bg-card z-10' 
                    : 'border-border/50 hover:shadow-xl hover:border-primary/30 bg-card/50'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                    <Badge className="gradient-primary text-white px-5 py-1.5 text-sm font-bold shadow-lg">
                      <Star className="mr-2 h-4 w-4" />
                      {t('landing.pricing.popular')}
                    </Badge>
                  </div>
                )}
                <CardHeader className="text-center pb-8 pt-10">
                  <CardTitle className="text-2xl font-bold mb-2">{plan.name}</CardTitle>
                  <CardDescription className="text-base mb-6">{plan.description}</CardDescription>
                  <div className="mt-4">
                    <div className="flex items-baseline justify-center gap-2">
                      <span className="text-5xl font-heading font-bold gradient-text">
                        {plan.price}
                      </span>
                      {plan.period && (
                        <span className="text-muted-foreground">
                          {t('landing.pricing.currency')} / {plan.period}
                        </span>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pb-8">
                  <ul className="space-y-4 mb-8">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-0.5">
                          <div className="h-5 w-5 rounded-full bg-success/15 flex items-center justify-center">
                            <Check className="h-3 w-3 text-success" />
                          </div>
                        </div>
                        <span className="text-foreground/80">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link to="/auth/signup" className="block">
                    <Button 
                      className={`w-full h-12 text-base font-semibold ${
                        plan.highlighted
                          ? 'gradient-primary shadow-lg hover:shadow-xl'
                          : ''
                      }`}
                      variant={plan.highlighted ? 'default' : 'outline'}
                      size="lg"
                    >
                      {plan.cta}
                      <ChevronRight className="mr-2 h-4 w-4 rtl:rotate-180" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-28 relative overflow-hidden">
        <div className="absolute inset-0 gradient-primary" />
        <div className="absolute inset-0 bg-grid-pattern opacity-10" />
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-white/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-white/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
        <div className="container relative text-center">
          <div className="w-20 h-20 mx-auto mb-8 rounded-2xl overflow-hidden bg-white/10 backdrop-blur-sm border border-white/20 shadow-2xl">
            <img src={logoUrl} alt={BRAND_NAME_AR} className="w-full h-full object-contain p-2" />
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-heading font-bold text-white mb-6">
            {t('landing.cta.title')}
          </h2>
          <p className="text-white/90 text-lg md:text-xl mb-12 max-w-2xl mx-auto">
            {t('landing.cta.subtitle')}
          </p>
          <Link to="/auth/signup">
            <Button 
              size="xl" 
              className="gap-3 shadow-2xl bg-white hover:bg-white/95 text-primary font-bold hover:scale-[1.02] transition-all"
            >
              <ShoppingCart className="h-5 w-5" />
              {t('landing.cta.button')}
              <ArrowRight className="h-5 w-5 rtl:rotate-180" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-16 bg-accent text-white">
        <div className="container">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-white/10 rounded-xl overflow-hidden backdrop-blur-sm">
                  <img src={logoUrl} alt={BRAND_NAME_AR} className="w-full h-full object-contain p-1" onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const parent = e.currentTarget.parentElement;
                    if (parent) {
                      parent.innerHTML = '<div class="w-full h-full flex items-center justify-center"><svg class="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg></div>';
                    }
                  }} />
                </div>
                <div>
                  <span className="text-2xl font-heading font-bold">{BRAND_NAME_AR}</span>
                  <p className="text-white/60 text-sm">{BRAND_NAME_EN}</p>
                </div>
              </div>
              <p className="text-white/70 leading-relaxed">
                {t('landing.footer.description')}
              </p>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-6">{t('landing.footer.product')}</h3>
              <ul className="space-y-3 text-white/70">
                <li><a href="#features" className="hover:text-white transition-colors">{t('landing.footer.links.features')}</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">{t('landing.footer.links.pricing')}</a></li>
                <li><a href="#templates" className="hover:text-white transition-colors">{t('landing.footer.links.templates')}</a></li>
                <li><a href="#integrations" className="hover:text-white transition-colors">{t('landing.footer.links.integrations')}</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-6">{t('landing.footer.support')}</h3>
              <ul className="space-y-3 text-white/70">
                <li><a href="#help" className="hover:text-white transition-colors">{t('landing.footer.links.helpCenter')}</a></li>
                <li><a href="#faq" className="hover:text-white transition-colors">{t('landing.footer.links.faq')}</a></li>
                <li><a href="#contact" className="hover:text-white transition-colors">{t('landing.footer.links.contact')}</a></li>
                <li><a href="#docs" className="hover:text-white transition-colors">{t('landing.footer.links.docs')}</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-6">{t('landing.footer.company')}</h3>
              <ul className="space-y-3 text-white/70">
                <li><a href="#about" className="hover:text-white transition-colors">{t('landing.footer.links.about')}</a></li>
                <li><a href="#blog" className="hover:text-white transition-colors">{t('landing.footer.links.blog')}</a></li>
                <li><a href="#careers" className="hover:text-white transition-colors">{t('landing.footer.links.careers')}</a></li>
                <li><a href="#press" className="hover:text-white transition-colors">{t('landing.footer.links.press')}</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-white/60 text-sm">
              {t('landing.footer.copyright')}
            </p>
            <div className="flex gap-6 text-sm text-white/60">
              <a href="#privacy" className="hover:text-white transition-colors">{t('landing.footer.links.privacy')}</a>
              <a href="#terms" className="hover:text-white transition-colors">{t('landing.footer.links.terms')}</a>
              <a href="#cookies" className="hover:text-white transition-colors">{t('landing.footer.links.cookies')}</a>
            </div>
          </div>
          <VersionFooter className="mt-8 pt-4 border-t border-white/10" />
        </div>
      </footer>
    </div>
  );
}
