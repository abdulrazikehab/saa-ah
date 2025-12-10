import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

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

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (token) {
        const data = await authApi.me();
        
        // Force re-login if user doesn't have tenantId (old users before multi-tenancy fix)
        if (!data.user.tenantId) {
          toast({
            title: 'Session Update Required',
            description: 'Please log in again to access your store. We\'ve updated our system for better security.',
            variant: 'destructive',
          });
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          setUser(null);
          return;
        }
        
        setUser(data.user);
      }
    } catch (error) {
      localStorage.removeItem('accessToken');
    } finally {
      setLoading(false);
    }
  };

  const refreshUser = async () => {
    await checkAuth();
  };

  const login = async (identifier: string, password: string) => {
    try {
      // Determine if identifier is email or username
      const isEmail = identifier.includes('@');
      const payload = isEmail ? { email: identifier, password } : { username: identifier, password };
      
      const data = await authApi.login(payload);
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      
      const userData: User = {
        id: data.id,
        email: data.email,
        role: data.role,
        tenantId: data.tenantId,
        avatar: data.avatar,
      };
      
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      
      toast({
        title: 'Welcome back!',
        description: 'You have successfully logged in.',
      });
    } catch (error: unknown) {
      toast({
        title: 'Login failed',
        description: error instanceof Error ? error.message : 'Invalid credentials',
        variant: 'destructive',
      });
      throw error;
    }
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
    try {
      const data = await authApi.signup({ email, password, storeName, subdomain });
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
      
      toast({
        title: 'Account created!',
        description: 'Welcome to your new store.',
      });
    } catch (error: unknown) {
      toast({
        title: 'Signup failed',
        description: error instanceof Error ? error.message : 'Could not create account',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setUser(null);
    toast({
      title: 'Logged out',
      description: 'See you next time!',
    });
  };

  const refreshToken = async (): Promise<boolean> => {
    try {
      const refreshTokenValue = localStorage.getItem('refreshToken');
      if (!refreshTokenValue) {
        return false;
      }

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
