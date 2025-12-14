import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { authApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Lock, Mail, Key, Eye, EyeOff, CheckCircle2, Sparkles } from 'lucide-react';
import { VersionFooter } from '@/components/common/VersionFooter';

const formSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  code: z.string().min(6, 'Code must be at least 6 characters'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export default function ResetPassword() {
  const [isLoading, setIsLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const emailParam = searchParams.get('email') || '';
  const codeParam = searchParams.get('code') || '';

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: emailParam,
      code: codeParam,
      password: '',
      confirmPassword: '',
    },
  });

  const password = form.watch('password');

  // Calculate password strength
  useEffect(() => {
    if (!password) {
      setPasswordStrength(0);
      return;
    }
    
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (password.length >= 12) strength += 25;
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
    if (passwordStrength < 40) return 'ضعيفة';
    if (passwordStrength < 70) return 'متوسطة';
    return 'قوية';
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      await authApi.resetPassword(values.email, values.code, values.password);
      toast({
        title: 'تم تغيير كلمة المرور بنجاح',
        description: 'يمكنك الآن تسجيل الدخول باستخدام كلمة المرور الجديدة.',
      });
      navigate('/auth/login');
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'تعذر تغيير كلمة المرور',
        description: 'تأكد من صحة رمز التحقق والبريد الإلكتروني وحاول مرة أخرى.',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex relative">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute top-20 right-20 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }} />
        
        <div className="relative z-10">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
              <img src={getLogoUrl()} alt="Logo" className="w-8 h-8 bg-transparent" />
            </div>
            <span className="text-3xl font-bold text-white">Saa'ah</span>
          </Link>
        </div>

        <div className="relative z-10 space-y-6">
          <h1 className="text-5xl font-bold text-white leading-tight">
            إعادة تعيين<br />كلمة المرور
          </h1>
          <p className="text-xl text-white/90">
            اختر كلمة مرور قوية وآمنة لحماية حسابك
          </p>
          <div className="space-y-3 pt-4">
            <div className="flex items-center gap-3 text-white">
              <CheckCircle2 className="h-6 w-6" />
              <span>استخدم حروف كبيرة وصغيرة</span>
            </div>
            <div className="flex items-center gap-3 text-white">
              <CheckCircle2 className="h-6 w-6" />
              <span>أضف أرقام ورموز خاصة</span>
            </div>
            <div className="flex items-center gap-3 text-white">
              <CheckCircle2 className="h-6 w-6" />
              <span>8 أحرف على الأقل</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-white/60 text-sm">
          © 2024 Saa'ah. جميع الحقوق محفوظة.
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-gray-50 dark:bg-gray-900">
        <div className="w-full max-w-md">
          <Link to="/" className="flex lg:hidden items-center justify-center gap-3 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <img src={getLogoUrl()} alt="Logo" className="w-8 h-8 bg-transparent object-contain" />
            </div>
            <span className="text-2xl font-bold gradient-text">Saa'ah</span>
          </Link>

          <Card className="border-0 shadow-xl bg-white dark:bg-gray-800">
            <CardHeader className="space-y-1 text-center pb-6">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Sparkles className="h-5 w-5 text-indigo-500 animate-pulse" />
                <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                  تعيين كلمة مرور جديدة
                </CardTitle>
                <Sparkles className="h-5 w-5 text-purple-500 animate-pulse" />
              </div>
              <CardDescription className="text-base text-gray-600 dark:text-gray-400">
                أدخل البريد الإلكتروني، رمز التحقق، وكلمة المرور الجديدة
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          البريد الإلكتروني
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className={`absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 transition-colors ${
                              focusedField === 'email' ? 'text-indigo-500' : 'text-gray-400'
                            }`} />
                            <Input 
                              placeholder="name@example.com" 
                              {...field}
                              onFocus={() => setFocusedField('email')}
                              onBlur={() => setFocusedField(null)}
                              className="h-11 pr-10 border-gray-300 dark:border-gray-600 focus:border-indigo-500 focus:ring-indigo-500"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          رمز التحقق
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Key className={`absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 transition-colors ${
                              focusedField === 'code' ? 'text-indigo-500' : 'text-gray-400'
                            }`} />
                            <Input 
                              placeholder="123456" 
                              {...field}
                              onFocus={() => setFocusedField('code')}
                              onBlur={() => setFocusedField(null)}
                              className="h-11 pr-10 border-gray-300 dark:border-gray-600 focus:border-indigo-500 focus:ring-indigo-500"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          كلمة المرور الجديدة
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <Input 
                              type={showPassword ? 'text' : 'password'} 
                              placeholder="********" 
                              {...field}
                              onFocus={() => setFocusedField('password')}
                              onBlur={() => setFocusedField(null)}
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
                        </FormControl>
                        {password && (
                          <div className="space-y-1 mt-2">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-gray-500">قوة كلمة المرور:</span>
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
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          تأكيد كلمة المرور
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <Input 
                              type={showConfirmPassword ? 'text' : 'password'} 
                              placeholder="********" 
                              {...field}
                              onFocus={() => setFocusedField('confirmPassword')}
                              onBlur={() => setFocusedField(null)}
                              className="h-11 px-10 border-gray-300 dark:border-gray-600 focus:border-indigo-500 focus:ring-indigo-500"
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                              {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button 
                    type="submit" 
                    className="w-full h-11 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium shadow-lg hover:shadow-xl transition-all mt-2"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                        جاري التعيين...
                      </>
                    ) : (
                      <>
                        <Lock className="ml-2 h-5 w-5" />
                        تعيين كلمة المرور
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          <div className="mt-6 text-center">
            <Link 
              to="/auth/login" 
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition-colors"
            >
              العودة إلى تسجيل الدخول
            </Link>
          </div>
        </div>
        <VersionFooter className="absolute bottom-0 left-0 right-0 py-2 bg-gray-50 dark:bg-gray-900" />
      </div>
    </div>
  );
}
