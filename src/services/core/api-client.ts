import { toast } from 'sonner';
import { isErrorObject } from '@/lib/error-utils';
import { getProfessionalErrorMessage } from '@/lib/toast-errors';
import i18n from '@/i18n';
import { isMainDomain } from '@/lib/domain';

// Determine base URLs based on environment
const getBaseUrl = (defaultPort: string) => {
  if (typeof window === 'undefined') return '';
  const hostname = window.location.hostname;
  const isProd = import.meta.env.PROD || import.meta.env.MODE === 'production';
  const platformSecondaryDomain = import.meta.env.VITE_PLATFORM_SECONDARY_DOMAIN || 'saeaa.net';
  const isLocal = hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.') || hostname.includes('nip.io') || hostname.endsWith('.localhost');

  // 1. DYNAMIC PRODUCTION ROUTING
  // If we are in production build OR on a non-local hostname, default to production API
  if (isProd || (!isLocal && hostname && hostname !== '::')) {
    // 1a. Explicit override via Environment Variables
    const envUrl = defaultPort === '3001' 
      ? import.meta.env.VITE_AUTH_API_URL 
      : import.meta.env.VITE_CORE_API_URL;
    
    if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
      return (envUrl as string).replace(/\/+$/, '');
    }
    
    // 1b. Default Platform Backend
    console.log(`🚀 [API] Routing to production ${platformSecondaryDomain} backend (Port: ${defaultPort})`);
    if (defaultPort === '3001') return `https://${platformSecondaryDomain}/auth`;
    return `https://${platformSecondaryDomain}/api`;
  }

  // 2. DEVELOPMENT / LOCAL NETWORK ROUTING
  // Handle local environment variables
  const devEnvUrl = defaultPort === '3001' 
    ? (import.meta.env.VITE_AUTH_API_URL || import.meta.env.VITE_AUTH_BASE_URL)
    : import.meta.env.VITE_CORE_API_URL;

  // Hybrid fix for Capacitor: If pointing to localhost from a native device, try to use current hostname
  const isNative = window.location.protocol === 'file:' || window.navigator.userAgent.includes('Capacitor');
  
  if (devEnvUrl) {
    const finalUrl = (devEnvUrl as string).replace(/\/+$/, '');
    
    // If we specifically set a non-localhost URL in dev (e.g. to test production backend), use it
    if (!finalUrl.includes('localhost') && !finalUrl.includes('127.0.0.1')) {
        return finalUrl;
    }

    if (isNative && (finalUrl.includes('localhost') || finalUrl.includes('127.0.0.1')) && hostname && hostname !== 'localhost') {
       return finalUrl.replace(/localhost|127\.0\.0\.1/g, hostname);
    }
    return finalUrl;
  }

  // Final fallback: Use current hostname (works for 192.168.x.x or nip.io)
  if (hostname && hostname !== 'localhost' && hostname !== '::') {
     const protocol = window.location.protocol === 'https:' ? 'https' : 'http';
     return `${protocol}://${hostname}:${defaultPort}`;
  }

  if (defaultPort === '3001') return `http://localhost:${defaultPort}/auth`;
  return `http://localhost:${defaultPort}`;
};

export const AUTH_BASE_URL = getBaseUrl('3001');
export const CORE_ROOT_URL = getBaseUrl('3002');

// Handle CORE_BASE_URL - if it already ends with /api, use as is, otherwise append /api
// Production URL already includes /api (https://kawn.net/api)
// Development needs /api appended (http://localhost:3002/api)
export const CORE_BASE_URL = CORE_ROOT_URL.endsWith('/api') 
  ? CORE_ROOT_URL 
  : `${CORE_ROOT_URL}${CORE_ROOT_URL.endsWith('/') ? '' : '/'}api`;

export interface ApiOptions extends RequestInit {
  requireAuth?: boolean;
  skipAuth?: boolean;
  sessionId?: string;
  adminApiKey?: string; // For System Admin Panel access
  _retry?: boolean; // Internal flag to prevent infinite retry loops
  timeout?: number;
  hideErrorToast?: boolean;
}

export class ApiError extends Error {
  constructor(public status: number, message: string, public data?: unknown) {
    super(message);
    this.name = 'ApiError';
  }
}

// Helper to toast and throw
const throwProfessionalError = (status: number, messageOrError: unknown, data?: unknown, hideToast: boolean = false) => {
  const isRTL = i18n.language === 'ar';
  
  // Extract original message for debugging
  const rawMessage = typeof messageOrError === 'string' ? messageOrError : (messageOrError as { message?: string })?.message;
  
  // Create a synthetic error object for the helper if needed
  const errorObj = typeof messageOrError === 'object' && messageOrError
    ? { ...messageOrError as object, status }
    : { status, message: messageOrError };

  const { title, description } = getProfessionalErrorMessage(errorObj, undefined, isRTL);
  
  // Toast for valid user-facing errors (4xx, 5xx) except 404 (optional)
  if (status >= 400 && !hideToast) {
    console.warn(`[API Error ${status}] Raw error object:`, errorObj);
    
    if (status === 401) {
      toast.warning(title, { description, duration: 5000 });
    } else {
      toast.error(title, { description, duration: 5000 });
    }
  }
  
  // Include original message in error for potential frontend use if description is too generic
  throw new ApiError(status, description, { ... (data as Record<string, unknown> || {}), originalMessage: rawMessage });
};

// Robust check for dashboard or setup pages to prevent redirect loops
const isDashboardOrSetup = () => {
  if (typeof window === 'undefined') return false;
  const path = window.location.pathname;
  const isDashboardPath = path === '/dashboard' || path.startsWith('/dashboard/') || path === '/setup' || path.startsWith('/setup/');
  const hasUser = !!localStorage.getItem('user');
  
  // Also consider it a protected page if we're on /login but have a user (we're in transition)
  return isDashboardPath || (hasUser && (path === '/login' || path === '/auth/login'));
};

