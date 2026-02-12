import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from 'react-i18next';
import { Loader2, ArrowRight, ArrowLeft, Mail, Lock, User as UserIcon, ShoppingBag } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { coreApi, apiClient } from '@/lib/api';
import { getTenantContext } from '@/lib/storefront-utils';
import { getErrorMessage, isErrorObject } from '@/lib/error-utils';
import { useAuth } from '@/contexts/AuthContext';

interface AppConfig {
    primaryColor?: string;
    logo?: string;
    storeLogo?: string;
    [key: string]: unknown;
}

export default function MobileLogin() {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const { toast } = useToast();
    
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    
    // Config state
    const [appConfig, setAppConfig] = useState<AppConfig | null>(null);

    const isRTL = i18n.language === 'ar';
    const dir = isRTL ? 'rtl' : 'ltr';

    const { user, isAuthenticated, loading: authLoading } = useAuth();
    const location = useLocation();

    // Memoize the redirect URL to prevent infinite render loops
    const returnTo = React.useMemo(() => {
        const searchParams = new URLSearchParams(window.location.search);
        const queryReturnTo = searchParams.get('returnTo');
        const stateReturnTo = (location.state as { from?: { pathname: string } })?.from?.pathname;
        const rawReturnTo = queryReturnTo || stateReturnTo;
        
        // Sanitize returnTo to prevent loops (don't redirect to login or auth pages)
        return (rawReturnTo && !rawReturnTo.includes('/login') && !rawReturnTo.includes('/auth')) 
            ? rawReturnTo 
            : '/';
    }, [location.state]);

    // Redirect if already logged in (but only after auth check completes)
    React.useEffect(() => {
        if (!authLoading && isAuthenticated) {
            // Prevent navigating to the same page we are already on
            if (window.location.pathname !== returnTo) {
                console.log("MobileLogin: User already authenticated, redirecting to:", returnTo);
                navigate(returnTo, { replace: true });
            }
        }
    }, [isAuthenticated, authLoading, navigate, returnTo]);

    // Fetch Config
    React.useEffect(() => {
        const loadConfig = async () => {
            try {
                const currentTenantId = localStorage.getItem('storefrontTenantId') || sessionStorage.getItem('storefrontTenantId');
                const isLocalNetwork = window.location.hostname.includes('nip.io') || window.location.hostname.startsWith('192.168.');
                
                let effectiveTenantId = currentTenantId;
                if (!effectiveTenantId && isLocalNetwork) {
                     effectiveTenantId = 'c692ca44-bcea-4963-bb47-73957dd8b929'; // Fallback Dev Tenant
                }

                const configUrl = effectiveTenantId 
                    ? `/app-builder/config?tenantId=${effectiveTenantId}` 
                    : '/app-builder/config';

                const response = await coreApi.get(configUrl);
                const config = response?.config || response;
                setAppConfig(config);
            } catch (error) {
                console.error("Failed to load app config", error);
            }
        };
        loadConfig();
    }, []);

    // Derived styles
    const primaryColor = appConfig?.primaryColor;
    const logoUrl = appConfig?.logo || appConfig?.storeLogo;

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const tenantContext = getTenantContext();
            const headers: Record<string, string> = {};
            if (tenantContext.subdomain) {
                headers['X-Tenant-Domain'] = tenantContext.domain;
            }

            const response = await apiClient.post(
                `${apiClient.authUrl}/customers/login`, 
                { email, password },
                { 
                    requireAuth: false,
                    headers,
                }
            );

            if (isErrorObject(response)) {
                 throw new Error(getErrorMessage(response));
            }

            // Store tokens
            localStorage.setItem('customerToken', String(response.token || ''));
            if (response.customer) {
                localStorage.setItem('customerData', JSON.stringify(response.customer));
                // Dispatch event for AuthContext to refresh
                window.dispatchEvent(new CustomEvent('customerLogin', { detail: response.customer }));
            }

            toast({
                title: t('common.success', 'Success'),
                description: t('auth.login.success', 'Login successful'),
            });
            
            // Navigate to return URL or home (returnTo is extracted from query params at component level)
            navigate({ pathname: returnTo, search: '' }, { replace: true });
        } catch (error: unknown) {
            toast({
                title: t('common.error', 'Error'),
                description: (error instanceof Error ? error.message : String(error)) || t('common.authFailed', 'Login Failed'),
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
                style={{ backgroundColor: primaryColor || '#000000' }} // Default to black if no config, or use primary class fallback
            >
                {/* Fallback Primary Background via Class if inline style fails/is delay */}
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
                        {t('auth.login.title', 'Welcome Back')}
                    </h1>
                    <p className="text-white/90 text-lg">
                        {t('common.pleaseLogin', 'Sign in to continue')}
                    </p>
                 </div>
                 
                 {/* Decorative circles */}
                 <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
                 <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-10 -mb-10 blur-xl"></div>
            </div>

            {/* Login Form */}
            <div className="flex-1 px-6">
                <form onSubmit={handleLogin} className="space-y-6">
                    <div className="space-y-4">
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

                        <div className="space-y-2">
                            <div className="flex justify-between items-center px-1">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {t('auth.login.password', 'Password')}
                                </label>
                                <Button 
                                    variant="link" 
                                    className="text-xs p-0 h-auto text-primary font-semibold" 
                                    type="button"
                                    onClick={() => navigate({ pathname: '/forgot-password', search: window.location.search })}
                                >
                                    {t('auth.login.forgotPassword', 'Forgot Password?')}
                                </Button>
                            </div>
                            <div className="relative">
                                <Lock className={`absolute ${isRTL ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5`} />
                                <Input 
                                    className={`h-14 bg-white dark:bg-gray-800 border-none shadow-sm rounded-2xl ${isRTL ? 'pr-12' : 'pl-12'} text-base focus-visible:ring-primary`}
                                    placeholder="••••••••" 
                                    type="password" 
                                    value={password} 
                                    onChange={e => setPassword(e.target.value)}
                                    required
                                />
                            </div>
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
                                <span>{t('auth.login.button', 'Login')}</span>
                                {isRTL ? <ArrowLeft size={20} /> : <ArrowRight size={20} />}
                            </div>
                        )}
                    </Button>
                </form>
            </div>

            {/* Footer */}
            <div className="p-8 text-center mt-auto">
                 <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <span>{t('auth.login.noAccount', 'Don\'t have an account?')}</span>
                    <Button 
                        variant="link" 
                        className="font-bold p-0 text-base" 
                        style={{ color: primaryColor }}
                        onClick={() => navigate({ pathname: '/signup', search: window.location.search })}
                    >
                        {t('auth.login.signupLink', 'Sign Up')}
                    </Button>
                 </div>
            </div>
        </div>
    );
}
