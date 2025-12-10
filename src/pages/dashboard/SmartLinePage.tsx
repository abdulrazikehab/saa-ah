import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Sparkles, 
  Search, 
  Filter, 
  ArrowRight, 
  Check, 
  Star, 
  Zap, 
  MessageSquare, 
  BarChart3, 
  Globe, 
  PenTool, 
  Video,
  Rocket
} from 'lucide-react';
import { Input } from '@/components/ui/input';

// Mock Data for Services
const SERVICES = [
  {
    id: 'social-media-management',
    title: 'إدارة حسابات التواصل',
    titleEn: 'Social Media Management',
    description: 'إدارة شاملة لحساباتك على منصات التواصل الاجتماعي لزيادة التفاعل والوصول.',
    price: 999,
    category: 'social',
    rating: 4.8,
    reviews: 124,
    icon: MessageSquare,
    color: 'text-purple-500',
    bgColor: 'bg-purple-100 dark:bg-purple-900/20',
    features: ['3 منصات', '12 منشور شهرياً', 'تصميم جرافيك', 'رد على التعليقات']
  },
  {
    id: 'seo-optimization',
    title: 'تحسين محركات البحث SEO',
    titleEn: 'SEO Optimization',
    description: 'تحسين ظهور موقعك في نتائج البحث الأولى وزيادة الزيارات العضوية.',
    price: 1499,
    category: 'seo',
    rating: 4.9,
    reviews: 85,
    icon: Search,
    color: 'text-blue-500',
    bgColor: 'bg-blue-100 dark:bg-blue-900/20',
    features: ['تحليل الكلمات المفتاحية', 'تحسين المحتوى', 'بناء روابط', 'تقارير شهرية']
  },
  {
    id: 'content-creation',
    title: 'صناعة المحتوى الإبداعي',
    titleEn: 'Creative Content Creation',
    description: 'كتابة محتوى تسويقي جذاب وتصميم صور وفيديوهات احترافية.',
    price: 799,
    category: 'content',
    rating: 4.7,
    reviews: 210,
    icon: PenTool,
    color: 'text-pink-500',
    bgColor: 'bg-pink-100 dark:bg-pink-900/20',
    features: ['كتابة مقالات', 'تصميم صور', 'سيناريو فيديو', 'نشرة بريدية']
  },
  {
    id: 'paid-ads',
    title: 'إدارة الإعلانات الممولة',
    titleEn: 'Paid Ads Management',
    description: 'إدارة حملات إعلانية على جوجل وفيسبوك وانستجرام لتحقيق أعلى عائد.',
    price: 1200,
    category: 'ads',
    rating: 4.9,
    reviews: 156,
    icon: BarChart3,
    color: 'text-green-500',
    bgColor: 'bg-green-100 dark:bg-green-900/20',
    features: ['Google Ads', 'Facebook Ads', 'تحليل ROI', 'استهداف دقيق']
  },
  {
    id: 'video-production',
    title: 'إنتاج الفيديو والموشن',
    titleEn: 'Video Production',
    description: 'إنتاج فيديوهات ترويجية وموشن جرافيك لتعزيز هوية علامتك التجارية.',
    price: 2500,
    category: 'content',
    rating: 5.0,
    reviews: 42,
    icon: Video,
    color: 'text-orange-500',
    bgColor: 'bg-orange-100 dark:bg-orange-900/20',
    features: ['فيديو تعريفي', 'موشن جرافيك', 'تصوير منتجات', 'مونتاج احترافي']
  },
  {
    id: 'web-development',
    title: 'تطوير وتحسين المتجر',
    titleEn: 'Store Development',
    description: 'خدمات برمجية لتحسين سرعة وأداء متجرك وإضافة خصائص مخصصة.',
    price: 1800,
    category: 'dev',
    rating: 4.6,
    reviews: 98,
    icon: Globe,
    color: 'text-cyan-500',
    bgColor: 'bg-cyan-100 dark:bg-cyan-900/20',
    features: ['تحسين السرعة', 'تخصيص القالب', 'ربط بوابات دفع', 'صيانة شهرية']
  }
];

const CATEGORIES = [
  { id: 'all', name: 'الكل' },
  { id: 'social', name: 'تواصل اجتماعي' },
  { id: 'seo', name: 'SEO' },
  { id: 'content', name: 'محتوى' },
  { id: 'ads', name: 'إعلانات' },
  { id: 'dev', name: 'تطوير' },
];

