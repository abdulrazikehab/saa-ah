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
  login: (identifier: string, password: string) => Promise<void>;
  loginWithTokens: (accessToken: string, refreshToken: string) => Promise<void>;
  signup: (email: string, password: string, storeName: string, subdomain: string) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<boolean>;
  setUser: (user: User | null) => void;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  // Helper to get cookie
  const getCookie = (name: string): string | null => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
    return null;
  };

  const checkAuth = async () => {
    try {
      // Prefer localStorage token – cross-domain HttpOnly cookies are not readable from JS
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setLoading(false);
        return;
      }

      const data = await authApi.me();

      // Allow users without tenantId to access the dashboard
      // They can create pages and content before setting up a market
      setUser(data.user);

      // Keep localStorage user in sync so non‑React utilities (like api-client)
      // can read the latest tenantId and other user info
      try {
        localStorage.setItem('user', JSON.stringify(data.user));
      } catch {
        // ignore storage errors
      }
    } catch (error) {
      // On auth failure, clear all local auth state
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const refreshUser = async () => {
    await checkAuth();
  };

  const login = async (identifier: string, password: string) => {
    // Determine if identifier is email or username
    const isEmail = identifier.includes('@');
    const payload = isEmail ? { email: identifier, password } : { username: identifier, password };

    const data = await authApi.login(payload);

    // Cookies are set by server, but also store in localStorage as fallback
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);

    const userData: User = {
      id: data.id,
      email: data.email,
      role: data.role,
      tenantId: data.tenantId,
      tenantName: data.tenantName,
      tenantSubdomain: data.tenantSubdomain,
      avatar: data.avatar,
    };

    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const loginWithTokens = async (accessToken: string, refreshToken: string) => {
    try {
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      
      // Fetch user profile
      const data = await authApi.me();
      setUser(data.user);
      localStorage.setItem('user', JSON.stringify(data.user));
    } catch (error) {
      console.error('Failed to login with tokens:', error);
      logout();
      throw error;
    }
  };

  const signup = async (email: string, password: string, storeName: string, subdomain: string) => {
    const data = await authApi.signup({ email, password, storeName, subdomain }) as SignUpResponse;
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);

    const userData: User = {
      id: data.id,
      email: data.email,
      role: 'SHOP_OWNER',
      tenantId: undefined,
      avatar: null,
    };

    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = async () => {
    try {
      // Call backend logout to clear cookies
      await authApi.logout().catch(() => {
        // Ignore errors if already logged out
      });
    } catch (error) {
      // Ignore errors
    }
    
    // Clear cookies
    document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = 'refreshToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    
    // Clear localStorage
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setUser(null);
  };

  const refreshToken = async (): Promise<boolean> => {
    try {
      // Use refresh token from localStorage (cookies are HttpOnly & cross-domain)
      const refreshTokenValue = localStorage.getItem('refreshToken');
      if (!refreshTokenValue) {
        return false;
      }
      
      // Call refresh and explicitly pass refreshToken so it works cross-site
      const response = await authApi.refreshToken(refreshTokenValue);
      
      localStorage.setItem('accessToken', response.accessToken);
      localStorage.setItem('refreshToken', response.refreshToken);
      
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
