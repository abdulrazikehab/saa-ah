import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

// Helper to check if we are on the main domain
const isMainDomain = () => {
  const hostname = window.location.hostname;
  const mainDomains = ['localhost', '127.0.0.1', "www.saa'ah.com", "saa'ah.com", "app.saa'ah.com"];
  
  if (mainDomains.includes(hostname)) {
    return true;
  }
  
  // Check for subdomain pattern (tenant storefront)
  if (hostname.includes('.localhost') || (hostname.endsWith(".saa'ah.com") && !mainDomains.includes(hostname))) {
    return false;
  }
  
  return true;
};

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const location = useLocation();
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    // Show loading state while checking authentication
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to appropriate login page based on domain
    const loginPath = isMainDomain() ? '/auth/login' : '/login';
    return <Navigate to={loginPath} state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
