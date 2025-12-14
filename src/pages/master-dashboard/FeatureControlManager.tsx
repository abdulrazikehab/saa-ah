import { useState, useEffect } from 'react';
import { coreApi } from '@/lib/api';
import { 
  Settings, 
  Plus,
  Edit,
  Trash2,
  Power,
  PowerOff,
  Search,
  Loader2,
  CheckCircle,
  XCircle,
  Lock,
  Unlock,
  Crown,
  Zap,
  Globe,
  Star,
  Shield,
  Code,
  MessageSquare,
  BarChart3,
  Palette
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getAdminApiKey } from '@/lib/admin-config';

interface FeatureConfig {
  id: string;
  feature: string;
  displayName: string;
  displayNameAr?: string;
  description?: string;
  category: string;
  requiredPlan: 'FREE' | 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';
  isGlobal: boolean;
  isEnabled: boolean;
  config?: Record<string, any>;
  createdAt: string;
}

interface TenantFeature {
  id: string;
  tenantId: string;
  feature: string;
  enabled: boolean;
  tenantName?: string;
  tenantSubdomain?: string;
  grantedBy?: string;
  grantedAt?: string;
  expiresAt?: string;
}

const FEATURE_CATEGORIES = [
  { value: 'core', label: 'Core Features', icon: Zap },
  { value: 'analytics', label: 'Analytics', icon: BarChart3 },
  { value: 'marketing', label: 'Marketing', icon: Star },
  { value: 'integration', label: 'Integrations', icon: Code },
  { value: 'support', label: 'Support', icon: MessageSquare },
  { value: 'design', label: 'Design', icon: Palette },
  { value: 'security', label: 'Security', icon: Shield },
];

const PLAN_LEVELS = [
  { value: 'FREE', label: 'Free', color: 'text-gray-400' },
  { value: 'STARTER', label: 'Starter', color: 'text-blue-400' },
  { value: 'PROFESSIONAL', label: 'Professional', color: 'text-purple-400' },
  { value: 'ENTERPRISE', label: 'Enterprise', color: 'text-amber-400' },
];

const DEFAULT_FEATURES: Omit<FeatureConfig, 'id' | 'createdAt'>[] = [
  { feature: 'page_builder', displayName: 'Page Builder', displayNameAr: 'منشئ الصفحات', category: 'core', requiredPlan: 'STARTER', isGlobal: true, isEnabled: true, description: 'Drag and drop page builder' },
  { feature: 'ai_assistant', displayName: 'AI Assistant', displayNameAr: 'المساعد الذكي', category: 'core', requiredPlan: 'PROFESSIONAL', isGlobal: true, isEnabled: true, description: 'AI-powered content generation' },
  { feature: 'chat_support', displayName: 'Live Chat Support', displayNameAr: 'الدعم المباشر', category: 'support', requiredPlan: 'STARTER', isGlobal: true, isEnabled: true, description: 'Real-time chat with customers' },
  { feature: 'analytics_advanced', displayName: 'Advanced Analytics', displayNameAr: 'التحليلات المتقدمة', category: 'analytics', requiredPlan: 'PROFESSIONAL', isGlobal: true, isEnabled: true, description: 'Detailed insights and reports' },
  { feature: 'custom_domain', displayName: 'Custom Domain', displayNameAr: 'النطاق المخصص', category: 'core', requiredPlan: 'PROFESSIONAL', isGlobal: true, isEnabled: true, description: 'Use your own domain name' },
  { feature: 'api_access', displayName: 'API Access', displayNameAr: 'الوصول للـ API', category: 'integration', requiredPlan: 'PROFESSIONAL', isGlobal: true, isEnabled: true, description: 'REST API for integrations' },
  { feature: 'email_marketing', displayName: 'Email Marketing', displayNameAr: 'التسويق بالبريد', category: 'marketing', requiredPlan: 'STARTER', isGlobal: true, isEnabled: true, description: 'Send promotional emails' },
  { feature: 'seo_tools', displayName: 'SEO Tools', displayNameAr: 'أدوات SEO', category: 'marketing', requiredPlan: 'FREE', isGlobal: true, isEnabled: true, description: 'Basic SEO optimization' },
  { feature: 'multiple_staff', displayName: 'Team Members', displayNameAr: 'فريق العمل', category: 'core', requiredPlan: 'STARTER', isGlobal: true, isEnabled: true, description: 'Add multiple staff accounts' },
  { feature: 'white_label', displayName: 'White Label', displayNameAr: 'العلامة البيضاء', category: 'design', requiredPlan: 'ENTERPRISE', isGlobal: true, isEnabled: true, description: 'Remove platform branding' },
  { feature: 'webhooks', displayName: 'Webhooks', displayNameAr: 'الويب هوكس', category: 'integration', requiredPlan: 'PROFESSIONAL', isGlobal: true, isEnabled: true, description: 'Real-time event notifications' },
  { feature: 'priority_support', displayName: 'Priority Support', displayNameAr: 'الدعم الأولوي', category: 'support', requiredPlan: 'PROFESSIONAL', isGlobal: true, isEnabled: true, description: '24/7 priority assistance' },
];

