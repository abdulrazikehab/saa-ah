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
import { VersionFooter } from '@/components/common/VersionFooter';
import { getLogoUrl, BRAND_NAME_AR, BRAND_NAME_EN, BRAND_TAGLINE_AR, BRAND_TAGLINE_EN } from '@/config/logo.config';
import { getProfessionalErrorMessage } from '@/lib/toast-errors';
import { useTranslation } from 'react-i18next';
import { Capacitor } from '@capacitor/core';
import MobileForgotPassword from '@/pages/mobile/MobileForgotPassword';
import { useStoreSettings } from '@/contexts/StoreSettingsContext';

const formSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

export default function ForgotPassword() {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const { toast } = useToast();
  const { settings } = useStoreSettings();
  const logoUrl = settings?.storeLogoUrl || getLogoUrl();
  const brandName = settings?.storeName || BRAND_NAME_AR;

  const isNativeMode = Capacitor.isNativePlatform() || window.location.href.includes('platform=mobile');

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
      setEmailSent(true);
      toast({
        title: 'تم إرسال رابط إعادة التعيين',
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
      setIsLoading(false);
    }
  }




  if (isNativeMode) {
    return <MobileForgotPassword />;
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 gradient-primary p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-10" />
        <div className="absolute top-20 right-20 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }} />
        
        <div className="relative z-10">
          <Link to="/" className="flex items-center gap-4 group">
            <div className="w-16 h-16 rounded-xl overflow-hidden bg-white/10 backdrop-blur-sm border border-white/20 shadow-lg p-1 flex items-center justify-center bg-white">
              <img src={logoUrl} alt={brandName} className="w-full h-full object-contain group-hover:scale-110 transition-transform" />
            </div>
            <div className="flex flex-col">
              <span className="text-3xl font-heading font-bold text-white">{brandName}</span>
              {/* Only show secondary brand name if we are using default branding */}
              {!settings?.storeName && <span className="text-lg text-white/80">{BRAND_NAME_EN}</span>}
            </div>
          </Link>
        </div>

        <div className="relative z-10 space-y-6">
          <h1 className="text-5xl font-heading font-bold text-white leading-tight">
            نسيت كلمة المرور؟<br />لا مشكلة!
          </h1>
          <p className="text-xl text-white/90">
            أدخل بريدك الإلكتروني وسنرسل لك تعليمات إعادة التعيين
          </p>
          <div className="flex items-center gap-3 text-white pt-4">
            <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <span>عملية آمنة ومشفرة</span>
          </div>
        </div>

        <div className="relative z-10 text-white/50 text-sm">
          © {new Date().getFullYear()} {brandName}. جميع الحقوق محفوظة.
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-background">
        <div className="w-full max-w-md">
          <Link to="/" className="flex lg:hidden items-center justify-center gap-3 mb-8 group">
            <div className="w-14 h-14 rounded-xl overflow-hidden bg-white border border-border shadow-lg p-1 flex items-center justify-center">
              <img src={logoUrl} alt={brandName} className="w-full h-full object-contain group-hover:scale-110 transition-transform" />
            </div>
            <div className="flex flex-col items-center">
              <span className="text-2xl font-heading font-bold gradient-text">{brandName}</span>
            </div>
          </Link>

          <Card className="shadow-xl border-border/50">
            <CardHeader className="space-y-1 text-center pb-6">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Sparkles className="h-5 w-5 text-primary animate-pulse" />
                <CardTitle className="text-2xl font-heading font-bold">
                  استعادة كلمة المرور
                </CardTitle>
                <Sparkles className="h-5 w-5 text-secondary animate-pulse" />
              </div>
              <CardDescription className="text-base">
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
                        <FormLabel className="text-sm font-medium">
                          البريد الإلكتروني
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className={`absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 transition-colors ${
                              focusedField === 'email' ? 'text-primary' : 'text-muted-foreground'
                            }`} />
                            <Input 
                              placeholder="you@example.com" 
                              {...field}
                              onFocus={() => setFocusedField('email')}
                              onBlur={() => setFocusedField(null)}
                              className="h-11 pr-10 border-border focus:border-primary focus:ring-primary"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button 
                    type="submit" 
                    className="w-full h-11 gradient-primary font-medium shadow-lg hover:shadow-xl transition-all"
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
                to="/login" 
                className="text-sm text-muted-foreground hover:text-primary flex items-center gap-2 font-medium transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                العودة إلى تسجيل الدخول
              </Link>
            </CardFooter>
          </Card>

          <div className="mt-6 text-center space-y-2">
            <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
              <Link to="/privacy" className="hover:text-primary transition-colors">الخصوصية</Link>
              <span>•</span>
              <Link to="/terms" className="hover:text-primary transition-colors">الشروط</Link>
              <span>•</span>
              <Link to="/help" className="hover:text-primary transition-colors">المساعدة</Link>
            </div>
          </div>
        </div>
        <VersionFooter className="absolute bottom-0 left-0 right-0 py-2 bg-background" />
      </div>
    </div>
  );
}
