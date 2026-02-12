import { useState, useEffect, useContext } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { AuthContext } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, Mail, Lock, ArrowRight, CheckCircle2, Loader2, LogIn, Key, ArrowLeft } from 'lucide-react';
import { InteractiveFace, FaceState } from '@/components/ui/InteractiveFace';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useTranslation } from 'react-i18next';
import { authService } from '@/services/auth.service';
import { coreApi, apiClient } from '@/lib/api';
import { getLogoUrl, BRAND_NAME_AR, BRAND_NAME_EN, BRAND_TAGLINE_AR, BRAND_TAGLINE_EN } from '@/config/logo.config';
import { VersionFooter } from '@/components/common/VersionFooter';
import { getProfessionalErrorMessage } from '@/lib/toast-errors';
import { isMainDomain } from '@/lib/domain';

export default function Login() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const navigate = useNavigate();
  const location = useLocation();
  const authContext = useContext(AuthContext);
  const { toast } = useToast();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string>(getLogoUrl());
  const [brandNameAr, setBrandNameAr] = useState(BRAND_NAME_AR);
  const [brandNameEn, setBrandNameEn] = useState(BRAND_NAME_EN);
  const [brandTaglineAr, setBrandTaglineAr] = useState(BRAND_TAGLINE_AR);
  const [brandTaglineEn, setBrandTaglineEn] = useState(BRAND_TAGLINE_EN);
  
  // Interactive Face States
  const [faceState, setFaceState] = useState<FaceState>('excited');
  const [isFocused, setIsFocused] = useState(false);
  const [passwordFieldActive, setPasswordFieldActive] = useState(false);

  // Recovery ID states
  const [showRecoveryMode, setShowRecoveryMode] = useState(false);
  const [recoveryId, setRecoveryId] = useState('');
  const [recoveryPassword, setRecoveryPassword] = useState('');
  const [recoveredEmail, setRecoveredEmail] = useState<string | null>(null);

  // 2FA states
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false);
  const [pendingCustomerId, setPendingCustomerId] = useState<string | null>(null);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [useRecoveryCode, setUseRecoveryCode] = useState(false);

  // Handle focus state changes for face
  useEffect(() => {
    if (faceState === 'happy' || faceState === 'sad') return;
    
    if (passwordFieldActive) {
      setFaceState('sleeping');
    } else if (isFocused) {
      setFaceState('attention');
    } else {
      setFaceState('excited');
    }
  }, [isFocused, passwordFieldActive, faceState]);

  // Fetch site configuration to get logo and branding
  useEffect(() => {
    const fetchSiteConfig = async () => {
      // If on main domain, keep default branding
      if (isMainDomain()) return;

      try {
        const config = await coreApi.get('/site-config');
        if (config?.settings) {
          if (config.settings.storeLogoUrl) {
            setLogoUrl(config.settings.storeLogoUrl);
          }
          if (config.settings.storeName) {
            setBrandNameAr(config.settings.storeName);
            setBrandNameEn(config.settings.storeName);
          }
          if (config.settings.description) {
            setBrandTaglineAr(config.settings.description);
            setBrandTaglineEn(config.settings.description);
          }
        }
      } catch (error) {
        console.error('Failed to fetch site config:', error);
      }
    };
    fetchSiteConfig();
  }, []);

  // If context is not available, show loading state (after all hooks)
  if (!authContext) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  const { login, loginWithTokens, verifyUser2FA } = authContext;

  const handleInputChange = (setter: (val: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setter(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await login(identifier, password);
      
      // If 2FA is required
      if (result.requiresTwoFactor) {
        setRequiresTwoFactor(true);
        setPendingCustomerId(result.customerId || null);
        toast({
          title: isRTL ? 'مطلوب التحقق بخطوتين' : 'Two-Factor Authentication Required',
          description: isRTL ? 'يرجى إدخال الرنز من تطبيق المصادقة الخاص بك' : 'Please enter the code from your authenticator app',
        });
        setLoading(false);
        return;
      }

      // If password change required, redirect to change password page
      if (result.mustChangePassword) {
        toast({
          title: isRTL ? 'تم تسجيل الدخول' : 'Login successful',
          description: isRTL ? 'يرجى تغيير كلمة المرور للمتابعة' : 'Please change your password to continue',
        });
        navigate('/change-password', { replace: true });
        return;
      }
      
      // Check if user has a tenant after login
      // Wait a bit for user state to update
      setTimeout(() => {
        const userStr = localStorage.getItem('user');
        const userData = userStr ? JSON.parse(userStr) : null;
        const hasTenant = userData?.tenantId && userData.tenantId !== 'default' && userData.tenantId !== null;
        
        toast({
          title: t('common.success'),
          description: hasTenant ? 'مرحباً بك في لوحة التحكم' : 'مرحباً بك! يرجى إعداد متجرك أولاً',
        });
        
        setTimeout(() => {
          const state = location.state as { from?: { pathname: string } } | null;
          const from = state?.from?.pathname;
          
          // If we have a return path that isn't login/auth, go there
          if (from && !from.includes('/login') && !from.includes('/auth/')) {
            navigate(from, { replace: true });
          } else {
            // Otherwise go to dashboard or setup
            navigate(hasTenant ? '/dashboard' : '/setup');
          }
        }, 500);
      }, 100);
    } catch (error: unknown) {
      // API client already handles displaying the error toast
      console.error('Login failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTwoFactorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingCustomerId || !twoFactorCode) return;

    setLoading(true);
    try {
      await verifyUser2FA(pendingCustomerId, twoFactorCode);

      toast({
        title: isRTL ? 'تم التحقق بنجاح' : 'Verification successful',
        description: isRTL ? 'مرحباً بك من جديد' : 'Welcome back!',
      });

      // Redirect after successful 2FA
      setTimeout(() => {
        const userStr = localStorage.getItem('user');
        const userData = userStr ? JSON.parse(userStr) : null;
        const hasTenant = userData?.tenantId && userData.tenantId !== 'default' && userData.tenantId !== null;
        navigate(hasTenant ? '/dashboard' : '/setup');
      }, 500);
    } catch (error: unknown) {
      console.error('2FA verification failed:', error);
      // Toast is typically handled by interceptor, but we can add one here if needed
    } finally {
      setLoading(false);
    }
  };

  const handleRecoveryLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await authService.loginWithRecoveryId(recoveryId, recoveryPassword);
      
      if (loginWithTokens) {
        loginWithTokens(result.accessToken, result.refreshToken);
      } else {
        localStorage.setItem('accessToken', result.accessToken);
        localStorage.setItem('refreshToken', result.refreshToken);
      }
      
      // Check if user has a tenant, if not redirect to setup
      const hasTenant = result.tenantId && result.tenantId !== 'default';
      toast({
        title: 'تم تسجيل الدخول بنجاح',
        description: hasTenant 
          ? `مرحباً بك! بريدك الإلكتروني: ${result.email}`
          : `مرحباً بك! يرجى إعداد متجرك أولاً. بريدك الإلكتروني: ${result.email}`,
      });
      setTimeout(() => {
        navigate(hasTenant ? '/dashboard' : '/setup');
      }, 1500);
    } catch (error: unknown) {
      // API client already handles displaying the error toast
      console.error('Recovery login failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRecoverEmail = async () => {
    if (!recoveryId) {
      toast({
        variant: 'destructive',
        title: isRTL ? 'معلومة مطلوبة' : 'Required Information',
        description: isRTL ? 'يرجى إدخال رمز الاسترداد للمتابعة' : 'Please enter your recovery ID to continue',
      });
      return;
    }

    setLoading(true);
    try {
      const result = await authService.recoverEmail(recoveryId);
      setRecoveredEmail(result.maskedEmail);
      toast({
        title: isRTL ? 'تم العثور على الحساب' : 'Account Found',
        description: isRTL 
          ? `البريد الإلكتروني المرتبط: ${result.maskedEmail}`
          : `Associated email: ${result.maskedEmail}`,
      });
    } catch (error: unknown) {
      // API client already handles displaying the error toast
      console.error('Email recovery failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    // Use apiClient.authUrl which is already configured, or fallback to env
    const authBaseUrl = apiClient.authUrl || import.meta.env.VITE_AUTH_BASE_URL || 'http://localhost:3001';
    // Remove trailing slash and ensure proper path construction
    const baseUrl = authBaseUrl.replace(/\/$/, ''); // Remove trailing slash
    // Ensure /auth/google path (backend route is @Controller('auth') @Get('google'))
    const googleAuthUrl = baseUrl.endsWith('/auth') 
      ? `${baseUrl}/google` 
      : `${baseUrl}/auth/google`;
    window.location.href = googleAuthUrl;
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 gradient-primary p-12 flex-col justify-between relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 bg-grid-pattern opacity-10" />
        <div className="absolute top-20 right-20 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }} />
        
        <div className="relative z-10">
          <Link to="/" className="inline-flex flex-col gap-4 group">
            <div className="flex items-center gap-4">
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-xl overflow-hidden bg-white/10 backdrop-blur-sm border border-white/20 shadow-lg">
                <img src={logoUrl} alt={`${BRAND_NAME_EN} - ${BRAND_NAME_AR}`} className="w-full h-full object-contain p-2 group-hover:scale-110 transition-transform" />
              </div>
              <div className="flex flex-col">
                <h1 className="text-4xl font-heading font-bold text-white">{brandNameAr}</h1>
                <p className="text-xl font-semibold text-white/80">{brandNameEn}</p>
              </div>
            </div>
            <p className="text-white/70 text-sm">{brandTaglineAr} | {brandTaglineEn}</p>
          </Link>
        </div>

        <div className="relative z-10 space-y-6">
          <h1 className="text-5xl font-heading font-bold text-white leading-tight">
            مرحباً بعودتك!
            <br />
            سجل دخولك الآن
          </h1>
          <p className="text-xl text-white/90">
            أدر متجرك الإلكتروني بكل سهولة واحترافية
          </p>
          <div className="space-y-4 pt-4">
            <div className="flex items-center gap-3 text-white">
              <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <span>وصول فوري إلى لوحة التحكم</span>
            </div>
            <div className="flex items-center gap-3 text-white">
              <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <span>أمان عالي المستوى</span>
            </div>
            <div className="flex items-center gap-3 text-white">
              <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <span>دعم فني متاح 24/7</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-white/50 text-sm">
          {t('landing.footer.copyright')}
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-950 relative overflow-hidden">
         {/* Background Decoration */}
         <div className="absolute inset-0 bg-grid-black/[0.02] dark:bg-grid-white/[0.02]" />
         <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl pointer-events-none translate-x-1/2 -translate-y-1/2" />
         <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-3xl pointer-events-none -translate-x-1/2 translate-y-1/2" />

        <div className="w-full max-w-md space-y-8 relative z-10">
          {/* Mobile Logo with Bilingual Branding */}
          <Link to="/" className="lg:hidden flex flex-col items-center gap-4 mb-10 group">
            <div className="flex items-center gap-4">
              <div className="w-24 h-24 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 border border-border shadow-xl ring-1 ring-black/5">
                <img src={logoUrl} alt={`${brandNameEn} - ${brandNameAr}`} className="w-full h-full object-contain p-3 group-hover:scale-110 transition-transform duration-500" />
              </div>
              <div className="flex flex-col">
                <h1 className="text-3xl font-heading font-black bg-gradient-to-br from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">{brandNameAr}</h1>
                <p className="text-lg font-bold text-primary tracking-wide">{brandNameEn}</p>
              </div>
            </div>
          </Link>

          <Card className="border-0 shadow-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl ring-1 ring-black/5 dark:ring-white/10 overflow-hidden">
            <CardHeader className="space-y-4 text-center pb-8 pt-8">
              {/* Interactive Face */}
              <div className="flex justify-center mb-2">
                <div className="transform hover:scale-110 transition-transform duration-300 drop-shadow-lg">
                  <InteractiveFace 
                    state={faceState} 
                    className="w-24 h-24"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <CardTitle className="text-3xl font-heading font-bold text-slate-900 dark:text-white">
                  {requiresTwoFactor ? 'التحقق بخطوتين' : showRecoveryMode ? 'استرداد الحساب' : 'تسجيل الدخول'}
                </CardTitle>
                <CardDescription className="text-base font-medium text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                  {requiresTwoFactor 
                    ? 'أدخل الرمز المكون من 6 أرقام من تطبيق المصادقة'
                    : showRecoveryMode 
                      ? 'أدخل رمز الاسترداد السري وكلمة المرور' 
                      : 'سجل دخولك لإدارة متجرك الإلكتروني'}
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="space-y-6 px-8 pb-8">
              {requiresTwoFactor ? (
                <form onSubmit={handleTwoFactorSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="twoFactorCode" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      {useRecoveryCode 
                        ? (isRTL ? 'رمز الاسترداد' : 'Recovery Code')
                        : (isRTL ? 'رمز التحقق (TOTP)' : 'Verification Code (TOTP)')}
                    </Label>
                    <div className="relative group">
                      <Key className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-primary transition-colors pointer-events-none" />
                      <Input
                        id="twoFactorCode"
                        type="text"
                        inputMode={useRecoveryCode ? 'text' : 'numeric'}
                        pattern={useRecoveryCode ? undefined : "[0-9]*"}
                        maxLength={useRecoveryCode ? 10 : 6}
                        placeholder={useRecoveryCode ? "XXXXXXXXXX" : "000000"}
                        value={twoFactorCode}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (useRecoveryCode) {
                            setTwoFactorCode(val.toUpperCase().replace(/[^A-Z0-9]/g, ''));
                          } else {
                            setTwoFactorCode(val.replace(/[^0-9]/g, ''));
                          }
                        }}
                        required
                        autoFocus
                        className={`h-14 pr-10 text-center text-2xl tracking-[${useRecoveryCode ? '0.2em' : '1em'}] font-mono bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all rounded-xl`}
                      />
                    </div>
                  </div>

                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => {
                        setUseRecoveryCode(!useRecoveryCode);
                        setTwoFactorCode('');
                      }}
                      className="text-sm text-primary hover:text-primary/80 hover:underline font-semibold transition-colors"
                    >
                      {useRecoveryCode 
                        ? (isRTL ? 'استخدام تطبيق المصادقة' : 'Use Authenticator App')
                        : (isRTL ? 'استخدام رمز الاسترداد' : 'Use Recovery Code')}
                    </button>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full h-14 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold text-lg rounded-xl shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
                    disabled={loading || (useRecoveryCode ? twoFactorCode.length < 8 : twoFactorCode.length !== 6)}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="ml-2 h-5 w-5 animate-spin" />
                        <span>{isRTL ? 'جاري التحقق...' : 'Verifying...'}</span>
                      </>
                    ) : (
                      <>
                        <ArrowRight className="ml-2 h-5 w-5" />
                        <span>{isRTL ? 'تحقق ودخول' : 'Verify & Login'}</span>
                      </>
                    )}
                  </Button>

                  <button
                    type="button"
                    onClick={() => {
                      setRequiresTwoFactor(false);
                      setTwoFactorCode('');
                      setUseRecoveryCode(false);
                    }}
                    className="w-full py-2 text-sm text-slate-500 hover:text-primary transition-colors flex items-center justify-center gap-2 font-medium"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    {isRTL ? 'العودة لتسجيل الدخول' : 'Back to Login'}
                  </button>
                </form>
              ) : !showRecoveryMode ? (
                <>
                  {/* Login Form */}
                  <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="space-y-2.5">
                        <Label htmlFor="identifier" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                          {t('auth.login.emailOrUsername', 'البريد الإلكتروني أو اسم المستخدم')}
                        </Label>
                        <div className="relative group">
                          <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-primary transition-colors pointer-events-none" />
                          <Input
                            id="identifier"
                            type="text"
                            placeholder="name@example.com"
                            value={identifier}
                            onChange={handleInputChange(setIdentifier)}
                            onFocus={() => setIsFocused(true)}
                            onBlur={() => setIsFocused(false)}
                            required
                            className="h-12 pr-10 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all rounded-xl font-medium"
                          />
                        </div>
                      </div>

                      <div className="space-y-2.5">
                        <Label htmlFor="password" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                          {t('auth.login.password')}
                        </Label>
                        <div className="relative group">
                          <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-primary transition-colors pointer-events-none" />
                          <Input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={handleInputChange(setPassword)}
                            onFocus={() => setPasswordFieldActive(true)}
                            onBlur={() => setPasswordFieldActive(false)}
                            required
                            autoComplete="current-password"
                            className="h-12 pl-10 pr-10 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all rounded-xl font-medium"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1.5 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 rounded-lg"
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>

                    {/* Remember & Forgot */}
                    <div className="flex items-center justify-between pt-1">
                      <label className="flex items-center gap-2.5 cursor-pointer group">
                        <div className="relative flex items-center">
                          <input
                            type="checkbox"
                            className="peer w-5 h-5 rounded-md border-2 border-slate-300 dark:border-slate-600 text-primary focus:ring-2 focus:ring-primary/30 transition-all checked:bg-primary checked:border-primary"
                          />
                        </div>
                        <span className="text-sm font-medium text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">تذكرني</span>
                      </label>
                      <Link
                        to="/forgot-password"
                        className="text-sm text-primary hover:text-primary/80 font-bold transition-colors hover:underline"
                      >
                        نسيت كلمة المرور؟
                      </Link>
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full h-14 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold text-lg rounded-xl shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="ml-2 h-5 w-5 animate-spin" />
                          <span>{t('common.loading')}</span>
                        </>
                      ) : (
                        <>
                          <LogIn className="ml-2 h-5 w-5" />
                          <span>تسجيل الدخول</span>
                          <ArrowRight className="mr-2 h-5 w-5 opacity-80" />
                        </>
                      )}
                    </Button>
                  </form>

                  {/* Recovery ID Link */}
                  <div className="text-center pt-4">
                    <button
                      type="button"
                      onClick={() => setShowRecoveryMode(true)}
                      className="inline-flex items-center gap-2 py-2 px-4 rounded-full text-xs font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                    >
                      <Key className="w-3.5 h-3.5" />
                      نسيت بريدك الإلكتروني؟ استخدم رمز الاسترداد
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {/* Recovery Mode Form */}
                  <div className="space-y-6">
                    <div className="space-y-2.5">
                      <Label htmlFor="recoveryId" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                        رمز الاسترداد | Recovery ID
                      </Label>
                      <div className="relative group">
                        <Key className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                        <Input
                          id="recoveryId"
                          type="text"
                          placeholder="XXXX-XXXX-XXXX-XXXX"
                          value={recoveryId}
                          onChange={handleInputChange(setRecoveryId)}
                          className="h-12 pr-10 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all rounded-xl font-mono text-center tracking-wider"
                        />
                      </div>
                    </div>

                    {/* Step 1: Reveal Email Button */}
                    {!recoveredEmail && (
                      <Button
                        type="button"
                        onClick={handleRecoverEmail}
                        disabled={loading || !recoveryId}
                        className="w-full h-12 gradient-primary rounded-xl font-bold hover:scale-[1.02] transition-transform"
                      >
                        {loading ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <>
                            <Key className="ml-2 h-5 w-5" />
                            <span>كشف البريد الإلكتروني</span>
                          </>
                        )}
                      </Button>
                    )}

                    {/* Step 2: Email Revealed - Show options */}
                    {recoveredEmail && (
                      <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-5 text-center">
                          <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mb-2">
                            ✅ تم العثور على حسابك!
                          </p>
                          <p className="text-xl font-mono font-bold text-slate-800 dark:text-white dir-ltr tracking-wide">
                            {recoveredEmail}
                          </p>
                        </div>

                        <div className="space-y-3">
                          <Button
                            type="button"
                            onClick={async () => {
                              setLoading(true);
                              try {
                                await authService.sendResetByRecoveryId(recoveryId);
                                toast({
                                  title: 'تم الإرسال!',
                                  description: 'تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني',
                                });
                              } catch (error) {
                                const { title, description } = getProfessionalErrorMessage(
                                  error,
                                  { operation: isRTL ? 'إرسال' : 'send', resource: isRTL ? 'رابط إعادة التعيين' : 'reset link' },
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
                            }}
                            disabled={loading}
                            className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition-all"
                          >
                            {loading ? (
                              <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                              <>
                                <Mail className="ml-2 h-5 w-5" />
                                <span>إرسال رابط إعادة التعيين للبريد</span>
                              </>
                            )}
                          </Button>

                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setShowRecoveryMode(false);
                              setIdentifier(recoveredEmail.replace('***', ''));
                              toast({
                                title: 'تم نسخ البريد',
                                description: 'يمكنك الآن تسجيل الدخول باستخدام بريدك الإلكتروني',
                              });
                            }}
                            className="w-full h-12 border-2 border-slate-200 dark:border-slate-700 hover:border-primary hover:text-primary hover:bg-transparent rounded-xl font-bold transition-all"
                          >
                            <LogIn className="ml-2 h-5 w-5" />
                            <span>تسجيل الدخول بالبريد</span>
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Back to Email Login */}
                  <div className="text-center pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowRecoveryMode(false);
                        setRecoveryId('');
                        setRecoveryPassword('');
                        setRecoveredEmail(null);
                      }}
                      className="w-full py-2 text-sm text-slate-500 hover:text-primary transition-colors flex items-center justify-center gap-2 font-medium"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      العودة لتسجيل الدخول بالبريد
                    </button>
                  </div>
                </>
              )}
            </CardContent>

            <CardFooter className="flex flex-col gap-4 py-6 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800">
              <p className="text-sm text-center text-slate-600 dark:text-slate-400 font-medium">
                ليس لديك حساب؟{' '}
                <Link 
                  to="/register" 
                  className="text-primary hover:text-primary/80 font-bold hover:underline transition-colors"
                >
                  إنشاء حساب جديد
                </Link>
              </p>
            </CardFooter>
          </Card>
          
          <div className="text-center text-xs text-slate-400 dark:text-slate-600 font-medium tracking-wide">
             مدعوم من منصة كون &copy; {new Date().getFullYear()}
          </div>
        </div>
      </div>
    </div>
  );
}
