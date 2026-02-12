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
  phone: string;
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
    phone: '',
  });
  const [subdomainSuggestions, setSubdomainSuggestions] = useState<string[]>([]);
  const [checkingSubdomain, setCheckingSubdomain] = useState(false);
  const [isSubdomainAvailable, setIsSubdomainAvailable] = useState<boolean | null>(null);
  const [showSubdomainChoices, setShowSubdomainChoices] = useState(false);

  // Check authentication tokens on mount
  useEffect(() => {
    const checkAuth = () => {
      // Check if user has access token - required for creating a store
      const accessToken = localStorage.getItem('accessToken') || document.cookie.split('; ').find(row => row.startsWith('accessToken='))?.split('=')[1];
      const refreshToken = localStorage.getItem('refreshToken') || document.cookie.split('; ').find(row => row.startsWith('refreshToken='))?.split('=')[1];
      
      if (!accessToken && !refreshToken && !authLoading) {
        // No tokens found - user is not authenticated
        console.warn('[MarketSetup] No authentication tokens found, redirecting to login');
        toast({
          title: isRTL ? 'يرجى تسجيل الدخول' : 'Please Log In',
          description: isRTL 
            ? 'يجب عليك تسجيل الدخول أولاً لإنشاء متجر' 
            : 'You must be logged in to create a store',
          variant: 'destructive',
        });
        
        // Redirect to login after a short delay
        setTimeout(() => {
          navigate('/login', { replace: true });
        }, 1500);
      }
    };
    
    checkAuth();
  }, [authLoading, navigate, toast, isRTL]);

  // Check if user can create another market
  useEffect(() => {
    const checkMarketLimit = async () => {
      if (!authLoading && user) {
        try {
          setCheckingLimit(true);
          const limitCheck = await authService.canCreateMarket();
          setCanCreate(limitCheck);
          
          // If user has no tenant and can't create, show error but DON'T redirect
          // (redirecting to dashboard would cause a loop since they have no tenant)
          if (!user.tenantId && !limitCheck.allowed) {
            toast({
              title: isRTL ? 'خطأ' : 'Error',
              description: isRTL 
                ? 'لا يمكن إنشاء متجر. يرجى الاتصال بالدعم.' 
                : 'Cannot create store. Please contact support.',
              variant: 'destructive',
            });
            // Don't redirect - stay on this page and show the limit reached UI
          }
        } catch (error) {
          console.error('Failed to check market limit:', error);
          // On error, allow creation by default (better UX than blocking)
          // The backend will still enforce the limit when they try to create
          setCanCreate({ allowed: true, currentCount: 0, limit: 2 });
        } finally {
          setCheckingLimit(false);
        }
      }
    };

    checkMarketLimit();
  }, [user, authLoading, navigate, toast, isRTL]);

  // Pre-fill phone from user context
  useEffect(() => {
    if (user?.phone && !formData.phone) {
      setFormData(prev => ({ ...prev, phone: user.phone }));
    }
  }, [user?.phone, formData.phone]);

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
      } catch (error: unknown) { // Changed from 'any' to 'unknown'
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
    } catch (err: unknown) {
      const error = err as { 
        status?: number; 
        message?: string; 
        data?: { message?: string | string[] } | string 
      };
      console.error('Error creating market:', error);
      
      // Handle Conflict (409) - Subdomain taken
      if (error?.status === 409 || error?.message?.includes('Conflict') || error?.message?.includes('taken')) {
        setIsSubdomainAvailable(false);
        setShowSubdomainChoices(true);
        setFormData(prev => ({ ...prev, subdomain: '' }));
        
        // Generate fallback suggestions client-side since API might say it's available (sync issue)
        const base = generateSubdomain(formData.name);
        const suggestions = [
          `${base}-store`,
          `${base}-shop`,
          `${base}-${Math.floor(Math.random() * 999)}`
        ];
        setSubdomainSuggestions(suggestions);
        
        toast({
          title: isRTL ? 'عذراً' : 'Sorry',
          description: isRTL 
            ? 'هذا العنوان محجوز مسبقاً، يرجى اختيار عنوان آخر' 
            : 'This subdomain is already taken, please choose another one',
          variant: 'destructive',
        });
        return;
      }
      
      // Extract error message from various possible formats
      let errorMessage = '';
      
      // 1. Try to get message from error object directly (usually set by ApiError)
      if (typeof error?.message === 'string') {
        errorMessage = error.message;
        
        // Handle case where message is stringified JSON
        if (errorMessage.trim().startsWith('{')) {
          try {
             const parsed = JSON.parse(errorMessage);
             errorMessage = parsed.message || parsed.error || errorMessage;
          } catch (e) {
            // Ignore JSON parse error
          }
        }
      }
      
      // 2. Check for detailed error response in data
      if (!errorMessage && error?.data?.message) {
        const msg = error.data.message;
        if (Array.isArray(msg)) {
          errorMessage = msg.join(', ');
        } else if (typeof msg === 'object' && msg !== null) {
          errorMessage = (msg as { message?: string }).message || JSON.stringify(msg);
        } else if (msg) {
          errorMessage = String(msg);
        }
      } else if (!errorMessage && typeof error?.data === 'string') {
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
    const hasTenant = user?.tenantId && user.tenantId !== 'default';
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
          <CardContent className="space-y-3">
            {hasTenant ? (
              <Button 
                onClick={() => navigate('/dashboard', { replace: true })} 
                className="w-full"
              >
                {isRTL ? 'العودة إلى لوحة التحكم' : 'Back to Dashboard'}
              </Button>
            ) : (
              <p className="text-center text-muted-foreground text-sm">
                {isRTL ? 'يرجى الاتصال بالدعم لحل هذه المشكلة.' : 'Please contact support to resolve this issue.'}
              </p>
            )}
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

          <div className="space-y-2">
            <Label htmlFor="phone">{isRTL ? 'رقم الهاتف' : 'Phone Number'} {isRTL ? '(اختياري)' : '(Optional)'}</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="05xxxxxxxx"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
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
                <div className="space-y-2">
                  <p className="text-xs text-success font-medium flex items-center gap-1.5">
                    <CheckCircle2 className="h-3 w-3" />
                    {isRTL ? 'هذا العنوان متاح!' : 'This subdomain is available!'}
                  </p>
                  <div className="flex items-center justify-between p-3 bg-success/5 rounded-lg border border-success/20 group">
                    <span className="font-mono text-sm font-bold text-foreground truncate">
                      {formData.subdomain}.{import.meta.env.VITE_PLATFORM_DOMAIN || 'saeaa.com'}
                    </span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 px-2 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => {
                        setIsSubdomainAvailable(false);
                        setShowSubdomainChoices(true);
                        setFormData(prev => ({ ...prev, subdomain: '' }));
                      }}
                    >
                      {isRTL ? 'تغيير' : 'Change'}
                    </Button>
                  </div>
                </div>
              )}

              {/* Show 3 choices if subdomain is duplicate */}
              {showSubdomainChoices && subdomainSuggestions.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 p-2 bg-destructive/5 rounded border border-destructive/10">
                    <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
                    <p className="text-xs text-destructive font-medium">
                      {isRTL 
                        ? 'عنوان المتجر محجوز بالفعل. يرجى اختيار أحد العناوين المتاحة التالية:' 
                        : 'This subdomain is already taken. Please pick one of these available ones:'}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-2">
                    {subdomainSuggestions.slice(0, 3).map((suggestion, index) => (
                      <div
                        key={suggestion}
                        onClick={() => handleSelectSubdomain(suggestion)}
                        className={`relative p-3 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md flex items-center justify-between ${
                          formData.subdomain === suggestion 
                            ? "border-primary bg-primary/5 shadow-sm" 
                            : "border-muted hover:border-primary/30"
                        }`}
                      >
                        <div className="flex flex-col">
                          <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                            {isRTL ? `اقتراح ${index + 1}` : `Suggestion ${index + 1}`}
                          </span>
                          <span className="font-mono text-sm font-semibold">
                            {suggestion}.{import.meta.env.VITE_PLATFORM_DOMAIN || 'saeaa.com'}
                          </span>
                        </div>
                        {formData.subdomain === suggestion ? (
                          <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                            <CheckCircle2 className="h-4 w-4 text-white" />
                          </div>
                        ) : (
                          <div className="h-5 w-5 rounded-full border border-muted" />
                        )}
                      </div>
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
