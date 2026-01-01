import { usePermissions } from './usePermissions';
import { useToast } from '@/hooks/use-toast';

/**
 * Hook to check permissions before performing actions
 * Shows user-friendly error messages when permissions are missing
 */
export function usePermissionAction() {
  const { hasPermission, hasAnyPermission } = usePermissions();
  const { toast } = useToast();

  /**
   * Check if user can perform an action, show error if not
   * @param permission - Required permission(s) for the action
   * @param actionName - Name of the action (for error message)
   * @param showError - Whether to show error toast (default: true)
   * @returns true if allowed, false otherwise
   */
  const canPerformAction = (
    permission: string | string[],
    actionName: string,
    showError: boolean = true
  ): boolean => {
    const permissions = Array.isArray(permission) ? permission : [permission];
    const hasAccess = hasAnyPermission(permissions);

    if (!hasAccess && showError) {
      const permissionNames: Record<string, string> = {
        'product:create': 'إنشاء المنتجات',
        'product:read': 'عرض المنتجات',
        'product:update': 'تعديل المنتجات',
        'product:delete': 'حذف المنتجات',
        'product:manage': 'إدارة المنتجات',
        'order:create': 'إنشاء الطلبات',
        'order:read': 'عرض الطلبات',
        'order:update': 'تحديث الطلبات',
        'order:delete': 'حذف الطلبات',
        'order:manage': 'إدارة الطلبات',
        'customer:create': 'إنشاء العملاء',
        'customer:read': 'عرض العملاء',
        'customer:update': 'تحديث العملاء',
        'customer:delete': 'حذف العملاء',
        'customer:manage': 'إدارة العملاء',
        'analytics:read': 'عرض التحليلات',
        'analytics:manage': 'إدارة التحليلات',
        'settings:read': 'عرض الإعدادات',
        'settings:update': 'تعديل الإعدادات',
        'inventory:read': 'عرض المخزون',
        'inventory:update': 'تحديث المخزون',
        'inventory:manage': 'إدارة المخزون',
      };

      const requiredPermission = permissions
        .map(p => permissionNames[p] || p)
        .join(' أو ');

      toast({
        variant: 'destructive',
        title: 'غير مصرح',
        description: `لا يمكنك ${actionName}. تحتاج إلى صلاحية: ${requiredPermission}. يرجى التواصل مع مدير المتجر للحصول على هذه الصلاحية.`,
      });
    }

    return hasAccess;
  };

  /**
   * Get a tooltip message explaining why an action is disabled
   */
  const getDisabledTooltip = (
    permission: string | string[],
    actionName: string
  ): string => {
    const permissions = Array.isArray(permission) ? permission : [permission];
    const hasAccess = hasAnyPermission(permissions);

    if (hasAccess) return '';

    const permissionNames: Record<string, string> = {
      'product:create': 'إنشاء المنتجات',
      'product:read': 'عرض المنتجات',
      'product:update': 'تعديل المنتجات',
      'product:delete': 'حذف المنتجات',
      'product:manage': 'إدارة المنتجات',
      'order:create': 'إنشاء الطلبات',
      'order:read': 'عرض الطلبات',
      'order:update': 'تحديث الطلبات',
      'order:delete': 'حذف الطلبات',
      'order:manage': 'إدارة الطلبات',
      'customer:create': 'إنشاء العملاء',
      'customer:read': 'عرض العملاء',
      'customer:update': 'تحديث العملاء',
      'customer:delete': 'حذف العملاء',
      'customer:manage': 'إدارة العملاء',
      'analytics:read': 'عرض التحليلات',
      'analytics:manage': 'إدارة التحليلات',
      'settings:read': 'عرض الإعدادات',
      'settings:update': 'تعديل الإعدادات',
      'inventory:read': 'عرض المخزون',
      'inventory:update': 'تحديث المخزون',
      'inventory:manage': 'إدارة المخزون',
    };

    const requiredPermission = permissions
      .map(p => permissionNames[p] || p)
      .join(' أو ');

    return `غير مصرح: تحتاج صلاحية ${requiredPermission} لـ ${actionName}`;
  };

  return {
    canPerformAction,
    getDisabledTooltip,
  };
}

