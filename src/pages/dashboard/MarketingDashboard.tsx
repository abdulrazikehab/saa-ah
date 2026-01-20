import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  MessageSquare, 
  Instagram,
  Facebook,
  Twitter,
  Linkedin,
  Check,
  Sparkles,
  Zap,
  Crown
} from 'lucide-react';

export default function MarketingDashboard() {
  const { t } = useTranslation();
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);

  const SMARTLINE_PACKAGES = [
    {
      id: 'basic',
      name: t('dashboard.marketing.packages.basic.name'),
      nameEn: t('dashboard.marketing.packages.basic.nameEn'),
      price: 999,
      duration: t('dashboard.marketing.packages.monthly'),
      icon: Sparkles,
      color: 'from-primary to-primary/80',
      features: t('dashboard.marketing.packages.basic.features', { returnObjects: true }) as string[],
      recommended: false,
    },
    {
      id: 'professional',
      name: t('dashboard.marketing.packages.professional.name'),
      nameEn: t('dashboard.marketing.packages.professional.nameEn'),
      price: 1999,
      duration: t('dashboard.marketing.packages.monthly'),
      icon: Zap,
      color: 'from-secondary to-secondary/80',
      features: t('dashboard.marketing.packages.professional.features', { returnObjects: true }) as string[],
      recommended: true,
    },
    {
      id: 'enterprise',
      name: t('dashboard.marketing.packages.enterprise.name'),
      nameEn: t('dashboard.marketing.packages.enterprise.nameEn'),
      price: 3999,
      duration: t('dashboard.marketing.packages.monthly'),
      icon: Crown,
      color: 'from-accent to-accent/80',
      features: t('dashboard.marketing.packages.enterprise.features', { returnObjects: true }) as string[],
      recommended: false,
    },
  ];

  const STATS = [
    { label: t('dashboard.marketing.stats.totalFollowers'), value: '12.5K', change: '+12%', icon: Users, color: 'text-primary' },
    { label: t('dashboard.marketing.stats.engagementRate'), value: '8.3%', change: '+5%', icon: TrendingUp, color: 'text-success' },
    { label: t('dashboard.marketing.stats.postsThisMonth'), value: '24', change: '+8', icon: MessageSquare, color: 'text-secondary' },
    { label: t('dashboard.marketing.stats.totalReach'), value: '45.2K', change: '+18%', icon: BarChart3, color: 'text-accent' },
  ];

  const SOCIAL_ACCOUNTS = [
    { platform: 'Instagram', followers: '5.2K', icon: Instagram, color: 'bg-gradient-to-br from-purple-500 to-pink-500' },
    { platform: 'Facebook', followers: '3.8K', icon: Facebook, color: 'bg-blue-600' },
    { platform: 'Twitter', followers: '2.1K', icon: Twitter, color: 'bg-sky-500' },
    { platform: 'LinkedIn', followers: '1.4K', icon: Linkedin, color: 'bg-blue-700' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('dashboard.marketing.title')}</h1>
        <p className="text-sm text-gray-500 mt-1">{t('dashboard.marketing.subtitle')}</p>
      </div>

      {/* Smart Line Partner Banner */}
      <Card className="relative overflow-hidden border-0 bg-gradient-primary">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl">
                <img 
                  src="/partners/smartline-logo.png" 
                  alt="Smart Line" 
                  className="w-12 h-12"
                />
              </div>
              <div className="text-white">
                <h3 className="text-xl font-bold mb-1">{t('dashboard.marketing.partnerTitle')}</h3>
                <p className="text-white/90 text-sm">{t('dashboard.marketing.partnerDesc')}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">{stat.label}</p>
                  <p className="text-3xl font-bold mt-2">{stat.value}</p>
                  <div className="flex items-center gap-1 text-xs text-green-600 font-medium mt-2">
                    <TrendingUp className="h-3 w-3" />
                    <span>{stat.change}</span>
                  </div>
                </div>
                <div className={`p-3 bg-gray-100 dark:bg-gray-800 rounded-xl`}>
                  <stat.icon className={`h-7 w-7 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Social Media Accounts */}
      <Card>
        <CardHeader>
          <CardTitle>{t('dashboard.marketing.socialAccounts.title')}</CardTitle>
          <CardDescription>{t('dashboard.marketing.socialAccounts.subtitle')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {SOCIAL_ACCOUNTS.map((account, index) => (
              <div key={index} className="flex flex-col items-center p-4 border rounded-lg hover:shadow-md transition-shadow">
                <div className={`w-12 h-12 ${account.color} rounded-full flex items-center justify-center mb-3`}>
                  <account.icon className="h-6 w-6 text-white" />
                </div>
                <p className="font-semibold text-gray-900 dark:text-white">{account.platform}</p>
                <p className="text-sm text-gray-500">{account.followers} {t('dashboard.marketing.socialAccounts.followers')}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Smart Line Packages */}
      <div>
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t('dashboard.marketing.packages.title')}</h2>
          <p className="text-gray-600 dark:text-gray-400">{t('dashboard.marketing.packages.subtitle')}</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {SMARTLINE_PACKAGES.map((pkg) => {
            const Icon = pkg.icon;
            return (
              <Card 
                key={pkg.id}
                className={`relative overflow-hidden transition-all hover:shadow-xl ${
                  pkg.recommended ? 'ring-2 ring-secondary scale-105' : ''
                } ${selectedPackage === pkg.id ? 'ring-2 ring-primary' : ''}`}
              >
                {pkg.recommended && (
                  <div className="absolute top-0 right-0 bg-gradient-secondary text-white px-4 py-1 text-xs font-semibold rounded-bl-lg">
                    {t('dashboard.marketing.packages.mostPopular')}
                  </div>
                )}
                
                <CardHeader className="text-center pb-4">
                  <div className={`w-16 h-16 mx-auto mb-4 bg-gradient-to-br ${pkg.color} rounded-2xl flex items-center justify-center`}>
                    <Icon className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-2xl">{pkg.name}</CardTitle>
                  {pkg.nameEn && <CardDescription className="text-sm">{pkg.nameEn}</CardDescription>}
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-gray-900 dark:text-white">{pkg.price}</span>
                    <span className="text-gray-600 dark:text-gray-400 mr-2">{t('common.currency')}</span>
                    <p className="text-sm text-gray-500 mt-1">{pkg.duration}</p>
                  </div>
                </CardHeader>

                <CardContent>
                  <ul className="space-y-3 mb-6">
                    {Array.isArray(pkg.features) && pkg.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button 
                    className={`w-full ${pkg.recommended ? 'bg-gradient-secondary hover:opacity-90' : ''}`}
                    variant={pkg.recommended ? 'default' : 'outline'}
                    onClick={() => setSelectedPackage(pkg.id)}
                  >
                    {selectedPackage === pkg.id ? t('dashboard.marketing.packages.selected') : t('dashboard.marketing.packages.select')}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Contact Smart Line */}
      <Card className="bg-card border-border">
        <CardContent className="p-8 text-center">
          <h3 className="text-2xl font-bold text-white mb-3">{t('dashboard.marketing.customPackage.title')}</h3>
          <p className="text-gray-300 mb-6">{t('dashboard.marketing.customPackage.desc')}</p>
          <Button size="lg" className="bg-primary hover:bg-primary/90">
            {t('dashboard.marketing.customPackage.contact')}
            <MessageSquare className="mr-2 h-5 w-5" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
