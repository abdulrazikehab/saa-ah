import { toast } from 'sonner';
import { isErrorObject } from '@/lib/error-utils';
import { getProfessionalErrorMessage } from '@/lib/toast-errors';
import i18n from '@/i18n';
import { isMainDomain } from '@/lib/domain';

// Determine base URLs based on environment
const getBaseUrl = (defaultPort: string) => {
  // Check if we have environment variables
  let envUrl = defaultPort === '3001' 
    ? import.meta.env.VITE_AUTH_API_URL 
    : import.meta.env.VITE_CORE_API_URL;
  
  if (envUrl) {
    // Remove trailing slashes for consistency
    envUrl = envUrl.replace(/\/+$/, '');
    
    // Check if current page is loaded over HTTPS
    const isPageHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
    
    // If URL uses HTTPS but is an IP address, we need to handle mixed content
    // IP addresses typically don't have valid SSL certificates, but browsers
    // block HTTP requests from HTTPS pages (Mixed Content error)
    const ipv4Pattern = /^https?:\/\/(\d{1,3}\.){3}\d{1,3}(:\d+)?/;
    const isIpAddress = ipv4Pattern.test(envUrl);
    
    if (isIpAddress) {
      // If page is HTTPS, we must use HTTPS for the API (even if IP has no cert)
      // Otherwise browser will block it as Mixed Content
      if (isPageHttps && envUrl.startsWith('http://')) {
        console.warn(`Converting HTTP to HTTPS for IP address URL to avoid Mixed Content: ${envUrl}`);
        envUrl = envUrl.replace(/^http:\/\//, 'https://');
      }
      // If page is HTTP and API URL is HTTPS, we can downgrade to HTTP for IPs
      else if (!isPageHttps && envUrl.startsWith('https://')) {
        console.warn(`Converting HTTPS to HTTP for IP address URL: ${envUrl}`);
        envUrl = envUrl.replace(/^https:\/\//, 'http://');
      }
    }
    
    return envUrl;
  }
  
  // For local development, use localhost with the appropriate port
  // This works from both main domain and subdomains
  const isPageHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
  return isPageHttps ? `https://localhost:${defaultPort}` : `http://localhost:${defaultPort}`;
};

const AUTH_BASE_URL = getBaseUrl('3001');
const coreBaseUrl = getBaseUrl('3002');

// Handle CORE_BASE_URL - if it already ends with /api, use as is, otherwise append /api
// Production URL already includes /api (https://saeaa.net/api)
// Development needs /api appended (http://localhost:3002/api)
const CORE_BASE_URL = coreBaseUrl.endsWith('/api') 
  ? coreBaseUrl 
  : `${coreBaseUrl}${coreBaseUrl.endsWith('/') ? '' : '/'}api`;

export interface ApiOptions extends RequestInit {
  requireAuth?: boolean;
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
  
  // Create a synthetic error object for the helper if needed
  const errorObj = typeof messageOrError === 'object' && messageOrError
    ? { ...messageOrError as object, status }
    : { status, message: messageOrError };

  const { title, description } = getProfessionalErrorMessage(errorObj, undefined, isRTL);
  
  // Toast for valid user-facing errors (4xx, 5xx) except 404 (optional)
  // We toast 404s too as per "ALL errors" rule, unless it's a specific check?
  // User Rule: "All errors are shown using Toast". We will toast.
  if (status >= 400 && !hideToast) {
    // Avoid double toasting if the error message is generic? No.
    if (status === 401) {
      toast.warning(title, { description, duration: 5000 });
    } else {
      toast.error(title, { description, duration: 5000 });
    }
  }
  
  throw new ApiError(status, description, data);
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
  document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  document.cookie = 'refreshToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  document.cookie = 'user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
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
    // Production: https://saeaa.net/auth/refresh
    // Development: http://localhost:3001/auth/refresh
    // Ensure we don't double-append /auth if it's already in the base URL
    const baseUrl = AUTH_BASE_URL.replace(/\/$/, '');
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
  const { requireAuth = false, sessionId, adminApiKey, _retry = false, ...fetchOptions } = options;

  console.log('🌐 fetchApi called:', { url, method: fetchOptions.method || 'GET', sessionId, requireAuth });

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'X-Tenant-Domain': window.location.hostname,
    ...fetchOptions.headers,
  };

  // Attach current tenantId for multi-tenant APIs (helps when JWT token was
  // issued before market setup and doesn't contain tenantId yet)
  // For localhost development, use the logged-in user's tenantId for both dashboard and storefront
  try {
    const userCookie = getToken('user');
    if (userCookie) {
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
          console.log(`🏪 [API] Using tenant ID: ${String(tenantId).substring(0, 10)}...`);
        }
      } catch (e) {
        console.warn('⚠️ [API] Failed to parse user data for tenant ID:', e);
      }
    } else {
      // For storefront on localhost without logged-in user, try to get tenant from URL or default
      // In production, this would be resolved from subdomain by backend middleware
      const isStorefront = window.location.pathname.startsWith('/storefront') || 
                           window.location.pathname.startsWith('/store') ||
                           window.location.pathname === '/';
      
      if (isStorefront && window.location.hostname === 'localhost') {
        // For localhost storefront, try to get tenant from sessionStorage
        const storefrontTenantId = sessionStorage.getItem('storefrontTenantId');
        if (storefrontTenantId && storefrontTenantId !== 'default' && storefrontTenantId !== 'system') {
          (headers as Record<string, string>)['X-Tenant-Id'] = storefrontTenantId;
          console.log('🏪 [API] Using storefront tenant ID from session:', storefrontTenantId.substring(0, 20) + '...');
        } else {
          console.warn('⚠️ [API] Storefront on localhost without tenant ID - products may not load');
        }
      }
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
  const isCustomerEndpoint = (url.includes('/customers/') || url.includes('/auth/customers/')) && !url.includes('/dashboard/');
  // Special case: /merchant/employees can be accessed by both customers and shop owners
  // Exclude /merchant/internal/employees from this check as it is strictly for shop owners/merchants
  const isMerchantEmployeesEndpoint = url.includes('/merchant/employees') && !url.includes('/merchant/internal/employees');
  const isWalletEndpoint = url.includes('/merchant/wallet/');
  const isMerchantEndpoint = (url.includes('/merchant/') || url.includes('/api/merchant/') || url.includes('/dashboard/') || url.includes('/auth/staff/') || isProtectedPage) && !isMerchantEmployeesEndpoint && !isWalletEndpoint;
  
  let isCustomerRequest = false;
  let token: string | undefined = undefined;
  
  if (existingAuth) {
    // If Authorization is already set, check if it's using customerToken
    const existingToken = existingAuth.replace('Bearer ', '').trim();
    const storedCustomerToken = customerToken;
    isCustomerRequest = !!storedCustomerToken && existingToken === storedCustomerToken;
    token = undefined; // Don't override existing auth header
  } else {
    // No existing auth header, determine which token to use based on endpoint type
    if (isCustomerEndpoint) {
      // Customer endpoints: prefer customerToken, fallback to accessToken if customerToken not available
      token = customerToken || accessToken;
      isCustomerRequest = !!customerToken;
    } else if (isMerchantEmployeesEndpoint || isWalletEndpoint) {
      // Merchant employees or wallet endpoints: can use either customerToken or accessToken
      // Prefer customerToken if available (for customers), otherwise use accessToken (for shop owners)
      token = customerToken || accessToken;
      isCustomerRequest = !!customerToken;
    } else if (isMerchantEndpoint) {
      // Other merchant endpoints: ONLY use accessToken, never use customerToken
      token = accessToken;
      isCustomerRequest = false;
    } else {
      // Other endpoints: prefer accessToken, fallback to customerToken if accessToken not available
      token = accessToken || customerToken;
      isCustomerRequest = !accessToken && !!customerToken;
    }
  }
  
  if (token && !existingAuth) {
    const finalToken = cleanToken(token);
    (headers as Record<string, string>)['Authorization'] = `Bearer ${finalToken}`;
  }
  
  const currentToken = (headers as Record<string, string>)['Authorization'] || (headers as Record<string, string>)['authorization'];
  console.log(`🌐 fetchApi: Requesting ${url} with auth: ${currentToken ? currentToken.substring(0, 15) + '...' : 'none'}`);

  // CRITICAL: Before attempting refresh, do one final check for existing tokens
  // This handles race conditions where tokens were just set but weren't detected earlier
  if (requireAuth && !token && !existingAuth && !_retry && !adminApiKey) {
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

  if (sessionId) {
    headers['X-Session-ID'] = sessionId;
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

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      
      // Handle 401 Unauthorized with automatic token refresh
      if (response.status === 401) {
        console.log(`[API] 401 Unauthorized: ${url}, requireAuth: ${requireAuth}, _retry: ${_retry}, isCustomerRequest: ${isCustomerRequest}`);
        
        // For customer requests, don't try to refresh merchant tokens
        if (isCustomerRequest) {
          console.log('[API] Customer request failed with 401, clearing customer tokens only');
          document.cookie = 'customerToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
          document.cookie = 'customerData=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
          
          // Redirect to storefront login, not merchant login
          if (requireAuth && !window.location.pathname.includes('/auth/login') && !window.location.pathname.includes('/login')) {
            console.log('[API] Redirecting customer to storefront login');
            window.location.href = '/login';
          }
          throw new ApiError(401, i18n.t('common.sessionExpired'));
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
          console.log('[API] 401 on public endpoint, ignoring redirect');
          // Don't throw error for public endpoints - let the component handle it
          throw new ApiError(401, 'Unauthorized', data);
        }
      }

      let errorMessage = data.message || 'An error occurred';
      if (typeof errorMessage === 'object') {
        errorMessage = JSON.stringify(errorMessage);
      }
      
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
    console.log('🌐 fetchApi: Response headers X-Session-ID:', responseSessionId);
    console.log('🌐 fetchApi: Request sessionId:', sessionId);
    
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
  get: async <T = any>(url: string, options: ApiOptions = {}): Promise<T> => {
    const fullUrl = url.startsWith('http') ? url : `${CORE_BASE_URL}${url}`;
    return fetchApi(fullUrl, { ...options, method: 'GET' });
  },
  post: async <T = any>(url: string, data?: unknown, options: ApiOptions = {}): Promise<T> => {
    const fullUrl = url.startsWith('http') ? url : `${CORE_BASE_URL}${url}`;
    return fetchApi(fullUrl, {
      ...options,
      method: 'POST',
      body: data instanceof FormData ? data : JSON.stringify(data),
    });
  },
  put: async <T = any>(url: string, data?: unknown, options: ApiOptions = {}): Promise<T> => {
    const fullUrl = url.startsWith('http') ? url : `${CORE_BASE_URL}${url}`;
    return fetchApi(fullUrl, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
  delete: async <T = any>(url: string, options: ApiOptions = {}): Promise<T> => {
    const fullUrl = url.startsWith('http') ? url : `${CORE_BASE_URL}${url}`;
    return fetchApi(fullUrl, { ...options, method: 'DELETE' });
  },
  patch: async <T = any>(url: string, data?: unknown, options: ApiOptions = {}): Promise<T> => {
    const fullUrl = url.startsWith('http') ? url : `${CORE_BASE_URL}${url}`;
    return fetchApi(fullUrl, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
};
