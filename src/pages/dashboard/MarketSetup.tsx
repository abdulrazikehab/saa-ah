import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Loader2, Store, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { authService } from '@/services/auth.service';
import { tenantService } from '@/services/tenant.service';
import { apiClient } from '@/lib/api';

interface MarketFormData {
  name: string;
  description: string;
  subdomain: string;
}

interface SubdomainCheckResult {
  available: boolean;
  suggestions?: string[];
}

export default function MarketSetup() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const { user, loading: authLoading, refreshUser } = useAuth();
  const [canCreate, setCanCreate] = useState<{ allowed: boolean; currentCount: number; limit: number } | null>(null);
  const [checkingLimit, setCheckingLimit] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<MarketFormData>({
    name: '',
    description: '',
    subdomain: '',
  });
  const [subdomainSuggestions, setSubdomainSuggestions] = useState<string[]>([]);
  const [checkingSubdomain, setCheckingSubdomain] = useState(false);
  const [isSubdomainAvailable, setIsSubdomainAvailable] = useState<boolean | null>(null);
  const [showSubdomainChoices, setShowSubdomainChoices] = useState(false);

  // Check if user can create another market
  useEffect(() => {
    const checkMarketLimit = async () => {
      if (!authLoading && user) {
        try {
          setCheckingLimit(true);
          const limitCheck = await authService.canCreateMarket();
          setCanCreate(limitCheck);
          
          // If user has no tenant and can't create (shouldn't happen), redirect
          if (!user.tenantId && !limitCheck.allowed) {
            toast({
              title: isRTL ? 'خطأ' : 'Error',
              description: isRTL 
                ? 'لا يمكن إنشاء متجر. يرجى الاتصال بالدعم.' 
                : 'Cannot create store. Please contact support.',
              variant: 'destructive',
            });
            setTimeout(() => {
              navigate('/dashboard', { replace: true });
            }, 2000);
          }
        } catch (error) {
          console.error('Failed to check market limit:', error);
          setCanCreate({ allowed: false, currentCount: 0, limit: 2 });
        } finally {
          setCheckingLimit(false);
        }
      }
    };

    checkMarketLimit();
  }, [user, authLoading, navigate, toast, isRTL]);

  const generateSubdomain = (storeName: string): string => {
    if (!storeName || !storeName.trim()) {
      // Fallback if no name provided
      const timestamp = Date.now().toString().slice(-6);
      return `store-${timestamp}`;
    }
    
    let subdomain = storeName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '') // Remove non-alphanumeric except spaces and hyphens
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/--+/g, '-') // Replace multiple hyphens with single hyphen
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
    
    // If after cleaning it's empty or too short, use fallback
    if (!subdomain || subdomain.length < 3) {
      // Use first few valid characters + timestamp for uniqueness
      const validChars = storeName.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 5);
      const timestamp = Date.now().toString().slice(-6);
      subdomain = validChars && validChars.length >= 2 
        ? `${validChars}-${timestamp}` 
        : `store-${timestamp}`;
    }
    
    // Ensure maximum length of 63 characters (domain limit)
    if (subdomain.length > 63) {
      subdomain = subdomain.substring(0, 63);
      // Make sure we don't end with a hyphen after truncation
      subdomain = subdomain.replace(/-+$/, '');
    }
    
    // Final validation - ensure it matches the required pattern
    if (!/^[a-z0-9-]+$/.test(subdomain) || subdomain.length < 3) {
      // Ultimate fallback
      const timestamp = Date.now().toString().slice(-8);
      subdomain = `store${timestamp}`;
    }
    
    return subdomain;
  };

  // Check subdomain availability when store name changes
  useEffect(() => {
    if (!formData.name || formData.name.trim().length < 3) {
      setFormData(prev => ({ ...prev, subdomain: '' }));
      setIsSubdomainAvailable(null);
      setSubdomainSuggestions([]);
      setShowSubdomainChoices(false);
      return;
    }

    const timer = setTimeout(async () => {
      const baseSubdomain = generateSubdomain(formData.name);
      
      if (baseSubdomain.length < 3) return;

      setCheckingSubdomain(true);
      try {
        const response = await apiClient.get(`/public/check-subdomain?subdomain=${encodeURIComponent(baseSubdomain)}`) as SubdomainCheckResult;
        
        if (response.available) {
          setIsSubdomainAvailable(true);
          setFormData(prev => ({ ...prev, subdomain: baseSubdomain }));
          setSubdomainSuggestions([]);
          setShowSubdomainChoices(false);
        } else {
          setIsSubdomainAvailable(false);
          setSubdomainSuggestions(response.suggestions || []);
          setShowSubdomainChoices(true);
          // Don't set subdomain yet, user must pick one
          setFormData(prev => ({ ...prev, subdomain: '' }));
        }
      } catch (error) {
        console.error('Failed to check subdomain:', error);
        // On error, assume available and use generated subdomain
        setIsSubdomainAvailable(true);
        setFormData(prev => ({ ...prev, subdomain: baseSubdomain }));
        setSubdomainSuggestions([]);
        setShowSubdomainChoices(false);
      } finally {
        setCheckingSubdomain(false);
      }
    }, 600); // Debounce for 600ms

    return () => clearTimeout(timer);
  }, [formData.name]);

  const handleInputChange = (field: keyof MarketFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSelectSubdomain = (selectedSubdomain: string) => {
    setFormData(prev => ({ ...prev, subdomain: selectedSubdomain }));
    setIsSubdomainAvailable(true);
    setShowSubdomainChoices(false);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast({
        title: isRTL ? 'خطأ' : 'Error',
        description: isRTL ? 'يرجى إدخال اسم المتجر' : 'Please enter store name',
        variant: 'destructive',
      });
      return;
    }

    // Validate subdomain is selected
    if (!formData.subdomain || !formData.subdomain.trim()) {
      toast({
        title: isRTL ? 'خطأ' : 'Error',
        description: isRTL ? 'يرجى اختيار عنوان المتجر (Subdomain)' : 'Please select a store subdomain',
        variant: 'destructive',
      });
      return;
    }

    // Validate subdomain format
    if (!/^[a-z0-9-]+$/.test(formData.subdomain) || formData.subdomain.length < 3) {
      toast({
        title: isRTL ? 'خطأ' : 'Error',
        description: isRTL ? 'عنوان المتجر غير صحيح' : 'Invalid subdomain format',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      await tenantService.setupMarket({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        subdomain: formData.subdomain.trim(),
      });

      // Refresh user to get updated markets
      await refreshUser();

      toast({
        title: isRTL ? 'نجح!' : 'Success!',
        description: isRTL 
          ? 'تم إنشاء المتجر بنجاح!' 
          : 'Store created successfully!',
      });

      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (error: any) {
      console.error('Error creating market:', error);
      
      // Extract error message from various possible formats
      let errorMessage = '';
      
      // 1. Try to get message from error object directly (usually set by ApiError)
      if (typeof error?.message === 'string') {
        errorMessage = error.message;
      }
      
      // 2. Check for detailed error response in data
      if (error?.data?.message) {
        const msg = error.data.message;
        if (Array.isArray(msg)) {
          errorMessage = msg.join(', ');
        } else if (typeof msg === 'object' && msg !== null) {
          // Handle nested error object (e.g. { message: "...", error: "...", statusCode: ... })
          // This fixes the "Objects are not valid as a React child" error
          errorMessage = (msg as any).message || JSON.stringify(msg);
        } else if (msg) {
          errorMessage = String(msg);
        }
      } else if (typeof error?.data === 'string') {
        errorMessage = error.data;
      }
      
      // 3. If still no message, use default
      if (!errorMessage || errorMessage === 'An error occurred' || errorMessage === '[object Object]') {
        errorMessage = isRTL 
          ? 'فشل إنشاء المتجر. يرجى التحقق من البيانات والمحاولة مرة أخرى.' 
          : 'Failed to create store. Please check the data and try again.';
      }
      
      // 4. Final safety check: Ensure errorMessage is a string
      if (typeof errorMessage !== 'string') {
        errorMessage = JSON.stringify(errorMessage);
      }
      
      toast({
        title: isRTL ? 'فشل' : 'Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Show loading while checking auth or market limit
  if (authLoading || checkingLimit) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground">{isRTL ? 'جاري التحميل...' : 'Loading...'}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If user can't create another market (limit reached)
  if (canCreate && !canCreate.allowed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-amber-100 dark:bg-amber-900/20 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="h-8 w-8 text-amber-600 dark:text-amber-400" />
            </div>
            <CardTitle className="text-2xl">
              {isRTL ? 'تم الوصول للحد الأقصى' : 'Market Limit Reached'}
            </CardTitle>
            <CardDescription className="text-base">
              {isRTL 
                ? `لديك ${canCreate.currentCount} من ${canCreate.limit} متاجر. للترقية، يرجى الاتصال بالدعم.` 
                : `You have ${canCreate.currentCount} of ${canCreate.limit} markets. To upgrade, please contact support.`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => navigate('/dashboard', { replace: true })} 
              className="w-full"
            >
              {isRTL ? 'العودة إلى لوحة التحكم' : 'Back to Dashboard'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If user can create another market, show form
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Store className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl">
                {isRTL ? 'إنشاء متجر جديد' : 'Create New Store'}
              </CardTitle>
              <CardDescription>
                {canCreate 
                  ? (isRTL 
                    ? `لديك ${canCreate.currentCount} من ${canCreate.limit} متاجر` 
                    : `You have ${canCreate.currentCount} of ${canCreate.limit} stores`)
                  : ''}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">{isRTL ? 'اسم المتجر' : 'Store Name'} *</Label>
            <Input
              id="name"
              placeholder={isRTL ? 'مثال: متجر الإلكترونيات' : 'e.g. Electronics Store'}
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              disabled={loading}
            />
          </div>

          {/* Subdomain Selection Section */}
          {formData.name.trim() && (
            <div className="space-y-3 p-4 bg-muted/50 rounded-lg border">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">
                  {isRTL ? 'عنوان المتجر (Subdomain)' : 'Store Subdomain'} *
                </Label>
                {checkingSubdomain ? (
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                ) : isSubdomainAvailable ? (
                  <CheckCircle2 className="h-4 w-4 text-success" />
                ) : isSubdomainAvailable === false ? (
                  <AlertCircle className="h-4 w-4 text-destructive" />
                ) : null}
              </div>

              {/* Show selected/available subdomain */}
              {formData.subdomain && isSubdomainAvailable && (
                <div className="flex items-center gap-2 p-3 bg-background rounded-lg border border-success/20">
                  <span className="font-mono text-sm font-semibold text-foreground">
                    {formData.subdomain}.saeaa.com
                  </span>
                  <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0" />
                </div>
              )}

              {/* Show 3 choices if subdomain is duplicate */}
              {showSubdomainChoices && subdomainSuggestions.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm text-destructive font-medium">
                    {isRTL 
                      ? 'هذا العنوان محجوز، اختر واحداً من الاقتراحات التالية:' 
                      : 'This subdomain is taken, please choose one of the following:'}
                  </p>
                  <div className="grid grid-cols-1 gap-2">
                    {subdomainSuggestions.slice(0, 3).map((suggestion) => (
                      <Button
                        key={suggestion}
                        type="button"
                        variant={formData.subdomain === suggestion ? "default" : "outline"}
                        className="h-auto py-3 justify-start"
                        onClick={() => handleSelectSubdomain(suggestion)}
                        disabled={loading}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="font-mono text-sm">
                            {suggestion}.saeaa.com
                          </span>
                          {formData.subdomain === suggestion && (
                            <CheckCircle2 className="h-4 w-4 text-success" />
                          )}
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Show checking message */}
              {checkingSubdomain && (
                <p className="text-xs text-muted-foreground">
                  {isRTL ? 'جاري التحقق من توفر العنوان...' : 'Checking availability...'}
                </p>
              )}

              {/* Show preview if no subdomain selected yet */}
              {!formData.subdomain && !checkingSubdomain && !showSubdomainChoices && (
                <p className="text-xs text-muted-foreground">
                  {isRTL 
                    ? 'سيتم إنشاء العنوان تلقائياً من اسم المتجر' 
                    : 'Subdomain will be automatically generated from store name'}
                </p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="description">{isRTL ? 'وصف المتجر' : 'Store Description'}</Label>
            <Textarea
              id="description"
              placeholder={isRTL ? 'اكتب وصفاً مختصراً عن متجرك...' : 'Write a brief description about your store...'}
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              disabled={loading}
              className="min-h-[100px]"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => navigate('/dashboard')}
              disabled={loading}
            >
              {isRTL ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  {isRTL ? 'جاري الإنشاء...' : 'Creating...'}
                </>
              ) : (
                <>
                  <Store className="h-4 w-4 mr-2" />
                  {isRTL ? 'إنشاء المتجر' : 'Create Store'}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
