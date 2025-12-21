import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, Mail, Lock, ArrowRight, CheckCircle2, Loader2, LogIn, Key, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { InteractiveFace, FaceState } from '@/components/ui/InteractiveFace';
import { useTranslation } from 'react-i18next';
import { authService } from '@/services/auth.service';
import { coreApi, apiClient } from '@/lib/api';
import { getLogoUrl, BRAND_NAME_AR, BRAND_NAME_EN, BRAND_TAGLINE_AR, BRAND_TAGLINE_EN } from '@/config/logo.config';
import { VersionFooter } from '@/components/common/VersionFooter';
import { getProfessionalErrorMessage } from '@/lib/toast-errors';

export default function Login() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const navigate = useNavigate();
  const { login, loginWithTokens } = useAuth();
  const { toast } = useToast();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [faceState, setFaceState] = useState<FaceState>('excited');
  const [isFocused, setIsFocused] = useState(false);
  const [passwordFieldActive, setPasswordFieldActive] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string>(getLogoUrl());
  
  // Recovery ID states
  const [showRecoveryMode, setShowRecoveryMode] = useState(false);
  const [recoveryId, setRecoveryId] = useState('');
  const [recoveryPassword, setRecoveryPassword] = useState('');
  const [recoveredEmail, setRecoveredEmail] = useState<string | null>(null);

  // Fetch site configuration to get logo
  useEffect(() => {
    const fetchSiteConfig = async () => {
      try {
        const config = await coreApi.get('/site-config');
        if (config?.settings?.storeLogoUrl) {
          setLogoUrl(config.settings.storeLogoUrl);
        }
      } catch (error) {
        console.error('Failed to fetch site config:', error);
      }
    };
    fetchSiteConfig();
  }, []);

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

  const handleInputChange = (setter: (val: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setter(e.target.value);
    if (faceState === 'sad') {
      setFaceState('attention');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(identifier, password);
      setFaceState('happy');
      
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
          navigate(hasTenant ? '/dashboard' : '/setup');
        }, 500);
      }, 100);
    } catch (error: unknown) {
      setFaceState('sad');
      const { title, description } = getProfessionalErrorMessage(
        error,
        { operation: isRTL ? 'تسجيل الدخول' : 'login', resource: isRTL ? 'الحساب' : 'account' },
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
      
      setFaceState('happy');
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
      setFaceState('sad');
      const { title, description } = getProfessionalErrorMessage(
        error,
        { operation: isRTL ? 'تسجيل الدخول' : 'login', resource: isRTL ? 'باستخدام رمز الاسترداد' : 'using recovery ID' },
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
      const { title, description } = getProfessionalErrorMessage(
        error,
        { operation: isRTL ? 'استرداد' : 'recover', resource: isRTL ? 'البريد الإلكتروني' : 'email' },
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
                <h1 className="text-4xl font-heading font-bold text-white">{BRAND_NAME_AR}</h1>
                <p className="text-xl font-semibold text-white/80">{BRAND_NAME_EN}</p>
              </div>
            </div>
            <p className="text-white/70 text-sm">{BRAND_TAGLINE_AR} | {BRAND_TAGLINE_EN}</p>
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
      <div className="flex-1 flex items-center justify-center p-6 bg-background relative">
        <div className="w-full max-w-md space-y-6">
          {/* Mobile Logo with Bilingual Branding */}
          <Link to="/" className="lg:hidden flex flex-col items-center gap-3 mb-8 group">
            <div className="flex items-center gap-3">
              <div className="w-28 h-28 md:w-32 md:h-32 rounded-xl overflow-hidden bg-card border border-border shadow-lg">
                <img src={logoUrl} alt={`${BRAND_NAME_EN} - ${BRAND_NAME_AR}`} className="w-full h-full object-contain p-2 group-hover:scale-110 transition-transform" />
              </div>
              <div className="flex flex-col">
                <h1 className="text-3xl font-heading font-bold gradient-text">{BRAND_NAME_AR}</h1>
                <p className="text-lg font-semibold text-primary">{BRAND_NAME_EN}</p>
              </div>
            </div>
            <p className="text-muted-foreground text-xs text-center">{BRAND_TAGLINE_AR} | {BRAND_TAGLINE_EN}</p>
          </Link>

          <Card className="shadow-2xl border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader className="space-y-2 text-center pb-6">
              {/* Interactive Face */}
              <div className="flex justify-center mb-2">
                <InteractiveFace 
                  state={faceState} 
                  className="transform hover:scale-105 transition-transform" 
                />
              </div>
              
              <CardTitle className="text-3xl font-heading font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                {showRecoveryMode ? 'استرداد الحساب' : 'تسجيل الدخول'}
              </CardTitle>
              <CardDescription className="text-base text-muted-foreground">
                {showRecoveryMode 
                  ? 'أدخل رمز الاسترداد السري وكلمة المرور' 
                  : 'سجل دخولك لإدارة متجرك الإلكتروني'}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-5">
              {!showRecoveryMode ? (
                <>
                  {/* Google Sign-In */}
                  {/* <Button
                    type="button"
                    variant="outline"
                    className="w-full h-12 border-2 hover:bg-muted/50 hover:border-primary/50 transition-all shadow-sm"
                    onClick={handleGoogleSignIn}
                  >
                    <svg className="ml-2 h-5 w-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    <span className="text-foreground font-medium">Google</span>
                  </Button> */}

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <Separator />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">{t('common.or', 'OR')}</span>
                    </div>
                  </div>

                  {/* Login Form */}
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="identifier" className="text-sm font-semibold">
                        {t('auth.login.emailOrUsername', 'البريد الإلكتروني أو اسم المستخدم')}
                      </Label>
                      <div className="relative">
                        <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
                        <Input
                          id="identifier"
                          type="text"
                          placeholder="name@example.com or username"
                          value={identifier}
                          onChange={handleInputChange(setIdentifier)}
                          onFocus={() => setIsFocused(true)}
                          onBlur={() => setIsFocused(false)}
                          required
                          className="h-12 pr-10 border-2 border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-sm font-semibold">
                        {t('auth.login.password')}
                      </Label>
                      <div className="relative">
                        <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
                        <Input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={handleInputChange(setPassword)}
                          onFocus={() => {
                            setIsFocused(true);
                            setPasswordFieldActive(true);
                          }}
                          onBlur={() => {
                            setIsFocused(false);
                            setPasswordFieldActive(false);
                          }}
                          required
                          className="h-12 pl-10 pr-10 border-2 border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                        >
                          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                    </div>

                    {/* Remember & Forgot */}
                    <div className="flex items-center justify-between pt-1">
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <input
                          type="checkbox"
                          className="w-4 h-4 rounded border-2 border-border text-primary focus:ring-2 focus:ring-primary/20 transition-all group-hover:border-primary"
                        />
                        <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">تذكرني</span>
                      </label>
                      <Link
                        to="/auth/forgot-password"
                        className="text-sm text-primary hover:text-primary/80 font-semibold transition-colors hover:underline"
                      >
                        نسيت كلمة المرور؟
                      </Link>
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full h-12 gradient-primary font-semibold text-base shadow-lg hover:shadow-xl transition-all mt-6"
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
                          <ArrowRight className="mr-2 h-5 w-5" />
                        </>
                      )}
                    </Button>
                  </form>

                  {/* Recovery ID Link */}
                  <div className="text-center pt-3">
                    <button
                      type="button"
                      onClick={() => setShowRecoveryMode(true)}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center justify-center gap-2 mx-auto hover:underline"
                    >
                      <Key className="w-4 h-4" />
                      نسيت بريدك الإلكتروني؟ استخدم رمز الاسترداد
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {/* Recovery Mode Form */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="recoveryId" className="text-sm font-medium">
                        رمز الاسترداد | Recovery ID
                      </Label>
                      <div className="relative">
                        <Key className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                          id="recoveryId"
                          type="text"
                          placeholder="XXXX-XXXX-XXXX-XXXX"
                          value={recoveryId}
                          onChange={handleInputChange(setRecoveryId)}
                          onFocus={() => setIsFocused(true)}
                          onBlur={() => setIsFocused(false)}
                          className="h-11 pr-10 border-border focus:border-primary focus:ring-primary font-mono text-center tracking-wider"
                        />
                      </div>
                    </div>

                    {/* Step 1: Reveal Email Button */}
                    {!recoveredEmail && (
                      <Button
                        type="button"
                        onClick={handleRecoverEmail}
                        disabled={loading || !recoveryId}
                        className="w-full h-11 gradient-primary"
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
                      <div className="space-y-4">
                        <div className="bg-success/10 border border-success/20 rounded-xl p-4 text-center">
                          <p className="text-sm text-success mb-1">
                            ✅ تم العثور على حسابك!
                          </p>
                          <p className="text-lg font-mono font-bold text-success dir-ltr">
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
                            className="w-full h-11 bg-success hover:bg-success/90"
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
                            className="w-full h-11"
                          >
                            <LogIn className="ml-2 h-5 w-5" />
                            <span>تسجيل الدخول بالبريد</span>
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Back to Email Login */}
                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowRecoveryMode(false);
                        setRecoveryId('');
                        setRecoveryPassword('');
                        setRecoveredEmail(null);
                      }}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center justify-center gap-2 mx-auto"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      العودة لتسجيل الدخول بالبريد
                    </button>
                  </div>
                </>
              )}
            </CardContent>

            <CardFooter className="flex flex-col gap-3 pt-4">
              <Separator />
              <p className="text-sm text-center text-muted-foreground">
                ليس لديك حساب؟{' '}
                <Link 
                  to="/register" 
                  className="text-primary hover:text-primary/80 font-semibold hover:underline transition-colors"
                >
                  إنشاء حساب جديد
                </Link>
              </p>
            </CardFooter>
          </Card>

        </div>
      </div>
    </div>
  );
}
