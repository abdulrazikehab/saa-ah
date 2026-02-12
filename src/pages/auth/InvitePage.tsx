import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authService } from '@/services/auth.service';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Key, Lock, Mail, CheckCircle2, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslation } from 'react-i18next';

export default function InvitePage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { toast } = useToast();
  const navigate = useNavigate();
  const { loginWithTokens } = useAuth();

  const [step, setStep] = useState<'send_otp' | 'verify_otp' | 'success'>('send_otp');
  const [loading, setLoading] = useState(false);
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [developerCode, setDeveloperCode] = useState<string | undefined>();

  const handleSendOtp = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await authService.sendInviteOtp(token);
      setEmail(res.email);
      setStep('verify_otp');
      if (res.developerCode) {
        setDeveloperCode(res.developerCode);
      }
      toast({
        title: 'تم إرسال الرمز',
        description: `تم إرسال رمز التحقق إلى ${res.email}`,
      });
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast({
        title: 'خطأ',
        description: err.response?.data?.message || 'فشل إرسال رمز التحقق',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [token, toast]);

  useEffect(() => {
    if (!token) {
      toast({
        title: 'عذراً',
        description: 'رابط الدعوة غير صالح أو منتهي الصلاحية',
        variant: 'destructive'
      });
      navigate('/login');
    } else {
        // Automatically send OTP on load
        handleSendOtp();
    }
  }, [token, handleSendOtp, navigate, toast]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setLoading(true);
    try {
      const res = await authService.verifyInviteOtp(token, otp, password);
      
      // For customers, we use customerToken and customerData
      localStorage.setItem('customerToken', res.token);
      localStorage.setItem('customerData', JSON.stringify(res.customer));
      
      // Dispatch custom event for CustomerProtectedRoute
      window.dispatchEvent(new CustomEvent('customerLogin'));
      
      setStep('success');
      toast({
        title: 'تم بنجاح',
        description: 'تم تفعيل حسابك بنجاح',
      });
      
      setTimeout(() => {
        // Construct correct redirect URL
        // If developer/localhost environment and tenant ID is present
        // We might need to redirect to subdomain
        const currentHost = window.location.host; // e.g., localhost:3000 or store.localhost:8080
        const protocol = window.location.protocol;
        
        // If we are on the main domain (e.g. localhost:3000) but verified for a tenant
        // We should redirect to that tenant's subdomain if not already there
        if (res.customer?.tenant?.subdomain) {
             const subdomain = res.customer.tenant.subdomain;
             
             // Check if we are already on that subdomain
             const targetSubdomain = (subdomain || '').toLowerCase().trim();
             const currentHostname = window.location.hostname.toLowerCase();
             
             // Define what constitutes the "default" tenant (kawn or default)
             const isDefaultTenant = targetSubdomain === 'kawn' || targetSubdomain === 'default';
             
             // Define what constitutes the "main" domain (no subdomain) on localhost/dev
             const isMainLocalhost = currentHostname === 'localhost' || currentHostname === '127.0.0.1';
             
             // Check if we are already on the correct subdomain
             // 1. Hostname starts with subdomain (e.g. asus1.localhost)
             const isOnSubdomain = currentHostname.startsWith(`${targetSubdomain}.`);
             
             // 2. Special case: We are on main localhost and tenant is default/kawn
             const isDefaultOnMain = isMainLocalhost && isDefaultTenant;
             
             // Check if we are currently on ANY subdomain (that is not www)
             let isOnAnySubdomain = false;
             if (currentHostname.includes('localhost')) {
                 isOnAnySubdomain = currentHostname.split('.').length > 1 && currentHostname !== 'localhost';
             } else {
                 // Prod assumption: subdomain.domain.com (3 parts) vs domain.com (2 parts)
                 isOnAnySubdomain = currentHostname.split('.').length > 2;
             }
             
             // If we are on a subdomain (e.g. asus1.localhost) and the target is default (kawn),
             // we should stay here instead of redirecting to kawn.localhost
             const shouldStayOnCurrent = isOnAnySubdomain && isDefaultTenant;

             console.log('🔍 Invite Page Redirect Check:', {
               targetSubdomain,
               currentHostname,
               isOnSubdomain,
               isOnAnySubdomain,
               shouldStayOnCurrent,
               isDefaultTenant
             });
             
             // Only redirect if we are NOT on the target subdomain AND we shouldn't stay on current
             if (!isOnSubdomain && !shouldStayOnCurrent) {
                 // We need to redirect. 
                 let newHost = '';
                 if (currentHost.includes('localhost') || currentHost.includes('127.0.0.1')) {
                     const port = currentHost.includes(':') ? currentHost.split(':')[1] : '8080';
                     newHost = `${targetSubdomain}.localhost:${port}`;
                 } else {
                     // Production
                     const domainParts = currentHost.split('.');
                     const baseDomain = domainParts.slice(-2).join('.');
                     newHost = `${targetSubdomain}.${baseDomain}`;
                 }
                 
                 window.location.href = `${protocol}//${newHost}/login`;
                 return;
             }
        }

        navigate('/');
      }, 2000);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast({
        title: 'خطأ',
        description: err.response?.data?.message || 'فشل التحقق من الرمز',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-muted/40">
      <Card className="w-full max-w-md shadow-xl border-border/50 bg-card">
        <CardHeader className="space-y-2 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full bg-primary/10">
              <Mail className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">تفعيل حسابك</CardTitle>
          <CardDescription>
            {step === 'send_otp' && 'جاري تحضير الدعوة...'}
            {step === 'verify_otp' && `تم إرسال رمز التحقق إلى ${email}`}
            {step === 'success' && 'تم تفعيل الحساب بنجاح!'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 'send_otp' && (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}

          {step === 'verify_otp' && (
            <form onSubmit={handleVerify} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otp">رمز التحقق (OTP)</Label>
                <div className="relative">
                   <Key className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                   <Input
                     id="otp"
                     value={otp}
                     onChange={(e) => setOtp(e.target.value)}
                     placeholder="000000"
                     className="pr-10 text-center tracking-[0.5em] font-bold"
                     required
                   />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">تعيين كلمة مرور جديدة</Label>
                <div className="relative">
                   <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                   <Input
                     id="password"
                     type="password"
                     value={password}
                     onChange={(e) => setPassword(e.target.value)}
                     placeholder="********"
                     className="pr-10"
                     required
                   />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    تفعيل الحساب
                    <ArrowRight className="mr-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          )}

          {step === 'success' && (
            <div className="text-center py-8 space-y-4">
              <div className="flex justify-center">
                <CheckCircle2 className="h-16 w-16 text-green-500 animate-in zoom-in duration-300" />
              </div>
              <p className="font-medium">سيتم توجيهك إلى المتجر الآن...</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
