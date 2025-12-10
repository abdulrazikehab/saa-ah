import { 
  ArrowRight, Store, Globe, Palette, TrendingUp, Shield, Zap, Check, 
  Star, Users, Package, BarChart3, Sparkles, Play, ChevronRight
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

export default function Landing() {
  const navigate = useNavigate();
  const { isAuthenticated, loading } = useAuth();
  const [logoUrl, setLogoUrl] = useState<string>('/saas-logo.png');
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
          // Update favicon dynamically
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
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900/20'
    },
    {
      icon: Globe,
      title: t('landing.features.items.domain.title'),
      description: t('landing.features.items.domain.description'),
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20'
    },
    {
      icon: Palette,
      title: t('landing.features.items.design.title'),
      description: t('landing.features.items.design.description'),
      color: 'text-pink-600',
      bgColor: 'bg-pink-100 dark:bg-pink-900/20'
    },
    {
      icon: TrendingUp,
      title: t('landing.features.items.analytics.title'),
      description: t('landing.features.items.analytics.description'),
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/20'
    },
    {
      icon: Shield,
      title: t('landing.features.items.security.title'),
      description: t('landing.features.items.security.description'),
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100 dark:bg-indigo-900/20'
    },
    {
      icon: Zap,
      title: t('landing.features.items.performance.title'),
      description: t('landing.features.items.performance.description'),
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/20'
    }
  ];

  const stats = [
    { value: '10,000+', label: t('landing.stats.activeStores') },
    { value: '50,000+', label: t('landing.stats.productsSold') },
    { value: '99%', label: t('landing.stats.customerSatisfaction') },
    { value: '24/7', label: t('landing.stats.support') }
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
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900">
      {/* Navigation */}
      <nav className="border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-md supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-gray-900/60 sticky top-0 z-50 shadow-sm">
        <div className="container flex h-20 items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity" />
              <div className="relative w-10 h-10 bg-white dark:bg-gray-800 rounded-xl flex items-center justify-center overflow-hidden">
                <img src={logoUrl} alt="سِعَة" className="h-8 w-8 object-contain" onError={(e) => {
                  // Fallback to icon if image fails to load
                  e.currentTarget.style.display = 'none';
                  const parent = e.currentTarget.parentElement;
                  if (parent) {
                    parent.innerHTML = '<svg class="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>';
                  }
                }} />
              </div>
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              سِعَة
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            {/* Language Switch Buttons */}
            <Button variant="ghost" size="sm" onClick={() => i18n.changeLanguage('en')}>EN</Button>
            <Button variant="ghost" size="sm" onClick={() => i18n.changeLanguage('ar')}>AR</Button>
            {/* Existing LanguageToggle component (optional) */}
            <LanguageToggle />
            <Link to="/auth/login">
              <Button variant="ghost" size="lg" className="hidden sm:inline-flex">
                {t('nav.login')}
              </Button>
            </Link>
            <Link to="/auth/signup">
              <Button size="lg" className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg">
                {t('landing.hero.startFree')}
                <ArrowRight className="mr-2 h-4 w-4 rtl:rotate-180" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background Decorations */}
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        
        <div className="container relative py-24 md:py-32 lg:py-40">
          <div className="mx-auto max-w-5xl text-center">
            {/* Badge */}
            <Badge className="mb-6 bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 hover:bg-indigo-200 px-4 py-2 text-sm font-medium">
              <Sparkles className="mr-2 h-4 w-4" />
              {t('landing.hero.badge')}
            </Badge>

            {/* Heading */}
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-8 leading-tight">
              <span className="bg-gradient-to-r from-gray-900 via-indigo-900 to-purple-900 dark:from-white dark:via-indigo-200 dark:to-purple-200 bg-clip-text text-transparent">
                {t('landing.hero.title')}
              </span>
              <br />
              <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                {t('landing.hero.titleHighlight')}
              </span>
            </h1>

            {/* Subheading */}
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-400 mb-12 max-w-3xl mx-auto leading-relaxed">
              {t('landing.hero.subtitle')}
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link to="/auth/signup">
                <Button size="lg" className="gap-2 text-lg px-10 py-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-xl hover:shadow-2xl transition-all">
                  {t('landing.hero.startFree')}
                  <ArrowRight className="h-5 w-5 rtl:rotate-180" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="text-lg px-10 py-6 border-2 hover:bg-gray-100 dark:hover:bg-gray-800">
                <Play className="ml-2 h-5 w-5" />
                {t('landing.hero.watchDemo')}
              </Button>
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-600" />
                <span>{t('landing.hero.noCreditCard')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-600" />
                <span>{t('landing.hero.readyIn5')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-600" />
                <span>{t('landing.hero.support247')}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white dark:bg-gray-900 border-y">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
                  {stat.value}
                </div>
                <div className="text-gray-600 dark:text-gray-400 font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24">
        <div className="container">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 px-4 py-2">
              <Star className="mr-2 h-4 w-4" />
              {t('landing.features.badge')}
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              <span className="bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                {t('landing.features.title')}
              </span>
              <br />
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                {t('landing.features.titleHighlight')}
</span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              {t('landing.features.subtitle')}
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card 
                key={index} 
                className="border-0 shadow-lg hover:shadow-2xl transition-all duration-300 group hover:-translate-y-1"
              >
                <CardHeader>
                  <div className={`h-14 w-14 rounded-xl ${feature.bgColor} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                    <feature.icon className={`h-7 w-7 ${feature.color}`} />
                  </div>
                  <CardTitle className="text-2xl mb-3">{feature.title}</CardTitle>
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
      <section className="py-24 bg-gray-50 dark:bg-gray-900">
        <div className="container">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-4 py-2">
              <BarChart3 className="mr-2 h-4 w-4" />
              {t('landing.pricing.badge')}
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              <span className="bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                {t('landing.pricing.title')}
              </span>
              <br />
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                {t('landing.pricing.titleHighlight')}
              </span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              {t('landing.pricing.subtitle')}
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan, index) => (
              <Card 
                key={index} 
                className={`relative border-0 shadow-lg transition-all duration-300 ${
                  plan.highlighted 
                    ? 'md:scale-110 shadow-2xl border-2 border-indigo-500' 
                    : 'hover:shadow-xl'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 z-10">
                    <Badge className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-2 text-sm font-bold shadow-lg">
                      <Star className="mr-2 h-4 w-4" />
                      {t('landing.pricing.popular')}
                    </Badge>
                  </div>
                )}
                <CardHeader className="text-center pb-8 pt-10">
                  <CardTitle className="text-2xl font-bold mb-2">{plan.name}</CardTitle>
                  <CardDescription className="text-base mb-6">{plan.description}</CardDescription>
                  <div className="mt-6">
                    <div className="flex items-baseline justify-center gap-2">
                      <span className="text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                        {plan.price}
                      </span>
                      {plan.period && (
                        <span className="text-gray-600 dark:text-gray-400">
                          {t('landing.pricing.currency')} / {plan.period}
                        </span>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-4 mb-8">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-0.5">
                          <div className="h-5 w-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                            <Check className="h-3.5 w-3.5 text-green-600" />
                          </div>
                        </div>
                        <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link to="/auth/signup" className="block">
                    <Button 
                      className={`w-full h-12 text-base font-semibold ${
                        plan.highlighted
                          ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg'
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
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600" />
        <div className="absolute inset-0 bg-grid-pattern opacity-10" />
        <div className="container relative text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            {t('landing.cta.title')}
          </h2>
          <p className="text-white/90 text-xl mb-10 max-w-2xl mx-auto">
            {t('landing.cta.subtitle')}
          </p>
          <Link to="/auth/signup">
            <Button 
              size="lg" 
              variant="secondary" 
              className="text-lg px-12 py-6 gap-3 shadow-2xl hover:shadow-3xl bg-white hover:bg-gray-100 text-indigo-600 font-bold"
            >
              {t('landing.cta.button')}
              <ArrowRight className="h-5 w-5 rtl:rotate-180" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-16 bg-gray-900 text-white">
        <div className="container">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-white dark:bg-gray-800 rounded-xl flex items-center justify-center overflow-hidden">
                  <img src={logoUrl} alt="سِعَة" className="h-8 w-8 object-contain" onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const parent = e.currentTarget.parentElement;
                    if (parent) {
                      parent.innerHTML = '<svg class="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>';
                    }
                  }} />
                </div>
                <span className="text-2xl font-bold">سِعَة</span>
              </div>
              <p className="text-gray-400 leading-relaxed">
                {t('landing.footer.description')}
              </p>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-6">{t('landing.footer.product')}</h3>
              <ul className="space-y-3 text-gray-400">
                <li><a href="#features" className="hover:text-white transition-colors">{t('landing.footer.links.features')}</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">{t('landing.footer.links.pricing')}</a></li>
                <li><a href="#templates" className="hover:text-white transition-colors">{t('landing.footer.links.templates')}</a></li>
                <li><a href="#integrations" className="hover:text-white transition-colors">{t('landing.footer.links.integrations')}</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-6">{t('landing.footer.support')}</h3>
              <ul className="space-y-3 text-gray-400">
                <li><a href="#help" className="hover:text-white transition-colors">{t('landing.footer.links.helpCenter')}</a></li>
                <li><a href="#faq" className="hover:text-white transition-colors">{t('landing.footer.links.faq')}</a></li>
                <li><a href="#contact" className="hover:text-white transition-colors">{t('landing.footer.links.contact')}</a></li>
                <li><a href="#docs" className="hover:text-white transition-colors">{t('landing.footer.links.docs')}</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-6">{t('landing.footer.company')}</h3>
              <ul className="space-y-3 text-gray-400">
                <li><a href="#about" className="hover:text-white transition-colors">{t('landing.footer.links.about')}</a></li>
                <li><a href="#blog" className="hover:text-white transition-colors">{t('landing.footer.links.blog')}</a></li>
                <li><a href="#careers" className="hover:text-white transition-colors">{t('landing.footer.links.careers')}</a></li>
                <li><a href="#press" className="hover:text-white transition-colors">{t('landing.footer.links.press')}</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-gray-400 text-sm">
              {t('landing.footer.copyright')}
            </p>
            <div className="flex gap-6 text-sm text-gray-400">
              <a href="#privacy" className="hover:text-white transition-colors">{t('landing.footer.links.privacy')}</a>
              <a href="#terms" className="hover:text-white transition-colors">{t('landing.footer.links.terms')}</a>
              <a href="#cookies" className="hover:text-white transition-colors">{t('landing.footer.links.cookies')}</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
