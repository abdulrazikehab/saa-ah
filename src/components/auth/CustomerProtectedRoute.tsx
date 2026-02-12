import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useMemo } from 'react';

interface CustomerProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * Protective wrapper for customer-only routes.
 * Redirection is handled in useEffect to ensure stability and avoid infinite render loops.
 */
export default function CustomerProtectedRoute({ children }: CustomerProtectedRouteProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, loading } = useAuth();

  // Memoize search params to avoid unnecessary re-renders/redirection triggers
  const redirectTarget = useMemo(() => {
    if (isAuthenticated || loading) return null;
    
    const searchParams = new URLSearchParams(window.location.search);
    searchParams.set('returnTo', location.pathname);
    return {
        pathname: '/login',
        search: searchParams.toString(),
        state: { from: location }
    };
  }, [isAuthenticated, loading, location]);

  useEffect(() => {
    if (redirectTarget) {
      console.log(`[CustomerProtectedRoute] User not authenticated. Redirecting to /login?returnTo=${location.pathname}`);
      navigate(
        { pathname: redirectTarget.pathname, search: redirectTarget.search }, 
        { state: redirectTarget.state, replace: true }
      );
    }
  }, [redirectTarget, navigate, location.pathname]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="text-sm text-muted-foreground animate-pulse">Checking access...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Return null while redirect is in progress (handled by useEffect)
    return null;
  }

  return <>{children}</>;
}

