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
  DollarSign,
  Crown,
  Zap,
  Building2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Plan {
  id: string;
  name: string;
  nameAr?: string;
  description?: string;
  descriptionAr?: string;
  price: number;
  currency: string;
  billingCycle: 'MONTHLY' | 'YEARLY' | 'LIFETIME';
  features: string[];
  featuresAr?: string[];
  limits: {
    products?: number;
    orders?: number;
    storage?: number;
    staff?: number;
    customDomains?: number;
  };
  isActive: boolean;
  isPopular: boolean;
  sortOrder: number;
  createdAt: string;
  _count?: {
    tenants: number;
  };
}

const BILLING_CYCLES = [
  { value: 'MONTHLY', label: 'Monthly', labelAr: 'شهري' },
  { value: 'YEARLY', label: 'Yearly', labelAr: 'سنوي' },
  { value: 'LIFETIME', label: 'Lifetime', labelAr: 'مدى الحياة' }
];

const DEFAULT_FEATURES = [
  'Unlimited products',
  'Advanced analytics',
  'Priority support',
  'Custom domain',
  'API access',
  'Multiple staff accounts',
  'Email marketing',
  'Chat support',
  'White-label',
  'Custom integrations'
];

export default function PlansManager() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    nameAr: '',
    description: '',
    descriptionAr: '',
    price: 0,
    currency: 'SAR',
    billingCycle: 'MONTHLY' as 'MONTHLY' | 'YEARLY' | 'LIFETIME',
    features: [] as string[],
    featuresAr: [] as string[],
    limits: {
      products: -1,
      orders: -1,
      storage: 10,
      staff: 5,
      customDomains: 1
    },
    isActive: true,
    isPopular: false,
    sortOrder: 0
  });

  const [newFeature, setNewFeature] = useState('');
  const [newFeatureAr, setNewFeatureAr] = useState('');

  const loadPlans = useCallback(async () => {
    try {
      setLoading(true);
      const response = await coreApi.get('/admin/master/plans', { requireAuth: false, adminApiKey: 'BlackBox2025Admin!' });
      setPlans(response.plans || []);
    } catch (error) {
      console.error('Failed to load plans:', error);
      toast({
        title: 'Error',
        description: 'Failed to load plans',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  const resetForm = () => {
    setFormData({
      name: '',
      nameAr: '',
      description: '',
      descriptionAr: '',
      price: 0,
      currency: 'SAR',
      billingCycle: 'MONTHLY',
      features: [],
      featuresAr: [],
      limits: {
        products: -1,
        orders: -1,
        storage: 10,
        staff: 5,
        customDomains: 1
      },
      isActive: true,
      isPopular: false,
      sortOrder: 0
    });
    setNewFeature('');
    setNewFeatureAr('');
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await coreApi.post('/admin/master/plans', formData, { requireAuth: false, adminApiKey: 'BlackBox2025Admin!' });
      toast({
        title: 'Success',
        description: 'Plan created successfully',
      });
      setShowCreateModal(false);
      resetForm();
      loadPlans();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create plan',
        variant: 'destructive',
      });
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan) return;
    try {
      await coreApi.put(`/admin/master/plans/${editingPlan.id}`, formData, { requireAuth: false, adminApiKey: 'BlackBox2025Admin!' });
      toast({
        title: 'Success',
        description: 'Plan updated successfully',
      });
      setShowCreateModal(false);
      setEditingPlan(null);
      resetForm();
      loadPlans();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update plan',
        variant: 'destructive',
      });
    }
  };

  const handleToggle = async (id: string) => {
    try {
      await coreApi.patch(`/admin/master/plans/${id}/toggle`, {}, { requireAuth: false, adminApiKey: 'BlackBox2025Admin!' });
      toast({
        title: 'Success',
        description: 'Plan status updated',
      });
      loadPlans();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update plan status',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this plan?')) return;
    try {
      await coreApi.delete(`/admin/master/plans/${id}`, { requireAuth: false, adminApiKey: 'BlackBox2025Admin!' });
      toast({
        title: 'Success',
        description: 'Plan deleted successfully',
      });
      loadPlans();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete plan',
        variant: 'destructive',
      });
    }
  };

  const addFeature = () => {
    if (newFeature.trim() && !formData.features.includes(newFeature.trim())) {
      setFormData({
        ...formData,
        features: [...formData.features, newFeature.trim()]
      });
      setNewFeature('');
    }
  };

  const addFeatureAr = () => {
    if (newFeatureAr.trim() && !formData.featuresAr.includes(newFeatureAr.trim())) {
      setFormData({
        ...formData,
        featuresAr: [...formData.featuresAr, newFeatureAr.trim()]
      });
      setNewFeatureAr('');
    }
  };

  const removeFeature = (feature: string) => {
    setFormData({
      ...formData,
      features: formData.features.filter(f => f !== feature)
    });
  };

  const removeFeatureAr = (feature: string) => {
    setFormData({
      ...formData,
      featuresAr: formData.featuresAr.filter(f => f !== feature)
    });
  };

  const getPlanIcon = (name: string) => {
    switch (name.toLowerCase()) {
      case 'starter':
        return <Zap className="w-5 h-5" />;
      case 'professional':
        return <Crown className="w-5 h-5" />;
      case 'enterprise':
        return <Building2 className="w-5 h-5" />;
      default:
        return <CreditCard className="w-5 h-5" />;
    }
  };

  const filteredPlans = plans.filter(plan =>
    plan.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (plan.nameAr || '').includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Subscription Plans</h2>
          <p className="text-gray-400">Manage pricing plans and features</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg shadow-purple-500/20"
        >
          <Plus className="w-4 h-4" />
          Add Plan
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          type="text"
          placeholder="Search plans..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-purple-500"
        />
      </div>

      {/* Plans Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPlans.map((plan) => (
            <div
              key={plan.id}
              className={`relative bg-slate-900 border rounded-xl p-6 transition-all ${
                plan.isPopular 
                  ? 'border-purple-500 shadow-lg shadow-purple-500/20' 
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              {plan.isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xs font-semibold rounded-full">
                  Most Popular
                </div>
              )}
              
              <div className="flex items-start justify-between mb-4 pt-2">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${plan.isActive ? 'bg-purple-500/10 text-purple-500' : 'bg-gray-500/10 text-gray-500'}`}>
                    {getPlanIcon(plan.name)}
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-lg">{plan.name}</h3>
                    {plan.nameAr && (
                      <p className="text-sm text-gray-400">{plan.nameAr}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {plan.isActive ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <XCircle className="w-4 h-4 text-gray-500" />
                  )}
                </div>
              </div>

              {/* Price */}
              <div className="mb-4">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-white">{plan.price}</span>
                  <span className="text-gray-400">{plan.currency}</span>
                  <span className="text-gray-500 text-sm">
                    /{plan.billingCycle === 'MONTHLY' ? 'month' : plan.billingCycle === 'YEARLY' ? 'year' : 'lifetime'}
                  </span>
                </div>
                {plan.description && (
                  <p className="text-sm text-gray-400 mt-2">{plan.description}</p>
                )}
              </div>

              {/* Features */}
              <div className="mb-4 space-y-2">
                {plan.features?.slice(0, 4).map((feature, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-gray-300">
                    <CheckCircle className="w-3 h-3 text-green-500" />
                    {feature}
                  </div>
                ))}
                {plan.features && plan.features.length > 4 && (
                  <p className="text-xs text-gray-500">+{plan.features.length - 4} more features</p>
                )}
              </div>

              {/* Limits */}
              <div className="mb-4 p-3 bg-slate-800/50 rounded-lg grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-gray-400">Products:</span>
                  <span className="text-white ml-1">
                    {plan.limits?.products === -1 ? '∞' : plan.limits?.products || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">Staff:</span>
                  <span className="text-white ml-1">
                    {plan.limits?.staff === -1 ? '∞' : plan.limits?.staff || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">Storage:</span>
                  <span className="text-white ml-1">
                    {plan.limits?.storage === -1 ? '∞' : `${plan.limits?.storage || 0}GB`}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">Domains:</span>
                  <span className="text-white ml-1">
                    {plan.limits?.customDomains === -1 ? '∞' : plan.limits?.customDomains || 0}
                  </span>
                </div>
              </div>

              {/* Tenant Count */}
              {plan._count?.tenants !== undefined && (
                <p className="text-xs text-gray-500 mb-4">
                  {plan._count.tenants} active subscriptions
                </p>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setEditingPlan(plan);
                    setFormData({
                      name: plan.name,
                      nameAr: plan.nameAr || '',
                      description: plan.description || '',
                      descriptionAr: plan.descriptionAr || '',
                      price: plan.price,
                      currency: plan.currency,
                      billingCycle: plan.billingCycle,
                      features: plan.features || [],
                      featuresAr: plan.featuresAr || [],
                      limits: {
                        products: plan.limits?.products ?? -1,
                        orders: plan.limits?.orders ?? -1,
                        storage: plan.limits?.storage ?? 10,
                        staff: plan.limits?.staff ?? 5,
                        customDomains: plan.limits?.customDomains ?? 1
                      },
                      isActive: plan.isActive,
                      isPopular: plan.isPopular,
                      sortOrder: plan.sortOrder
                    });
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={() => handleToggle(plan.id)}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                    plan.isActive
                      ? 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20'
                      : 'bg-green-500/10 text-green-500 hover:bg-green-500/20'
                  }`}
                >
                  {plan.isActive ? (
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
                  onClick={() => handleDelete(plan.id)}
                  className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          {filteredPlans.length === 0 && (
            <div className="col-span-full p-8 text-center text-gray-400">
              No plans found
            </div>
          )}
        </div>
      )}

      {/* Create/Edit Modal */}
      {(showCreateModal || editingPlan) && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-white mb-6">
              {editingPlan ? 'Edit Plan' : 'Create New Plan'}
            </h3>
            <form onSubmit={editingPlan ? handleUpdate : handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Plan Name (English)
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-purple-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Plan Name (Arabic)
                  </label>
                  <input
                    type="text"
                    value={formData.nameAr}
                    onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-purple-500"
                    dir="rtl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Description (English)
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-purple-500"
                    rows={2}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Description (Arabic)
                  </label>
                  <textarea
                    value={formData.descriptionAr}
                    onChange={(e) => setFormData({ ...formData, descriptionAr: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-purple-500"
                    rows={2}
                    dir="rtl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Price
                  </label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-purple-500"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Currency
                  </label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="SAR">SAR - Saudi Riyal</option>
                    <option value="USD">USD - US Dollar</option>
                    <option value="EUR">EUR - Euro</option>
                    <option value="AED">AED - UAE Dirham</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Billing Cycle
                  </label>
                  <select
                    value={formData.billingCycle}
                    onChange={(e) => setFormData({ ...formData, billingCycle: e.target.value as any })}
                    className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-purple-500"
                  >
                    {BILLING_CYCLES.map(cycle => (
                      <option key={cycle.value} value={cycle.value}>{cycle.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Limits */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Plan Limits (-1 for unlimited)
                </label>
                <div className="grid grid-cols-5 gap-2">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Products</label>
                    <input
                      type="number"
                      value={formData.limits.products}
                      onChange={(e) => setFormData({
                        ...formData,
                        limits: { ...formData.limits, products: parseInt(e.target.value) }
                      })}
                      className="w-full px-2 py-1 bg-slate-950 border border-slate-800 rounded text-white text-sm"
                      min="-1"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Orders</label>
                    <input
                      type="number"
                      value={formData.limits.orders}
                      onChange={(e) => setFormData({
                        ...formData,
                        limits: { ...formData.limits, orders: parseInt(e.target.value) }
                      })}
                      className="w-full px-2 py-1 bg-slate-950 border border-slate-800 rounded text-white text-sm"
                      min="-1"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Storage (GB)</label>
                    <input
                      type="number"
                      value={formData.limits.storage}
                      onChange={(e) => setFormData({
                        ...formData,
                        limits: { ...formData.limits, storage: parseInt(e.target.value) }
                      })}
                      className="w-full px-2 py-1 bg-slate-950 border border-slate-800 rounded text-white text-sm"
                      min="-1"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Staff</label>
                    <input
                      type="number"
                      value={formData.limits.staff}
                      onChange={(e) => setFormData({
                        ...formData,
                        limits: { ...formData.limits, staff: parseInt(e.target.value) }
                      })}
                      className="w-full px-2 py-1 bg-slate-950 border border-slate-800 rounded text-white text-sm"
                      min="-1"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Domains</label>
                    <input
                      type="number"
                      value={formData.limits.customDomains}
                      onChange={(e) => setFormData({
                        ...formData,
                        limits: { ...formData.limits, customDomains: parseInt(e.target.value) }
                      })}
                      className="w-full px-2 py-1 bg-slate-950 border border-slate-800 rounded text-white text-sm"
                      min="-1"
                    />
                  </div>
                </div>
              </div>

              {/* Features */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Features
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newFeature}
                    onChange={(e) => setNewFeature(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                    placeholder="Add a feature..."
                    className="flex-1 px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-purple-500"
                  />
                  <button
                    type="button"
                    onClick={addFeature}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 mb-2">
                  {DEFAULT_FEATURES.filter(f => !formData.features.includes(f)).slice(0, 5).map(feature => (
                    <button
                      key={feature}
                      type="button"
                      onClick={() => setFormData({ ...formData, features: [...formData.features, feature] })}
                      className="px-2 py-1 text-xs bg-slate-800 text-gray-400 rounded hover:bg-slate-700"
                    >
                      + {feature}
                    </button>
                  ))}
                </div>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {formData.features.map((feature, i) => (
                    <div key={i} className="flex items-center justify-between p-2 bg-slate-800 rounded">
                      <span className="text-sm text-white">{feature}</span>
                      <button
                        type="button"
                        onClick={() => removeFeature(feature)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Features (Arabic) */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Features (Arabic)
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newFeatureAr}
                    onChange={(e) => setNewFeatureAr(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFeatureAr())}
                    placeholder="أضف ميزة..."
                    className="flex-1 px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-purple-500"
                    dir="rtl"
                  />
                  <button
                    type="button"
                    onClick={addFeatureAr}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                  >
                    Add
                  </button>
                </div>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {formData.featuresAr.map((feature, i) => (
                    <div key={i} className="flex items-center justify-between p-2 bg-slate-800 rounded">
                      <span className="text-sm text-white" dir="rtl">{feature}</span>
                      <button
                        type="button"
                        onClick={() => removeFeatureAr(feature)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Toggles */}
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-sm text-gray-300">Active</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isPopular}
                    onChange={(e) => setFormData({ ...formData, isPopular: e.target.checked })}
                    className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-sm text-gray-300">Mark as Popular</span>
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingPlan(null);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all"
                >
                  {editingPlan ? 'Update Plan' : 'Create Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
