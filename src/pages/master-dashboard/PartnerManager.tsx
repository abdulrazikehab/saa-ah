import { useState, useEffect, useCallback } from 'react';
import { coreApi } from '@/lib/api';
import { 
  Handshake, 
  Plus,
  Edit,
  Trash2,
  Search,
  Loader2,
  DollarSign,
  Percent
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getAdminApiKey } from '@/lib/admin-config';

interface Partner {
  id: string;
  name: string;
  nameAr?: string;
  email: string;
  phone?: string;
  commissionType: 'PERCENTAGE' | 'FIXED';
  commissionValue: number;
  isActive: boolean;
  createdAt: string;
  aiScript?: string;
}

export default function PartnerManager() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    nameAr: '',
    email: '',
    phone: '',
    commissionType: 'PERCENTAGE' as 'PERCENTAGE' | 'FIXED',
    commissionValue: 0,
    aiScript: ''
  });

  const loadPartners = useCallback(async () => {
    try {
      setLoading(true);
      const response = await coreApi.get('/admin/master/partners', { requireAuth: false, adminApiKey: 'getAdminApiKey()' });
      setPartners(response.partners || response || []);
    } catch (error) {
      console.error('Failed to load partners:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load partners'
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadPartners();
  }, [loadPartners]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await coreApi.post('/admin/master/partners', formData, { requireAuth: false, adminApiKey: 'getAdminApiKey()' });
      toast({
        title: 'Success',
        description: 'Partner created successfully'
      });
      setShowCreateModal(false);
      resetForm();
      loadPartners();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create partner'
      });
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPartner) return;
    
    try {
      await coreApi.put(`/admin/master/partners/${editingPartner.id}`, formData, { requireAuth: false, adminApiKey: 'getAdminApiKey()' });
      toast({
        title: 'Success',
        description: 'Partner updated successfully'
      });
      setEditingPartner(null);
      loadPartners();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update partner'
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this partner?')) return;
    
    try {
      await coreApi.delete(`/admin/master/partners/${id}`, { requireAuth: false, adminApiKey: 'getAdminApiKey()' });
      toast({
        title: 'Success',
        description: 'Partner deleted'
      });
      loadPartners();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.response?.data?.message || 'Failed to delete partner'
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      nameAr: '',
      email: '',
      phone: '',
      commissionType: 'PERCENTAGE',
      commissionValue: 0,
      aiScript: ''
    });
  };

  const filteredPartners = partners.filter(partner =>
    partner.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    partner.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (partner.nameAr && partner.nameAr.includes(searchTerm))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Partner Management</h2>
          <p className="text-gray-400">Manage business partners and commissions</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Partner
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          type="text"
          placeholder="Search partners..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-indigo-500"
        />
      </div>

      {/* Partners List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredPartners.map((partner) => (
            <div
              key={partner.id}
              className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-indigo-500/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-lg ${partner.isActive ? 'bg-indigo-500/10' : 'bg-gray-500/10'}`}>
                    <Handshake className={`w-6 h-6 ${partner.isActive ? 'text-indigo-500' : 'text-gray-500'}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white text-lg">{partner.name}</h3>
                    {partner.nameAr && (
                      <p className="text-sm text-gray-400">{partner.nameAr}</p>
                    )}
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  partner.isActive
                    ? 'bg-green-500/10 text-green-500'
                    : 'bg-gray-500/10 text-gray-500'
                }`}>
                  {partner.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-400">Email:</span>
                  <span className="text-white">{partner.email}</span>
                </div>
                {partner.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-400">Phone:</span>
                    <span className="text-white">{partner.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-400">Commission:</span>
                  <div className="flex items-center gap-1">
                    {partner.commissionType === 'PERCENTAGE' ? (
                      <>
                        <Percent className="w-4 h-4 text-indigo-400" />
                        <span className="text-white font-medium">{partner.commissionValue}%</span>
                      </>
                    ) : (
                      <>
                        <DollarSign className="w-4 h-4 text-indigo-400" />
                        <span className="text-white font-medium">${partner.commissionValue}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  Created: {new Date(partner.createdAt).toLocaleDateString()}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setEditingPartner(partner);
                    setFormData({
                      name: partner.name,
                      nameAr: partner.nameAr || '',
                      email: partner.email,
                      phone: partner.phone || '',
                      commissionType: partner.commissionType,
                      commissionValue: partner.commissionValue,
                      aiScript: partner.aiScript || ''
                    });
                    setShowCreateModal(true);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(partner.id)}
                  className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          {filteredPartners.length === 0 && (
            <div className="col-span-full p-8 text-center text-gray-400">
              No partners found
            </div>
          )}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-white mb-6">
              {editingPartner ? 'Edit Partner' : 'Add New Partner'}
            </h3>
            <form onSubmit={editingPartner ? handleUpdate : handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Partner Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Partner Name (Arabic)
                </label>
                <input
                  type="text"
                  value={formData.nameAr}
                  onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                  dir="rtl"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Commission Type
                  </label>
                  <select
                    value={formData.commissionType}
                    onChange={(e) => setFormData({ ...formData, commissionType: e.target.value as any })}
                    className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED">Fixed Amount ($)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Commission Value
                  </label>
                  <input
                    type="number"
                    value={formData.commissionValue}
                    onChange={(e) => setFormData({ ...formData, commissionValue: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  AI Script (Optional)
                </label>
                <textarea
                  value={formData.aiScript}
                  onChange={(e) => setFormData({ ...formData, aiScript: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-indigo-500 font-mono text-sm"
                  rows={3}
                  placeholder="Custom instructions for AI..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingPartner(null);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  {editingPartner ? 'Update Partner' : 'Add Partner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
