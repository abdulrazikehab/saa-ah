import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link } from 'react-router-dom';
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
import { Loader2, ArrowLeft, Mail, Send, CheckCircle2, Sparkles } from 'lucide-react';

const formSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

export default function ForgotPassword() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      await authApi.forgotPassword(values.email);
      setIsSubmitted(true);
      toast({
        title: 'تم إرسال رابط إعادة التعيين',
        description: 'إذا كان هناك حساب بهذا البريد، ستتلقى رابط إعادة تعيين كلمة المرور.',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: error instanceof Error ? error.message : 'حدث خطأ ما',
      });
    } finally {
      setIsLoading(false);
    }
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex">
        {/* Left Side - Branding */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-12 flex-col justify-between relative overflow-hidden">
          <div className="absolute top-20 right-20 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse-slow" />
          <div className="absolute bottom-20 left-20 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }} />
          
          <div className="relative z-10">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                <img src="/saas-logo.png" alt="Logo" className="w-8 h-8 bg-transparent object-contain" />
              </div>
              <span className="text-3xl font-bold text-white">Saa'ah</span>
            </Link>
          </div>

          <div className="relative z-10 space-y-6">
            <h1 className="text-5xl font-bold text-white leading-tight">
              لا تقلق!<br />سنساعدك في استعادة حسابك
            </h1>
            <p className="text-xl text-white/90">
              نحن هنا لمساعدتك في إعادة تعيين كلمة المرور بشكل آمن وسريع
            </p>
          </div>

          <div className="relative z-10 text-white/60 text-sm">
            © 2024 Saa'ah. جميع الحقوق محفوظة.
          </div>
        </div>

        {/* Right Side - Success Message */}
        <div className="flex-1 flex items-center justify-center p-6 bg-gray-50 dark:bg-gray-900">
          <div className="w-full max-w-md">
            <Link to="/" className="flex lg:hidden items-center justify-center gap-3 mb-8">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <img src="/saas-logo.png" alt="Logo" className="w-8 h-8 bg-transparent object-contain" />
              </div>
              <span className="text-2xl font-bold gradient-text">Saa'ah</span>
            </Link>

            <Card className="border-0 shadow-xl bg-white dark:bg-gray-800">
              <CardHeader className="text-center space-y-4 pb-6">
                <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg">
                  <CheckCircle2 className="h-10 w-10 text-white" />
                </div>
                <div className="space-y-2">
                  <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                    تحقق من بريدك الإلكتروني
                  </CardTitle>
                  <CardDescription className="text-base text-gray-600 dark:text-gray-400">
                    لقد أرسلنا رابط إعادة تعيين كلمة المرور إلى
                  </CardDescription>
                  <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                    {form.getValues('email')}
                  </p>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    انقر على الرابط في البريد الإلكتروني لإعادة تعيين كلمة المرور. إذا لم تجد البريد، تحقق من مجلد الرسائل غير المرغوب فيها.
                  </p>
                </div>
                <Button asChild className="w-full h-11 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700">
                  <Link to="/auth/login" className="flex items-center gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    العودة إلى تسجيل الدخول
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute top-20 right-20 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }} />
        
        <div className="relative z-10">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
              <img src="/saas-logo.png" alt="Logo" className="w-8 h-8 bg-transparent object-contain" />
            </div>
            <span className="text-3xl font-bold text-white">Saa'ah</span>
          </Link>
        </div>

        <div className="relative z-10 space-y-6">
          <h1 className="text-5xl font-bold text-white leading-tight">
            نسيت كلمة المرور؟<br />لا مشكلة!
          </h1>
          <p className="text-xl text-white/90">
            أدخل بريدك الإلكتروني وسنرسل لك تعليمات إعادة التعيين
          </p>
          <div className="flex items-center gap-3 text-white pt-4">
            <CheckCircle2 className="h-6 w-6" />
            <span>عملية آمنة ومشفرة</span>
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
              <img src="/saas-logo.png" alt="Logo" className="w-8 h-8 bg-transparent object-contain" />
            </div>
            <span className="text-2xl font-bold gradient-text">Saa'ah</span>
          </Link>

          <Card className="border-0 shadow-xl bg-white dark:bg-gray-800">
            <CardHeader className="space-y-1 text-center pb-6">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Sparkles className="h-5 w-5 text-indigo-500 animate-pulse" />
                <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                  استعادة كلمة المرور
                </CardTitle>
                <Sparkles className="h-5 w-5 text-purple-500 animate-pulse" />
              </div>
              <CardDescription className="text-base text-gray-600 dark:text-gray-400">
                أدخل بريدك الإلكتروني لإعادة تعيين كلمة المرور
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
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
                              placeholder="you@example.com" 
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
                  <Button 
                    type="submit" 
                    className="w-full h-11 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium shadow-lg hover:shadow-xl transition-all"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="ml-2 h-5 w-5 animate-spin" />
                        جاري الإرسال...
                      </>
                    ) : (
                      <>
                        <Send className="ml-2 h-5 w-5" />
                        إرسال رابط إعادة التعيين
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
            <CardFooter className="flex justify-center pt-2">
              <Link 
                to="/auth/login" 
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-2 font-medium transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                العودة إلى تسجيل الدخول
              </Link>
            </CardFooter>
          </Card>

          <div className="mt-6 text-center space-y-2">
            <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
              <Link to="/privacy" className="hover:text-indigo-600 transition-colors">الخصوصية</Link>
              <span>•</span>
              <Link to="/terms" className="hover:text-indigo-600 transition-colors">الشروط</Link>
              <span>•</span>
              <Link to="/help" className="hover:text-indigo-600 transition-colors">المساعدة</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
