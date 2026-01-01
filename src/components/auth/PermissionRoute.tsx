import { Navigate, useLocation } from 'react-router-dom';
import { usePermissions } from '@/hooks/usePermissions';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ShieldAlert } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';

interface PermissionRouteProps {
  children: React.ReactNode;
  requiredPermissions?: string[];
  requireAnyPermission?: boolean; // If true, user needs any of the permissions. If false (default), needs all.
  route?: string; // Route path for automatic permission checking
}

/**
 * Route protection component that checks if user has required permissions
 * For staff users, checks their assigned permissions
 * For owners/admins, allows all access
 */
export default function PermissionRoute({ 
  children, 
  requiredPermissions = [],
  requireAnyPermission = true,
  route
}: PermissionRouteProps) {
  const location = useLocation();
  const { user } = useAuth();
  const { hasPermission, hasAnyPermission, hasAllPermissions, canAccessRoute } = usePermissions();
  const { toast } = useToast();
  const hasShownToast = useRef(false);

  // Owners and admins have full access
  if (user && (user.role === 'SHOP_OWNER' || user.role === 'SUPER_ADMIN')) {
    return <>{children}</>;
  }

  // If route is provided, use automatic permission checking
  if (route) {
    const hasAccess = canAccessRoute(route);
    if (!hasAccess) {
      // Show toast notification once
      useEffect(() => {
        if (!hasShownToast.current) {
          toast({
            variant: 'destructive',
            title: 'غير مصرح',
            description: 'ليس لديك صلاحية للوصول إلى هذه الصفحة. يرجى التواصل مع مدير المتجر للحصول على الصلاحيات اللازمة.',
          });
          hasShownToast.current = true;
        }
      }, [toast, route]);
      
      return (
        <div className="p-6">
          <Alert variant="destructive">
            <ShieldAlert className="h-4 w-4" />
            <AlertDescription>
              <strong>غير مصرح للوصول</strong>
              <br />
              ليس لديك صلاحية للوصول إلى هذه الصفحة ({route}).
              <br />
              يرجى التواصل مع مدير المتجر للحصول على الصلاحيات اللازمة.
            </AlertDescription>
          </Alert>
        </div>
      );
    }
    return <>{children}</>;
  }

  // If no permissions required, allow access (but check if it's employees/permissions page)
  if (requiredPermissions.length === 0) {
    // For employees and permissions pages, only allow owners/admins
    if (route && (route.includes('/employees') || route.includes('/permissions'))) {
      if (user && user.role !== 'SHOP_OWNER' && user.role !== 'SUPER_ADMIN') {
        return (
          <div className="p-6">
            <Alert variant="destructive">
              <ShieldAlert className="h-4 w-4" />
              <AlertDescription>
                غير مصرح - فقط أصحاب المتاجر والمدراء يمكنهم الوصول إلى هذه الصفحة.
              </AlertDescription>
            </Alert>
          </div>
        );
      }
    }
    return <>{children}</>;
  }

  // Check permissions based on mode
  const hasAccess = requireAnyPermission
    ? hasAnyPermission(requiredPermissions)
    : hasAllPermissions(requiredPermissions);

  if (!hasAccess) {
    // Show toast notification once
    useEffect(() => {
      if (!hasShownToast.current) {
        const permissionNames = requiredPermissions.join(' أو ');
        toast({
          variant: 'destructive',
          title: 'غير مصرح',
          description: `تحتاج إلى صلاحية: ${permissionNames}. يرجى التواصل مع مدير المتجر.`,
        });
        hasShownToast.current = true;
      }
    }, [toast, requiredPermissions]);
    
    // Show access denied message instead of redirecting
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <ShieldAlert className="h-4 w-4" />
          <AlertDescription>
            <strong>غير مصرح للوصول</strong>
            <br />
            تحتاج إلى الصلاحيات التالية: {requiredPermissions.join(' أو ')}
            <br />
            يرجى التواصل مع مدير المتجر للحصول على هذه الصلاحيات.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return <>{children}</>;
}

