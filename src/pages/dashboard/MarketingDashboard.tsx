import { useState } from 'react';
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

const SMARTLINE_PACKAGES = [
  {
    id: 'basic',
    name: 'الباقة الأساسية',
    nameEn: 'Basic Package',
    price: 999,
    duration: 'شهرياً',
    icon: Sparkles,
    color: 'from-blue-500 to-cyan-500',
    features: [
      'إدارة حسابين على منصات التواصل',
      '10 منشورات شهرياً',
      'تصميم محتوى احترافي',
      'تقرير أداء شهري',
      'دعم فني عبر البريد',
    ],
    recommended: false,
  },
  {
    id: 'professional',
    name: 'الباقة الاحترافية',
    nameEn: 'Professional Package',
    price: 1999,
    duration: 'شهرياً',
    icon: Zap,
    color: 'from-purple-500 to-pink-500',
    features: [
      'إدارة 4 حسابات على منصات التواصل',
      '20 منشور شهرياً',
      'تصميم محتوى احترافي + فيديوهات قصيرة',
      'إدارة الإعلانات الممولة',
      'تقرير أداء أسبوعي',
      'دعم فني على مدار الساعة',
      'استشارات تسويقية',
    ],
    recommended: true,
  },
  {
    id: 'enterprise',
    name: 'باقة الأعمال',
    nameEn: 'Enterprise Package',
    price: 3999,
    duration: 'شهرياً',
    icon: Crown,
    color: 'from-orange-500 to-red-500',
    features: [
      'إدارة غير محدودة للحسابات',
      '40 منشور شهرياً',
      'محتوى متعدد الوسائط (صور، فيديو، انفوجرافيك)',
      'إدارة كاملة للإعلانات الممولة',
      'تقارير يومية مفصلة',
      'مدير حساب مخصص',
      'استراتيجية تسويقية شاملة',
      'تحليلات متقدمة بالذكاء الاصطناعي',
    ],
    recommended: false,
  },
];

const STATS = [
  { label: 'إجمالي المتابعين', value: '12.5K', change: '+12%', icon: Users, color: 'text-blue-500' },
  { label: 'معدل التفاعل', value: '8.3%', change: '+5%', icon: TrendingUp, color: 'text-green-500' },
  { label: 'المنشورات هذا الشهر', value: '24', change: '+8', icon: MessageSquare, color: 'text-purple-500' },
  { label: 'الوصول الإجمالي', value: '45.2K', change: '+18%', icon: BarChart3, color: 'text-orange-500' },
];

const SOCIAL_ACCOUNTS = [
  { platform: 'Instagram', followers: '5.2K', icon: Instagram, color: 'bg-gradient-to-br from-purple-500 to-pink-500' },
  { platform: 'Facebook', followers: '3.8K', icon: Facebook, color: 'bg-blue-600' },
  { platform: 'Twitter', followers: '2.1K', icon: Twitter, color: 'bg-sky-500' },
  { platform: 'LinkedIn', followers: '1.4K', icon: Linkedin, color: 'bg-blue-700' },
];

export default function MarketingDashboard() {
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">لوحة التسويق</h1>
        <p className="text-sm text-gray-500 mt-1">إدارة الحملات التسويقية وتحليل الأداء</p>
      </div>

      {/* Smart Line Partner Banner */}
      <Card className="relative overflow-hidden border-0 bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600">
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
                <h3 className="text-xl font-bold mb-1">Smart Line - شريكنا في التسويق</h3>
                <p className="text-white/90 text-sm">حلول تسويقية متكاملة وإدارة احترافية لحسابات التواصل الاجتماعي</p>
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
          <CardTitle>حساباتك على منصات التواصل</CardTitle>
          <CardDescription>نظرة عامة على أداء حساباتك</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {SOCIAL_ACCOUNTS.map((account, index) => (
              <div key={index} className="flex flex-col items-center p-4 border rounded-lg hover:shadow-md transition-shadow">
                <div className={`w-12 h-12 ${account.color} rounded-full flex items-center justify-center mb-3`}>
                  <account.icon className="h-6 w-6 text-white" />
                </div>
                <p className="font-semibold text-gray-900 dark:text-white">{account.platform}</p>
                <p className="text-sm text-gray-500">{account.followers} متابع</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Smart Line Packages */}
      <div>
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">باقات Smart Line</h2>
          <p className="text-gray-600 dark:text-gray-400">اختر الباقة المناسبة لاحتياجاتك التسويقية</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {SMARTLINE_PACKAGES.map((pkg) => {
            const Icon = pkg.icon;
            return (
              <Card 
                key={pkg.id}
                className={`relative overflow-hidden transition-all hover:shadow-xl ${
                  pkg.recommended ? 'ring-2 ring-purple-500 scale-105' : ''
                } ${selectedPackage === pkg.id ? 'ring-2 ring-cyan-500' : ''}`}
              >
                {pkg.recommended && (
                  <div className="absolute top-0 right-0 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-1 text-xs font-semibold rounded-bl-lg">
                    الأكثر طلباً
                  </div>
                )}
                
                <CardHeader className="text-center pb-4">
                  <div className={`w-16 h-16 mx-auto mb-4 bg-gradient-to-br ${pkg.color} rounded-2xl flex items-center justify-center`}>
                    <Icon className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-2xl">{pkg.name}</CardTitle>
                  <CardDescription className="text-sm">{pkg.nameEn}</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-gray-900 dark:text-white">{pkg.price}</span>
                    <span className="text-gray-600 dark:text-gray-400 mr-2">ريال</span>
                    <p className="text-sm text-gray-500 mt-1">{pkg.duration}</p>
                  </div>
                </CardHeader>

                <CardContent>
                  <ul className="space-y-3 mb-6">
                    {pkg.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button 
                    className={`w-full ${pkg.recommended ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700' : ''}`}
                    variant={pkg.recommended ? 'default' : 'outline'}
                    onClick={() => setSelectedPackage(pkg.id)}
                  >
                    {selectedPackage === pkg.id ? 'تم الاختيار' : 'اختر الباقة'}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Contact Smart Line */}
      <Card className="bg-gradient-to-r from-slate-800 to-slate-900 border-slate-700">
        <CardContent className="p-8 text-center">
          <h3 className="text-2xl font-bold text-white mb-3">هل تحتاج إلى باقة مخصصة؟</h3>
          <p className="text-gray-300 mb-6">تواصل مع فريق Smart Line للحصول على عرض مخصص يناسب احتياجاتك</p>
          <Button size="lg" className="bg-cyan-600 hover:bg-cyan-700">
            تواصل معنا
            <MessageSquare className="mr-2 h-5 w-5" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
