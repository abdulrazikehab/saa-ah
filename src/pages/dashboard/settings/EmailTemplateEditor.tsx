import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Save, Mail, Eye, Code, Plus, Trash2, AlertCircle, Package, CreditCard, Truck, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { coreApi } from '@/lib/api';
import { SafeHTML } from '@/components/common/SafeHTML';

interface EmailTemplate {
  id?: string;
  tenantId: string;
  templateType: string;
  subject: string;
  subjectAr?: string;
  body: string;
  bodyAr?: string;
  isActive: boolean;
}

type TemplateType = 'customer-problem' | 'order-issue' | 'delivery-problem' | 'payment-issue' | 'refund-request' | 'product-quality' | 'custom';

export default function EmailTemplateEditor() {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [selectedTemplateType, setSelectedTemplateType] = useState<TemplateType>('customer-problem');
  const [templates, setTemplates] = useState<Record<string, EmailTemplate>>({});
  const [previewMode, setPreviewMode] = useState(false);

  const templateTypes: Array<{ value: TemplateType; label: string; labelAr: string; icon: typeof AlertCircle; description: string }> = [
    { value: 'customer-problem', label: 'Customer Problem', labelAr: t('dashboard.suppliers.emailTemplates.types.customerProblem'), icon: AlertCircle, description: t('dashboard.suppliers.emailTemplates.types.customerProblem') },
    { value: 'order-issue', label: 'Order Issue', labelAr: t('dashboard.suppliers.emailTemplates.types.orderIssue'), icon: Package, description: t('dashboard.suppliers.emailTemplates.types.orderIssue') },
    { value: 'delivery-problem', label: 'Delivery Problem', labelAr: t('dashboard.suppliers.emailTemplates.types.deliveryProblem'), icon: Truck, description: t('dashboard.suppliers.emailTemplates.types.deliveryProblem') },
    { value: 'payment-issue', label: 'Payment Issue', labelAr: t('dashboard.suppliers.emailTemplates.types.paymentIssue'), icon: CreditCard, description: t('dashboard.suppliers.emailTemplates.types.paymentIssue') },
    { value: 'refund-request', label: 'Refund Request', labelAr: t('dashboard.suppliers.emailTemplates.types.refundRequest'), icon: FileText, description: t('dashboard.suppliers.emailTemplates.types.refundRequest') },
    { value: 'product-quality', label: 'Product Quality', labelAr: t('dashboard.suppliers.emailTemplates.types.productQuality'), icon: Package, description: t('dashboard.suppliers.emailTemplates.types.productQuality') },
    { value: 'custom', label: 'Custom Template', labelAr: t('dashboard.suppliers.emailTemplates.types.custom'), icon: FileText, description: t('dashboard.suppliers.emailTemplates.types.custom') },
  ];

  useEffect(() => {
    loadAllTemplates();
  }, []);

  const loadAllTemplates = async () => {
    try {
      // Load all template types
      const templatePromises = templateTypes.map(async (type) => {
        try {
          const response = await coreApi.get(`/email-templates/${type.value}`, { requireAuth: true });
          return { type: type.value, template: response };
        } catch (error) {
          // Template doesn't exist yet, return default
          return {
            type: type.value,
            template: {
              tenantId: '',
              templateType: type.value,
              subject: `${type.label} Update`,
              subjectAr: `تحديث ${type.labelAr}`,
              body: '',
              bodyAr: '',
              isActive: false,
            },
          };
        }
      });

      const results = await Promise.all(templatePromises);
      const templatesMap: Record<string, EmailTemplate> = {};
      results.forEach(({ type, template }) => {
        templatesMap[type] = template;
      });
      setTemplates(templatesMap);
    } catch (error: any) {
      console.error('Failed to load templates:', error);
      toast({
        variant: 'destructive',
        title: t('common.error'),
        description: t('dashboard.suppliers.emailTemplates.toasts.loadError'),
      });
    }
  };

  const getCurrentTemplate = (): EmailTemplate => {
    return templates[selectedTemplateType] || {
      tenantId: '',
      templateType: selectedTemplateType,
      subject: `${templateTypes.find(t => t.value === selectedTemplateType)?.label} Update`,
      subjectAr: `تحديث ${templateTypes.find(t => t.value === selectedTemplateType)?.labelAr}`,
      body: '',
      bodyAr: '',
      isActive: false,
    };
  };

  const updateCurrentTemplate = (updates: Partial<EmailTemplate>) => {
    setTemplates({
      ...templates,
      [selectedTemplateType]: {
        ...getCurrentTemplate(),
        ...updates,
      },
    });
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const template = getCurrentTemplate();
      await coreApi.post(`/email-templates/${template.templateType}`, template, { requireAuth: true });
      toast({
        title: t('common.success'),
        description: t('dashboard.suppliers.emailTemplates.toasts.saveSuccess'),
      });
      await loadAllTemplates();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: t('common.error'),
        description: error.message || t('dashboard.suppliers.emailTemplates.toasts.saveError'),
      });
    } finally {
      setLoading(false);
    }
  };

  const availableVariables = [
    { name: '{{storeName}}', description: t('dashboard.suppliers.emailTemplates.variables.storeName') },
    { name: '{{storeLogo}}', description: t('dashboard.suppliers.emailTemplates.variables.storeLogo') },
    { name: '{{storeDetails}}', description: t('dashboard.suppliers.emailTemplates.variables.storeDetails') },
    { name: '{{customerName}}', description: t('dashboard.suppliers.emailTemplates.variables.customerName') },
    { name: '{{supplierResponseDays}}', description: t('dashboard.suppliers.emailTemplates.variables.supplierResponseDays') },
    { name: '{{problemDetails}}', description: t('dashboard.suppliers.emailTemplates.variables.problemDetails') },
    { name: '{{orderNumber}}', description: t('dashboard.suppliers.emailTemplates.variables.orderNumber') },
    { name: '{{orderDate}}', description: t('dashboard.suppliers.emailTemplates.variables.orderDate') },
    { name: '{{productName}}', description: t('dashboard.suppliers.emailTemplates.variables.productName') },
    { name: '{{refundAmount}}', description: t('dashboard.suppliers.emailTemplates.variables.refundAmount') },
    { name: '{{currentYear}}', description: t('dashboard.suppliers.emailTemplates.variables.currentYear') },
  ];

  const currentTemplate = getCurrentTemplate();
  const selectedTypeInfo = templateTypes.find(t => t.value === selectedTemplateType);
  const isArabic = i18n.language === 'ar';

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">{t('dashboard.suppliers.emailTemplates.title')}</h2>
          <p className="text-gray-600 dark:text-gray-400">
            {t('dashboard.suppliers.emailTemplates.subtitle')}
          </p>
        </div>
        <Button onClick={handleSave} disabled={loading}>
          <Save className="h-4 w-4 mr-2" />
          {loading ? t('common.saving') : t('dashboard.suppliers.emailTemplates.saveCurrent')}
        </Button>
      </div>

      {/* Template Type Selector */}
      <Card>
        <CardHeader>
          <CardTitle>{t('dashboard.suppliers.emailTemplates.selectType')}</CardTitle>
          <CardDescription>
            {t('dashboard.suppliers.emailTemplates.selectTypeDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templateTypes.map((type) => {
              const Icon = type.icon;
              const template = templates[type.value];
              const isActive = template?.isActive || false;
              const isSelected = selectedTemplateType === type.value;

              return (
                <Card
                  key={type.value}
                  className={`cursor-pointer transition-all ${
                    isSelected
                      ? 'border-primary border-2 shadow-lg'
                      : 'hover:border-primary/50'
                  }`}
                  onClick={() => setSelectedTemplateType(type.value)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Icon className="h-5 w-5 text-primary" />
                        <div>
                          <h3 className="font-semibold">{isArabic ? type.labelAr : type.label}</h3>
                          <p className="text-xs text-gray-500">{type.label}</p>
                        </div>
                      </div>
                      {isActive && (
                        <Badge variant="default" className="bg-green-500">
                          {t('dashboard.suppliers.emailTemplates.active')}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                      {type.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Current Template Editor */}
      {selectedTypeInfo && (
        <>
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <selectedTypeInfo.icon className="h-5 w-5 text-primary" />
                <CardTitle>{t('dashboard.suppliers.emailTemplates.editorTitle', { name: isArabic ? selectedTypeInfo.labelAr : selectedTypeInfo.label })}</CardTitle>
              </div>
              <CardDescription>{selectedTypeInfo.description}</CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('dashboard.suppliers.emailTemplates.availableVariables')}</CardTitle>
              <CardDescription>
                {t('dashboard.suppliers.emailTemplates.availableVariablesDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {availableVariables.map((variable) => (
                  <div key={variable.name} className="p-3 border rounded-lg">
                    <code className="text-sm font-mono text-blue-600 dark:text-blue-400">
                      {variable.name}
                    </code>
                    <p className="text-xs text-gray-500 mt-1">{variable.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue={isArabic ? "arabic" : "english"} className="space-y-4">
            <TabsList>
              <TabsTrigger value="english">English</TabsTrigger>
              <TabsTrigger value="arabic">Arabic</TabsTrigger>
            </TabsList>

            <TabsContent value="english" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>{t('dashboard.suppliers.emailTemplates.subject')} (English)</CardTitle>
                </CardHeader>
                <CardContent>
                  <Input
                    value={currentTemplate.subject}
                    onChange={(e) => updateCurrentTemplate({ subject: e.target.value })}
                    placeholder="Email Subject"
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>{t('dashboard.suppliers.emailTemplates.body')} (English)</CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPreviewMode(!previewMode)}
                    >
                      {previewMode ? <Code className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                      {previewMode ? t('dashboard.suppliers.emailTemplates.edit') : t('dashboard.suppliers.emailTemplates.preview')}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {previewMode ? (
                    /* SECURITY FIX: Using SafeHTML to prevent XSS */
                    <SafeHTML
                      html={currentTemplate.body
                        .replace(/{{storeName}}/g, 'My Store')
                        .replace(/{{storeLogo}}/g, 'https://via.placeholder.com/150')
                        .replace(/{{storeDetails}}/g, 'Store Address, Phone, Email')
                        .replace(/{{customerName}}/g, 'John Doe')
                        .replace(/{{supplierResponseDays}}/g, '3')
                        .replace(/{{problemDetails}}/g, 'Product delivery issue')
                        .replace(/{{orderNumber}}/g, 'ORD-12345')
                        .replace(/{{orderDate}}/g, new Date().toLocaleDateString())
                        .replace(/{{productName}}/g, 'Sample Product')
                        .replace(/{{refundAmount}}/g, '100.00')
                        .replace(/{{currentYear}}/g, new Date().getFullYear().toString())}
                      className="border rounded-lg p-4 bg-[#f4f7f9] overflow-hidden shadow-inner min-h-[400px] text-left"
                      style={{ color: '#1a1a1a' }}
                    />
                  ) : (
                    <Textarea
                      value={currentTemplate.body}
                      onChange={(e) => updateCurrentTemplate({ body: e.target.value })}
                      placeholder="Enter HTML email body..."
                      rows={20}
                      className="font-mono text-sm"
                    />
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="arabic" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>{t('dashboard.suppliers.emailTemplates.subject')} (عربي)</CardTitle>
                </CardHeader>
                <CardContent>
                  <Input
                    value={currentTemplate.subjectAr || ''}
                    onChange={(e) => updateCurrentTemplate({ subjectAr: e.target.value })}
                    placeholder="موضوع البريد الإلكتروني"
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>{t('dashboard.suppliers.emailTemplates.body')} (عربي)</CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPreviewMode(!previewMode)}
                    >
                      {previewMode ? <Code className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                      {previewMode ? t('dashboard.suppliers.emailTemplates.edit') : t('dashboard.suppliers.emailTemplates.preview')}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {previewMode ? (
                    /* SECURITY FIX: Using SafeHTML to prevent XSS */
                    <SafeHTML
                      html={(currentTemplate.bodyAr || '')
                        .replace(/{{storeName}}/g, 'متجري')
                        .replace(/{{storeLogo}}/g, 'https://via.placeholder.com/150')
                        .replace(/{{storeDetails}}/g, 'عنوان المتجر، الهاتف، البريد الإلكتروني')
                        .replace(/{{customerName}}/g, 'أحمد محمد')
                        .replace(/{{supplierResponseDays}}/g, '3')
                        .replace(/{{problemDetails}}/g, 'مشكلة في توصيل المنتج')
                        .replace(/{{orderNumber}}/g, 'ORD-12345')
                        .replace(/{{orderDate}}/g, new Date().toLocaleDateString('ar-SA'))
                        .replace(/{{productName}}/g, 'منتج تجريبي')
                        .replace(/{{refundAmount}}/g, '100.00')
                        .replace(/{{currentYear}}/g, new Date().getFullYear().toString())}
                      className="border rounded-lg p-4 bg-[#f4f7f9] overflow-hidden shadow-inner min-h-[400px]"
                      dir="rtl"
                      style={{ color: '#1a1a1a', textAlign: 'right' }}
                    />
                  ) : (
                    <Textarea
                      value={currentTemplate.bodyAr || ''}
                      onChange={(e) => updateCurrentTemplate({ bodyAr: e.target.value })}
                      placeholder="أدخل محتوى البريد الإلكتروني HTML..."
                      rows={20}
                      className="font-mono text-sm"
                      dir="rtl"
                    />
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <Card>
            <CardHeader>
              <CardTitle>{t('dashboard.suppliers.emailTemplates.settings')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-0.5">
                  <Label htmlFor="isActive">{t('dashboard.suppliers.emailTemplates.enableTemplate')}</Label>
                  <p className="text-sm text-gray-500">
                    {t('dashboard.suppliers.emailTemplates.enableTemplateDesc')}
                  </p>
                </div>
                <Switch
                  id="isActive"
                  checked={currentTemplate.isActive}
                  onCheckedChange={(checked) => updateCurrentTemplate({ isActive: checked })}
                />
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
