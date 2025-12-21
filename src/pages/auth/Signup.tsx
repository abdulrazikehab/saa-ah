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
import { Loader2, UserPlus, Mail, Lock, User, ArrowRight, Eye, EyeOff, CheckCircle2, Copy, Key, Shield, Download, MessageSquare, X, Store } from 'lucide-react';
import { InteractiveFace, FaceState } from '@/components/ui/InteractiveFace';
import { getLogoUrl, BRAND_NAME_AR, BRAND_NAME_EN, BRAND_TAGLINE_AR, BRAND_TAGLINE_EN } from '@/config/logo.config';
import { VersionFooter } from '@/components/common/VersionFooter';
import { apiClient } from '@/lib/api';
import { getProfessionalErrorMessage } from '@/lib/toast-errors';

export default function Signup() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const navigate = useNavigate();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [storeName, setStoreName] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [loading, setLoading] = useState(false);
  const [faceState, setFaceState] = useState<FaceState>('excited');
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordFieldActive, setPasswordFieldActive] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [recoveryId, setRecoveryId] = useState<string | null>(null);
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [copiedRecovery, setCopiedRecovery] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [signupEmail, setSignupEmail] = useState<string>('');

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
    
    // Validate required fields
    if (!storeName || !storeName.trim()) {
      toast({
        title: isRTL ? 'حقل مطلوب' : 'Required Field',
        description: isRTL ? 'اسم المتجر مطلوب' : 'Store name is required',
        variant: 'destructive',
      });
      return;
    }
    
    if (!nationalId || !nationalId.trim()) {
      toast({
        title: isRTL ? 'حقل مطلوب' : 'Required Field',
        description: isRTL ? 'الهوية الوطنية أو رقم الجواز مطلوب' : 'National ID or Passport ID is required',
        variant: 'destructive',
      });
      return;
    }
    
    setLoading(true);
    try {
      const result = await authService.signup({ name, email, password, storeName, nationalId });
      setFaceState('happy');
      setSignupEmail(email);
      
      // Store recovery ID for later (after OTP verification)
      if (result.recoveryId) {
        setRecoveryId(result.recoveryId);
      }
      
      // Check if email was sent successfully
      if (!result.verificationCodeSent) {
        toast({
          title: isRTL ? 'تحذير' : 'Warning',
          description: isRTL 
            ? 'قد لا يكون رمز التحقق قد تم إرساله. يرجى التحقق من بريدك الإلكتروني أو الاتصال بالدعم.'
            : 'Verification code may not have been sent. Please check your email or contact support.',
          variant: 'destructive',
        });
      }
      
      // Show OTP verification modal first (recovery ID will be shown after verification)
      if (result.verificationCodeSent || (result as any).emailVerified === false || (result as any).verificationCode) {
        setShowOtpModal(true);
      } else if ((result as any).recoveryId) {
        // Fallback: if no verification needed, show recovery ID directly
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
      const { title, description } = getProfessionalErrorMessage(
        error,
        { operation: isRTL ? 'إنشاء' : 'create', resource: isRTL ? 'الحساب' : 'account' },
        isRTL
      );
      
      // Special handling for email/SMTP errors
      if (error?.response?.status === 400) {
        const errorData = error?.response?.data;
        const errorMsg = errorData?.message || '';
        if (errorMsg.includes('verification email') || errorMsg.includes('SMTP') || errorMsg.includes('email')) {
          toast({
            title: isRTL ? 'تحذير: فشل إرسال البريد' : 'Warning: Email Sending Failed',
            description: isRTL
              ? 'خدمة البريد الإلكتروني غير معينة بشكل صحيح. يرجى الاتصال بالدعم أو التحقق من إعدادات SMTP.'
              : 'Email service is not configured properly. Please contact support or check your SMTP settings.',
            variant: 'destructive',
            duration: 10000,
          });
          return; // Don't show duplicate error
        }
      }
      
      toast({
        variant: 'destructive',
        title,
        description,
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

  const downloadRecoveryId = () => {
    if (recoveryId) {
      const content = `Recovery ID | رمز الاسترداد\n\n${recoveryId}\n\nPlease keep this ID in a safe place. You can use it to recover your account if you forget your email or it gets compromised.\n\nيرجى الاحتفاظ بهذا الرمز في مكان آمن. يمكنك استخدامه لاسترداد حسابك إذا نسيت بريدك الإلكتروني أو تعرض للاختراق.\n\nGenerated: ${new Date().toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'long' })}`;
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `recovery-id-${recoveryId.substring(0, 8)}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast({
        title: 'تم التنزيل! | Downloaded!',
        description: 'تم تنزيل رمز الاسترداد | Recovery ID downloaded',
      });
      
      // Mark as copied since user has downloaded it
      setCopiedRecovery(true);
    }
  };

  const handleContinueAfterRecovery = () => {
    setShowRecoveryModal(false);
    localStorage.removeItem('setupPending');
    
    // Tenant was created automatically during signup, redirect to dashboard
    toast({
      title: t('common.success'),
      description: isRTL ? 'تم إنشاء حسابك ومتجرك بنجاح. مرحباً بك!' : 'Account and store created successfully! Welcome!',
    });
    setTimeout(() => {
      navigate('/dashboard');
    }, 1000);
  };

  const handleVerifyOtp = async () => {
    if (!otpCode || otpCode.length !== 6) {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'يرجى إدخال رمز التحقق المكون من 6 أرقام',
      });
      return;
    }

    setOtpLoading(true);
    try {
      const result = await authService.verifyEmail(signupEmail, otpCode);
      
      if (result.valid && result.tokens) {
        // Store tokens
        localStorage.setItem('accessToken', result.tokens.accessToken);
        localStorage.setItem('refreshToken', result.tokens.refreshToken);
        
        // Close OTP modal
        setShowOtpModal(false);
        
        // Check if setup is pending (tenant should be created automatically now)
        const setupPending = (result as any).setupPending === true;
        const tenantId = (result as any).tenantId;
        
        // Get recovery ID from verification result (account was just created)
        if ((result as any).recoveryId) {
          setRecoveryId((result as any).recoveryId);
          setShowRecoveryModal(true);
          // Store setupPending flag for after recovery modal (should be false now since tenant is auto-created)
          if (setupPending) {
            localStorage.setItem('setupPending', 'true');
          } else {
            localStorage.removeItem('setupPending');
          }
        } else {
          // If no recovery ID, check if tenant was created
          if (tenantId && !setupPending) {
            // Tenant was created automatically, redirect to dashboard
            toast({
              title: 'تم التحقق بنجاح!',
              description: 'تم إنشاء حسابك ومتجرك بنجاح. مرحباً بك!',
            });
            setTimeout(() => {
              navigate('/dashboard');
            }, 1000);
          } else {
            // Fallback: redirect to dashboard (tenant should be created automatically)
            toast({
              title: 'تم التحقق بنجاح!',
              description: 'تم إنشاء حسابك ومتجرك بنجاح. مرحباً بك!',
            });
            setTimeout(() => {
              navigate('/dashboard');
            }, 1000);
          }
        }
      } else {
        const { title, description } = getProfessionalErrorMessage(
          { message: result.message || 'Verification code is invalid' },
          { operation: isRTL ? 'التحقق' : 'verify', resource: isRTL ? 'البريد الإلكتروني' : 'email' },
          isRTL
        );
        toast({
          variant: 'destructive',
          title,
          description,
        });
      }
    } catch (error: any) {
      const { title, description } = getProfessionalErrorMessage(
        error,
        { operation: isRTL ? 'التحقق' : 'verify', resource: isRTL ? 'البريد الإلكتروني' : 'email' },
        isRTL
      );
      toast({
        variant: 'destructive',
        title,
        description,
      });
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setOtpLoading(true);
    try {
      await authService.resendVerificationCode(signupEmail);
      toast({
        title: 'تم الإرسال!',
        description: 'تم إرسال رمز التحقق الجديد إلى بريدك الإلكتروني',
      });
      setOtpCode('');
    } catch (error: any) {
      const { title, description } = getProfessionalErrorMessage(
        error,
        { operation: isRTL ? 'إعادة إرسال' : 'resend', resource: isRTL ? 'رمز التحقق' : 'verification code' },
        isRTL
      );
      toast({
        variant: 'destructive',
        title,
        description,
      });
    } finally {
      setOtpLoading(false);
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
              
              <div className="space-y-3">
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
                    onClick={downloadRecoveryId}
                    variant="outline"
                    className="flex-1 h-12"
                  >
                    <Download className="w-4 h-4 ml-2" />
                    تحميل الرمز
                  </Button>
                </div>
                
                <Button
                  onClick={handleContinueAfterRecovery}
                  className="w-full h-12 gradient-primary"
                  disabled={!copiedRecovery}
                >
                  متابعة
                  <ArrowRight className="w-4 h-4 mr-2" />
                </Button>
              </div>
              
              {!copiedRecovery && (
                <p className="text-xs text-center text-muted-foreground">
                  يرجى نسخ أو تحميل الرمز قبل المتابعة | Please copy or download the ID before continuing
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* OTP Verification Modal */}
      {showOtpModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowOtpModal(false);
            }
          }}
        >
          <div className="bg-card rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-scale-in">
            <div className="gradient-primary p-6 text-white text-center relative">
              <button
                onClick={() => setShowOtpModal(false)}
                className="absolute top-4 left-4 p-2 hover:bg-white/20 rounded-full transition-colors"
                aria-label="إغلاق"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="mx-auto w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4">
                <MessageSquare className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-heading font-bold">تحقق من بريدك الإلكتروني</h2>
              <p className="text-sm text-white/80 mt-1">Email Verification</p>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="bg-primary/10 border border-primary/20 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-primary">
                    <p className="font-semibold mb-1">تحقق من بريدك الإلكتروني</p>
                    <p>تم إرسال رمز التحقق المكون من 6 أرقام إلى:</p>
                    <p className="font-mono font-bold mt-1">{signupEmail}</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="otp" className="text-sm font-medium">
                  رمز التحقق | Verification Code
                </Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="123456"
                  value={otpCode}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setOtpCode(value);
                  }}
                  className="h-12 text-center text-2xl font-mono tracking-widest"
                  maxLength={6}
                  disabled={otpLoading}
                />
                <p className="text-xs text-muted-foreground text-center">
                  يرجى إدخال الرمز المكون من 6 أرقام
                </p>
              </div>
              
              <div className="space-y-2">
                <Button
                  onClick={handleVerifyOtp}
                  className="w-full h-12 gradient-primary"
                  disabled={otpLoading || otpCode.length !== 6}
                >
                  {otpLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                      جاري التحقق...
                    </>
                  ) : (
                    <>
                      التحقق
                      <ArrowRight className="w-4 h-4 mr-2" />
                    </>
                  )}
                </Button>
                
                <Button
                  onClick={handleResendOtp}
                  variant="outline"
                  className="w-full h-12"
                  disabled={otpLoading}
                >
                  {otpLoading ? (
                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  ) : (
                    <>
                      <Mail className="w-4 h-4 ml-2" />
                      إعادة إرسال الرمز
                    </>
                  )}
                </Button>
                
                <Button
                  onClick={() => {
                    setShowOtpModal(false);
                    setOtpCode('');
                  }}
                  variant="ghost"
                  className="w-full h-12 text-muted-foreground hover:text-foreground"
                  disabled={otpLoading}
                >
                  <X className="w-4 h-4 ml-2" />
                  إلغاء
                </Button>
              </div>
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
              <div className="w-28 h-28 rounded-xl overflow-hidden bg-white/10 backdrop-blur-sm border border-white/20 shadow-lg">
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
                <div className="w-24 h-24 rounded-xl overflow-hidden bg-card border border-border shadow-lg">
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
                    <Label htmlFor="storeName" className="text-sm font-medium">
                      {isRTL ? 'اسم المتجر' : 'Store Name'} *
                    </Label>
                    <div className="relative">
                      <Store className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="storeName"
                        placeholder={isRTL ? 'اسم المتجر' : 'Store Name'}
                        value={storeName}
                        onChange={handleInputChange(setStoreName)}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        required
                        className="h-11 pr-10 border-border focus:border-primary focus:ring-primary"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {isRTL ? 'سيتم إنشاء عنوان فرعي تلقائياً من اسم المتجر' : 'Subdomain will be generated automatically from store name'}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nationalId" className="text-sm font-medium">
                      {isRTL ? 'الهوية الوطنية / رقم الجواز' : 'National ID / Passport ID'} *
                    </Label>
                    <div className="relative">
                      <Shield className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="nationalId"
                        placeholder={isRTL ? 'الهوية الوطنية أو رقم الجواز' : 'National ID or Passport ID'}
                        value={nationalId}
                        onChange={handleInputChange(setNationalId)}
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
          </div>
          <VersionFooter className="absolute bottom-0 left-0 right-0 py-2 bg-background" />
        </div>
      </div>
    </>
  );
}
