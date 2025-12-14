import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Rocket, 
  Gamepad2, 
  MessageSquare, 
  ShoppingBag, 
  Upload, 
  Sparkles, 
  Calendar, 
  CreditCard,
  Check,
  ArrowRight,
  ArrowLeft,
  Store,
  TrendingUp,
  Zap,
  Eye
} from 'lucide-react';
import { SectionRenderer } from '@/components/builder/SectionRenderer';
import { Section } from '@/components/builder/PageBuilder';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from '@/hooks/use-toast';
import { coreApi } from '@/lib/api';

interface MarketCategory {
  id: string;
  name: string;
  nameAr: string;
  icon: React.ElementType;
  description: string;
  descriptionAr: string;
  color: string;
}

const MARKET_CATEGORIES: MarketCategory[] = [
  {
    id: 'gaming',
    name: 'Gaming & PUBG',
    nameAr: 'الألعاب و PUBG',
    icon: Gamepad2,
    description: 'Gaming cards, PUBG UC, game credits',
    descriptionAr: 'بطاقات الألعاب، شدات ببجي، رصيد الألعاب',
    color: 'from-purple-500 to-pink-500',
  },
  {
    id: 'playstation',
    name: 'PlayStation Store',
    nameAr: 'متجر بلايستيشن',
    icon: ShoppingBag,
    description: 'PS Plus, PS Store cards, games',
    descriptionAr: 'بلس بلايستيشن، بطاقات المتجر، الألعاب',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    id: 'communications',
    name: 'Chat & Communications',
    nameAr: 'المحادثات والاتصالات',
    icon: MessageSquare,
    description: 'Recharge cards, chat credits, VoIP',
    descriptionAr: 'بطاقات الشحن، رصيد المحادثات، الاتصالات',
    color: 'from-green-500 to-emerald-500',
  },
];

const REPORT_FREQUENCIES = [
  { value: 'daily', label: 'Daily', labelAr: 'يومي' },
  { value: 'weekly', label: 'Weekly', labelAr: 'أسبوعي' },
  { value: 'monthly', label: 'Monthly', labelAr: 'شهري' },
  { value: 'yearly', label: 'Yearly', labelAr: 'سنوي' },
];

const PAYMENT_GATEWAYS = [
  { id: 'hyperpay', name: 'HyperPay', description: 'Visa, Mastercard, Mada', icon: '💳' },
  { id: 'stripe', name: 'Stripe', description: 'International payments', icon: '🌍' },
  { id: 'paypal', name: 'PayPal', description: 'PayPal payments', icon: '🅿️' },
  { id: 'cod', name: 'Cash on Delivery', description: 'Pay on delivery', icon: '💵' },
];

interface Product {
  id: string;
  name: string;
  price: number;
  images: { url: string }[];
}

interface TemplateSection {
  id?: string;
  type: string;
  data: Record<string, any>;
  styles: Record<string, any>;
}

interface GeneratedTemplate {
  id: string;
  name: string;
  description: string;
  preview: string;
  content: TemplateSection[];
}

