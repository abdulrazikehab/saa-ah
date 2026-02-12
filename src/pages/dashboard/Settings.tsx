import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { coreApi } from '@/lib/api';
import { Loader2, Save, Store, Globe, Mail, Phone, MapPin, Clock, CreditCard, DollarSign, Truck, Wallet, Plus, Trash2, Search, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { CurrencyIcon } from '@/components/currency/CurrencyIcon';

interface Tax {
  id: string;
  name: string;
  rate: number;
  enabled: boolean;
  mode: 'ALL' | 'CATEGORY' | 'PRODUCT';
  categories: string[];
  products: string[];
}

interface StoreSettings {
  storeName: string;
  storeNameAr: string;
  storeDescription: string;
  storeDescriptionAr: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  postalCode: string;
  currency: string;
  timezone: string;
  language: string;
  taxEnabled: boolean;
  taxRate: number;
  shippingEnabled: boolean;
  inventoryTracking: boolean;
  lowStockThreshold: number;
  allowGuestCheckout: boolean;
  requireEmailVerification: boolean;
  isPrivateStore: boolean;
  allowPublicLanding?: boolean;
  maintenanceMode: boolean;
  storeType: 'GENERAL' | 'DIGITAL_CARDS';
  businessModel?: 'B2B' | 'B2C';
  storeLogoUrl?: string;
  googlePlayUrl?: string;
  appStoreUrl?: string;
  vatNumber?: string;
  paymentMethods: string[];
  hyperpayConfig?: {
    entityId: string;
    accessToken: string;
    testMode: boolean;
  };
  taxMode: 'ALL' | 'CATEGORY' | 'PRODUCT';
  taxableCategories: string[];
  taxableProducts: string[];
  taxes: Tax[];
  dashboardVersion?: string;
  requireEmailForGuests: boolean;
  requirePhoneForGuests: boolean;
  forceAccountCreation: boolean;
  requirePhoneVerification: boolean;
  requireIdVerification: boolean;
  idVerificationThreshold: number;
}

const DEFAULT_SETTINGS: StoreSettings = {
  storeName: '',
  storeNameAr: '',
  storeDescription: '',
  storeDescriptionAr: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  country: 'SA',
  postalCode: '',
  currency: 'SAR',
  timezone: 'Asia/Riyadh',
  language: 'ar',
  dashboardVersion: 'v1',
  taxEnabled: true,
  taxRate: 15,
  shippingEnabled: true,
  inventoryTracking: true,
  lowStockThreshold: 10,
  allowGuestCheckout: true,
  allowPublicLanding: false,
  requireEmailVerification: false,
  isPrivateStore: false,
  maintenanceMode: false,
  storeType: 'GENERAL',
  businessModel: 'B2C',
  storeLogoUrl: '',
  googlePlayUrl: '',
  appStoreUrl: '',
  vatNumber: '',
  paymentMethods: ['CASH_ON_DELIVERY'],
  hyperpayConfig: {
    entityId: '',
    accessToken: '',
    testMode: true,
  },
  taxMode: 'ALL',
  taxableCategories: [],
  taxableProducts: [],
  taxes: [],
  requireEmailForGuests: true,
  requirePhoneForGuests: true,
  forceAccountCreation: false,
  requirePhoneVerification: false,
  requireIdVerification: false,
  idVerificationThreshold: 1000,
};

interface Currency {
  id: string;
  code: string;
  name: string;
  nameAr?: string;
  symbol: string;
  isActive: boolean;
}

interface Category {
  id: string;
  name: string;
  nameAr?: string;
}

interface Product {
  id: string;
  name: string;
  nameAr?: string;
  categories?: { id: string }[];
}

export default function Settings() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [taxSearch, setTaxSearch] = useState('');
  const [availableVersions, setAvailableVersions] = useState<any[]>([]); // Using any for now to match SystemVersion structure
  const [expandedCategories, setExpandedCategories] = useState<Record<string, string[]>>({});

  const loadCategories = useCallback(async () => {
    try {
      const response = await coreApi.get('/categories?limit=1000', { requireAuth: true });
      if (Array.isArray(response)) {
        setCategories(response);
      } else if (response && Array.isArray(response.categories)) {
        setCategories(response.categories);
      } else if (response && Array.isArray(response.data)) {
        setCategories(response.data);
      }
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  }, []);

  const loadProducts = useCallback(async () => {
    try {
      const response = await coreApi.get('/products?limit=1000', { requireAuth: true });
      if (Array.isArray(response)) {
        setProducts(response);
      } else if (response && Array.isArray(response.data)) {
        setProducts(response.data);
      }
    } catch (error) {
      console.error('Failed to load products:', error);
    }
  }, []);

  const loadCurrencies = useCallback(async () => {
    try {
      const response = await coreApi.get('/currencies', { requireAuth: true });
      
      // Validate response is an array
      if (Array.isArray(response)) {
        const validCurrencies = response.filter((c: unknown) => 
          c && 
          typeof c === 'object' && 
          (c as Record<string, unknown>).code && 
          typeof (c as Record<string, unknown>).code === 'string' &&
          (c as Record<string, unknown>).isActive === true
        ) as Currency[];
        setCurrencies(validCurrencies);
      } else {
        // If response is not an array, use defaults
        setCurrencies([
          { id: '1', code: 'SAR', name: 'Saudi Riyal', nameAr: 'ريال سعودي', symbol: 'ر.س', isActive: true },
          { id: '2', code: 'AED', name: 'UAE Dirham', nameAr: 'درهم إماراتي', symbol: 'د.إ', isActive: true },
          { id: '3', code: 'USD', name: 'US Dollar', nameAr: 'دولار أمريكي', symbol: '$', isActive: true },
          { id: '4', code: 'EUR', name: 'Euro', nameAr: 'يورو', symbol: '€', isActive: true },
        ]);
      }
    } catch (error) {
      console.error('Failed to load currencies:', error);
      // Set default currencies if API fails
      setCurrencies([
        { id: '1', code: 'SAR', name: 'Saudi Riyal', nameAr: 'ريال سعودي', symbol: 'ر.س', isActive: true },
        { id: '2', code: 'AED', name: 'UAE Dirham', nameAr: 'درهم إماراتي', symbol: 'د.إ', isActive: true },
        { id: '3', code: 'USD', name: 'US Dollar', nameAr: 'دولار أمريكي', symbol: '$', isActive: true },
        { id: '4', code: 'EUR', name: 'Euro', nameAr: 'يورو', symbol: '€', isActive: true },
      ]);
    }
  }, []);
  
  const loadVersions = useCallback(() => {
    try {
        const stored = localStorage.getItem('system_versions');
        if (stored) {
            setAvailableVersions(JSON.parse(stored));
        } else {
             // Fallback default
             setAvailableVersions([
                { id: '1', name: 'Standard Admin', versionCode: 'v1' }
             ]);
        }
    } catch (e) {
        console.error('Failed to load versions', e);
    }
  }, []);

  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      loadVersions();
      await Promise.all([loadCurrencies(), loadCategories(), loadProducts()]);
      const [configData, currencySettings, checkoutSettings] = await Promise.all([
        coreApi.get('/site-config', { requireAuth: true }),
        coreApi.get('/currencies/settings', { requireAuth: true }).catch(() => null),
        coreApi.get('/checkout/settings', { requireAuth: true }).catch(() => null),
      ]);
      
      if (configData && configData.settings) {
        // If CurrencySettings has a baseCurrency, use it (it's the source of truth)
        // Otherwise use the currency from site-config settings
        const currency = currencySettings?.baseCurrency || configData.settings.currency || 'SAR';
        
        // Ensure paymentMethods are loaded correctly
        // We explicitly check for Array.isArray to handle empty arrays correctly
        let paymentMethods = DEFAULT_SETTINGS.paymentMethods;
        
        // Prioritize settings.paymentMethods because that's what we are definitely saving.
        // The root paymentMethods might not be updating correctly on the backend.
        if (Array.isArray(configData.settings?.paymentMethods)) {
          paymentMethods = configData.settings.paymentMethods;
        } else if (Array.isArray(configData.paymentMethods)) {
          paymentMethods = configData.paymentMethods;
        }

        const loadedSettings = { 
          ...DEFAULT_SETTINGS, 
          ...configData.settings,
          ...(checkoutSettings || {}),
          paymentMethods,
          currency, // Override with CurrencySettings if available
        };

        // Migrate legacy tax settings to taxes array if empty
        if (!loadedSettings.taxes || loadedSettings.taxes.length === 0) {
          loadedSettings.taxes = [{
            id: 'default',
            name: 'الضريبة الافتراضية',
            rate: loadedSettings.taxRate || 15,
            enabled: loadedSettings.taxEnabled ?? true,
            mode: loadedSettings.taxMode || 'ALL',
            categories: loadedSettings.taxableCategories || [],
            products: loadedSettings.taxableProducts || [],
          }];
        }

        setSettings(loadedSettings);
      } else {
        setSettings(DEFAULT_SETTINGS);
      }
    } catch (error: unknown) {
      console.error('Failed to load settings:', error);
      const err = error as { message?: string; data?: { message?: string }; status?: number };
      const errorMessage = err?.message || err?.data?.message || '';
      const errorMessageLower = errorMessage.toLowerCase();
      
      // Check if the error indicates that the tenant doesn't exist
      const isTenantNotFound = 
        errorMessageLower.includes('does not exist') ||
        errorMessageLower.includes('set up your market') ||
        errorMessageLower.includes('set up a market') ||
        (err?.status === 400 && errorMessageLower.includes('tenant'));
      
      if (isTenantNotFound) {
        toast({
          title: 'يجب إعداد المتجر أولاً',
          description: 'يجب إنشاء متجر قبل الوصول إلى الإعدادات. سيتم توجيهك إلى صفحة الإعداد.',
          variant: 'destructive',
        });
        // Redirect to setup page after a short delay
        setTimeout(() => {
          navigate('/setup', { replace: true });
        }, 1500);
      } else {
        toast({
          title: 'تنبيه',
          description: 'لم يتم العثور على إعدادات سابقة، تم تحميل الإعدادات الافتراضية',
          variant: 'default',
        });
        setSettings(DEFAULT_SETTINGS);
      }
    } finally {
      setLoading(false);
    }
  }, [toast, loadCurrencies, loadCategories, loadProducts, navigate, loadVersions]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const updateSetting = <K extends keyof StoreSettings>(field: K, value: StoreSettings[K]) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
    if (field === 'dashboardVersion') {
        localStorage.setItem('tenant_dashboard_version_preference', value as string);
    }
  };

  const updatePaymentMethod = async (method: string, checked: boolean) => {
    const methods = checked 
      ? [...settings.paymentMethods, method]
      : settings.paymentMethods.filter(m => m !== method);
    updateSetting('paymentMethods', methods);
    
    // Auto-save payment methods immediately
    try {
      setSaving(true);
      const updatedSettings = { ...settings, paymentMethods: methods };
      const cleanedSettings = Object.fromEntries(
        Object.entries(updatedSettings).filter(([_, value]) => value !== undefined)
      );
      
      await coreApi.post('/site-config', { 
        settings: {
          ...cleanedSettings,
          paymentMethods: methods,
          payment_methods: methods 
        },
        paymentMethods: methods,
        payment_methods: methods
      }, { requireAuth: true });
      
      toast({
        title: 'نجح',
        description: 'تم حفظ طريقة الدفع بنجاح',
      });
    } catch (error: unknown) {
      console.error('Failed to save payment method:', error);
      const err = error as { message?: string; data?: { message?: string }; status?: number };
      const errorMessage = err?.message || err?.data?.message || 'حدث خطأ أثناء حفظ طريقة الدفع. يرجى المحاولة مرة أخرى.';
      toast({
        title: 'تعذر حفظ طريقة الدفع',
        description: errorMessage,
        variant: 'destructive',
      });
      // Revert the change on error
      updateSetting('paymentMethods', settings.paymentMethods);
    } finally {
      setSaving(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      // Validate settings before sending
      if (!settings || typeof settings !== 'object') {
        throw new Error('Invalid settings data');
      }

      // Clean settings - remove undefined values and ensure proper structure
      const cleanedSettings = Object.fromEntries(
        Object.entries(settings).filter(([_, value]) => value !== undefined)
      );

      // Send paymentMethods at root level and inside settings
      // Also send as snake_case just in case backend expects it
      await coreApi.post('/site-config', { 
        settings: {
          ...cleanedSettings,
          paymentMethods: settings.paymentMethods,
          payment_methods: settings.paymentMethods 
        },
        paymentMethods: settings.paymentMethods,
        payment_methods: settings.paymentMethods
      }, { requireAuth: true });

      // Synchronize with /checkout/settings as well
      await coreApi.put('/checkout/settings', {
        allowGuestCheckout: settings.allowGuestCheckout,
        requireEmailForGuests: settings.requireEmailForGuests,
        requirePhoneForGuests: settings.requirePhoneForGuests,
        forceAccountCreation: settings.forceAccountCreation,
        requireEmailVerification: settings.requireEmailVerification,
        requirePhoneVerification: settings.requirePhoneVerification,
        requireIdVerification: settings.requireIdVerification,
        idVerificationThreshold: settings.idVerificationThreshold,
      }, { requireAuth: true }).catch(() => null);
      
      // If currency was changed, also update CurrencySettings to keep them in sync
      if (settings.currency) {
        try {
          // Check if currency exists in currencies list
          const currencyExists = currencies.some(c => c.code === settings.currency);
          if (currencyExists) {
            // Update CurrencySettings to sync the base currency
            await coreApi.put('/currencies/settings', {
              baseCurrency: settings.currency,
              autoUpdateRates: false, // Preserve existing setting
            }, { requireAuth: true });
          }
        } catch (currencyError) {
          // If currency settings update fails, log but don't fail the whole save
          console.warn('Failed to sync currency to CurrencySettings:', currencyError);
        }
      }
      
      toast({
        title: 'نجح',
        description: 'تم حفظ الإعدادات بنجاح',
      });
      
      // Reload settings to get the latest currency value
      await loadSettings();
    } catch (error: unknown) {
      console.error('Failed to save settings:', error);
      const err = error as { message?: string; data?: { message?: string }; status?: number };
      const errorMessage = err?.message || err?.data?.message || 'حدث خطأ أثناء حفظ الإعدادات. يرجى المحاولة مرة أخرى.';
      
      // Check if the error indicates that the tenant doesn't exist
      const errorMessageLower = errorMessage.toLowerCase();
      const isTenantNotFound = 
        errorMessageLower.includes('does not exist') ||
        errorMessageLower.includes('set up your market') ||
        errorMessageLower.includes('set up a market') ||
        (err?.status === 400 && errorMessageLower.includes('tenant'));
      
      if (isTenantNotFound) {
        toast({
          title: 'يجب إعداد المتجر أولاً',
          description: 'يجب إنشاء متجر قبل حفظ الإعدادات. سيتم توجيهك إلى صفحة الإعداد.',
          variant: 'destructive',
        });
        // Redirect to setup page after a short delay
        setTimeout(() => {
          navigate('/setup', { replace: true });
        }, 1500);
      } else {
        toast({
          title: 'تعذر حفظ الإعدادات',
          description: errorMessage,
          variant: 'destructive',
        });
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin w-12 h-12 text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">إعدادات المتجر</h1>
          <p className="text-sm text-gray-500 mt-1">إدارة إعدادات المتجر والتكوينات</p>
        </div>
        <Button onClick={saveSettings} disabled={saving} size="lg" className="gap-2" id="tour-settings-save-btn">
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              جاري الحفظ...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              حفظ الإعدادات
            </>
          )}
        </Button>
      </div>

      {/* Settings Tabs */}
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full max-w-5xl grid-cols-5">
          <TabsTrigger value="general">عام</TabsTrigger>
          <TabsTrigger value="contact">معلومات الاتصال</TabsTrigger>
          <TabsTrigger value="business">إعدادات الأعمال</TabsTrigger>
          <TabsTrigger value="payment">الدفع والشحن</TabsTrigger>
          <TabsTrigger value="advanced">متقدم</TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Store className="w-5 h-5" />
                <CardTitle>معلومات المتجر الأساسية</CardTitle>
              </div>
              <CardDescription>قم بتكوين المعلومات الأساسية لمتجرك</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Store Logo Upload */}
              <div className="flex items-center gap-4 p-4 border rounded-lg bg-muted/20">
                {settings.storeLogoUrl ? (
                  <img src={settings.storeLogoUrl} alt="شعار المتجر" className="h-20 w-20 object-contain rounded-lg border bg-white" />
                ) : (
                  <div className="h-20 w-20 rounded-lg border border-dashed flex items-center justify-center bg-muted/50">
                    <Store className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
                <div className="space-y-2">
                  <Label>شعار المتجر</Label>
                  <Input
                    type="file"
                    accept="image/*"
                    className="max-w-xs"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const formData = new FormData();
                      formData.append('files', file);
                      try {
                        const res = await coreApi.post('/upload/images', formData, {
                            headers: { 'Content-Type': 'multipart/form-data' },
                            requireAuth: true
                        });
                        
                        if (res.files && res.files.length > 0) {
                            const uploadedUrl = res.files[0].secureUrl || res.files[0].url;
                            updateSetting('storeLogoUrl', uploadedUrl);
                            toast({ title: 'نجح', description: 'تم تحديث الشعار' });
                        }
                      } catch (err) {
                        console.error(err);
                        toast({ title: 'تعذر رفع الشعار', description: 'حدث خطأ أثناء رفع الشعار. يرجى المحاولة مرة أخرى.', variant: 'destructive' });
                      }
                    }}
                  />
                  <p className="text-xs text-muted-foreground">يفضل استخدام صورة مربعة بحجم 500x500 بكسل</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="storeName">اسم المتجر (English)</Label>
                  <Input
                    id="storeName"
                    value={settings.storeName}
                    onChange={(e) => updateSetting('storeName', e.target.value)}
                    placeholder="My Store"
                  />
                </div>
                <div>
                  <Label htmlFor="storeNameAr">اسم المتجر (العربية)</Label>
                  <Input
                    id="storeNameAr"
                    value={settings.storeNameAr}
                    onChange={(e) => updateSetting('storeNameAr', e.target.value)}
                    placeholder="متجري"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="storeDescription">وصف المتجر (English)</Label>
                <Textarea
                  id="storeDescription"
                  value={settings.storeDescription}
                  onChange={(e) => updateSetting('storeDescription', e.target.value)}
                  placeholder="Store description..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="storeDescriptionAr">وصف المتجر (العربية)</Label>
                <Textarea
                  id="storeDescriptionAr"
                  value={settings.storeDescriptionAr}
                  onChange={(e) => updateSetting('storeDescriptionAr', e.target.value)}
                  placeholder="وصف المتجر..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="googlePlayUrl">رابط Google Play</Label>
                  <Input
                    id="googlePlayUrl"
                    value={settings.googlePlayUrl || ''}
                    onChange={(e) => updateSetting('googlePlayUrl', e.target.value)}
                    placeholder="https://play.google.com/..."
                  />
                </div>
                <div>
                  <Label htmlFor="appStoreUrl">رابط App Store</Label>
                  <Input
                    id="appStoreUrl"
                    value={settings.appStoreUrl || ''}
                    onChange={(e) => updateSetting('appStoreUrl', e.target.value)}
                    placeholder="https://apps.apple.com/..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="language">اللغة الافتراضية</Label>
                  <Select value={settings.language} onValueChange={(value) => updateSetting('language', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ar">العربية</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="fr">Français</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="currency" className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    العملة الافتراضية
                  </Label>
                  <Select value={settings.currency} onValueChange={(value) => {
                    updateSetting('currency', value);
                    toast({
                      title: 'تم تحديث العملة',
                      description: `تم تغيير العملة الافتراضية إلى ${value}`,
                    });
                  }}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="اختر العملة" />
                    </SelectTrigger>
                    <SelectContent>
                      {currencies.length > 0 ? (
                        currencies.map((currency) => (
                          <SelectItem key={currency.id} value={currency.code}>
                            <div className="flex items-center gap-2">
                              <CurrencyIcon currencyCode={currency.code} size={16} />
                              <span>{currency.symbol} {currency.nameAr || currency.name} ({currency.code})</span>
                            </div>
                          </SelectItem>
                        ))
                      ) : (
                        <>
                          <SelectItem value="SAR">
                            <div className="flex items-center gap-2">
                              <CurrencyIcon currencyCode="SAR" size={16} />
                              <span>ر.س ريال سعودي (SAR)</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="AED">
                            <div className="flex items-center gap-2">
                              <CurrencyIcon currencyCode="AED" size={16} />
                              <span>د.إ درهم إماراتي (AED)</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="USD">
                            <div className="flex items-center gap-2">
                              <CurrencyIcon currencyCode="USD" size={16} />
                              <span>$ دولار أمريكي (USD)</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="EUR">
                            <div className="flex items-center gap-2">
                              <CurrencyIcon currencyCode="EUR" size={16} />
                              <span>€ يورو (EUR)</span>
                            </div>
                          </SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    العملة الافتراضية المستخدمة في السوق - سيتم تطبيق التغييرات بعد حفظ الإعدادات
                  </p>
                </div>
              </div>

              <div>
                <Label htmlFor="timezone">المنطقة الزمنية</Label>
                <Select value={settings.timezone} onValueChange={(value) => updateSetting('timezone', value)}>
                  <SelectTrigger>
                    <Clock className="h-4 w-4 ml-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Asia/Riyadh">الرياض (GMT+3)</SelectItem>
                    <SelectItem value="Asia/Dubai">دبي (GMT+4)</SelectItem>
                    <SelectItem value="Africa/Cairo">القاهرة (GMT+2)</SelectItem>
                    <SelectItem value="Europe/London">لندن (GMT+0)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="dashboardVersion">إصدار لوحة التحكم</Label>
                <Select 
                    value={settings.dashboardVersion || 'v1'} 
                    onValueChange={(value) => updateSetting('dashboardVersion', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select version" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableVersions.map((v) => (
                        <SelectItem key={v.id} value={v.id}>
                            {v.name} {v.versionCode ? `(${v.versionCode})` : ''}
                        </SelectItem>
                    ))}
                    {availableVersions.length === 0 && (
                        <SelectItem value="v1">Standard Admin</SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                    اختر واجهة المستخدم المفضلة للوحة التحكم الخاصة بك.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="storeType">نوع المتجر</Label>
                  <Select value={settings.storeType} onValueChange={(value: 'GENERAL' | 'DIGITAL_CARDS') => updateSetting('storeType', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GENERAL">متجر عام (منتجات فيزيائية)</SelectItem>
                      <SelectItem value="DIGITAL_CARDS">متجر بطاقات ألعاب رقمية</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    تغيير نوع المتجر يؤثر على كيفية معالجة الطلبات وعرض المنتجات.
                  </p>
                </div>
                <div>
                  <Label htmlFor="businessModel">نوع العمل *</Label>
                  <Select 
                    value={settings.businessModel || 'B2C'} 
                    onValueChange={(value: 'B2B' | 'B2C') => updateSetting('businessModel', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="B2B">B2B (Business to Business)</SelectItem>
                      <SelectItem value="B2C">B2C (Business to Consumer)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    B2B: البيع للشركات | B2C: البيع للمستهلكين
                  </p>
                </div>
              </div>

            </CardContent>
          </Card>
        </TabsContent>

        {/* Contact Information */}
        <TabsContent value="contact" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Phone className="w-5 h-5" />
                <CardTitle>معلومات الاتصال</CardTitle>
              </div>
              <CardDescription>معلومات الاتصال بالمتجر</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">البريد الإلكتروني</Label>
                  <div className="relative">
                    <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      value={settings.email}
                      onChange={(e) => updateSetting('email', e.target.value)}
                      placeholder="store@example.com"
                      className="pr-10"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="phone">رقم الهاتف</Label>
                  <div className="relative">
                    <Phone className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="phone"
                      type="tel"
                      value={settings.phone}
                      onChange={(e) => updateSetting('phone', e.target.value)}
                      placeholder="+966 50 123 4567"
                      className="pr-10"
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="address">العنوان</Label>
                <div className="relative">
                  <MapPin className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                  <Textarea
                    id="address"
                    value={settings.address}
                    onChange={(e) => updateSetting('address', e.target.value)}
                    placeholder="شارع الملك فهد، حي العليا"
                    rows={2}
                    className="pr-10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="city">المدينة</Label>
                  <Input
                    id="city"
                    value={settings.city}
                    onChange={(e) => updateSetting('city', e.target.value)}
                    placeholder="الرياض"
                  />
                </div>
                <div>
                  <Label htmlFor="country">الدولة</Label>
                  <Select value={settings.country} onValueChange={(value) => updateSetting('country', value)}>
                    <SelectTrigger>
                      <Globe className="h-4 w-4 ml-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SA">السعودية</SelectItem>
                      <SelectItem value="AE">الإمارات</SelectItem>
                      <SelectItem value="EG">مصر</SelectItem>
                      <SelectItem value="JO">الأردن</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="postalCode">الرمز البريدي</Label>
                  <Input
                    id="postalCode"
                    value={settings.postalCode}
                    onChange={(e) => updateSetting('postalCode', e.target.value)}
                    placeholder="12345"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Business Settings */}
        <TabsContent value="business" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>إعدادات الضرائب</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label>تفعيل الضرائب</Label>
                  <p className="text-sm text-gray-500">إضافة الضرائب على المنتجات</p>
                </div>
                <Switch
                  checked={settings.taxEnabled}
                  onCheckedChange={(checked) => updateSetting('taxEnabled', checked)}
                />
              </div>

              {settings.taxEnabled && (
                <div className="p-4 border rounded-lg bg-muted/20">
                  <Label htmlFor="vatNumber">الرقم الضريبي (VAT Number)</Label>
                  <Input
                    id="vatNumber"
                    value={settings.vatNumber || ''}
                    onChange={(e) => updateSetting('vatNumber', e.target.value)}
                    placeholder="مثال: 300000000000003"
                    className="mt-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">سيظهر هذا الرقم في الفواتير الضريبية المطبوعة</p>
                </div>
              )}

              {settings.taxEnabled && (
                <div className="space-y-4">
                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newTax: Tax = {
                          id: Math.random().toString(36).substr(2, 9),
                          name: 'ضريبة جديدة',
                          rate: 15,
                          enabled: true,
                          mode: 'ALL',
                          categories: [],
                          products: [],
                        };
                        updateSetting('taxes', [...(settings.taxes || []), newTax]);
                      }}
                    >
                      <Plus className="w-4 h-4 ml-2" />
                      إضافة ضريبة
                    </Button>
                  </div>

                  <Accordion type="single" collapsible className="w-full space-y-2">
                    {(settings.taxes || []).map((tax, index) => (
                      <AccordionItem key={tax.id} value={tax.id} className="border rounded-lg px-4">
                        <div className="flex items-center justify-between py-4">
                          <AccordionTrigger className="hover:no-underline py-0 flex-1">
                            <div className="flex items-center gap-4">
                              <span className="font-medium">{tax.name}</span>
                              <span className="text-sm text-gray-500">({tax.rate}%)</span>
                              <span className={`text-xs px-2 py-1 rounded-full ${tax.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                {tax.enabled ? 'مفعل' : 'معطل'}
                              </span>
                            </div>
                          </AccordionTrigger>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 mr-2"
                            onClick={(e) => {
                              e.stopPropagation();
                              const newTaxes = [...(settings.taxes || [])];
                              newTaxes.splice(index, 1);
                              updateSetting('taxes', newTaxes);
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        
                        <AccordionContent className="pt-4 pb-4 space-y-4 border-t">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label>اسم الضريبة</Label>
                              <Input
                                value={tax.name}
                                onChange={(e) => {
                                  const newTaxes = [...(settings.taxes || [])];
                                  newTaxes[index] = { ...tax, name: e.target.value };
                                  updateSetting('taxes', newTaxes);
                                }}
                              />
                            </div>
                            <div>
                              <Label>نسبة الضريبة (%)</Label>
                              <Input
                                type="number"
                                step="0.01"
                                value={tax.rate}
                                onChange={(e) => {
                                  const newTaxes = [...(settings.taxes || [])];
                                  newTaxes[index] = { ...tax, rate: parseFloat(e.target.value) };
                                  updateSetting('taxes', newTaxes);
                                }}
                              />
                            </div>
                          </div>

                          <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50 dark:bg-gray-900">
                            <Label>تفعيل هذه الضريبة</Label>
                            <Switch
                              checked={tax.enabled}
                              onCheckedChange={(checked) => {
                                const newTaxes = [...(settings.taxes || [])];
                                newTaxes[index] = { ...tax, enabled: checked };
                                updateSetting('taxes', newTaxes);
                              }}
                            />
                          </div>

                          <div>
                            <Label>تطبيق الضريبة على</Label>
                            <Select 
                              value={tax.mode} 
                              onValueChange={(value: 'ALL' | 'CATEGORY' | 'PRODUCT') => {
                                const newTaxes = [...(settings.taxes || [])];
                                newTaxes[index] = { ...tax, mode: value };
                                updateSetting('taxes', newTaxes);
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="ALL">جميع المنتجات</SelectItem>
                                <SelectItem value="CATEGORY">تصنيفات محددة</SelectItem>
                                <SelectItem value="PRODUCT">منتجات محددة</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {tax.mode === 'CATEGORY' && (
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <Label>اختر التصنيفات</Label>
                                {(tax.categories || []).length > 0 && (
                                  <Button
                                    variant="link"
                                    size="sm"
                                    className="h-auto p-0 text-primary"
                                    onClick={() => {
                                      const categoryProductIds = products
                                        .filter(p => p.categories?.some(c => (tax.categories || []).includes(c.id)))
                                        .map(p => p.id);
                                      
                                      const newTaxes = [...(settings.taxes || [])];
                                      newTaxes[index] = { 
                                        ...tax, 
                                        mode: 'PRODUCT', 
                                        products: categoryProductIds,
                                        categories: [] 
                                      };
                                      updateSetting('taxes', newTaxes);
                                      
                                      // Expand the selected categories in the new view
                                      setExpandedCategories(prev => ({
                                        ...prev,
                                        [tax.id]: tax.categories || []
                                      }));
                                      
                                      toast({
                                        title: 'تم التحويل',
                                        description: 'تم تحويل الاختيار إلى منتجات محددة. يمكنك الآن استبعاد منتجات معينة.',
                                      });
                                    }}
                                  >
                                    تخصيص المنتجات في هذه التصنيفات
                                  </Button>
                                )}
                              </div>
                              <div className="border rounded-md p-4 max-h-60 overflow-y-auto space-y-2">
                                {categories.map((category) => (
                                  <div key={category.id} className="flex items-center space-x-2 space-x-reverse">
                                    <input
                                      type="checkbox"
                                      id={`tax-${tax.id}-cat-${category.id}`}
                                      checked={(tax.categories || []).includes(category.id)}
                                      onChange={(e) => {
                                        const current = tax.categories || [];
                                        const updated = e.target.checked
                                          ? [...current, category.id]
                                          : current.filter(id => id !== category.id);
                                        
                                        const newTaxes = [...(settings.taxes || [])];
                                        newTaxes[index] = { ...tax, categories: updated };
                                        updateSetting('taxes', newTaxes);
                                      }}
                                      className="h-4 w-4 rounded border-gray-300"
                                    />
                                    <Label htmlFor={`tax-${tax.id}-cat-${category.id}`} className="cursor-pointer font-normal">
                                      {category.nameAr || category.name}
                                    </Label>
                                  </div>
                                ))}
                                {categories.length === 0 && <p className="text-sm text-gray-500">لا توجد تصنيفات</p>}
                              </div>
                            </div>
                          )}

                          {tax.mode === 'PRODUCT' && (
                            <div className="space-y-4">
                              <div className="flex items-center gap-2">
                                <div className="relative flex-1">
                                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                  <Input
                                    placeholder="بحث عن منتج أو تصنيف..."
                                    value={taxSearch}
                                    onChange={(e) => setTaxSearch(e.target.value)}
                                    className="pr-10"
                                  />
                                </div>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => {
                                    const allCategoryIds = categories.map(c => c.id);
                                    const isAllExpanded = expandedCategories[tax.id]?.length === allCategoryIds.length;
                                    setExpandedCategories(prev => ({
                                      ...prev,
                                      [tax.id]: isAllExpanded ? [] : allCategoryIds
                                    }));
                                  }}
                                >
                                  {expandedCategories[tax.id]?.length === categories.length ? 'طي الكل' : 'توسيع الكل'}
                                </Button>
                              </div>

                              <div className="border rounded-md p-4 max-h-96 overflow-y-auto space-y-4">
                                {/* Group products by category */}
                                {categories
                                  .filter(category => {
                                    const matchesSearch = category.name.toLowerCase().includes(taxSearch.toLowerCase()) || 
                                                        (category.nameAr || '').toLowerCase().includes(taxSearch.toLowerCase());
                                    const hasMatchingProducts = products.some(p => 
                                      p.categories?.some(c => c.id === category.id) && 
                                      (p.name.toLowerCase().includes(taxSearch.toLowerCase()) || (p.nameAr || '').toLowerCase().includes(taxSearch.toLowerCase()))
                                    );
                                    return matchesSearch || hasMatchingProducts;
                                  })
                                  .map((category) => {
                                    const categoryProducts = products.filter(p => 
                                      p.categories?.some(c => c.id === category.id)
                                    );
                                    
                                    if (categoryProducts.length === 0) return null;

                                    const filteredProducts = categoryProducts.filter(p => 
                                      p.name.toLowerCase().includes(taxSearch.toLowerCase()) || 
                                      (p.nameAr || '').toLowerCase().includes(taxSearch.toLowerCase()) ||
                                      category.name.toLowerCase().includes(taxSearch.toLowerCase()) ||
                                      (category.nameAr || '').toLowerCase().includes(taxSearch.toLowerCase())
                                    );

                                    const allSelected = categoryProducts.every(p => (tax.products || []).includes(p.id));
                                    const someSelected = categoryProducts.some(p => (tax.products || []).includes(p.id));
                                    const isExpanded = expandedCategories[tax.id]?.includes(category.id) || taxSearch !== '';

                                    return (
                                      <div key={category.id} className="space-y-2">
                                        <div className="flex items-center justify-between font-medium bg-gray-50 dark:bg-gray-900 p-2 rounded">
                                          <div className="flex items-center space-x-2 space-x-reverse">
                                            <input
                                              type="checkbox"
                                              id={`tax-${tax.id}-group-${category.id}`}
                                              checked={allSelected}
                                              ref={input => {
                                                if (input) {
                                                  input.indeterminate = someSelected && !allSelected;
                                                }
                                              }}
                                              onChange={(e) => {
                                                const current = tax.products || [];
                                                const productIds = categoryProducts.map(p => p.id);
                                                let updated;
                                                
                                                if (e.target.checked) {
                                                  const toAdd = productIds.filter(id => !current.includes(id));
                                                  updated = [...current, ...toAdd];
                                                } else {
                                                  updated = current.filter(id => !productIds.includes(id));
                                                }
                                                
                                                const newTaxes = [...(settings.taxes || [])];
                                                newTaxes[index] = { ...tax, products: updated };
                                                updateSetting('taxes', newTaxes);
                                              }}
                                              className="h-4 w-4 rounded border-gray-300"
                                            />
                                            <Label htmlFor={`tax-${tax.id}-group-${category.id}`} className="cursor-pointer">
                                              {category.nameAr || category.name}
                                            </Label>
                                          </div>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 w-6 p-0"
                                            onClick={() => {
                                              setExpandedCategories(prev => {
                                                const current = prev[tax.id] || [];
                                                const updated = current.includes(category.id)
                                                  ? current.filter(id => id !== category.id)
                                                  : [...current, category.id];
                                                return { ...prev, [tax.id]: updated };
                                              });
                                            }}
                                          >
                                            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                          </Button>
                                        </div>
                                        
                                        {isExpanded && (
                                          <div className="mr-6 space-y-1 animate-in slide-in-from-top-1 duration-200">
                                            {filteredProducts.map((product) => (
                                              <div key={product.id} className="flex items-center space-x-2 space-x-reverse">
                                                <input
                                                  type="checkbox"
                                                  id={`tax-${tax.id}-prod-${product.id}`}
                                                  checked={(tax.products || []).includes(product.id)}
                                                  onChange={(e) => {
                                                    const current = tax.products || [];
                                                    const updated = e.target.checked
                                                      ? [...current, product.id]
                                                      : current.filter(id => id !== product.id);
                                                    
                                                    const newTaxes = [...(settings.taxes || [])];
                                                    newTaxes[index] = { ...tax, products: updated };
                                                    updateSetting('taxes', newTaxes);
                                                  }}
                                                  className="h-4 w-4 rounded border-gray-300"
                                                />
                                                <Label htmlFor={`tax-${tax.id}-prod-${product.id}`} className="cursor-pointer font-normal text-sm">
                                                  {product.nameAr || product.name}
                                                </Label>
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                
                                {/* Products with no category */}
                                {(() => {
                                  const uncategorizedProducts = products.filter(p => !p.categories || p.categories.length === 0);
                                  if (uncategorizedProducts.length === 0) return null;

                                  const filteredUncategorized = uncategorizedProducts.filter(p => 
                                    p.name.toLowerCase().includes(taxSearch.toLowerCase()) || 
                                    (p.nameAr || '').toLowerCase().includes(taxSearch.toLowerCase())
                                  );

                                  if (filteredUncategorized.length === 0 && taxSearch !== '') return null;
                                  
                                  return (
                                    <div className="space-y-2">
                                      <div className="font-medium bg-gray-50 dark:bg-gray-900 p-2 rounded">
                                        منتجات غير مصنفة
                                      </div>
                                      <div className="mr-6 space-y-1">
                                        {filteredUncategorized.map((product) => (
                                          <div key={product.id} className="flex items-center space-x-2 space-x-reverse">
                                            <input
                                              type="checkbox"
                                              id={`tax-${tax.id}-prod-${product.id}`}
                                              checked={(tax.products || []).includes(product.id)}
                                              onChange={(e) => {
                                                const current = tax.products || [];
                                                const updated = e.target.checked
                                                  ? [...current, product.id]
                                                  : current.filter(id => id !== product.id);
                                                
                                                const newTaxes = [...(settings.taxes || [])];
                                                newTaxes[index] = { ...tax, products: updated };
                                                updateSetting('taxes', newTaxes);
                                              }}
                                              className="h-4 w-4 rounded border-gray-300"
                                            />
                                            <Label htmlFor={`tax-${tax.id}-prod-${product.id}`} className="cursor-pointer font-normal text-sm">
                                              {product.nameAr || product.name}
                                            </Label>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  );
                                })()}

                                {products.length === 0 && <p className="text-sm text-gray-500">لا توجد منتجات</p>}
                                {taxSearch !== '' && categories.length > 0 && products.length > 0 && 
                                  !categories.some(c => c.name.toLowerCase().includes(taxSearch.toLowerCase()) || (c.nameAr || '').toLowerCase().includes(taxSearch.toLowerCase())) &&
                                  !products.some(p => p.name.toLowerCase().includes(taxSearch.toLowerCase()) || (p.nameAr || '').toLowerCase().includes(taxSearch.toLowerCase())) && (
                                  <p className="text-sm text-gray-500 text-center py-4">لا توجد نتائج مطابقة للبحث</p>
                                )}
                              </div>
                            </div>
                          )}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>إعدادات المخزون</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label>تتبع المخزون</Label>
                  <p className="text-sm text-gray-500">تتبع كميات المنتجات تلقائياً</p>
                </div>
                <Switch
                  checked={settings.inventoryTracking}
                  onCheckedChange={(checked) => updateSetting('inventoryTracking', checked)}
                />
              </div>

              {settings.inventoryTracking && (
                <div>
                  <Label htmlFor="lowStockThreshold">حد التنبيه للمخزون المنخفض</Label>
                  <Input
                    id="lowStockThreshold"
                    type="number"
                    value={settings.lowStockThreshold}
                    onChange={(e) => updateSetting('lowStockThreshold', parseInt(e.target.value))}
                    placeholder="10"
                  />
                  <p className="text-xs text-gray-500 mt-1">سيتم تنبيهك عندما يصل المخزون لهذا الحد</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>إعدادات الشحن</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label>تفعيل الشحن</Label>
                  <p className="text-sm text-gray-500">السماح بشحن المنتجات للعملاء</p>
                </div>
                <Switch
                  checked={settings.shippingEnabled}
                  onCheckedChange={(checked) => updateSetting('shippingEnabled', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payment & Shipping Settings */}
        <TabsContent value="payment" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                <CardTitle>طرق الدفع</CardTitle>
              </div>
              <CardDescription>إدارة طرق الدفع المتاحة للعملاء</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                    <CreditCard className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <Label>الدفع عند الاستلام</Label>
                    <p className="text-sm text-gray-500">السماح بالدفع النقدي عند التوصيل</p>
                  </div>
                </div>
                <Switch 
                  checked={settings.paymentMethods.includes('CASH_ON_DELIVERY')}
                  onCheckedChange={(checked) => updatePaymentMethod('CASH_ON_DELIVERY', checked)}
                  disabled={saving}
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                    <CreditCard className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <Label>HyperPay (Visa/Mastercard/Mada)</Label>
                    <p className="text-sm text-gray-500">الدفع الإلكتروني عبر HyperPay</p>
                  </div>
                </div>
                <Switch 
                  checked={settings.paymentMethods.includes('HYPERPAY')}
                  onCheckedChange={(checked) => updatePaymentMethod('HYPERPAY', checked)}
                  disabled={saving}
                />
              </div>

              {settings.paymentMethods.includes('HYPERPAY') && (
                <div className="p-4 border rounded-lg bg-muted/20 space-y-4">
                  <h3 className="font-medium">إعدادات HyperPay</h3>
                  <div className="space-y-2">
                    <Label>Entity ID</Label>
                    <Input 
                      value={settings.hyperpayConfig?.entityId || ''}
                      onChange={(e) => updateSetting('hyperpayConfig', { ...settings.hyperpayConfig!, entityId: e.target.value })}
                      placeholder="Enter Entity ID"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Access Token</Label>
                    <Input 
                      type="password"
                      value={settings.hyperpayConfig?.accessToken || ''}
                      onChange={(e) => updateSetting('hyperpayConfig', { ...settings.hyperpayConfig!, accessToken: e.target.value })}
                      placeholder="Enter Access Token"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch 
                      checked={settings.hyperpayConfig?.testMode ?? true}
                      onCheckedChange={(checked) => updateSetting('hyperpayConfig', { ...settings.hyperpayConfig!, testMode: checked })}
                    />
                    <Label>وضع التجربة (Test Mode)</Label>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                    <DollarSign className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <Label>التحويل البنكي</Label>
                    <p className="text-sm text-gray-500">الدفع عبر التحويل المباشر</p>
                  </div>
                </div>
                <Switch 
                  checked={settings.paymentMethods.includes('BANK_TRANSFER')}
                  onCheckedChange={(checked) => updatePaymentMethod('BANK_TRANSFER', checked)}
                  disabled={saving}
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                    <Wallet className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div>
                    <Label>الدفع بالرصيد</Label>
                    <p className="text-sm text-gray-500">السماح للعملاء بالدفع باستخدام رصيد المحفظة</p>
                  </div>
                </div>
                <Switch 
                  checked={settings.paymentMethods.includes('WALLET_PAYMENT')}
                  onCheckedChange={(checked) => updatePaymentMethod('WALLET_PAYMENT', checked)}
                  disabled={saving}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5" />
                <CardTitle>إعدادات الشحن</CardTitle>
              </div>
              <CardDescription>تكوين خيارات وأسعار الشحن</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label>تفعيل الشحن</Label>
                  <p className="text-sm text-gray-500">السماح بشحن المنتجات للعملاء</p>
                </div>
                <Switch
                  checked={settings.shippingEnabled}
                  onCheckedChange={(checked) => updateSetting('shippingEnabled', checked)}
                />
              </div>

              {settings.shippingEnabled && (
                <>
                  <div className="space-y-3">
                    <Label>شركات الشحن</Label>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-2">
                          <Truck className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">الشحن السريع</span>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-2">
                          <Truck className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">الشحن العادي</span>
                        </div>
                        <Switch defaultChecked />
                      </div>
                    </div>
                  </div>

                  <Button variant="outline" className="w-full">
                    إدارة طرق الشحن
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Advanced Settings */}
        <TabsContent value="advanced" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>إعدادات الطلبات</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label>السماح بالشراء كضيف</Label>
                  <p className="text-sm text-gray-500">السماح للزوار بالشراء بدون تسجيل</p>
                </div>
                <Switch
                  checked={settings.isPrivateStore ? false : settings.allowGuestCheckout}
                  onCheckedChange={(checked) => updateSetting('allowGuestCheckout', checked)}
                  disabled={settings.isPrivateStore}
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg bg-primary/5 border-primary/20">
                <div className="space-y-0.5">
                  <Label className="text-base">متجر خاص (عملاء مخصصون)</Label>
                  <p className="text-sm text-muted-foreground">
                    عند التفعيل، سيتم تعطيل التسجيل العام وسيتمكن العملاء المضافون يدوياً فقط من الشراء.
                  </p>
                </div>
                <Switch
                  checked={settings.isPrivateStore}
                  onCheckedChange={(checked) => {
                    updateSetting('isPrivateStore', checked);
                    if (checked) {
                      updateSetting('allowGuestCheckout', false);
                    }
                  }}
                />
              </div>
              
              {settings.isPrivateStore && (
                <div className="flex items-center justify-between p-4 border rounded-lg mt-2 bg-muted/50">
                  <div className="space-y-0.5">
                    <Label className="text-base">عرض الصفحة الرئيسية للزوار</Label>
                    <p className="text-sm text-muted-foreground">
                       السماح للزوار برؤية الصفحة الرئيسية دون تسجيل الدخول
                    </p>
                  </div>
                  <Switch
                    checked={settings.allowPublicLanding}
                    onCheckedChange={(checked) => updateSetting('allowPublicLanding', checked)}
                  />
                </div>
              )}

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-0.5">
                  <Label>طلب تأكيد البريد الإلكتروني</Label>
                  <p className="text-sm text-gray-500">يجب على المستخدمين تأكيد بريدهم الإلكتروني</p>
                </div>
                <Switch
                  checked={settings.requireEmailVerification}
                  onCheckedChange={(checked) => updateSetting('requireEmailVerification', checked)}
                />
              </div>

              {settings.allowGuestCheckout && (
                <div className="space-y-4 pt-2 border-t mt-2">
                  <h4 className="font-medium text-sm text-muted-foreground uppercase">إعدادات الضيوف</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/20">
                      <div className="space-y-0.5">
                        <Label className="text-sm">طلب البريد الإلكتروني</Label>
                        <p className="text-xs text-muted-foreground">يجب على الضيوف إدخال البريد</p>
                      </div>
                      <Switch
                        checked={settings.requireEmailForGuests}
                        onCheckedChange={(checked) => updateSetting('requireEmailForGuests', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/20">
                      <div className="space-y-0.5">
                        <Label className="text-sm">طلب رقم الهاتف</Label>
                        <p className="text-xs text-muted-foreground">يجب على الضيوف إدخال الهاتف</p>
                      </div>
                      <Switch
                        checked={settings.requirePhoneForGuests}
                        onCheckedChange={(checked) => updateSetting('requirePhoneForGuests', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/20">
                      <div className="space-y-0.5">
                        <Label className="text-sm">إجبار إنشاء حساب</Label>
                        <p className="text-xs text-muted-foreground">إنشاء حساب تلقائي بعد الطلب</p>
                      </div>
                      <Switch
                        checked={settings.forceAccountCreation}
                        onCheckedChange={(checked) => updateSetting('forceAccountCreation', checked)}
                      />
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>التحقق من الهوية (KYC)</CardTitle>
              <CardDescription>متطلبات التحقق من هوية العملاء والمصادقة ثنائية العامل</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-0.5">
                  <Label>التحقق من رقم الهاتف (SMS)</Label>
                  <p className="text-sm text-gray-500">تفعيل التحقق من الهوية عبر رسائل SMS</p>
                </div>
                <Switch
                  checked={settings.requirePhoneVerification}
                  onCheckedChange={(checked) => updateSetting('requirePhoneVerification', checked)}
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-0.5">
                  <Label>التحقق من الهوية (ID)</Label>
                  <p className="text-sm text-gray-500">مطالبة العملاء برفع صور الهوية/الجواز</p>
                </div>
                <Switch
                  checked={settings.requireIdVerification}
                  onCheckedChange={(checked) => updateSetting('requireIdVerification', checked)}
                />
              </div>

              {settings.requireIdVerification && (
                <div className="p-4 border rounded-lg bg-muted/30 space-y-3">
                  <Label htmlFor="idVerificationThreshold">حد التحقق من الهوية ({settings.currency})</Label>
                  <Input
                    id="idVerificationThreshold"
                    type="number"
                    value={settings.idVerificationThreshold}
                    onChange={(e) => updateSetting('idVerificationThreshold', parseFloat(e.target.value))}
                    placeholder="1000"
                  />
                  <p className="text-xs text-muted-foreground">
                    يتطلب التحقق من الهوية للطلبات التي تزيد عن هذا المبلغ
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>وضع الصيانة</CardTitle>
              <CardDescription>إيقاف المتجر مؤقتاً للصيانة</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 border rounded-lg border-red-200 bg-red-50 dark:bg-red-900/10">
                <div>
                  <Label className="text-red-900 dark:text-red-100">تفعيل وضع الصيانة</Label>
                  <p className="text-sm text-red-700 dark:text-red-300">سيتم إيقاف المتجر عن العملاء</p>
                </div>
                <Switch
                  checked={settings.maintenanceMode}
                  onCheckedChange={(checked) => updateSetting('maintenanceMode', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save Button (Sticky) */}
      <div className="flex justify-end sticky bottom-0 bg-background py-4 border-t">
        <Button onClick={saveSettings} disabled={saving} size="lg" className="gap-2">
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              جاري الحفظ...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              حفظ الإعدادات
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
