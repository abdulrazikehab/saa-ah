import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Hook to check user permissions
 * Returns functions to check if user has specific permissions
 */
export function usePermissions() {
  const { user } = useAuth();

  // Staff users have permissions, owners/admins have all permissions
  const permissions = useMemo(() => {
    if (!user) return [];
    
    // SUPER_ADMIN and SHOP_OWNER have all permissions
    if (user.role === 'SUPER_ADMIN' || user.role === 'SHOP_OWNER') {
      return ['*']; // Wildcard means all permissions
    }
    
    // Staff users have their assigned permissions
    return user.permissions || [];
  }, [user]);

  /**
   * Check if user has a specific permission
   */
  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    
    // SUPER_ADMIN and SHOP_OWNER have all permissions
    if (user.role === 'SUPER_ADMIN' || user.role === 'SHOP_OWNER') {
      return true;
    }
    
    // Check if user has the exact permission
    if (permissions.includes(permission)) {
      return true;
    }
    
    // Check if user has a wildcard permission (all permissions)
    if (permissions.includes('*')) {
      return true;
    }
    
    // Check for manage permissions (e.g., product:manage includes product:create, product:read, etc.)
    const permissionParts = permission.split(':');
    if (permissionParts.length === 2) {
      const [resource, action] = permissionParts;
      const managePermission = `${resource}:manage`;
      if (permissions.includes(managePermission)) {
        return true;
      }
    }
    
    return false;
  };

  /**
   * Check if user has any of the given permissions
   */
  const hasAnyPermission = (permissionList: string[]): boolean => {
    return permissionList.some(permission => hasPermission(permission));
  };

  /**
   * Check if user has all of the given permissions
   */
  const hasAllPermissions = (permissionList: string[]): boolean => {
    return permissionList.every(permission => hasPermission(permission));
  };

  /**
   * Check if user can access a dashboard route
   */
  const canAccessRoute = (route: string): boolean => {
    if (!user) return false;
    
    // SUPER_ADMIN and SHOP_OWNER have access to all routes
    if (user.role === 'SUPER_ADMIN' || user.role === 'SHOP_OWNER') {
      return true;
    }
    
    // Map routes to required permissions
    const routePermissionMap: Record<string, string[]> = {
      '/dashboard': [], // Dashboard home - always accessible
      '/dashboard/products': ['product:read', 'product:manage', 'product:create', 'product:update', 'product:delete'],
      '/dashboard/categories': ['product:read', 'product:manage'],
      '/dashboard/hierarchical': ['product:read', 'product:manage'],
      '/dashboard/prices': ['product:read', 'product:manage', 'product:update'],
      '/dashboard/orders': ['order:read', 'order:manage', 'order:create', 'order:update'],
      '/dashboard/customers': ['customer:read', 'customer:manage', 'customer:create', 'customer:update'],
      '/dashboard/reports': ['analytics:read', 'analytics:manage'],
      '/dashboard/settings': ['settings:read', 'settings:update'],
      '/dashboard/settings/payment': ['settings:read', 'settings:update'],
      '/dashboard/settings/checkout': ['settings:read', 'settings:update'],
      '/dashboard/settings/notifications': ['settings:read', 'settings:update'],
      '/dashboard/settings/domains': ['settings:read', 'settings:update'],
      '/dashboard/settings/users': ['settings:read', 'settings:update'],
      '/dashboard/employees': [], // Only owners/admins (checked separately)
      '/dashboard/permissions': [], // Only owners/admins (checked separately)
    };
    
    // Check exact route match first
    if (routePermissionMap[route]) {
      const requiredPermissions = routePermissionMap[route];
      if (requiredPermissions.length === 0) return true; // No permissions required
      return hasAnyPermission(requiredPermissions);
    }
    
    // Check route prefix matches (for nested routes)
    for (const [routePrefix, requiredPermissions] of Object.entries(routePermissionMap)) {
      if (route.startsWith(routePrefix)) {
        if (requiredPermissions.length === 0) return true;
        return hasAnyPermission(requiredPermissions);
      }
    }
    
    // Default: allow access for now (can be restricted later)
    return true;
  };

  return {
    permissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canAccessRoute,
    isStaff: user?.role === 'STAFF',
    isOwner: user?.role === 'SHOP_OWNER',
    isAdmin: user?.role === 'SUPER_ADMIN',
  };
}

