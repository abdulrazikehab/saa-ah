import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, LogIn, Mail, Lock, Eye, EyeOff, X, ShoppingBag, Sparkles } from 'lucide-react';
import { apiClient } from '@/services/core/api-client';
import { getErrorMessage, isErrorObject } from '@/lib/error-utils';
import { getProfessionalErrorMessage } from '@/lib/toast-errors';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { getTenantContext } from '@/lib/storefront-utils';
import { useStoreSettings } from '@/contexts/StoreSettingsContext';
import { OptimizedImage } from '@/components/ui/OptimizedImage';

interface CustomerLoginProps {
  onClose: () => void;
  onSwitchToSignup: () => void;
  onLoginSuccess?: () => void;
}

export function CustomerLogin({ onClose, onSwitchToSignup, onLoginSuccess }: CustomerLoginProps) {
  const { toast } = useToast();
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const { settings } = useStoreSettings();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        variant: 'destructive',
        title: isRTL ? 'معلومة مطلوبة' : 'Required Information',
        description: isRTL 
          ? 'يرجى إدخال البريد الإلكتروني وكلمة المرور' 
          : 'Please enter your email and password',
      });
      return;
    }
    
    setLoading(true);
    
    try {
      // Get tenant context from current store to ensure customer login works with the correct merchant's table
      const tenantContext = getTenantContext();
      
      // Add tenant headers to ensure customer login works with the correct merchant's table
      const headers: Record<string, string> = {};
      if (tenantContext.subdomain) {
        headers['X-Tenant-Domain'] = tenantContext.domain;
      }
      
      const response = await apiClient.post(
        `${apiClient.authUrl}/customers/login`, 
        { email, password },
        { 
          requireAuth: false,
          headers,
        }
      );
      
      if (isErrorObject(response)) {
        throw new Error(getErrorMessage(response));
      }
      
      if (!response || typeof response !== 'object' || !('token' in response)) {
        throw new Error('Invalid response from server');
      }
      
      // Validate token exists
      if (!response.token) {
        throw new Error('No token received from server');
      }
      
      // Store token and customer data
      localStorage.setItem('customerToken', String(response.token));
      if (response.customer) {
        // Include employee-specific fields if present
        const customerData = {
          ...response.customer,
          ...(response.isEmployee && { isEmployee: true }),
          ...(response.employerEmail && { employerEmail: response.employerEmail }),
          ...(response.permissions && { permissions: response.permissions }),
        };
        localStorage.setItem('customerData', JSON.stringify(customerData));
      }
      
      // Dispatch custom event to notify other components (like CustomerProtectedRoute)
      // that login was successful in the same tab
      window.dispatchEvent(new CustomEvent('customerLogin', { 
        detail: { 
          token: response.token, 
          customer: response.customer,
          isEmployee: response.isEmployee,
          employerEmail: response.employerEmail,
          permissions: response.permissions,
        } 
      }));
      
      toast({
        title: isRTL ? 'تم تسجيل الدخول بنجاح' : 'Login successful',
        description: isRTL ? 'مرحباً بك في متجرنا' : 'Welcome back!',
      });
      
      // Call success callback before closing
      onLoginSuccess?.();
      
      // Small delay to ensure state updates before closing modal
      setTimeout(() => {
        onClose();
      }, 100);
    } catch (error: unknown) {
      console.error('Login error:', error);
      const { title, description } = getProfessionalErrorMessage(
        error,
        { operation: isRTL ? 'تسجيل الدخول' : 'login', resource: isRTL ? 'كعميل' : 'as customer' },
        isRTL
      );
      
      toast({
        variant: 'destructive',
        title,
        description,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="w-full max-w-md relative animate-scale-in">
        {/* Card */}
        <div className="relative overflow-hidden rounded-3xl glass-effect-strong border border-border/50 shadow-2xl">
          {/* Gradient top line */}
          <div className="absolute top-0 left-0 right-0 h-1 gradient-aurora animate-gradient bg-[length:200%_auto]" />
          
          {/* Background effects */}
          <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-40 h-40 rounded-full bg-secondary/10 blur-3xl" />
          
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute left-4 top-4 p-2.5 rounded-xl bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-all z-10"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Header */}
          <div className="relative pt-10 pb-6 px-8 text-center">
            <div className="flex flex-col items-center gap-4 mb-6">
              <div className="w-24 h-24 rounded-2xl overflow-hidden bg-white shadow-xl border-2 border-primary/10 p-2">
                <OptimizedImage 
                  src={settings.storeLogoUrl || settings.logoUrl || ''} 
                  alt={isRTL ? settings.storeNameAr || settings.storeName : settings.storeName}
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="space-y-1">
                <h2 className="text-2xl font-bold gradient-text">
                  {isRTL ? settings.storeNameAr || settings.storeName : settings.storeName}
                </h2>
                <p className="text-sm text-muted-foreground line-clamp-2 max-w-[250px] mx-auto">
                  {isRTL ? settings.storeDescriptionAr || settings.storeDescription : settings.storeDescription}
                </p>
              </div>
            </div>
            
            <div className="inline-flex items-center justify-center w-12 h-12 mb-4 rounded-xl bg-primary/10 text-primary">
              <ShoppingBag className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold mb-2">
              {isRTL ? 'مرحباً بعودتك' : 'Welcome Back'}
            </h3>
            <p className="text-muted-foreground text-sm">
              {isRTL ? 'سجل دخولك للمتابعة مع طلبك' : 'Sign in to continue with your order'}
            </p>
          </div>

          {/* Form */}
          <div className="relative px-8 pb-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="customer-email" className="text-sm font-medium">
                  {isRTL ? 'البريد الإلكتروني' : 'Email'}
                </Label>
                <div className="relative group">
                  <Mail className={cn(
                    "absolute top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors",
                    isRTL ? "right-4" : "left-4"
                  )} />
                  <Input
                    id="customer-email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className={cn(
                      "h-12 text-base rounded-xl border-2 border-border/50 bg-background focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all",
                      isRTL ? "pr-12" : "pl-12"
                    )}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="customer-password" className="text-sm font-medium">
                  {isRTL ? 'كلمة المرور' : 'Password'}
                </Label>
                <div className="relative group">
                  <Lock className={cn(
                    "absolute top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors",
                    isRTL ? "right-4" : "left-4"
                  )} />
                  <Input
                    id="customer-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder={isRTL ? '••••••••' : '••••••••'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className={cn(
                      "h-12 text-base rounded-xl border-2 border-border/50 bg-background focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all",
                      isRTL ? "pr-12 pl-12" : "pl-12 pr-12"
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={cn(
                      "absolute top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors",
                      isRTL ? "left-4" : "right-4"
                    )}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 text-base font-semibold rounded-xl gradient-primary text-white shadow-lg hover:shadow-glow transition-all"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="ml-2 h-5 w-5 animate-spin" />
                    <span>{isRTL ? 'جاري تسجيل الدخول...' : 'Signing in...'}</span>
                  </>
                ) : (
                  <>
                    <LogIn className="ml-2 h-5 w-5" />
                    <span>{isRTL ? 'تسجيل الدخول' : 'Sign In'}</span>
                  </>
                )}
              </Button>
            </form>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-border/50">
              <p className="text-sm text-center text-muted-foreground flex items-center justify-center gap-1 flex-wrap">
                {isRTL ? 'ليس لديك حساب؟' : "Don't have an account?"}
                <button 
                  onClick={onSwitchToSignup}
                  className="text-primary hover:text-primary/80 font-semibold inline-flex items-center gap-1 hover:underline transition-colors"
                >
                  <Sparkles className="h-4 w-4" />
                  {isRTL ? 'أنشئ حساباً جديداً' : 'Create one'}
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
