import { useState, useEffect, useCallback, useRef } from 'react';
import { coreApi } from '@/lib/api';
import { 
  Handshake, 
  Plus,
  Edit,
  Trash2,
  Search,
  Loader2,
  DollarSign,
  Percent,
  Image as ImageIcon,
  Globe,
  Upload,
  X
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getAdminApiKey } from '@/lib/admin-config';

interface Partner {
  id: string;
  name: string;
  nameAr?: string;
  email: string;
  phone?: string;
  logo?: string;
  description?: string;
  descriptionAr?: string;
  website?: string;
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
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    nameAr: '',
    email: '',
    phone: '',
    logo: '',
    description: '',
    descriptionAr: '',
    website: '',
    commissionType: 'PERCENTAGE' as 'PERCENTAGE' | 'FIXED',
    commissionValue: 0,
    aiScript: ''
  });

  const loadPartners = useCallback(async () => {
    try {
      setLoading(true);
      const response = await coreApi.get('/admin/master/partners', { requireAuth: true, adminApiKey: getAdminApiKey() });
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        variant: 'destructive',
        title: 'Invalid file',
        description: 'Please select an image file'
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: 'destructive',
        title: 'File too large',
        description: 'Image must be less than 5MB'
      });
      return;
    }

    try {
      setUploading(true);
      
      // Create FormData for upload
      const uploadData = new FormData();
      uploadData.append('file', file);
      uploadData.append('folder', 'partners');

      // Upload to your image service
      const response = await fetch(`${import.meta.env.VITE_CORE_API_URL}/api/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: uploadData,
      });

      if (response.ok) {
        const data = await response.json();
        setFormData({ ...formData, logo: data.url || data.path });
        toast({
          title: 'Success',
          description: 'Logo uploaded successfully'
        });
      } else {
        // Fallback: Convert to base64 for demo purposes
        const reader = new FileReader();
        reader.onloadend = () => {
          setFormData({ ...formData, logo: reader.result as string });
          toast({
            title: 'Success',
            description: 'Logo loaded (local preview)'
          });
        };
        reader.readAsDataURL(file);
      }
    } catch (error) {
      // Fallback: Convert to base64
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, logo: reader.result as string });
      };
      reader.readAsDataURL(file);
    } finally {
      setUploading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await coreApi.post('/admin/master/partners', formData, { requireAuth: true, adminApiKey: getAdminApiKey() });
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
        description: error.message || 'Failed to create partner'
      });
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPartner) return;
    
    try {
      // URL encode the ID to handle special characters and slashes
      const encodedId = encodeURIComponent(editingPartner.id);
      await coreApi.put(`/admin/master/partners/${encodedId}`, formData, { requireAuth: true, adminApiKey: getAdminApiKey() });
      toast({
        title: 'Success',
        description: 'Partner updated successfully'
      });
      setEditingPartner(null);
      setShowCreateModal(false);
      resetForm();
      loadPartners();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to update partner'
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this partner?')) return;

    try {
      // URL encode the ID to handle special characters and slashes
      const encodedId = encodeURIComponent(id);
      await coreApi.delete(`/admin/master/partners/${encodedId}`, { requireAuth: true, adminApiKey: getAdminApiKey() });
      toast({
        title: 'Success',
        description: 'Partner deleted'
      });
      loadPartners();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to delete partner'
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      nameAr: '',
      email: '',
      phone: '',
      logo: '',
      description: '',
      descriptionAr: '',
      website: '',
      commissionType: 'PERCENTAGE',
      commissionValue: 0,
      aiScript: ''
    });
  };

  const openEditModal = (partner: Partner) => {
    setEditingPartner(partner);
    setFormData({
      name: partner.name,
      nameAr: partner.nameAr || '',
      email: partner.email,
      phone: partner.phone || '',
      logo: partner.logo || '',
      description: partner.description || '',
      descriptionAr: partner.descriptionAr || '',
      website: partner.website || '',
      commissionType: partner.commissionType,
      commissionValue: partner.commissionValue,
      aiScript: partner.aiScript || ''
    });
    setShowCreateModal(true);
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
          <p className="text-gray-400">Manage business partners, logos, and commissions</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setEditingPartner(null);
            setShowCreateModal(true);
          }}
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPartners.map((partner) => (
            <div
              key={partner.id}
              className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-indigo-500/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {/* Partner Logo */}
                  {partner.logo ? (
                    <img 
                      src={partner.logo} 
                      alt={partner.name}
                      className="w-14 h-14 rounded-lg object-cover bg-slate-800"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <div className={`p-3 rounded-lg ${partner.isActive ? 'bg-indigo-500/10' : 'bg-gray-500/10'} ${partner.logo ? 'hidden' : ''}`}>
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

              {/* Description */}
              {partner.description && (
                <p className="text-sm text-gray-400 mb-3 line-clamp-2">{partner.description}</p>
              )}

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-400">Email:</span>
                  <span className="text-white truncate">{partner.email}</span>
                </div>
                {partner.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-400">Phone:</span>
                    <span className="text-white">{partner.phone}</span>
                  </div>
                )}
                {partner.website && (
                  <div className="flex items-center gap-2 text-sm">
                    <Globe className="w-4 h-4 text-gray-400" />
                    <a href={partner.website} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline truncate">
                      {partner.website.replace(/^https?:\/\//, '')}
                    </a>
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
                  onClick={() => openEditModal(partner)}
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
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-white mb-6">
              {editingPartner ? 'Edit Partner' : 'Add New Partner'}
            </h3>
            <form onSubmit={editingPartner ? handleUpdate : handleCreate} className="space-y-4">
              {/* Logo Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Partner Logo
                </label>
                <div className="flex items-center gap-4">
                  {formData.logo ? (
                    <div className="relative">
                      <img 
                        src={formData.logo} 
                        alt="Partner logo" 
                        className="w-20 h-20 rounded-lg object-cover bg-slate-800"
                      />
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, logo: '' })}
                        className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="w-20 h-20 rounded-lg bg-slate-800 border-2 border-dashed border-slate-700 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500 transition-colors"
                    >
                      {uploading ? (
                        <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
                      ) : (
                        <>
                          <ImageIcon className="w-6 h-6 text-gray-400" />
                          <span className="text-xs text-gray-400 mt-1">Upload</span>
                        </>
                      )}
                    </div>
                  )}
                  <div className="flex-1">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2 px-3 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors text-sm"
                      disabled={uploading}
                    >
                      <Upload className="w-4 h-4" />
                      {uploading ? 'Uploading...' : 'Choose Image'}
                    </button>
                    <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 5MB</p>
                    {/* Or enter URL directly */}
                    <input
                      type="url"
                      value={formData.logo}
                      onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                      placeholder="Or paste image URL..."
                      className="w-full mt-2 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded text-white text-sm focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Partner Name *
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
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Email Address *
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
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Website URL
                </label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="https://example.com"
                  className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                  rows={2}
                  placeholder="Partner description in English..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Description (Arabic)
                </label>
                <textarea
                  value={formData.descriptionAr}
                  onChange={(e) => setFormData({ ...formData, descriptionAr: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                  rows={2}
                  dir="rtl"
                  placeholder="وصف الشريك بالعربية..."
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
