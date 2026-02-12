import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
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
  twoFactorEnabled?: boolean;
  phone?: string;
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
  login: (identifier: string, password: string) => Promise<{ requiresTwoFactor?: boolean; customerId?: string; mustChangePassword?: boolean }>;
  loginWithTokens: (accessToken: string, refreshToken: string, user?: User) => Promise<void>;
  signup: (email: string, password: string, storeName: string, subdomain: string, nationalId: string) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<boolean>;
  setUser: (user: User | null) => void;
  refreshUser: () => Promise<void>;
  verifyCustomer2FA: (customerId: string, code: string) => Promise<void>;
  verifyUser2FA: (userId: string, code: string) => Promise<void>;
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

// Get customer from localStorage
const getCustomerFromStorage = (): User | null => {
  try {
    const customerData = localStorage.getItem('customerData');
    if (!customerData) return null;
    const parsed = JSON.parse(customerData);
    return {
      id: parsed.id,
      email: parsed.email,
      name: parsed.firstName ? `${parsed.firstName} ${parsed.lastName || ''}`.trim() : parsed.name,
      role: parsed.role || (parsed.isEmployee ? 'CUSTOMER_EMPLOYEE' : 'CUSTOMER'),
      tenantId: parsed.tenantId,
      avatar: parsed.avatar,
      permissions: parsed.permissions || [],
      employerEmail: parsed.employerEmail,
      twoFactorEnabled: true,
      phone: parsed.phone,
    };
  } catch {
    return null;
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // IMPORTANT: Only initialize user from cache if tokens exist
  // This ensures the login page shows for users without valid tokens
  const hasTokens = () => {
    if (typeof window === 'undefined') return false;
    const accessToken = document.cookie.includes('accessToken') || localStorage.getItem('accessToken');
    const customerToken = localStorage.getItem('customerToken');
    return !!(accessToken || customerToken);
  };
  
  const [user, setUser] = useState<User | null>(() => {
    if (!hasTokens()) return null;
    return getUserFromCookie() || getCustomerFromStorage();
  });
  const [loading, setLoading] = useState(true); // Always start with loading=true to check auth

  useEffect(() => {
    checkAuth();

    // Listen for customer login events
    const handleCustomerLogin = (e: any) => {
      console.log('AuthContext: Customer login detected', e.detail);
      checkAuth();
    };

    window.addEventListener('customerLogin', handleCustomerLogin);
    return () => {
      window.removeEventListener('customerLogin', handleCustomerLogin);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const checkAuthInProgress = useRef(false);

  const checkAuth = useCallback(async () => {
    if (checkAuthInProgress.current) return;
    checkAuthInProgress.current = true;
    // SECURITY FIX: Rely on cookies first, localStorage is only for non-sensitive UI state
    // SECURITY FIX: Rely on cookies/localStorage for both merchant and customer tokens
    const accessToken = getCookie('accessToken') || localStorage.getItem('accessToken');
    const customerToken = localStorage.getItem('customerToken');
    
    if (!accessToken && !customerToken) {
      // No token - user is not logged in
      // IMPORTANT: Clear any stale cached user data to ensure login page shows
      setUser(null);
      setLoading(false);
      checkAuthInProgress.current = false;
      return;
    }

    try {
      if (accessToken) {
        // Check if we have auth cookies by calling /me endpoint
        const data = await authApi.me();
        setUser(data.user);
        
        // Store user info in a non-HttpOnly cookie for UI purposes
        setCookie('user', JSON.stringify(data.user), 7);
        
        // Save tenant ID for storefront access
        if (data.user?.tenantId) {
          sessionStorage.setItem('storefrontTenantId', data.user.tenantId);
        }
      } else if (customerToken) {
        // Handle customer session
        const customerDataStr = localStorage.getItem('customerData');
        if (customerDataStr) {
          try {
            const customerData = JSON.parse(customerDataStr);
            const userData: User = {
              id: customerData.id,
              email: customerData.email,
              name: customerData.firstName ? `${customerData.firstName} ${customerData.lastName || ''}`.trim() : customerData.name,
              role: customerData.role || (customerData.isEmployee ? 'CUSTOMER_EMPLOYEE' : 'CUSTOMER'),
              tenantId: customerData.tenantId,
              avatar: customerData.avatar,
              permissions: customerData.permissions || [],
              employerEmail: customerData.employerEmail,
              twoFactorEnabled: true,
              phone: customerData.phone,
            };
            setUser(userData);
          } catch (e) {
            console.error('Failed to parse customer data:', e);
            setUser(null);
          }
        }
      }
    } catch (error: unknown) {
      const err = error as { status?: number; response?: { status?: number } };
      const status = err?.status || err?.response?.status;
      
      if (status === 401 && !isDashboardOrSetup()) {
        // Clear auth state on 401 ONLY if not on dashboard/protected page
        deleteCookie('user');
        deleteCookie('accessToken');
        deleteCookie('refreshToken');
        localStorage.removeItem('customerToken');
        localStorage.removeItem('customerData');
        setUser(null);
      } else {
        // For network errors or if on dashboard, keep existing user state
        console.warn('checkAuth: Keeping session despite error (protected page or non-401)', { status, error });
        const cachedUser = getUserFromCookie() || getCustomerFromStorage();
        if (cachedUser) {
          setUser(cachedUser);
        }
      }
    } finally {
      checkAuthInProgress.current = false;
      setLoading(false);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    await checkAuth();
  }, [checkAuth]);

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

    if (data.requiresTwoFactor) {
      return { requiresTwoFactor: true, customerId: data.customerId };
    }

    // Store tokens from response (cross-domain cookies don't work between kawn.com and kawn.net)
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
      permissions: data.permissions,
      employerEmail: data.employerEmail,
      twoFactorEnabled: data.twoFactorEnabled,
    };

    setCookie('user', JSON.stringify(userData), 7);
    setUser(userData);
    
    if (userData.tenantId) {
      sessionStorage.setItem('storefrontTenantId', userData.tenantId);
    }
    
    return { mustChangePassword: (data as { mustChangePassword?: boolean }).mustChangePassword || false };
  };

  const verifyCustomer2FA = async (customerId: string, code: string) => {
    const data = await authApi.verifyCustomerLogin2FA(customerId, code);

    if (data.accessToken) {
      setCookie('accessToken', data.accessToken, 1);
    }
    if (data.refreshToken) {
      setCookie('refreshToken', data.refreshToken, 7);
    }

    const userData: User = {
      id: data.customer.id,
      email: data.customer.email,
      role: 'CUSTOMER',
      tenantId: data.customer.tenantId,
      avatar: data.customer.avatar,
      twoFactorEnabled: true,
    };

    setCookie('user', JSON.stringify(userData), 7);
    setUser(userData);
    
    if (userData.tenantId) {
      sessionStorage.setItem('storefrontTenantId', userData.tenantId);
    }
  };

  const verifyUser2FA = async (userId: string, code: string) => {
    const data = await authApi.verifyUserLogin2FA(userId, code);

    if (data.accessToken) {
      setCookie('accessToken', data.accessToken, 1);
    }
    if (data.refreshToken) {
      setCookie('refreshToken', data.refreshToken, 7);
    }

    const userData: User = {
      id: data.id,
      email: data.email,
      role: data.role,
      tenantId: data.tenantId,
      avatar: data.avatar,
      twoFactorEnabled: data.twoFactorEnabled,
    };

    setCookie('user', JSON.stringify(userData), 7);
    setUser(userData);
    
    if (userData.tenantId) {
      sessionStorage.setItem('storefrontTenantId', userData.tenantId);
    }
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
      refreshUser,
      verifyCustomer2FA,
      verifyUser2FA
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
