import { toast } from 'sonner';
import { isErrorObject } from '@/lib/error-utils';

// Determine base URLs based on environment
const getBaseUrl = (defaultPort: string) => {
  // Check if we have environment variables
  const envUrl = defaultPort === '3001' 
    ? import.meta.env.VITE_AUTH_API_URL 
    : import.meta.env.VITE_CORE_API_URL;
  
  if (envUrl) {
    // Remove trailing slashes for consistency
    return envUrl.replace(/\/+$/, '');
  }
  
  // For local development, use localhost with the appropriate port
  // This works from both main domain and subdomains
  return `http://localhost:${defaultPort}`;
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
    const refreshUrl = AUTH_BASE_URL.includes('localhost') 
      ? `${AUTH_BASE_URL}/auth/refresh`
      : `${AUTH_BASE_URL}/refresh`;
    
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

  // If body is FormData, let the browser set the Content-Type header with boundary
  if (fetchOptions.body instanceof FormData) {
    delete headers['Content-Type'];
  }

  if (requireAuth) {
    // Try to get token from cookie first, then localStorage as fallback
    const cookieToken = getCookie('accessToken');
    const token = cookieToken || localStorage.getItem('accessToken');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
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

    console.log('🌐 fetchApi: Making request to', url, 'with headers:', { ...headers, Authorization: headers.Authorization ? 'Bearer ***' : undefined });
    
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
      if (response.status === 401 && requireAuth && !_retry) {
        if (isRefreshing) {
          // Wait for the ongoing refresh to complete
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          }).then(() => {
            // Retry the original request with new token
            return fetchApi(url, { ...options, _retry: true });
          });
        }

        isRefreshing = true;

        try {
          const newToken = await refreshAccessToken();
          
          if (newToken) {
            processQueue(null, newToken);
            isRefreshing = false;
            // Retry the original request with new token
            return fetchApi(url, { ...options, _retry: true });
          } else {
            processQueue(new Error('Token refresh failed'), null);
            isRefreshing = false;
            // Redirect to login
            window.location.href = '/auth/login';
            throw new ApiError(401, 'Session expired. Please login again.');
          }
        } catch (error) {
          processQueue(error instanceof Error ? error : new Error('Unknown error'), null);
          isRefreshing = false;
          window.location.href = '/auth/login';
          throw new ApiError(401, 'Session expired. Please login again.');
        }
      }

      let errorMessage = data.message || 'An error occurred';
      if (typeof errorMessage === 'object') {
        errorMessage = JSON.stringify(errorMessage);
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
    toast.error('تعذر الاتصال بالخادم. يرجى التحقق من اتصالك بالإنترنت.');
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
