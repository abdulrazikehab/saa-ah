import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/hooks/use-toast';
import { 
  Loader2, LogIn, Mail, Lock, Eye, EyeOff, 
  ShoppingBag, Sparkles, UserPlus, User, 
  Briefcase, ArrowRight, CheckCircle2, Shield,
  ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { apiClient } from '@/services/core/api-client';
import { getErrorMessage, isErrorObject } from '@/lib/error-utils';
import { getProfessionalErrorMessage } from '@/lib/toast-errors';
import { cn } from '@/lib/utils';
import { getTenantContext } from '@/lib/storefront-utils';
import { useAuth } from '@/contexts/AuthContext';

export default function StorefrontAuth() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { login: merchantLogin } = useAuth();
  
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [loginType, setLoginType] = useState<'customer' | 'employee'>('customer');

  // Redirect if already authenticated
  useEffect(() => {
    const checkAndRedirect = () => {
      // Check if customer is already logged in
      if (loginType === 'customer') {
        const customerToken = localStorage.getItem('customerToken');
        const customerData = localStorage.getItem('customerData');
        
        if (customerToken && customerData) {
          // Customer is already logged in, redirect to home or intended destination
          const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';
          navigate(from, { replace: true });
        }
      } else {
        // Check if merchant/employee is already logged in
        const accessToken = localStorage.getItem('accessToken');
        if (accessToken) {
          navigate('/dashboard', { replace: true });
        }
      }
    };
    
    checkAndRedirect();
    
    // Also listen for storage changes to catch login in same window
    const handleStorageChange = () => {
      checkAndRedirect();
    };
    
    // Check periodically in case login happened in same window
    const interval = setInterval(checkAndRedirect, 100);
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [loginType, navigate, location]);
  
  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  
  // OTP states
  const [verificationSent, setVerificationSent] = useState(false);
  const [otp, setOtp] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (loginType === 'customer') {
        // Customer Login
        const tenantContext = getTenantContext();
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
        
        localStorage.setItem('customerToken', String(response.token || ''));
        if (response.customer) {
          localStorage.setItem('customerData', JSON.stringify(response.customer));
        }
        
        // Dispatch custom event to notify other components (like CustomerProtectedRoute)
        // that login was successful in the same tab
        window.dispatchEvent(new CustomEvent('customerLogin', { 
          detail: { token: response.token, customer: response.customer } 
        }));
        
        toast({
          title: isRTL ? 'تم تسجيل الدخول بنجاح' : 'Login successful',
          description: isRTL ? 'مرحباً بك في متجرنا' : 'Welcome back!',
        });
        
        // Immediately navigate after setting tokens
        const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';
        navigate(from, { replace: true });
      } else {
        // Employee/Merchant Login
        const mustChangePassword = await merchantLogin(email, password);
        if (mustChangePassword) {
          // Redirect to password change page if first login
          toast({
            title: isRTL ? 'تم تسجيل الدخول' : 'Login successful',
            description: isRTL ? 'يرجى تغيير كلمة المرور للمتابعة' : 'Please change your password to continue',
          });
          navigate('/auth/change-password', { replace: true });
        } else {
          toast({
            title: isRTL ? 'تم تسجيل الدخول بنجاح' : 'Login successful',
            description: isRTL ? 'مرحباً بك في لوحة التحكم' : 'Welcome to the dashboard!',
          });
          setTimeout(() => navigate('/dashboard'), 1000);
        }
      }
    } catch (error: unknown) {
      const { title, description } = getProfessionalErrorMessage(
        error,
        { 
          operation: isRTL ? 'تسجيل الدخول' : 'login', 
          resource: loginType === 'customer' 
            ? (isRTL ? 'كعميل' : 'as customer') 
            : (isRTL ? 'كموظف' : 'as employee') 
        },
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

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const tenantContext = getTenantContext();
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
          phone
        },
        { 
          requireAuth: false,
          headers,
        }
      );
      
      if (isErrorObject(response)) {
        throw new Error(getErrorMessage(response));
      }
      
      // Check if verification code was sent
      if (response.verificationCodeSent) {
        setVerificationSent(true);
        toast({
          title: isRTL ? 'تم إرسال رمز التحقق' : 'Verification code sent',
          description: isRTL ? `تم إرسال رمز التحقق إلى ${email}` : `A verification code has been sent to ${email}`,
        });

        // In development, show the code in toast for convenience
        if (response.verificationCode) {
          console.log('Verification Code:', response.verificationCode);
          toast({
            title: "Development Mode",
            description: `Code: ${response.verificationCode}`,
            duration: 10000,
          });
        }
      } else {
        // Fallback for unexpected success without verification (shouldn't happen with current backend)
        toast({
          title: isRTL ? 'تم إنشاء الحساب بنجاح' : 'Account created successfully',
          description: isRTL ? 'يرجى تسجيل الدخول' : 'Please sign in',
        });
        setActiveTab('login');
      }
      
    } catch (error: unknown) {
      const { title, description } = getProfessionalErrorMessage(
        error,
        { operation: isRTL ? 'إنشاء الحساب' : 'signup', resource: isRTL ? 'كعميل' : 'as customer' },
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

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await apiClient.post(
        `${apiClient.authUrl}/customers/verify-email`,
        { email, code: otp },
        { requireAuth: false }
      );

      if (isErrorObject(response)) {
        throw new Error(getErrorMessage(response));
      }

      if (response.valid) {
        localStorage.setItem('customerToken', String(response.token || ''));
        if (response.customer) {
          localStorage.setItem('customerData', JSON.stringify(response.customer));
        }

        // Dispatch custom event to notify other components (like CustomerProtectedRoute)
        // that login was successful in the same tab
        window.dispatchEvent(new CustomEvent('customerLogin', { 
          detail: { token: response.token, customer: response.customer } 
        }));

        toast({
          title: isRTL ? 'تم التحقق بنجاح' : 'Verification successful',
          description: isRTL ? 'تم إنشاء حسابك وتسجيل الدخول' : 'Your account has been created and you are now logged in',
        });

        setTimeout(() => navigate('/'), 1000);
      } else {
        throw new Error(response.message || 'Verification failed');
      }
    } catch (error: unknown) {
      toast({
        variant: 'destructive',
        title: isRTL ? 'فشل التحقق' : 'Verification failed',
        description: getErrorMessage(error),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setLoading(true);
    try {
      const response = await apiClient.post(
        `${apiClient.authUrl}/customers/resend-verification-code`,
        { email },
        { requireAuth: false }
      );

      if (isErrorObject(response)) {
        throw new Error(getErrorMessage(response));
      }

      toast({
        title: isRTL ? 'تم إعادة إرسال الرمز' : 'Code resent',
        description: isRTL ? 'تم إرسال رمز جديد إلى بريدك الإلكتروني' : 'A new code has been sent to your email',
      });

      if (response.verificationCode) {
        console.log('Verification Code:', response.verificationCode);
        toast({
          title: "Development Mode",
          description: `Code: ${response.verificationCode}`,
          duration: 10000,
        });
      }
    } catch (error: unknown) {
      toast({
        variant: 'destructive',
        title: isRTL ? 'فشل إرسال الرمز' : 'Failed to resend code',
        description: getErrorMessage(error),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[120px] animate-pulse-slow" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-secondary/5 blur-[120px] animate-pulse-slow" style={{ animationDelay: '2s' }} />
      </div>

      <div className="w-full max-w-md space-y-8 animate-fade-in">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-20 h-20 mb-4 rounded-3xl gradient-primary shadow-xl animate-bounce-subtle">
            <ShoppingBag className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold gradient-text tracking-tight">
            {verificationSent 
              ? (isRTL ? 'تأكيد البريد الإلكتروني' : 'Verify Email')
              : loginType === 'employee'
                ? (isRTL ? 'دخول الموظفين' : 'Employee Login')
                : activeTab === 'login' 
                  ? (isRTL ? 'تسجيل الدخول' : 'Welcome Back') 
                  : (isRTL ? 'إنشاء حساب جديد' : 'Join Us Today')}
          </h1>
          <p className="text-muted-foreground">
            {verificationSent
              ? (isRTL ? `أدخل الرمز المرسل إلى ${email}` : `Enter the code sent to ${email}`)
              : loginType === 'employee'
                ? (isRTL ? 'سجل دخولك للوصول إلى لوحة التحكم' : 'Sign in to access the dashboard')
                : activeTab === 'login'
                  ? (isRTL ? 'سجل دخولك للمتابعة مع طلبك' : 'Sign in to manage your account and orders')
                  : (isRTL ? 'أنشئ حساباً للاستمتاع بتجربة تسوق أفضل' : 'Create an account for a better shopping experience')}
          </p>
        </div>

        <Card className="border-border/50 shadow-2xl glass-effect-strong overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 gradient-aurora animate-gradient bg-[length:200%_auto]" />
          
          {verificationSent ? (
            <CardContent className="pt-8 pb-8 space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex flex-col items-center justify-center space-y-6">
                <div className="space-y-2 text-center">
                  <InputOTP
                    maxLength={6}
                    value={otp}
                    onChange={(value) => setOtp(value)}
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                  <p className="text-xs text-muted-foreground mt-2">
                    {isRTL ? 'أدخل الرمز المكون من 6 أرقام' : 'Enter the 6-digit code'}
                  </p>
                </div>

                <div className="flex flex-col w-full gap-3">
                  <Button 
                    onClick={handleVerify}
                    className="w-full h-12 text-base font-semibold rounded-xl gradient-primary text-white shadow-lg hover:shadow-glow transition-all"
                    disabled={loading || otp.length !== 6}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="ml-2 h-5 w-5 animate-spin" />
                        <span>{isRTL ? 'جاري التحقق...' : 'Verifying...'}</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="ml-2 h-5 w-5" />
                        <span>{isRTL ? 'تحقق' : 'Verify'}</span>
                      </>
                    )}
                  </Button>

                  <Button
                    variant="ghost"
                    onClick={handleResendCode}
                    disabled={loading}
                    className="w-full"
                  >
                    {isRTL ? 'إعادة إرسال الرمز' : 'Resend Code'}
                  </Button>

                  <Button
                    variant="link"
                    onClick={() => setVerificationSent(false)}
                    className="w-full text-muted-foreground"
                  >
                    <ArrowLeft className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />
                    {isRTL ? 'العودة' : 'Back'}
                  </Button>
                </div>
              </div>
            </CardContent>
          ) : loginType === 'employee' ? (
            <CardContent className="pt-8 pb-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">{isRTL ? 'البريد الإلكتروني' : 'Email'}</Label>
                  <div className="relative group">
                    <Mail className={cn(
                      "absolute top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors",
                      isRTL ? "right-4" : "left-4"
                    )} />
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className={cn(
                        "h-12 rounded-xl border-2 border-border/50 bg-background/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all",
                        isRTL ? "pr-12" : "pl-12"
                      )}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">{isRTL ? 'كلمة المرور' : 'Password'}</Label>
                    <Link to="/auth/forgot-password" className="text-xs text-primary hover:underline">
                      {isRTL ? 'نسيت كلمة المرور؟' : 'Forgot password?'}
                    </Link>
                  </div>
                  <div className="relative group">
                    <Lock className={cn(
                      "absolute top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors",
                      isRTL ? "right-4" : "left-4"
                    )} />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className={cn(
                        "h-12 rounded-xl border-2 border-border/50 bg-background/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all",
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
                  className="w-full h-12 text-base font-semibold rounded-xl gradient-primary text-white shadow-lg hover:shadow-glow transition-all mt-2"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="ml-2 h-5 w-5 animate-spin" />
                      <span>{isRTL ? 'جاري تسجيل الدخول...' : 'Signing in...'}</span>
                    </>
                  ) : (
                    <>
                      <Briefcase className="ml-2 h-5 w-5" />
                      <span>{isRTL ? 'دخول الموظفين' : 'Employee Login'}</span>
                      <ArrowRight className="mr-2 h-5 w-5" />
                    </>
                  )}
                </Button>
              </form>

              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  {isRTL ? 'أو' : 'Or'}
                </span>
              </div>

              <Button
                variant="outline"
                onClick={() => setLoginType('customer')}
                className="w-full h-11 rounded-xl border-2 border-border/50 hover:bg-muted/50"
              >
                <User className="mr-2 h-4 w-4" />
                {isRTL ? 'تسجيل دخول العملاء' : 'Customer Login'}
              </Button>
            </CardContent>
          ) : (
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'login' | 'signup')} className="w-full">
              <TabsList className="grid w-full grid-cols-2 h-14 p-1 bg-muted/50 rounded-none border-b border-border/50">
                <TabsTrigger value="login" className="rounded-none data-[state=active]:bg-background data-[state=active]:shadow-none font-semibold">
                  {isRTL ? 'تسجيل الدخول' : 'Login'}
                </TabsTrigger>
                <TabsTrigger value="signup" className="rounded-none data-[state=active]:bg-background data-[state=active]:shadow-none font-semibold">
                  {isRTL ? 'إنشاء حساب' : 'Sign Up'}
                </TabsTrigger>
              </TabsList>

              <CardContent className="pt-6">
                <TabsContent value="login" className="space-y-6 mt-0 animate-in fade-in slide-in-from-bottom-4 duration-300">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">{isRTL ? 'البريد الإلكتروني' : 'Email'}</Label>
                      <div className="relative group">
                        <Mail className={cn(
                          "absolute top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors",
                          isRTL ? "right-4" : "left-4"
                        )} />
                        <Input
                          id="email"
                          type="email"
                          placeholder="name@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          className={cn(
                            "h-12 rounded-xl border-2 border-border/50 bg-background/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all",
                            isRTL ? "pr-12" : "pl-12"
                          )}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="password">{isRTL ? 'كلمة المرور' : 'Password'}</Label>
                        <Link to="/auth/forgot-password" className="text-xs text-primary hover:underline">
                          {isRTL ? 'نسيت كلمة المرور؟' : 'Forgot password?'}
                        </Link>
                      </div>
                      <div className="relative group">
                        <Lock className={cn(
                          "absolute top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors",
                          isRTL ? "right-4" : "left-4"
                        )} />
                        <Input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          className={cn(
                            "h-12 rounded-xl border-2 border-border/50 bg-background/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all",
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
                      className="w-full h-12 text-base font-semibold rounded-xl gradient-primary text-white shadow-lg hover:shadow-glow transition-all mt-2"
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
                          <ArrowRight className="mr-2 h-5 w-5" />
                        </>
                      )}
                    </Button>
                  </form>

                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      {isRTL ? 'أو' : 'Or'}
                    </span>
                  </div>

                  <Button
                    variant="ghost"
                    onClick={() => setLoginType('employee')}
                    className="w-full h-10 text-muted-foreground hover:text-foreground"
                  >
                    <Briefcase className="mr-2 h-4 w-4" />
                    {isRTL ? 'تسجيل دخول الموظفين' : 'Employee Login'}
                  </Button>
                </TabsContent>

                <TabsContent value="signup" className="space-y-6 mt-0 animate-in fade-in slide-in-from-bottom-4 duration-300">
                  <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 flex items-start gap-3">
                    <Sparkles className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <p className="text-sm text-primary/80 leading-relaxed">
                      {isRTL 
                        ? 'انضم إلينا اليوم للحصول على عروض حصرية وتتبع طلباتك بسهولة.' 
                        : 'Join us today for exclusive offers and easy order tracking.'}
                    </p>
                  </div>

                  <form onSubmit={handleSignup} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">{isRTL ? 'الاسم الأول' : 'First Name'}</Label>
                        <Input
                          id="firstName"
                          placeholder={isRTL ? 'أحمد' : 'John'}
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          required
                          className="h-11 rounded-xl border-2 border-border/50 bg-background/50 focus:border-primary/50 transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">{isRTL ? 'اسم العائلة' : 'Last Name'}</Label>
                        <Input
                          id="lastName"
                          placeholder={isRTL ? 'محمد' : 'Doe'}
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          required
                          className="h-11 rounded-xl border-2 border-border/50 bg-background/50 focus:border-primary/50 transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-email">{isRTL ? 'البريد الإلكتروني' : 'Email'}</Label>
                      <div className="relative group">
                        <Mail className={cn(
                          "absolute top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors",
                          isRTL ? "right-4" : "left-4"
                        )} />
                        <Input
                          id="signup-email"
                          type="email"
                          placeholder="name@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          className={cn(
                            "h-11 rounded-xl border-2 border-border/50 bg-background/50 focus:border-primary/50 transition-all",
                            isRTL ? "pr-12" : "pl-12"
                          )}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-password">{isRTL ? 'كلمة المرور' : 'Password'}</Label>
                      <div className="relative group">
                        <Lock className={cn(
                          "absolute top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors",
                          isRTL ? "right-4" : "left-4"
                        )} />
                        <Input
                          id="signup-password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          minLength={6}
                          className={cn(
                            "h-11 rounded-xl border-2 border-border/50 bg-background/50 focus:border-primary/50 transition-all",
                            isRTL ? "pr-12 pl-12" : "pl-12 pr-12"
                          )}
                        />
                      </div>
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full h-12 text-base font-semibold rounded-xl gradient-primary text-white shadow-lg hover:shadow-glow transition-all mt-2"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="ml-2 h-5 w-5 animate-spin" />
                          <span>{isRTL ? 'جاري إنشاء الحساب...' : 'Creating account...'}</span>
                        </>
                      ) : (
                        <>
                          <UserPlus className="ml-2 h-5 w-5" />
                          <span>{isRTL ? 'إنشاء حساب' : 'Create Account'}</span>
                        </>
                      )}
                    </Button>
                  </form>
                </TabsContent>
              </CardContent>

              <CardFooter className="flex flex-col gap-4 pb-8 pt-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Shield className="h-3 w-3" />
                  {isRTL 
                    ? 'بياناتك محمية بأحدث تقنيات التشفير' 
                    : 'Your data is protected by industry-standard encryption'}
                </div>
                
                <div className="w-full flex items-center gap-4">
                  <div className="h-px flex-1 bg-border/50" />
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
                    {isRTL ? 'أو' : 'OR'}
                  </span>
                  <div className="h-px flex-1 bg-border/50" />
                </div>

                <p className="text-sm text-center text-muted-foreground">
                  {activeTab === 'login' 
                    ? (isRTL ? 'ليس لديك حساب؟' : "Don't have an account?")
                    : (isRTL ? 'لديك حساب بالفعل؟' : "Already have an account?")
                  }
                  <button 
                    onClick={() => setActiveTab(activeTab === 'login' ? 'signup' : 'login')}
                    className="text-primary hover:text-primary/80 font-bold ml-1 hover:underline transition-colors"
                  >
                    {activeTab === 'login' 
                      ? (isRTL ? 'أنشئ حساباً الآن' : 'Sign up now')
                      : (isRTL ? 'سجل دخولك' : 'Login here')
                    }
                  </button>
                </p>
              </CardFooter>
            </Tabs>
          )}
        </Card>

        {/* Footer Info */}
        <div className="flex flex-col items-center gap-4 pt-4">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <CheckCircle2 className="h-3.5 w-3.5 text-success" />
              {isRTL ? 'دفع آمن' : 'Secure Payment'}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <CheckCircle2 className="h-3.5 w-3.5 text-success" />
              {isRTL ? 'دعم 24/7' : '24/7 Support'}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <CheckCircle2 className="h-3.5 w-3.5 text-success" />
              {isRTL ? 'خصوصية تامة' : 'Full Privacy'}
            </div>
          </div>
          
          <Link to="/" className="text-sm text-muted-foreground hover:text-primary transition-colors">
            {isRTL ? 'العودة للمتجر' : 'Back to Store'}
          </Link>
        </div>
      </div>
    </div>
  );
}
