import { useState, useEffect } from 'react';
import { coreApi } from '@/lib/api';
import { 
  Gift, 
  Plus,
  Search,
  Loader2,
  CheckCircle,
  XCircle,
  Users,
  Crown,
  Zap,
  Calendar,
  Trash2,
  Send,
  RefreshCw,
  DollarSign,
  Clock,
  Star,
  Shield,
  Award
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getAdminApiKey } from '@/lib/admin-config';

interface UserGift {
  id: string;
  userId: string;
  tenantId?: string;
  giftType: 'PLAN_UPGRADE' | 'FEATURE_ACCESS' | 'CREDIT' | 'EXTENSION' | 'TRIAL';
  giftValue: string;
  giftDetails?: Record<string, any>;
  status: 'ACTIVE' | 'EXPIRED' | 'REVOKED' | 'USED';
  expiresAt?: string;
  grantedBy: string;
  grantedAt: string;
  message?: string;
  user?: {
    email: string;
    name?: string;
  };
  tenant?: {
    name: string;
    subdomain: string;
  };
}

interface User {
  id: string;
  email: string;
  name?: string;
  tenantId?: string;
  role: string;
  tenant?: {
    name: string;
    subdomain: string;
    plan: string;
  };
}

interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  plan: string;
  status: string;
}

