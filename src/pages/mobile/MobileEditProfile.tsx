import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/services/core/api-client';
import { authApi, coreApi } from '@/lib/api';
import { Loader2, User, Mail, Phone, Save } from 'lucide-react';

export default function MobileEditProfile() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });

  const [activeConfig, setActiveConfig] = useState<any>(null);

  useEffect(() => {
    loadProfile();
    coreApi.get('/app-builder/config').then(res => setActiveConfig(res.config || res)).catch(() => {});
  }, []);

  const loadProfile = async () => {
    setIsLoading(true);
    try {
      const customerData = localStorage.getItem('customerData');
      if (customerData) {
        const user = JSON.parse(customerData);
        setFormData({
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          email: user.email || '',
          phone: user.phone || '',
        });
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const customerToken = localStorage.getItem('customerToken');
      // Using the same endpoint as AccountProfile
      const response = await apiClient.fetch(`${apiClient.authUrl}/customers/profile`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${customerToken}` },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
        }),
      });

      // Update local storage
      const existingData = JSON.parse(localStorage.getItem('customerData') || '{}');
      localStorage.setItem('customerData', JSON.stringify({ ...existingData, ...response }));

      toast({
        title: t('common.success', 'Success'),
        description: t('profile.updateSuccess', 'Profile updated successfully'),
      });
      navigate(-1);
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast({
        title: t('common.error', 'Error'),
        description: t('profile.updateError', 'Failed to update profile'),
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const primaryColor = activeConfig?.primaryColor || '#000000';

  if (isLoading) return <div className="p-8 text-center pt-20"><Loader2 className="animate-spin h-8 w-8 mx-auto" /></div>;

  return (
    <div className="pb-24 bg-background min-h-screen">
      <div className="bg-card p-4 shadow-sm sticky top-0 z-10 flex items-center gap-3 border-b border-border">
          <button onClick={() => navigate(-1)} className="p-1 rounded-full hover:bg-muted text-foreground">
             <ArrowIcon className="w-5 h-5 rtl:rotate-180" />
          </button>
          <h1 className="text-lg font-bold text-foreground">{t('profile.editProfile', 'Edit Profile')}</h1>
      </div>

      <div className="p-5">
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="firstName">{t('auth.register.firstName', 'First Name')}</Label>
                    <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground rtl:right-3 rtl:left-auto" />
                        <Input 
                            id="firstName"
                            value={formData.firstName}
                            onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                            className="pl-10 h-12 rounded-xl rtl:pr-10 rtl:pl-3 bg-card border-border focus:border-primary text-foreground"
                            placeholder="John" 
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="lastName">{t('auth.register.lastName', 'Last Name')}</Label>
                    <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground rtl:right-3 rtl:left-auto" />
                        <Input 
                            id="lastName"
                            value={formData.lastName}
                            onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                            className="pl-10 h-12 rounded-xl rtl:pr-10 rtl:pl-3 bg-card border-border focus:border-primary text-foreground"
                            placeholder="Doe" 
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="email">{t('auth.register.email', 'Email')}</Label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground rtl:right-3 rtl:left-auto" />
                        <Input 
                            id="email"
                            value={formData.email}
                            disabled
                            className="pl-10 h-12 rounded-xl rtl:pr-10 rtl:pl-3 bg-muted border-border text-muted-foreground"
                        />
                    </div>
                    <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="phone">{t('auth.register.phone', 'Phone Number')}</Label>
                    <div className="relative">
                        <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground rtl:right-3 rtl:left-auto" />
                        <Input 
                            id="phone"
                            value={formData.phone}
                            onChange={(e) => setFormData({...formData, phone: e.target.value})}
                            className="pl-10 h-12 rounded-xl rtl:pr-10 rtl:pl-3 bg-card border-border focus:border-primary text-foreground"
                            placeholder="+1 234 567 890" 
                        />
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
