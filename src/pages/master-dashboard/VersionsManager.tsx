import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Check, X, Layers, Layout, Save, Server, Shield, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { coreApi } from '@/lib/api';
import { AVAILABLE_TABS, AVAILABLE_TENANT_TABS, AVAILABLE_FEATURES, SystemVersion } from './VersionsTypes';

interface VersionsManagerProps {
  adminApiKey: string;
}

export default function VersionsManager({ adminApiKey }: VersionsManagerProps) {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const isRTL = i18n.language === 'ar';
  
  const [versions, setVersions] = useState<SystemVersion[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [notifyUsers, setNotifyUsers] = useState(false);
  const [editingVersion, setEditingVersion] = useState<SystemVersion | null>(null);
  const [formData, setFormData] = useState<Partial<SystemVersion>>({
    name: '',
    description: '',
    versionCode: '',
    visibleTabs: [],
    visibleTenantTabs: [],
    enabledFeatures: [],
    isActive: true,
    isDefault: false
  });

  // Load versions
  const fetchVersions = useCallback(async () => {
    setLoading(true);
    try {
      // In a real implementation, this would fetch from backend
      // For now, we'll try to fetch, and if empty/fails, use mock data or local storage
      try {
        const data = await coreApi.get('/admin/master/versions', { 
            requireAuth: true, 
            adminApiKey 
        });
        if (Array.isArray(data) && data.length > 0) {
            setVersions(data);
        } else {
            throw new Error('No versions found');
        }
      } catch (err) {
        // Fallback to local storage or mock
        const stored = localStorage.getItem('system_versions');
        if (stored) {
            setVersions(JSON.parse(stored));
        } else {
            // Initialize with default if nothing exists
            const defaultVersions: SystemVersion[] = [
                {
                    id: '1',
                    name: 'Standard Admin',
                    description: 'Default view for system administrators',
                    versionCode: 'v1',
                    visibleTabs: AVAILABLE_TABS.map(t => t.id),
                    visibleTenantTabs: AVAILABLE_TENANT_TABS.map(t => t.id),
                    enabledFeatures: ['all'],
                    isActive: true,
                    isDefault: true,
                    createdAt: new Date().toISOString()
                },
                {
                    id: '2',
                    name: 'Simplified View',
                    description: 'Reduced complexity view',
                    versionCode: 'simple',
                    visibleTabs: ['dashboard', 'overview', 'tenants', 'users'],
                    visibleTenantTabs: ['dashboard', 'products', 'orders', 'customers', 'settings'],
                    enabledFeatures: [],
                    isActive: true,
                    isDefault: false,
                    createdAt: new Date().toISOString()
                }
            ];
            setVersions(defaultVersions);
            localStorage.setItem('system_versions', JSON.stringify(defaultVersions));
        }
      }
    } catch (error) {
      console.error('Failed to load versions', error);
      toast({
        title: 'Error',
        description: 'Failed to load system versions',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [adminApiKey, toast]);

  useEffect(() => {
    fetchVersions();
  }, [fetchVersions]);

  const handleSave = async () => {
    try {
      if (!formData.name || !formData.versionCode) {
        toast({
          title: isRTL ? 'خطأ في التحقق' : 'Validation Error',
          description: isRTL ? 'الاسم ورمز النسخة مطلوبان' : 'Name and Version Code are required',
          variant: 'destructive'
        });
        return;
      }

      setLoading(true);
      
      const payload = {
        name: formData.name,
        description: formData.description,
        versionCode: formData.versionCode,
        visibleTabs: formData.visibleTabs,
        visibleTenantTabs: formData.visibleTenantTabs,
        enabledFeatures: formData.enabledFeatures,
        isActive: formData.isActive,
        isDefault: formData.isDefault
      };

      if (editingVersion) {
        // Update existing
        await coreApi.put(`/admin/master/versions/${editingVersion.id}`, payload, {
          requireAuth: true,
          adminApiKey
        });
      } else {
        // Create new
        await coreApi.post('/admin/master/versions', payload, {
          requireAuth: true,
          adminApiKey
        });
      }

      await fetchVersions();
      setShowDialog(false);
      resetForm();
      
      toast({
        title: isRTL ? 'نجاح' : 'Success',
        description: isRTL ? 'تم حفظ النسخة بنجاح' : 'Version saved successfully',
      });

    } catch (error: any) {
       console.error('Save failed:', error);
       toast({
        title: isRTL ? 'خطأ' : 'Error',
        description: error.message || (isRTL ? 'فشل حفظ النسخة' : 'Failed to save version'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEditingVersion(null);
    setFormData({
        name: '',
        description: '',
        versionCode: '',
        visibleTabs: [],
        visibleTenantTabs: [],
        enabledFeatures: [],
        isActive: true,
        isDefault: false
    });
  };

  const openEdit = (version: SystemVersion) => {
    setEditingVersion(version);
    setFormData({ ...version });
    setShowDialog(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(isRTL ? 'هل أنت متأكد من حذف هذه النسخة؟' : 'Are you sure you want to delete this version?')) return;
    
    try {
      await coreApi.delete(`/admin/master/versions/${id}`, {
        requireAuth: true,
        adminApiKey
      });
      toast({
        title: isRTL ? 'نجاح' : 'Success',
        description: isRTL ? 'تم حذف النسخة' : 'Version deleted successfully',
      });
      fetchVersions();
    } catch (error) {
       toast({
        title: isRTL ? 'خطأ' : 'Error',
        description: isRTL ? 'فشل حذف النسخة' : 'Failed to delete version',
        variant: 'destructive',
      });
    }
  };

  const toggleTab = (tabId: string) => {
    const currentTabs = formData.visibleTabs || [];
    if (currentTabs.includes(tabId)) {
        setFormData({ ...formData, visibleTabs: currentTabs.filter(t => t !== tabId) });
    } else {
        setFormData({ ...formData, visibleTabs: [...currentTabs, tabId] });
    }
  };

  const toggleTenantTab = (tabId: string) => {
    const currentTabs = formData.visibleTenantTabs || [];
    if (currentTabs.includes(tabId)) {
        setFormData({ ...formData, visibleTenantTabs: currentTabs.filter(t => t !== tabId) });
    } else {
        setFormData({ ...formData, visibleTenantTabs: [...currentTabs, tabId] });
    }
  };
  
  // Group tenant tabs by section
  const groupedTenantTabs = AVAILABLE_TENANT_TABS.reduce((acc, tab) => {
    if (!acc[tab.section]) acc[tab.section] = [];
    acc[tab.section].push(tab);
    return acc;
  }, {} as Record<string, typeof AVAILABLE_TENANT_TABS>);

  const toggleFeature = (featureId: string) => {
    const currentFeatures = formData.enabledFeatures || [];
    if (currentFeatures.includes(featureId)) {
        setFormData({ ...formData, enabledFeatures: currentFeatures.filter(f => f !== featureId) });
    } else {
        setFormData({ ...formData, enabledFeatures: [...currentFeatures, featureId] });
    }
  };

  // Group features by category
  const groupedFeatures = AVAILABLE_FEATURES.reduce((acc, feat) => {
    if (!acc[feat.category]) acc[feat.category] = [];
    acc[feat.category].push(feat);
    return acc;
  }, {} as Record<string, typeof AVAILABLE_FEATURES>);


  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{t('versions.title') || 'Versions & Sidebar Control'}</h2>
          <p className="text-muted-foreground">
            {t('versions.subtitle') || 'Manage different dashboard versions and their visible features.'}
          </p>
        </div>
        <Button onClick={() => { resetForm(); setShowDialog(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          {t('versions.create') || 'Create Version'}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {versions.map(version => (
          <Card key={version.id} className={`relative overflow-hidden group hover:shadow-xl transition-all duration-300 ${version.isDefault ? 'border-primary ring-1 ring-primary/20' : 'border-border/50'}`}>
            <div className={`absolute top-0 left-0 w-1 h-full ${version.isDefault ? 'bg-primary' : 'bg-transparent'}`} />
            
            {version.isDefault && (
                <div className={`absolute top-0 ${isRTL ? 'left-0' : 'right-0'} p-3`}>
                    <Badge className="bg-primary text-primary-foreground font-semibold shadow-sm">
                      {isRTL ? 'النسخة الافتراضية' : 'Default Version'}
                    </Badge>
                </div>
            )}
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-xl font-bold flex items-center gap-2">
                    {version.name}
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 uppercase font-bold tracking-wider opacity-70">
                      {version.versionCode}
                    </Badge>
                  </CardTitle>
                  <CardDescription className="line-clamp-2 min-h-[40px] text-sm">
                    {version.description || (isRTL ? 'لا يوجد وصف' : 'No description available')}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pb-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1 p-3 rounded-xl bg-primary/5 border border-primary/10">
                   <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">{isRTL ? 'تبويبات النظام' : 'System Tabs'}</p>
                   <p className="text-xl font-black text-primary">{version.visibleTabs.length}</p>
                </div>
                <div className="space-y-1 p-3 rounded-xl bg-orange-500/5 border border-orange-500/10">
                   <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">{isRTL ? 'تبويبات التاجر' : 'Tenant Tabs'}</p>
                   <p className="text-xl font-black text-orange-600">{version.visibleTenantTabs?.length || 0}</p>
                </div>
                <div className="space-y-1 p-3 rounded-xl bg-blue-500/5 border border-blue-500/10">
                   <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">{isRTL ? 'الميزات' : 'Features'}</p>
                   <p className="text-xl font-black text-blue-600">{version.enabledFeatures?.length || 0}</p>
                </div>
                <div className="space-y-1 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                   <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">{isRTL ? 'الحالة' : 'Status'}</p>
                   <div className="flex items-center gap-1.5 mt-1">
                     <div className={`w-2 h-2 rounded-full ${version.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-muted-foreground'}`} />
                     <span className={`text-sm font-bold ${version.isActive ? 'text-emerald-700' : 'text-muted-foreground'}`}>
                       {version.isActive ? (isRTL ? 'نشط' : 'Active') : (isRTL ? 'معطل' : 'Inactive')}
                     </span>
                   </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between bg-muted/30 pt-4 pb-4">
               <Button variant="outline" size="sm" className="bg-background hover:bg-muted font-bold" onClick={() => openEdit(version)}>
                 <Edit className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                 {isRTL ? 'تعديل النسخة' : 'Edit Version'}
               </Button>
               {!version.isDefault && (
                 <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10 font-bold" onClick={() => handleDelete(version.id)}>
                   <Trash2 className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                   {isRTL ? 'حذف' : 'Delete'}
                 </Button>
               )}
            </CardFooter>
          </Card>
        ))}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingVersion ? 'Edit Version' : 'Create Version'}</DialogTitle>
            <DialogDescription>Configure sidebar tabs and features for this version.</DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="w-full justify-start mb-4">
                <TabsTrigger value="general">{t('versions.generalInfo') || 'General Info'}</TabsTrigger>
                <TabsTrigger value="tenant-tabs">{t('versions.tenantTabs') || 'Tenant Sidebar'}</TabsTrigger>
                <TabsTrigger value="system-tabs">{t('versions.systemTabs') || 'System Sidebar'}</TabsTrigger>
                <TabsTrigger value="features">{t('versions.features') || 'Features'}</TabsTrigger>
            </TabsList>
            
            <TabsContent value="general" className="space-y-6 py-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>{t('versions.versionName') || 'Version Name'}</Label>
                        <Input 
                            value={formData.name} 
                            onChange={e => setFormData({...formData, name: e.target.value})} 
                            placeholder="e.g. Pro Dashboard"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>{t('versions.versionCode') || 'Version Code'}</Label>
                        <Input 
                            value={formData.versionCode} 
                            onChange={e => setFormData({...formData, versionCode: e.target.value})} 
                            placeholder="e.g. v2-pro"
                        />
                    </div>
                </div>
                
                <div className="space-y-2">
                    <Label>{t('versions.description') || 'Description'}</Label>
                    <Textarea 
                        value={formData.description} 
                        onChange={e => setFormData({...formData, description: e.target.value})} 
                        placeholder="Describe this version..."
                    />
                </div>

                <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                        <Switch 
                            checked={formData.isActive} 
                            onCheckedChange={c => setFormData({...formData, isActive: c})}
                        />
                        <Label>{t('versions.active') || 'Active'}</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Switch 
                            checked={formData.isDefault} 
                            onCheckedChange={c => setFormData({...formData, isDefault: c})}
                        />
                        <Label>{t('versions.makeDefault') || 'Default Version'}</Label>
                    </div>
                    

                    {/* NEW: Email Notification */}
                     <div className="flex items-center space-x-2">
                        <Checkbox 
                            id="notify-users" 
                            checked={notifyUsers} 
                            onCheckedChange={(c) => setNotifyUsers(c as boolean)}
                        />
                        <Label htmlFor="notify-users">{t('versions.emailNotification') || 'Send Email Notification'}</Label>
                    </div>
                </div>
            </TabsContent>

            <TabsContent value="tenant-tabs" className="space-y-6 py-4">
                 <div className="space-y-4 border rounded-lg p-4">
                    <h3 className="font-semibold flex items-center gap-2">
                        <Layout className="h-4 w-4" /> Tenant Sidebar Control
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">Select which tabs will be visible to the Shop Owner/Tenant Admin.</p>
                    
                    {Object.entries(groupedTenantTabs).map(([section, tabs]) => (
                        <div key={section} className="mb-6">
                            <h4 className="text-sm font-bold uppercase text-muted-foreground mb-3 border-b pb-1">{section}</h4>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {tabs.map(tab => (
                                    <div key={tab.id} className="flex items-center space-x-2 border p-2 rounded hover:bg-muted/50 transition-colors">
                                        <Checkbox 
                                            id={`tenant-tab-${tab.id}`} 
                                            checked={formData.visibleTenantTabs?.includes(tab.id)}
                                            onCheckedChange={() => toggleTenantTab(tab.id)}
                                        />
                                        <Label htmlFor={`tenant-tab-${tab.id}`} className="cursor-pointer font-medium text-sm">
                                            {tab.label}
                                        </Label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </TabsContent>

            <TabsContent value="system-tabs" className="space-y-6 py-4">
                <div className="space-y-4 border rounded-lg p-4">
                    <h3 className="font-semibold flex items-center gap-2">
                        <Shield className="h-4 w-4" /> System Admin Control
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">Select which tabs will be visible in THIS System Admin Panel for this profile.</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {AVAILABLE_TABS.map(tab => (
                            <div key={tab.id} className="flex items-center space-x-2 border p-2 rounded hover:bg-muted/50">
                                <Checkbox 
                                    id={`tab-${tab.id}`} 
                                    checked={formData.visibleTabs?.includes(tab.id)}
                                    onCheckedChange={() => toggleTab(tab.id)}
                                />
                                <Label htmlFor={`tab-${tab.id}`} className="cursor-pointer flex items-center gap-2">
                                    {tab.label}
                                </Label>
                            </div>
                        ))}
                    </div>
                </div>
            </TabsContent>

            <TabsContent value="features" className="space-y-6 py-4">
                <div className="space-y-4 border rounded-lg p-4">
                    <h3 className="font-semibold flex items-center gap-2">
                        <Zap className="h-4 w-4" /> Feature Availability
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">Control which specific features are enabled for this version.</p>
                    
                    {Object.entries(groupedFeatures).map(([category, features]) => (
                        <div key={category} className="mb-6">
                            <h4 className="text-sm font-bold uppercase text-muted-foreground mb-3 border-b pb-1">
                                {category === 'core' ? 'Core Features' : 
                                 category.charAt(0).toUpperCase() + category.slice(1)}
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {features.map(feat => (
                                    <div key={feat.id} className="flex items-start space-x-3 border p-3 rounded hover:bg-muted/50 transition-colors">
                                        <Checkbox 
                                            id={`feat-${feat.id}`} 
                                            checked={formData.enabledFeatures?.includes(feat.id)}
                                            onCheckedChange={() => toggleFeature(feat.id)}
                                            className="mt-1"
                                        />
                                        <div className="grid gap-1.5 leading-none">
                                            <Label htmlFor={`feat-${feat.id}`} className="cursor-pointer font-medium">
                                                {feat.label}
                                            </Label>
                                            <p className="text-xs text-muted-foreground">
                                                {feat.description}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>{t('common.cancel') || 'Cancel'}</Button>
            <Button onClick={handleSave}>{t('versions.save') || 'Save Version'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
