import { useMemo, useContext } from 'react';
import { AuthContext } from '@/contexts/AuthContext';

/**
 * Hook to check user permissions
 * Returns functions to check if user has specific permissions
 */
export function usePermissions() {
  const authContext = useContext(AuthContext);
  const user = authContext?.user || null;

  // Staff users have permissions, owners/admins have all permissions
  const permissions = useMemo(() => {
    if (!user) return [];
    
    // SUPER_ADMIN and SHOP_OWNER (store owners) have all permissions
    if (user.role === 'SUPER_ADMIN' || user.role === 'SHOP_OWNER') {
      return ['*']; // Wildcard means all permissions
    }

    // CUSTOMER accounts (organization owners) have default storefront permissions
    if (user.role === 'CUSTOMER') {
      return [
        'store:wallet:view',
        'store:wallet:use',
        'store:favorites:view',
        'store:support:view',
        'store:employees:manage',
        'store:analytics:view',
        'store:settings:view',
        'store:orders:view',
        'store:orders:create'
      ];
    }
    
    // Staff users have their assigned permissions
    return user.permissions || [];
  }, [user]);

  /**
   * Check if user has a specific permission
   */
  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    
    // SUPER_ADMIN and SHOP_OWNER (store owners) have all permissions
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
    
    // SUPER_ADMIN and SHOP_OWNER (store owners) have access to all routes
    if (user.role === 'SUPER_ADMIN' || user.role === 'SHOP_OWNER') {
      return true;
    }
    
    // Map routes to required permissions
    // Map routes to required permissions
    const routePermissionMap: Record<string, string[]> = {
      // General
      '/dashboard': [], // Dashboard home - always accessible
      '/dashboard/support': [], // Support - always accessible
      
      // Sales & Orders
      '/dashboard/hierarchical': ['product:read'],
      '/dashboard/products': ['product:read'],
      '/dashboard/categories': ['product:read'],
      '/dashboard/settings/brands': ['product:read', 'settings:read'],
      '/dashboard/prices': ['product:read', 'product:update'],
      '/dashboard/orders': ['order:read'],
      '/dashboard/inventory': ['inventory:read', 'product:read'],
      '/dashboard/banks': ['settings:read', 'order:read'],
      '/dashboard/supplier-products': ['product:read'],
      '/dashboard/customers': ['customer:read'],
      
      // Reports
      '/dashboard/reports': ['analytics:read'],
      '/dashboard/customer-reports': ['analytics:read'],
      '/dashboard/customer-balances': ['analytics:read'],
      '/dashboard/product-reports': ['analytics:read'],
      '/dashboard/payment-reports': ['analytics:read'],
      
      // Store Settings
      '/dashboard/settings': ['settings:read'],
      '/dashboard/management': ['settings:read'],
      '/dashboard/settings/suppliers': ['settings:read'],
      '/dashboard/settings/domains': ['settings:read'],
      '/dashboard/settings/units': ['settings:read'],
      '/dashboard/settings/currencies': ['settings:read'],
      '/dashboard/settings/notifications': ['settings:read'],
      '/dashboard/settings/limits': ['settings:read'],
      
      // Content & Design (Mapped to settings:update as closest proxy)
      '/dashboard/pages': ['settings:update'],
      '/dashboard/storefront': ['settings:update'],
      '/dashboard/design': ['settings:update'],
      '/dashboard/apps': ['settings:update'],
      '/dashboard/templates': ['settings:update'],
      
      // Advanced
      '/dashboard/settings/integrations': ['settings:update'],
      '/dashboard/settings/kyc': ['settings:read'],
      '/dashboard/chat': ['customer:read', 'customer:manage'],
      
      
      // Marketing (Mapped to customer:manage as closest proxy)
      '/dashboard/marketing': ['customer:manage'],
      '/dashboard/smart-line': ['customer:manage'],
    };
    
    // Check exact route match first
    if (routePermissionMap[route]) {
      const requiredPermissions = routePermissionMap[route];
      if (requiredPermissions.length === 0) return true; // No permissions required
      return hasAnyPermission(requiredPermissions);
    }
    
    // Check route prefix matches (for nested routes)
    // Sort by length desc to match most specific prefix first
    const sortedPrefixes = Object.entries(routePermissionMap).sort((a, b) => b[0].length - a[0].length);
    for (const [routePrefix, requiredPermissions] of sortedPrefixes) {
      if (route.startsWith(routePrefix)) {
        if (requiredPermissions.length === 0) return true;
        return hasAnyPermission(requiredPermissions);
      }
    }
    
    // Default: restrict access if not explicitly allowed
    return false;
  };

  return {
    permissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canAccessRoute,
    isStaff: user?.role === 'STAFF',
    isOwner: user?.role === 'SHOP_OWNER' || user?.role === 'SUPER_ADMIN',
    isAdmin: user?.role === 'SUPER_ADMIN',
    isMerchant: user?.role === 'SHOP_OWNER' || user?.role === 'CUSTOMER' || user?.role === 'CUSTOMER_EMPLOYEE',
  };
}

