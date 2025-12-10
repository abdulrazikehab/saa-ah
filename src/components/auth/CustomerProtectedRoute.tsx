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
    // Check for customer authentication
    const customerToken = localStorage.getItem('customerToken');
    const customerData = localStorage.getItem('customerData');
    
    setIsAuthenticated(!!(customerToken && customerData));
    setLoading(false);
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
    // Redirect to home page (which will show login modal)
    // Store the attempted location so we can redirect back after login
    return <Navigate to="/" state={{ from: location, showLogin: true }} replace />;
  }

  return <>{children}</>;
}
