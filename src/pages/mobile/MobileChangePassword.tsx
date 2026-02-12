import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/services/core/api-client';
import { coreApi } from '@/lib/api';
import { Loader2, Lock, Eye, EyeOff, Save } from 'lucide-react';

export default function MobileChangePassword() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [activeConfig, setActiveConfig] = useState<any>(null);

  useEffect(() => {
    coreApi.get('/app-builder/config').then(res => setActiveConfig(res.config || res)).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.newPassword !== formData.confirmPassword) {
        toast({
            title: t('common.error', 'Error'),
            description: t('auth.passwordMismatch', 'Passwords do not match'),
            variant: 'destructive',
        });
        return;
    }

    if (formData.newPassword.length < 6) {
        toast({
            title: t('common.error', 'Error'),
            description: t('auth.passwordLength', 'Password must be at least 6 characters'),
            variant: 'destructive',
        });
        return;
    }

    setIsSaving(true);
    try {
      const customerToken = localStorage.getItem('customerToken');
      await apiClient.fetch(`${apiClient.authUrl}/customers/change-password`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${customerToken}` },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
        }),
      });

      toast({
        title: t('common.success', 'Success'),
        description: t('auth.passwordChanged', 'Password changed successfully'),
      });
      navigate(-1);
    } catch (error: any) {
      console.error('Failed to change password:', error);
      toast({
        title: t('common.error', 'Error'),
        description: error.message || t('auth.passwordChangeError', 'Failed to change password'),
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const primaryColor = activeConfig?.primaryColor || '#000000';

  return (
    <div className="pb-24 bg-background min-h-screen">
      <div className="bg-card p-4 shadow-sm sticky top-0 z-10 flex items-center gap-3 border-b border-border">
          <button onClick={() => navigate(-1)} className="p-1 rounded-full hover:bg-muted text-foreground">
             <ArrowIcon className="w-5 h-5 rtl:rotate-180" />
          </button>
          <h1 className="text-lg font-bold text-foreground">{t('profile.changePassword', 'Change Password')}</h1>
      </div>

      <div className="p-5">
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="currentPassword">{t('auth.currentPassword', 'Current Password')}</Label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground rtl:right-3 rtl:left-auto" />
                        <Input 
                            id="currentPassword"
                            type={showCurrentPassword ? "text" : "password"}
                            value={formData.currentPassword}
                            onChange={(e) => setFormData({...formData, currentPassword: e.target.value})}
                            className="pl-10 pr-10 h-12 rounded-xl rtl:pr-3 rtl:pl-10 bg-card border-border focus:border-primary text-foreground"
                        />
                        <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)} className="absolute right-3 top-3 text-muted-foreground hover:text-foreground rtl:left-3 rtl:right-auto">
                            {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="newPassword">{t('auth.newPassword', 'New Password')}</Label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground rtl:right-3 rtl:left-auto" />
                        <Input 
                            id="newPassword"
                            type={showNewPassword ? "text" : "password"}
                            value={formData.newPassword}
                            onChange={(e) => setFormData({...formData, newPassword: e.target.value})}
                            className="pl-10 pr-10 h-12 rounded-xl rtl:pr-3 rtl:pl-10 bg-card border-border focus:border-primary text-foreground"
                        />
                         <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3 top-3 text-muted-foreground hover:text-foreground rtl:left-3 rtl:right-auto">
                            {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="confirmPassword">{t('auth.confirmPassword', 'Confirm Password')}</Label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground rtl:right-3 rtl:left-auto" />
                        <Input 
                            id="confirmPassword"
                            type={showConfirmPassword ? "text" : "password"}
                            value={formData.confirmPassword}
                            onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                            className="pl-10 pr-10 h-12 rounded-xl rtl:pr-3 rtl:pl-10 bg-card border-border focus:border-primary text-foreground"
                        />
                         <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-3 text-muted-foreground hover:text-foreground rtl:left-3 rtl:right-auto">
                            {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                    </div>
                </div>
            </div>

            <Button 
                type="submit" 
                className="w-full h-12 rounded-xl font-bold text-lg shadow-lg shadow-primary/20 text-white"
                style={{ backgroundColor: primaryColor }}
                disabled={isSaving}
            >
                {isSaving ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2 h-5 w-5" />}
                {t('common.save', 'Save Changes')}
            </Button>
        </form>
      </div>
    </div>
  );
}

function ArrowIcon(props: any) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <path d="m15 18-6-6 6-6"/>
        </svg>
    )
}
