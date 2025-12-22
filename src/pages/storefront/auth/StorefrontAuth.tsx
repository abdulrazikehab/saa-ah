import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/hooks/use-toast';
import { 
  Loader2, LogIn, Mail, Lock, Eye, EyeOff, 
  ShoppingBag, Sparkles, UserPlus, User, 
  Briefcase, ArrowRight, CheckCircle2, Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  
  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  
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
        
        toast({
          title: isRTL ? 'تم تسجيل الدخول بنجاح' : 'Login successful',
          description: isRTL ? 'مرحباً بك في متجرنا' : 'Welcome back!',
        });
        
        const from = (location.state as any)?.from?.pathname || '/';
        setTimeout(() => navigate(from), 1000);
      } else {
        // Employee/Merchant Login
        await merchantLogin(email, password);
        toast({
          title: isRTL ? 'تم تسجيل الدخول بنجاح' : 'Login successful',
          description: isRTL ? 'مرحباً بك في لوحة التحكم' : 'Welcome to the dashboard!',
        });
        setTimeout(() => navigate('/dashboard'), 1000);
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
      
      localStorage.setItem('customerToken', String(response.token || ''));
      if (response.customer) {
        localStorage.setItem('customerData', JSON.stringify(response.customer));
      }
      
      toast({
        title: isRTL ? 'تم إنشاء الحساب بنجاح' : 'Account created successfully',
        description: isRTL ? 'مرحباً بك في متجرنا' : 'Welcome to our store!',
      });
      
      setTimeout(() => navigate('/'), 1000);
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
            {activeTab === 'login' 
              ? (isRTL ? 'تسجيل الدخول' : 'Welcome Back') 
              : (isRTL ? 'إنشاء حساب جديد' : 'Join Us Today')}
          </h1>
          <p className="text-muted-foreground">
            {activeTab === 'login'
              ? (isRTL ? 'سجل دخولك للمتابعة مع طلبك' : 'Sign in to manage your account and orders')
              : (isRTL ? 'أنشئ حساباً للاستمتاع بتجربة تسوق أفضل' : 'Create an account for a better shopping experience')}
          </p>
        </div>

        <Card className="border-border/50 shadow-2xl glass-effect-strong overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 gradient-aurora animate-gradient bg-[length:200%_auto]" />
          
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
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
                {/* Login Type Toggle */}
                <div className="flex p-1 bg-muted/50 rounded-xl border border-border/50">
                  <button
                    onClick={() => setLoginType('customer')}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all",
                      loginType === 'customer' ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <User className="h-4 w-4" />
                    {isRTL ? 'عميل' : 'Customer'}
                  </button>
                  <button
                    onClick={() => setLoginType('employee')}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all",
                      loginType === 'employee' ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Briefcase className="h-4 w-4" />
                    {isRTL ? 'موظف' : 'Employee'}
                  </button>
                </div>

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
                      <Link to="/auth/forgot-password" hidden={loginType === 'customer'} className="text-xs text-primary hover:underline">
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
