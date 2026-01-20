import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, UserPlus, Mail, Lock, User, Eye, EyeOff, X, Phone, Shield, Key, Copy, CheckCircle2, ArrowRight, Download, Sparkles, MessageSquare } from 'lucide-react';
import { apiClient } from '@/services/core/api-client';
import { getProfessionalErrorMessage } from '@/lib/toast-errors';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { getTenantContext } from '@/lib/storefront-utils';
import { useStoreSettings } from '@/contexts/StoreSettingsContext';
import { OptimizedImage } from '@/components/ui/OptimizedImage';

interface CustomerSignupProps {
  onClose: () => void;
  onSwitchToLogin: () => void;
  onSignupSuccess?: () => void;
}

export function CustomerSignup({ onClose, onSwitchToLogin, onSignupSuccess }: CustomerSignupProps) {
  const { toast } = useToast();
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const { settings } = useStoreSettings();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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

  const getPasswordStrengthColor = () => {
    if (passwordStrength < 40) return 'bg-red-500';
    if (passwordStrength < 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength < 40) return isRTL ? 'ضعيفة' : 'Weak';
    if (passwordStrength < 70) return isRTL ? 'متوسطة' : 'Medium';
    return isRTL ? 'قوية' : 'Strong';
  };

  const copyRecoveryId = () => {
    if (recoveryId) {
      navigator.clipboard.writeText(recoveryId);
      setCopiedRecovery(true);
      toast({
        title: isRTL ? 'تم النسخ!' : 'Copied!',
        description: isRTL ? 'تم نسخ رمز الاسترداد إلى الحافظة' : 'Recovery ID copied to clipboard',
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
        title: isRTL ? 'تم التنزيل!' : 'Downloaded!',
        description: isRTL ? 'تم تنزيل رمز الاسترداد' : 'Recovery ID downloaded',
      });
      
      setCopiedRecovery(true);
    }
  };

  const handleClose = () => {
    onSignupSuccess?.();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        variant: 'destructive',
        title: isRTL ? 'عدم تطابق' : 'Mismatch',
        description: isRTL
          ? 'كلمتا المرور غير متطابقتين. يرجى التأكد من تطابق كلمتي المرور والمحاولة مرة أخرى'
          : 'Passwords do not match. Please ensure both passwords are identical and try again',
      });
      return;
    }

    setLoading(true);
    
    try {
      // Get tenant context from current store to ensure customer is created in the correct merchant's table
      const tenantContext = getTenantContext();
      
      // Add tenant headers to ensure customer is created in the correct merchant's table
      const headers: Record<string, string> = {};
      if (tenantContext.subdomain) {
        headers['X-Tenant-Domain'] = tenantContext.domain;
      }
      
      const response = await apiClient.post(
        `${apiClient.authUrl}/customers/signup`, 
        {
          email,
          password,
          firstName,
          lastName,
          phone,
        },
        {
          requireAuth: false,
          headers,
        }
      );
      
      // Check if OTP was sent
      if (response.verificationCodeSent || response.verificationCode) {
        setSignupEmail(email);
        setShowOtpModal(true);
      } else {
        // Fallback: if no OTP needed (shouldn't happen with new flow)
        if (response.token && response.customer) {
          localStorage.setItem('customerToken', response.token);
          localStorage.setItem('customerData', JSON.stringify(response.customer));
          
          if (response.recoveryId) {
            setRecoveryId(response.recoveryId);
            setShowRecoveryModal(true);
          } else {
            toast({
              title: isRTL ? 'تم إنشاء الحساب بنجاح' : 'Account created successfully',
              description: isRTL ? 'مرحباً بك في متجرنا' : 'Welcome to our store!',
            });
            
            onSignupSuccess?.();
            onClose();
          }
        }
      }
    } catch (error: unknown) {
      const { title, description } = getProfessionalErrorMessage(
        error,
        { operation: isRTL ? 'إنشاء' : 'create', resource: isRTL ? 'الحساب' : 'account' },
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

  const handleVerifyOtp = async () => {
    if (!otpCode || otpCode.length !== 6) {
      toast({
        variant: 'destructive',
        title: isRTL ? 'خطأ' : 'Error',
        description: isRTL ? 'يرجى إدخال رمز التحقق المكون من 6 أرقام' : 'Please enter a 6-digit verification code',
      });
      return;
    }

    setOtpLoading(true);
    try {
      const tenantContext = getTenantContext();
      const headers: Record<string, string> = {};
      if (tenantContext.subdomain) {
        headers['X-Tenant-Domain'] = tenantContext.domain;
      }

      const result = await apiClient.post(
        `${apiClient.authUrl}/customers/verify-email`,
        {
          email: signupEmail,
          code: otpCode,
        },
        {
          requireAuth: false,
          headers,
        }
      );
      
      if (result.valid && result.token) {
        // Store tokens and customer data
        localStorage.setItem('customerToken', result.token);
        localStorage.setItem('customerData', JSON.stringify(result.customer));
        
        // Dispatch custom event to notify other components that login was successful
        window.dispatchEvent(new CustomEvent('customerLogin', { 
          detail: { token: result.token, customer: result.customer } 
        }));
        
        // Close OTP modal
        setShowOtpModal(false);
        
        // Show recovery ID if available
        if (result.recoveryId) {
          setRecoveryId(result.recoveryId);
          setShowRecoveryModal(true);
        } else {
          toast({
            title: isRTL ? 'تم التحقق بنجاح!' : 'Verification successful!',
            description: isRTL ? 'تم إنشاء حسابك بنجاح. مرحباً بك!' : 'Your account has been created successfully. Welcome!',
          });
          
          onSignupSuccess?.();
          onClose();
        }
      } else {
        toast({
          variant: 'destructive',
          title: isRTL ? 'خطأ' : 'Error',
          description: result.message || (isRTL ? 'رمز التحقق غير صحيح' : 'Invalid verification code'),
        });
      }
    } catch (error: unknown) {
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
      const tenantContext = getTenantContext();
      const headers: Record<string, string> = {};
      if (tenantContext.subdomain) {
        headers['X-Tenant-Domain'] = tenantContext.domain;
      }

      await apiClient.post(
        `${apiClient.authUrl}/customers/resend-verification-code`,
        {
          email: signupEmail,
        },
        {
          requireAuth: false,
          headers,
        }
      );
      
      toast({
        title: isRTL ? 'تم الإرسال!' : 'Sent!',
        description: isRTL ? 'تم إرسال رمز التحقق الجديد إلى بريدك الإلكتروني' : 'A new verification code has been sent to your email',
      });
      setOtpCode('');
    } catch (error: unknown) {
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

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto animate-fade-in">
      {/* OTP Verification Modal */}
      {showOtpModal && (
        <div 
          className="w-full max-w-md relative animate-scale-in z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowOtpModal(false);
            }
          }}
        >
          <div className="relative overflow-hidden rounded-3xl glass-effect-strong border border-border/50 shadow-2xl">
            <div className="absolute top-0 left-0 right-0 h-1 gradient-aurora animate-gradient bg-[length:200%_auto]" />
            
            <button
              onClick={() => setShowOtpModal(false)}
              className="absolute left-4 top-4 p-2.5 rounded-xl bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-all z-10"
            >
              <X className="h-5 w-5" />
            </button>

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
                <MessageSquare className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold mb-2">
                {isRTL ? 'تحقق من بريدك الإلكتروني' : 'Verify Your Email'}
              </h3>
              <p className="text-muted-foreground text-sm">
                {isRTL 
                  ? `لقد أرسلنا رمز التحقق إلى ${signupEmail}` 
                  : `We've sent a verification code to ${signupEmail}`}
              </p>
            </div>

            <div className="relative px-8 pb-8">
              <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 mb-6">
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-primary">
                    <p className="font-semibold mb-1">{isRTL ? 'تحقق من بريدك الإلكتروني' : 'Check your email'}</p>
                    <p>{isRTL ? 'تم إرسال رمز التحقق المكون من 6 أرقام إلى:' : 'A 6-digit verification code has been sent to:'}</p>
                    <p className="font-mono font-bold mt-1">{signupEmail}</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="otp" className="text-sm font-medium">
                    {isRTL ? 'رمز التحقق' : 'Verification Code'}
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
                    className="h-12 text-center text-2xl font-mono tracking-widest rounded-xl"
                    maxLength={6}
                    disabled={otpLoading}
                  />
                  <p className="text-xs text-muted-foreground text-center">
                    {isRTL ? 'يرجى إدخال الرمز المكون من 6 أرقام' : 'Please enter the 6-digit code'}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Button
                    onClick={handleVerifyOtp}
                    className="w-full h-12 text-base font-semibold rounded-xl gradient-primary text-white shadow-lg hover:shadow-glow transition-all"
                    disabled={otpLoading || otpCode.length !== 6}
                  >
                    {otpLoading ? (
                      <>
                        <Loader2 className={cn("h-5 w-5 animate-spin", isRTL ? "ml-2" : "mr-2")} />
                        {isRTL ? 'جاري التحقق...' : 'Verifying...'}
                      </>
                    ) : (
                      <>
                        {isRTL ? 'التحقق' : 'Verify'}
                        <ArrowRight className={cn("w-4 h-4", isRTL ? "mr-2" : "ml-2")} />
                      </>
                    )}
                  </Button>
                  
                  <Button
                    onClick={handleResendOtp}
                    variant="outline"
                    className="w-full h-12 rounded-xl"
                    disabled={otpLoading}
                  >
                    {otpLoading ? (
                      <Loader2 className={cn("h-5 w-5 animate-spin", isRTL ? "ml-2" : "mr-2")} />
                    ) : (
                      <>
                        <Mail className={cn("w-4 h-4", isRTL ? "ml-2" : "mr-2")} />
                        {isRTL ? 'إعادة إرسال الرمز' : 'Resend Code'}
                      </>
                    )}
                  </Button>
                  
                  <Button
                    onClick={() => {
                      setShowOtpModal(false);
                      setOtpCode('');
                    }}
                    variant="ghost"
                    className="w-full h-12 rounded-xl text-muted-foreground hover:text-foreground"
                    disabled={otpLoading}
                  >
                    <X className={cn("w-4 h-4", isRTL ? "ml-2" : "mr-2")} />
                    {isRTL ? 'إلغاء' : 'Cancel'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showRecoveryModal && recoveryId ? (
        <div className="w-full max-w-md relative animate-scale-in">
          <div className="relative overflow-hidden rounded-3xl glass-effect-strong border border-border/50 shadow-2xl">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 to-emerald-600" />
            
            <div className="p-8 text-center">
              <div className="mx-auto w-20 h-20 bg-green-500/10 rounded-2xl flex items-center justify-center mb-6">
                <Shield className="w-10 h-10 text-green-500" />
              </div>
              <h2 className="text-2xl font-bold mb-2">
                {isRTL ? 'رمز الاسترداد السري' : 'Secret Recovery ID'}
              </h2>
              <p className="text-muted-foreground text-sm mb-6">
                {isRTL ? 'هام جداً! احفظ هذا الرمز في مكان آمن.' : 'Very important! Save this ID in a safe place.'}
              </p>
              
              <div className="bg-muted/50 rounded-2xl p-6 mb-8 border border-border/50">
                <p className="text-2xl font-mono font-bold text-primary tracking-wider select-all">
                  {recoveryId}
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <Button
                  onClick={copyRecoveryId}
                  variant="outline"
                  className="h-12 rounded-xl border-2"
                >
                  {copiedRecovery ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 ml-2 text-green-500" />
                      {isRTL ? 'تم النسخ' : 'Copied'}
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 ml-2" />
                      {isRTL ? 'نسخ الرمز' : 'Copy ID'}
                    </>
                  )}
                </Button>
                
                <Button
                  onClick={downloadRecoveryId}
                  variant="outline"
                  className="h-12 rounded-xl border-2"
                >
                  <Download className="w-4 h-4 ml-2" />
                  {isRTL ? 'تحميل الرمز' : 'Download'}
                </Button>
              </div>
              
              <Button
                onClick={handleClose}
                className="w-full h-12 text-base font-semibold rounded-xl gradient-primary text-white shadow-lg hover:shadow-glow transition-all"
                disabled={!copiedRecovery}
              >
                {isRTL ? 'متابعة' : 'Continue'}
                <ArrowRight className={cn("w-4 h-4", isRTL ? "mr-2" : "ml-2")} />
              </Button>
              
              {!copiedRecovery && (
                <p className="text-xs text-center text-muted-foreground mt-4">
                  {isRTL ? 'يرجى نسخ أو تحميل الرمز قبل المتابعة' : 'Please copy or download the ID before continuing'}
                </p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="w-full max-w-md relative my-8 animate-scale-in">
          <div className="relative overflow-hidden rounded-3xl glass-effect-strong border border-border/50 shadow-2xl">
            <div className="absolute top-0 left-0 right-0 h-1 gradient-aurora animate-gradient bg-[length:200%_auto]" />
            
            <button
              onClick={onClose}
              className="absolute left-4 top-4 p-2.5 rounded-xl bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-all z-10"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="relative pt-10 pb-6 px-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-2xl gradient-primary shadow-lg">
                <UserPlus className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold gradient-text mb-2">
                {isRTL ? 'إنشاء حساب جديد' : 'Create Account'}
              </h2>
              <p className="text-muted-foreground">
                {isRTL ? 'انضم إلينا وابدأ التسوق الآن' : 'Join us and start shopping now'}
              </p>
            </div>

            <div className="relative px-8 pb-8">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-sm font-medium">{isRTL ? 'الاسم الأول' : 'First Name'}</Label>
                    <div className="relative group">
                      <User className={cn("absolute top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors", isRTL ? "right-3" : "left-3")} />
                      <Input
                        id="firstName"
                        placeholder={isRTL ? 'أحمد' : 'John'}
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        required
                        className={cn("h-11 rounded-xl border-2 border-border/50 bg-background focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all", isRTL ? "pr-10" : "pl-10")}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-sm font-medium">{isRTL ? 'الاسم الأخير' : 'Last Name'}</Label>
                    <Input
                      id="lastName"
                      placeholder={isRTL ? 'محمد' : 'Doe'}
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                      className="h-11 rounded-xl border-2 border-border/50 bg-background focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-email" className="text-sm font-medium">{isRTL ? 'البريد الإلكتروني' : 'Email'}</Label>
                  <div className="relative group">
                    <Mail className={cn("absolute top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors", isRTL ? "right-3" : "left-3")} />
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className={cn("h-11 rounded-xl border-2 border-border/50 bg-background focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all", isRTL ? "pr-10" : "pl-10")}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium">{isRTL ? 'رقم الهاتف (اختياري)' : 'Phone (Optional)'}</Label>
                  <div className="relative group">
                    <Phone className={cn("absolute top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors", isRTL ? "right-3" : "left-3")} />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+966 50 123 4567"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className={cn("h-11 rounded-xl border-2 border-border/50 bg-background focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all", isRTL ? "pr-10" : "pl-10")}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-password" className="text-sm font-medium">{isRTL ? 'كلمة المرور' : 'Password'}</Label>
                  <div className="relative group">
                    <Lock className={cn("absolute top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors", isRTL ? "right-3" : "left-3")} />
                    <Input
                      id="signup-password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      className={cn("h-11 rounded-xl border-2 border-border/50 bg-background focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all", isRTL ? "pr-10 pl-10" : "pl-10 pr-10")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className={cn("absolute top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors", isRTL ? "left-3" : "right-3")}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  
                  {password && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">{isRTL ? 'قوة كلمة المرور:' : 'Strength:'}</span>
                        <span className={cn("font-semibold", 
                          passwordStrength < 40 ? 'text-red-500' : 
                          passwordStrength < 70 ? 'text-yellow-500' : 
                          'text-green-500'
                        )}>
                          {getPasswordStrengthText()}
                        </span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div 
                          className={cn("h-full transition-all duration-500", getPasswordStrengthColor())}
                          style={{ width: `${passwordStrength}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium">{isRTL ? 'تأكيد كلمة المرور' : 'Confirm Password'}</Label>
                  <div className="relative group">
                    <Lock className={cn("absolute top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors", isRTL ? "right-3" : "left-3")} />
                    <Input
                      id="confirmPassword"
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={6}
                      className={cn("h-11 rounded-xl border-2 border-border/50 bg-background focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all", isRTL ? "pr-10" : "pl-10")}
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-12 text-base font-semibold rounded-xl gradient-primary text-white shadow-lg hover:shadow-glow transition-all mt-4"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="ml-2 h-5 w-5 animate-spin" />
                      <span>{isRTL ? 'جاري الإنشاء...' : 'Creating...'}</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="ml-2 h-5 w-5" />
                      <span>{isRTL ? 'إنشاء حساب' : 'Create Account'}</span>
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-6 pt-6 border-t border-border/50">
                <p className="text-sm text-center text-muted-foreground flex items-center justify-center gap-1">
                  {isRTL ? 'لديك حساب بالفعل؟' : 'Already have an account?'}
                  <button 
                    onClick={onSwitchToLogin}
                    className="text-primary hover:text-primary/80 font-semibold hover:underline transition-colors"
                  >
                    {isRTL ? 'سجل الدخول' : 'Sign In'}
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
