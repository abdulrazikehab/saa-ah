import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { coreApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { 
  Crown, 
  Zap, 
  Building2, 
  Check, 
  Loader2,
  CreditCard,
  Calendar,
  Package,
  Users,
  HardDrive,
  Globe,
  Star,
  ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Plan {
  id: string;
  code?: string;
  name: string;
  nameAr?: string;
  description?: string;
  descriptionAr?: string;
  price: number | string;
  currency: string;
  billingCycle: 'MONTHLY' | 'YEARLY' | 'LIFETIME';
  features: string[];
  featuresAr?: string[];
  limits: {
    products?: number;
    orders?: number;
    storage?: number;
    staff?: number;
    customDomains?: number;
  };
  isActive: boolean;
  isPopular: boolean;
  sortOrder: number;
}

const getPlanIcon = (planName: string) => {
  const name = planName.toLowerCase();
  if (name.includes('enterprise') || name.includes('business')) {
    return <Building2 className="h-8 w-8" />;
  }
  if (name.includes('pro') || name.includes('professional')) {
    return <Zap className="h-8 w-8" />;
  }
  return <Crown className="h-8 w-8" />;
};

const getPlanColor = (planName: string, isPopular: boolean) => {
  if (isPopular) return 'from-primary to-primary/80';
  const name = planName.toLowerCase();
  if (name.includes('enterprise') || name.includes('business')) {
    return 'from-purple-500 to-purple-600';
  }
  if (name.includes('pro') || name.includes('professional')) {
    return 'from-blue-500 to-blue-600';
  }
  return 'from-slate-500 to-slate-600';
};

const formatLimit = (value: number | undefined): string => {
  if (value === undefined || value === -1) return 'غير محدود';
  return value.toLocaleString();
};

const getBillingCycleLabel = (cycle: string, isAr: boolean): string => {
  const labels: Record<string, { en: string; ar: string }> = {
    MONTHLY: { en: '/month', ar: '/شهر' },
    YEARLY: { en: '/year', ar: '/سنة' },
    LIFETIME: { en: 'one-time', ar: 'دفعة واحدة' },
  };
  return labels[cycle]?.[isAr ? 'ar' : 'en'] || cycle;
};

const isPlanFree = (plan: Plan): boolean => {
  const price = typeof plan.price === 'string' ? parseFloat(plan.price) : plan.price;
  return price === 0;
};

export default function BillingSettings() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const { user } = useAuth();
  const { toast } = useToast();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCycle, setSelectedCycle] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY');
  const [upgrading, setUpgrading] = useState<string | null>(null);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      setLoading(true);
      // Fetch public plans (no admin key needed) from /public/plans endpoint
      const response = await coreApi.get('/public/plans', { requireAuth: false });
      const plansData = (response as any)?.plans || (response as any)?.data?.plans || (Array.isArray(response) ? response : []);
      // Sort by sortOrder (backend already filters active plans)
      const sortedPlans = plansData.sort((a: Plan, b: Plan) => (a.sortOrder || 0) - (b.sortOrder || 0));
      setPlans(sortedPlans);
    } catch (error: any) {
      console.error('Failed to load plans:', error);
      // Use default plans if API fails
      setPlans([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (planId: string) => {
    setUpgrading(planId);
    try {
      // TODO: Implement actual upgrade flow with payment gateway
      toast({
        title: isAr ? 'قريباً' : 'Coming Soon',
        description: isAr 
          ? 'سيتم إضافة نظام الدفع قريباً. تواصل معنا للترقية.'
          : 'Payment system coming soon. Contact us to upgrade.',
      });
    } catch (error: any) {
      toast({
        title: isAr ? 'خطأ' : 'Error',
        description: error?.message || (isAr ? 'فشل في الترقية' : 'Failed to upgrade'),
        variant: 'destructive',
      });
    } finally {
      setUpgrading(null);
    }
  };

  // Filter plans by billing cycle
  const filteredPlans = plans.filter(p => 
    p.billingCycle === selectedCycle || p.billingCycle === 'LIFETIME'
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">
          {isAr ? 'خطط الاشتراك' : 'Subscription Plans'}
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          {isAr 
            ? 'اختر الخطة المناسبة لاحتياجات عملك. يمكنك الترقية أو تغيير الخطة في أي وقت.'
            : 'Choose the plan that fits your business needs. You can upgrade or change plans anytime.'}
        </p>
      </div>

      {/* Current Plan Info */}
      {user?.tenantId && (
        <Alert className="bg-primary/5 border-primary/20">
          <CreditCard className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>
              {isAr ? 'خطتك الحالية: ' : 'Your current plan: '}
              <strong className="text-primary">STARTER</strong>
            </span>
            <Badge variant="outline" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
              {isAr ? 'نشط' : 'Active'}
            </Badge>
          </AlertDescription>
        </Alert>
      )}

      {/* Billing Cycle Toggle */}
      <div className="flex justify-center">
        <Tabs value={selectedCycle} onValueChange={(v) => setSelectedCycle(v as 'MONTHLY' | 'YEARLY')}>
          <TabsList className="grid w-[300px] grid-cols-2">
            <TabsTrigger value="MONTHLY" className="gap-2">
              <Calendar className="h-4 w-4" />
              {isAr ? 'شهري' : 'Monthly'}
            </TabsTrigger>
            <TabsTrigger value="YEARLY" className="gap-2">
              <Star className="h-4 w-4" />
              {isAr ? 'سنوي' : 'Yearly'}
              <Badge className="bg-green-500 text-white text-xs">-20%</Badge>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Plans Grid */}
      {filteredPlans.length === 0 ? (
        <div className="text-center py-12">
          <Package className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            {isAr ? 'لا توجد خطط متاحة' : 'No Plans Available'}
          </h3>
          <p className="text-muted-foreground">
            {isAr 
              ? 'لم يتم إضافة خطط اشتراك بعد. تواصل مع الإدارة.'
              : 'No subscription plans have been added yet. Contact admin.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {filteredPlans.map((plan) => (
            <Card 
              key={plan.id} 
              className={`relative overflow-hidden transition-all hover:shadow-lg ${
                plan.isPopular ? 'border-primary shadow-primary/20 shadow-lg scale-105' : ''
              }`}
            >
              {/* Popular Badge */}
              {plan.isPopular && (
                <div className="absolute top-0 right-0">
                  <Badge className="rounded-none rounded-bl-lg bg-primary">
                    <Star className="h-3 w-3 mr-1 fill-current" />
                    {isAr ? 'الأكثر شعبية' : 'Most Popular'}
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center pb-2">
                <div className={`mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br ${getPlanColor(plan.name, plan.isPopular)} flex items-center justify-center text-white mb-4`}>
                  {getPlanIcon(plan.name)}
                </div>
                <CardTitle className="text-xl">
                  {isAr ? plan.nameAr || plan.name : plan.name}
                </CardTitle>
                <CardDescription>
                  {isAr ? plan.descriptionAr || plan.description : plan.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="text-center space-y-6">
                {/* Price */}
                <div>
                  {isPlanFree(plan) ? (
                    <>
                      <div className="text-4xl font-bold text-green-500">
                        {isAr ? 'مجاني' : 'Free'}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {isAr ? 'للأبد' : 'Forever'}
                      </span>
                    </>
                  ) : (
                    <>
                      <div className="flex items-baseline justify-center gap-1">
                        <span className="text-4xl font-bold">{plan.price}</span>
                        <span className="text-lg text-muted-foreground">{plan.currency}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {getBillingCycleLabel(plan.billingCycle, isAr)}
                      </span>
                    </>
                  )}
                </div>

                {/* Limits */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                    <Package className="h-4 w-4 text-primary" />
                    <div className="text-right">
                      <div className="font-medium">{formatLimit(plan.limits?.products)}</div>
                      <div className="text-xs text-muted-foreground">{isAr ? 'منتج' : 'Products'}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                    <Users className="h-4 w-4 text-primary" />
                    <div className="text-right">
                      <div className="font-medium">{formatLimit(plan.limits?.staff)}</div>
                      <div className="text-xs text-muted-foreground">{isAr ? 'موظف' : 'Staff'}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                    <HardDrive className="h-4 w-4 text-primary" />
                    <div className="text-right">
                      <div className="font-medium">{plan.limits?.storage || 10} GB</div>
                      <div className="text-xs text-muted-foreground">{isAr ? 'تخزين' : 'Storage'}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                    <Globe className="h-4 w-4 text-primary" />
                    <div className="text-right">
                      <div className="font-medium">{formatLimit(plan.limits?.customDomains)}</div>
                      <div className="text-xs text-muted-foreground">{isAr ? 'نطاق' : 'Domains'}</div>
                    </div>
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-2 text-right">
                  {(isAr ? plan.featuresAr || plan.features : plan.features)?.slice(0, 5).map((feature, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                  {plan.features?.length > 5 && (
                    <p className="text-xs text-muted-foreground">
                      +{plan.features.length - 5} {isAr ? 'ميزات أخرى' : 'more features'}
                    </p>
                  )}
                </div>
              </CardContent>

              <CardFooter>
                <Button 
                  className={`w-full gap-2 ${isPlanFree(plan) ? 'bg-green-600 hover:bg-green-700' : ''}`}
                  variant={plan.isPopular ? 'default' : 'outline'}
                  onClick={() => handleUpgrade(plan.id)}
                  disabled={upgrading === plan.id}
                >
                  {upgrading === plan.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      {isPlanFree(plan) 
                        ? (isAr ? 'ابدأ مجاناً' : 'Start Free')
                        : (isAr ? 'اختر هذه الخطة' : 'Choose Plan')
                      }
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* FAQ Section */}
      <div className="mt-12 max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold text-center mb-6">
          {isAr ? 'الأسئلة الشائعة' : 'Frequently Asked Questions'}
        </h2>
        <div className="space-y-4">
          <Card>
            <CardHeader className="py-4">
              <CardTitle className="text-base">
                {isAr ? 'هل يمكنني تغيير خطتي لاحقاً؟' : 'Can I change my plan later?'}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 text-sm text-muted-foreground">
              {isAr 
                ? 'نعم، يمكنك الترقية أو تخفيض خطتك في أي وقت. سيتم احتساب الفرق بشكل نسبي.'
                : 'Yes, you can upgrade or downgrade your plan at any time. The difference will be prorated.'}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="py-4">
              <CardTitle className="text-base">
                {isAr ? 'ما هي طرق الدفع المتاحة؟' : 'What payment methods are available?'}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 text-sm text-muted-foreground">
              {isAr 
                ? 'نقبل جميع البطاقات الائتمانية الرئيسية، Apple Pay، مدى، وSTC Pay.'
                : 'We accept all major credit cards, Apple Pay, Mada, and STC Pay.'}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="py-4">
              <CardTitle className="text-base">
                {isAr ? 'هل هناك فترة تجريبية مجانية؟' : 'Is there a free trial?'}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 text-sm text-muted-foreground">
              {isAr 
                ? 'نعم، نقدم فترة تجريبية مجانية لمدة 14 يوم لجميع الخطط المدفوعة.'
                : 'Yes, we offer a 14-day free trial for all paid plans.'}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