export default function SmartLinePage() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredServices = SERVICES.filter(service => {
    const matchesCategory = selectedCategory === 'all' || service.category === selectedCategory;
    const matchesSearch = service.title.includes(searchQuery) || service.titleEn.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-8 pb-10">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 text-white p-8 md:p-12">
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-4 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 text-sm font-medium">
              <Sparkles className="w-4 h-4 text-yellow-300" />
              <span>سوق الخدمات التسويقية الذكي</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold leading-tight">
              Smart Line Market
            </h1>
            <p className="text-lg text-white/90 leading-relaxed">
              ارتقِ بمتجرك إلى المستوى التالي مع خدمات تسويقية احترافية. اختر من بين مجموعة واسعة من الخدمات المصممة خصيصاً لنمو تجارتك.
            </p>
            <div className="flex flex-wrap gap-4 pt-4">
              <Button size="lg" className="bg-white text-purple-600 hover:bg-gray-100 border-0 font-bold">
                تصفح الخدمات
                <ArrowRight className="mr-2 h-5 w-5 rtl:rotate-180" />
              </Button>
              <Button size="lg" variant="outline" className="bg-transparent border-white text-white hover:bg-white/10">
                تواصل مع خبير
              </Button>
            </div>
          </div>
          
          {/* Decorative Icon/Image */}
          <div className="hidden md:flex items-center justify-center">
            <div className="relative w-48 h-48 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 shadow-2xl animate-pulse-slow">
              <Rocket className="w-24 h-24 text-white drop-shadow-lg" />
            </div>
          </div>
        </div>
        
        {/* Background Pattern */}
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <div className="absolute top-10 left-10 w-32 h-32 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-64 h-64 bg-pink-500 rounded-full blur-3xl"></div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between sticky top-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-4 border-b">
        <Tabs defaultValue="all" value={selectedCategory} onValueChange={setSelectedCategory} className="w-full md:w-auto">
          <TabsList className="bg-muted/50 p-1">
            {CATEGORIES.map(cat => (
              <TabsTrigger key={cat.id} value={cat.id} className="px-4">
                {cat.name}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="relative w-full md:w-72">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="ابحث عن خدمة..." 
            className="pr-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredServices.map((service) => {
          const Icon = service.icon;
          return (
            <Card key={service.id} className="group hover:shadow-xl transition-all duration-300 border-muted/60 overflow-hidden flex flex-col">
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start mb-4">
                  <div className={`p-3 rounded-2xl ${service.bgColor} transition-transform group-hover:scale-110 duration-300`}>
                    <Icon className={`w-8 h-8 ${service.color}`} />
                  </div>
                  <Badge variant="secondary" className="font-normal flex items-center gap-1">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    {service.rating} ({service.reviews})
                  </Badge>
                </div>
                <CardTitle className="text-xl group-hover:text-primary transition-colors">
                  {service.title}
                </CardTitle>
                <CardDescription className="line-clamp-2 mt-2 text-base">
                  {service.description}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="flex-1">
                <div className="space-y-3">
                  {service.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                        <Check className="w-3 h-3 text-green-600 dark:text-green-400" />
                      </div>
                      {feature}
                    </div>
                  ))}
                </div>
              </CardContent>

              <CardFooter className="pt-4 border-t bg-muted/20 flex items-center justify-between">
                <div>
                  <span className="text-2xl font-bold text-primary">{service.price}</span>
                  <span className="text-sm text-muted-foreground mr-1">ريال / شهرياً</span>
                </div>
                <Button className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 shadow-md hover:shadow-lg transition-all">
                  اشترك الآن
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredServices.length === 0 && (
        <div className="text-center py-20">
          <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-10 h-10 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold">لا توجد خدمات مطابقة</h3>
          <p className="text-muted-foreground mt-2">جرب البحث بكلمات مختلفة أو تصفح فئات أخرى</p>
          <Button variant="link" onClick={() => {setSearchQuery(''); setSelectedCategory('all');}} className="mt-4">
            عرض كل الخدمات
          </Button>
        </div>
      )}

      {/* Trust Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
        <div className="bg-card border rounded-2xl p-6 text-center">
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Zap className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="font-bold mb-2">سرعة في التنفيذ</h3>
          <p className="text-sm text-muted-foreground">نلتزم بتقديم خدماتنا في الوقت المحدد وبأعلى جودة</p>
        </div>
        <div className="bg-card border rounded-2xl p-6 text-center">
          <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-6 h-6 text-green-600" />
          </div>
          <h3 className="font-bold mb-2">نتائج مضمونة</h3>
          <p className="text-sm text-muted-foreground">نضمن لك تحسن ملحوظ في أداء متجرك ومبيعاتك</p>
        </div>
        <div className="bg-card border rounded-2xl p-6 text-center">
          <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="w-6 h-6 text-purple-600" />
          </div>
          <h3 className="font-bold mb-2">دعم متواصل</h3>
          <p className="text-sm text-muted-foreground">فريقنا متاح دائماً للإجابة على استفساراتك ومساعدتك</p>
        </div>
      </div>
    </div>
  );
}