const GIFT_TYPES = [
  { value: 'PLAN_UPGRADE', label: 'Plan Upgrade', icon: Crown, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  { value: 'FEATURE_ACCESS', label: 'Feature Access', icon: Zap, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  { value: 'CREDIT', label: 'Account Credit', icon: DollarSign, color: 'text-green-500', bg: 'bg-green-500/10' },
  { value: 'EXTENSION', label: 'Plan Extension', icon: Calendar, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { value: 'TRIAL', label: 'Extended Trial', icon: Clock, color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
];

const AVAILABLE_FEATURES = [
  'ai_assistant',
  'page_builder',
  'chat_support',
  'analytics_advanced',
  'custom_domain',
  'api_access',
  'email_marketing',
  'multiple_staff',
  'white_label',
  'webhooks',
  'priority_support',
];

const PLAN_OPTIONS = [
  { value: 'STARTER', label: 'Starter' },
  { value: 'PROFESSIONAL', label: 'Professional' },
  { value: 'ENTERPRISE', label: 'Enterprise' },
];

export default function UserGiftsManager() {
  const [gifts, setGifts] = useState<UserGift[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedGiftType, setSelectedGiftType] = useState<string>('PLAN_UPGRADE');
  const [giftTarget, setGiftTarget] = useState<'user' | 'tenant'>('tenant');
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    targetId: '',
    giftType: 'PLAN_UPGRADE',
    giftValue: 'PROFESSIONAL',
    duration: 30, // days
    creditAmount: 100,
    feature: 'ai_assistant',
    message: '',
    sendNotification: true
  });

  useEffect(() => {
    loadGifts();
    loadUsers();
    loadTenants();
  }, []);

  const loadGifts = async () => {
    try {
      setLoading(true);
      const response = await coreApi.get('/admin/master/gifts', { requireAuth: true, adminApiKey: getAdminApiKey() });
      setGifts(response.data || response.gifts || []);
    } catch (error) {
      console.error('Failed to load gifts:', error);
      setGifts([]);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await coreApi.get('/admin/master/users?limit=100', { requireAuth: true, adminApiKey: getAdminApiKey() });
      setUsers(response.data || response.users || []);
    } catch (error) {
      console.error('Failed to load users:', error);
      setUsers([]);
    }
  };

  const loadTenants = async () => {
    try {
      const response = await coreApi.get('/admin/master/tenants', { requireAuth: true, adminApiKey: getAdminApiKey() });
      setTenants(response.data?.tenants || response.tenants || []);
    } catch (error) {
      console.error('Failed to load tenants:', error);
      setTenants([]);
    }
  };

  const handleGrant = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const giftData = {
      targetType: giftTarget,
      targetId: formData.targetId,
      giftType: selectedGiftType,
      giftValue: selectedGiftType === 'CREDIT' 
        ? formData.creditAmount.toString()
        : selectedGiftType === 'FEATURE_ACCESS'
          ? formData.feature
          : formData.giftValue,
      duration: formData.duration,
      message: formData.message,
      sendNotification: formData.sendNotification
    };

    try {
      await coreApi.post('/admin/master/gifts', giftData, { requireAuth: true, adminApiKey: getAdminApiKey() });
      toast({
        title: '🎁 Gift Granted!',
        description: 'The gift has been successfully granted'
      });
      setShowCreateModal(false);
      resetForm();
      loadGifts();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: '❌ Error',
        description: error.response?.data?.message || 'Failed to grant gift'
      });
    }
  };

  const handleRevoke = async (giftId: string) => {
    if (!confirm('Are you sure you want to revoke this gift?')) return;
    
    try {
      await coreApi.post(`/admin/master/gifts/${giftId}/revoke`, {}, { requireAuth: true, adminApiKey: getAdminApiKey() });
      toast({
        title: '✅ Success',
        description: 'Gift has been revoked'
      });
      loadGifts();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: '❌ Error',
        description: error.response?.data?.message || 'Failed to revoke gift'
      });
    }
  };

  const resetForm = () => {
    setFormData({
      targetId: '',
      giftType: 'PLAN_UPGRADE',
      giftValue: 'PROFESSIONAL',
      duration: 30,
      creditAmount: 100,
      feature: 'ai_assistant',
      message: '',
      sendNotification: true
    });
    setSelectedGiftType('PLAN_UPGRADE');
    setGiftTarget('tenant');
  };

  const getGiftTypeInfo = (type: string) => {
    return GIFT_TYPES.find(t => t.value === type) || GIFT_TYPES[0];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-500/10 text-green-500';
      case 'EXPIRED': return 'bg-gray-500/10 text-gray-500';
      case 'REVOKED': return 'bg-red-500/10 text-red-500';
      case 'USED': return 'bg-blue-500/10 text-blue-500';
      default: return 'bg-gray-500/10 text-gray-500';
    }
  };

  const filteredGifts = gifts.filter(gift =>
    (gift.user?.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (gift.tenant?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    gift.giftType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: gifts.length,
    active: gifts.filter(g => g.status === 'ACTIVE').length,
    planUpgrades: gifts.filter(g => g.giftType === 'PLAN_UPGRADE').length,
    featureGrants: gifts.filter(g => g.giftType === 'FEATURE_ACCESS').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">User Gifts & Rewards</h2>
          <p className="text-gray-400">Grant gifts, upgrades, and free access to users</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-lg hover:from-pink-700 hover:to-rose-700 transition-all shadow-lg shadow-pink-500/20"
        >
          <Gift className="w-4 h-4" />
          Grant Gift
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-pink-500/10 rounded-lg">
              <Gift className="w-5 h-5 text-pink-500" />
            </div>
            <span className="text-2xl font-bold text-white">{stats.total}</span>
          </div>
          <p className="text-sm text-gray-400">Total Gifts</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-500" />
            </div>
            <span className="text-2xl font-bold text-white">{stats.active}</span>
          </div>
          <p className="text-sm text-gray-400">Active Gifts</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-amber-500/10 rounded-lg">
              <Crown className="w-5 h-5 text-amber-500" />
            </div>
            <span className="text-2xl font-bold text-white">{stats.planUpgrades}</span>
          </div>
          <p className="text-sm text-gray-400">Plan Upgrades</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <Zap className="w-5 h-5 text-purple-500" />
            </div>
            <span className="text-2xl font-bold text-white">{stats.featureGrants}</span>
          </div>
          <p className="text-sm text-gray-400">Feature Grants</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
        <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
        <div className="flex flex-wrap gap-3">
          {GIFT_TYPES.map(type => {
            const IconComponent = type.icon;
            return (
              <button
                key={type.value}
                onClick={() => {
                  setSelectedGiftType(type.value);
                  setShowCreateModal(true);
                }}
                className={`flex items-center gap-2 px-4 py-2 ${type.bg} ${type.color} rounded-lg hover:opacity-80 transition-opacity`}
              >
                <IconComponent className="w-4 h-4" />
                Grant {type.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search gifts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-pink-500"
          />
        </div>
        <button
          onClick={loadGifts}
          className="px-4 py-2 bg-slate-800 text-gray-300 rounded-lg hover:bg-slate-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Gifts List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-950">
              <tr className="text-gray-400 text-sm">
                <th className="text-left px-6 py-4 font-medium">Recipient</th>
                <th className="text-left px-6 py-4 font-medium">Gift Type</th>
                <th className="text-left px-6 py-4 font-medium">Value</th>
                <th className="text-center px-6 py-4 font-medium">Status</th>
                <th className="text-left px-6 py-4 font-medium">Expires</th>
                <th className="text-right px-6 py-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredGifts.map((gift) => {
                const typeInfo = getGiftTypeInfo(gift.giftType);
                const IconComponent = typeInfo.icon;
                
                return (
                  <tr key={gift.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-800 rounded-full">
                          {gift.tenantId ? (
                            <Shield className="w-4 h-4 text-blue-400" />
                          ) : (
                            <Users className="w-4 h-4 text-gray-400" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-white">
                            {gift.tenant?.name || gift.user?.name || gift.user?.email || 'Unknown'}
                          </div>
                          {gift.tenant && (
                            <div className="text-sm text-gray-400">{gift.tenant.subdomain}.saaah.com</div>
                          )}
                          {gift.user && !gift.tenant && (
                            <div className="text-sm text-gray-400">{gift.user.email}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg ${typeInfo.bg} ${typeInfo.color}`}>
                        <IconComponent className="w-4 h-4" />
                        <span className="text-sm font-medium">{typeInfo.label}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-white font-medium">{gift.giftValue}</span>
                      {gift.message && (
                        <p className="text-xs text-gray-400 mt-1 max-w-[200px] truncate">{gift.message}</p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(gift.status)}`}>
                        {gift.status === 'ACTIVE' && <CheckCircle className="w-3 h-3" />}
                        {gift.status === 'EXPIRED' && <Clock className="w-3 h-3" />}
                        {gift.status === 'REVOKED' && <XCircle className="w-3 h-3" />}
                        {gift.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-400 text-sm">
                      {gift.expiresAt 
                        ? new Date(gift.expiresAt).toLocaleDateString()
                        : 'Never'
                      }
                    </td>
                    <td className="px-6 py-4 text-right">
                      {gift.status === 'ACTIVE' && (
                        <button
                          onClick={() => handleRevoke(gift.id)}
                          className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Revoke gift"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filteredGifts.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <Gift className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No gifts found</p>
                    <p className="text-sm mt-1">Start granting gifts to your users!</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Grant Gift Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 w-full max-w-lg">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-pink-500/10 rounded-lg">
                <Gift className="w-6 h-6 text-pink-500" />
              </div>
              <h3 className="text-xl font-bold text-white">Grant Gift</h3>
            </div>

            <form onSubmit={handleGrant} className="space-y-4">
              {/* Gift Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Gift Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {GIFT_TYPES.map(type => {
                    const IconComponent = type.icon;
                    return (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => setSelectedGiftType(type.value)}
                        className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                          selectedGiftType === type.value
                            ? `${type.bg} border-current ${type.color}`
                            : 'bg-slate-800 border-transparent text-gray-400 hover:bg-slate-700'
                        }`}
                      >
                        <IconComponent className="w-5 h-5" />
                        <span className="text-sm font-medium">{type.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Target Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Grant To
                </label>
                <div className="flex gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => setGiftTarget('tenant')}
                    className={`flex-1 flex items-center justify-center gap-2 p-2 rounded-lg ${
                      giftTarget === 'tenant'
                        ? 'bg-blue-500/10 text-blue-500 border border-blue-500/50'
                        : 'bg-slate-800 text-gray-400'
                    }`}
                  >
                    <Shield className="w-4 h-4" />
                    Tenant (Store)
                  </button>
                  <button
                    type="button"
                    onClick={() => setGiftTarget('user')}
                    className={`flex-1 flex items-center justify-center gap-2 p-2 rounded-lg ${
                      giftTarget === 'user'
                        ? 'bg-blue-500/10 text-blue-500 border border-blue-500/50'
                        : 'bg-slate-800 text-gray-400'
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    User
                  </button>
                </div>

                <select
                  value={formData.targetId}
                  onChange={(e) => setFormData({ ...formData, targetId: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-pink-500"
                  required
                >
                  <option value="">Select {giftTarget === 'tenant' ? 'a tenant' : 'a user'}...</option>
                  {giftTarget === 'tenant' 
                    ? tenants.map(t => (
                        <option key={t.id} value={t.id}>
                          {t.name} ({t.subdomain}) - {t.plan}
                        </option>
                      ))
                    : users.map(u => (
                        <option key={u.id} value={u.id}>
                          {u.name || u.email} - {u.role}
                        </option>
                      ))
                  }
                </select>
              </div>

              {/* Gift Value based on type */}
              {selectedGiftType === 'PLAN_UPGRADE' && (
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Upgrade to Plan
                  </label>
                  <select
                    value={formData.giftValue}
                    onChange={(e) => setFormData({ ...formData, giftValue: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-pink-500"
                  >
                    {PLAN_OPTIONS.map(plan => (
                      <option key={plan.value} value={plan.value}>{plan.label}</option>
                    ))}
                  </select>
                </div>
              )}

              {selectedGiftType === 'FEATURE_ACCESS' && (
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Feature to Grant
                  </label>
                  <select
                    value={formData.feature}
                    onChange={(e) => setFormData({ ...formData, feature: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-pink-500"
                  >
                    {AVAILABLE_FEATURES.map(feature => (
                      <option key={feature} value={feature}>
                        {feature.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {selectedGiftType === 'CREDIT' && (
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Credit Amount (SAR)
                  </label>
                  <input
                    type="number"
                    value={formData.creditAmount}
                    onChange={(e) => setFormData({ ...formData, creditAmount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-pink-500"
                    min="0"
                    step="1"
                  />
                </div>
              )}

              {/* Duration */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Duration (days)
                </label>
                <div className="flex gap-2">
                  {[7, 14, 30, 60, 90, 365].map(days => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => setFormData({ ...formData, duration: days })}
                      className={`px-3 py-1 rounded-lg text-sm ${
                        formData.duration === days
                          ? 'bg-pink-600 text-white'
                          : 'bg-slate-800 text-gray-400 hover:bg-slate-700'
                      }`}
                    >
                      {days}d
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, duration: -1 })}
                    className={`px-3 py-1 rounded-lg text-sm ${
                      formData.duration === -1
                        ? 'bg-pink-600 text-white'
                        : 'bg-slate-800 text-gray-400 hover:bg-slate-700'
                    }`}
                  >
                    Forever
                  </button>
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Personal Message (optional)
                </label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-pink-500"
                  rows={2}
                  placeholder="Thank you for being a valued customer!"
                />
              </div>

              {/* Send Notification */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.sendNotification}
                  onChange={(e) => setFormData({ ...formData, sendNotification: e.target.checked })}
                  className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-pink-600 focus:ring-pink-500"
                />
                <span className="text-sm text-gray-300">Send email notification to recipient</span>
              </label>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-lg hover:from-pink-700 hover:to-rose-700 transition-all"
                >
                  <Send className="w-4 h-4" />
                  Grant Gift
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