export default function FeatureControlManager() {
  const [features, setFeatures] = useState<FeatureConfig[]>([]);
  const [tenantFeatures, setTenantFeatures] = useState<TenantFeature[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [editingFeature, setEditingFeature] = useState<FeatureConfig | null>(null);
  const [activeTab, setActiveTab] = useState<'features' | 'overrides'>('features');
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    feature: '',
    displayName: '',
    displayNameAr: '',
    description: '',
    category: 'core',
    requiredPlan: 'STARTER' as 'FREE' | 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE',
    isGlobal: true,
    isEnabled: true,
    config: {}
  });

  const [overrideFormData, setOverrideFormData] = useState({
    tenantId: '',
    feature: '',
    enabled: true,
    expiresAt: ''
  });

  useEffect(() => {
    loadFeatures();
    loadTenantFeatures();
  }, []);

  const loadFeatures = async () => {
    try {
      setLoading(true);
      const response = await coreApi.get('/admin/master/features', { requireAuth: true, adminApiKey: getAdminApiKey() });
      setFeatures(response.data || response.features || DEFAULT_FEATURES.map((f, i) => ({ ...f, id: `feature-${i}`, createdAt: new Date().toISOString() })));
    } catch (error) {
      console.error('Failed to load features:', error);
      // Set default features if API fails
      setFeatures(DEFAULT_FEATURES.map((f, i) => ({ ...f, id: `feature-${i}`, createdAt: new Date().toISOString() })));
    } finally {
      setLoading(false);
    }
  };

  const loadTenantFeatures = async () => {
    try {
      const response = await coreApi.get('/admin/master/feature-overrides', { requireAuth: true, adminApiKey: getAdminApiKey() });
      setTenantFeatures(response.data || response.overrides || []);
    } catch (error) {
      console.error('Failed to load tenant features:', error);
      setTenantFeatures([]);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await coreApi.post('/admin/master/features', formData, { requireAuth: true, adminApiKey: getAdminApiKey() });
      toast({
        title: '✅ Success',
        description: 'Feature created successfully'
      });
      setShowCreateModal(false);
      resetForm();
      loadFeatures();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: '❌ Error',
        description: error.response?.data?.message || 'Failed to create feature'
      });
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFeature) return;
    
    try {
      await coreApi.put(`/admin/master/features/${editingFeature.id}`, formData, { requireAuth: true, adminApiKey: getAdminApiKey() });
      toast({
        title: '✅ Success',
        description: 'Feature updated successfully'
      });
      setEditingFeature(null);
      loadFeatures();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: '❌ Error',
        description: error.response?.data?.message || 'Failed to update feature'
      });
    }
  };

  const handleToggleFeature = async (id: string) => {
    try {
      await coreApi.post(`/admin/master/features/${id}/toggle`, {}, { requireAuth: true, adminApiKey: getAdminApiKey() });
      toast({
        title: '✅ Success',
        description: 'Feature status updated'
      });
      loadFeatures();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: '❌ Error',
        description: error.response?.data?.message || 'Failed to toggle feature'
      });
    }
  };

  const handleChangePlan = async (id: string, plan: string) => {
    try {
      await coreApi.put(`/admin/master/features/${id}`, { requiredPlan: plan }, { requireAuth: true, adminApiKey: getAdminApiKey() });
      toast({
        title: '✅ Success',
        description: `Feature now requires ${plan} plan`
      });
      loadFeatures();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: '❌ Error',
        description: 'Failed to update feature plan'
      });
    }
  };

  const handleCreateOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await coreApi.post('/admin/master/feature-overrides', overrideFormData, { requireAuth: true, adminApiKey: getAdminApiKey() });
      toast({
        title: '✅ Success',
        description: 'Feature override created'
      });
      setShowOverrideModal(false);
      setOverrideFormData({ tenantId: '', feature: '', enabled: true, expiresAt: '' });
      loadTenantFeatures();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: '❌ Error',
        description: error.response?.data?.message || 'Failed to create override'
      });
    }
  };

  const handleDeleteOverride = async (id: string) => {
    if (!confirm('Remove this feature override?')) return;
    
    try {
      await coreApi.delete(`/admin/master/feature-overrides/${id}`, { requireAuth: true, adminApiKey: getAdminApiKey() });
      toast({
        title: '✅ Success',
        description: 'Override removed'
      });
      loadTenantFeatures();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: '❌ Error',
        description: 'Failed to remove override'
      });
    }
  };

  const resetForm = () => {
    setFormData({
      feature: '',
      displayName: '',
      displayNameAr: '',
      description: '',
      category: 'core',
      requiredPlan: 'STARTER',
      isGlobal: true,
      isEnabled: true,
      config: {}
    });
  };

  const getCategoryIcon = (category: string) => {
    const cat = FEATURE_CATEGORIES.find(c => c.value === category);
    const IconComponent = cat?.icon || Settings;
    return <IconComponent className="w-4 h-4" />;
  };

  const filteredFeatures = features.filter(feature =>
    (selectedCategory === 'all' || feature.category === selectedCategory) &&
    (feature.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
     feature.feature.toLowerCase().includes(searchTerm.toLowerCase()) ||
     (feature.displayNameAr || '').includes(searchTerm))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Feature Control</h2>
          <p className="text-gray-400">Control which features are free or require a plan</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowOverrideModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
          >
            <Unlock className="w-4 h-4" />
            Grant Feature
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg shadow-indigo-500/20"
          >
            <Plus className="w-4 h-4" />
            Add Feature
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-slate-900 p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('features')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'features' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'
          }`}
        >
          Feature Configuration
        </button>
        <button
          onClick={() => setActiveTab('overrides')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'overrides' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'
          }`}
        >
          Tenant Overrides ({tenantFeatures.length})
        </button>
      </div>

      {activeTab === 'features' && (
        <>
          {/* Search & Filter */}
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search features..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All Categories</option>
              {FEATURE_CATEGORIES.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>

          {/* Features Table */}
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-950">
                  <tr className="text-gray-400 text-sm">
                    <th className="text-left px-6 py-4 font-medium">Feature</th>
                    <th className="text-left px-6 py-4 font-medium">Category</th>
                    <th className="text-left px-6 py-4 font-medium">Required Plan</th>
                    <th className="text-center px-6 py-4 font-medium">Status</th>
                    <th className="text-right px-6 py-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredFeatures.map((feature) => (
                    <tr key={feature.id} className="hover:bg-slate-800/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${feature.isEnabled ? 'bg-indigo-500/10 text-indigo-500' : 'bg-gray-500/10 text-gray-500'}`}>
                            {getCategoryIcon(feature.category)}
                          </div>
                          <div>
                            <div className="font-medium text-white">{feature.displayName}</div>
                            {feature.displayNameAr && (
                              <div className="text-sm text-gray-400" dir="rtl">{feature.displayNameAr}</div>
                            )}
                            {feature.description && (
                              <div className="text-xs text-gray-500 mt-1">{feature.description}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-slate-800 text-gray-300 text-xs rounded capitalize">
                          {feature.category}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={feature.requiredPlan}
                          onChange={(e) => handleChangePlan(feature.id, e.target.value)}
                          className={`px-3 py-1 bg-slate-800 border border-slate-700 rounded text-sm font-medium ${
                            PLAN_LEVELS.find(p => p.value === feature.requiredPlan)?.color
                          }`}
                        >
                          {PLAN_LEVELS.map(plan => (
                            <option key={plan.value} value={plan.value}>{plan.label}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleToggleFeature(feature.id)}
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                            feature.isEnabled
                              ? 'bg-green-500/10 text-green-500'
                              : 'bg-red-500/10 text-red-500'
                          }`}
                        >
                          {feature.isEnabled ? (
                            <>
                              <CheckCircle className="w-3 h-3" />
                              Enabled
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3" />
                              Disabled
                            </>
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => {
                            setEditingFeature(feature);
                            setFormData({
                              feature: feature.feature,
                              displayName: feature.displayName,
                              displayNameAr: feature.displayNameAr || '',
                              description: feature.description || '',
                              category: feature.category,
                              requiredPlan: feature.requiredPlan,
                              isGlobal: feature.isGlobal,
                              isEnabled: feature.isEnabled,
                              config: feature.config || {}
                            });
                          }}
                          className="p-2 text-gray-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredFeatures.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                        No features found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {activeTab === 'overrides' && (
        <div className="space-y-4">
          {/* Overrides Info */}
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Unlock className="w-5 h-5 text-amber-500 mt-0.5" />
              <div>
                <h4 className="font-medium text-amber-400">Feature Overrides</h4>
                <p className="text-sm text-amber-400/70 mt-1">
                  Override feature access for specific tenants. Grants or restricts access regardless of their plan.
                </p>
              </div>
            </div>
          </div>

          {/* Overrides List */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-950">
                <tr className="text-gray-400 text-sm">
                  <th className="text-left px-6 py-4 font-medium">Tenant</th>
                  <th className="text-left px-6 py-4 font-medium">Feature</th>
                  <th className="text-center px-6 py-4 font-medium">Status</th>
                  <th className="text-left px-6 py-4 font-medium">Expires</th>
                  <th className="text-right px-6 py-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {tenantFeatures.map((tf) => (
                  <tr key={tf.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-white">{tf.tenantName || 'Unknown'}</div>
                        <div className="text-sm text-gray-400">{tf.tenantSubdomain}.saaah.com</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-gray-300">{tf.feature}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                        tf.enabled
                          ? 'bg-green-500/10 text-green-500'
                          : 'bg-red-500/10 text-red-500'
                      }`}>
                        {tf.enabled ? 'Granted' : 'Restricted'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-400 text-sm">
                      {tf.expiresAt ? new Date(tf.expiresAt).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDeleteOverride(tf.id)}
                        className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {tenantFeatures.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                      No feature overrides configured
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create/Edit Feature Modal */}
      {(showCreateModal || editingFeature) && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 w-full max-w-lg">
            <h3 className="text-xl font-bold text-white mb-6">
              {editingFeature ? 'Edit Feature' : 'Add New Feature'}
            </h3>
            <form onSubmit={editingFeature ? handleUpdate : handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Feature Key
                  </label>
                  <input
                    type="text"
                    value={formData.feature}
                    onChange={(e) => setFormData({ ...formData, feature: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                    className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                    placeholder="e.g., ai_assistant"
                    required
                    disabled={!!editingFeature}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                  >
                    {FEATURE_CATEGORIES.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Display Name (English)
                  </label>
                  <input
                    type="text"
                    value={formData.displayName}
                    onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Display Name (Arabic)
                  </label>
                  <input
                    type="text"
                    value={formData.displayNameAr}
                    onChange={(e) => setFormData({ ...formData, displayNameAr: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                    dir="rtl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Description
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                  placeholder="Brief description of the feature"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Required Plan
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {PLAN_LEVELS.map(plan => (
                    <button
                      key={plan.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, requiredPlan: plan.value as any })}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        formData.requiredPlan === plan.value
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-800 text-gray-400 hover:bg-slate-700'
                      }`}
                    >
                      {plan.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isEnabled}
                    onChange={(e) => setFormData({ ...formData, isEnabled: e.target.checked })}
                    className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-300">Enabled</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isGlobal}
                    onChange={(e) => setFormData({ ...formData, isGlobal: e.target.checked })}
                    className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-300">Global (applies to all tenants)</span>
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingFeature(null);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all"
                >
                  {editingFeature ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Override Modal */}
      {showOverrideModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-white mb-6">Grant Feature Access</h3>
            <form onSubmit={handleCreateOverride} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Tenant ID
                </label>
                <input
                  type="text"
                  value={overrideFormData.tenantId}
                  onChange={(e) => setOverrideFormData({ ...overrideFormData, tenantId: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-amber-500"
                  placeholder="Enter tenant ID"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Feature
                </label>
                <select
                  value={overrideFormData.feature}
                  onChange={(e) => setOverrideFormData({ ...overrideFormData, feature: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-amber-500"
                  required
                >
                  <option value="">Select a feature</option>
                  {features.map(f => (
                    <option key={f.id} value={f.feature}>{f.displayName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Expires At (optional)
                </label>
                <input
                  type="date"
                  value={overrideFormData.expiresAt}
                  onChange={(e) => setOverrideFormData({ ...overrideFormData, expiresAt: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={overrideFormData.enabled}
                  onChange={(e) => setOverrideFormData({ ...overrideFormData, enabled: e.target.checked })}
                  className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-amber-600 focus:ring-amber-500"
                />
                <span className="text-sm text-gray-300">Grant Access (uncheck to restrict)</span>
              </label>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowOverrideModal(false);
                    setOverrideFormData({ tenantId: '', feature: '', enabled: true, expiresAt: '' });
                  }}
                  className="flex-1 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                >
                  Grant Access
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
