import { useState, useEffect, useCallback } from 'react';
import { themeService } from '@/services/theme.service';
import { coreApi } from '@/lib/api';
import { Theme } from '@/services/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Palette, Loader2, Eye, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export default function ThemesStore() {
  const { t, i18n } = useTranslation();
  const [themes, setThemes] = useState<Theme[]>([]);
  const [loading, setLoading] = useState(true);
  const [domain, setDomain] = useState('');
  const { toast } = useToast();
  const [showAIDialog, setShowAIDialog] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);

  // Mapping for theme names to translation keys
  const themeNameKeys: Record<string, string> = {
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

  // Mapping for theme descriptions to translation keys
  const themeDescKeys: Record<string, string> = {
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
  const themeNamesAr: Record<string, string> = {
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

  const themeDescriptionsAr: Record<string, string> = {
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

  // Helper function to get translated theme name
  const getThemeName = (name: string) => {
    if (!name) return '';
    const normalized = name.trim();

    // 1. Direct Arabic lookup if language is Arabic
    if (i18n.language.startsWith('ar')) {
      // Try exact match
      if (themeNamesAr[normalized]) return themeNamesAr[normalized];
      // Try case-insensitive
      const lower = normalized.toLowerCase();
      const foundKey = Object.keys(themeNamesAr).find(k => k.toLowerCase() === lower);
      if (foundKey) return themeNamesAr[foundKey];
      // Try HTML entity fix
      if (normalized.includes('&')) {
         const decoded = normalized.replace(/&amp;/g, '&');
         if (themeNamesAr[decoded]) return themeNamesAr[decoded];
      }
    }
    
    // 2. i18n Key Lookup (Existing logic)
    let key = themeNameKeys[normalized];
    if (!key) {
      const lower = normalized.toLowerCase();
      const foundKey = Object.keys(themeNameKeys).find(k => k.toLowerCase() === lower);
      if (foundKey) key = themeNameKeys[foundKey];
    }
    if (!key && normalized.includes('&')) {
       const decoded = normalized.replace(/&amp;/g, '&');
       key = themeNameKeys[decoded];
    }

    if (key) return t(`dashboard.design.themes.${key}`);
    
    return t(`dashboard.design.themes.${name}`, { defaultValue: name });
  };

  // Helper function to get translated theme description
  const getThemeDescription = (description: string) => {
    if (!description) return '';
    const normalized = description.trim();

    // 1. Direct Arabic lookup
    if (i18n.language.startsWith('ar')) {
       if (themeDescriptionsAr[normalized]) return themeDescriptionsAr[normalized];
       const lower = normalized.toLowerCase();
       const foundKey = Object.keys(themeDescriptionsAr).find(k => k.toLowerCase() === lower);
       if (foundKey) return themeDescriptionsAr[foundKey];
    }

    // 2. i18n Key Lookup
    let key = themeDescKeys[normalized];
    if (!key) {
      const lower = normalized.toLowerCase();
      const foundKey = Object.keys(themeDescKeys).find(k => k.toLowerCase() === lower);
      if (foundKey) key = themeDescKeys[foundKey];
    }

    if (key) return t(`dashboard.design.themeDescriptions.${key}`);
    
    return t(`dashboard.design.themeDescriptions.${description}`, { defaultValue: description });
  };

  const loadDomain = useCallback(async () => {
    try {
      const domainData = await coreApi.getDomain();
      if (domainData) {
        // Use custom domain if available, otherwise use subdomain
        const storefrontDomain = domainData.customDomain || `${domainData.subdomain}.localhost:8080`;
        console.log('📍 Storefront domain:', storefrontDomain);
        setDomain(storefrontDomain);
      }
    } catch (error) {
      console.error('Failed to fetch domain:', error);
    }
  }, []);

  const loadThemes = useCallback(async () => {
    try {
      console.log('Loading themes...');
      const data = await themeService.getThemes();
      console.log('Themes received:', data);
      setThemes(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load themes:', error);
      setThemes([]);
      toast({
        title: t('dashboard.design.error'),
        description: t('dashboard.design.loadError'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast, t]);

  useEffect(() => {
    loadThemes();
    loadDomain();
  }, [loadThemes, loadDomain]);

  const handleActivate = async (id: string) => {
    try {
      await themeService.activateTheme(id);
      toast({ 
        title: t('dashboard.design.activateSuccess'), 
        description: t('dashboard.design.activateSuccessDesc') 
      });
      
      // Optimistic update
      setThemes(themes.map(t => ({
        ...t,
        isActive: t.id === id
      })));
      
      loadThemes();
    } catch (error) {
      toast({ 
        title: t('dashboard.design.error'), 
        description: t('dashboard.design.activateError'), 
        variant: 'destructive' 
      });
    }
  };

  const handleGenerateAITheme = async () => {
    if (!aiPrompt.trim()) {
      toast({ 
        title: t('dashboard.design.error'), 
        description: t('dashboard.design.enterPrompt'), 
        variant: 'destructive' 
      });
      return;
    }

    setAiGenerating(true);
    try {
      await coreApi.post('/themes/ai/generate', {
        prompt: aiPrompt,
        style: 'professional and modern'
      }, { requireAuth: true });

      toast({ 
        title: t('dashboard.design.themeGenerated'), 
        description: t('dashboard.design.themeGeneratedDesc') 
      });
      
      setShowAIDialog(false);
      setAiPrompt('');
      loadThemes();
    } catch (error) {
      console.error('Failed to generate AI theme:', error);
      toast({ 
        title: t('dashboard.design.error'), 
        description: t('dashboard.design.generateError'), 
        variant: 'destructive' 
      });
    } finally {
      setAiGenerating(false);
    }
  };

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin h-8 w-8" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{t('dashboard.design.title')}</h1>
          <p className="text-gray-500">{t('dashboard.design.subtitle')}</p>
        </div>
        <Button onClick={() => setShowAIDialog(true)} className="gap-2">
          <Sparkles className="w-4 h-4" />
          {t('dashboard.design.generateAI')}
        </Button>
      </div>

      {themes.length === 0 && !loading ? (
        <div className="text-center py-12">
          <Palette className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold mb-2">{t('dashboard.design.noThemes')}</h3>
          <p className="text-gray-500 mb-4">
            {t('dashboard.design.seedHint')}
          </p>
          <code className="bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded">
            node prisma/seed-theme.js
          </code>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {themes.map((theme) => (
          <Card key={theme.id} className={`transition-all ${theme.isActive ? 'border-primary border-2 shadow-md' : 'hover:shadow-md'}`}>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                {getThemeName(theme.name)}
                {theme.isActive && <Badge className="bg-green-500">{t('dashboard.design.active')}</Badge>}
              </CardTitle>
              <CardDescription>{getThemeDescription(theme.description || '')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-40 bg-gray-100 dark:bg-gray-800 rounded-md flex items-center justify-center">
                <Palette className="h-10 w-10 text-gray-400" />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-2">
              {theme.isActive ? (
                <Button disabled className="w-full variant-secondary">
                  <Check className="mr-2 h-4 w-4" /> {t('dashboard.design.active')}
                </Button>
              ) : (
                <Button onClick={() => handleActivate(theme.id)} className="w-full">
                  {t('dashboard.design.activate')}
                </Button>
              )}
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => {
                  // Build correct preview URL
                  let previewUrl = '';
                  
                  if (domain) {
                    // Use the tenant domain
                    previewUrl = `http://${domain}/?theme_preview=${theme.id}`;
                  } else {
                    // Fallback to current origin
                    previewUrl = `${window.location.origin}/?theme_preview=${theme.id}`;
                  }
                  
                  console.log('🎨 Opening theme preview:', previewUrl);
                  window.open(previewUrl, '_blank');
                }}
              >
                <Eye className="mr-2 h-4 w-4" /> {t('dashboard.design.preview')}
              </Button>
            </CardFooter>
          </Card>
        ))}
        </div>
      )}

      {/* AI Theme Generation Dialog */}
      <Dialog open={showAIDialog} onOpenChange={setShowAIDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              {t('dashboard.design.aiDialogTitle')}
            </DialogTitle>
            <DialogDescription>
              {t('dashboard.design.aiDialogDesc')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="ai-prompt">{t('dashboard.design.themeDesc')}</Label>
              <Textarea
                id="ai-prompt"
                placeholder={t('dashboard.design.themeDescPlaceholder')}
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                rows={6}
                className="mt-2"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAIDialog(false)} disabled={aiGenerating}>
                {t('common.cancel')}
              </Button>
              <Button onClick={handleGenerateAITheme} disabled={aiGenerating} className="gap-2">
                {aiGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t('dashboard.design.generating')}
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    {t('dashboard.design.generateTheme')}
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