const clearAuthData = (reason: string) => {
  console.warn(`[API] Clearing auth data. Reason: ${reason}`);
  // Merchant tokens
  document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  document.cookie = 'refreshToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  document.cookie = 'user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  
  // Customer tokens
  localStorage.removeItem('customerToken');
  localStorage.removeItem('customerData');
  localStorage.removeItem('storefrontTenantId');
  localStorage.removeItem('storefrontTenantSubdomain');
  sessionStorage.removeItem('storefrontTenantId');
};

let isRefreshing = false;
let failedQueue: Array<{ resolve: (value: unknown) => void; reject: (reason?: unknown) => void }> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  failedQueue = [];
};

// Helper function to get cookie value
function getCookie(name: string): string | null {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  // If multiple cookies exist, parts.length > 2. We take the last one.
  if (parts.length >= 2) {
    const val = parts.pop()?.split(';').shift() || null;
    return val ? decodeURIComponent(val) : null;
  }
  return null;
}

// Helper to get token from cookie or localStorage
function getToken(name: string): string | null {
  // Check localStorage first as it is more reliable for our explicitly managed frontend tokens
  const localVal = typeof window !== 'undefined' ? localStorage.getItem(name) : null;
  if (localVal) return localVal;
  
  // Fallback to cookie
  const cookieVal = getCookie(name);
  return cookieVal;
}

const cleanToken = (token: string) => token.replace(/^Bearer /i, '').trim();

