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

export default function Login() {
  const { t } = useTranslation();
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
  
  // Recovery ID states
  const [showRecoveryMode, setShowRecoveryMode] = useState(false);
  const [recoveryId, setRecoveryId] = useState('');
  const [recoveryPassword, setRecoveryPassword] = useState('');
  const [recoveredEmail, setRecoveredEmail] = useState<string | null>(null);

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
      toast({
        title: t('common.success'),
        description: 'مرحباً بك في لوحة التحكم',
      });
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (error: unknown) {
      setFaceState('sad');
      const errorMessage = error instanceof Error ? error.message : 'البريد الإلكتروني أو كلمة المرور غير صحيحة';
      toast({
        variant: 'destructive',
        title: 'خطأ في تسجيل الدخول',
        description: errorMessage,
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
      
      // Set tokens in auth context
      if (loginWithTokens) {
        loginWithTokens(result.accessToken, result.refreshToken);
      } else {
        // Fallback: store tokens directly
        localStorage.setItem('accessToken', result.accessToken);
        localStorage.setItem('refreshToken', result.refreshToken);
      }
      
      setFaceState('happy');
      toast({
        title: 'تم تسجيل الدخول بنجاح',
        description: `مرحباً بك! بريدك الإلكتروني: ${result.email}`,
      });
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (error: unknown) {
      setFaceState('sad');
      const errorMessage = error instanceof Error ? error.message : 'رمز الاسترداد أو كلمة المرور غير صحيحة';
      toast({
        variant: 'destructive',
        title: 'خطأ في تسجيل الدخول',
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRecoverEmail = async () => {
    if (!recoveryId) {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'يرجى إدخال رمز الاسترداد',
      });
      return;
    }

    setLoading(true);
    try {
      const result = await authService.recoverEmail(recoveryId);
      setRecoveredEmail(result.maskedEmail);
      toast({
        title: 'تم العثور على الحساب',
        description: `البريد الإلكتروني المرتبط: ${result.maskedEmail}`,
      });
    } catch (error: unknown) {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'رمز الاسترداد غير صحيح',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    window.location.href = `${import.meta.env.VITE_AUTH_BASE_URL || 'http://localhost:3001'}/auth/google`;
  };

  return (
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
            مرحباً بعودتك!
            <br />
            سجل دخولك الآن
          </h1>
          <p className="text-xl text-white/90">
            أدر متجرك الإلكتروني بكل سهولة واحترافية
          </p>
          <div className="space-y-4 pt-4">
            <div className="flex items-center gap-3 text-white">
              <CheckCircle2 className="h-6 w-6" />
              <span>وصول فوري إلى لوحة التحكم</span>
            </div>
            <div className="flex items-center gap-3 text-white">
              <CheckCircle2 className="h-6 w-6" />
              <span>أمان عالي المستوى</span>
            </div>
            <div className="flex items-center gap-3 text-white">
              <CheckCircle2 className="h-6 w-6" />
              <span>دعم فني متاح 24/7</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-white/60 text-sm">
          {t('landing.footer.copyright')}
        </div>
      </div>

      {/* Right Side - Login Form */}
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
                {showRecoveryMode ? 'استرداد الحساب' : 'تسجيل الدخول'}
              </CardTitle>
              <CardDescription className="text-base text-gray-600 dark:text-gray-400">
                {showRecoveryMode 
                  ? 'أدخل رمز الاسترداد السري وكلمة المرور' 
                  : 'سجل دخولك لإدارة متجرك الإلكتروني'}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {!showRecoveryMode ? (
                <>
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

                  {/* Login Form */}
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="identifier" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t('auth.login.emailOrUsername', 'البريد الإلكتروني أو اسم المستخدم')}
                      </Label>
                      <div className="relative">
                        <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <Input
                          id="identifier"
                          type="text"
                          placeholder="name@example.com or username"
                          value={identifier}
                          onChange={handleInputChange(setIdentifier)}
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
                    </div>

                    {/* Remember & Forgot */}
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-sm text-gray-600 dark:text-gray-400">تذكرني</span>
                      </label>
                      <Link
                        to="/forgot-password"
                        className="text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 font-semibold transition-colors"
                      >
                        نسيت كلمة المرور؟
                      </Link>
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
                          <LogIn className="ml-2 h-5 w-5" />
                          <span>تسجيل الدخول</span>
                          <ArrowRight className="mr-2 h-5 w-5" />
                        </>
                      )}
                    </Button>
                  </form>

                  {/* Recovery ID Link */}
                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => setShowRecoveryMode(true)}
                      className="text-sm text-gray-500 hover:text-indigo-600 transition-colors flex items-center justify-center gap-2 mx-auto"
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
                      <Label htmlFor="recoveryId" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        رمز الاسترداد | Recovery ID
                      </Label>
                      <div className="relative">
                        <Key className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <Input
                          id="recoveryId"
                          type="text"
                          placeholder="XXXX-XXXX-XXXX-XXXX"
                          value={recoveryId}
                          onChange={handleInputChange(setRecoveryId)}
                          onFocus={() => setIsFocused(true)}
                          onBlur={() => setIsFocused(false)}
                          className="h-11 pr-10 border-gray-300 dark:border-gray-600 focus:border-indigo-500 focus:ring-indigo-500 font-mono text-center tracking-wider"
                        />
                      </div>
                    </div>

                    {/* Step 1: Reveal Email Button */}
                    {!recoveredEmail && (
                      <Button
                        type="button"
                        onClick={handleRecoverEmail}
                        disabled={loading || !recoveryId}
                        className="w-full h-11 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
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
                        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-xl p-4 text-center">
                          <p className="text-sm text-green-700 dark:text-green-300 mb-1">
                            ✅ تم العثور على حسابك!
                          </p>
                          <p className="text-lg font-mono font-bold text-green-800 dark:text-green-200 dir-ltr">
                            {recoveredEmail}
                          </p>
                        </div>

                        <div className="space-y-3">
                          {/* Option 1: Send Password Reset Email */}
                          <Button
                            type="button"
                            onClick={async () => {
                              setLoading(true);
                              try {
                                // Send password reset using recovery ID (server gets the real email)
                                await authService.sendResetByRecoveryId(recoveryId);
                                toast({
                                  title: 'تم الإرسال!',
                                  description: 'تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني',
                                });
                              } catch (error) {
                                toast({
                                  variant: 'destructive',
                                  title: 'خطأ',
                                  description: 'فشل إرسال رابط إعادة التعيين. تأكد من رمز الاسترداد.',
                                });
                              } finally {
                                setLoading(false);
                              }
                            }}
                            disabled={loading}
                            className="w-full h-11 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
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

                          {/* Option 2: Go to login with the email */}
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
                      className="text-sm text-gray-500 hover:text-indigo-600 transition-colors flex items-center justify-center gap-2 mx-auto"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      العودة لتسجيل الدخول بالبريد
                    </button>
                  </div>
                </>
              )}
            </CardContent>

            <CardFooter className="flex flex-col gap-4 pt-2">
              <Separator />
              <p className="text-sm text-center text-gray-600 dark:text-gray-400">
                ليس لديك حساب؟{' '}
                <Link 
                  to="/register" 
                  className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 font-semibold hover:underline"
                >
                  إنشاء حساب جديد
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
  );
}
