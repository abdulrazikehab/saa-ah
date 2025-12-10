import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, Globe, Palette, Check, ArrowRight, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { coreApi } from '@/lib/api';
import { useTranslation } from 'react-i18next';

interface MarketSetupData {
  storeName: string;
  description: string;
  subdomain: string;
  customDomain?: string;
  template: string;
}

export default function MarketSetup() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<MarketSetupData>({
    storeName: '',
    description: '',
    subdomain: '',
    customDomain: '',
    template: 'modern'
  });

  const steps = [
    { number: 1, title: t('marketSetup.steps.storeInfo', 'Store Info'), icon: Store },
    { number: 2, title: t('marketSetup.steps.domain', 'Domain'), icon: Globe },
    { number: 3, title: t('marketSetup.steps.template', 'Template'), icon: Palette }
  ];

  const templates = [
    {
      id: 'modern',
      name: t('marketSetup.templates.modern.name', 'Modern'),
      description: t('marketSetup.templates.modern.desc', 'Clean and modern design'),
      preview: '/templates/modern.jpg'
    },
    {
      id: 'minimal',
      name: t('marketSetup.templates.minimal.name', 'Minimal'),
      description: t('marketSetup.templates.minimal.desc', 'Simple and elegant design'),
      preview: '/templates/minimal.jpg'
    },
    {
      id: 'bold',
      name: t('marketSetup.templates.bold.name', 'Bold'),
      description: t('marketSetup.templates.bold.desc', 'Bold and striking design'),
      preview: '/templates/bold.jpg'
    }
  ];

  const handleInputChange = (field: keyof MarketSetupData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    // Validation
    if (currentStep === 1) {
      if (!formData.storeName.trim()) {
        toast({
          title: t('common.error', 'Error'),
          description: t('marketSetup.validation.storeName', 'Please enter store name'),
          variant: 'destructive'
        });
        return;
      }
    }
    
    if (currentStep === 2) {
      if (!formData.subdomain.trim()) {
        toast({
          title: t('common.error', 'Error'),
          description: t('marketSetup.validation.subdomain', 'Please enter subdomain'),
          variant: 'destructive'
        });
        return;
      }
      // Validate subdomain format
      if (!/^[a-z0-9-]+$/.test(formData.subdomain)) {
        toast({
          title: t('common.error', 'Error'),
          description: t('marketSetup.validation.subdomainFormat', 'Subdomain must contain only lowercase letters, numbers, and hyphens'),
          variant: 'destructive'
        });
        return;
      }
    }

    if (currentStep < 3) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Call backend API to create tenant/market
      await coreApi.setupMarket({
        name: formData.storeName,
        description: formData.description,
        subdomain: formData.subdomain,
        customDomain: formData.customDomain,
        template: formData.template
      });

      toast({
        title: t('marketSetup.success.title', 'Store Created Successfully!'),
        description: t('marketSetup.success.desc', 'You will be redirected to the dashboard'),
      });

      // Redirect to dashboard
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (error: any) {
      toast({
        title: t('marketSetup.error.title', 'Failed to Create Store'),
        description: error.message || t('marketSetup.error.desc', 'An error occurred while creating the store'),
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl">
        <CardHeader>
          <CardTitle className="text-3xl text-center">{t('marketSetup.title', 'Create Your Online Store')}</CardTitle>
          <CardDescription className="text-center text-lg">
            {t('marketSetup.subtitle', 'Follow the steps to set up your store in minutes')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Progress Steps */}
          <div className="flex justify-between mb-12">
            {steps.map((step) => (
              <div key={step.number} className="flex flex-col items-center flex-1">
                <div className={`
                  w-12 h-12 rounded-full flex items-center justify-center mb-2
                  ${currentStep >= step.number 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted text-muted-foreground'}
                  transition-colors
                `}>
                  {currentStep > step.number ? (
                    <Check className="h-6 w-6" />
                  ) : (
                    <step.icon className="h-6 w-6" />
                  )}
                </div>
                <span className={`text-sm font-medium ${currentStep >= step.number ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {step.title}
                </span>
                {step.number < steps.length && (
                  <div className={`h-0.5 w-full mt-6 -mr-full ${currentStep > step.number ? 'bg-primary' : 'bg-muted'}`} />
                )}
              </div>
            ))}
          </div>

          {/* Step Content */}
          <div className="min-h-[400px]">
            {/* Step 1: Store Information */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div>
                  <Label htmlFor="storeName">{t('marketSetup.storeName', 'Store Name')} *</Label>
                  <Input
                    id="storeName"
                    placeholder={t('marketSetup.storeNamePlaceholder', 'e.g. Electronics Store')}
                    value={formData.storeName}
                    onChange={(e) => handleInputChange('storeName', e.target.value)}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="description">{t('marketSetup.storeDesc', 'Store Description')}</Label>
                  <Textarea
                    id="description"
                    placeholder={t('marketSetup.storeDescPlaceholder', 'Write a short description about your store...')}
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    className="mt-2 min-h-[120px]"
                  />
                </div>
              </div>
            )}

            {/* Step 2: Domain Configuration */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div>
                  <Label htmlFor="subdomain">{t('marketSetup.subdomain', 'Subdomain')} *</Label>
                  <div className="flex items-center gap-2 mt-2">
                    <Input
                      id="subdomain"
                      placeholder="mystore"
                      value={formData.subdomain}
                      onChange={(e) => handleInputChange('subdomain', e.target.value.toLowerCase())}
                      className="flex-1"
                    />
                    <span className="text-muted-foreground">.matager.com</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    {t('marketSetup.domainPreview', 'Your store URL will be:')} {formData.subdomain || 'mystore'}.matager.com
                  </p>
                </div>
                <div>
                  <Label htmlFor="customDomain">{t('marketSetup.customDomain', 'Custom Domain (Optional)')}</Label>
                  <Input
                    id="customDomain"
                    placeholder="www.mystore.com"
                    value={formData.customDomain}
                    onChange={(e) => handleInputChange('customDomain', e.target.value)}
                    className="mt-2"
                  />
                  <p className="text-sm text-muted-foreground mt-2">
                    {t('marketSetup.customDomainNote', 'You can connect your own domain later from the dashboard')}
                  </p>
                </div>
              </div>
            )}

            {/* Step 3: Template Selection */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div>
                  <Label>{t('marketSetup.chooseTemplate', 'Choose Store Template')}</Label>
                  <p className="text-sm text-muted-foreground mb-4">
                    {t('marketSetup.changeTemplateNote', 'You can change the template later from the dashboard')}
                  </p>
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                  {templates.map((template) => (
                    <Card
                      key={template.id}
                      className={`cursor-pointer transition-all ${
                        formData.template === template.id
                          ? 'border-primary ring-2 ring-primary'
                          : 'hover:border-primary/50'
                      }`}
                      onClick={() => handleInputChange('template', template.id)}
                    >
                      <CardHeader>
                        <div className="aspect-video bg-muted rounded-md mb-2 flex items-center justify-center">
                          <Palette className="h-12 w-12 text-muted-foreground" />
                        </div>
                        <CardTitle className="text-lg">{template.name}</CardTitle>
                        <CardDescription>{template.description}</CardDescription>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 1 || loading}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
              {t('common.back', 'Back')}
            </Button>
            <Button
              onClick={handleNext}
              disabled={loading}
              className="gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t('marketSetup.creating', 'Creating...')}
                </>
              ) : currentStep === 3 ? (
                <>
                  <Check className="h-4 w-4" />
                  {t('marketSetup.createStore', 'Create Store')}
                </>
              ) : (
                <>
                  {t('common.next', 'Next')}
                  <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