async function refreshAccessToken(): Promise<string | null> {
  // Check if we have a refresh token in cookie or localStorage
  const refreshToken = getToken('refreshToken');
  if (!refreshToken) {
    return null;
  }

  try {
    // ALWAYS send refresh token in body to accommodate cross-domain requests 
    // where cookies might not be sent despite credentials: 'include'
    const body = JSON.stringify({ refreshToken });
    
    // Build refresh URL - handle both cases:
    // Production refresh URL
    // Development: http://localhost:3001/auth/refresh
    // Ensure we don't double-append /auth if it's already in the base URL
    const baseUrl = AUTH_BASE_URL.replace(/\/$/, '');
    // Ensure we hit the secondary platform domain even if the app is hosted on the primary domain (CORS handled by backend)
    const refreshUrl = baseUrl.endsWith('/auth') 
      ? `${baseUrl}/refresh`
      : `${baseUrl}/auth/refresh`;
    
    const response = await fetch(refreshUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Still include cookies as fallback/primary for same-domain
      body,
    });

    if (!response.ok) {
      // Check if it's a 401 - refresh token is invalid/expired
      if (response.status === 401) {
        console.warn('[API] Refresh token is invalid or expired (401)');
        const isProtectedPage = isDashboardOrSetup();
        
        // Only clear tokens if not on protected page - let user manually refresh page
        if (!isDashboardOrSetup()) {
          clearAuthData('Refresh token invalid (401)');
        } else {
          // On dashboard/setup - keep tokens, just return null
          console.warn('[API] Refresh token expired on protected page - user should refresh page manually');
        }
        return null;
      }
      throw new Error(`Token refresh failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Save new tokens if provided
    if (data.accessToken) {
      localStorage.setItem('accessToken', data.accessToken);
      document.cookie = `accessToken=${encodeURIComponent(data.accessToken)}; path=/; SameSite=Lax`;
    }
    if (data.refreshToken) {
      localStorage.setItem('refreshToken', data.refreshToken);
      document.cookie = `refreshToken=${encodeURIComponent(data.refreshToken)}; path=/; SameSite=Lax`;
    }

    return data.accessToken;
  } catch (error) {
    console.error('[API] Token refresh error:', error);
    
    // Only clear tokens if not on protected page
    if (!isDashboardOrSetup()) {
      clearAuthData('Refresh error caught');
    } else {
      // On dashboard - keep tokens, just return null
      console.warn('[API] Token refresh failed on protected page - keeping existing tokens');
    }
    return null;
  }
}

async function fetchApi(url: string, options: ApiOptions = {}) {
  const { requireAuth = false, skipAuth = false, sessionId, adminApiKey, _retry = false, ...fetchOptions } = options;

  const hostname = window.location.hostname;
  const isNativeApp = window.navigator.userAgent.includes('Capacitor') || window.location.protocol === 'file:';
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname.endsWith('.localhost');
  
  // DETERMINE TENANT DOMAIN FOR MOBILE/LOCAL
  let tenantDomain = hostname;
  
  // If we are on mobile (localhost) or dev, try to get the stored tenant domain
  if (isNativeApp || isLocalhost) {
    const storedDomain = localStorage.getItem('storefrontTenantSubdomain');
    const isRootLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
    
    // PRIORITY 1: Localhost Subdomain (e.g. ish7an.localhost) overrides everything
    if (hostname.endsWith('.localhost') && !isRootLocalhost) {
       const parts = hostname.split('.');
       if (parts.length > 1 && parts[0] !== 'www' && parts[0] !== 'admin') {
           // Map to productive domain format that the backend understands
           const platformDomain = import.meta.env.VITE_PLATFORM_DOMAIN || 'saeaa.com';
           tenantDomain = `${parts[0]}.${platformDomain}`;
           console.log('🏠 [API] Localhost subdomain mapped to:', tenantDomain);
       }
    } 
    // PRIORITY 2: Stored Domain (for Mobile App or Root Localhost)
    else if (storedDomain && (isNativeApp || isRootLocalhost)) {
      const platformDomain = import.meta.env.VITE_PLATFORM_DOMAIN || 'saeaa.com';
      tenantDomain = `${storedDomain}.${platformDomain}`;
      console.log('📱 [API] Mobile/Local: Using stored tenant domain:', tenantDomain);
    }
  }

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'X-Tenant-Domain': tenantDomain,
    'X-Requested-With': 'XMLHttpRequest',
    ...fetchOptions.headers,
  };

  // Attach current tenantId for multi-tenant APIs (helps when JWT token was
  // issued before market setup and doesn't contain tenantId yet)
  // For localhost development, use the logged-in user's tenantId for both dashboard and storefront
  try {
    const userCookie = getToken('user');
    // Helper to identify if we are on a platform domain (neutral context)
    // where we MUST rely on the user's stored tenantId because the URL doesn't tell us
    const isIpAddress = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname) && !hostname.endsWith('.nip.io');
    const isPlatformDomain = 
      hostname === 'localhost' || 
      hostname === '127.0.0.1' || 
      hostname.startsWith('app.') || 
      hostname.startsWith('www.') || 
      hostname.startsWith('admin.') ||
      isIpAddress;

    // Check if the current context (URL or determined domain) already explicitly defines a tenant.
    // If so, we should NOT send the X-Tenant-Id from the user object, because the user might
    // be logged in to a DIFFERENT store (cross-talk on localhost or shared device).
    // We want the Backend to trust the X-Tenant-Domain header (which matches the URL) instead.
    const isExplicitTenantContext = tenantDomain !== hostname || !isPlatformDomain;

    const isStorefront = window.location.pathname.startsWith('/storefront') || 
                           window.location.pathname.startsWith('/store') ||
                           window.location.pathname === '/';

    let tenantIdFound = false;

    // 1. PRIORITY: Storefront/Mobile App specific configuration
    if (isStorefront || isNativeApp) {
      // Check for tenantId in URL query params (Critical for cross-origin previews)
      const urlParams = new URLSearchParams(window.location.search);
      const paramTenantId = urlParams.get('tenantId');
      
      if (paramTenantId) {
         try {
             sessionStorage.setItem('storefrontTenantId', paramTenantId);
             localStorage.setItem('storefrontTenantId', paramTenantId);
         } catch { /* ignore */ }
      }

      // First try: Check for tenantId in URL query params (Critical for cross-origin previews)
      // When on an explicit subdomain, we should ONLY trust the URL parameter or the domain itself.
      // Using a stored ID from localStorage can lead to conflicts where one store's ID is used on another store's subdomain.
      const storefrontTenantId = paramTenantId || (isExplicitTenantContext ? undefined : (sessionStorage.getItem('storefrontTenantId') || localStorage.getItem('storefrontTenantId')));
      
      if (storefrontTenantId && storefrontTenantId !== 'default' && storefrontTenantId !== 'system') {
        (headers as Record<string, string>)['X-Tenant-Id'] = storefrontTenantId;
        console.log(`🏪 [API] Using storefront tenant ID: ${storefrontTenantId.substring(0, 8)}... (${paramTenantId ? 'URL Param' : 'Storage'})`);
        tenantIdFound = true;
      } 
      
      // If we are on an explicit subdomain but no tenantId was found yet, 
      // the backend will resolve it via X-Tenant-Domain header set above.
      if (!tenantIdFound && isExplicitTenantContext) {
        console.log('🏪 [API] No Storefront ID found - relying on X-Tenant-Domain resolution');
      }      
      // Also check for nip.io/localhost subdomain to update storage if valid (helps X-Tenant-Domain resolution next time)
      if (hostname.endsWith('.nip.io')) {
        const nipIoPattern = /^([a-z0-9-]+)\.\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\.nip\.io$/i;
        const match = hostname.match(nipIoPattern);
        if (match && match[1]) {
          const subdomain = match[1];
          try { localStorage.setItem('storefrontTenantSubdomain', subdomain); } catch { /* ignore */ }
          console.log('🏪 [API] Extracted subdomain from nip.io:', subdomain);
        }
      } else if (hostname.endsWith('.localhost')) {
          // Handle ish7an.localhost etc.
          const parts = hostname.split('.');
          if (parts.length > 1) {
              const subdomain = parts[0];
              // Ensure it's not 'www' or strictly reserved chars
              if (subdomain !== 'www' && subdomain !== 'admin') {
                  try { localStorage.setItem('storefrontTenantSubdomain', subdomain); } catch { /* ignore */ }
                   
                   if (!tenantIdFound) {
                       console.log('🏪 [API] Confirmed subdomain from localhost host:', subdomain);
                   }
              }
          }
      }
    }

    // 2. PRIORITY: User Cookie (for Dashboard on Platform Domain)
    // Only attach X-Tenant-Id from user token if we are in a neutral context (Platform Dashboard)
    // AND we haven't already explicitly identified the storefront tenant
    if (!tenantIdFound && (!isExplicitTenantContext || isDashboardOrSetup()) && userCookie) {
      // getToken might return an encoded string from cookie or raw JSON from localStorage
      let decoded = userCookie;
      try {
        // Robust multi-pass decoding
        while (decoded.includes('%')) {
          const nextDecoded = decodeURIComponent(decoded);
          if (nextDecoded === decoded) break;
          decoded = nextDecoded;
        }
        
        // Handle potential double-stringification
        let parsed = JSON.parse(decoded);
        if (typeof parsed === 'string') {
          parsed = JSON.parse(parsed);
        }
        
        const tenantId = parsed?.tenantId || parsed?.user?.tenantId;
        if (
          tenantId &&
          tenantId !== 'default' &&
          tenantId !== 'system'
        ) {
          (headers as Record<string, string>)['X-Tenant-Id'] = tenantId;
          console.log(`🏪 [API] Using tenant ID: ${String(tenantId).substring(0, 10)}... (Platform Context)`);
          tenantIdFound = true;
        }
      } catch (e) {
        console.warn('⚠️ [API] Failed to parse user data for tenant ID:', e);
      }
    } else if (!tenantIdFound && isExplicitTenantContext) {
       console.log(`🏪 [API] Skipping X-Tenant-Id from user (Explicit Tenant Context: ${tenantDomain})`);
    }

    // Warning for localhost development
    if (!tenantIdFound && (isStorefront || isNativeApp) && isLocalhost) {
        console.warn('⚠️ [API] Storefront on localhost without tenant ID - products may not load. (Try using "Switch to Mobile App" from Dashboard)');
    }
  } catch {
    // Ignore JSON/cookie errors – request can still proceed without tenant header
  }

  // If body is FormData, let the browser set the Content-Type header with boundary
  if (fetchOptions.body instanceof FormData) {
    delete headers['Content-Type'];
  }

  // Always attach token if available, regardless of requireAuth
  // This allows public endpoints to benefit from auth context if it exists
  // Check if this is a customer request (using customerToken) or merchant request (using accessToken)
  const accessToken = getToken('accessToken');
  const customerToken = getToken('customerToken');
  
  // Check if Authorization header is already set (e.g., by caller explicitly setting customerToken)
  const existingAuth = (headers as Record<string, string>)['Authorization'] || (headers as Record<string, string>)['authorization'];
  
  // Determine if this is a customer endpoint (should use customerToken) or merchant endpoint (should use accessToken)
  const isProtectedPage = isDashboardOrSetup();
  const isCustomerEndpoint =
    (
      url.includes('/customers/') ||
      url.includes('/auth/customers/') ||
      url.includes('/customer/') || // e.g. /customer/inventory
      url.includes('/wallet/') // storefront wallet endpoints
    ) && !url.includes('/dashboard/');
  // Special case: /merchant/employees can be accessed by both customers and shop owners
  // Exclude /merchant/internal/employees from this check as it is strictly for shop owners/merchants
  const isMerchantEmployeesEndpoint = url.includes('/merchant/employees') && !url.includes('/merchant/internal/employees');
  const isWalletEndpoint = url.includes('/merchant/wallet/');
  const isMerchantEndpoint = (url.includes('/merchant/') || url.includes('/api/merchant/') || url.includes('/dashboard/') || url.includes('/auth/staff/') || isProtectedPage) && !isMerchantEmployeesEndpoint && !isWalletEndpoint;
  
  let isCustomerRequest = false;
  let token: string | undefined = undefined;
  
  // ONLY ATTACH TOKENS IF NOT SKIPPED
  if (!skipAuth) {
    if (existingAuth) {
      // If Authorization is already set, check if it's using customerToken
      const existingToken = existingAuth.replace('Bearer ', '').trim();
      const storedCustomerToken = customerToken;
      isCustomerRequest = !!storedCustomerToken && existingToken === storedCustomerToken;
      token = undefined; // Don't override existing auth header
    } else {
      // No existing auth header, determine which token to use based on endpoint type
      // Storefront rule: if we're not on dashboard/setup and customerToken exists,
      // prefer customer identity for non-merchant endpoints (orders, wallet, customer inventory, etc).
      // This prevents accidental use of a leftover merchant accessToken in storefront.
      const isStorefrontContext = !isProtectedPage;
      const userStr = getToken('user');
      let merchantTenantId: string | undefined = undefined;
      
      if (userStr) {
        try {
          let decoded = userStr;
          while (decoded.includes('%')) { decoded = decodeURIComponent(decoded); }
          let parsed = JSON.parse(decoded);
          if (typeof parsed === 'string') parsed = JSON.parse(parsed);
          merchantTenantId = parsed?.tenantId || parsed?.user?.tenantId;
        } catch { /* ignore */ }
      }

      const customerDataRaw = localStorage.getItem('customerData');
      let customerTenantId: string | undefined = undefined;
      let customerTenantSubdomain: string | undefined = undefined;
      if (customerDataRaw) {
        try {
          const parsed = JSON.parse(customerDataRaw);
          customerTenantId = parsed?.tenantId;
          customerTenantSubdomain = parsed?.tenantSubdomain || parsed?.tenant?.subdomain;
        } catch { /* ignore */ }
      }

      // If we are in an explicit tenant context, but the token is for a DIFFERENT tenant,
      // we must NOT send the token to avoid cross-tenant data leaks/conflicts.
      const currentTenantId = (headers as Record<string, string>)['X-Tenant-Id'];
      const currentSubdomain = (headers as Record<string, string>)['X-Tenant-Domain'] || (headers as Record<string, string>)['X-Subdomain'];
      
      const hasMerchantConflict = currentTenantId && merchantTenantId && currentTenantId !== merchantTenantId && !isDashboardOrSetup();
      const hasCustomerConflict = (currentTenantId && customerTenantId && currentTenantId !== customerTenantId) ||
                                  (currentSubdomain && customerTenantSubdomain && currentSubdomain !== customerTenantSubdomain);

      if (isStorefrontContext && !isMerchantEndpoint && customerToken && !hasCustomerConflict) {
        token = customerToken;
        isCustomerRequest = true;
      } else if (isCustomerEndpoint && !isProtectedPage) {
        // Customer endpoints: prefer customerToken, fallback to accessToken if customerToken not available
        token = (customerToken && !hasCustomerConflict) ? customerToken : (hasMerchantConflict ? undefined : accessToken);
        isCustomerRequest = !!customerToken && !hasCustomerConflict;
      } else if (isMerchantEmployeesEndpoint || isWalletEndpoint) {
        // Merchant employees or wallet endpoints: can use either customerToken or accessToken
        // Prefer customerToken if available (for customers), otherwise use accessToken (for shop owners)
        token = (customerToken && !hasCustomerConflict) ? customerToken : (hasMerchantConflict ? undefined : accessToken);
        isCustomerRequest = !!customerToken && !hasCustomerConflict;
      } else if (isMerchantEndpoint) {
        // Other merchant endpoints: ONLY use accessToken, never use customerToken
        // Re-allow if on dashboard regardless of conflict (dashboard handles its own context)
        token = (hasMerchantConflict && !isDashboardOrSetup()) ? undefined : accessToken;
        isCustomerRequest = false;
      } else {
        // Other endpoints: prefer accessToken, fallback to customerToken if accessToken not available
        token = (hasMerchantConflict ? undefined : accessToken) || (customerToken && !hasCustomerConflict ? customerToken : undefined);
        isCustomerRequest = !accessToken && !!customerToken && !hasCustomerConflict;
      }
    }
  
    if (token && !existingAuth) {
      const finalToken = cleanToken(token);
      (headers as Record<string, string>)['Authorization'] = `Bearer ${finalToken}`;
    }
  }
  
  const currentToken = (headers as Record<string, string>)['Authorization'] || (headers as Record<string, string>)['authorization'];
  console.log(`🌐 fetchApi: Requesting ${url} with auth: ${currentToken ? currentToken.substring(0, 15) + '...' : 'none'}`);

  // CRITICAL: Before attempting refresh, do one final check for existing tokens
  // This handles race conditions where tokens were just set but weren't detected earlier
  if (requireAuth && !token && !existingAuth && !_retry && !adminApiKey && !skipAuth) {
    const immediateAccessToken = getToken('accessToken');
    const immediateCustomerToken = getToken('customerToken');
    
    if (immediateAccessToken || immediateCustomerToken) {
      console.log('✅ fetchApi: Found token on immediate re-check before refresh, using it');
      token = immediateAccessToken || immediateCustomerToken;
      const finalToken = cleanToken(token);
      (headers as Record<string, string>)['Authorization'] = `Bearer ${finalToken}`;
    }
  }

  // If requireAuth is true but no token is available, try to refresh token first
  if (requireAuth && !token && !existingAuth && !_retry && !adminApiKey) {
    console.warn('⚠️ fetchApi: No token available, attempting refresh...', {
      url,
      requireAuth,
      hasAccessToken: !!accessToken,
      hasCustomerToken: !!customerToken,
      isMerchantEndpoint,
      isCustomerEndpoint
    });
    
    // Try to refresh token only if we have a refresh token
    const refreshToken = getToken('refreshToken');
    if (refreshToken) {
      try {
        const refreshedToken = await refreshAccessToken();
        if (refreshedToken) {
          console.log('✅ Token refreshed successfully, retrying request');
          // Retry the request - token will be read from localStorage on retry
          return fetchApi(url, { ...options, _retry: true });
        } else {
          // Refresh failed - check if we still have an access token (might still be valid)
          const newAccessToken = getToken('accessToken');
          if (newAccessToken) {
            console.log('✅ Refresh failed but found existing access token, retrying request');
            return fetchApi(url, { ...options, _retry: true });
          }
        }
      } catch (refreshError) {
        console.error('❌ Token refresh failed:', refreshError);
        // Check if we still have an access token despite refresh failure
        const newAccessToken = getToken('accessToken');
        if (newAccessToken) {
          console.log('✅ Refresh error but found existing access token, retrying request');
          return fetchApi(url, { ...options, _retry: true });
        }
      }
    }
    
    // After all refresh attempts, re-check for any available token
    // This handles the case where accessToken exists but wasn't used initially
    const finalAccessToken = getToken('accessToken');
    const finalCustomerToken = getToken('customerToken');
    
    if (finalAccessToken || finalCustomerToken) {
      console.log('✅ Using existing token after refresh attempts failed');
      // Use the existing access token and continue with the request
      token = finalAccessToken || finalCustomerToken;
    } else {
      // No token available at all - throw error
      const errorMessage = 'Authentication required. Please log in again.';
      console.error('❌ fetchApi: Authentication required but no token available after refresh attempt', {
        url,
        requireAuth
      });
      throw new ApiError(401, errorMessage, { code: 'AUTH_REQUIRED', url });
    }
  } else if (requireAuth && !token && !existingAuth && _retry && !adminApiKey) {
    // Already tried refresh, but before throwing error, check one more time for token
    const finalAccessToken = getToken('accessToken');
    const finalCustomerToken = getToken('customerToken');
    
    if (finalAccessToken || finalCustomerToken) {
      console.log('✅ Found token on retry attempt, using it');
      token = finalAccessToken || finalCustomerToken;
    } else {
      // Definitely no token available - throw error
      const errorMessage = 'Authentication required. Please log in again.';
      throw new ApiError(401, errorMessage, { code: 'AUTH_REQUIRED', url });
    }
  }
  
  if (token && !existingAuth) {
    const finalToken = cleanToken(token);
    (headers as Record<string, string>)['Authorization'] = `Bearer ${finalToken}`;
  }

  // Add admin API key if provided (for System Admin Panel)
  if (adminApiKey) {
    headers['X-Admin-API-Key'] = adminApiKey;
    console.log('🔑 Using admin API key for authentication (skipping JWT token requirement)');
  } else if (requireAuth && url.includes('/admin/master/')) {
    // Log warning if admin endpoint is accessed without admin API key
    console.warn('⚠️ Admin endpoint accessed without admin API key:', url);
  }

  // Determine final sessionId: use explicit option OR fallback to localStorage
  const finalSessionId = sessionId || (typeof window !== 'undefined' ? localStorage.getItem('guestSessionId') : undefined);

  if (finalSessionId) {
    (headers as Record<string, string>)['X-Session-ID'] = finalSessionId;
  }

  // DEBUGGING: Log cart/auth headers specifically
  if (url.includes('cart') || url.includes('items') || url.includes('auth')) {
    console.log('🛒 [API-CART-DEBUG] Request:', {
      method: fetchOptions.method || 'GET',
      url,
      tenantDomain: (headers as Record<string, string>)['X-Tenant-Domain'],
      sessionId: (headers as Record<string, string>)['X-Session-ID'],
      isGuest: !token
    });
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), fetchOptions.timeout || 60000);

    // Safely extract Authorization header for logging
    const headersObj = headers as Record<string, string>;
    const authHeader = headersObj['Authorization'] || headersObj['authorization'];
    console.log('🌐 fetchApi: Making request to', url, 'with headers:', { 
      ...headersObj, 
      Authorization: authHeader ? 'Bearer ***' : undefined 
    });
    
    const response = await fetch(url, {
      ...fetchOptions,
      headers,
      credentials: options.credentials || 'include', // Include cookies in requests (can be overridden)
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    console.log('🌐 fetchApi: Response received:', { status: response.status, statusText: response.statusText, url });

    // DEBUGGING: Log cart response data
    if (url.includes('cart') && response.ok) {
       const clone = response.clone();
       clone.json().then(data => {
         console.log('🛒 [API-CART-DEBUG] Response Data:', data);
       }).catch(() => {});
    }

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      const errorMessage = data?.message || 'An error occurred';
      
      // Handle 401 Unauthorized with automatic token refresh
      if (response.status === 401) {
        // If request used admin API key, do NOT try to refresh user token or redirect
        if (adminApiKey) {
          console.warn('[API] 401 with adminApiKey - skipping auto-refresh/redirect');
          throwProfessionalError(401, 'Invalid Admin API Key', data, options.hideErrorToast);
        }

        console.log(`[API] 401 Unauthorized: ${url}, requireAuth: ${requireAuth}, _retry: ${_retry}, isCustomerRequest: ${isCustomerRequest}`);
        
        // For customer requests, don't try to refresh merchant tokens
        if (isCustomerRequest) {
          console.log('[API] Customer request failed with 401, clearing customer tokens only');
          localStorage.removeItem('customerToken');
          localStorage.removeItem('customerData');
          document.cookie = 'customerToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
          document.cookie = 'customerData=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
          
          // Only redirect if we're NOT already on login/auth pages to prevent infinite loops
          const currentPath = window.location.pathname;
          const isOnAuthPage = currentPath === '/login' || 
                                currentPath === '/auth/login' || 
                                currentPath === '/signup' || 
                                currentPath === '/auth/signup' ||
                                currentPath.includes('/login') ||
                                currentPath.includes('/auth/');
          
          if (requireAuth && !isOnAuthPage) {
            console.log('[API] Redirecting customer to storefront login');
            // Use replace to prevent adding to history
            window.location.replace('/login');
          } else if (isOnAuthPage) {
            console.log('[API] Already on auth page, skipping redirect to prevent loop');
          }
           // Use backend message if available, otherwise fallback
          const msg = errorMessage || i18n.t('common.sessionExpired');
          throw new ApiError(401, msg);
        }
        
        if (requireAuth && !_retry) {
          if (isRefreshing) {
            // Wait for the ongoing refresh to complete
            console.log('[API] Waiting for ongoing refresh...');
            return new Promise((resolve, reject) => {
              failedQueue.push({ resolve, reject });
            }).then((newToken) => {
              // Retry with explicitly provided token from the refresh process
              const retryHeaders = {
                ...(options.headers || {}),
                'Authorization': `Bearer ${newToken}`
              };
              return fetchApi(url, { ...options, headers: retryHeaders, _retry: true });
            });
          }

          isRefreshing = true;
          console.log('[API] Attempting token refresh...');

          try {
            const newToken = await refreshAccessToken();

            if (newToken) {
              isRefreshing = false;
              processQueue(null, newToken);
              
              // Validate that new token is actually different from the old one to prevent infinite loops
              const currentTokenRaw = getToken('accessToken');
              if (currentTokenRaw && newToken === currentTokenRaw && _retry) {
                console.error('[API] Refresh returned same token as before, assuming session invalid');
                clearAuthData('Refresh loop detected (same token)');
                window.location.href = '/login';
                throw new ApiError(401, 'Session invalid');
              }
              
              console.log('[API] Refresh successful, retrying original request...');
              
              // Add new token to headers for the immediate retry
              // Ensure we clean the token to avoid double "Bearer" prefix
              const finalNewToken = cleanToken(newToken);
              
              const retryHeaders = {
                ...headers,
                'Authorization': `Bearer ${finalNewToken}`
              };
              
              // Update localStorage immediately to ensure subsequent parallel requests pick it up
              if (cleanToken(newToken) !== cleanToken(currentTokenRaw || '')) {
                 localStorage.setItem('accessToken', finalNewToken);
              }
              
              return fetchApi(url, { ...options, headers: retryHeaders, _retry: true });
            } else {
              console.error('[API] Refresh failed: newToken is null');
              processQueue(new Error('Token refresh failed'), null);
              isRefreshing = false;
              
                // Check if we're on dashboard or setup - if so, don't clear tokens or redirect
                if (!isDashboardOrSetup()) {
                  // Only clear tokens if not on protected page
                  clearAuthData('Token refresh failed (null response)');

                  // Only redirect if not already on login page
                  if (requireAuth && !window.location.pathname.includes('/auth/login') && !window.location.pathname.includes('/login')) {
                    console.log('[API] Redirecting to login (refresh failed)');
                    window.location.href = '/login';
                  }
                } else {
                  // On protected page - just throw error, don't clear tokens or redirect
                  console.warn('[API] Token refresh failed on protected page - user should manually refresh page');
                }
              
              throwProfessionalError(401, i18n.t('common.sessionExpired'), undefined, options.hideErrorToast);
            }
          } catch (refreshError: unknown) {
            console.error('[API] Refresh failed:', refreshError);
            processQueue(refreshError instanceof Error ? refreshError : new Error('Unknown error'), null);
            isRefreshing = false;
            
            // Don't redirect on network/CORS errors - backend might be down
            const err = refreshError as { isNetworkError?: boolean; status?: number };
            if (err?.isNetworkError || err?.status === 0) {
              console.warn('[API] Network error during refresh - not redirecting');
              throw new ApiError(0, 'Network error during token refresh');
            }
            
            // Check if we're on dashboard/setup - if so, don't clear tokens or redirect
            if (!isDashboardOrSetup()) {
              // Only clear tokens if not on protected page
              clearAuthData('Refresh error caught in fetchApi');

              // Only redirect if not already on login page
              if (requireAuth && !window.location.pathname.includes('/auth/login') && !window.location.pathname.includes('/login')) {
                console.log('[API] Redirecting to login (refresh error)');
                window.location.href = '/login';
              }
            } else {
              // On protected page - don't clear tokens or redirect, just throw error
              console.warn('[API] Token refresh failed on protected page - user should manually refresh page');
            }
            
            throwProfessionalError(401, i18n.t('common.sessionExpired'), undefined, options.hideErrorToast);
          }
        } else if (requireAuth && _retry) {
          // If we get 401 after retry, don't try again
          console.log('[API] 401 after retry');
          
          // Don't clear user data if we're on a dashboard page - let ProtectedRoute handle it
          if (!isDashboardOrSetup()) {
            clearAuthData('Retry failed (401 after retry)');
            
            // Don't redirect from dashboard pages - let the ProtectedRoute handle it
            if (!window.location.pathname.includes('/auth/login') && !window.location.pathname.includes('/login')) {
              console.log('[API] Redirecting to login (retry failed)');
              window.location.href = '/login';
            }
          }
          throwProfessionalError(401, i18n.t('common.authFailed'), undefined, options.hideErrorToast);
        } else if (!requireAuth) {
          console.log('[API] 401 on public endpoint, checking strategy');
          
          // CRITICAL FIX: If we sent auth opportunistically but got 401, it means the token is invalid
          // (possibly for this specific tenant). Since auth wasn't required, we should retry WITHOUT auth.
          const headersObj = headers as Record<string, string>;
          const sentAuth = headersObj['Authorization'] || headersObj['authorization'];
          
          if (sentAuth && !_retry) {
             console.log('[API] 401 on public endpoint with auth - clearing invalid token and retrying as guest');
             // Clear the invalid token (probably from a different tenant)
             clearAuthData('401 on public endpoint with opportunistic auth');
             // Retry without auth by forcing skipAuth=true
             return fetchApi(url, { ...options, _retry: true, skipAuth: true }); 
          }
          
          // If we haven't retried yet and we have a token (and didn't already send it?? unlikely), try to refresh it
          // OR if we sent it, retried without it, and got 401 again? No, we would be in !sentAuth block.
          
          // Keep existing logic for refresh attempts only if we didn't just fail with auth
          if (!_retry && (getToken('accessToken') || getToken('refreshToken'))) {
             console.log('[API] Public endpoint 401, attempting refresh/retry as fallback');
             return new Promise((resolve, reject) => {
                if (isRefreshing) {
                   failedQueue.push({ resolve, reject });
                } else {
                   isRefreshing = true;
                   refreshAccessToken().then((newToken) => {
                      isRefreshing = false;
                      processQueue(null, newToken);
                      if (newToken) {
                         // Retry with new token
                         const retryHeaders = {
                            ...(options.headers || {}),
                            'Authorization': `Bearer ${cleanToken(newToken)}`
                         };
                         // Force requireAuth=true on retry to ensure we attach the token
                         resolve(fetchApi(url, { ...options, headers: retryHeaders, _retry: true, requireAuth: true }));
                      } else {
                         // Refresh failed, retry without auth
                         console.log('[API] Refresh failed for public endpoint, retrying as guest');
                         resolve(fetchApi(url, { ...options, _retry: true, skipAuth: true }));
                      }
                   }).catch((err) => {
                      isRefreshing = false;
                      processQueue(err, null);
                      // On error, retry without auth
                      console.log('[API] Refresh error for public endpoint, retrying as guest');
                      resolve(fetchApi(url, { ...options, _retry: true, skipAuth: true }));
                   });
                }
             });
          }
          
          console.log('[API] 401 on public endpoint, ignoring redirect');
          // Don't throw error for public endpoints - let the component handle it
          throw new ApiError(401, 'Unauthorized', data);
        }
      }

      
      // Don't stringify objects/arrays - pass them through raw so components can parse structured errors
      // e.g. NestJS ValidationPipe returns { message: ["error1", "error2"] } which is an object
      // errorMessage is already defined at the beginning of this block (line ~544)
      
      // Handle 403 Forbidden - tenant/market not set up
      if (response.status === 403) {
        // Use the already sanitized errorMessage
        const forbiddenMessage = errorMessage || 'Access forbidden. Please ensure you have set up a market.';
        console.error('❌ 403 Forbidden error:', { forbiddenMessage, data, url });
        // Don't show toast for 403s - let the component handle it
        throwProfessionalError(response.status, forbiddenMessage, data, options.hideErrorToast);
      }
      
      // Don't show toast for expected 404s on public endpoints
      if (response.status === 404 && !requireAuth) {
        // Silently handle 404s for public endpoints (like optional pages)
        throwProfessionalError(response.status, errorMessage, data, options.hideErrorToast);
      }
      
      throwProfessionalError(response.status, errorMessage, data, options.hideErrorToast);
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return null;
    }

    // Capture session ID from response header if present
    const responseSessionId = response.headers.get('X-Session-ID');
    if (url.includes('cart') || url.includes('auth')) {
      console.log('🌐 fetchApi: Response headers X-Session-ID:', responseSessionId);
      console.log('🌐 fetchApi: Effective sessionId used:', finalSessionId);
    }
    
    if (responseSessionId) {
      // Always update localStorage with the sessionId from server
      const currentStored = localStorage.getItem('guestSessionId');
      if (currentStored !== responseSessionId) {
        console.log('🌐 fetchApi: Updating localStorage sessionId:', { old: currentStored, new: responseSessionId });
        localStorage.setItem('guestSessionId', responseSessionId);
      }
    }

    let responseData;
    try {
      responseData = await response.json();
    } catch (jsonError) {
      // If JSON parsing fails, return null
      return null;
    }

    // Check if response is an error object (NestJS error format)
    if (responseData && typeof responseData === 'object') {
      // CRITICAL: If it's an error object, ALWAYS throw - never return it
      if (isErrorObject(responseData)) {
        const errorMessage = typeof responseData.message === 'string' 
          ? responseData.message 
          : (typeof responseData.message === 'object' ? JSON.stringify(responseData.message) : 'An error occurred');
        const statusCode = responseData.statusCode || 500;
        throw new ApiError(statusCode, errorMessage, responseData);
      }
      
      // Automatic unwrapping of TransformInterceptor format
      // Backend returns { success: true, data: T, message: string }
      if ('success' in responseData && 'data' in responseData) {
        const unwrappedData = responseData.data;
        // CRITICAL: Double-check unwrapped data is not an error object
        if (unwrappedData && isErrorObject(unwrappedData)) {
          const errorMessage = typeof unwrappedData.message === 'string' 
            ? unwrappedData.message 
            : (typeof unwrappedData.message === 'object' ? JSON.stringify(unwrappedData.message) : 'An error occurred');
          throw new ApiError(unwrappedData.statusCode || 500, errorMessage, unwrappedData);
        }
        // Validate unwrapped data is not an array containing error objects
        if (Array.isArray(unwrappedData)) {
          const filtered = unwrappedData.filter(item => !isErrorObject(item));
          return filtered.length === unwrappedData.length ? unwrappedData : filtered;
        }
        return unwrappedData;
      }
    }

    // Final safety check: if responseData itself is an error object, throw
    if (isErrorObject(responseData)) {
      const errorMessage = typeof responseData.message === 'string' 
        ? responseData.message 
        : (typeof responseData.message === 'object' ? JSON.stringify(responseData.message) : 'An error occurred');
      throw new ApiError(responseData.statusCode || 500, errorMessage, responseData);
    }

    console.log('🌐 fetchApi: Response data:', responseData);
    return responseData;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
// Network/CORS errors
    console.error('[API] Network/CORS error:', error);
    throwProfessionalError(0, error, undefined, options.hideErrorToast);
  }
}

// Export token refresh function for use before long operations
export async function ensureFreshToken(): Promise<boolean> {
  try {
    // First check if we already have a valid access token
    const existingToken = getCookie('accessToken');
    if (existingToken) {
      // We have a token - check if it's still valid by trying to decode it (basic check)
      try {
        // Basic JWT validation - check if token has 3 parts (header.payload.signature)
        const parts = existingToken.split('.');
        if (parts.length === 3) {
          // Try to decode payload to check expiration
          const payload = JSON.parse(atob(parts[1]));
          const exp = payload.exp;
          if (exp && exp * 1000 > Date.now() + 60000) {
            // Token is valid and won't expire in the next minute
            console.log('[API] Existing access token is still valid, no refresh needed');
            return true;
          }
        }
      } catch (decodeError) {
        // Token might be invalid format, try to refresh anyway
        console.warn('[API] Could not validate existing token, attempting refresh');
      }
    }
    
    // No valid token or token expiring soon - try to refresh
    const refreshToken = getCookie('refreshToken') || localStorage.getItem('refreshToken');
    if (!refreshToken) {
      console.log('[API] No refresh token available');
      // If we have an access token even if refresh token is missing, return true
      return !!existingToken;
    }
    
    // Try to refresh the token
    const newToken = await refreshAccessToken();
    if (newToken) {
      console.log('[API] Token refreshed successfully before operation');
      return true;
    }
    
    // Refresh failed but we might still have a valid access token
    if (existingToken) {
      console.warn('[API] Refresh failed but existing access token might still be valid');
      return true; // Return true to allow the operation to proceed
    }
    
    return false;
  } catch (error) {
    console.error('[API] Failed to refresh token:', error);
    // Check if we have an existing token as fallback
    const existingToken = getCookie('accessToken');
    return !!existingToken; // Return true if we have any token, false otherwise
  }
}

export const apiClient = {
  fetch: fetchApi,
  authUrl: AUTH_BASE_URL,
  coreUrl: CORE_BASE_URL,
  ensureFreshToken,
  get: async <T = unknown>(url: string, options: ApiOptions = {}): Promise<T> => {
    const fullUrl = url.startsWith('http') ? url : `${CORE_BASE_URL}${url}`;
    return fetchApi(fullUrl, { ...options, method: 'GET' });
  },
  post: async <T = unknown>(url: string, data?: unknown, options: ApiOptions = {}): Promise<T> => {
    const fullUrl = url.startsWith('http') ? url : `${CORE_BASE_URL}${url}`;
    return fetchApi(fullUrl, {
      ...options,
      method: 'POST',
      body: data instanceof FormData ? data : JSON.stringify(data),
    });
  },
  put: async <T = unknown>(url: string, data?: unknown, options: ApiOptions = {}): Promise<T> => {
    const fullUrl = url.startsWith('http') ? url : `${CORE_BASE_URL}${url}`;
    return fetchApi(fullUrl, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
  delete: async <T = unknown>(url: string, options: ApiOptions = {}): Promise<T> => {
    const fullUrl = url.startsWith('http') ? url : `${CORE_BASE_URL}${url}`;
    return fetchApi(fullUrl, { ...options, method: 'DELETE' });
  },
  patch: async <T = unknown>(url: string, data?: unknown, options: ApiOptions = {}): Promise<T> => {
    const fullUrl = url.startsWith('http') ? url : `${CORE_BASE_URL}${url}`;
    return fetchApi(fullUrl, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
};
