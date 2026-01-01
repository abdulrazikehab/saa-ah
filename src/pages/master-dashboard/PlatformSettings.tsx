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
  Youtube
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getAdminApiKey } from '@/lib/admin-config';

export default function PlatformSettings() {
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
      defaultCurrency: 'USD'
    }
  });

  useEffect(() => {
    const loadConfig = async () => {
      try {
        setLoading(true);
        const config = await coreApi.get('/admin/master/platform-config', { 
          requireAuth: true, 
          adminApiKey: getAdminApiKey() 
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
        adminApiKey: getAdminApiKey() 
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

        {/* System Settings */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex items-center gap-2 text-white font-bold border-b border-slate-800 pb-4">
            <Settings className="w-5 h-5 text-gray-400" />
            System Preferences
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
