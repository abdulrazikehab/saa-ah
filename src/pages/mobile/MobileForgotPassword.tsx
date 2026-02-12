import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from 'react-i18next';
import { Loader2, ArrowRight, ArrowLeft, Mail, ShoppingBag } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { authApi, coreApi } from '@/lib/api';
import { getErrorMessage, isErrorObject } from '@/lib/error-utils';

export default function MobileForgotPassword() {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const { toast } = useToast();
    
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    
    // Config state
    const [appConfig, setAppConfig] = useState<any>(null);

    const isRTL = i18n.language === 'ar';
    const dir = isRTL ? 'rtl' : 'ltr';

    // Fetch Config
    React.useEffect(() => {
        const loadConfig = async () => {
            try {
                let currentTenantId = localStorage.getItem('storefrontTenantId') || sessionStorage.getItem('storefrontTenantId');
                const isLocalNetwork = window.location.hostname.includes('nip.io') || window.location.hostname.startsWith('192.168.');
                
                if (!currentTenantId && isLocalNetwork) {
                     currentTenantId = 'c692ca44-bcea-4963-bb47-73957dd8b929'; 
                }

                const configUrl = currentTenantId 
                    ? `/app-builder/config?tenantId=${currentTenantId}` 
                    : '/app-builder/config';

                const data = await coreApi.get(configUrl);
                if (data?.config) setAppConfig(data.config);
                else setAppConfig(data);
            } catch (error) {
                console.error("Failed to load app config", error);
            }
        };
        loadConfig();
    }, []);

    // Derived styles
    const primaryColor = appConfig?.primaryColor;
    const logoUrl = appConfig?.logo || appConfig?.storeLogo;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
             const response = await authApi.forgotPassword(email);
             
             if (isErrorObject(response)) {
                 throw new Error(getErrorMessage(response));
             }

             setSent(true);
             toast({
                 title: t('common.success', 'Success'),
                 description: t('auth.resetEmailSent', 'Password reset instructions sent to your email.'),
             });

        } catch (error: any) {
            toast({
                title: t('common.error', 'Error'),
                description: error.message || t('common.errorOccurred', 'An error occurred'),
                variant: 'destructive'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col" dir={dir}>
            {/* Header / Brand Section */}
            <div 
                className="pt-16 pb-12 px-8 rounded-b-[3rem] shadow-lg mb-8 relative overflow-hidden transition-colors duration-500"
                style={{ backgroundColor: primaryColor || '#000000' }} 
            >
                <div className={`absolute inset-0 -z-10 ${!primaryColor ? 'bg-primary' : ''}`}></div>

                 <div className="relative z-10 flex flex-col items-center text-center">
                    <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-6 text-white border border-white/30 shadow-inner">
                        {logoUrl ? (
                            <img src={logoUrl} alt="Logo" className="w-full h-full object-contain p-2" />
                        ) : (
                            <ShoppingBag size={32} />
                        )}
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">
                        {t('auth.login.forgotPassword', 'Forgot Password')}
                    </h1>
                    <p className="text-white/90 text-lg">
                        {sent 
                            ? t('auth.checkEmail', 'Check your inbox')
                            : t('auth.enterEmailToReset', 'Enter your email to reset password')
                        }
                    </p>
                 </div>
                 
                 {/* Decorative circles */}
                 <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
                 <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-10 -mb-10 blur-xl"></div>
            </div>

            {/* Form */}
            <div className="flex-1 px-6">
                {!sent ? (
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 px-1">
                            {t('auth.login.email', 'Email Address')}
                        </label>
                        <div className="relative">
                            <Mail className={`absolute ${isRTL ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5`} />
                            <Input 
                                className={`h-14 bg-white dark:bg-gray-800 border-none shadow-sm rounded-2xl ${isRTL ? 'pr-12' : 'pl-12'} text-base focus-visible:ring-primary`}
                                placeholder="name@example.com" 
                                type="email" 
                                value={email} 
                                onChange={e => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    </div>
                    
                    <Button 
                        className="w-full h-14 rounded-2xl text-lg font-bold shadow-lg mt-8 hover:scale-[1.02] transition-transform active:scale-[0.98]" 
                        style={{ 
                            backgroundColor: primaryColor,
                            boxShadow: primaryColor ? `0 10px 25px -5px ${primaryColor}40` : undefined
                        }}
                        type="submit" 
                        disabled={loading}
                    >
                        {loading ? (
                            <Loader2 className="animate-spin w-6 h-6" />
                        ) : (
                            <div className="flex items-center justify-center gap-2">
                                <span>{t('auth.resetPassword', 'Reset Password')}</span>
                                {isRTL ? <ArrowLeft size={20} /> : <ArrowRight size={20} />}
                            </div>
                        )}
                    </Button>
                </form>
                ) : (
                    <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-3xl shadow-sm">
                        <p className="mb-6 text-muted-foreground">{t('auth.emailResentDesc', 'We have sent a password reset link to your email address.')}</p>
                        <Button 
                             className="w-full h-12 rounded-xl"
                             style={{ backgroundColor: primaryColor }}
                             onClick={() => navigate({ pathname: '/login', search: window.location.search })}
                        >
                            {t('auth.login.button', 'Back to Login')}
                        </Button>
                    </div>
                )}

                {/* Footer */}
                <div className="mt-10 text-center">
                    <Button 
                        variant="link" 
                        className="font-bold p-0 text-base text-muted-foreground hover:text-primary" 
                        onClick={() => navigate({ pathname: '/login', search: window.location.search })}
                    >
                        {t('common.cancel', 'Cancel')}
                    </Button>
                </div>
            </div>
        </div>
    );
}
