import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Lock, Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { authApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

export default function ChangePassword() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, refreshUser } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isFirstLogin, setIsFirstLogin] = useState(false);

  useEffect(() => {
    // Check if user needs to change password
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    const mustChange = userData.mustChangePassword || (user as any)?.mustChangePassword;
    setIsFirstLogin(!!mustChange);

    // If user doesn't need to change password and is authenticated, redirect to dashboard
    if (!mustChange && user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate passwords match
      if (newPassword !== confirmPassword) {
        toast({
          variant: 'destructive',
          title: 'كلمات المرور غير متطابقة',
          description: 'يرجى التأكد من تطابق كلمة المرور الجديدة وتأكيدها',
        });
        setLoading(false);
        return;
      }

      // Validate password strength (must match backend requirements)
      if (newPassword.length < 6) {
        toast({
          variant: 'destructive',
          title: 'كلمة المرور قصيرة جداً',
          description: 'يجب أن تكون كلمة المرور 6 أحرف على الأقل',
        });
        setLoading(false);
        return;
      }

      // Call change password API
      const response = await authApi.changePassword(currentPassword, newPassword);

      if (response.message) {
        toast({
          title: 'تم تغيير كلمة المرور بنجاح',
          description: 'تم تحديث كلمة المرور بنجاح',
        });

        // Refresh user data to clear mustChangePassword flag
        await refreshUser();

        // Redirect to dashboard after successful password change
        setTimeout(() => {
          navigate('/dashboard', { replace: true });
        }, 1000);
      }
    } catch (error: any) {
      console.error('Failed to change password:', error);
      toast({
        variant: 'destructive',
        title: 'فشل تغيير كلمة المرور',
        description: error?.message || 'حدث خطأ أثناء تغيير كلمة المرور. يرجى المحاولة مرة أخرى.',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">
            {isFirstLogin ? 'تغيير كلمة المرور' : 'تغيير كلمة المرور'}
          </CardTitle>
          <CardDescription className="text-center">
            {isFirstLogin
              ? 'يرجى تغيير كلمة المرور المؤقتة قبل المتابعة'
              : 'قم بتحديث كلمة المرور لحسابك'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isFirstLogin && (
            <Alert className="mb-4">
              <AlertDescription>
                هذا أول تسجيل دخول لك. يرجى تغيير كلمة المرور المؤقتة قبل المتابعة إلى لوحة التحكم.
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">
                {isFirstLogin ? 'كلمة المرور المؤقتة' : 'كلمة المرور الحالية'}
              </Label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="currentPassword"
                  type={showCurrentPassword ? 'text' : 'password'}
                  placeholder={isFirstLogin ? 'أدخل كلمة المرور المؤقتة' : 'أدخل كلمة المرور الحالية'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  className="pr-10 pl-12"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showCurrentPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">كلمة المرور الجديدة</Label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="newPassword"
                  type={showNewPassword ? 'text' : 'password'}
                  placeholder="أدخل كلمة المرور الجديدة (6 أحرف على الأقل)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                  className="pr-10 pl-12"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">تأكيد كلمة المرور الجديدة</Label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="أعد إدخال كلمة المرور الجديدة"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  className="pr-10 pl-12"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  جاري التحديث...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  تغيير كلمة المرور
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

