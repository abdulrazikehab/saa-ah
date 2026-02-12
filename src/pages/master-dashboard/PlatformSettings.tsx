import { useState, useEffect } from 'react';
import { coreApi } from '@/lib/api';
import { 
  Settings, 
  Globe, 
  Mail, 
  Phone, 
  MapPin, 
  Share2, 
  Save, 
  Loader2,
  MessageSquare,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Youtube,
  Upload,
  Image as ImageIcon,
  Shield,
  Moon,
  Sun,
  Zap
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getAdminApiKey } from '@/lib/admin-config';

interface PlatformSettingsProps {
  adminApiKey?: string;
}

export default function PlatformSettings({ adminApiKey }: PlatformSettingsProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: 'SAEA',
    nameAr: 'ساعي',
    email: '',
    phone: '',
    whatsapp: '',
    address: '',
    addressAr: '',
    logoUrl: '',
    socialLinks: {
      facebook: '',
      twitter: '',
      instagram: '',
      linkedin: '',
      youtube: ''
    },
    settings: {
      maintenanceMode: false,
      allowNewTenants: true,
      supportEmail: '',
      defaultCurrency: 'USD',
      environmentMode: 'production' as 'production' | 'testing' | 'maintenance',
      specialEvents: {
        ramadan: false,
        eid: false,
        backToSchool: false,
      },
      rateLimitLevel: 'normal' as 'normal' | 'strict' | 'relaxed',
      allowSignups: true,
      allowLogins: true,
    }
  });
  const [uploadingLogo, setUploadingLogo] = useState(false);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        setLoading(true);
        const config = await coreApi.get('/admin/master/platform-config', { 
          requireAuth: true, 
          adminApiKey: adminApiKey || getAdminApiKey() 
        });
        if (config) {
          setFormData(prev => ({
            ...prev,
            ...config,
            socialLinks: { ...prev.socialLinks, ...(config.socialLinks || {}) },
            settings: { ...prev.settings, ...(config.settings || {}) }
          }));
        }
      } catch (error) {
        console.error('Failed to load platform config:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load platform settings'
        });
      } finally {
        setLoading(false);
      }
    };
    loadConfig();
  }, [toast]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await coreApi.post('/admin/master/platform-config', formData, { 
        requireAuth: true, 
        adminApiKey: adminApiKey || getAdminApiKey() 
      });
      toast({
        title: 'Success',
        description: 'Platform settings updated successfully'
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update platform settings'
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Platform Settings</h2>
          <p className="text-gray-400">Configure global platform details and preferences</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition-all disabled:opacity-50 shadow-lg shadow-purple-500/20"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Logo Upload */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex items-center gap-2 text-white font-bold border-b border-slate-800 pb-4">
            <ImageIcon className="w-5 h-5 text-purple-500" />
            Website Logo
          </div>
          
          <div className="flex items-center gap-6">
            {formData.logoUrl && (
              <div className="flex-shrink-0">
                <img 
                  src={formData.logoUrl} 
                  alt="Platform Logo" 
                  className="w-32 h-32 object-contain bg-slate-950 rounded-xl border border-slate-800 p-2"
                />
              </div>
            )}
            <div className="flex-1 space-y-2">
              <label className="text-sm font-medium text-gray-400">Upload Logo</label>
              <div className="flex items-center gap-4">
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/svg+xml"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      
                      setUploadingLogo(true);
                      try {
                        const formDataUpload = new FormData();
                        formDataUpload.append('logo', file);
                        
                        const response = await coreApi.post('/admin/master/platform-logo', formDataUpload, {
                          headers: { 'Content-Type': 'multipart/form-data' },
                          requireAuth: true,
                          adminApiKey: adminApiKey || getAdminApiKey()
                        });
                        
                        setFormData(prev => ({ ...prev, logoUrl: response.logoUrl }));
                        toast({
                          title: 'Success',
                          description: 'Logo uploaded successfully'
                        });
                      } catch (error: unknown) {
                        console.error('Failed to upload logo:', error);
                        const errorMessage = error instanceof Error ? error.message : 'Failed to upload logo. Please try again.';
                        toast({
                          variant: 'destructive',
                          title: 'Error',
                          description: errorMessage
                        });
                      } finally {
                        setUploadingLogo(false);
                      }
                    }}
                    disabled={uploadingLogo}
                  />
                  <div className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition-all disabled:opacity-50 cursor-pointer">
                    {uploadingLogo ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        {formData.logoUrl ? 'Change Logo' : 'Upload Logo'}
                      </>
                    )}
                  </div>
                </label>
              </div>
              <p className="text-xs text-gray-500">Recommended: Square image, 500x500px or larger. Supported formats: JPEG, PNG, WebP, SVG</p>
            </div>
          </div>
        </div>

        {/* General Information */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex items-center gap-2 text-white font-bold border-b border-slate-800 pb-4">
            <Globe className="w-5 h-5 text-purple-500" />
            General Information
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400">Platform Name (English)</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400">Platform Name (Arabic)</label>
              <input
                type="text"
                value={formData.nameAr}
                onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-right focus:outline-none focus:border-purple-500 transition-colors"
                dir="rtl"
              />
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex items-center gap-2 text-white font-bold border-b border-slate-800 pb-4">
            <Mail className="w-5 h-5 text-blue-500" />
            Contact Details
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400">Public Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400">WhatsApp Number</label>
              <div className="relative">
                <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  value={formData.whatsapp}
                  onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400">Address (English)</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-colors h-24 resize-none"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400">Address (Arabic)</label>
              <div className="relative">
                <MapPin className="absolute right-3 top-3 w-4 h-4 text-gray-500" />
                <textarea
                  value={formData.addressAr}
                  onChange={(e) => setFormData({ ...formData, addressAr: e.target.value })}
                  className="w-full pr-10 pl-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-right focus:outline-none focus:border-purple-500 transition-colors h-24 resize-none"
                  dir="rtl"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Social Links */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex items-center gap-2 text-white font-bold border-b border-slate-800 pb-4">
            <Share2 className="w-5 h-5 text-orange-500" />
            Social Media Links
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400 flex items-center gap-2">
                <Facebook className="w-4 h-4 text-blue-600" /> Facebook
              </label>
              <input
                type="url"
                value={formData.socialLinks.facebook}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  socialLinks: { ...formData.socialLinks, facebook: e.target.value } 
                })}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-colors"
                placeholder="https://facebook.com/..."
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400 flex items-center gap-2">
                <Twitter className="w-4 h-4 text-sky-400" /> Twitter
              </label>
              <input
                type="url"
                value={formData.socialLinks.twitter}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  socialLinks: { ...formData.socialLinks, twitter: e.target.value } 
                })}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-colors"
                placeholder="https://twitter.com/..."
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400 flex items-center gap-2">
                <Instagram className="w-4 h-4 text-pink-500" /> Instagram
              </label>
              <input
                type="url"
                value={formData.socialLinks.instagram}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  socialLinks: { ...formData.socialLinks, instagram: e.target.value } 
                })}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-colors"
                placeholder="https://instagram.com/..."
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400 flex items-center gap-2">
                <Linkedin className="w-4 h-4 text-blue-700" /> LinkedIn
              </label>
              <input
                type="url"
                value={formData.socialLinks.linkedin}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  socialLinks: { ...formData.socialLinks, linkedin: e.target.value } 
                })}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-colors"
                placeholder="https://linkedin.com/in/..."
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400 flex items-center gap-2">
                <Youtube className="w-4 h-4 text-red-600" /> YouTube
              </label>
              <input
                type="url"
                value={formData.socialLinks.youtube}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  socialLinks: { ...formData.socialLinks, youtube: e.target.value } 
                })}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-colors"
                placeholder="https://youtube.com/c/..."
              />
            </div>
          </div>
        </div>

        {/* Environment & Special Events */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 space-y-8">
          <div className="flex items-center gap-2 text-white font-bold border-b border-slate-800 pb-4">
            <Zap className="w-5 h-5 text-yellow-500" />
            Environment & Special Events
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Mode Selection */}
            <div className="space-y-4">
              <label className="text-sm font-medium text-gray-400">System Environment Mode</label>
              <div className="grid grid-cols-3 gap-3">
                {(['production', 'testing', 'maintenance'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setFormData({
                      ...formData,
                      settings: { ...formData.settings, environmentMode: mode }
                    })}
                    className={`px-3 py-3 rounded-xl border text-sm font-medium transition-all ${
                      formData.settings.environmentMode === mode
                        ? mode === 'production' ? 'bg-green-500/10 border-green-500 text-green-500 shadow-lg shadow-green-500/10'
                        : mode === 'testing' ? 'bg-blue-500/10 border-blue-500 text-blue-500 shadow-lg shadow-blue-500/10'
                        : 'bg-red-500/10 border-red-500 text-red-500 shadow-lg shadow-red-500/10'
                        : 'bg-slate-950 border-slate-800 text-gray-500 hover:border-slate-700'
                    }`}
                  >
                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500">
                {formData.settings.environmentMode === 'maintenance' && '⚠️ maintenance mode blocks all API access for non-admins.'}
                {formData.settings.environmentMode === 'testing' && '🔬 testing mode enables detailed logging and disables real payments.'}
                {formData.settings.environmentMode === 'production' && '✅ system is running in live production mode.'}
              </p>
            </div>

            {/* Special Events */}
            <div className="space-y-4">
              <label className="text-sm font-medium text-gray-400">Special Event Decorations</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({
                    ...formData,
                    settings: { 
                      ...formData.settings, 
                      specialEvents: { ...formData.settings.specialEvents, ramadan: !formData.settings.specialEvents.ramadan }
                    }
                  })}
                  className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                    formData.settings.specialEvents.ramadan
                      ? 'bg-amber-500/10 border-amber-500 text-amber-500 shadow-lg shadow-amber-500/10'
                      : 'bg-slate-950 border-slate-800 text-gray-500 hover:border-slate-700'
                  }`}
                >
                  <Moon className="w-4 h-4" />
                  Ramadan
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({
                    ...formData,
                    settings: { 
                      ...formData.settings, 
                      specialEvents: { ...formData.settings.specialEvents, eid: !formData.settings.specialEvents.eid }
                    }
                  })}
                  className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                    formData.settings.specialEvents.eid
                      ? 'bg-purple-500/10 border-purple-500 text-purple-500 shadow-lg shadow-purple-500/10'
                      : 'bg-slate-950 border-slate-800 text-gray-500 hover:border-slate-700'
                  }`}
                >
                  <Sun className="w-4 h-4" />
                  Eid
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Security & Access */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 space-y-8">
          <div className="flex items-center gap-2 text-white font-bold border-b border-slate-800 pb-4">
            <Shield className="w-5 h-5 text-red-500" />
            Global Security & Access Control
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Rate Limit Level */}
            <div className="space-y-4">
              <label className="text-sm font-medium text-gray-400">Global Rate Limiting Severity</label>
              <div className="grid grid-cols-3 gap-3">
                {(['relaxed', 'normal', 'strict'] as const).map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setFormData({
                      ...formData,
                      settings: { ...formData.settings, rateLimitLevel: level }
                    })}
                    className={`px-3 py-3 rounded-xl border text-sm font-medium transition-all ${
                      formData.settings.rateLimitLevel === level
                        ? level === 'strict' ? 'bg-red-500/10 border-red-500 text-red-500'
                        : level === 'normal' ? 'bg-blue-500/10 border-blue-500 text-blue-500'
                        : 'bg-green-500/10 border-green-500 text-green-500'
                        : 'bg-slate-950 border-slate-800 text-gray-500 hover:border-slate-700'
                    }`}
                  >
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Access Toggles */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-400">Signups</label>
                <button
                  type="button"
                  onClick={() => setFormData({
                    ...formData,
                    settings: { ...formData.settings, allowSignups: !formData.settings.allowSignups }
                  })}
                  className={`px-4 py-2.5 rounded-xl border font-medium transition-all ${
                    formData.settings.allowSignups 
                      ? 'bg-green-500/10 border-green-500 text-green-500' 
                      : 'bg-red-500/10 border-red-500 text-red-500'
                  }`}
                >
                  {formData.settings.allowSignups ? 'Enabled' : 'Disabled'}
                </button>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-400">Logins</label>
                <button
                  type="button"
                  onClick={() => setFormData({
                    ...formData,
                    settings: { ...formData.settings, allowLogins: !formData.settings.allowLogins }
                  })}
                  className={`px-4 py-2.5 rounded-xl border font-medium transition-all ${
                    formData.settings.allowLogins 
                      ? 'bg-green-500/10 border-green-500 text-green-500' 
                      : 'bg-red-500/10 border-red-500 text-red-500'
                  }`}
                >
                  {formData.settings.allowLogins ? 'Enabled' : 'Disabled'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* System Settings Legacy */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex items-center gap-2 text-white font-bold border-b border-slate-800 pb-4">
            <Settings className="w-5 h-5 text-gray-400" />
            Old System Preferences
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex items-center justify-between p-4 bg-slate-950 border border-slate-800 rounded-xl">
              <div>
                <div className="text-white font-medium">Maintenance Mode</div>
                <div className="text-xs text-gray-500">Disable platform access for all users</div>
              </div>
              <button
                type="button"
                onClick={() => setFormData({
                  ...formData,
                  settings: { ...formData.settings, maintenanceMode: !formData.settings.maintenanceMode }
                })}
                className={`w-12 h-6 rounded-full transition-colors relative ${
                  formData.settings.maintenanceMode ? 'bg-red-600' : 'bg-slate-800'
                }`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${
                  formData.settings.maintenanceMode ? 'left-7' : 'left-1'
                }`} />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-950 border border-slate-800 rounded-xl">
              <div>
                <div className="text-white font-medium">Allow New Tenants</div>
                <div className="text-xs text-gray-500">Enable or disable new store registrations</div>
              </div>
              <button
                type="button"
                onClick={() => setFormData({
                  ...formData,
                  settings: { ...formData.settings, allowNewTenants: !formData.settings.allowNewTenants }
                })}
                className={`w-12 h-6 rounded-full transition-colors relative ${
                  formData.settings.allowNewTenants ? 'bg-green-600' : 'bg-slate-800'
                }`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${
                  formData.settings.allowNewTenants ? 'left-7' : 'left-1'
                }`} />
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
