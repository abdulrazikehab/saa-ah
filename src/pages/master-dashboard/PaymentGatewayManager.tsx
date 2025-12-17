import { useState, useEffect, useCallback } from 'react';
import { coreApi } from '@/lib/api';
import { 
  CreditCard, 
  Plus,
  Edit,
  Trash2,
  Power,
  PowerOff,
  Search,
  Loader2,
  CheckCircle,
  XCircle,
  Settings
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface GatewayCredentials {
  secretKey?: string;
  publishableKey?: string;
  clientId?: string;
  clientSecret?: string;
  entityId?: string;
  accessToken?: string;
  [key: string]: string | undefined;
}

interface PaymentGateway {
  id: string;
  name: string;
  provider: string;
  isActive: boolean;
  credentials: GatewayCredentials;
  settings: Record<string, unknown>;
  createdAt: string;
  _count?: {
    transactions: number;
  };
  totalProcessed?: number;
}

const PROVIDERS = [
  { value: 'HYPERPAY', label: 'HyperPay' },
  { value: 'NEOLEAP', label: 'Neoleap' }
];

import { getAdminApiKeySync } from '@/lib/admin-config';

const ADMIN_API_KEY = getAdminApiKeySync();

export default function PaymentGatewayManager() {
  const [gateways, setGateways] = useState<PaymentGateway[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingGateway, setEditingGateway] = useState<PaymentGateway | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    provider: 'HYPERPAY',
    tenantId: null as string | null, // null for admin-created global gateways
    credentials: {} as GatewayCredentials,
    settings: {} as Record<string, unknown>,
    isActive: true
  });

  const loadGateways = useCallback(async () => {
    try {
      setLoading(true);
      const response = await coreApi.get('/admin/master/payment-gateways', { requireAuth: true, adminApiKey: ADMIN_API_KEY });
      // Handle different response formats - backend returns { gateways: [...] }
      const gatewaysData = (response as any)?.gateways || (response as any)?.data?.gateways || (Array.isArray(response) ? response : []);
      // Backend already filters to show only admin-created gateways (tenantId is null), but double-check
      const adminGateways = Array.isArray(gatewaysData) 
        ? gatewaysData.filter((g: any) => !g.tenantId || g.tenantId === null)
        : [];
      setGateways(adminGateways);
    } catch (error: any) {
      console.error('Failed to load payment gateways:', error);
      toast({
        title: 'Error',
        description: error?.message || 'Failed to load payment gateways',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadGateways();
  }, [loadGateways]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      toast({ variant: 'destructive', title: 'Missing name', description: 'Please provide a gateway name.' });
      return;
    }
    if (formData.provider === 'HYPERPAY' && !formData.credentials.entityId) {
      toast({ variant: 'destructive', title: 'Missing Entity ID', description: 'HyperPay requires Entity ID at minimum.' });
      return;
    }
    if (formData.provider === 'NEOLEAP' && !formData.credentials.clientId) {
      toast({ variant: 'destructive', title: 'Missing Client ID', description: 'Neoleap requires Client ID.' });
      return;
    }

    try {
      await coreApi.post('/admin/master/payment-gateways', formData, { requireAuth: true, adminApiKey: ADMIN_API_KEY });
      toast({
        title: 'Success',
        description: 'Payment gateway created successfully'
      });
      setShowCreateModal(false);
      resetForm();
      loadGateways();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error?.message || error?.response?.data?.message || 'Failed to create gateway'
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this gateway?')) return;
    
    try {
      await coreApi.delete(`/admin/master/payment-gateways/${id}`, { requireAuth: true, adminApiKey: ADMIN_API_KEY });
      toast({
        title: 'Success',
        description: 'Gateway deleted'
      });
      loadGateways();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.response?.data?.message || 'Failed to delete gateway'
      });
    }
  };

  const handleToggle = async (id: string) => {
    try {
      await coreApi.post(`/admin/master/payment-gateways/${id}/toggle`, {}, { requireAuth: true, adminApiKey: ADMIN_API_KEY });
      toast({
        title: 'Success',
        description: 'Gateway status updated'
      });
      loadGateways();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.response?.data?.message || 'Failed to toggle gateway'
      });
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGateway) return;
    if (!formData.name) {
      toast({ variant: 'destructive', title: 'Missing name', description: 'Please provide a gateway name.' });
      return;
    }
    if (formData.provider === 'HYPERPAY' && !formData.credentials.entityId) {
      toast({ variant: 'destructive', title: 'Missing Entity ID', description: 'HyperPay requires Entity ID at minimum.' });
      return;
    }
    if (formData.provider === 'NEOLEAP' && !formData.credentials.clientId) {
      toast({ variant: 'destructive', title: 'Missing Client ID', description: 'Neoleap requires Client ID.' });
      return;
    }
    
    try {
      await coreApi.put(`/admin/master/payment-gateways/${editingGateway.id}`, formData, { requireAuth: true, adminApiKey: ADMIN_API_KEY });
      toast({
        title: 'Success',
        description: 'Payment gateway updated successfully'
      });
      setShowCreateModal(false);
      setEditingGateway(null);
      resetForm();
      loadGateways();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error?.message || error?.response?.data?.message || 'Failed to update gateway'
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      provider: 'HYPERPAY',
      tenantId: null, // Admin-created gateways are global (no tenant)
      credentials: {},
      settings: {},
      isActive: true
    });
  };

  const filteredGateways = gateways.filter(gateway =>
    gateway.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    gateway.provider.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Payment Gateway Management</h2>
          <p className="text-gray-400">Configure and manage payment gateways</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Gateway
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          type="text"
          placeholder="Search gateways..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-green-500"
        />
      </div>

      {/* Gateways List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-green-500" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredGateways.map((gateway) => (
            <div
              key={gateway.id}
              className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-green-500/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${gateway.isActive ? 'bg-green-500/10' : 'bg-gray-500/10'}`}>
                    <CreditCard className={`w-5 h-5 ${gateway.isActive ? 'text-green-500' : 'text-gray-500'}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{gateway.name}</h3>
                    <p className="text-sm text-gray-400">{gateway.provider}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {gateway.isActive ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <XCircle className="w-4 h-4 text-gray-500" />
                  )}
                </div>
              </div>

              <div className="mb-4">
                <p className="text-xs text-gray-500 mt-1">
                  Created: {new Date(gateway.createdAt).toLocaleDateString()}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setEditingGateway(gateway);
                    setFormData({
                      name: gateway.name,
                      provider: gateway.provider,
                      tenantId: (gateway as any).tenantId || null,
                      credentials: gateway.credentials || {},
                      settings: gateway.settings || {},
                      isActive: gateway.isActive
                    });
                    setShowCreateModal(true);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={() => handleToggle(gateway.id)}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                    gateway.isActive
                      ? 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20'
                      : 'bg-green-500/10 text-green-500 hover:bg-green-500/20'
                  }`}
                >
                  {gateway.isActive ? (
                    <>
                      <PowerOff className="w-4 h-4" />
                      Disable
                    </>
                  ) : (
                    <>
                      <Power className="w-4 h-4" />
                      Enable
                    </>
                  )}
                </button>
                <button
                  onClick={() => handleDelete(gateway.id)}
                  className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          {filteredGateways.length === 0 && (
            <div className="col-span-full p-8 text-center text-gray-400">
              No payment gateways found
            </div>
          )}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-white mb-6">
              {editingGateway ? 'Edit Gateway' : 'Add New Gateway'}
            </h3>
            <form onSubmit={editingGateway ? handleUpdate : handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Gateway Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-green-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Provider
                </label>
                <select
                  value={formData.provider}
                  onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-green-500"
                  disabled={!!editingGateway}
                >
                  {PROVIDERS.map(p => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>

              {/* Dynamic Credentials Fields based on Provider */}
              <div className="space-y-4 border-t border-slate-800 pt-4 mt-4">
                <h4 className="text-sm font-medium text-white">Credentials</h4>
                
                {formData.provider === 'STRIPE' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">
                        Secret Key
                      </label>
                      <input
                        type="password"
                        value={formData.credentials.secretKey || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          credentials: { ...formData.credentials, secretKey: e.target.value }
                        })}
                        className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">
                        Publishable Key
                      </label>
                      <input
                        type="text"
                        value={formData.credentials.publishableKey || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          credentials: { ...formData.credentials, publishableKey: e.target.value }
                        })}
                        className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-green-500"
                      />
                    </div>
                  </>
                )}

                {formData.provider === 'PAYPAL' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">
                        Client ID
                      </label>
                      <input
                        type="text"
                        value={formData.credentials.clientId || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          credentials: { ...formData.credentials, clientId: e.target.value }
                        })}
                        className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">
                        Client Secret
                      </label>
                      <input
                        type="password"
                        value={formData.credentials.clientSecret || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          credentials: { ...formData.credentials, clientSecret: e.target.value }
                        })}
                        className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-green-500"
                      />
                    </div>
                  </>
                )}

                {(formData.provider === 'HYPERPAY' || formData.provider === 'NEOLEAP') && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">
                        Entity ID
                      </label>
                      <input
                        type="text"
                        value={formData.credentials.entityId || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          credentials: { ...formData.credentials, entityId: e.target.value }
                        })}
                        className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">
                        Access Token
                      </label>
                      <input
                        type="password"
                        value={formData.credentials.accessToken || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          credentials: { ...formData.credentials, accessToken: e.target.value }
                        })}
                        className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-green-500"
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingGateway(null);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  {editingGateway ? 'Update Gateway' : 'Add Gateway'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
