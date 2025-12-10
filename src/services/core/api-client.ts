import { toast } from 'sonner';

// Determine base URLs based on environment
const getBaseUrl = (defaultPort: string) => {
  // Check if we have environment variables
  const envUrl = defaultPort === '3001' 
    ? import.meta.env.VITE_AUTH_API_URL 
    : import.meta.env.VITE_CORE_API_URL;
  
  if (envUrl) return envUrl;
  
  // For local development, use localhost with the appropriate port
  // This works from both main domain and subdomains
  return `http://localhost:${defaultPort}`;
};

const AUTH_BASE_URL = getBaseUrl('3001');
const baseUrl = getBaseUrl('3002');
const CORE_BASE_URL = baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`;

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

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) {
    return null;
  }

  try {
    const response = await fetch(`${AUTH_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      throw new Error('Token refresh failed');
    }

    const data = await response.json();
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    
    return data.accessToken;
  } catch (error) {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    return null;
  }
}

async function fetchApi(url: string, options: ApiOptions = {}) {
  const { requireAuth = false, sessionId, adminApiKey, _retry = false, ...fetchOptions } = options;

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
    const token = localStorage.getItem('accessToken');
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

    const response = await fetch(url, {
      ...fetchOptions,
      headers,
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);

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
      throw new ApiError(response.status, errorMessage, data);
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return null;
    }

    const responseData = await response.json();

    // Automatic unwrapping of TransformInterceptor format
    // Backend returns { success: true, data: T, message: string }
    if (responseData && typeof responseData === 'object' && 'success' in responseData && 'data' in responseData) {
      return responseData.data;
    }

    return responseData;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    // Network errors
    console.error('API Request Failed:', error);
    toast.error('Network error. Please check your connection.');
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
