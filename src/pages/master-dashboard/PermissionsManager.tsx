import { useState, useEffect, useCallback } from 'react';
import { coreApi } from '@/lib/api';
import { apiClient } from '@/services/core/api-client';
import { 
  Shield, 
  Users, 
  Search, 
  Loader2, 
  CheckCircle, 
  XCircle,
  Eye,
  Key,
  UserCheck,
  Settings,
  Package,
  ShoppingCart,
  BarChart3,
  FileText,
  RefreshCw,
  LucideIcon
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getAdminApiKey } from '@/lib/admin-config';

interface Tenant {
  id: string;
  name: string;
  subdomain: string;
}

interface StaffUser {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  role?: string;
  createdAt: string;
  permissions: string[];
}

interface PermissionGroup {
  category: string;
  permissions: {
    id: string;
    label: string;
    description: string;
    icon: LucideIcon;
  }[];
}

const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    category: 'Products',
    permissions: [
      { id: 'product:create', label: 'Create Products', description: 'Create new products', icon: Package },
      { id: 'product:read', label: 'View Products', description: 'View product information', icon: Eye },
      { id: 'product:update', label: 'Edit Products', description: 'Modify existing products', icon: Settings },
      { id: 'product:delete', label: 'Delete Products', description: 'Remove products', icon: XCircle },
      { id: 'product:manage', label: 'Manage Products', description: 'Full product management', icon: Package },
      { id: 'product:supplier_sync', label: 'Sync Supplier Products', description: 'Access and sync supplier products', icon: RefreshCw },
    ],
  },
  {
    category: 'Orders',
    permissions: [
      { id: 'order:create', label: 'Create Orders', description: 'Create new orders', icon: ShoppingCart },
      { id: 'order:read', label: 'View Orders', description: 'View order information', icon: Eye },
      { id: 'order:update', label: 'Update Orders', description: 'Modify existing orders', icon: Settings },
      { id: 'order:delete', label: 'Delete Orders', description: 'Remove orders', icon: XCircle },
      { id: 'order:manage', label: 'Manage Orders', description: 'Full order management', icon: ShoppingCart },
    ],
  },
  {
    category: 'Customers',
    permissions: [
      { id: 'customer:create', label: 'Create Customers', description: 'Create new customer accounts', icon: Users },
      { id: 'customer:read', label: 'View Customers', description: 'View customer information', icon: Eye },
      { id: 'customer:update', label: 'Update Customers', description: 'Modify customer data', icon: Settings },
      { id: 'customer:delete', label: 'Delete Customers', description: 'Remove customers', icon: XCircle },
      { id: 'customer:manage', label: 'Manage Customers', description: 'Full customer management', icon: Users },
    ],
  },
  {
    category: 'Inventory',
    permissions: [
      { id: 'inventory:read', label: 'View Inventory', description: 'View stock levels', icon: Eye },
      { id: 'inventory:update', label: 'Update Inventory', description: 'Modify stock levels', icon: Settings },
      { id: 'inventory:manage', label: 'Manage Inventory', description: 'Full inventory control', icon: Package },
    ],
  },
  {
    category: 'Analytics',
    permissions: [
      { id: 'analytics:read', label: 'View Analytics', description: 'View reports and analytics', icon: BarChart3 },
      { id: 'analytics:manage', label: 'Manage Analytics', description: 'Full analytics access', icon: BarChart3 },
    ],
  },
  {
    category: 'Settings',
    permissions: [
      { id: 'settings:read', label: 'View Settings', description: 'View store settings', icon: Eye },
      { id: 'settings:update', label: 'Update Settings', description: 'Modify store settings', icon: Settings },
    ],
  },
];

