import { Navigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';

interface CustomerProtectedRouteProps {
  children: React.ReactNode;
}

export default function CustomerProtectedRoute({ children }: CustomerProtectedRouteProps) {
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      // Check for customer authentication
      const customerToken = localStorage.getItem('customerToken');
      const customerData = localStorage.getItem('customerData');
      
      setIsAuthenticated(!!(customerToken && customerData));
      setLoading(false);
    };
    
    checkAuth();
    
    // Listen for storage changes (when login happens in another tab/window)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'customerToken' || e.key === 'customerData') {
        checkAuth();
      }
    };
    
    // Listen for custom login event (when login happens in same tab)
    const handleCustomerLogin = () => {
      checkAuth();
    };
    
    // Poll localStorage periodically as fallback (check every 1 second)
    // This ensures we catch login events even if custom event doesn't fire
    const pollInterval = setInterval(() => {
      checkAuth();
    }, 1000);
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('customerLogin', handleCustomerLogin);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('customerLogin', handleCustomerLogin);
      clearInterval(pollInterval);
    };
  }, []);

  if (loading) {
    // Show loading state while checking authentication
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to the unified auth page
    // Store the attempted location so we can redirect back after login
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
