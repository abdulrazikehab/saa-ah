import { Navigate, useLocation } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const location = useLocation();
  const authContext = useContext(AuthContext);
  
  // If context is not available, show loading state
  // This can happen during initial render or hot reload before providers are fully mounted
  if (!authContext) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  const { isAuthenticated, loading, user } = authContext;

  if (loading) {
    // Show loading state while checking authentication
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login page
    // On subdomains, we use the unified auth page
    const loginPath = '/login';
    return <Navigate to={loginPath} state={{ from: location }} replace />;
  }

  // Check if user must change password on first login
  // Skip check if already on change password page
  const mustChangePassword = (user as any)?.mustChangePassword || false;
  if (mustChangePassword && location.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace />;
  }

  return <>{children}</>;
}
