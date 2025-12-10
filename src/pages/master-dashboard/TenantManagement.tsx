import { useState, useEffect, useCallback } from 'react';
import { coreApi } from '@/lib/api';
import { 
  Users, 
  Plus,
  Edit,
  Trash2,
  Power,
  PowerOff,
  DollarSign,
  Search,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  plan: string;
  status: string;
  createdAt: string;
  _count?: {
    products: number;
    orders: number;
    users: number;
  };
}

export default function TenantManagement() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    subdomain: '',
    plan: 'STARTER',
    description: '',
    ownerEmail: '',
    ownerPassword: ''
  });

  const loadTenants = useCallback(async () => {
    try {
      setLoading(true);
      const response = await coreApi.get('/admin/master/tenants', { requireAuth: false, adminApiKey: 'BlackBox2025Admin!' });
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
  }, [toast]);

  useEffect(() => {
    loadTenants();
  }, [loadTenants]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await coreApi.post('/admin/master/tenants', formData, { requireAuth: false, adminApiKey: 'BlackBox2025Admin!' });
      toast({
        title: 'Success',
        description: 'Tenant created successfully'
      });
      setShowCreateModal(false);
      setFormData({
        name: '',
        subdomain: '',
        plan: 'STARTER',
        description: '',
        ownerEmail: '',
        ownerPassword: ''
      });
      loadTenants();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create tenant'
      });
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTenant) return;
    
    try {
      await coreApi.put(`/admin/master/tenants/${editingTenant.id}`, {
        name: formData.name,
        plan: formData.plan,
        description: formData.description
      }, { requireAuth: false, adminApiKey: 'BlackBox2025Admin!' });
      toast({
        title: 'Success',
        description: 'Tenant updated successfully'
      });
      setEditingTenant(null);
      loadTenants();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update tenant'
      });
    }
  };

  const handleSuspend = async (id: string) => {
    if (!confirm('Are you sure you want to suspend this tenant?')) return;
    
    try {
      await coreApi.post(`/admin/master/tenants/${id}/suspend`, {
        reason: 'Suspended by admin'
      }, { requireAuth: false, adminApiKey: 'BlackBox2025Admin!' });
      toast({
        title: 'Success',
        description: 'Tenant suspended'
      });
      loadTenants();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
      });
    }
  };

  const handleActivate = async (id: string) => {
    try {
      await coreApi.post(`/admin/master/tenants/${id}/activate`, {}, { requireAuth: false, adminApiKey: 'BlackBox2025Admin!' });
      toast({
        title: 'Success',
        description: 'Tenant activated'
      });
      loadTenants();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.response?.data?.message || 'Failed to activate tenant'
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this tenant? This action cannot be undone.')) return;
    
    try {
      await coreApi.delete(`/admin/master/tenants/${id}`, { requireAuth: false, adminApiKey: 'BlackBox2025Admin!' });
      toast({
        title: 'Success',
        description: 'Tenant deleted'
      });
      loadTenants();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.response?.data?.message || 'Failed to delete tenant'
      });
    }
  };

  const filteredTenants = tenants.filter(tenant =>
    tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tenant.subdomain.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'SUSPENDED':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'INACTIVE':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Tenant Management</h2>
          <p className="text-gray-400">Manage all tenants across the platform</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Tenant
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          type="text"
          placeholder="Search tenants..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-purple-500"
        />
      </div>

      {/* Tenants List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-950 text-slate-400">
              <tr>
                <th className="p-4 text-left font-medium">Tenant</th>
                <th className="p-4 text-left font-medium">Plan</th>
                <th className="p-4 text-left font-medium">Status</th>
                <th className="p-4 text-left font-medium">Stats</th>
                <th className="p-4 text-left font-medium">Created</th>
                <th className="p-4 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredTenants.map((tenant) => (
                <tr key={tenant.id} className="hover:bg-slate-800/50 transition-colors">
                  <td className="p-4">
                    <div>
                      <div className="font-medium text-white">{tenant.name}</div>
                      <div className="text-sm text-gray-400">{tenant.subdomain}.saaah.com</div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="px-2 py-1 bg-purple-500/10 text-purple-400 rounded-full text-xs font-medium">
                      {tenant.plan}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(tenant.status)}
                      <span className="text-sm text-white">{tenant.status}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="text-sm text-gray-400">
                      {tenant._count?.products || 0} products • {tenant._count?.orders || 0} orders
                    </div>
                  </td>
                  <td className="p-4 text-sm text-gray-400">
                    {new Date(tenant.createdAt).toLocaleDateString()}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => {
                          setEditingTenant(tenant);
                          setFormData({
                            name: tenant.name,
                            subdomain: tenant.subdomain,
                            plan: tenant.plan,
                            description: '',
                            ownerEmail: '',
                            ownerPassword: ''
                          });
                        }}
                        className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4 text-blue-400" />
                      </button>
                      {tenant.status === 'ACTIVE' ? (
                        <button
                          onClick={() => handleSuspend(tenant.id)}
                          className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                          title="Suspend"
                        >
                          <PowerOff className="w-4 h-4 text-yellow-400" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleActivate(tenant.id)}
                          className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                          title="Activate"
                        >
                          <Power className="w-4 h-4 text-green-400" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(tenant.id)}
                        className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredTenants.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-400">
                    No tenants found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Create/Edit Modal */}
      {(showCreateModal || editingTenant) && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-white mb-4">
              {editingTenant ? 'Edit Tenant' : 'Create New Tenant'}
            </h3>
            <form onSubmit={editingTenant ? handleUpdate : handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Tenant Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-purple-500"
                  required
                />
              </div>
              
              {!editingTenant && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Subdomain
                    </label>
                    <input
                      type="text"
                      value={formData.subdomain}
                      onChange={(e) => setFormData({ ...formData, subdomain: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-purple-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Owner Email
                    </label>
                    <input
                      type="email"
                      value={formData.ownerEmail}
                      onChange={(e) => setFormData({ ...formData, ownerEmail: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-purple-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Owner Password
                    </label>
                    <input
                      type="password"
                      value={formData.ownerPassword}
                      onChange={(e) => setFormData({ ...formData, ownerPassword: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-purple-500"
                      required
                    />
                  </div>
                </>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Plan
                </label>
                <select
                  value={formData.plan}
                  onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="STARTER">Starter</option>
                  <option value="PROFESSIONAL">Professional</option>
                  <option value="ENTERPRISE">Enterprise</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingTenant(null);
                  }}
                  className="flex-1 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  {editingTenant ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
