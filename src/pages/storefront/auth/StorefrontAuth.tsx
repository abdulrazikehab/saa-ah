import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/hooks/use-toast';
import { 
  Loader2, LogIn, Mail, Lock, Eye, EyeOff, 
  ShoppingBag, Sparkles, UserPlus, User, 
  Briefcase, ArrowRight, CheckCircle2, Shield,
  ArrowLeft, Building2, FileText, MapPin, Globe, Phone
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { apiClient } from '@/services/core/api-client';
import { coreApi } from '@/lib/api';
import { authService } from '@/services/auth.service';
import { getErrorMessage, isErrorObject } from '@/lib/error-utils';
import { getProfessionalErrorMessage } from '@/lib/toast-errors';
import { cn } from '@/lib/utils';
import { getTenantContext } from '@/lib/storefront-utils';
import { useAuth } from '@/contexts/AuthContext';

import { useStoreSettings } from '@/contexts/StoreSettingsContext';
import { SectionRenderer } from '@/components/builder/SectionRenderer';
import { Section } from '@/components/builder/PageBuilder';
import { Page } from '@/services/types';
import { Capacitor } from '@capacitor/core';
import MobileLogin from '@/pages/mobile/MobileLogin';
import MobileSignup from '@/pages/mobile/MobileSignup';
import { SiteConfig, UserProfile } from '@/services/types';

interface AppConfig {
  primaryColor?: string;
  secondaryColor?: string;
  backgroundColor?: string;
  logo?: string;
  [key: string]: unknown;
}


interface CustomerAuthResponse {
  token?: string;
  customer?: UserProfile & { 
    tenant?: { subdomain?: string };
    tenantSubdomain?: string;
  };
  requiresTwoFactor?: boolean;
  customerId?: string;
  verificationCodeSent?: boolean;
  verificationCode?: string;
  requiresApproval?: boolean;
  message?: string;
}

interface CustomerVerifyResponse {
  valid: boolean;
  token?: string;
  customer?: UserProfile & { 
    tenant?: { subdomain?: string };
    tenantSubdomain?: string;
  };
  message?: string;
}

interface SignupResponse {
  requiresApproval?: boolean;
  message?: string;
  verificationCodeSent?: boolean;
  verificationCode?: string;
  token?: string;
}

interface SiteConfigData {
  config?: AppConfig;
  settings?: Record<string, unknown>;
  [key: string]: unknown;
}

export default function StorefrontAuth() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { login: merchantLogin } = useAuth();
  // Get store settings - handle gracefully if loading or not available
  const storeSettings = useStoreSettings();
  const settings = storeSettings?.settings || null;
  
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>(location.pathname.includes('signup') ? 'signup' : 'login');
  const [loginType, setLoginType] = useState<'customer' | 'employee'>('customer');
  const hasCheckedAuth = useRef(false);
  const isNativeMode = Capacitor.isNativePlatform() || window.location.href.includes('platform=mobile');
  const [appConfig, setAppConfig] = useState<AppConfig | null>(null);

  const [customPage, setCustomPage] = useState<Page | null>(null);

  useEffect(() => {
    if (isNativeMode) {
      coreApi.get<SiteConfigData>('/site-config').then(res => setAppConfig(res.config || res)).catch(console.error);
    }
  }, [isNativeMode]);

  // Fetch custom auth page on mount or tab change
  useEffect(() => {
    const fetchCustomPage = async () => {
      try {
        const slug = activeTab === 'signup' ? 'signup' : 'login';
        const authPage = await coreApi.getPageBySlug(slug);
        if (authPage && authPage.isPublished && 
            authPage.content?.sections && 
            Array.isArray(authPage.content.sections) && 
            authPage.content.sections.length > 0) {
          setCustomPage(authPage);
        } else {
          setCustomPage(null);
        }
      } catch (e) {
        // No custom page found, continue with default layout
        setCustomPage(null);
      }
    };
    fetchCustomPage();
  }, [activeTab]);


  // Redirect if already authenticated - only check once on mount
  useEffect(() => {
    // Only check once, prevent infinite loops
    if (hasCheckedAuth.current) {
      return;
    }
    
    // Prevent infinite loops - only check if we're actually on login page
    const currentPath = location.pathname;
    const isAuthPage = currentPath === '/login' || currentPath === '/auth/login' || 
                       currentPath === '/signup' || currentPath === '/auth/signup';
    
    if (!isAuthPage) {
      return; // Don't run redirect logic if we're not on auth pages
    }

    // Mark as checked immediately to prevent re-running
    hasCheckedAuth.current = true;

    // Only check once, don't create intervals that could cause loops
    const checkAndRedirect = () => {
      // Check if customer is already logged in
      if (loginType === 'customer') {
        const customerToken = localStorage.getItem('customerToken');
        const customerDataRaw = localStorage.getItem('customerData');
        
        if (customerToken && customerDataRaw) {
          try {
            const customerData = JSON.parse(customerDataRaw);
            const tenantContext = getTenantContext();
            const currentSubdomain = tenantContext.subdomain;
            
            // Verify if the stored session matches the current store context
            // Sessions on localhost are shared across subdomains, so we must check
            const sessionSubdomain = customerData.tenantSubdomain || customerData.tenant?.subdomain;
            const sessionTenantId = customerData.tenantId;
            
            // If we are in a specific subdomain context and the session is for a DIFFERENT subdomain, clear it
            if (currentSubdomain && sessionSubdomain && currentSubdomain !== sessionSubdomain) {
              console.warn(`[Auth] Session mismatch: current store is "${currentSubdomain}", but session is for "${sessionSubdomain}". Clearing session.`);
              localStorage.removeItem('customerToken');
              localStorage.removeItem('customerData');
              return;
            }

            // Also check against settings if available
            if (settings?.subdomain && sessionSubdomain && settings.subdomain !== sessionSubdomain) {
                console.warn(`[Auth] Settings mismatch: current store is "${settings.subdomain}", but session is for "${sessionSubdomain}". Clearing session.`);
                localStorage.removeItem('customerToken');
                localStorage.removeItem('customerData');
                return;
            }

            // Customer is already logged in, redirect to home or intended destination
            const searchParams = new URLSearchParams(window.location.search);
            const queryReturnTo = searchParams.get('returnTo');
            const stateReturnTo = (location.state as { from?: { pathname: string } })?.from?.pathname;
            
            const from = queryReturnTo || stateReturnTo || '/';
            
            // Only redirect if we're not already going there and it's a valid path
            if (from && from !== currentPath && (from.startsWith('/') || from.startsWith('http'))) {
              navigate(from, { replace: true });
              return; // Exit after navigation
            }
          } catch (e) {
            console.error('[Auth] Failed to parse customer data:', e);
            localStorage.removeItem('customerToken');
            localStorage.removeItem('customerData');
          }
        }
      } else {
        // Check if merchant/employee is already logged in
        const accessToken = localStorage.getItem('accessToken');
        if (accessToken) {
          navigate('/dashboard', { replace: true });
          return; // Exit after navigation
        }
      }
    };
    
    // Only check once on mount, not continuously
    checkAndRedirect();
    
    // Listen for storage changes to catch login in other tabs/windows only
    const handleStorageChange = (e: StorageEvent) => {
      // Only react to storage changes from other tabs, not current tab
      if (e.key === 'customerToken' || e.key === 'customerData' || e.key === 'accessToken') {
        // Double check we're still on login page before redirecting
        if (window.location.pathname === currentPath && !hasCheckedAuth.current) {
          hasCheckedAuth.current = true;
          checkAndRedirect();
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [location.pathname, location.state, loginType, navigate, settings?.subdomain]); 
  
  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  
  // B2B fields
  const [companyName, setCompanyName] = useState('');
  const [taxId, setTaxId] = useState('');
  const [activity, setActivity] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('SA');
  const [storeName, setStoreName] = useState('');
  const [isRequestMode, setIsRequestMode] = useState(false);
  const [requestSubmitted, setRequestSubmitted] = useState(false);

  // Check if B2B mode or private store mode
  const isB2B = settings?.businessModel === 'B2B';
  const isPrivateStore = settings?.isPrivateStore === true;

  // Determine if registration should be a request
  useEffect(() => {
    const shouldUseRequest = isPrivateStore || (isB2B && settings?.customerRegistrationRequestEnabled === true);
    setIsRequestMode(shouldUseRequest);
  }, [isPrivateStore, isB2B, settings?.customerRegistrationRequestEnabled]);

  // OTP states
  const [verificationSent, setVerificationSent] = useState(false);
  const [otp, setOtp] = useState('');
  
  // 2FA states
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false);
  const [pendingCustomerId, setPendingCustomerId] = useState<string | null>(null);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Debug state
  useEffect(() => {
    console.log('🔐 StorefrontAuth State:', {
      loginType,
      activeTab,
      isPrivateStore,
      isB2B,
      isRequestMode,
      verificationSent
    });
  }, [loginType, activeTab, isPrivateStore, isB2B, isRequestMode, verificationSent]);

  // If custom page with sections exists, render it
  if (customPage && customPage.content?.sections && Array.isArray(customPage.content.sections)) {
    const sections = customPage.content.sections as Section[];
    return (
      <div className="min-h-screen bg-background">
        {sections.map((section, index) => (
          <SectionRenderer key={section.id || `section-${index}`} section={section} />
        ))}
      </div>
    );
  }

  if (isNativeMode) {
    if (location.pathname.includes('signup')) {
      return <MobileSignup />;
    }
    return <MobileLogin />;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (loginType === 'customer') {
        // Customer Login
        const tenantContext = getTenantContext();
        const headers: Record<string, string> = {};
        if (tenantContext.subdomain) {
          headers['X-Tenant-Domain'] = tenantContext.domain;
        }
        
        const response = await apiClient.post<CustomerAuthResponse>(
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
        
        // Check if 2FA is required
        if (response.requiresTwoFactor && response.customerId) {
          setRequiresTwoFactor(true);
          setPendingCustomerId(response.customerId);
          toast({
            title: isRTL ? 'التحقق بخطوتين مطلوب' : 'Two-Factor Authentication Required',
            description: isRTL ? 'يرجى إدخال الرمز من تطبيق المصادقة الخاص بك' : 'Please enter the code from your authenticator app',
          });
          setLoading(false);
          return;
        }
        
        localStorage.setItem('customerToken', String(response.token || ''));
        if (response.customer) {
          localStorage.setItem('customerData', JSON.stringify(response.customer));
        }
        
        // Dispatch custom event to notify other components (like CustomerProtectedRoute)
        // that login was successful in the same tab
        window.dispatchEvent(new CustomEvent('customerLogin', { 
          detail: { token: response.token, customer: response.customer } 
        }));
        
        toast({
          title: isRTL ? 'تم تسجيل الدخول بنجاح' : 'Login successful',
          description: isRTL ? 'مرحباً بك في متجرنا' : 'Welcome back!',
        });
        
        // Immediately navigate after setting tokens
        const searchParams = new URLSearchParams(window.location.search);
        const queryReturnTo = searchParams.get('returnTo');
        const stateReturnTo = (location.state as { from?: { pathname: string } })?.from?.pathname;
        const from = queryReturnTo || stateReturnTo || '/';
        
        navigate(from, { replace: true });
      } else {
        // Employee/Merchant Login
        const mustChangePassword = await merchantLogin(email, password);
        if (mustChangePassword) {
          // Redirect to password change page if first login
          toast({
            title: isRTL ? 'تم تسجيل الدخول' : 'Login successful',
            description: isRTL ? 'يرجى تغيير كلمة المرور للمتابعة' : 'Please change your password to continue',
          });
          navigate('/change-password', { replace: true });
        } else {
          toast({
            title: isRTL ? 'تم تسجيل الدخول بنجاح' : 'Login successful',
            description: isRTL ? 'مرحباً بك في لوحة التحكم' : 'Welcome to the dashboard!',
          });
          setTimeout(() => navigate('/dashboard'), 1000);
        }
      }
    } catch (error: unknown) {
      const { title, description } = getProfessionalErrorMessage(
        error,
        { 
          operation: isRTL ? 'تسجيل الدخول' : 'login', 
          resource: loginType === 'customer' 
            ? (isRTL ? 'كعميل' : 'as customer') 
            : (isRTL ? 'كموظف' : 'as employee') 
        },
        isRTL
      );
      
      toast({
        variant: 'destructive',
        title,
        description,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTwoFactorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingCustomerId || !twoFactorCode) return;

    setLoading(true);
    try {
      const response = await authService.verifyCustomerLogin2FA(pendingCustomerId, twoFactorCode);
      
      // Store token and customer data
      localStorage.setItem('customerToken', String(response.token));
      if (response.customer) {
        localStorage.setItem('customerData', JSON.stringify(response.customer));
      }
      
      // Dispatch custom event
      window.dispatchEvent(new CustomEvent('customerLogin', { 
        detail: { token: response.token, customer: response.customer } 
      }));
      
      toast({
        title: isRTL ? 'تم التحقق بنجاح' : 'Verification successful',
        description: isRTL ? 'مرحباً بك من جديد' : 'Welcome back!',
      });

      // Navigate after successful 2FA - ensure we don't redirect to login/auth pages
      const from = (location.state as { from?: { pathname: string } })?.from?.pathname;
      // If from is a login/auth page or undefined, go to home instead
      const redirectPath = from && 
        !from.includes('/login') && 
        !from.includes('/auth/login') && 
        !from.includes('/signup') && 
        !from.includes('/auth/signup')
        ? from 
        : '/';
      
      // Use setTimeout to ensure state is updated before navigation
      setTimeout(() => {
        navigate(redirectPath, { replace: true });
      }, 100);
    } catch (error: unknown) {
      console.error('2FA verification failed:', error);
      const { title, description } = getProfessionalErrorMessage(
        error,
        { operation: isRTL ? 'التحقق' : 'verify', resource: isRTL ? 'رمز التحقق' : 'verification code' },
        isRTL
      );
      toast({
        variant: 'destructive',
        title,
        description,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate password matching
    if (password !== confirmPassword) {
      toast({
        variant: 'destructive',
        title: isRTL ? 'خطأ في كلمة المرور' : 'Password Error',
        description: isRTL ? 'كلمات المرور غير متطابقة' : 'Passwords do not match',
      });
      return;
    }

    // Validate B2B fields if in B2B mode
    if (isB2B) {
      if (!companyName.trim()) {
        toast({
          variant: 'destructive',
          title: isRTL ? 'حقل مطلوب' : 'Required Field',
          description: isRTL ? 'يرجى إدخال اسم الشركة' : 'Please enter company name',
        });
        return;
      }
    }

    setLoading(true);
    
    try {
      const tenantContext = getTenantContext();
      
      // If it's a request mode (private store or B2B with requests enabled), create a registration request
      if (isRequestMode) {
        // Create registration request
        const requestData = {
          email,
          password,
          fullName: `${firstName} ${lastName}`.trim() || email.split('@')[0],
          phone: phone || undefined,
          ...(isB2B ? {
            companyName,
            storeName: storeName || companyName,
            activity,
            city,
            country
          } : {})
        };

        const response = await coreApi.post<{ success: boolean; message?: string }>('/customer-registration-requests', requestData, { requireAuth: false });
        
        setRequestSubmitted(true);
        toast({
          title: isRTL ? 'تم إرسال الطلب' : 'Request Submitted',
          description: isRTL 
            ? 'تم إرسال طلب التسجيل بنجاح. سيتم مراجعته من قبل صاحب المتجر وإشعارك بالنتيجة عبر البريد الإلكتروني.'
            : 'Your registration request has been submitted. It will be reviewed by the store owner and you will be notified via email.',
        });
        
        return;
      }

      // Regular signup flow
      const headers: Record<string, string> = {};
      if (tenantContext.subdomain) {
        headers['X-Tenant-Domain'] = tenantContext.domain;
      }
      
      interface SignupResponse {
        requiresApproval?: boolean;
        message?: string;
        verificationCodeSent?: boolean;
        verificationCode?: string;
        token?: string;
      }

      const signupData = {
        email, 
        password,
        firstName,
        lastName,
        phone,
        ...(isB2B ? {
          companyName,
          storeName: storeName || companyName,
          activity,
          city,
          country
        } : {})
      };

      const response = await apiClient.post<SignupResponse>(
        `${apiClient.authUrl}/customers/signup`, 
        signupData,
        { 
          requireAuth: false,
          headers,
        }
      );
      
      if (isErrorObject(response)) {
        throw new Error(getErrorMessage(response));
      }
      
      // Check if it's a request-based response
      if (response.requiresApproval) {
        setRequestSubmitted(true);
        toast({
          title: isRTL ? 'تم إرسال الطلب' : 'Request Submitted',
          description: response.message || (isRTL 
            ? 'تم إرسال طلب التسجيل بنجاح. سيتم مراجعته من قبل صاحب المتجر وإشعارك بالنتيجة عبر البريد الإلكتروني.'
            : 'Your registration request has been submitted. It will be reviewed by the store owner and you will be notified via email.'),
        });
        return;
      }

      // Check if verification code was sent
      if (response.verificationCodeSent) {
        setVerificationSent(true);
        toast({
          title: isRTL ? 'تم إرسال رمز التحقق' : 'Verification code sent',
          description: isRTL ? `تم إرسال رمز التحقق إلى ${email}` : `A verification code has been sent to ${email}`,
        });

        // In development, show the code in toast for convenience
        if (response.verificationCode) {
          console.log('Verification Code:', response.verificationCode);
          toast({
            title: "Development Mode",
            description: `Code: ${response.verificationCode}`,
            duration: 10000,
          });
        }
      } else {
        // Fallback for unexpected success without verification (shouldn't happen with current backend)
        toast({
          title: isRTL ? 'تم إنشاء الحساب بنجاح' : 'Account created successfully',
          description: isRTL ? 'يرجى تسجيل الدخول' : 'Please sign in',
        });
        setActiveTab('login');
      }
      
    } catch (error: unknown) {
      const { title, description } = getProfessionalErrorMessage(
        error,
        { operation: isRTL ? 'إنشاء الحساب' : 'signup', resource: isRTL ? 'كعميل' : 'as customer' },
        isRTL
      );
      
      toast({
        variant: 'destructive',
        title,
        description,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await apiClient.post<CustomerVerifyResponse>(
        `${apiClient.authUrl}/customers/verify`, 
        { email, code: otp },
        { requireAuth: false }
      );

      if (isErrorObject(response)) {
        throw new Error(getErrorMessage(response));
      }

      if (response.valid) {
        localStorage.setItem('customerToken', String(response.token || ''));
        if (response.customer) {
          localStorage.setItem('customerData', JSON.stringify(response.customer));
        }

        // Dispatch custom event to notify other components (like CustomerProtectedRoute)
        // that login was successful in the same tab
        window.dispatchEvent(new CustomEvent('customerLogin', { 
          detail: { token: response.token, customer: response.customer } 
        }));

        // Check if we need to redirect to correct subdomain
        const customerTenantSubdomain = response.customer?.tenant?.subdomain;
        if (customerTenantSubdomain) {
          const currentHost = window.location.host;
          const currentHostname = window.location.hostname;
          const protocol = window.location.protocol;
          
          console.log('🔍 OTP Verification - Subdomain Check:', {
            customerTenantSubdomain,
            currentHost,
            currentHostname,
            customerData: response.customer
          });
          
          // Extract current subdomain from hostname
          let currentSubdomain = '';
          if (currentHostname.includes('.localhost')) {
            currentSubdomain = currentHostname.split('.localhost')[0];
          } else if (currentHostname.includes('.')) {
            const parts = currentHostname.split('.');
            // For subdomain.domain.com, first part is subdomain
            if (parts.length > 2) {
              currentSubdomain = parts[0];
            }
          }
          
          // Check if we are already on the correct subdomain
          const targetSubdomain = (customerTenantSubdomain || '').toLowerCase().trim();
          const currentSubdomainLower = currentSubdomain.toLowerCase();
          const currentHostnameLower = window.location.hostname.toLowerCase();
          
          // Define what constitutes the "default" tenant (kawn or default)
          const isDefaultTenant = targetSubdomain === 'kawn' || targetSubdomain === 'default';
          
          // Define what constitutes the "main" domain (no subdomain) on localhost/dev
          const isMainLocalhost = currentHostnameLower === 'localhost' || currentHostnameLower === '127.0.0.1';
          
          // Check if we are already on the correct subdomain
          // 1. Current subdomain matches target (e.g. asus1 === asus1)
          const isSubdomainMatch = currentSubdomainLower === targetSubdomain;
          
          // 2. Special case: We are on main localhost and tenant is default/kawn
          const isDefaultOnMain = isMainLocalhost && isDefaultTenant;

          console.log('🔍 Subdomain Redirect Check:', {
            targetSubdomain,
            currentSubdomain: currentSubdomainLower,
            isSubdomainMatch,
            isDefaultOnMain,
            currentHostname
          });

          // Only redirect if NOT a match
          // Update: We WANT to redirect to subdomain even for default tenant if we are on main localhost,
          // because main localhost is Admin App.
          
          // Special check: If we are on a specific subdomain (e.g. asus1) and the backend returns 
          // the default tenant (kawn), we should STAY on the specific subdomain.
          // This handles cases where the backend might default to 'kawn' but the user is interacting with a specific store.
          const isOnSpecificSubdomain = currentSubdomainLower !== '' && currentSubdomainLower !== 'www';
          const shouldStayOnCurrent = isOnSpecificSubdomain && isDefaultTenant;

          if (!isSubdomainMatch && !shouldStayOnCurrent) {
            console.log(`🔄 Redirecting from ${currentSubdomainLower} to ${targetSubdomain}`);
            
            // We need to redirect to the correct subdomain
            let newHost = '';
            if (currentHost.includes('localhost') || currentHost.includes('127.0.0.1')) {
              // Dev environment
              const port = currentHost.includes(':') ? currentHost.split(':')[1] : '8080';
              newHost = `${targetSubdomain}.localhost:${port}`;
            } else {
              // Production - extract base domain
              const hostParts = currentHostname.split('.');
              if (hostParts.length >= 2) {
                // Remove the first part (current subdomain) and keep the rest
                const baseDomain = hostParts.slice(1).join('.');
                newHost = `${targetSubdomain}.${baseDomain}`;
                // Preserve port if exists
                if (currentHost.includes(':')) {
                  const port = currentHost.split(':')[1];
                  newHost = `${newHost}:${port}`;
                }
              } else {
                // Fallback
                newHost = `${targetSubdomain}.${currentHostname}`;
              }
            }
            
            console.log(`🚀 Redirecting to: ${protocol}//${newHost}/login`);
            
            toast({
              title: isRTL ? 'تم التحقق بنجاح' : 'Verification successful',
              description: isRTL ? `جاري إعادة التوجيه إلى ${targetSubdomain}...` : `Redirecting to ${targetSubdomain}...`,
            });
            
            // Redirect to login page on the correct subdomain
            setTimeout(() => {
              window.location.href = `${protocol}//${newHost}/login`;
            }, 500);
            return;
          } else {
            console.log('✅ Already on correct subdomain or allowed default override, no redirect needed');
          }
        } else {
          console.warn('⚠️ No tenant subdomain in customer response:', response.customer);
        }

        toast({
          title: isRTL ? 'تم التحقق بنجاح' : 'Verification successful',
          description: isRTL ? 'تم إنشاء حسابك وتسجيل الدخول' : 'Your account has been created and you are now logged in',
        });

        setTimeout(() => navigate('/'), 1000);
      } else {
        throw new Error(response.message || 'Verification failed');
      }
    } catch (error: unknown) {
      toast({
        variant: 'destructive',
        title: isRTL ? 'فشل التحقق' : 'Verification failed',
        description: getErrorMessage(error),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setLoading(true);
    try {
      const response = await apiClient.post<{ verificationCode?: string }>(
        `${apiClient.authUrl}/customers/resend-verification-code`,
        { email },
        { requireAuth: false }
      );

      if (isErrorObject(response)) {
        throw new Error(getErrorMessage(response));
      }

      toast({
        title: isRTL ? 'تم إعادة إرسال الرمز' : 'Code resent',
        description: isRTL ? 'تم إرسال رمز جديد إلى بريدك الإلكتروني' : 'A new code has been sent to your email',
      });

      if (response.verificationCode) {
        console.log('Verification Code:', response.verificationCode);
        toast({
          title: "Development Mode",
          description: `Code: ${response.verificationCode}`,
          duration: 10000,
        });
      }
    } catch (error: unknown) {
      toast({
        variant: 'destructive',
        title: isRTL ? 'فشل إرسال الرمز' : 'Failed to resend code',
        description: getErrorMessage(error),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background bg-gradient-to-br from-background to-primary/10 dark:from-primary/20 dark:to-background relative overflow-hidden transition-colors duration-500">
      {/* Background Decorations */}
      {!isNativeMode && (
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[120px] animate-pulse-slow" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-secondary/5 blur-[120px] animate-pulse-slow" style={{ animationDelay: '2s' }} />
      </div>
      )}

      <div className="w-full max-w-md space-y-8 animate-fade-in">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-24 h-24 mb-4 rounded-3xl gradient-primary shadow-xl animate-bounce-subtle overflow-hidden relative border border-white/20">
            {settings?.logo ? (
              <div className="w-full h-full bg-white flex items-center justify-center">
                 <img 
                   src={(isNativeMode && appConfig?.logo ? appConfig.logo : settings.logo) as string} 
                   alt={(isRTL ? settings?.brandNameAr : settings?.brandNameEn) as string} 
                   className="w-full h-full object-contain p-2" 
                 />
              </div>
            ) : (
              <ShoppingBag className="h-10 w-10 text-white" />
            )}
          </div>

          {(settings?.brandNameAr || settings?.brandNameEn) && (
            <div className="mb-4">
               <h2 className="text-xl font-bold font-heading">
                  {(isRTL ? (settings.brandNameAr || settings.brandNameEn) : (settings.brandNameEn || settings.brandNameAr)) as string}
               </h2>
            </div>
          )}

          <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
            {requiresTwoFactor
              ? (isRTL ? 'التحقق بخطوتين' : 'Two-Factor Auth')
              : verificationSent 
                ? (isRTL ? 'تأكيد الحساب' : 'Verify Email')
                : loginType === 'employee'
                  ? (isRTL ? 'دخول الموظفين' : 'Employee Login')
                  : activeTab === 'login' 
                    ? (isRTL ? 'تسجيل الدخول' : 'Welcome Back')
                    : (isRequestMode 
                        ? (isPrivateStore 
                            ? (isRTL ? 'طلب الوصول للمتجر' : 'Request Access') 
                            : (isRTL ? 'طلب إنشاء حساب' : 'Request Account'))
                        : (isRTL ? 'إنشاء حساب جديد' : 'Create Account'))
            }
          </h1>
          <p className="text-muted-foreground max-w-[340px] mx-auto text-sm font-medium leading-relaxed">
            {requiresTwoFactor
              ? (isRTL ? 'أدخل رمز التحقق من تطبيق المصادقة' : 'Enter the code from your authenticator app')
              : verificationSent
                ? (isRTL ? `أدخل الرمز المرسل إلى ${email}` : `Enter the code sent to ${email}`)
                : loginType === 'employee'
                  ? (isRTL ? 'سجل دخولك للوصول إلى لوحة التحكم' : 'Sign in to access the dashboard')
                  : activeTab === 'login'
                    ? (isRTL ? 'سجل دخولك للمتابعة مع طلبك' : 'Sign in to manage your account and orders')
                    : (isRequestMode 
                        ? (isRTL ? 'سيتم مراجعة طلبك من قبل صاحب المتجر' : 'Your registration request will be reviewed by the store owner')
                        : (isRTL ? 'انضم إلينا اليوم للحصول على تجربة تسوق فريدة' : 'Join us today for an exclusive shopping experience'))
            }
          </p>
        </div>

        <Card className="border-border/50 shadow-2xl glass-effect-strong overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 gradient-aurora animate-gradient bg-[length:200%_auto]" />
          
          {requiresTwoFactor ? (
            <CardContent className="pt-8 pb-8 space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <form onSubmit={handleTwoFactorSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="twoFactorCode" className="text-sm font-semibold">
                    {isRTL ? 'رمز التحقق (TOTP)' : 'Verification Code (TOTP)'}
                  </Label>
                  <div className="relative group">
                    <Shield className={cn(
                      "absolute top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors",
                      isRTL ? "right-4" : "left-4"
                    )} />
                    <Input
                      id="twoFactorCode"
                      type="text"
                      placeholder={isRTL ? '000000' : '000000'}
                      value={twoFactorCode}
                      onChange={(e) => setTwoFactorCode(e.target.value.replace(/[^0-9]/g, ''))}
                      maxLength={6}
                      required
                      className={cn(
                        "h-12 text-base rounded-xl border-2 border-border/50 bg-background focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all text-center text-2xl tracking-widest",
                        isRTL ? "pr-12" : "pl-12"
                      )}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    {isRTL ? 'أدخل الرمز المكون من 6 أرقام من تطبيق Google Authenticator' : 'Enter the 6-digit code from your Google Authenticator app'}
                  </p>
                </div>

                <Button 
                  type="submit" 
                  className={cn("w-full h-12 text-base font-semibold rounded-xl text-white shadow-lg hover:shadow-glow transition-all", !isNativeMode && "gradient-primary")}
                  style={{ backgroundColor: (isNativeMode && appConfig?.primaryColor ? appConfig.primaryColor : undefined) as React.CSSProperties['backgroundColor'] }}
                  disabled={loading || twoFactorCode.length !== 6}
                >
                  {loading ? (
                    <>
                      <Loader2 className="ml-2 h-5 w-5 animate-spin" />
                      <span>{isRTL ? 'جاري التحقق...' : 'Verifying...'}</span>
                    </>
                  ) : (
                    <>
                      <Shield className="ml-2 h-5 w-5" />
                      <span>{isRTL ? 'التحقق' : 'Verify'}</span>
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setRequiresTwoFactor(false);
                    setTwoFactorCode('');
                    setPendingCustomerId(null);
                  }}
                  className="w-full"
                >
                  {isRTL ? 'العودة إلى تسجيل الدخول' : 'Back to Login'}
                </Button>
              </form>
            </CardContent>
          ) : verificationSent ? (
            <CardContent className="pt-8 pb-8 space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex flex-col items-center justify-center space-y-6">
                <div className="space-y-2 text-center">
                  <InputOTP
                    maxLength={6}
                    value={otp}
                    onChange={(value) => setOtp(value)}
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                  <p className="text-xs text-muted-foreground mt-2">
                    {isRTL ? 'أدخل الرمز المكون من 6 أرقام' : 'Enter the 6-digit code'}
                  </p>
                </div>

                <div className="flex flex-col w-full gap-3">
                  <Button 
                    onClick={handleVerify}
                    className={cn("w-full h-12 text-base font-semibold rounded-xl text-white shadow-lg hover:shadow-glow transition-all", !isNativeMode && "gradient-primary")}
                    style={{ backgroundColor: (isNativeMode && appConfig?.primaryColor ? appConfig.primaryColor : undefined) as React.CSSProperties['backgroundColor'] }}
                    disabled={loading || otp.length !== 6}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="ml-2 h-5 w-5 animate-spin" />
                        <span>{isRTL ? 'جاري التحقق...' : 'Verifying...'}</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="ml-2 h-5 w-5" />
                        <span>{isRTL ? 'تحقق' : 'Verify'}</span>
                      </>
                    )}
                  </Button>

                  <Button
                    variant="ghost"
                    onClick={handleResendCode}
                    disabled={loading}
                    className="w-full"
                  >
                    {isRTL ? 'إعادة إرسال الرمز' : 'Resend Code'}
                  </Button>

                  <Button
                    variant="link"
                    onClick={() => setVerificationSent(false)}
                    className="w-full text-muted-foreground"
                  >
                    <ArrowLeft className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />
                    {isRTL ? 'العودة' : 'Back'}
                  </Button>
                </div>
              </div>
            </CardContent>
          ) : loginType === 'employee' ? (
            <CardContent className="pt-8 pb-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">{isRTL ? 'البريد الإلكتروني' : 'Email'}</Label>
                  <div className="relative group">
                    <Mail className={cn(
                      "absolute top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors",
                      isRTL ? "right-4" : "left-4"
                    )} />
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className={cn(
                        "h-12 rounded-xl border-2 border-border/50 bg-background/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all",
                        isRTL ? "pr-12" : "pl-12"
                      )}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">{isRTL ? 'كلمة المرور' : 'Password'}</Label>
                    <Link to="/forgot-password" className="text-xs text-primary hover:underline">
                      {isRTL ? 'نسيت كلمة المرور؟' : 'Forgot password?'}
                    </Link>
                  </div>
                  <div className="relative group">
                    <Lock className={cn(
                      "absolute top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors",
                      isRTL ? "right-4" : "left-4"
                    )} />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className={cn(
                        "h-12 rounded-xl border-2 border-border/50 bg-background/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all",
                        isRTL ? "pr-12 pl-12" : "pl-12 pr-12"
                      )}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className={cn(
                        "absolute top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors",
                        isRTL ? "left-4" : "right-4"
                      )}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className={cn("w-full h-12 text-base font-semibold rounded-xl text-white shadow-lg hover:shadow-glow transition-all mt-2", !isNativeMode && "gradient-primary")}
                  style={{ backgroundColor: isNativeMode && appConfig?.primaryColor ? appConfig.primaryColor : undefined }}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="ml-2 h-5 w-5 animate-spin" />
                      <span>{isRTL ? 'جاري تسجيل الدخول...' : 'Signing in...'}</span>
                    </>
                  ) : (
                    <>
                      <Briefcase className="ml-2 h-5 w-5" />
                      <span>{isRTL ? 'دخول الموظفين' : 'Employee Login'}</span>
                      <ArrowRight className="mr-2 h-5 w-5" />
                    </>
                  )}
                </Button>
              </form>

              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  {isRTL ? 'أو' : 'Or'}
                </span>
              </div>

              <Button
                variant="outline"
                onClick={() => setLoginType('customer')}
                className="w-full h-11 rounded-xl border-2 border-border/50 hover:bg-muted/50"
              >
                <User className="mr-2 h-4 w-4" />
                {isRTL ? 'تسجيل دخول العملاء' : 'Customer Login'}
              </Button>
            </CardContent>
          ) : (
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'login' | 'signup')} className="w-full">
              {/* Show registration tab if registration is allowed (directly or via request) */}
              <TabsList className="grid w-full grid-cols-2 h-14 p-1 bg-muted/50 rounded-none border-b border-border/50 sticky top-0 z-10">
                <TabsTrigger 
                  value="login" 
                  className="rounded-none data-[state=active]:bg-background data-[state=active]:shadow-none font-bold transition-all h-full"
                >
                  {isRTL ? 'تسجيل الدخول' : 'Login'}
                </TabsTrigger>
                <TabsTrigger 
                  value="signup" 
                  className="rounded-none data-[state=active]:bg-background data-[state=active]:shadow-none font-bold transition-all h-full"
                >
                  {isRequestMode 
                    ? (isPrivateStore 
                        ? (isRTL ? 'طلب وصول' : 'Request Access')
                        : (isRTL ? 'طلب حساب' : 'Request Account'))
                    : (isRTL ? 'إنشاء حساب' : 'Sign Up')}
                </TabsTrigger>
              </TabsList>

              <CardContent className="pt-6">
                <TabsContent value="login" className="space-y-6 mt-0 animate-in fade-in slide-in-from-bottom-4 duration-300">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">{isRTL ? 'البريد الإلكتروني' : 'Email'}</Label>
                      <div className="relative group">
                        <Mail className={cn(
                          "absolute top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors",
                          isRTL ? "right-4" : "left-4"
                        )} />
                        <Input
                          id="email"
                          type="email"
                          placeholder="name@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          className={cn(
                            "h-12 rounded-xl border-2 border-border/50 bg-background/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all",
                            isRTL ? "pr-12" : "pl-12"
                          )}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="password">{isRTL ? 'كلمة المرور' : 'Password'}</Label>
                        <Link to="/forgot-password" className={cn("text-xs hover:underline", !isNativeMode && "text-primary")} style={{ color: isNativeMode && appConfig?.primaryColor ? appConfig.primaryColor : undefined }}>
                          {isRTL ? 'نسيت كلمة المرور؟' : 'Forgot password?'}
                        </Link>
                      </div>
                      <div className="relative group">
                        <Lock className={cn(
                          "absolute top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors",
                          isRTL ? "right-4" : "left-4"
                        )} />
                        <Input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          className={cn(
                            "h-12 rounded-xl border-2 border-border/50 bg-background/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all",
                            isRTL ? "pr-12 pl-12" : "pl-12 pr-12"
                          )}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className={cn(
                            "absolute top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors",
                            isRTL ? "left-4" : "right-4"
                          )}
                        >
                          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                    </div>

                    <Button 
                      type="submit" 
                      className={cn("w-full h-12 text-base font-semibold rounded-xl text-white shadow-lg hover:shadow-glow transition-all mt-2", !isNativeMode && "gradient-primary")}
                      style={{ backgroundColor: isNativeMode && appConfig?.primaryColor ? appConfig.primaryColor : undefined }}
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="ml-2 h-5 w-5 animate-spin" />
                          <span>{isRTL ? 'جاري تسجيل الدخول...' : 'Signing in...'}</span>
                        </>
                      ) : (
                        <>
                          <LogIn className="ml-2 h-5 w-5" />
                          <span>{isRTL ? 'تسجيل الدخول' : 'Sign In'}</span>
                          <ArrowRight className="mr-2 h-5 w-5" />
                        </>
                      )}
                    </Button>
                  </form>

                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      {isRTL ? 'أو' : 'Or'}
                    </span>
                  </div>

                  {/* Signup/Request Account Button - Always visible */}
                  {!settings?.isPrivateStore && (
                    <Button
                      variant="outline"
                      onClick={() => setActiveTab('signup')}
                      className="w-full h-12 rounded-xl border-2 border-primary/30 hover:border-primary hover:bg-primary/5 font-semibold group transition-all"
                    >
                      <UserPlus className={cn("h-5 w-5 text-primary group-hover:scale-110 transition-transform", isRTL ? "ml-2" : "mr-2")} />
                      {settings?.businessModel === 'B2B' && settings?.customerRegistrationRequestEnabled
                        ? (isRTL ? 'طلب إنشاء حساب جديد' : 'Request New Account')
                        : (isRTL ? 'إنشاء حساب جديد' : 'Create New Account')
                      }
                    </Button>
                  )}

                  {/* For private stores, show request access button */}
                  {settings?.isPrivateStore && (
                    <Button
                      variant="outline"
                      onClick={() => setActiveTab('signup')}
                      className="w-full h-12 rounded-xl border-2 border-amber-500/30 hover:border-amber-500 hover:bg-amber-500/5 font-semibold group transition-all"
                    >
                      <Sparkles className={cn("h-5 w-5 text-amber-500 group-hover:scale-110 transition-transform", isRTL ? "ml-2" : "mr-2")} />
                      {isRTL ? 'طلب الوصول للمتجر' : 'Request Store Access'}
                    </Button>
                  )}

                  <Button
                    variant="ghost"
                    onClick={() => setLoginType('employee')}
                    className="w-full h-10 text-muted-foreground hover:text-foreground"
                  >
                    <Briefcase className="mr-2 h-4 w-4" />
                    {isRTL ? 'تسجيل دخول الموظفين' : 'Employee Login'}
                  </Button>
                </TabsContent>

                <TabsContent value="signup" className="space-y-6 mt-0 animate-in fade-in slide-in-from-bottom-4 duration-300">
                    {/* Warning Box for Request Mode */}
                    {isRequestMode && (
                      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-start gap-3 animate-in zoom-in-95 duration-300">
                        <Shield className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                        <p className="text-xs text-amber-700 leading-relaxed font-medium">
                          {isRTL 
                            ? 'هذا متجر خاص، سيتم مراجعة طلب التسجيل من قبل صاحب المتجر قبل الموافقة عليه وتفعيل حسابك.' 
                            : 'This is a private/B2B store. Your registration request will be reviewed by the store owner before approval.'}
                        </p>
                      </div>
                    )}

                    {!isRequestMode && (
                      <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 flex items-start gap-3">
                        <Sparkles className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                        <p className="text-sm text-primary/80 leading-relaxed">
                          {isRTL 
                            ? 'انضم إلينا اليوم للحصول على عروض حصرية وتتبع طلباتك بسهولة.' 
                            : 'Join us today for exclusive offers and easy order tracking.'}
                        </p>
                      </div>
                    )}

                    <form onSubmit={handleSignup} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="firstName">{isRTL ? 'الاسم الأول' : 'First Name'}</Label>
                          <Input
                            id="firstName"
                            placeholder={isRTL ? 'أحمد' : 'John'}
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            required
                            className="h-11 rounded-xl border-2 border-border/50 bg-background/50 focus:border-primary/50 transition-all"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="lastName">{isRTL ? 'اسم العائلة' : 'Last Name'}</Label>
                          <Input
                            id="lastName"
                            placeholder={isRTL ? 'محمد' : 'Doe'}
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            required
                            className="h-11 rounded-xl border-2 border-border/50 bg-background/50 focus:border-primary/50 transition-all"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="signup-email">{isRTL ? 'البريد الإلكتروني' : 'Email'}</Label>
                        <div className="relative group">
                          <Mail className={cn(
                            "absolute top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors",
                            isRTL ? "right-4" : "left-4"
                          )} />
                          <Input
                            id="signup-email"
                            type="email"
                            placeholder="name@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className={cn(
                              "h-11 rounded-xl border-2 border-border/50 bg-background/50 focus:border-primary/50 transition-all",
                              isRTL ? "pr-12" : "pl-12"
                            )}
                          />
                        </div>
                      </div>

                      {/* Phone Number */}
                      <div className="space-y-2">
                        <Label htmlFor="phone">{isRTL ? 'رقم الهاتف' : 'Phone'} {!isB2B && <span className="text-muted-foreground text-xs font-normal">({isRTL ? 'اختياري' : 'Optional'})</span>}</Label>
                        <div className="relative group">
                          <Phone className={cn(
                            "absolute top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors",
                            isRTL ? "right-4" : "left-4"
                          )} />
                          <Input
                            id="phone"
                            type="tel"
                            placeholder="+966 50 123 4567"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            required={isB2B}
                            className={cn(
                              "h-11 rounded-xl border-2 border-border/50 bg-background/50 focus:border-primary/50 transition-all",
                              isRTL ? "pr-12" : "pl-12"
                            )}
                          />
                        </div>
                      </div>

                      {/* B2B Fields */}
                      {isB2B && (
                        <div className="bg-muted/30 p-4 rounded-xl border border-border/50 space-y-4 animate-in fade-in slide-in-from-top-2">
                          <div className="flex items-center gap-2 pb-2 border-b border-border/50">
                            <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                              <Building2 className="h-4 w-4" />
                            </div>
                            <Label className="text-base font-semibold text-foreground/90">
                              {isRTL ? 'معلومات الشركة' : 'Company Information'}
                              <span className="text-xs font-normal text-muted-foreground mx-1">(B2B)</span>
                            </Label>
                          </div>

                          <div className="space-y-2">
                             <Label htmlFor="companyName" className="text-xs font-semibold text-muted-foreground">{isRTL ? 'اسم الشركة *' : 'Company Name *'}</Label>
                             <div className="relative group">
                              <Building2 className={cn("absolute top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors", isRTL ? "right-4" : "left-4")} />
                               <Input
                                 id="companyName"
                                 placeholder={isRTL ? 'اسم الشركة' : 'Company Name'}
                                 value={companyName}
                                 onChange={(e) => setCompanyName(e.target.value)}
                                 required
                                 className={cn("h-11 rounded-xl border-2 border-border/50 bg-background/50 focus:border-primary/50 transition-all", isRTL ? "pr-12" : "pl-12")}
                               />
                             </div>
                           </div>
 
                           <div className="space-y-2">
                             <Label htmlFor="taxId" className="text-xs font-semibold text-muted-foreground">{isRTL ? 'الرقم الضريبي (VAT)' : 'Tax ID (VAT)'}</Label>
                             <div className="relative group">
                              <FileText className={cn("absolute top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors", isRTL ? "right-4" : "left-4")} />
                               <Input
                                 id="taxId"
                                 placeholder={isRTL ? '300...' : '300...'}
                                 value={taxId}
                                 onChange={(e) => setTaxId(e.target.value)}
                                 className={cn("h-11 rounded-xl border-2 border-border/50 bg-background/50 focus:border-primary/50 transition-all", isRTL ? "pr-12" : "pl-12")}
                               />
                             </div>
                           </div>
 
                           <div className="space-y-2">
                             <Label htmlFor="activity" className="text-xs font-semibold text-muted-foreground">{isRTL ? 'نوع النشاط' : 'Activity Type'}</Label>
                             <Input
                               id="activity"
                               placeholder={isRTL ? 'تجارة الجملة...' : 'Wholesale...'}
                               value={activity}
                               onChange={(e) => setActivity(e.target.value)}
                               className="h-11 rounded-xl border-2 border-border/50 bg-background/50 focus:border-primary/50 transition-all"
                             />
                           </div>
 
                           <div className="grid grid-cols-2 gap-3">
                             <div className="space-y-2">
                               <Label htmlFor="city" className="text-xs font-semibold text-muted-foreground">{isRTL ? 'المدينة' : 'City'}</Label>
                               <div className="relative group">
                                <MapPin className={cn("absolute top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors", isRTL ? "right-4" : "left-4")} />
                                 <Input
                                   id="city"
                                   placeholder={isRTL ? 'الرياض' : 'Riyadh'}
                                   value={city}
                                   onChange={(e) => setCity(e.target.value)}
                                   className={cn("h-11 rounded-xl border-2 border-border/50 bg-background/50 focus:border-primary/50 transition-all", isRTL ? "pr-12" : "pl-12")}
                                 />
                               </div>
                             </div>
                             <div className="space-y-2">
                               <Label htmlFor="country" className="text-xs font-semibold text-muted-foreground">{isRTL ? 'الدولة' : 'Country'}</Label>
                               <div className="relative group">
                                <Globe className={cn("absolute top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors", isRTL ? "right-4" : "left-4")} />
                                 <Input
                                   id="country"
                                   placeholder="SA"
                                   value={country}
                                   onChange={(e) => setCountry(e.target.value)}
                                   className={cn("h-11 rounded-xl border-2 border-border/50 bg-background/50 focus:border-primary/50 transition-all", isRTL ? "pr-12" : "pl-12")}
                                 />
                               </div>
                             </div>
                           </div>
 
                           <div className="space-y-2">
                             <Label htmlFor="storeName" className="text-xs font-semibold text-muted-foreground">{isRTL ? 'اسم المتجر (اختياري)' : 'Store Name (Optional)'}</Label>
                             <Input
                               id="storeName"
                               placeholder={isRTL ? 'اسم المتجر' : 'Store Name'}
                               value={storeName}
                               onChange={(e) => setStoreName(e.target.value)}
                               className="h-11 rounded-xl border-2 border-border/50 bg-background/50 focus:border-primary/50 transition-all"
                             />
                           </div>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="signup-password">{isRTL ? 'كلمة المرور' : 'Password'}</Label>
                          <div className="relative group">
                            <Lock className={cn(
                              "absolute top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors",
                              isRTL ? "right-4" : "left-4"
                            )} />
                            <Input
                              id="signup-password"
                              type={showPassword ? 'text' : 'password'}
                              placeholder="••••••••"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              required
                              minLength={6}
                              className={cn(
                                "h-11 rounded-xl border-2 border-border/50 bg-background/50 focus:border-primary/50 transition-all",
                                isRTL ? "pr-12" : "pl-12"
                              )}
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="signup-confirm-password">{isRTL ? 'تأكيد كلمة المرور' : 'Confirm Password'}</Label>
                          <div className="relative group">
                            <Lock className={cn(
                              "absolute top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors",
                              isRTL ? "right-4" : "left-4"
                            )} />
                            <Input
                              id="signup-confirm-password"
                              type={showPassword ? 'text' : 'password'}
                              placeholder="••••••••"
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              required
                              className={cn(
                                "h-11 rounded-xl border-2 border-border/50 bg-background/50 focus:border-primary/50 transition-all",
                                isRTL ? "pr-12" : "pl-12"
                              )}
                            />
                          </div>
                        </div>
                      </div>

                      <Button 
                        type="submit" 
                        className={cn("w-full h-12 text-base font-semibold rounded-xl text-white shadow-lg hover:shadow-glow transition-all mt-2", !isNativeMode && "gradient-primary")}
                        style={{ backgroundColor: isNativeMode && appConfig?.primaryColor ? appConfig.primaryColor : undefined }}
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <Loader2 className="ml-2 h-5 w-5 animate-spin" />
                            <span>{isRTL ? (isRequestMode ? 'جاري الإرسال...' : 'جاري الإنشاء...') : (isRequestMode ? 'Submitting...' : 'Creating...')}</span>
                          </>
                        ) : (
                          <>
                            <UserPlus className="ml-2 h-5 w-5" />
                            <span>{isRTL ? (isRequestMode ? 'إرسال طلب التسجيل' : 'إنشاء حساب') : (isRequestMode ? 'Submit Registration Request' : 'Create Account')}</span>
                          </>
                        )}
                      </Button>
                    </form>
                    
                    {/* Request Submitted Success Message */}
                    {requestSubmitted && (
                      <div className="absolute inset-x-8 top-32 z-10">
                        <div className="w-full p-6 bg-background rounded-3xl border-2 border-green-500/20 shadow-2xl animate-scale-in text-center space-y-4">
                          <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto">
                            <CheckCircle2 className="h-8 w-8 text-green-500" />
                          </div>
                          <h3 className="text-xl font-bold text-green-600">
                            {isRTL ? 'تم إرسال طلبك بنجاح' : 'Request Submitted Successfully'}
                          </h3>
                          <p className="text-muted-foreground text-sm">
                            {isRTL 
                              ? 'شكراً لتسجيلك. سيتم مراجعة طلبك وإعلامك بالنتيجة عبر البريد الإلكتروني قريباً.'
                              : 'Thank you for registering. Your request will be reviewed and you will be notified via email shortly.'
                            }
                          </p>
                          <Button 
                            className="w-full"
                            onClick={() => {
                              setRequestSubmitted(false);
                              setActiveTab('login');
                            }}
                          >
                            {isRTL ? 'العودة لتسجيل الدخول' : 'Back to Login'}
                          </Button>
                        </div>
                        {/* Backdrop blur */}
                        <div className="absolute -inset-[1000px] bg-background/50 backdrop-blur-sm -z-10" />
                      </div>
                    )}
                  </TabsContent>
              </CardContent>

              <CardFooter className="flex flex-col gap-4 pb-8 pt-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Shield className="h-3 w-3" />
                  {isRTL 
                    ? 'بياناتك محمية بأحدث تقنيات التشفير' 
                    : 'Your data is protected by industry-standard encryption'}
                </div>
                
                {/* Show registration link only for non-private stores */}
                {!settings?.isPrivateStore && (
                  <>
                    <div className="w-full flex items-center gap-4">
                      <div className="h-px flex-1 bg-border/50" />
                      <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
                        {isRTL ? 'أو' : 'OR'}
                      </span>
                      <div className="h-px flex-1 bg-border/50" />
                    </div>

                    <p className="text-sm text-center text-muted-foreground">
                      {activeTab === 'login' 
                        ? (isRTL ? 'ليس لديك حساب؟' : "Don't have an account?")
                        : (isRTL ? 'لديك حساب بالفعل؟' : "Already have an account?")
                      }
                      <button 
                        onClick={() => setActiveTab(activeTab === 'login' ? 'signup' : 'login')}
                        className={cn("font-bold ml-1 hover:underline transition-colors", !isNativeMode && "text-primary hover:text-primary/80")}
                        style={{ color: isNativeMode && appConfig?.primaryColor ? appConfig.primaryColor : undefined }}
                      >
                        {activeTab === 'login' 
                          ? (isRTL ? 'أنشئ حساباً الآن' : 'Sign up now')
                          : (isRTL ? 'سجل دخولك' : 'Login here')
                        }
                      </button>
                    </p>
                  </>
                )}
              </CardFooter>
            </Tabs>
          )}
        </Card>

        {/* Footer Info */}
        <div className="flex flex-col items-center gap-4 pt-4">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <CheckCircle2 className="h-3.5 w-3.5 text-success" />
              {isRTL ? 'دفع آمن' : 'Secure Payment'}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <CheckCircle2 className="h-3.5 w-3.5 text-success" />
              {isRTL ? 'دعم 24/7' : '24/7 Support'}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <CheckCircle2 className="h-3.5 w-3.5 text-success" />
              {isRTL ? 'خصوصية تامة' : 'Full Privacy'}
            </div>
          </div>
          
          <Link to="/" className="text-sm text-muted-foreground hover:text-primary transition-colors">
            {isRTL ? 'العودة للمتجر' : 'Back to Store'}
          </Link>
        </div>
      </div>
    </div>
  );
}
