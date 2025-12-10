import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Loader2, LogIn, Mail, Lock, Eye, EyeOff, X } from 'lucide-react';
import { apiClient } from '@/services/core/api-client';

interface CustomerLoginProps {
  onClose: () => void;
  onSwitchToSignup: () => void;
  onLoginSuccess?: () => void;
}

export function CustomerLogin({ onClose, onSwitchToSignup, onLoginSuccess }: CustomerLoginProps) {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await apiClient.post(`${apiClient.authUrl}/customers/login`, { email, password });
      
      // Store customer token
      localStorage.setItem('customerToken', response.token);
      localStorage.setItem('customerData', JSON.stringify(response.customer));
      
      toast({
        title: 'تم تسجيل الدخول بنجاح',
        description: 'مرحباً بك في متجرنا',
      });
      
      onLoginSuccess?.();
      onClose();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast({
        variant: 'destructive',
        title: 'خطأ في تسجيل الدخول',
        description: err.response?.data?.message || 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md relative">
        <button
          onClick={onClose}
          className="absolute left-4 top-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <CardHeader className="text-center pb-4">
          <CardTitle className="text-2xl font-bold">تسجيل الدخول</CardTitle>
          <CardDescription>سجل دخولك للمتابعة مع طلبك</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="customer-email">البريد الإلكتروني</Label>
              <div className="relative">
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="customer-email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="pr-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="customer-password">كلمة المرور</Label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="customer-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="px-10"
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

            <Button 
              type="submit" 
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="ml-2 h-5 w-5 animate-spin" />
                  <span>جاري تسجيل الدخول...</span>
                </>
              ) : (
                <>
                  <LogIn className="ml-2 h-5 w-5" />
                  <span>تسجيل الدخول</span>
                </>
              )}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col gap-3">
          <Separator />
          <p className="text-sm text-center text-gray-600 dark:text-gray-400">
            ليس لديك حساب؟{' '}
            <button 
              onClick={onSwitchToSignup}
              className="text-primary hover:underline font-semibold"
            >
              أنشئ حساباً جديداً
            </button>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
