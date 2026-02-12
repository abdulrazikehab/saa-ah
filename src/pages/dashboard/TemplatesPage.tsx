import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { templateService, Template } from '@/services/template.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

const categoryColors: Record<string, string> = {
  fashion: 'bg-gradient-to-br from-pink-500 to-rose-500',
  electronics: 'bg-gradient-to-br from-blue-500 to-indigo-500',
  food: 'bg-gradient-to-br from-orange-500 to-red-500',
  beauty: 'bg-gradient-to-br from-purple-500 to-pink-500',
  home: 'bg-gradient-to-br from-green-500 to-emerald-500',
  digital: 'bg-gradient-to-br from-indigo-500 to-purple-500',
};

const categoryIcons: Record<string, string> = {
  fashion: '👗',
  electronics: '💻',
  food: '🍽️',
  beauty: '💄',
  home: '🏠',
  digital: '🎮',
};

export default function TemplatesPage() {
  const { t, i18n } = useTranslation();
  const [templates, setTemplates] = useState<Template[]>([]);

  // Mapping for template names to translation keys
  const templateNameKeys: Record<string, string> = {
    'Restaurant & Cafe': 'restaurantAndCafe',
    'Services Business': 'servicesBusiness',
    'Digital Cards': 'digitalCards',
    'Simple Store': 'simpleStore',
    'Blank Template': 'blankTemplate',
    'Landing Page': 'landingPage',
    'Vibrant': 'vibrant',
    'Minimal': 'minimal',
    'Modern Store': 'modernStore',
    'Classic': 'classic',
    'Dark Mode': 'darkMode',
    'Light Mode': 'lightMode',
    'Beauty & Cosmetics': 'beautyAndCosmetics',
    'Home & Furniture': 'homeAndFurniture',
    'Fashion Store': 'fashionStore',
    'Electronics Shop': 'electronicsShop',
    'Food & Beverage': 'foodAndBeverage',
  };

  // Mapping for template descriptions to translation keys
  const templateDescKeys: Record<string, string> = {
    'Elegant template for restaurants and cafes': 'restaurantDesc',
    'Professional template for service-based businesses': 'servicesDesc',
    'Complete digital cards marketplace template with instant delivery features': 'digitalCardsDesc',
    'Clean and simple store template': 'simpleStoreDesc',
    'Start from scratch': 'blankDesc',
    'High conversion landing page': 'landingPageDesc',
    'A colorful and energetic theme perfect for creative brands': 'vibrantDesc',
    'A minimalist theme focusing on simplicity and elegance': 'minimalDesc',
    'A clean and modern e-commerce theme with a professional look': 'modernStoreDesc',
    'Elegant, minimalist design for beauty products': 'beautyDesc',
    'Clean, spacious layout for furniture and home decor': 'homeDesc',
    'Modern, image-heavy design perfect for fashion retailers': 'fashionDesc',
    'Tech-focused design with product grid layout': 'electronicsDesc',
    'Warm, appetizing design for restaurants and food businesses': 'foodDesc',
    'Complete digital cards store with instant delivery': 'digitalCardsShortDesc',
  };

  // Direct Arabic mapping (Fallback if i18n keys fail)
  const templateNamesAr: Record<string, string> = {
    'Restaurant & Cafe': 'مطعم ومقهى',
    'Services Business': 'أعمال خدمية',
    'Digital Cards': 'بطاقات رقمية',
    'Simple Store': 'متجر بسيط',
    'Blank Template': 'قالب فارغ',
    'Landing Page': 'صفحة هبوط',
    'Vibrant': 'حيوي',
    'Minimal': 'بسيط',
    'Modern Store': 'متجر عصري',
    'Classic': 'كلاسيكي',
    'Dark Mode': 'الوضع الداكن',
    'Light Mode': 'الوضع الفاتح',
    'Beauty & Cosmetics': 'الجمال ومستحضرات التجميل',
    'Home & Furniture': 'المنزل والأثاث',
    'Fashion Store': 'متجر أزياء',
    'Electronics Shop': 'متجر إلكترونيات',
    'Food & Beverage': 'الأغذية والمشروبات',
  };

  const templateDescriptionsAr: Record<string, string> = {
    'Elegant template for restaurants and cafes': 'قالب أنيق للمطاعم والمقاهي',
    'Professional template for service-based businesses': 'قالب احترافي للأعمال القائمة على الخدمات',
    'Complete digital cards marketplace template with instant delivery features': 'قالب متجر بطاقات رقمية متكامل مع ميزات التسليم الفوري',
    'Clean and simple store template': 'قالب متجر نظيف وبسيط',
    'Start from scratch': 'ابدأ من الصفر',
    'High conversion landing page': 'صفحة هبوط عالية التحويل',
    'A colorful and energetic theme perfect for creative brands': 'قالب ملون ونشط مثالي للعلامات التجارية الإبداعية',
    'A minimalist theme focusing on simplicity and elegance': 'قالب بسيط يركز على البساطة والأناقة',
    'A clean and modern e-commerce theme with a professional look': 'قالب تجارة إلكترونية نظيف وعصري بمظهر احترافي',
    'Elegant, minimalist design for beauty products': 'تصميم أنيق وبسيط لمنتجات التجميل',
    'Clean, spacious layout for furniture and home decor': 'تخطيط نظيف وواسع للأثاث والديكور المنزلي',
    'Modern, image-heavy design perfect for fashion retailers': 'تصميم عصري يركز على الصور مثالي لتجار التجزئة في مجال الأزياء',
    'Tech-focused design with product grid layout': 'تصميم يركز على التكنولوجيا مع تخطيط شبكة المنتجات',
    'Warm, appetizing design for restaurants and food businesses': 'تصميم دافئ وفاتح للشهية للمطاعم والشركات الغذائية',
    'Complete digital cards store with instant delivery': 'متجر بطاقات رقمية متكامل مع تسليم فوري',
  };

  // Helper function to get translated template name
  const getTemplateName = (name: string) => {
    if (!name) return '';
    const normalized = name.trim();

    // 1. Direct Arabic lookup if language is Arabic
    if (i18n.language.startsWith('ar')) {
      if (templateNamesAr[normalized]) return templateNamesAr[normalized];
      const lower = normalized.toLowerCase();
      const foundKey = Object.keys(templateNamesAr).find(k => k.toLowerCase() === lower);
      if (foundKey) return templateNamesAr[foundKey];
      if (normalized.includes('&')) {
         const decoded = normalized.replace(/&amp;/g, '&');
         if (templateNamesAr[decoded]) return templateNamesAr[decoded];
      }
    }
    
    // 2. i18n Key Lookup
    let key = templateNameKeys[normalized];
    if (!key) {
      const lower = normalized.toLowerCase();
      const foundKey = Object.keys(templateNameKeys).find(k => k.toLowerCase() === lower);
      if (foundKey) key = templateNameKeys[foundKey];
    }
    if (!key && normalized.includes('&')) {
       const decoded = normalized.replace(/&amp;/g, '&');
       key = templateNameKeys[decoded];
    }

    if (key) return t(`dashboard.design.themes.${key}`);
    
    return t(`dashboard.design.themes.${name}`, { defaultValue: name });
  };

  // Helper function to get translated template description
  const getTemplateDescription = (description: string) => {
    if (!description) return '';
    const normalized = description.trim();

    // 1. Direct Arabic lookup
    if (i18n.language.startsWith('ar')) {
       if (templateDescriptionsAr[normalized]) return templateDescriptionsAr[normalized];
       const lower = normalized.toLowerCase();
       const foundKey = Object.keys(templateDescriptionsAr).find(k => k.toLowerCase() === lower);
       if (foundKey) return templateDescriptionsAr[foundKey];
    }

    // 2. i18n Key Lookup
    let key = templateDescKeys[normalized];
    if (!key) {
      const lower = normalized.toLowerCase();
      const foundKey = Object.keys(templateDescKeys).find(k => k.toLowerCase() === lower);
      if (foundKey) key = templateDescKeys[foundKey];
    }

    if (key) return t(`dashboard.design.themeDescriptions.${key}`);
    
    return t(`dashboard.design.themeDescriptions.${description}`, { defaultValue: description });
  };
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Helper to get category translation with fallback
  const getCategoryLabel = (category: string) => {
    const normalizedCategory = category?.toLowerCase() || 'general';
    const translationKey = `dashboard.templates.categories.${normalizedCategory}`;
    const translated = t(translationKey);
    // If translation returns the key itself, return the original category
    if (translated === translationKey || translated.includes('dashboard.templates.categories')) {
      return category;
    }
    return translated;
  };

  const loadTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const data = await templateService.getTemplates({
        category: selectedCategory || undefined,
        search: searchQuery || undefined,
      });
      console.log('Templates loaded:', data); // Debug log
      setTemplates(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load templates:', error);
      toast({
        title: t('common.error'),
        description: t('dashboard.templates.loadError'),
        variant: 'destructive',
      });
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, searchQuery, toast, t]);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const categories = [
    { value: 'fashion', label: t('dashboard.templates.categories.fashion'), icon: '👗' },
    { value: 'electronics', label: t('dashboard.templates.categories.electronics'), icon: '💻' },
    { value: 'food', label: t('dashboard.templates.categories.food'), icon: '🍽️' },
    { value: 'beauty', label: t('dashboard.templates.categories.beauty'), icon: '💄' },
    { value: 'home', label: t('dashboard.templates.categories.home'), icon: '🏠' },
    { value: 'digital', label: t('dashboard.templates.categories.digital'), icon: '🎮' },
  ];

  const handleUseTemplate = (template: Template) => {
    // Navigate to page builder with template ID as query param
    // Encode template.id to handle special characters like + in base64 IDs
    navigate(`/builder/new?templateId=${encodeURIComponent(template.id)}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                {t('dashboard.templates.title')}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {t('dashboard.templates.subtitle')}
              </p>
            </div>
            <Button
              size="lg"
              onClick={() => navigate('/builder/new')}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all"
            >
              <Plus className="w-5 h-5 mr-2" />
              {t('dashboard.templates.createNew')}
            </Button>
          </div>

          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder={t('dashboard.templates.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 text-lg border-2 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700"
            />
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-3">
            <Button
              variant={selectedCategory === null ? 'default' : 'outline'}
              size="lg"
              onClick={() => setSelectedCategory(null)}
              className={selectedCategory === null ? 'bg-gradient-to-r from-blue-600 to-purple-600' : ''}
            >
              {t('dashboard.templates.allTemplates')}
            </Button>
            {categories.map((cat) => (
              <Button
                key={cat.value}
                variant={selectedCategory === cat.value ? 'default' : 'outline'}
                size="lg"
                onClick={() => setSelectedCategory(cat.value)}
                className={selectedCategory === cat.value ? 'bg-gradient-to-r from-blue-600 to-purple-600' : ''}
              >
                <span className="mr-2">{cat.icon}</span>
                {cat.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Templates Grid */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">{t('dashboard.templates.loading')}</p>
            </div>
          </div>
        ) : templates.length === 0 ? (
          <Card className="text-center py-16">
            <CardContent>
              <div className="text-6xl mb-4">📦</div>
              <h3 className="text-2xl font-semibold mb-2">{t('dashboard.templates.noTemplates')}</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {searchQuery || selectedCategory
                  ? t('dashboard.templates.adjustSearch')
                  : t('dashboard.templates.noTemplatesAvailable')}
              </p>
              <Button onClick={() => navigate('/builder/new')}>
                <Plus className="w-4 h-4 mr-2" />
                {t('dashboard.templates.createCustom')}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => (
              <Card
                key={template.id}
                className="group overflow-hidden hover:shadow-2xl transition-all duration-300 cursor-pointer border-2 hover:border-blue-500 dark:hover:border-blue-400"
                onClick={() => handleUseTemplate(template)}
              >
                {/* Template Thumbnail */}
                <div className={`h-48 relative ${categoryColors[template.category] || 'bg-gradient-to-br from-gray-400 to-gray-600'} overflow-hidden`}>
                  {template.thumbnail ? (
                    <img
                      src={template.thumbnail}
                      alt={template.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white">
                      <div className="text-center">
                        <div className="text-7xl mb-2">{categoryIcons[template.category] || '📄'}</div>
                        <p className="text-sm font-medium opacity-90">{template.category}</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Overlay on Hover */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all duration-300 flex items-center justify-center">
                    <Button
                      size="lg"
                      className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white text-gray-900 hover:bg-gray-100"
                    >
                      <Sparkles className="w-5 h-5 mr-2" />
                      {t('dashboard.templates.useTemplate')}
                    </Button>
                  </div>

                  {/* Official Badge */}
                  {template.isDefault && (
                    <Badge variant="default" className="absolute top-3 right-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg z-10">
                      {t('dashboard.templates.official')}
                    </Badge>
                  )}
                </div>

                {/* Template Info */}
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {getTemplateName(template.name)}
                      </CardTitle>
                      <CardDescription className="mt-2 line-clamp-2">
                        {getTemplateDescription(template.description) || t('dashboard.templates.professionalDesc')}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="capitalize">
                      {categoryIcons[template.category?.toLowerCase()] || '📄'} {getCategoryLabel(template.category)}
                    </Badge>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(template.createdAt).toLocaleDateString(i18n.language === 'ar' ? 'ar-SA' : 'en-US')}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
