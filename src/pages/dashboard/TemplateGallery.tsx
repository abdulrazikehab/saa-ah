import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Check, Eye, Palette, Sparkles } from 'lucide-react';

interface Template {
  id: string;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  image: string;
  colors: string[];
  features: string[];
  popular: boolean;
}

const templates = [
  {
    id: 'digital-cards',
    name: 'Digital Cards',
    nameAr: 'البطاقات الرقمية',
    description: 'Complete digital cards marketplace with wallet, store, orders, and favorites',
    descriptionAr: 'سوق بطاقات رقمية متكامل مع المحفظة والمتجر والطلبات والمفضلة',
    image: '/templates/digital-cards.png',
    colors: ['#0066CC', '#00CC66', '#FFB800'],
    features: ['محفظة', 'متجر', 'طلبات', 'مفضلة'],
    popular: true,
  },
  {
    id: 'modern',
    name: 'Modern',
    nameAr: 'عصري',
    description: 'Clean and minimalist design with focus on products',
    descriptionAr: 'تصميم نظيف وبسيط مع التركيز على المنتجات',
    image: '/templates/modern.png',
    colors: ['#3B82F6', '#10B981', '#F59E0B'],
    features: ['تصميم نظيف', 'سهل التصفح', 'متجاوب'],
    popular: true,
  },
  {
    id: 'classic',
    name: 'Classic',
    nameAr: 'كلاسيكي',
    description: 'Traditional e-commerce layout with proven conversion',
    descriptionAr: 'تخطيط تجارة إلكترونية تقليدي مع معدل تحويل مثبت',
    image: '/templates/classic.png',
    colors: ['#1F2937', '#DC2626', '#FBBF24'],
    features: ['موثوق', 'احترافي', 'سهل الاستخدام'],
    popular: false,
  },
  {
    id: 'elegant',
    name: 'Elegant',
    nameAr: 'أنيق',
    description: 'Sophisticated design for luxury brands',
    descriptionAr: 'تصميم راقٍ للعلامات التجارية الفاخرة',
    image: '/templates/elegant.png',
    colors: ['#000000', '#D4AF37', '#FFFFFF'],
    features: ['فاخر', 'راقي', 'أنيق'],
    popular: false,
  },
  {
    id: 'tech',
    name: 'Tech',
    nameAr: 'تقني',
    description: 'Modern tech-focused design with dark mode',
    descriptionAr: 'تصميم تقني حديث مع الوضع الداكن',
    image: '/templates/tech.png',
    colors: ['#0EA5E9', '#6366F1', '#14B8A6'],
    features: ['تقني', 'حديث', 'مبتكر'],
    popular: false,
  },
];

export default function TemplateGallery() {
  const { toast } = useToast();
  const [selectedTemplate, setSelectedTemplate] = useState<string>('modern');
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handlePreview = (template: Template) => {
    setPreviewTemplate(template);
    setDialogOpen(true);
  };

  const handleApplyTemplate = (templateId: string) => {
    setSelectedTemplate(templateId);
    setDialogOpen(false);
    toast({
      title: 'تم التطبيق',
      description: `تم تطبيق قالب ${templates.find(t => t.id === templateId)?.nameAr}`,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          معرض القوالب
        </h1>
        <p className="text-muted-foreground text-lg">اختر قالباً لمتجرك من مجموعتنا المتنوعة</p>
      </div>

      {/* Current Template */}
      <Card className="border-primary">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                القالب الحالي
              </CardTitle>
              <CardDescription>القالب المستخدم حالياً في متجرك</CardDescription>
            </div>
            <Badge variant="default" className="gap-1">
              <Check className="h-3 w-3" />
              نشط
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="w-32 h-32 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <Sparkles className="h-12 w-12 text-primary" />
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-1">
                {templates.find(t => t.id === selectedTemplate)?.nameAr}
              </h3>
              <p className="text-muted-foreground mb-3">
                {templates.find(t => t.id === selectedTemplate)?.descriptionAr}
              </p>
              <div className="flex gap-2">
                {templates.find(t => t.id === selectedTemplate)?.colors.map((color, i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full border-2 border-background shadow-sm"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Template Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <Card
            key={template.id}
            className={`overflow-hidden transition-all hover:shadow-lg ${
              template.id === selectedTemplate ? 'ring-2 ring-primary' : ''
            }`}
          >
            <CardHeader className="relative">
              {template.popular && (
                <Badge className="absolute top-4 left-4 z-10">
                  <Sparkles className="h-3 w-3 ml-1" />
                  الأكثر شعبية
                </Badge>
              )}
              {template.id === selectedTemplate && (
                <Badge variant="default" className="absolute top-4 right-4 z-10">
                  <Check className="h-3 w-3 ml-1" />
                  نشط
                </Badge>
              )}
              <div className="aspect-video rounded-lg bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br opacity-50"
                  style={{
                    background: `linear-gradient(135deg, ${template.colors[0]}, ${template.colors[1]})`
                  }}
                />
                <Palette className="h-16 w-16 text-white relative z-10" />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <h3 className="text-xl font-bold mb-1">{template.nameAr}</h3>
                <p className="text-sm text-muted-foreground">{template.descriptionAr}</p>
              </div>
              <div className="flex gap-2">
                {template.colors.map((color, i) => (
                  <div
                    key={i}
                    className="w-6 h-6 rounded-full border-2 border-background shadow-sm"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                {template.features.map((feature, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {feature}
                  </Badge>
                ))}
              </div>
            </CardContent>
            <CardFooter className="gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => handlePreview(template)}
              >
                <Eye className="h-4 w-4 ml-2" />
                معاينة
              </Button>
              {template.id !== selectedTemplate && (
                <Button
                  className="flex-1"
                  onClick={() => handleApplyTemplate(template.id)}
                >
                  تطبيق
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Preview Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              معاينة قالب {previewTemplate?.nameAr}
            </DialogTitle>
            <DialogDescription>
              {previewTemplate?.descriptionAr}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="aspect-video rounded-lg bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br opacity-50"
                style={{
                  background: previewTemplate ? `linear-gradient(135deg, ${previewTemplate.colors[0]}, ${previewTemplate.colors[1]})` : ''
                }}
              />
              <div className="relative z-10 text-center text-white">
                <Palette className="h-24 w-24 mx-auto mb-4" />
                <h3 className="text-3xl font-bold mb-2">{previewTemplate?.nameAr}</h3>
                <p className="text-lg opacity-90">{previewTemplate?.descriptionAr}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2">الألوان الرئيسية</h4>
                <div className="flex gap-2">
                  {previewTemplate?.colors.map((color: string, i: number) => (
                    <div key={i} className="flex-1">
                      <div
                        className="w-full h-16 rounded-lg border-2 border-background shadow-sm"
                        style={{ backgroundColor: color }}
                      />
                      <p className="text-xs text-center mt-1 font-mono">{color}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-2">المميزات</h4>
                <div className="flex flex-wrap gap-2">
                  {previewTemplate?.features.map((feature: string, i: number) => (
                    <Badge key={i} variant="secondary">
                      {feature}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              إغلاق
            </Button>
            {previewTemplate?.id !== selectedTemplate && (
              <Button onClick={() => handleApplyTemplate(previewTemplate?.id)}>
                <Check className="h-4 w-4 ml-2" />
                تطبيق هذا القالب
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
