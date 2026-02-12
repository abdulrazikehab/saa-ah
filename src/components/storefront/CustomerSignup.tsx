import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, UserPlus, Mail, Lock, User, Eye, EyeOff, X, Phone, Shield, Key, Copy, CheckCircle2, ArrowRight, Download, Sparkles, MessageSquare, QrCode, Building2, FileText, MapPin, Globe } from 'lucide-react';
import { apiClient } from '@/services/core/api-client';
import { authService } from '@/services/auth.service';
import { getProfessionalErrorMessage } from '@/lib/toast-errors';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { getTenantContext } from '@/lib/storefront-utils';
import { useStoreSettings } from '@/contexts/StoreSettingsContext';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { coreApi } from '@/lib/api';

interface CustomerSignupProps {
  onClose: () => void;
  onSwitchToLogin: () => void;
  onSignupSuccess?: () => void;
}

export function CustomerSignup({ onClose, onSwitchToLogin, onSignupSuccess }: CustomerSignupProps) {
  const { toast } = useToast();
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const { settings } = useStoreSettings();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  // B2B fields
  const [companyName, setCompanyName] = useState('');
  const [taxId, setTaxId] = useState('');
  const [activity, setActivity] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('SA');
  const [storeName, setStoreName] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRequestMode, setIsRequestMode] = useState(false);
  const [requestSubmitted, setRequestSubmitted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [recoveryId, setRecoveryId] = useState<string | null>(null);
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [copiedRecovery, setCopiedRecovery] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [signupEmail, setSignupEmail] = useState<string>('');
  const [show2FASetup, setShow2FASetup] = useState(false);
  const [twoFactorSecret, setTwoFactorSecret] = useState<string>('');
  const [twoFactorQrCode, setTwoFactorQrCode] = useState<string>('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [twoFactorLoading, setTwoFactorLoading] = useState(false);
  const [verificationToken, setVerificationToken] = useState<string>('');
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [showRecoveryCodesModal, setShowRecoveryCodesModal] = useState(false);

  // Check if B2B mode or private store mode
  const isB2B = settings?.businessModel === 'B2B';
  const isPrivateStore = settings?.isPrivateStore === true;

  // Determine if registration should be a request
  // If private store OR (B2B with registration requests enabled), use request mode
  useEffect(() => {
    const shouldUseRequest = isPrivateStore || (isB2B && settings?.customerRegistrationRequestEnabled === true);
    setIsRequestMode(shouldUseRequest);
  }, [isPrivateStore, isB2B, settings?.customerRegistrationRequestEnabled]);

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
    if (passwordStrength < 40) return isRTL ? 'ضعيفة' : 'Weak';
    if (passwordStrength < 70) return isRTL ? 'متوسطة' : 'Medium';
    return isRTL ? 'قوية' : 'Strong';
  };

  const copyRecoveryId = () => {
    if (recoveryId) {
      navigator.clipboard.writeText(recoveryId);
      setCopiedRecovery(true);
      toast({
        title: isRTL ? 'تم النسخ!' : 'Copied!',
        description: isRTL ? 'تم نسخ رمز الاسترداد إلى الحافظة' : 'Recovery ID copied to clipboard',
      });
      setTimeout(() => setCopiedRecovery(false), 2000);
    }
  };

  const downloadRecoveryId = () => {
    if (recoveryId) {
      const content = `Recovery ID | رمز الاسترداد\n\n${recoveryId}\n\nPlease keep this ID in a safe place. You can use it to recover your account if you forget your email or it gets compromised.\n\nيرجى الاحتفاظ بهذا الرمز في مكان آمن. يمكنك استخدامه لاسترداد حسابك إذا نسيت بريدك الإلكتروني أو تعرض للاختراق.\n\nGenerated: ${new Date().toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'long' })}`;
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `recovery-id-${recoveryId.substring(0, 8)}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast({
        title: isRTL ? 'تم التنزيل!' : 'Downloaded!',
        description: isRTL ? 'تم تنزيل رمز الاسترداد' : 'Recovery ID downloaded',
      });
      
      setCopiedRecovery(true);
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
        title: isRTL ? 'عدم تطابق' : 'Mismatch',
        description: isRTL
          ? 'كلمتا المرور غير متطابقتين. يرجى التأكد من تطابق كلمتي المرور والمحاولة مرة أخرى'
          : 'Passwords do not match. Please ensure both passwords are identical and try again',
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
      // Get tenant context from current store to ensure customer is created in the correct merchant's table
      const tenantContext = getTenantContext();
      
      // Add tenant headers to ensure customer is created in the correct merchant's table
      const headers: Record<string, string> = {};
      if (tenantContext.subdomain) {
        headers['X-Tenant-Domain'] = tenantContext.domain;
      }

      // If it's a request mode (private store or B2B with requests enabled), create a registration request
      if (isRequestMode) {
        // Create registration request
        // Backend will resolve tenantId from domain/subdomain if not provided
        const requestData: Record<string, any> = {
          email,
          password,
          fullName: `${firstName} ${lastName}`.trim() || email.split('@')[0],
          phone: phone || undefined,
        };

        // Add B2B fields if in B2B mode
        if (isB2B) {
          requestData.companyName = companyName;
          requestData.storeName = storeName || companyName;
          requestData.activity = activity;
          requestData.city = city;
          requestData.country = country;
        }

        const response = await coreApi.post('/customer-registration-requests', requestData, { requireAuth: false });
        
        setRequestSubmitted(true);
        toast({
          title: isRTL ? 'تم إرسال الطلب' : 'Request Submitted',
          description: isRTL 
            ? 'تم إرسال طلب التسجيل بنجاح. سيتم مراجعته من قبل صاحب المتجر وإشعارك بالنتيجة عبر البريد الإلكتروني.'
            : 'Your registration request has been submitted. It will be reviewed by the store owner and you will be notified via email.',
        });
        
        // Close modal after 3 seconds
        setTimeout(() => {
          onClose();
        }, 3000);
        
        return;
      }
      
      // Regular signup flow
      const signupData: Record<string, any> = {
        email,
        password,
        firstName,
        lastName,
        phone,
      };

      // Add B2B fields if in B2B mode
      if (isB2B) {
        signupData.companyName = companyName;
        signupData.storeName = storeName || companyName;
        signupData.activity = activity;
        signupData.city = city;
        signupData.country = country;
      }
      
      const response = await apiClient.post(
        `${apiClient.authUrl}/customers/signup`, 
        signupData,
        {
          requireAuth: false,
          headers,
        }
      );
      
      // Check if it's a request-based response
      if (response.requiresApproval) {
        setRequestSubmitted(true);
        toast({
          title: isRTL ? 'تم إرسال الطلب' : 'Request Submitted',
          description: response.message || (isRTL 
            ? 'تم إرسال طلب التسجيل بنجاح. سيتم مراجعته من قبل صاحب المتجر وإشعارك بالنتيجة عبر البريد الإلكتروني.'
            : 'Your registration request has been submitted. It will be reviewed by the store owner and you will be notified via email.'),
        });
        
        setTimeout(() => {
          onClose();
        }, 3000);
        return;
      }
      
      // Check if OTP was sent
      if (response.verificationCodeSent || response.verificationCode) {
        setSignupEmail(email);
        setShowOtpModal(true);
      } else {
        // Fallback: if no OTP needed (shouldn't happen with new flow)
        if (response.token && response.customer) {
          localStorage.setItem('customerToken', response.token);
          localStorage.setItem('customerData', JSON.stringify(response.customer));
          
          if (response.recoveryId) {
            setRecoveryId(response.recoveryId);
            setShowRecoveryModal(true);
          } else {
            toast({
              title: isRTL ? 'تم إنشاء الحساب بنجاح' : 'Account created successfully',
              description: isRTL ? 'مرحباً بك في متجرنا' : 'Welcome to our store!',
            });
            
            onSignupSuccess?.();
            onClose();
          }
        }
      }
    } catch (error: unknown) {
      const { title, description } = getProfessionalErrorMessage(
        error,
        { operation: isRTL ? 'إنشاء' : 'create', resource: isRTL ? 'الحساب' : 'account' },
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

  const handleVerifyOtp = async () => {
    if (!otpCode || otpCode.length !== 6) {
      toast({
        variant: 'destructive',
        title: isRTL ? 'خطأ' : 'Error',
        description: isRTL ? 'يرجى إدخال رمز التحقق المكون من 6 أرقام' : 'Please enter a 6-digit verification code',
      });
      return;
    }

    setOtpLoading(true);
    try {
      const tenantContext = getTenantContext();
      const headers: Record<string, string> = {};
      if (tenantContext.subdomain) {
        headers['X-Tenant-Domain'] = tenantContext.domain;
      }

      const result = await apiClient.post(
        `${apiClient.authUrl}/customers/verify-email`,
        {
          email: signupEmail,
          code: otpCode,
        },
        {
          requireAuth: false,
          headers,
        }
      );
      
      if (result.valid && result.token) {
        // Store tokens and customer data
        localStorage.setItem('customerToken', result.token);
        localStorage.setItem('customerData', JSON.stringify(result.customer));
        
        // Dispatch custom event to notify other components that login was successful
        window.dispatchEvent(new CustomEvent('customerLogin', { 
          detail: { token: result.token, customer: result.customer } 
        }));
        
        // Store verification token for 2FA setup
        setVerificationToken(result.token);
        
        // Close OTP modal
        setShowOtpModal(false);
        
        // Check if we need to redirect to correct subdomain
        const customerTenantSubdomain = result.customer?.tenant?.subdomain;
        if (customerTenantSubdomain) {
          const currentHost = window.location.host;
          const currentHostname = window.location.hostname;
          const protocol = window.location.protocol;
          
          console.log('🔍 OTP Verification - Subdomain Check:', {
            customerTenantSubdomain,
            currentHost,
            currentHostname,
            customerData: result.customer
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
          
          // Define what constitutes the "default" tenant (koun or kawn or default)
          const isDefaultTenant = targetSubdomain === 'koun' || targetSubdomain === 'kawn' || targetSubdomain === 'saeaa' || targetSubdomain === 'default';
          
          // Define what constitutes the "main" domain (no subdomain) on localhost/dev
          const isMainLocalhost = currentHostnameLower === 'localhost' || currentHostnameLower === '127.0.0.1';
          
          // Check if we are already on the correct subdomain
          // 1. Current subdomain matches target (e.g. asus1 === asus1)
          const isSubdomainMatch = currentSubdomainLower === targetSubdomain;
          
          // 2. Special case: We are on main localhost and tenant is default/koun/kawn/saeaa
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
          
          // This handles cases where the backend might default to 'kawn' (or legacy 'saeaa') but the user is interacting with a specific store.
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
            
            // Show toast before redirect
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
          console.warn('⚠️ No tenant subdomain in customer response:', result.customer);
          console.warn('⚠️ Full result object:', result);
          
          // Fallback: Try to extract subdomain from current URL and redirect if we're on a subdomain
          const currentHostname = window.location.hostname;
          if (currentHostname.includes('.localhost')) {
            const currentSubdomain = currentHostname.split('.localhost')[0];
            console.warn(`⚠️ No tenant subdomain in response, but we're on subdomain: ${currentSubdomain}`);
            // Don't redirect if we don't know the correct subdomain
          }
        }
        
        // Show recovery ID if available, otherwise offer 2FA setup
        if (result.recoveryId) {
          setRecoveryId(result.recoveryId);
          setShowRecoveryModal(true);
        } else {
          // Offer 2FA setup
          toast({
            title: isRTL ? 'تم التحقق بنجاح!' : 'Verification successful!',
            description: isRTL ? 'تم إنشاء حسابك بنجاح. هل تريد تفعيل المصادقة بخطوتين؟' : 'Your account has been created successfully. Would you like to enable two-factor authentication?',
          });
          
          // Show 2FA setup option
          setShow2FASetup(true);
        }
      } else {
        toast({
          variant: 'destructive',
          title: isRTL ? 'خطأ' : 'Error',
          description: result.message || (isRTL ? 'رمز التحقق غير صحيح' : 'Invalid verification code'),
        });
      }
    } catch (error: unknown) {
      const { title, description } = getProfessionalErrorMessage(
        error,
        { operation: isRTL ? 'التحقق' : 'verify', resource: isRTL ? 'البريد الإلكتروني' : 'email' },
        isRTL
      );
      toast({
        variant: 'destructive',
        title,
        description,
      });
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setOtpLoading(true);
    try {
      const tenantContext = getTenantContext();
      const headers: Record<string, string> = {};
      if (tenantContext.subdomain) {
        headers['X-Tenant-Domain'] = tenantContext.domain;
      }

      await apiClient.post(
        `${apiClient.authUrl}/customers/resend-verification-code`,
        {
          email: signupEmail,
        },
        {
          requireAuth: false,
          headers,
        }
      );
      
      toast({
        title: isRTL ? 'تم الإرسال!' : 'Sent!',
        description: isRTL ? 'تم إرسال رمز التحقق الجديد إلى بريدك الإلكتروني' : 'A new verification code has been sent to your email',
      });
      setOtpCode('');
    } catch (error: unknown) {
      const { title, description } = getProfessionalErrorMessage(
        error,
        { operation: isRTL ? 'إعادة إرسال' : 'resend', resource: isRTL ? 'رمز التحقق' : 'verification code' },
        isRTL
      );
      toast({
        variant: 'destructive',
        title,
        description,
      });
    } finally {
      setOtpLoading(false);
    }
  };

  const handleSetup2FA = async () => {
    if (!signupEmail || !verificationToken) return;
    
    setTwoFactorLoading(true);
    try {
      const result = await authService.setupCustomer2FADuringSignup(signupEmail, verificationToken);
      setTwoFactorSecret(result.secret);
      setTwoFactorQrCode(result.qrCode);
    } catch (error: unknown) {
      const { title, description } = getProfessionalErrorMessage(
        error,
        { operation: isRTL ? 'إعداد' : 'setup', resource: isRTL ? 'المصادقة بخطوتين' : 'two-factor authentication' },
        isRTL
      );
      toast({
        variant: 'destructive',
        title,
        description,
      });
    } finally {
      setTwoFactorLoading(false);
    }
  };

  const handleEnable2FA = async () => {
    if (!twoFactorCode || twoFactorCode.length !== 6 || !twoFactorSecret || !signupEmail || !verificationToken) {
      toast({
        variant: 'destructive',
        title: isRTL ? 'خطأ' : 'Error',
        description: isRTL ? 'يرجى إدخال رمز التحقق المكون من 6 أرقام' : 'Please enter a 6-digit verification code',
      });
      return;
    }

    setTwoFactorLoading(true);
    try {
      const result = await authService.enableCustomer2FADuringSignup(signupEmail, verificationToken, twoFactorSecret, twoFactorCode);
      
      toast({
        title: isRTL ? 'تم تفعيل المصادقة بخطوتين!' : 'Two-Factor Authentication Enabled!',
        description: isRTL ? 'تم تفعيل المصادقة بخطوتين بنجاح لحسابك' : 'Two-factor authentication has been successfully enabled for your account',
      });
      
      if (result.recoveryCodes) {
        setRecoveryCodes(result.recoveryCodes);
        setShowRecoveryCodesModal(true);
        setShow2FASetup(false);
      } else {
        setShow2FASetup(false);
        onSignupSuccess?.();
        onClose();
      }
    } catch (error: unknown) {
      const { title, description } = getProfessionalErrorMessage(
        error,
        { operation: isRTL ? 'تفعيل' : 'enable', resource: isRTL ? 'المصادقة بخطوتين' : 'two-factor authentication' },
        isRTL
      );
      toast({
        variant: 'destructive',
        title,
        description,
      });
    } finally {
      setTwoFactorLoading(false);
    }
  };

  const handleSkip2FA = () => {
    setShow2FASetup(false);
    onSignupSuccess?.();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="flex min-h-full items-center justify-center p-4">
        {/* OTP Verification Modal */}
        {showOtpModal && (
          <div 
            className="w-full max-w-md relative animate-scale-in z-50 mb-8"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowOtpModal(false);
              }
            }}
          >
          <div className="relative overflow-hidden rounded-3xl glass-effect-strong border border-border/50 shadow-2xl">
            <div className="absolute top-0 left-0 right-0 h-1 gradient-aurora animate-gradient bg-[length:200%_auto]" />
            
            <button
              onClick={() => setShowOtpModal(false)}
              className="absolute left-4 top-4 p-2.5 rounded-xl bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-all z-10"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="relative pt-10 pb-6 px-8 text-center">
              <div className="flex flex-col items-center gap-4 mb-6">
                <div className="w-24 h-24 rounded-2xl overflow-hidden bg-white shadow-xl border-2 border-primary/10 p-2">
                  <OptimizedImage 
                    src={settings.storeLogoUrl || settings.logoUrl || ''} 
                    alt={isRTL ? settings.storeNameAr || settings.storeName : settings.storeName}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="space-y-1">
                  <h2 className="text-2xl font-bold gradient-text">
                    {isRTL ? settings.storeNameAr || settings.storeName : settings.storeName}
                  </h2>
                  <p className="text-sm text-muted-foreground line-clamp-2 max-w-[250px] mx-auto">
                    {isRTL ? settings.storeDescriptionAr || settings.storeDescription : settings.storeDescription}
                  </p>
                </div>
              </div>
              
              <div className="inline-flex items-center justify-center w-12 h-12 mb-4 rounded-xl bg-primary/10 text-primary">
                <MessageSquare className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold mb-2">
                {isRTL ? 'تحقق من بريدك الإلكتروني' : 'Verify Your Email'}
              </h3>
              <p className="text-muted-foreground text-sm">
                {isRTL 
                  ? `لقد أرسلنا رمز التحقق إلى ${signupEmail}` 
                  : `We've sent a verification code to ${signupEmail}`}
              </p>
            </div>

            <div className="relative px-8 pb-8">
              <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 mb-6">
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-primary">
                    <p className="font-semibold mb-1">{isRTL ? 'تحقق من بريدك الإلكتروني' : 'Check your email'}</p>
                    <p>{isRTL ? 'تم إرسال رمز التحقق المكون من 6 أرقام إلى:' : 'A 6-digit verification code has been sent to:'}</p>
                    <p className="font-mono font-bold mt-1">{signupEmail}</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="otp" className="text-sm font-medium">
                    {isRTL ? 'رمز التحقق' : 'Verification Code'}
                  </Label>
                  <Input
                    id="otp"
                    type="text"
                    placeholder="123456"
                    value={otpCode}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setOtpCode(value);
                    }}
                    className="h-12 text-center text-2xl font-mono tracking-widest rounded-xl"
                    maxLength={6}
                    disabled={otpLoading}
                  />
                  <p className="text-xs text-muted-foreground text-center">
                    {isRTL ? 'يرجى إدخال الرمز المكون من 6 أرقام' : 'Please enter the 6-digit code'}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Button
                    onClick={handleVerifyOtp}
                    className="w-full h-12 text-base font-semibold rounded-xl gradient-primary text-white shadow-lg hover:shadow-glow transition-all"
                    disabled={otpLoading || otpCode.length !== 6}
                  >
                    {otpLoading ? (
                      <>
                        <Loader2 className={cn("h-5 w-5 animate-spin", isRTL ? "ml-2" : "mr-2")} />
                        {isRTL ? 'جاري التحقق...' : 'Verifying...'}
                      </>
                    ) : (
                      <>
                        {isRTL ? 'التحقق' : 'Verify'}
                        <ArrowRight className={cn("w-4 h-4", isRTL ? "mr-2" : "ml-2")} />
                      </>
                    )}
                  </Button>
                  
                  <Button
                    onClick={handleResendOtp}
                    variant="outline"
                    className="w-full h-12 rounded-xl"
                    disabled={otpLoading}
                  >
                    {otpLoading ? (
                      <Loader2 className={cn("h-5 w-5 animate-spin", isRTL ? "ml-2" : "mr-2")} />
                    ) : (
                      <>
                        <Mail className={cn("w-4 h-4", isRTL ? "ml-2" : "mr-2")} />
                        {isRTL ? 'إعادة إرسال الرمز' : 'Resend Code'}
                      </>
                    )}
                  </Button>
                  
                  <Button
                    onClick={() => {
                      setShowOtpModal(false);
                      setOtpCode('');
                    }}
                    variant="ghost"
                    className="w-full h-12 rounded-xl text-muted-foreground hover:text-foreground"
                    disabled={otpLoading}
                  >
                    <X className={cn("w-4 h-4", isRTL ? "ml-2" : "mr-2")} />
                    {isRTL ? 'إلغاء' : 'Cancel'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2FA Setup Modal */}
      {show2FASetup && (
        <div 
          className="w-full max-w-md relative animate-scale-in z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleSkip2FA();
            }
          }}
        >
          <div className="relative overflow-hidden rounded-3xl glass-effect-strong border border-border/50 shadow-2xl">
            <div className="absolute top-0 left-0 right-0 h-1 gradient-aurora animate-gradient bg-[length:200%_auto]" />
            
            <button
              onClick={handleSkip2FA}
              className="absolute left-4 top-4 p-2.5 rounded-xl bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-all z-10"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="relative pt-10 pb-6 px-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-xl bg-primary/10 text-primary">
                <Shield className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold mb-2">
                {isRTL ? 'تفعيل المصادقة بخطوتين' : 'Enable Two-Factor Authentication'}
              </h3>
              <p className="text-muted-foreground text-sm">
                {isRTL 
                  ? 'قم بمسح رمز QR باستخدام تطبيق Google Authenticator لإضافة طبقة إضافية من الأمان'
                  : 'Scan the QR code with Google Authenticator app to add an extra layer of security'
                }
              </p>
            </div>

            <div className="relative px-8 pb-8">
              {!twoFactorSecret ? (
                <div className="space-y-5">
                  <Button
                    onClick={handleSetup2FA}
                    disabled={twoFactorLoading}
                    className="w-full h-12 text-base font-semibold rounded-xl gradient-primary text-white shadow-lg hover:shadow-glow transition-all"
                  >
                    {twoFactorLoading ? (
                      <>
                        <Loader2 className="ml-2 h-5 w-5 animate-spin" />
                        <span>{isRTL ? 'جاري الإعداد...' : 'Setting up...'}</span>
                      </>
                    ) : (
                      <>
                        <QrCode className="ml-2 h-5 w-5" />
                        <span>{isRTL ? 'إعداد المصادقة بخطوتين' : 'Setup Two-Factor Authentication'}</span>
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={handleSkip2FA}
                    variant="ghost"
                    className="w-full"
                  >
                    {isRTL ? 'تخطي الآن' : 'Skip for now'}
                  </Button>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="flex justify-center">
                    <img src={twoFactorQrCode} alt="QR Code" className="w-48 h-48 border-2 border-border rounded-xl p-2 bg-white" />
                  </div>
                  <p className="text-sm text-muted-foreground text-center whitespace-pre-line">
                    {isRTL 
                      ? '1. افتح تطبيق Google Authenticator على هاتفك\n2. اضغط على "+" لإضافة حساب جديد\n3. امسح رمز QR أعلاه\n4. أدخل الرمز المكون من 6 أرقام أدناه'
                      : '1. Open Google Authenticator app on your phone\n2. Tap "+" to add a new account\n3. Scan the QR code above\n4. Enter the 6-digit code below'
                    }
                  </p>
                  <div className="space-y-2">
                    <Label htmlFor="twoFactorCode" className="text-sm font-semibold">
                      {isRTL ? 'رمز التحقق (TOTP)' : 'Verification Code (TOTP)'}
                    </Label>
                    <Input
                      id="twoFactorCode"
                      type="text"
                      placeholder={isRTL ? '000000' : '000000'}
                      value={twoFactorCode}
                      onChange={(e) => setTwoFactorCode(e.target.value.replace(/[^0-9]/g, ''))}
                      maxLength={6}
                      className="h-12 text-base rounded-xl border-2 border-border/50 bg-background focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all text-center text-2xl tracking-widest"
                    />
                  </div>
                  <Button
                    onClick={handleEnable2FA}
                    disabled={twoFactorLoading || twoFactorCode.length !== 6}
                    className="w-full h-12 text-base font-semibold rounded-xl gradient-primary text-white shadow-lg hover:shadow-glow transition-all"
                  >
                    {twoFactorLoading ? (
                      <>
                        <Loader2 className="ml-2 h-5 w-5 animate-spin" />
                        <span>{isRTL ? 'جاري التفعيل...' : 'Enabling...'}</span>
                      </>
                    ) : (
                      <>
                        <Shield className="ml-2 h-5 w-5" />
                        <span>{isRTL ? 'تفعيل' : 'Enable'}</span>
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={handleSkip2FA}
                    variant="ghost"
                    className="w-full"
                  >
                    {isRTL ? 'تخطي الآن' : 'Skip for now'}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Recovery Codes Modal */}
      {showRecoveryCodesModal && (
        <div className="w-full max-w-md relative animate-scale-in z-50">
          <div className="relative overflow-hidden rounded-3xl glass-effect-strong border border-border/50 shadow-2xl">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-500 to-orange-600" />
            
            <div className="p-8 text-center">
              <div className="mx-auto w-20 h-20 bg-yellow-500/10 rounded-2xl flex items-center justify-center mb-6">
                <Key className="w-10 h-10 text-yellow-500" />
              </div>
              <h2 className="text-2xl font-bold mb-2">
                {isRTL ? 'رموز الاسترداد' : 'Recovery Codes'}
              </h2>
              <p className="text-muted-foreground text-sm mb-6">
                {isRTL 
                  ? 'يرجى حفظ هذه الرموز في مكان آمن. يمكنك استخدامها لتسجيل الدخول إذا فقدت الوصول إلى تطبيق المصادقة.'
                  : 'Please save these codes in a safe place. You can use them to login if you lose access to your authenticator app.'}
              </p>
              
              <div className="bg-muted/50 rounded-2xl p-6 mb-8 border border-border/50 grid grid-cols-2 gap-2">
                {recoveryCodes.map((code, index) => (
                  <div key={index} className="font-mono font-bold text-primary tracking-wider text-center p-1 bg-background rounded border border-border/30">
                    {code}
                  </div>
                ))}
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <Button
                  onClick={() => {
                    navigator.clipboard.writeText(recoveryCodes.join('\n'));
                    toast({
                      title: isRTL ? 'تم النسخ!' : 'Copied!',
                      description: isRTL ? 'تم نسخ الرموز إلى الحافظة' : 'Codes copied to clipboard',
                    });
                  }}
                  variant="outline"
                  className="h-12 rounded-xl border-2"
                >
                  <Copy className="w-4 h-4 ml-2" />
                  {isRTL ? 'نسخ الرموز' : 'Copy Codes'}
                </Button>
                
                <Button
                  onClick={() => {
                    const content = `2FA Recovery Codes | رموز استرداد المصادقة الثنائية\n\n${recoveryCodes.join('\n')}\n\nGenerated: ${new Date().toLocaleString()}`;
                    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = 'recovery-codes.txt';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  variant="outline"
                  className="h-12 rounded-xl border-2"
                >
                  <Download className="w-4 h-4 ml-2" />
                  {isRTL ? 'تحميل' : 'Download'}
                </Button>
              </div>
              
              <Button
                onClick={() => {
                  setShowRecoveryCodesModal(false);
                  onSignupSuccess?.();
                  onClose();
                }}
                className="w-full h-12 text-base font-semibold rounded-xl gradient-primary text-white shadow-lg hover:shadow-glow transition-all"
              >
                {isRTL ? 'تم الحفظ، متابعة' : 'Saved, Continue'}
                <ArrowRight className={cn("w-4 h-4", isRTL ? "mr-2" : "ml-2")} />
              </Button>
            </div>
          </div>
        </div>
      )}

      {showRecoveryModal && recoveryId ? (
        <div className="w-full max-w-md relative animate-scale-in">
          <div className="relative overflow-hidden rounded-3xl glass-effect-strong border border-border/50 shadow-2xl">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 to-emerald-600" />
            
            <div className="p-8 text-center">
              <div className="mx-auto w-20 h-20 bg-green-500/10 rounded-2xl flex items-center justify-center mb-6">
                <Shield className="w-10 h-10 text-green-500" />
              </div>
              <h2 className="text-2xl font-bold mb-2">
                {isRTL ? 'رمز الاسترداد السري' : 'Secret Recovery ID'}
              </h2>
              <p className="text-muted-foreground text-sm mb-6">
                {isRTL ? 'هام جداً! احفظ هذا الرمز في مكان آمن.' : 'Very important! Save this ID in a safe place.'}
              </p>
              
              <div className="bg-muted/50 rounded-2xl p-6 mb-8 border border-border/50">
                <p className="text-2xl font-mono font-bold text-primary tracking-wider select-all">
                  {recoveryId}
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <Button
                  onClick={copyRecoveryId}
                  variant="outline"
                  className="h-12 rounded-xl border-2"
                >
                  {copiedRecovery ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 ml-2 text-green-500" />
                      {isRTL ? 'تم النسخ' : 'Copied'}
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 ml-2" />
                      {isRTL ? 'نسخ الرمز' : 'Copy ID'}
                    </>
                  )}
                </Button>
                
                <Button
                  onClick={downloadRecoveryId}
                  variant="outline"
                  className="h-12 rounded-xl border-2"
                >
                  <Download className="w-4 h-4 ml-2" />
                  {isRTL ? 'تحميل الرمز' : 'Download'}
                </Button>
              </div>
              
              <Button
                onClick={handleClose}
                className="w-full h-12 text-base font-semibold rounded-xl gradient-primary text-white shadow-lg hover:shadow-glow transition-all"
                disabled={!copiedRecovery}
              >
                {isRTL ? 'متابعة' : 'Continue'}
                <ArrowRight className={cn("w-4 h-4", isRTL ? "mr-2" : "ml-2")} />
              </Button>
              
              {!copiedRecovery && (
                <p className="text-xs text-center text-muted-foreground mt-4">
                  {isRTL ? 'يرجى نسخ أو تحميل الرمز قبل المتابعة' : 'Please copy or download the ID before continuing'}
                </p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="w-full max-w-md relative my-8 animate-scale-in">
          <div className="relative overflow-hidden rounded-3xl glass-effect-strong border border-border/50 shadow-2xl">
            <div className="absolute top-0 left-0 right-0 h-1 gradient-aurora animate-gradient bg-[length:200%_auto]" />
            
            <button
              onClick={onClose}
              className="absolute left-4 top-4 p-2.5 rounded-xl bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-all z-10"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="relative pt-10 pb-6 px-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-2xl gradient-primary shadow-lg">
                <UserPlus className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold gradient-text mb-2">
                {isRTL ? 'إنشاء حساب جديد' : 'Create Account'}
              </h2>
              <p className="text-muted-foreground">
                {isRequestMode 
                  ? (isRTL ? 'سيتم مراجعة طلبك من قبل صاحب المتجر' : 'Your request will be reviewed by the store owner')
                  : (isRTL ? 'انضم إلينا وابدأ التسوق الآن' : 'Join us and start shopping now')
                }
              </p>
              {isRequestMode && (
                <div className="mt-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                  <p className="text-sm text-amber-600 dark:text-amber-400">
                    {isRTL 
                      ? '⚠️ هذا متجر خاص. سيتم مراجعة طلب التسجيل من قبل صاحب المتجر قبل الموافقة عليه.'
                      : '⚠️ This is a private store. Your registration request will be reviewed by the store owner before approval.'
                    }
                  </p>
                </div>
              )}
            </div>

            <div className="relative px-8 pb-8">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-sm font-medium">{isRTL ? 'الاسم الأول' : 'First Name'}</Label>
                    <div className="relative group">
                      <User className={cn("absolute top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors", isRTL ? "right-3" : "left-3")} />
                      <Input
                        id="firstName"
                        placeholder={isRTL ? 'أحمد' : 'John'}
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        required
                        className={cn("h-11 rounded-xl border-2 border-border/50 bg-background focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all", isRTL ? "pr-10" : "pl-10")}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-sm font-medium">{isRTL ? 'الاسم الأخير' : 'Last Name'}</Label>
                    <Input
                      id="lastName"
                      placeholder={isRTL ? 'محمد' : 'Doe'}
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                      className="h-11 rounded-xl border-2 border-border/50 bg-background focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-email" className="text-sm font-medium">{isRTL ? 'البريد الإلكتروني' : 'Email'}</Label>
                  <div className="relative group">
                    <Mail className={cn("absolute top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors", isRTL ? "right-3" : "left-3")} />
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className={cn("h-11 rounded-xl border-2 border-border/50 bg-background focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all", isRTL ? "pr-10" : "pl-10")}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium">{isRTL ? 'رقم الهاتف' : 'Phone'} {!isB2B && <span className="text-muted-foreground">({isRTL ? 'اختياري' : 'Optional'})</span>}</Label>
                  <div className="relative group">
                    <Phone className={cn("absolute top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors", isRTL ? "right-3" : "left-3")} />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+966 50 123 4567"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required={isB2B}
                      className={cn("h-11 rounded-xl border-2 border-border/50 bg-background focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all", isRTL ? "pr-10" : "pl-10")}
                    />
                  </div>
                </div>

                {/* B2B Fields */}
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
                      <Label htmlFor="companyName" className="text-xs font-medium text-muted-foreground">{isRTL ? 'اسم الشركة *' : 'Company Name *'}</Label>
                      <div className="relative group">
                        <Building2 className={cn("absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors", isRTL ? "right-3" : "left-3")} />
                        <Input
                          id="companyName"
                          placeholder={isRTL ? 'اسم الشركة' : 'Company Name'}
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                          required
                          className={cn("h-10 text-sm rounded-lg border-2 border-border/50 bg-background focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all", isRTL ? "pr-9" : "pl-9")}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="taxId" className="text-xs font-medium text-muted-foreground">{isRTL ? 'الرقم الضريبي (VAT)' : 'Tax ID (VAT)'}</Label>
                      <div className="relative group">
                        <FileText className={cn("absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors", isRTL ? "right-3" : "left-3")} />
                        <Input
                          id="taxId"
                          placeholder={isRTL ? '300...' : '300...'}
                          value={taxId}
                          onChange={(e) => setTaxId(e.target.value)}
                          className={cn("h-10 text-sm rounded-lg border-2 border-border/50 bg-background focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all", isRTL ? "pr-9" : "pl-9")}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="activity" className="text-xs font-medium text-muted-foreground">{isRTL ? 'نوع النشاط' : 'Activity Type'}</Label>
                      <Input
                        id="activity"
                        placeholder={isRTL ? 'تجارة الجملة...' : 'Wholesale...'}
                        value={activity}
                        onChange={(e) => setActivity(e.target.value)}
                        className="h-10 text-sm rounded-lg border-2 border-border/50 bg-background focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="city" className="text-xs font-medium text-muted-foreground">{isRTL ? 'المدينة' : 'City'}</Label>
                        <div className="relative group">
                          <MapPin className={cn("absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors", isRTL ? "right-3" : "left-3")} />
                          <Input
                            id="city"
                            placeholder={isRTL ? 'الرياض' : 'Riyadh'}
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            className={cn("h-10 text-sm rounded-lg border-2 border-border/50 bg-background focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all", isRTL ? "pr-9" : "pl-9")}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="country" className="text-xs font-medium text-muted-foreground">{isRTL ? 'الدولة' : 'Country'}</Label>
                        <div className="relative group">
                          <Globe className={cn("absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors", isRTL ? "right-3" : "left-3")} />
                          <Input
                            id="country"
                            placeholder="SA"
                            value={country}
                            onChange={(e) => setCountry(e.target.value)}
                            className={cn("h-10 text-sm rounded-lg border-2 border-border/50 bg-background focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all", isRTL ? "pr-9" : "pl-9")}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="storeName" className="text-xs font-medium text-muted-foreground">{isRTL ? 'اسم المتجر (اختياري)' : 'Store Name (Optional)'}</Label>
                      <Input
                        id="storeName"
                        placeholder={isRTL ? 'اسم المتجر' : 'Store Name'}
                        value={storeName}
                        onChange={(e) => setStoreName(e.target.value)}
                        className="h-10 text-sm rounded-lg border-2 border-border/50 bg-background focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="signup-password" className="text-sm font-medium">{isRTL ? 'كلمة المرور' : 'Password'}</Label>
                  <div className="relative group">
                    <Lock className={cn("absolute top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors", isRTL ? "right-3" : "left-3")} />
                    <Input
                      id="signup-password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      className={cn("h-11 rounded-xl border-2 border-border/50 bg-background focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all", isRTL ? "pr-10 pl-10" : "pl-10 pr-10")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className={cn("absolute top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors", isRTL ? "left-3" : "right-3")}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  
                  {password && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">{isRTL ? 'قوة كلمة المرور:' : 'Strength:'}</span>
                        <span className={cn("font-semibold", 
                          passwordStrength < 40 ? 'text-red-500' : 
                          passwordStrength < 70 ? 'text-yellow-500' : 
                          'text-green-500'
                        )}>
                          {getPasswordStrengthText()}
                        </span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div 
                          className={cn("h-full transition-all duration-500", getPasswordStrengthColor())}
                          style={{ width: `${passwordStrength}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium">{isRTL ? 'تأكيد كلمة المرور' : 'Confirm Password'}</Label>
                  <div className="relative group">
                    <Lock className={cn("absolute top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors", isRTL ? "right-3" : "left-3")} />
                    <Input
                      id="confirmPassword"
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={6}
                      className={cn("h-11 rounded-xl border-2 border-border/50 bg-background focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all", isRTL ? "pr-10" : "pl-10")}
                    />
                  </div>
                </div>

                {requestSubmitted ? (
                  <div className="w-full p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-center">
                    <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                      {isRTL ? 'تم إرسال طلب التسجيل بنجاح!' : 'Registration request submitted successfully!'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {isRTL ? 'سيتم إشعارك بالنتيجة عبر البريد الإلكتروني' : 'You will be notified via email'}
                    </p>
                  </div>
                ) : (
                  <Button 
                    type="submit" 
                    className="w-full h-12 text-base font-semibold rounded-xl gradient-primary text-white shadow-lg hover:shadow-glow transition-all mt-4"
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
                )}
              </form>

              <div className="mt-6 pt-6 border-t border-border/50">
                <p className="text-sm text-center text-muted-foreground flex items-center justify-center gap-1">
                  {isRTL ? 'لديك حساب بالفعل؟' : 'Already have an account?'}
                  <button 
                    onClick={onSwitchToLogin}
                    className="text-primary hover:text-primary/80 font-semibold hover:underline transition-colors"
                  >
                    {isRTL ? 'سجل الدخول' : 'Sign In'}
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
