import { toast } from 'sonner';
import { isErrorObject } from '@/lib/error-utils';
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
}

export class ApiError extends Error {
  constructor(public status: number, message: string, public data?: unknown) {
    super(message);
    this.name = 'ApiError';
  }
}

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
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
}

async function refreshAccessToken(): Promise<string | null> {
  // Check if we have a refresh token (cookie or localStorage)
  const refreshToken = getCookie('refreshToken') || localStorage.getItem('refreshToken');
  if (!refreshToken) {
    return null;
  }

  try {
    // Send refresh token in body only if not in cookie (fallback)
    const hasRefreshCookie = !!getCookie('refreshToken');
    const body = hasRefreshCookie ? undefined : JSON.stringify({ refreshToken });
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
      credentials: 'include', // Include cookies
      ...(body ? { body } : {}),
    });

    if (!response.ok) {
      throw new Error('Token refresh failed');
    }

    const data = await response.json();
    // Cookies are set by the server, but also store in localStorage as fallback
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    
    return data.accessToken;
  } catch (error) {
    // Clear both cookies and localStorage on error
    document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = 'refreshToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
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
  try {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsed = JSON.parse(storedUser) as { tenantId?: string | null };
      const tenantId = parsed?.tenantId;
      if (
        tenantId &&
        tenantId !== 'default' &&
        tenantId !== 'system'
      ) {
        (headers as Record<string, string>)['X-Tenant-Id'] = tenantId;
      }
    }
  } catch {
    // Ignore JSON/localStorage errors – request can still proceed without tenant header
  }

  // If body is FormData, let the browser set the Content-Type header with boundary
  if (fetchOptions.body instanceof FormData) {
    delete headers['Content-Type'];
  }

  // Always attach token if available, regardless of requireAuth
  // This allows public endpoints to benefit from auth context if it exists
  // Check if this is a customer request (using customerToken) or merchant request (using accessToken)
  const cookieToken = getCookie('accessToken');
  const accessToken = cookieToken || localStorage.getItem('accessToken');
  const customerToken = localStorage.getItem('customerToken');
  
  // Check if Authorization header is already set (e.g., by caller explicitly setting customerToken)
  const existingAuth = (headers as Record<string, string>)['Authorization'] || (headers as Record<string, string>)['authorization'];
  
  // Determine if this is a customer endpoint (should use customerToken) or merchant endpoint (should use accessToken)
  const isDashboardPage = typeof window !== 'undefined' && window.location.pathname.includes('/dashboard/');
  const isCustomerEndpoint = (url.includes('/customers/') || url.includes('/auth/customers/')) && !url.includes('/dashboard/');
  // Special case: /merchant/employees can be accessed by both customers and shop owners
  // Exclude /merchant/internal/employees from this check as it is strictly for shop owners/merchants
  const isMerchantEmployeesEndpoint = url.includes('/merchant/employees') && !url.includes('/merchant/internal/employees');
  const isWalletEndpoint = url.includes('/merchant/wallet/');
  const isMerchantEndpoint = (url.includes('/merchant/') || url.includes('/api/merchant/') || url.includes('/dashboard/') || url.includes('/auth/staff/') || isDashboardPage) && !isMerchantEmployeesEndpoint && !isWalletEndpoint;
  
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
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Add admin API key if provided (for System Admin Panel)
  if (adminApiKey) {
    headers['X-Admin-API-Key'] = adminApiKey;
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
          localStorage.removeItem('customerToken');
          localStorage.removeItem('customerData');
          
          // Redirect to storefront login, not merchant login
          if (requireAuth && !window.location.pathname.includes('/auth/login') && !window.location.pathname.includes('/login')) {
            console.log('[API] Redirecting customer to storefront login');
            window.location.href = '/auth/login';
          }
          throw new ApiError(401, i18n.t('common.sessionExpired'));
        }
        
        if (requireAuth && !_retry) {
          if (isRefreshing) {
            // Wait for the ongoing refresh to complete
            console.log('[API] Waiting for ongoing refresh...');
            return new Promise((resolve, reject) => {
              failedQueue.push({ resolve, reject });
            }).then(() => {
              // Retry the original request with new token (only once)
              return fetchApi(url, { ...options, _retry: true });
            });
          }

          isRefreshing = true;
          console.log('[API] Attempting token refresh...');

          try {
            const newToken = await refreshAccessToken();

            if (newToken) {
              processQueue(null, newToken);
              isRefreshing = false;
              console.log('[API] Refresh successful, retrying request...');
              return fetchApi(url, { ...options, _retry: true });
            } else {
              console.error('[API] Refresh failed: newToken is null');
              processQueue(new Error('Token refresh failed'), null);
              isRefreshing = false;
              
              // Clear invalid merchant tokens only (don't clear customer tokens)
              localStorage.removeItem('accessToken');
              localStorage.removeItem('refreshToken');
              document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
              document.cookie = 'refreshToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
              
              // Don't clear user data if we're on a dashboard page - let ProtectedRoute handle it
              const isDashboardPage = window.location.pathname.includes('/dashboard/');
              if (!isDashboardPage) {
                localStorage.removeItem('user');
              }

              // Only redirect if auth was strictly required and not on dashboard
              if (requireAuth && !window.location.pathname.includes('/auth/login') && !isDashboardPage) {
                console.log('[API] Redirecting to login (refresh failed)');
                window.location.href = '/auth/login';
              }
              throw new ApiError(401, i18n.t('common.sessionExpired'));
            }
          } catch (refreshError) {
            console.error('[API] Refresh failed:', refreshError);
            processQueue(refreshError instanceof Error ? refreshError : new Error('Unknown error'), null);
            isRefreshing = false;
            
            // Refresh failed, clear merchant tokens only (don't clear customer tokens)
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
            document.cookie = 'refreshToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
            
            // Don't clear user data if we're on a dashboard page - let ProtectedRoute handle it
            const isDashboardPage = window.location.pathname.includes('/dashboard/');
            if (!isDashboardPage) {
              localStorage.removeItem('user');
            }

            // Don't redirect from dashboard pages - let the ProtectedRoute handle it
            if (requireAuth && !window.location.pathname.includes('/auth/login') && !isDashboardPage) {
              console.log('[API] Redirecting to login (refresh error)');
              window.location.href = '/auth/login';
            }
            throw new ApiError(401, i18n.t('common.sessionExpired'));
          }
        } else if (requireAuth && _retry) {
          // If we get 401 after retry, don't try again
          console.log('[API] 401 after retry, clearing merchant tokens only');
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
          document.cookie = 'refreshToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
          
          // Don't clear user data if we're on a dashboard page - let ProtectedRoute handle it
          const isDashboardPage = window.location.pathname.includes('/dashboard/');
          if (!isDashboardPage) {
            localStorage.removeItem('user');
          }
          
          // Don't redirect from dashboard pages - let the ProtectedRoute handle it
          if (!window.location.pathname.includes('/auth/login') && !isDashboardPage) {
            console.log('[API] Redirecting to login (retry failed)');
            window.location.href = '/auth/login';
          }
          throw new ApiError(401, i18n.t('common.authFailed'));
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
        const forbiddenMessage = data.message || errorMessage || 'Access forbidden. Please ensure you have set up a market.';
        // Don't show toast for 403s - let the component handle it
        throw new ApiError(response.status, forbiddenMessage, data);
      }
      
      // Don't show toast for expected 404s on public endpoints
      if (response.status === 404 && !requireAuth) {
        // Silently handle 404s for public endpoints (like optional pages)
        throw new ApiError(response.status, errorMessage, data);
      }
      
      throw new ApiError(response.status, errorMessage, data);
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
    // Network errors - logged to backend error logs
    toast.error(i18n.t('common.networkError'));
    throw new ApiError(500, 'Network error');
  }
}

