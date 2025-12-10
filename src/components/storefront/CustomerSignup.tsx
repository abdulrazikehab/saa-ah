import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Loader2, UserPlus, Mail, Lock, User, Eye, EyeOff, X, Phone, Shield, Key, Copy, CheckCircle2, ArrowRight } from 'lucide-react';
import { coreApi } from '@/lib/api';
import { apiClient } from '@/services/core/api-client';

interface CustomerSignupProps {
  onClose: () => void;
  onSwitchToLogin: () => void;
  onSignupSuccess?: () => void;
}

export function CustomerSignup({ onClose, onSwitchToLogin, onSignupSuccess }: CustomerSignupProps) {
  const { toast } = useToast();
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
    if (passwordStrength < 40) return 'ضعيفة';
    if (passwordStrength < 70) return 'متوسطة';
    return 'قوية';
  };

  const copyRecoveryId = () => {
    if (recoveryId) {
      navigator.clipboard.writeText(recoveryId);
      setCopiedRecovery(true);
      toast({
        title: 'تم النسخ!',
        description: 'تم نسخ رمز الاسترداد إلى الحافظة',
      });
      setTimeout(() => setCopiedRecovery(false), 2000);
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
        title: 'خطأ',
        description: 'كلمتا المرور غير متطابقتين',
      });
      return;
    }

    setLoading(true);
    
    try {
      const response = await apiClient.post(`${apiClient.authUrl}/customers/signup`, {
        email,
        password,
        firstName,
        lastName,
        phone,
      });
      
      // Store customer token
      localStorage.setItem('customerToken', response.token);
      localStorage.setItem('customerData', JSON.stringify(response.customer));
      
      if (response.recoveryId) {
        setRecoveryId(response.recoveryId);
        setShowRecoveryModal(true);
      } else {
        toast({
          title: 'تم إنشاء الحساب بنجاح',
          description: 'مرحباً بك في متجرنا',
        });
        
        onSignupSuccess?.();
        onClose();
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast({
        variant: 'destructive',
        title: 'خطأ في إنشاء الحساب',
        description: err.response?.data?.message || 'حدث خطأ أثناء إنشاء الحساب',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      {/* Recovery ID Modal */}
      {showRecoveryModal && recoveryId ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full mx-auto overflow-hidden animate-in fade-in zoom-in duration-300">
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 text-white text-center">
            <div className="mx-auto w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4">
              <Shield className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold">رمز الاسترداد السري</h2>
            <p className="text-sm text-white/80 mt-1">Secret Recovery ID</p>
          </div>
          
          <div className="p-6 space-y-4">
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Key className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-yellow-800 dark:text-yellow-200 text-right">
                  <p className="font-semibold mb-1">هام جداً!</p>
                  <p>احفظ هذا الرمز في مكان آمن. يمكنك استخدامه لاسترداد حسابك إذا نسيت بريدك الإلكتروني أو تعرض للاختراق.</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-100 dark:bg-gray-700 rounded-xl p-4">
              <div className="text-center">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">رمز الاسترداد | Recovery ID</p>
                <p className="text-2xl font-mono font-bold text-indigo-600 dark:text-indigo-400 tracking-wider dir-ltr">
                  {recoveryId}
                </p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button
                onClick={copyRecoveryId}
                variant="outline"
                className="flex-1 h-12"
              >
                {copiedRecovery ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 ml-2 text-green-500" />
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
                onClick={handleClose}
                className="flex-1 h-12 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                disabled={!copiedRecovery}
              >
                متابعة
                <ArrowRight className="w-4 h-4 mr-2" />
              </Button>
            </div>
            
            {!copiedRecovery && (
              <p className="text-xs text-center text-gray-500">
                يرجى نسخ الرمز قبل المتابعة
              </p>
            )}
          </div>
        </div>
      ) : (
      <Card className="w-full max-w-md relative my-8">
        <button
          onClick={onClose}
          className="absolute left-4 top-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors z-10"
        >
          <X className="h-5 w-5" />
        </button>

        <CardHeader className="text-center pb-4">
          <CardTitle className="text-2xl font-bold">إنشاء حساب جديد</CardTitle>
          <CardDescription>انضم إلينا وابدأ التسوق الآن</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">الاسم الأول</Label>
                <div className="relative">
                  <User className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="firstName"
                    placeholder="أحمد"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    className="pr-10"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="lastName">الاسم الأخير</Label>
                <Input
                  id="lastName"
                  placeholder="محمد"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="signup-email">البريد الإلكتروني</Label>
              <div className="relative">
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="signup-email"
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
              <Label htmlFor="phone">رقم الهاتف (اختياري)</Label>
              <div className="relative">
                <Phone className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+966 50 123 4567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="signup-password">كلمة المرور</Label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="signup-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
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
              
              {password && (
                <div className="space-y-1">
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">تأكيد كلمة المرور</Label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  className="pr-10"
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full mt-6"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="ml-2 h-5 w-5 animate-spin" />
                  <span>جاري الإنشاء...</span>
                </>
              ) : (
                <>
                  <UserPlus className="ml-2 h-5 w-5" />
                  <span>إنشاء حساب</span>
                </>
              )}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col gap-3">
          <Separator />
          <p className="text-sm text-center text-gray-600 dark:text-gray-400">
            لديك حساب بالفعل؟{' '}
            <button 
              onClick={onSwitchToLogin}
              className="text-primary hover:underline font-semibold"
            >
              سجل الدخول
            </button>
          </p>
        </CardFooter>
      </Card>
      )}
    </div>
  );
}