export default function PermissionsManager({ adminApiKey }: { adminApiKey?: string }) {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<string | null>(null);
  const [staffUsers, setStaffUsers] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStaff, setSelectedStaff] = useState<StaffUser | null>(null);
  const [editingPermissions, setEditingPermissions] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const loadTenants = useCallback(async () => {
    if (!adminApiKey) return;
    try {
      setLoading(true);
      const response = await coreApi.get('/admin/master/tenants', { 
        requireAuth: true, 
        adminApiKey: adminApiKey 
      });
      setTenants(response.tenants || []);
    } catch (error) {
      console.error('Failed to load tenants:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load tenants'
      });
    } finally {
      setLoading(false);
    }
  }, [toast, adminApiKey]);

  const loadStaffUsers = useCallback(async (tenantId: string) => {
    if (!adminApiKey) return;
    try {
      setLoadingStaff(true);
      // Use the staff API endpoint with tenant context
      const response = await apiClient.fetch(`${apiClient.authUrl}/staff?tenantId=${tenantId}&limit=100`, {
        requireAuth: true,
        adminApiKey: adminApiKey,
      });
      
      // Transform the response to match our interface
      const staffData = (response.data as { id: string; email: string; name?: string; phone?: string; role?: string; createdAt: string; staffPermissions?: { permission: string }[] }[]) || [];
      const transformedStaff = staffData.map((staff) => ({
        id: staff.id,
        email: staff.email,
        name: staff.name,
        phone: staff.phone,
        role: staff.role,
        createdAt: staff.createdAt,
        permissions: staff.staffPermissions?.map((p) => p.permission).filter((p: string) => !p.startsWith('employee:')) || [],
      }));
      
      setStaffUsers(transformedStaff);
    } catch (error) {
      console.error('Failed to load staff users:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load staff users'
      });
    } finally {
      setLoadingStaff(false);
    }
  }, [toast, adminApiKey]);

  useEffect(() => {
    loadTenants();
  }, [loadTenants]);

  useEffect(() => {
    if (selectedTenant) {
      loadStaffUsers(selectedTenant);
    } else {
      setStaffUsers([]);
    }
  }, [selectedTenant, loadStaffUsers]);

  const handleEditPermissions = (staff: StaffUser) => {
    setSelectedStaff(staff);
    setEditingPermissions([...staff.permissions]);
  };

  const togglePermission = (permissionId: string) => {
    if (editingPermissions.includes(permissionId)) {
      setEditingPermissions(editingPermissions.filter(p => p !== permissionId));
    } else {
      setEditingPermissions([...editingPermissions, permissionId]);
    }
  };

  const handleSavePermissions = async () => {
    if (!selectedStaff || !selectedTenant) return;

    try {
      if (!adminApiKey) return;
      setSaving(true);
      await apiClient.fetch(`${apiClient.authUrl}/staff/${selectedStaff.id}/permissions`, {
        method: 'PUT',
        body: JSON.stringify({ permissions: editingPermissions, tenantId: selectedTenant }),
        requireAuth: true,
        adminApiKey: adminApiKey,
      });

      toast({
        title: 'Success',
        description: 'Permissions updated successfully'
      });

      // Update local state
      setStaffUsers(staffUsers.map(staff => 
        staff.id === selectedStaff.id 
          ? { ...staff, permissions: editingPermissions }
          : staff
      ));

      setSelectedStaff(null);
      setEditingPermissions([]);
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err?.message || 'Failed to update permissions'
      });
    } finally {
      setSaving(false);
    }
  };

  const filteredStaff = staffUsers.filter(staff =>
    staff.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    staff.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedTenantData = tenants.find(t => t.id === selectedTenant);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-white mb-2">Employee Permissions Management</h2>
        <p className="text-gray-400">Manage what employees can see and access for each store</p>
      </div>

      {/* Tenant Selector */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <label className="block text-sm font-medium text-gray-400 mb-2">
          Select Store (Tenant)
        </label>
        <select
          value={selectedTenant || ''}
          onChange={(e) => setSelectedTenant(e.target.value || null)}
          className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-purple-500"
        >
          <option value="">-- Select a store --</option>
          {tenants.map(tenant => (
            <option key={tenant.id} value={tenant.id}>
              {tenant.name} ({tenant.subdomain})
            </option>
          ))}
        </select>
      </div>

      {selectedTenant && (
        <>
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Staff List */}
          {loadingStaff ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
            </div>
          ) : filteredStaff.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center">
              <Users className="w-12 h-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400">No employees found for this store</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredStaff.map((staff) => (
                <div
                  key={staff.id}
                  className="bg-slate-900 border border-slate-800 rounded-xl p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-purple-500/10 rounded-full flex items-center justify-center">
                        <UserCheck className="w-6 h-6 text-purple-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">{staff.name || staff.email}</h3>
                        <p className="text-sm text-gray-400">{staff.email}</p>
                        {staff.phone && (
                          <p className="text-xs text-gray-500">{staff.phone}</p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleEditPermissions(staff)}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
                    >
                      <Shield className="w-4 h-4" />
                      Manage Permissions
                    </button>
                  </div>

                  {/* Current Permissions */}
                  <div className="mt-4">
                    <p className="text-sm text-gray-400 mb-2">Current Permissions:</p>
                    <div className="flex flex-wrap gap-2">
                      {staff.permissions.length > 0 ? (
                        staff.permissions.map((permission) => {
                          const permInfo = PERMISSION_GROUPS
                            .flatMap(g => g.permissions)
                            .find(p => p.id === permission);
                          return (
                            <span
                              key={permission}
                              className="px-2 py-1 bg-purple-500/10 text-purple-400 rounded-full text-xs"
                            >
                              {permInfo?.label || permission}
                            </span>
                          );
                        })
                      ) : (
                        <span className="text-gray-500 text-sm">No permissions assigned</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Edit Permissions Modal */}
      {selectedStaff && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-white mb-2">
              Manage Permissions for {selectedStaff.name || selectedStaff.email}
            </h3>
            <p className="text-gray-400 mb-6">
              Select what this employee can see and access
            </p>

            <div className="space-y-6">
              {PERMISSION_GROUPS.map((group) => (
                <div key={group.category} className="border border-slate-800 rounded-lg p-4">
                  <h4 className="font-semibold text-white mb-4 flex items-center gap-2">
                    {group.category}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {group.permissions.map((permission) => {
                      const isChecked = editingPermissions.includes(permission.id);
                      const Icon = permission.icon;
                      return (
                        <label
                          key={permission.id}
                          className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                            isChecked
                              ? 'bg-purple-500/10 border-purple-500'
                              : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => togglePermission(permission.id)}
                            className="mt-1 w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Icon className="w-4 h-4 text-purple-400" />
                              <span className="font-medium text-white text-sm">
                                {permission.label}
                              </span>
                            </div>
                            <p className="text-xs text-gray-400">{permission.description}</p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3 mt-6 pt-6 border-t border-slate-800">
              <button
                onClick={() => {
                  setSelectedStaff(null);
                  setEditingPermissions([]);
                }}
                className="flex-1 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePermissions}
                disabled={saving}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Save Permissions
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

