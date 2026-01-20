import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '@/lib/api';

interface User {
  id: string;
  email: string;
  name?: string;
  role: string;
  tenantId?: string;
  avatar?: string | null;
  tenantName?: string;
  tenantLogo?: string | null;
  tenantSubdomain?: string;
  mustChangePassword?: boolean;
  permissions?: string[]; // Staff permissions array
  employerEmail?: string;
}

interface SignUpResponse {
  id: string;
  email: string;
  recoveryId: string;
  accessToken: string;
  refreshToken: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (identifier: string, password: string) => Promise<boolean>; // Returns true if password change required
  loginWithTokens: (accessToken: string, refreshToken: string, user?: User) => Promise<void>;
  signup: (email: string, password: string, storeName: string, subdomain: string, nationalId: string) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<boolean>;
  setUser: (user: User | null) => void;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper to set a cookie
const setCookie = (name: string, value: string, days: number = 7) => {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  const isSecure = window.location.protocol === 'https:';
  const secureFlag = isSecure ? '; Secure' : '';
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax${secureFlag}`;
  
  // Sync to localStorage for reliability with api-client (USER INFO AND TOKENS)
  if (name === 'user' || name === 'accessToken' || name === 'refreshToken') {
    localStorage.setItem(name, value);
  }
};

// Helper to get a cookie
const getCookie = (name: string): string | null => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    const cookieValue = parts.pop()?.split(';').shift();
    return cookieValue ? decodeURIComponent(cookieValue) : null;
  }
  return null;
};

// Helper to delete a cookie
const deleteCookie = (name: string) => {
  const isSecure = window.location.protocol === 'https:';
  const secureFlag = isSecure ? '; Secure' : '';
  document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax${secureFlag}`;
  
  // Also remove from localStorage if it exists (USER INFO AND TOKENS)
  if ((name === 'user' || name === 'accessToken' || name === 'refreshToken') && localStorage.getItem(name)) {
    localStorage.removeItem(name);
  }
};

// Get user from cookie
const getUserFromCookie = (): User | null => {
  try {
    const userCookie = getCookie('user') || localStorage.getItem('user');
    return userCookie ? JSON.parse(userCookie) : null;
  } catch {
    return null;
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => getUserFromCookie());
  const [loading, setLoading] = useState(() => !getUserFromCookie());

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    // SECURITY FIX: Rely on cookies first, localStorage is only for non-sensitive UI state
    const hasToken = getCookie('accessToken');
    if (!hasToken) {
      // No token - user is not logged in, use cached user if available
      const cachedUser = getUserFromCookie();
      setUser(cachedUser);
      setLoading(false);
      return;
    }

    try {
      // Check if we have auth cookies by calling /me endpoint
      const data = await authApi.me();

      setUser(data.user);
      
      // Store user info in a non-HttpOnly cookie for UI purposes
      setCookie('user', JSON.stringify(data.user), 7);
      
      // Save tenant ID for storefront access
      if (data.user?.tenantId) {
        sessionStorage.setItem('storefrontTenantId', data.user.tenantId);
      }
    } catch (error: unknown) {
      const err = error as { status?: number; response?: { status?: number } };
      const status = err?.status || err?.response?.status;
      
      if (status === 401 && !isDashboardOrSetup()) {
        // Clear auth state on 401 ONLY if not on dashboard/protected page
        // On dashboard, we let the API client attempt refresh first
        deleteCookie('user');
        deleteCookie('accessToken');
        deleteCookie('refreshToken');
        setUser(null);
      } else {
        // For network errors or if on dashboard, keep existing user state
        console.warn('checkAuth: Keeping session despite error (protected page or non-401)', { status, error });
        const cachedUser = getUserFromCookie();
        if (cachedUser) {
          setUser(cachedUser);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const refreshUser = async () => {
    await checkAuth();
  };

  const isDashboardOrSetup = () => {
    if (typeof window === 'undefined') return false;
    const path = window.location.pathname;
    const isDashboardPath = path === '/dashboard' || path.startsWith('/dashboard/') || path === '/setup' || path.startsWith('/setup/');
    const hasUser = !!localStorage.getItem('user');
    return isDashboardPath || (hasUser && (path === '/login' || path === '/auth/login'));
  };

  const login = async (identifier: string, password: string) => {
    const isEmail = identifier.includes('@');
    const payload = isEmail ? { email: identifier, password } : { username: identifier, password };

    const data = await authApi.login(payload);

    // Store tokens from response (cross-domain cookies don't work between saeaa.com and saeaa.net)
    if (data.accessToken) {
      setCookie('accessToken', data.accessToken, 1); // 1 day for access token
    }
    if (data.refreshToken) {
      setCookie('refreshToken', data.refreshToken, 7); // 7 days for refresh token
    }

    const userData: User = {
      id: data.id,
      email: data.email,
      role: data.role,
      tenantId: data.tenantId,
      tenantName: data.tenantName,
      tenantSubdomain: data.tenantSubdomain,
      avatar: data.avatar,
      mustChangePassword: (data as { mustChangePassword?: boolean }).mustChangePassword || false,
      permissions: (data as { permissions?: string[] }).permissions,
      employerEmail: (data as { employerEmail?: string }).employerEmail,
    };

    setCookie('user', JSON.stringify(userData), 7);
    setUser(userData);
    
    if (userData.tenantId) {
      sessionStorage.setItem('storefrontTenantId', userData.tenantId);
    }
    
    return (data as { mustChangePassword?: boolean }).mustChangePassword || false;
  };

  const loginWithTokens = async (accessToken: string, refreshToken: string, userData?: User) => {
    try {
      setCookie('accessToken', accessToken, 1);
      setCookie('refreshToken', refreshToken, 7);
      
      let user = userData;
      if (!user) {
        // Suppress toast for this specific check, handle failure manually
        const data = await authApi.me({ hideErrorToast: true });
        user = data.user;
      }
      
      if (user) {
        setUser(user);
        setCookie('user', JSON.stringify(user), 7);
        
        if (user.tenantId) {
          sessionStorage.setItem('storefrontTenantId', user.tenantId);
        }
      }
    } catch (error) {
      console.error('Failed to login with tokens:', error);
      logout();
      throw error;
    }
  };

  const signup = async (email: string, password: string, storeName: string, subdomain: string, nationalId: string) => {
    const data = await authApi.signup({ email, password, storeName, subdomain, nationalId }) as SignUpResponse;
    
    // Store tokens from response
    if (data.accessToken) {
      setCookie('accessToken', data.accessToken, 1);
    }
    if (data.refreshToken) {
      setCookie('refreshToken', data.refreshToken, 7);
    }

    const userData: User = {
      id: data.id,
      email: data.email,
      role: 'SHOP_OWNER',
      tenantId: undefined,
      avatar: null,
    };

    setCookie('user', JSON.stringify(userData), 7);
    setUser(userData);
  };

  const logout = async () => {
    try {
      await authApi.logout().catch(() => {
        // Ignore errors
      });
    } catch {
      // Ignore errors
    }
    
    // Clear all auth cookies
    deleteCookie('accessToken');
    deleteCookie('refreshToken');
    deleteCookie('user');
    sessionStorage.removeItem('storefrontTenantId');
    setUser(null);
  };

  const refreshToken = async (): Promise<boolean> => {
    try {
      // Backend will use HttpOnly refresh token cookie
      const response = await authApi.refreshToken();
      // New tokens are set as HttpOnly cookies by backend
      return true;
    } catch (error) {
      console.error('Token refresh failed:', error);
      logout();
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      isAuthenticated: !!user,
      login,
      loginWithTokens,
      signup, 
      logout,
      refreshToken,
      setUser,
      refreshUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