export default function PartnerWithUs() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    marketCategory: '',
    storeName: '',
    storeNameAr: '',
    selectedProducts: [] as string[],
    logo: null as File | null,
    logoPreview: '',
    selectedTemplate: '',
    reportFrequency: 'monthly',
    paymentGateways: [] as string[],
  });

  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [generatedTemplates, setGeneratedTemplates] = useState<GeneratedTemplate[]>([]);
  const [previewTemplate, setPreviewTemplate] = useState<GeneratedTemplate | null>(null);

  const totalSteps = 7;

  const handleCategorySelect = async (categoryId: string) => {
    setFormData({ ...formData, marketCategory: categoryId });
    
    // Fetch products for this category
    try {
      console.log('🔍 Fetching products for category:', categoryId);
      const products = await coreApi.getProducts({ categoryId, limit: 100, market: true });
      console.log('📦 Received products:', products);
      const productList = Array.isArray(products) ? products : (products as any).data || [];
      console.log('📦 Product list:', productList);
      setAvailableProducts(productList);
    } catch (error) {
      console.error('Failed to load products:', error);
      toast({
        title: 'تعذر تحميل المنتجات',
        description: 'حدث خطأ أثناء تحميل المنتجات. يرجى المحاولة مرة أخرى.',
        variant: 'destructive',
      });
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFormData({ 
      ...formData, 
      logo: file,
      logoPreview: URL.createObjectURL(file)
    });
  };

  const generateAiTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const category = MARKET_CATEGORIES.find(c => c.id === formData.marketCategory);
      const categoryName = category ? category.name : 'E-commerce';
      const categoryNameAr = category ? category.nameAr : 'التجارة الإلكترونية';
      
      
      const prompt = `Create a professional ${categoryName} e-commerce website for "${formData.storeName}" (${formData.storeNameAr}).

BUSINESS: ${formData.storeName} - ${categoryName} store
PRODUCTS: ${formData.selectedProducts.length > 0 ? `${formData.selectedProducts.length} products` : 'Digital products'}
BRANDING: ${formData.logo ? 'Custom logo' : 'Modern professional'}

REQUIREMENTS:
- Stunning conversion-optimized design
- Prominent ${categoryName} product showcases
- Trust elements (testimonials, stats)
- Clear CTAs, mobile-responsive
- High-quality Unsplash images

TARGET: ${categoryName} enthusiasts
STYLE: Professional, modern, trustworthy

CRITICAL: Create 3 DISTINCT variations:
1. Bold & Vibrant - Strong colors, dynamic
2. Clean & Minimal - Elegant, subtle
3. Modern & Premium - Gradients, luxury`;

      console.log('🤖 Generating AI templates with prompt:', prompt);

      const response = await coreApi.post('/templates/ai/generate-variations', {
        vision: prompt,
        businessType: categoryName,
        category: 'product'
      }, { requireAuth: true });

      if (Array.isArray(response)) {
        setGeneratedTemplates(response.map((item: { template: any }, index: number) => ({
          id: `ai-generated-${index}`,
          name: item.template.name || `AI Template ${index + 1}`,
          description: item.template.description,
          preview: item.template.thumbnail || '/placeholder-template.jpg',
          content: item.template.content // Store full content
        })));
      } else {
        // Fallback or single result handling
        const templates = (response as any).variations || [(response as any).template];
        setGeneratedTemplates(templates.map((t: any, index: number) => ({
          id: `ai-generated-${index}`,
          name: t.name || `AI Template ${index + 1}`,
          description: t.description,
          preview: t.thumbnail || '/placeholder-template.jpg',
          content: t.content
        })));
      }
      
      toast({
        title: 'تم إنشاء القوالب بنجاح',
        description: `تم إنشاء 3 قوالب احترافية مخصصة لمتجر ${formData.storeName}`,
      });
    } catch (error) {
      console.error('Failed to generate templates:', error);
      toast({
        title: 'Note',
        description: 'Using default templates (AI generation unavailable)',
        variant: 'default',
      });
      // Fallback to default templates if AI fails
      const mockContent: TemplateSection[] = [
        { type: 'header', data: { logo: 'Store Name', links: [{ label: 'Home', url: '/' }, { label: 'Products', url: '/products' }] }, styles: { padding: '20px', background: '#fff' } },
        { type: 'hero', data: { title: 'Welcome' }, styles: { padding: '4rem', textAlign: 'center' } },
        { type: 'features', data: { items: [] }, styles: { background: '#f5f5f5', padding: '4rem' } },
        { type: 'products-grid', data: { title: 'Featured Products', count: 4 }, styles: { padding: '4rem' } },
        { type: 'testimonials', data: { items: [] }, styles: { padding: '4rem' } },
        { type: 'footer', data: { copyright: '© 2024 Store' }, styles: { padding: '2rem', background: '#000', color: '#fff' } }
      ];

      setGeneratedTemplates([
        { 
          id: 'modern', 
          name: 'Modern Gamer', 
          preview: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=500&q=80', 
          description: 'Bold and energetic design',
          content: mockContent
        },
        { 
          id: 'classic', 
          name: 'Digital Classic', 
          preview: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=500&q=80', 
          description: 'Clean and professional layout',
          content: mockContent
        },
        { 
          id: 'minimal', 
          name: 'Tech Minimal', 
          preview: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=500&q=80', 
          description: 'Simple and focused on products',
          content: mockContent
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [formData.marketCategory, formData.storeName, toast]);

  // Generate templates when entering Step 5
  useEffect(() => {
    if (currentStep === 5 && generatedTemplates.length === 0) {
      generateAiTemplates();
    }
  }, [currentStep, generatedTemplates.length, generateAiTemplates]);

  const handleProductToggle = (productId: string) => {
    const selected = formData.selectedProducts.includes(productId);
    setFormData({
      ...formData,
      selectedProducts: selected
        ? formData.selectedProducts.filter(id => id !== productId)
        : [...formData.selectedProducts, productId],
    });
  };

  const handlePaymentGatewayToggle = (gatewayId: string) => {
    const selected = formData.paymentGateways.includes(gatewayId);
    setFormData({
      ...formData,
      paymentGateways: selected
        ? formData.paymentGateways.filter(id => id !== gatewayId)
        : [...formData.paymentGateways, gatewayId],
    });
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Upload logo
      let logoUrl = '';
      if (formData.logo) {
        const logoFormData = new FormData();
        logoFormData.append('files', formData.logo);
        const uploadRes = await coreApi.post('/upload/images', logoFormData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          requireAuth: true,
        });
        logoUrl = uploadRes.files?.[0]?.secureUrl || uploadRes.files?.[0]?.url || '';
      }

      // Create marketplace
      const selectedTemplateObj = generatedTemplates.find(t => t.id === formData.selectedTemplate);

      const marketplaceData = {
        name: formData.storeName,
        nameAr: formData.storeNameAr,
        category: formData.marketCategory,
        products: formData.selectedProducts,
        logo: logoUrl,
        template: formData.selectedTemplate,
        templateContent: selectedTemplateObj?.content,
        reportFrequency: formData.reportFrequency,
        paymentGateways: formData.paymentGateways,
      };

      await coreApi.post('/partner/marketplace', marketplaceData, { requireAuth: true });

      toast({
        title: 'نجح! 🎉',
        description: 'تم إنشاء متجرك بنجاح',
      });

      // Completion is now tracked on backend automatically

      // Redirect to dashboard
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (error) {
      console.error('Failed to create marketplace:', error);
      toast({
        title: 'تعذر إنشاء المتجر',
        description: 'حدث خطأ أثناء إنشاء المتجر. يرجى المحاولة مرة أخرى.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-2">مرحباً بك في برنامج الشراكة مع ASUS</h2>
              <p className="text-gray-600 dark:text-gray-400">
                ابدأ رحلتك في التجارة الإلكترونية معنا
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {MARKET_CATEGORIES.map((category) => {
                const Icon = category.icon;
                const isSelected = formData.marketCategory === category.id;
                
                return (
                  <Card
                    key={category.id}
                    className={`cursor-pointer transition-all duration-300 hover:shadow-xl ${
                      isSelected ? 'ring-2 ring-primary shadow-lg scale-105' : ''
                    }`}
                    onClick={() => handleCategorySelect(category.id)}
                  >
                    <CardHeader>
                      <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${category.color} flex items-center justify-center mb-4`}>
                        <Icon className="h-8 w-8 text-white" />
                      </div>
                      <CardTitle className="text-xl">{category.nameAr}</CardTitle>
                      <CardDescription>{category.descriptionAr}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {isSelected && (
                        <div className="flex items-center gap-2 text-primary">
                          <Check className="h-5 w-5" />
                          <span className="font-medium">تم الاختيار</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <Store className="h-16 w-16 mx-auto mb-4 text-primary" />
              <h2 className="text-3xl font-bold mb-2">معلومات المتجر</h2>
              <p className="text-gray-600 dark:text-gray-400">
                أدخل اسم متجرك
              </p>
            </div>

            <Card>
              <CardContent className="pt-6 space-y-4">
                <div>
                  <Label htmlFor="storeName">اسم المتجر (English)</Label>
                  <Input
                    id="storeName"
                    value={formData.storeName}
                    onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                    placeholder="My Gaming Store"
                    className="text-lg"
                  />
                </div>
                <div>
                  <Label htmlFor="storeNameAr">اسم المتجر (العربية)</Label>
                  <Input
                    id="storeNameAr"
                    value={formData.storeNameAr}
                    onChange={(e) => setFormData({ ...formData, storeNameAr: e.target.value })}
                    placeholder="متجر الألعاب"
                    className="text-lg"
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );

      case 3:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <ShoppingBag className="h-16 w-16 mx-auto mb-4 text-primary" />
              <h2 className="text-3xl font-bold mb-2">اختر المنتجات</h2>
              <p className="text-gray-600 dark:text-gray-400">
                اختر المنتجات التي تريد بيعها في متجرك
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-4 max-h-[500px] overflow-y-auto">
              {availableProducts.map((product) => {
                const isSelected = formData.selectedProducts.includes(product.id);
                
                return (
                  <Card
                    key={product.id}
                    className={`cursor-pointer transition-all ${
                      isSelected ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => handleProductToggle(product.id)}
                  >
                    <CardContent className="p-4">
                      {product.images?.[0] && (
                        <img
                          src={product.images[0].url}
                          alt={product.name}
                          className="w-full h-32 object-cover rounded-lg mb-3"
                        />
                      )}
                      <h3 className="font-semibold mb-1">{product.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {product.price} ر.س
                      </p>
                      {isSelected && (
                        <div className="flex items-center gap-2 text-primary text-sm">
                          <Check className="h-4 w-4" />
                          <span>محدد</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="text-center text-sm text-gray-600">
              تم اختيار {formData.selectedProducts.length} منتج
            </div>
          </motion.div>
        );

      case 4:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <Upload className="h-16 w-16 mx-auto mb-4 text-primary" />
              <h2 className="text-3xl font-bold mb-2">شعار المتجر</h2>
              <p className="text-gray-600 dark:text-gray-400">
                ارفع شعار متجرك
              </p>
            </div>

            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center gap-4">
                  {formData.logoPreview ? (
                    <div className="relative">
                      <img
                        src={formData.logoPreview}
                        alt="Logo preview"
                        className="w-48 h-48 object-contain rounded-lg border-2 border-dashed border-gray-300"
                      />
                      <Button
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => setFormData({ ...formData, logo: null, logoPreview: '' })}
                      >
                        حذف
                      </Button>
                    </div>
                  ) : (
                    <label className="w-48 h-48 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors">
                      <Upload className="h-12 w-12 text-gray-400 mb-2" />
                      <span className="text-sm text-gray-600">انقر لرفع الشعار</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleLogoUpload}
                      />
                    </label>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );

      case 5:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <Sparkles className="h-16 w-16 mx-auto mb-4 text-primary" />
              <h2 className="text-3xl font-bold mb-2">اختر القالب</h2>
              <p className="text-gray-600 dark:text-gray-400">
                قوالب مصممة بالذكاء الاصطناعي خصيصاً لمتجرك
              </p>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mb-4"></div>
                <p className="text-gray-600">جاري إنشاء القوالب بالذكاء الاصطناعي...</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-3 gap-6">
                {generatedTemplates.map((template) => {
                  const isSelected = formData.selectedTemplate === template.id;
                  
                  return (
                    <Card
                      key={template.id}
                      className={`cursor-pointer transition-all relative group ${
                        isSelected ? 'ring-2 ring-primary shadow-lg' : ''
                      }`}
                      onClick={() => setFormData({ ...formData, selectedTemplate: template.id })}
                    >
                      <CardContent className="p-4">
                        <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-lg mb-3 flex items-center justify-center relative overflow-hidden">
                          {template.preview && template.preview.startsWith('http') ? (
                            <img src={template.preview} alt={template.name} className="w-full h-full object-cover" />
                          ) : (
                            <Zap className="h-12 w-12 text-gray-400" />
                          )}
                          
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Button 
                              variant="secondary" 
                              size="sm"
                              className="gap-2"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPreviewTemplate(template);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                              معاينة
                            </Button>
                          </div>
                        </div>
                        <h3 className="font-semibold text-center">{template.name}</h3>
                        {isSelected && (
                          <div className="flex items-center justify-center gap-2 text-primary mt-2">
                            <Check className="h-4 w-4" />
                            <span className="text-sm">محدد</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </motion.div>
        );

      case 6:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <Calendar className="h-16 w-16 mx-auto mb-4 text-primary" />
              <h2 className="text-3xl font-bold mb-2">التقارير</h2>
              <p className="text-gray-600 dark:text-gray-400">
                اختر تكرار استلام التقارير
              </p>
            </div>

            <Card>
              <CardContent className="pt-6">
                <RadioGroup
                  value={formData.reportFrequency}
                  onValueChange={(value) => setFormData({ ...formData, reportFrequency: value })}
                >
                  {REPORT_FREQUENCIES.map((freq) => (
                    <div key={freq.value} className="flex items-center space-x-2 space-x-reverse p-4 border rounded-lg mb-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <RadioGroupItem value={freq.value} id={freq.value} />
                      <Label htmlFor={freq.value} className="flex-1 cursor-pointer">
                        <div className="font-medium">{freq.labelAr}</div>
                        <div className="text-sm text-gray-600">{freq.label}</div>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </CardContent>
            </Card>
          </motion.div>
        );

      case 7:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <CreditCard className="h-16 w-16 mx-auto mb-4 text-primary" />
              <h2 className="text-3xl font-bold mb-2">بوابات الدفع</h2>
              <p className="text-gray-600 dark:text-gray-400">
                اختر بوابات الدفع المتاحة لعملائك
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {PAYMENT_GATEWAYS.map((gateway) => {
                const isSelected = formData.paymentGateways.includes(gateway.id);
                
                return (
                  <Card
                    key={gateway.id}
                    className={`cursor-pointer transition-all ${
                      isSelected ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => handlePaymentGatewayToggle(gateway.id)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="text-4xl">{gateway.icon}</div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{gateway.name}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {gateway.description}
                          </p>
                        </div>
                        {isSelected && (
                          <Check className="h-6 w-6 text-primary" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="text-center text-sm text-gray-600">
              تم اختيار {formData.paymentGateways.length} بوابة دفع
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.marketCategory !== '';
      case 2:
        return formData.storeName !== '' && formData.storeNameAr !== '';
      case 3:
        return formData.selectedProducts.length > 0;
      case 4:
        return formData.logo !== null;
      case 5:
        return formData.selectedTemplate !== '';
      case 6:
        return formData.reportFrequency !== '';
      case 7:
        return formData.paymentGateways.length > 0;
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-12">
      <div className="container max-w-6xl mx-auto px-4">
        {/* Progress Bar */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-4">
            {Array.from({ length: totalSteps }).map((_, index) => (
              <div
                key={index}
                className={`flex-1 h-2 rounded-full mx-1 transition-all ${
                  index + 1 <= currentStep
                    ? 'bg-gradient-to-r from-primary to-purple-600'
                    : 'bg-gray-200 dark:bg-gray-700'
                }`}
              />
            ))}
          </div>
          <div className="text-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              الخطوة {currentStep} من {totalSteps}
            </span>
          </div>
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          {renderStep()}
        </AnimatePresence>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-12">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            السابق
          </Button>

          {currentStep === totalSteps ? (
            <Button
              onClick={handleSubmit}
              disabled={!canProceed() || loading}
              className="gap-2 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-700"
              size="lg"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  جاري الإنشاء...
                </>
              ) : (
                <>
                  <Rocket className="h-5 w-5" />
                  إطلاق المتجر
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              disabled={!canProceed()}
              className="gap-2"
              size="lg"
            >
              التالي
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>


        {/* Template Preview Dialog */}
        <Dialog open={!!previewTemplate} onOpenChange={(open) => !open && setPreviewTemplate(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{previewTemplate?.name}</DialogTitle>
              <DialogDescription>{previewTemplate?.description}</DialogDescription>
            </DialogHeader>
            <div className="mt-4 space-y-6">
              <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                {previewTemplate?.preview && previewTemplate.preview.startsWith('http') ? (
                  <img src={previewTemplate.preview} alt={previewTemplate.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Zap className="h-24 w-24 text-gray-300" />
                  </div>
                )}
              </div>
              
              <div>
                <h4 className="font-semibold mb-3 text-lg">معاينة القالب:</h4>
                <div className="border rounded-lg overflow-hidden bg-white dark:bg-gray-950 max-h-[600px] overflow-y-auto">
                  {previewTemplate?.content?.map((section: TemplateSection, idx: number) => {
                    // Map AI template section to PageBuilder Section format
                    const builderSection: Section = {
                      id: section.id || `preview-section-${idx}`,
                      type: section.type,
                      props: { ...section.data, ...section.styles }
                    };
                    
                    return (
                      <div key={idx} className="relative">
                        <SectionRenderer section={builderSection} />
                      </div>
                    );
                  })}
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button onClick={() => {
                  setFormData({ ...formData, selectedTemplate: previewTemplate.id });
                  setPreviewTemplate(null);
                }}>
                  اختيار هذا القالب
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
