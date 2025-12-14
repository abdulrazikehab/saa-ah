import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { authService } from '@/services/auth.service';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { Loader2, UserPlus, Mail, Lock, User, ArrowRight, Eye, EyeOff, CheckCircle2, Copy, Key, Shield } from 'lucide-react';
import { InteractiveFace, FaceState } from '@/components/ui/InteractiveFace';
import { getLogoUrl, BRAND_NAME_AR, BRAND_NAME_EN, BRAND_TAGLINE_AR, BRAND_TAGLINE_EN } from '@/config/logo.config';
import { VersionFooter } from '@/components/common/VersionFooter';

export default function Signup() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [faceState, setFaceState] = useState<FaceState>('excited');
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordFieldActive, setPasswordFieldActive] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [recoveryId, setRecoveryId] = useState<string | null>(null);
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [copiedRecovery, setCopiedRecovery] = useState(false);

  // Calculate password strength
  useEffect(() => {
    if (!password) {
      setPasswordStrength(0);
      return;
    }
    
    let strength = 0;
    if (password.length >= 6) strength += 25;
    if (password.length >= 10) strength += 25;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 15;
    if (/[^a-zA-Z0-9]/.test(password)) strength += 10;
    
    setPasswordStrength(Math.min(strength, 100));
  }, [password]);

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

  const getPasswordStrengthColor = () => {
    if (passwordStrength < 40) return 'bg-destructive';
    if (passwordStrength < 70) return 'bg-warning';
    return 'bg-success';
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength < 40) return t('auth.signup.passwordWeak', 'Weak');
    if (passwordStrength < 70) return t('auth.signup.passwordMedium', 'Medium');
    return t('auth.signup.passwordStrong', 'Strong');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await authService.signup({ name, email, password });
      setFaceState('happy');
      
      if (result.recoveryId) {
        setRecoveryId(result.recoveryId);
        setShowRecoveryModal(true);
      } else {
        toast({
          title: t('common.success'),
          description: t('auth.signup.success', 'Account created successfully! Redirecting...'),
        });
        setTimeout(() => {
          navigate('/auth/login');
        }, 1500);
      }
    } catch (error: any) {
      setFaceState('sad');
      
      let errorMessage = t('auth.signup.error', 'Failed to create account. Please try again.');
      
      if (error?.response?.status === 409) {
        const errorData = error?.response?.data;
        if (errorData?.message) {
          if (errorData.message.toLowerCase().includes('email')) {
            errorMessage = 'هذا البريد الإلكتروني مستخدم بالفعل. الرجاء استخدام بريد آخر.';
          } else if (errorData.message.toLowerCase().includes('subdomain')) {
            errorMessage = 'اسم النطاق الفرعي مستخدم بالفعل. الرجاء اختيار اسم آخر.';
          } else {
            errorMessage = errorData.message;
          }
        }
      } else if (error?.response?.status === 400) {
        const errorData = error?.response?.data;
        errorMessage = errorData?.message || 'البريد الإلكتروني غير صالح | Invalid email address';
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      toast({
        variant: 'destructive',
        title: t('common.error'),
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  const copyRecoveryId = () => {
    if (recoveryId) {
      navigator.clipboard.writeText(recoveryId);
      setCopiedRecovery(true);
      toast({
        title: 'تم النسخ! | Copied!',
        description: 'تم نسخ رمز الاسترداد إلى الحافظة | Recovery ID copied to clipboard',
      });
      setTimeout(() => setCopiedRecovery(false), 2000);
    }
  };

  const handleContinueAfterRecovery = () => {
    setShowRecoveryModal(false);
    toast({
      title: t('common.success'),
      description: t('auth.signup.success', 'Account created successfully! Redirecting...'),
    });
    setTimeout(() => {
      navigate('/auth/login');
    }, 1000);
  };

  const handleGoogleSignIn = () => {
    const authBaseUrl = import.meta.env.VITE_AUTH_BASE_URL || 'http://localhost:3001';
    const googleAuthUrl = authBaseUrl.includes('localhost')
      ? `${authBaseUrl}/auth/google`
      : `${authBaseUrl}/google`;
    window.location.href = googleAuthUrl;
  };

  return (
    <>
      {/* Recovery ID Modal */}
      {showRecoveryModal && recoveryId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-card rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-scale-in">
            <div className="gradient-primary p-6 text-white text-center">
              <div className="mx-auto w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4">
                <Shield className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-heading font-bold">رمز الاسترداد السري</h2>
              <p className="text-sm text-white/80 mt-1">Secret Recovery ID</p>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="bg-warning/10 border border-warning/20 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <Key className="w-5 h-5 text-warning mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-warning">
                    <p className="font-semibold mb-1">هام جداً! Important!</p>
                    <p>احفظ هذا الرمز في مكان آمن. يمكنك استخدامه لاسترداد حسابك إذا نسيت بريدك الإلكتروني أو تعرض للاختراق.</p>
                    <p className="mt-1 text-xs opacity-80">Save this ID in a safe place. Use it to recover your account if you forget your email or it gets compromised.</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-muted rounded-xl p-4">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-2">رمز الاسترداد | Recovery ID</p>
                  <p className="text-2xl font-mono font-bold text-primary tracking-wider">
                    {recoveryId}
                  </p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <Button
                  onClick={copyRecoveryId}
                  variant="outline"
                  className="flex-1 h-12"
                >
                  {copiedRecovery ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 ml-2 text-success" />
                      تم النسخ
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 ml-2" />
                      نسخ الرمز
                    </>
                  )}
                </Button>
                
                <Button
                  onClick={handleContinueAfterRecovery}
                  className="flex-1 h-12 gradient-primary"
                  disabled={!copiedRecovery}
                >
                  متابعة
                  <ArrowRight className="w-4 h-4 mr-2" />
                </Button>
              </div>
              
              {!copiedRecovery && (
                <p className="text-xs text-center text-muted-foreground">
                  يرجى نسخ الرمز قبل المتابعة | Please copy the ID before continuing
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="min-h-screen flex relative">
        {/* Left Side - Branding (hidden on mobile) */}
        <div className="hidden lg:flex lg:w-1/2 gradient-primary p-12 flex-col justify-between relative overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute inset-0 bg-grid-pattern opacity-10" />
          <div className="absolute top-20 right-20 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse-slow" />
          <div className="absolute bottom-20 left-20 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }} />
          
          <div className="relative z-10">
          <Link to="/" className="inline-flex flex-col gap-4 group">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-xl overflow-hidden bg-white/10 backdrop-blur-sm border border-white/20 shadow-lg">
                <img src={getLogoUrl()} alt={`${BRAND_NAME_EN} - ${BRAND_NAME_AR}`} className="w-full h-full object-contain p-2 group-hover:scale-110 transition-transform" />
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
              {t('landing.hero.title')}
              <br />
              {t('landing.hero.titleHighlight')}
            </h1>
            <p className="text-xl text-white/90">
              {t('landing.hero.subtitle')}
            </p>
            <div className="space-y-4 pt-4">
              <div className="flex items-center gap-3 text-white">
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <span>{t('landing.hero.readyIn5')}</span>
              </div>
              <div className="flex items-center gap-3 text-white">
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <span>{t('landing.hero.support247')}</span>
              </div>
              <div className="flex items-center gap-3 text-white">
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <span>{t('landing.hero.noCreditCard')}</span>
              </div>
            </div>
          </div>

          <div className="relative z-10 text-white/50 text-sm">
            {t('landing.footer.copyright')}
          </div>
        </div>

        {/* Right Side - Signup Form */}
        <div className="flex-1 flex items-center justify-center p-6 bg-background">
          <div className="w-full max-w-md">
            {/* Mobile Logo with Bilingual Branding */}
            <Link to="/" className="lg:hidden flex flex-col items-center gap-3 mb-8 group">
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-card border border-border shadow-lg">
                  <img src={getLogoUrl()} alt={`${BRAND_NAME_EN} - ${BRAND_NAME_AR}`} className="w-full h-full object-contain p-2 group-hover:scale-110 transition-transform" />
                </div>
                <div className="flex flex-col">
                  <h1 className="text-3xl font-heading font-bold gradient-text">{BRAND_NAME_AR}</h1>
                  <p className="text-lg font-semibold text-primary">{BRAND_NAME_EN}</p>
                </div>
              </div>
              <p className="text-muted-foreground text-xs text-center">{BRAND_TAGLINE_AR} | {BRAND_TAGLINE_EN}</p>
            </Link>

            <Card className="shadow-xl border-border/50">
              <CardHeader className="space-y-1 text-center pb-6">
                {/* Interactive Face */}
                <div className="flex justify-center mb-4">
                  <InteractiveFace 
                    state={faceState} 
                    className="transform hover:scale-105 transition-transform" 
                  />
                </div>
                
                <CardTitle className="text-2xl font-heading font-bold">
                  {t('auth.signup.title')}
                </CardTitle>
                <CardDescription className="text-base">
                  {t('landing.hero.subtitle')}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Google Sign-In */}
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-11 border-2 hover:bg-muted/50 transition-colors"
                  onClick={handleGoogleSignIn}
                >
                  <svg className="ml-2 h-5 w-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span className="text-foreground">Google</span>
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <Separator />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">{t('common.or', 'OR')}</span>
                  </div>
                </div>

                {/* Signup Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium">
                      {t('auth.signup.name', 'Full Name')}
                    </Label>
                    <div className="relative">
                      <User className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="name"
                        placeholder={t('auth.signup.namePlaceholder', 'John Doe')}
                        value={name}
                        onChange={handleInputChange(setName)}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        required
                        className="h-11 pr-10 border-border focus:border-primary focus:ring-primary"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium">
                      {t('auth.login.email')}
                    </Label>
                    <div className="relative">
                      <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="name@example.com"
                        value={email}
                        onChange={handleInputChange(setEmail)}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        required
                        className="h-11 pr-10 border-border focus:border-primary focus:ring-primary"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium">
                      {t('auth.login.password')}
                    </Label>
                    <div className="relative">
                      <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
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
                        minLength={6}
                        className="h-11 px-10 border-border focus:border-primary focus:ring-primary"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    
                    {/* Password Strength Indicator */}
                    {password && (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">{t('auth.signup.passwordStrength', 'Password Strength')}:</span>
                          <span className={`font-semibold ${
                            passwordStrength < 40 ? 'text-destructive' : 
                            passwordStrength < 70 ? 'text-warning' : 
                            'text-success'
                          }`}>
                            {getPasswordStrengthText()}
                          </span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-300 ${getPasswordStrengthColor()}`}
                            style={{ width: `${passwordStrength}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full h-11 gradient-primary font-medium shadow-md hover:shadow-lg transition-all mt-6"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="ml-2 h-5 w-5 animate-spin" />
                        <span>{t('common.loading')}</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="ml-2 h-5 w-5" />
                        <span>{t('auth.signup.button')}</span>
                        <ArrowRight className="mr-2 h-5 w-5" />
                      </>
                    )}
                  </Button>
                </form>

                <p className="text-xs text-center text-muted-foreground px-4 pt-2">
                  {t('auth.signup.termsAgreement', 'By creating an account, you agree to our')}{' '}
                  <Link to="/terms" className="text-primary hover:underline">{t('landing.footer.links.terms')}</Link>
                  {' '}{t('common.and', 'and')}{' '}
                  <Link to="/privacy" className="text-primary hover:underline">{t('landing.footer.links.privacy')}</Link>
                </p>
              </CardContent>

              <CardFooter className="flex flex-col gap-4 pt-2">
                <Separator />
                <p className="text-sm text-center text-muted-foreground">
                  {t('auth.signup.haveAccount')}{' '}
                  <Link 
                    to="/auth/login" 
                    className="text-primary hover:text-primary/80 font-semibold hover:underline"
                  >
                    {t('auth.signup.loginLink')}
                  </Link>
                </p>
              </CardFooter>
            </Card>

            {/* Footer Links */}
            <div className="mt-6 text-center space-y-2">
              <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
                <Link to="/privacy" className="hover:text-primary transition-colors">{t('landing.footer.links.privacy')}</Link>
                <span>•</span>
                <Link to="/terms" className="hover:text-primary transition-colors">{t('landing.footer.links.terms')}</Link>
                <span>•</span>
                <Link to="/help" className="hover:text-primary transition-colors">{t('landing.footer.links.helpCenter')}</Link>
              </div>
            </div>
          </div>
          <VersionFooter className="absolute bottom-0 left-0 right-0 py-2 bg-background" />
        </div>
      </div>
    </>
  );
}
