import { Navigate, useLocation } from 'react-router-dom';
import { usePermissions } from '@/hooks/usePermissions';
import { useContext } from 'react';
import { AuthContext } from '@/contexts/AuthContext';
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
  const authContext = useContext(AuthContext);
  
  // Hooks must be called unconditionally
  const { hasPermission, hasAnyPermission, hasAllPermissions, canAccessRoute } = usePermissions();
  const { toast } = useToast();
  const hasShownToast = useRef(false);
  
  const user = authContext?.user;
  const isOwner = user && (user.role === 'SHOP_OWNER' || user.role === 'SUPER_ADMIN');

  // Determine access status
  let hasAccess = false;
  const requiredPermsNames = requiredPermissions.join(' أو ');
  let denialMessage = `تحتاج إلى صلاحية: ${requiredPermsNames}. يرجى التواصل مع مدير المتجر.`;
  let alertMessage = (
    <>
      <strong>غير مصرح للوصول</strong>
      <br />
      تحتاج إلى الصلاحيات التالية: {requiredPermsNames}
      <br />
      يرجى التواصل مع مدير المتجر للحصول على هذه الصلاحيات.
    </>
  );

  if (!authContext) {
    hasAccess = false;
  } else if (isOwner) {
    hasAccess = true;
  } else if (route) {
    hasAccess = canAccessRoute(route);
    denialMessage = 'ليس لديك صلاحية للوصول إلى هذه الصفحة. يرجى التواصل مع مدير المتجر للحصول على الصلاحيات اللازمة.';
    alertMessage = (
      <>
        <strong>غير مصرح للوصول</strong>
        <br />
        ليس لديك صلاحية للوصول إلى هذه الصفحة ({route}).
        <br />
        يرجى التواصل مع مدير المتجر للحصول على الصلاحيات اللازمة.
      </>
    );
  } else if (requiredPermissions.length === 0) {
    hasAccess = true;
  } else {
    hasAccess = requireAnyPermission
      ? hasAnyPermission(requiredPermissions)
      : hasAllPermissions(requiredPermissions);
  }

  // Show toast notification once if access is denied
  useEffect(() => {
    if (authContext && !hasAccess && !hasShownToast.current) {
      toast({
        variant: 'destructive',
        title: 'غير مصرح',
        description: denialMessage,
      });
      hasShownToast.current = true;
    }
  }, [authContext, hasAccess, denialMessage, toast]);

  if (!authContext) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <ShieldAlert className="h-4 w-4" />
          <AlertDescription>
            {alertMessage}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return <>{children}</>;
}