export const apiClient = {
  fetch: fetchApi,
  authUrl: AUTH_BASE_URL,
  coreUrl: CORE_BASE_URL,
  get: async (url: string, options: ApiOptions = {}) => {
    const fullUrl = url.startsWith('http') ? url : `${CORE_BASE_URL}${url}`;
    return fetchApi(fullUrl, { ...options, method: 'GET' });
  },
  post: async (url: string, data?: unknown, options: ApiOptions = {}) => {
    const fullUrl = url.startsWith('http') ? url : `${CORE_BASE_URL}${url}`;
    return fetchApi(fullUrl, {
      ...options,
      method: 'POST',
      body: data instanceof FormData ? data : JSON.stringify(data),
    });
  },
  put: async (url: string, data?: unknown, options: ApiOptions = {}) => {
    const fullUrl = url.startsWith('http') ? url : `${CORE_BASE_URL}${url}`;
    return fetchApi(fullUrl, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
  delete: async (url: string, options: ApiOptions = {}) => {
    const fullUrl = url.startsWith('http') ? url : `${CORE_BASE_URL}${url}`;
    return fetchApi(fullUrl, { ...options, method: 'DELETE' });
  },
  patch: async (url: string, data?: unknown, options: ApiOptions = {}) => {
    const fullUrl = url.startsWith('http') ? url : `${CORE_BASE_URL}${url}`;
    return fetchApi(fullUrl, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
};
