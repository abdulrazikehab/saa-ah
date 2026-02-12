import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { 
  Store, 
  Search, 
  Smartphone, 
  Layout, 
  Palette, 
  Zap, 
  Check,
  Star,
  ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Mock data for app templates
const APP_TEMPLATES = [
  {
    id: 'retail-pro',
    name: 'Retail Pro',
    nameAr: 'ريتيل برو',
    description: 'Perfect for fashion and lifestyle stores. Focuses on large imagery and collections.',
    descriptionAr: 'مثالي لمتاجر الأزياء ونمط الحياة. يركز على الصور الكبيرة والمجموعات.',
    category: 'retail',
    image: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?q=80&w=800&auto=format&fit=crop',
    rating: 4.8,
    users: '2k+',
    isNew: false,
    free: true
  },
  {
    id: 'digital-market',
    name: 'Digital Market',
    nameAr: 'السوق الرقمي',
    description: 'Optimized for digital products, software keys, and downloadable assets.',
    descriptionAr: 'محسن للمنتجات الرقمية بمفاتيح البرامج والأصول القابلة للتنزيل.',
    category: 'digital',
    image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=800&auto=format&fit=crop',
    rating: 4.9,
    users: '5k+',
    isNew: true,
    free: false
  },
  {
    id: 'minimal-shop',
    name: 'Minimal Shop',
    nameAr: 'المتجر البسيط',
    description: 'Clean, distraction-free design that puts your products front and center.',
    descriptionAr: 'تصميم نظيف وخالٍ من المشتتات يضع منتجاتك في المقدمة.',
    category: 'retail',
    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=800&auto=format&fit=crop',
    rating: 4.7,
    users: '10k+',
    isNew: false,
    free: true
  },
  {
    id: 'grocery-go',
    name: 'Grocery Go',
    nameAr: 'بقالة جو',
    description: 'Designed for supermarkets and food delivery with quick-add buttons.',
    descriptionAr: 'مصمم للسوبر ماركت وتوصيل الطعام مع أزرار إضافة سريعة.',
    category: 'food',
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=800&auto=format&fit=crop',
    rating: 4.6,
    users: '1k+',
    isNew: true,
    free: false
  }
];

export default function AppsStore() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const filteredTemplates = APP_TEMPLATES.filter(template => {
    const matchesSearch = 
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      template.nameAr.includes(searchQuery);
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent flex items-center gap-3">
            <Store className="h-8 w-8 text-primary" />
            {t('apps.store.title', 'متجر التطبيقات')}
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            {t('apps.store.subtitle', 'اختر تصميماً وابدأ تطبيقك في دقائق')}
          </p>
        </div>
        <div className="flex gap-3">
           <Button variant="outline" onClick={() => navigate('/dashboard/installed-apps')}>
            {t('apps.store.installed', 'تطبيقاتي المثبتة')}
           </Button>
        </div>
      </div>

      {/* Featured Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white p-8 md:p-12">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Smartphone className="w-64 h-64 rotate-12" />
        </div>
        <div className="relative z-10 max-w-2xl">
          <Badge className="bg-white/20 hover:bg-white/30 text-white border-0 mb-4 text-sm px-3 py-1">
            <Zap className="w-4 h-4 mr-2 text-yellow-300" />
            {t('apps.store.newFeature', 'ميزة جديدة')}
          </Badge>
          <h2 className="text-3xl md:text-5xl font-bold mb-4 leading-tight">
            {t('apps.store.bannerTitle', 'حول متجرك إلى تطبيق جوال')}
          </h2>
          <p className="text-white/80 text-lg mb-8 max-w-xl">
            {t('apps.store.bannerDesc', 'احصل على تطبيق iPhone و Android خاص بمتجرك وزد مبيعاتك بنسبة 40% مع الإشعارات وتجربة التسوق السلسة.')}
          </p>
          <Button 
            size="lg" 
            className="bg-white text-indigo-600 hover:bg-white/90 font-bold text-lg h-12 px-8 shadow-xl"
            onClick={() => navigate('/dashboard/app-builder')}
          >
            {t('apps.store.startBuilding', 'ابنِ تطبيقك الآن')}
            <ArrowRight className={`h-5 w-5 ${isRTL ? 'mr-2 rotate-180' : 'ml-2'}`} />
          </Button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between sticky top-0 bg-background/80 backdrop-blur-md z-20 py-4 -mx-4 px-4 border-b border-border/40">
        <Tabs defaultValue="all" className="w-full md:w-auto" onValueChange={setSelectedCategory}>
          <TabsList className="grid grid-cols-4 md:inline-flex w-full md:w-auto h-11">
            <TabsTrigger value="all" className="text-sm px-6">{t('apps.store.all', 'الكل')}</TabsTrigger>
            <TabsTrigger value="retail" className="text-sm px-6">{t('apps.store.retail', 'تجزئة')}</TabsTrigger>
            <TabsTrigger value="digital" className="text-sm px-6">{t('apps.store.digital', 'رقمي')}</TabsTrigger>
            <TabsTrigger value="food" className="text-sm px-6">{t('apps.store.food', 'مطاعم')}</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative w-full md:w-80">
          <Search className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground`} />
          <Input 
            placeholder={t('apps.store.search', 'ابحث عن قالب...')} 
            className={`h-11 ${isRTL ? 'pr-10' : 'pl-10'} bg-muted/50 focus:bg-background transition-colors`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredTemplates.map((template) => (
          <Card key={template.id} className="group overflow-hidden border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg flex flex-col h-full">
            {/* Image Preview */}
            <div className="relative aspect-[4/3] bg-muted overflow-hidden">
              <img 
                src={template.image} 
                alt={template.name} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute top-3 right-3 flex gap-2">
                {template.isNew && (
                  <Badge className="bg-blue-600 text-white shadow-sm">
                    {t('common.new', 'جديد')}
                  </Badge>
                )}
                {template.free ? (
                  <Badge variant="secondary" className="bg-white/90 backdrop-blur text-green-700 shadow-sm font-bold">
                    {t('common.free', 'مجاني')}
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="bg-white/90 backdrop-blur text-purple-700 shadow-sm font-bold">
                    $$$
                  </Badge>
                )}
              </div>
              {/* Overlay with Quick Action */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-4">
                <Button 
                  className="w-full transform translate-y-4 group-hover:translate-y-0 transition-transform"
                  onClick={() => navigate(`/dashboard/app-builder?template=${template.id}`)}
                >
                  {t('apps.store.preview', 'معاينة القالب')}
                </Button>
              </div>
            </div>

            <CardContent className="p-5 flex-1">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-bold text-lg">{isRTL ? template.nameAr : template.name}</h3>
                  <div className="flex items-center text-sm text-muted-foreground gap-1">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    <span>{template.rating}</span>
                    <span className="mx-1">•</span>
                    <span>{template.users} {t('apps.store.users', 'مستخدم')}</span>
                  </div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                {isRTL ? template.descriptionAr : template.description}
              </p>
            </CardContent>

            <CardFooter className="p-5 pt-0 mt-auto">
              <Button 
                variant="outline" 
                className="w-full border-primary/20 hover:bg-primary/5 hover:text-primary group-hover:border-primary"
                onClick={() => navigate(`/dashboard/app-builder?template=${template.id}`)}
              >
                <Layout className="w-4 h-4 mr-2" />
                {t('apps.store.useTemplate', 'استخدام هذا التصميم')}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
