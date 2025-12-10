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
    if (passwordStrength < 40) return 'bg-red-500';
    if (passwordStrength < 70) return 'bg-yellow-500';
    return 'bg-green-500';
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
      
      // Show recovery ID modal if returned
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
      
      // Parse error message
      let errorMessage = t('auth.signup.error', 'Failed to create account. Please try again.');
      
      if (error?.response?.status === 409) {
        // Conflict error - email or subdomain already exists
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
        // Bad request - likely fake email
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
    window.location.href = `${import.meta.env.VITE_AUTH_BASE_URL || 'http://localhost:3001'}/auth/google`;
  };

  return (
    <>
      {/* Recovery ID Modal */}
      {showRecoveryModal && recoveryId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 text-white text-center">
              <div className="mx-auto w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4">
                <Shield className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold">رمز الاسترداد السري</h2>
              <p className="text-sm text-white/80 mt-1">Secret Recovery ID</p>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <Key className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-yellow-800 dark:text-yellow-200">
                    <p className="font-semibold mb-1">هام جداً! Important!</p>
                    <p>احفظ هذا الرمز في مكان آمن. يمكنك استخدامه لاسترداد حسابك إذا نسيت بريدك الإلكتروني أو تعرض للاختراق.</p>
                    <p className="mt-1 text-xs">Save this ID in a safe place. Use it to recover your account if you forget your email or it gets compromised.</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-100 dark:bg-gray-700 rounded-xl p-4">
                <div className="text-center">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">رمز الاسترداد | Recovery ID</p>
                  <p className="text-2xl font-mono font-bold text-indigo-600 dark:text-indigo-400 tracking-wider">
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
                      <CheckCircle2 className="w-4 h-4 ml-2 text-green-500" />
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
                  className="flex-1 h-12 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                  disabled={!copiedRecovery}
                >
                  متابعة
                  <ArrowRight className="w-4 h-4 mr-2" />
                </Button>
              </div>
              
              {!copiedRecovery && (
                <p className="text-xs text-center text-gray-500">
                  يرجى نسخ الرمز قبل المتابعة | Please copy the ID before continuing
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="min-h-screen flex">
      {/* Left Side - Branding (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-12 flex-col justify-between relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute top-20 right-20 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }} />
        
        <div className="relative z-10">
          <Link to="/" className="inline-flex flex-col gap-4 group">
            <div className="flex items-center gap-4">
              <img src="/branding/saaah-logo-full.png" alt="Saa'ah - سِعَة" className="h-20 w-auto object-contain bg-transparent group-hover:scale-110 transition-transform" />
              <div className="flex flex-col">
                <h1 className="text-4xl font-bold text-white">سِعَة</h1>
                <p className="text-xl font-semibold text-purple-200">Saa'ah</p>
              </div>
            </div>
            <p className="text-white/80 text-sm">منصة أسواقك الرقمية | Your Digital Markets Platform</p>
          </Link>
        </div>

        <div className="relative z-10 space-y-6">
          <h1 className="text-5xl font-bold text-white leading-tight">
            {t('landing.hero.title')}
            <br />
            {t('landing.hero.titleHighlight')}
          </h1>
          <p className="text-xl text-white/90">
            {t('landing.hero.subtitle')}
          </p>
          <div className="space-y-4 pt-4">
            <div className="flex items-center gap-3 text-white">
              <CheckCircle2 className="h-6 w-6" />
              <span>{t('landing.hero.readyIn5')}</span>
            </div>
            <div className="flex items-center gap-3 text-white">
              <CheckCircle2 className="h-6 w-6" />
              <span>{t('landing.hero.support247')}</span>
            </div>
            <div className="flex items-center gap-3 text-white">
              <CheckCircle2 className="h-6 w-6" />
              <span>{t('landing.hero.noCreditCard')}</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-white/60 text-sm">
          {t('landing.footer.copyright')}
        </div>
      </div>

      {/* Right Side - Signup Form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-gray-50 dark:bg-gray-900">
        <div className="w-full max-w-md">
          {/* Mobile Logo with Bilingual Branding */}
          <Link to="/" className="lg:hidden flex flex-col items-center gap-3 mb-8 group">
            <div className="flex items-center gap-3">
              <img src="/branding/saaah-logo-full.png" alt="Saa'ah - سِعَة" className="h-16 w-auto object-contain bg-transparent group-hover:scale-110 transition-transform" />
              <div className="flex flex-col">
                <h1 className="text-3xl font-bold gradient-text">سِعَة</h1>
                <p className="text-lg font-semibold text-purple-600 dark:text-purple-400">Saa'ah</p>
              </div>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-xs text-center">منصة أسواقك الرقمية | Your Digital Markets Platform</p>
          </Link>

          <Card className="border-0 shadow-xl bg-white dark:bg-gray-800">
            <CardHeader className="space-y-1 text-center pb-6">
              {/* Interactive Face */}
              <div className="flex justify-center mb-4">
                <InteractiveFace 
                  state={faceState} 
                  className="transform hover:scale-105 transition-transform" 
                />
              </div>
              
              <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                {t('auth.signup.title')}
              </CardTitle>
              <CardDescription className="text-base text-gray-600 dark:text-gray-400">
                {t('landing.hero.subtitle')}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Google Sign-In */}
              <Button
                type="button"
                variant="outline"
                className="w-full h-11 border-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                onClick={handleGoogleSignIn}
              >
                <svg className="ml-2 h-5 w-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span className="text-gray-700 dark:text-gray-300">Google</span>
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white dark:bg-gray-800 px-2 text-gray-500">{t('common.or', 'OR')}</span>
                </div>
              </div>

              {/* Signup Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('auth.signup.name', 'Full Name')}
                  </Label>
                  <div className="relative">
                    <User className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      id="name"
                      placeholder={t('auth.signup.namePlaceholder', 'John Doe')}
                      value={name}
                      onChange={handleInputChange(setName)}
                      onFocus={() => setIsFocused(true)}
                      onBlur={() => setIsFocused(false)}
                      required
                      className="h-11 pr-10 border-gray-300 dark:border-gray-600 focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('auth.login.email')}
                  </Label>
                  <div className="relative">
                    <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@example.com"
                      value={email}
                      onChange={handleInputChange(setEmail)}
                      onFocus={() => setIsFocused(true)}
                      onBlur={() => setIsFocused(false)}
                      required
                      className="h-11 pr-10 border-gray-300 dark:border-gray-600 focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>
                </div>



                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('auth.login.password')}
                  </Label>
                  <div className="relative">
                    <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
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
                      className="h-11 px-10 border-gray-300 dark:border-gray-600 focus:border-indigo-500 focus:ring-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  
                  {/* Password Strength Indicator */}
                  {password && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">{t('auth.signup.passwordStrength', 'Password Strength')}:</span>
                        <span className={`font-semibold ${
                          passwordStrength < 40 ? 'text-red-500' : 
                          passwordStrength < 70 ? 'text-yellow-500' : 
                          'text-green-500'
                        }`}>
                          {getPasswordStrengthText()}
                        </span>
                      </div>
                      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
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
                  className="w-full h-11 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium shadow-lg hover:shadow-xl transition-all mt-6"
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

              <p className="text-xs text-center text-gray-500 px-4 pt-2">
                {t('auth.signup.termsAgreement', 'By creating an account, you agree to our')}{' '}
                <Link to="/terms" className="text-indigo-600 hover:underline">{t('landing.footer.links.terms')}</Link>
                {' '}{t('common.and', 'and')}{' '}
                <Link to="/privacy" className="text-indigo-600 hover:underline">{t('landing.footer.links.privacy')}</Link>
              </p>
            </CardContent>

            <CardFooter className="flex flex-col gap-4 pt-2">
              <Separator />
              <p className="text-sm text-center text-gray-600 dark:text-gray-400">
                {t('auth.signup.haveAccount')}{' '}
                <Link 
                  to="/auth/login" 
                  className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 font-semibold hover:underline"
                >
                  {t('auth.signup.loginLink')}
                </Link>
              </p>
            </CardFooter>
          </Card>

          {/* Footer Links */}
          <div className="mt-6 text-center space-y-2">
            <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
              <Link to="/privacy" className="hover:text-indigo-600 transition-colors">{t('landing.footer.links.privacy')}</Link>
              <span>•</span>
              <Link to="/terms" className="hover:text-indigo-600 transition-colors">{t('landing.footer.links.terms')}</Link>
              <span>•</span>
              <Link to="/help" className="hover:text-indigo-600 transition-colors">{t('landing.footer.links.helpCenter')}</Link>
            </div>
          </div>
        </div>
        </div>
      </div>
    </>
  );
}
