import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from 'react-i18next';
import { Loader2, ArrowRight, ArrowLeft, Mail, Lock, User, Phone, ShoppingBag, Building2, FileText, MapPin, Globe } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { coreApi, apiClient } from '@/lib/api';
import { getTenantContext } from '@/lib/storefront-utils';
import { getErrorMessage, isErrorObject } from '@/lib/error-utils';
import { useStoreSettings } from '@/contexts/StoreSettingsContext';

export default function MobileSignup() {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const { toast } = useToast();
    const { settings } = useStoreSettings();
    
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [phone, setPhone] = useState('');
    
    // B2B fields
    const [companyName, setCompanyName] = useState('');
    const [taxId, setTaxId] = useState('');
    const [activity, setActivity] = useState('');
    const [city, setCity] = useState('');
    const [country, setCountry] = useState('SA');
    const [storeName, setStoreName] = useState('');
    
    const [loading, setLoading] = useState(false);
    
    // Config state
    const [appConfig, setAppConfig] = useState<Record<string, any> | null>(null);

    const isRTL = i18n.language === 'ar';
    const dir = isRTL ? 'rtl' : 'ltr';

    // B2B logic
    const isB2B = settings?.businessModel === 'B2B';
    const isPrivateStore = settings?.isPrivateStore === true;
    const isRequestMode = isPrivateStore || (isB2B && settings?.customerRegistrationRequestEnabled === true);

    // Fetch Config (keep this for colors/logo)
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

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (password !== confirmPassword) {
            toast({
                title: t('common.error', 'Error'),
                description: t('auth.passwordMismatch', 'Passwords do not match'),
                variant: 'destructive'
            });
            return;
        }

        if (isB2B && !companyName.trim()) {
            toast({
                title: t('common.error', 'Error'),
                description: isRTL ? 'يرجى إدخال اسم الشركة' : 'Please enter company name',
                variant: 'destructive'
            });
            return;
        }

        setLoading(true);
        try {
             const tenantContext = getTenantContext();
             const headers: Record<string, string> = {};
             if (tenantContext.subdomain) {
                headers['X-Tenant-Domain'] = tenantContext.domain;
             }

             if (isRequestMode) {
                 const requestData = {
                     email,
                     password,
                     fullName: `${firstName} ${lastName}`.trim() || email.split('@')[0],
                     phone: phone || undefined,
                     ...(isB2B && {
                         companyName,
                         taxId,
                         activity,
                         city,
                         country,
                         storeName: storeName || companyName
                     })
                 };

                 const response = await coreApi.post('/customer-registration-requests', requestData, { requireAuth: false, headers });
                 
                 toast({
                     title: t('common.success', 'Success'),
                     description: isRTL 
                        ? 'تم إرسال طلب التسجيل بنجاح. سيتم مراجعته من قبل صاحب المتجر.'
                        : 'Your registration request has been submitted and will be reviewed.',
                 });
                 
                 setTimeout(() => navigate({ pathname: '/login', search: window.location.search }), 3000);
                 return;
             }

             const signupData = {
                email, 
                password,
                firstName,
                lastName,
                phone,
                ...(isB2B && {
                    companyName,
                    taxId,
                    activity,
                    city,
                    country,
                    storeName: storeName || companyName
                })
             };

             // Using apiClient to correctly hit Auth Service
             const response = await apiClient.post(
                `${apiClient.authUrl}/customers/signup`, 
                signupData,
                { requireAuth: false, headers }
             );
             
             if (isErrorObject(response)) {
                 throw new Error(getErrorMessage(response));
             }

             // Auto Login or Redirect to Login
             toast({
                 title: t('common.success', 'Success'),
                 description: t('auth.accountCreated', 'Account created successfully. Please login.'),
             });
             
             navigate({ pathname: '/login', search: window.location.search });

        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : t('common.authFailed', 'Signup Failed');
            toast({
                title: t('common.error', 'Error'),
                description: errorMessage,
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
                className="pt-12 pb-10 px-8 rounded-b-[3rem] shadow-lg mb-6 relative overflow-hidden transition-colors duration-500"
                style={{ backgroundColor: primaryColor || '#000000' }} 
            >
                <div className={`absolute inset-0 -z-10 ${!primaryColor ? 'bg-primary' : ''}`}></div>

                 <div className="relative z-10 flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-4 text-white border border-white/30 shadow-inner">
                        {logoUrl ? (
                            <img src={logoUrl} alt="Logo" className="w-full h-full object-contain p-2" />
                        ) : (
                            <ShoppingBag size={28} />
                        )}
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-1">
                        {t('auth.signup.title', 'Create Account')}
                    </h1>
                    {isRequestMode && (
                        <p className="text-white/80 text-sm mt-1">
                            {isRTL ? 'سيتم مراجعته من قبل صاحب المتجر' : 'Will be reviewed by store owner'}
                        </p>
                    )}
                 </div>
                 
                 {/* Decorative circles */}
                 <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
                 <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-10 -mb-10 blur-xl"></div>
            </div>

            {/* Signup Form */}
            <div className="flex-1 px-6 pb-20">
                <form onSubmit={handleSignup} className="space-y-4">
                    
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-gray-700 dark:text-gray-300 px-1">
                                {t('auth.firstName', 'First Name')}
                            </label>
                            <Input 
                                className={`h-12 bg-white dark:bg-gray-800 border-none shadow-sm rounded-xl text-sm`}
                                placeholder={t('auth.firstName', 'First Name')}
                                value={firstName} 
                                onChange={e => setFirstName(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-gray-700 dark:text-gray-300 px-1">
                                {t('auth.lastName', 'Last Name')}
                            </label>
                            <Input 
                                className={`h-12 bg-white dark:bg-gray-800 border-none shadow-sm rounded-xl text-sm`}
                                placeholder={t('auth.lastName', 'Last Name')} 
                                value={lastName} 
                                onChange={e => setLastName(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-700 dark:text-gray-300 px-1">
                            {t('auth.login.email', 'Email Address')}
                        </label>
                        <div className="relative">
                            <Mail className={`absolute ${isRTL ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4`} />
                            <Input 
                                className={`h-12 bg-white dark:bg-gray-800 border-none shadow-sm rounded-xl ${isRTL ? 'pr-10' : 'pl-10'} text-sm`}
                                placeholder="name@example.com" 
                                type="email" 
                                value={email} 
                                onChange={e => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-700 dark:text-gray-300 px-1">
                            {t('auth.phone', 'Phone Number')}
                        </label>
                        <div className="relative">
                            <Phone className={`absolute ${isRTL ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4`} />
                            <Input 
                                className={`h-12 bg-white dark:bg-gray-800 border-none shadow-sm rounded-xl ${isRTL ? 'pr-10' : 'pl-10'} text-sm`}
                                placeholder="05xxxxxxxx" 
                                type="tel" 
                                value={phone} 
                                onChange={e => setPhone(e.target.value)}
                                required={isB2B}
                            />
                        </div>
                    </div>

                    {/* B2B Section */}
                    {isB2B && (
                        <div className="pt-2 pb-2 space-y-4 animate-in fade-in slide-in-from-top-2">
                             <div className="flex items-center gap-2 px-1">
                                <Building2 size={16} className="text-muted-foreground" />
                                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                    {isRTL ? 'معلومات الشركة (B2B)' : 'Company Information (B2B)'}
                                </span>
                             </div>

                             <div className="space-y-1">
                                <label className="text-xs font-medium text-gray-700 dark:text-gray-300 px-1">{isRTL ? 'اسم الشركة *' : 'Company Name *'}</label>
                                <div className="relative">
                                    <Building2 className={`absolute ${isRTL ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4`} />
                                    <Input 
                                        className={`h-12 bg-white dark:bg-gray-800 border-none shadow-sm rounded-xl ${isRTL ? 'pr-10' : 'pl-10'} text-sm`}
                                        placeholder={isRTL ? 'اسم الشركة' : 'Company Name'} 
                                        value={companyName} 
                                        onChange={e => setCompanyName(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-medium text-gray-700 dark:text-gray-300 px-1">{isRTL ? 'الرقم الضريبي' : 'Tax ID (VAT)'}</label>
                                <div className="relative">
                                    <FileText className={`absolute ${isRTL ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4`} />
                                    <Input 
                                        className={`h-12 bg-white dark:bg-gray-800 border-none shadow-sm rounded-xl ${isRTL ? 'pr-10' : 'pl-10'} text-sm`}
                                        placeholder="300..." 
                                        value={taxId} 
                                        onChange={e => setTaxId(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-gray-700 dark:text-gray-300 px-1">{isRTL ? 'المدينة' : 'City'}</label>
                                    <div className="relative">
                                        <MapPin className={`absolute ${isRTL ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4`} />
                                        <Input 
                                            className={`h-12 bg-white dark:bg-gray-800 border-none shadow-sm rounded-xl ${isRTL ? 'pr-10' : 'pl-10'} text-sm`}
                                            placeholder={isRTL ? 'الرياض' : 'Riyadh'} 
                                            value={city} 
                                            onChange={e => setCity(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-gray-700 dark:text-gray-300 px-1">{isRTL ? 'الدولة' : 'Country'}</label>
                                    <div className="relative">
                                        <Globe className={`absolute ${isRTL ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4`} />
                                        <Input 
                                            className={`h-12 bg-white dark:bg-gray-800 border-none shadow-sm rounded-xl ${isRTL ? 'pr-10' : 'pl-10'} text-sm`}
                                            placeholder="SA" 
                                            value={country} 
                                            onChange={e => setCountry(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-medium text-gray-700 dark:text-gray-300 px-1">{isRTL ? 'نوع النشاط' : 'Activity Type'}</label>
                                <Input 
                                    className={`h-12 bg-white dark:bg-gray-800 border-none shadow-sm rounded-xl text-sm`}
                                    placeholder={isRTL ? 'تجارة الجملة...' : 'Wholesale...'} 
                                    value={activity} 
                                    onChange={e => setActivity(e.target.value)}
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-medium text-gray-700 dark:text-gray-300 px-1">{isRTL ? 'اسم المتجر (اختياري)' : 'Store Name (Optional)'}</label>
                                <Input 
                                    className={`h-12 bg-white dark:bg-gray-800 border-none shadow-sm rounded-xl text-sm`}
                                    placeholder={isRTL ? 'اسم المتجر' : 'Store Name'} 
                                    value={storeName} 
                                    onChange={e => setStoreName(e.target.value)}
                                />
                            </div>
                        </div>
                    )}

                    <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-700 dark:text-gray-300 px-1">
                            {t('auth.login.password', 'Password')}
                        </label>
                        <div className="relative">
                            <Lock className={`absolute ${isRTL ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4`} />
                            <Input 
                                className={`h-12 bg-white dark:bg-gray-800 border-none shadow-sm rounded-xl ${isRTL ? 'pr-10' : 'pl-10'} text-sm`}
                                placeholder="••••••••" 
                                type="password" 
                                value={password} 
                                onChange={e => setPassword(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                         <label className="text-xs font-medium text-gray-700 dark:text-gray-300 px-1">
                            {t('auth.confirmPassword', 'Confirm Password')}
                        </label>
                        <div className="relative">
                            <Lock className={`absolute ${isRTL ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4`} />
                            <Input 
                                className={`h-12 bg-white dark:bg-gray-800 border-none shadow-sm rounded-xl ${isRTL ? 'pr-10' : 'pl-10'} text-sm`}
                                placeholder="••••••••" 
                                type="password" 
                                value={confirmPassword} 
                                onChange={e => setConfirmPassword(e.target.value)}
                                required
                            />
                        </div>
                    </div>
                    
                    <Button 
                        className="w-full h-14 rounded-2xl text-lg font-bold shadow-lg mt-6 hover:scale-[1.02] transition-transform active:scale-[0.98]" 
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
                                <span>{isRequestMode ? (isRTL ? 'إرسال طلب التسجيل' : 'Submit Request') : (t('auth.signup.button', 'Sign Up'))}</span>
                                {isRTL ? <ArrowLeft size={20} /> : <ArrowRight size={20} />}
                            </div>
                        )}
                    </Button>
                </form>

                {/* Footer */}
                <div className="pt-6 text-center">
                     <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                        <span>{t('auth.signup.haveAccount', 'Already have an account?')}</span>
                        <Button 
                            variant="link" 
                            className="font-bold p-0 text-base" 
                            style={{ color: primaryColor }}
                            onClick={() => navigate({ pathname: '/login', search: window.location.search })}
                        >
                            {t('auth.signup.loginLink', 'Login')}
                        </Button>
                     </div>
                </div>
            </div>
        </div>
    );
}
