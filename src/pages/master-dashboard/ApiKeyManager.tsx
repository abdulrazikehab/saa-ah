import { useState, useEffect, useCallback } from 'react';
import { coreApi } from '@/lib/api';
import { 
  Key, 
  Plus,
  Edit,
  Trash2,
  Copy,
  Eye,
  EyeOff,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  Search,
  Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getAdminApiKey } from '@/lib/admin-config';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ApiKey {
  id: string;
  name: string;
  apiKey?: string; // Only shown on creation/regeneration
  tenantId: string;
  tenant?: {
    name: string;
    subdomain: string;
  };
  isActive: boolean;
  lastUsedAt: string | null;
  createdAt: string;
  updatedAt: string;
}


export default function ApiKeyManager() {
  const { toast } = useToast();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isRegenerateDialogOpen, setIsRegenerateDialogOpen] = useState(false);
  const [editingApiKey, setEditingApiKey] = useState<ApiKey | null>(null);
  const [regeneratingApiKey, setRegeneratingApiKey] = useState<ApiKey | null>(null);
  const [newApiKey, setNewApiKey] = useState<string>('');
  const [showApiKey, setShowApiKey] = useState<{ [key: string]: boolean }>({});
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
  });

  const loadApiKeys = useCallback(async () => {
    try {
      setLoading(true);
      const response = await coreApi.get('/admin/master/api-keys', { requireAuth: true, adminApiKey: getAdminApiKey() });
      setApiKeys(response.apiKeys || response || []);
    } catch (error: any) {
      console.error('Failed to load API keys:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.response?.data?.message || 'Failed to load API keys'
      });
      setApiKeys([]);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadApiKeys();
  }, [loadApiKeys]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.name.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please enter an API key name'
      });
      return;
    }

    setLoading(true);
    try {
      if (editingApiKey) {
        await coreApi.put(`/admin/master/api-keys/${editingApiKey.id}`, { name: formData.name }, { requireAuth: true, adminApiKey: getAdminApiKey() });
        toast({
          title: 'Success',
          description: 'API key updated successfully'
        });
      } else {
        const response = await coreApi.post('/admin/master/api-keys', { name: formData.name.trim() }, { requireAuth: true, adminApiKey: getAdminApiKey() });
        setNewApiKey(response.apiKey);
        setIsRegenerateDialogOpen(true);
        setRegeneratingApiKey(null);
        toast({
          title: 'Success',
          description: 'API key created successfully. Please copy it now - it will not be shown again!'
        });
      }
      setIsDialogOpen(false);
      resetForm();
      loadApiKeys();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.response?.data?.message || 'Failed to save API key'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (apiKey: ApiKey) => {
    setEditingApiKey(apiKey);
    setFormData({
      name: apiKey.name,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this API key? Any application using it will lose access to the API.')) return;

    try {
      await coreApi.delete(`/admin/master/api-keys/${id}`, { requireAuth: true, adminApiKey: getAdminApiKey() });
      toast({
        title: 'Success',
        description: 'API key deleted successfully'
      });
      loadApiKeys();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.response?.data?.message || 'Failed to delete API key'
      });
    }
  };

  const handleToggleActive = async (apiKey: ApiKey) => {
    try {
      await coreApi.put(
        `/admin/master/api-keys/${apiKey.id}`,
        { isActive: !apiKey.isActive },
        { requireAuth: true, adminApiKey: getAdminApiKey() }
      );
      toast({
        title: 'Success',
        description: apiKey.isActive ? 'API key disabled' : 'API key enabled'
      });
      loadApiKeys();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update API key'
      });
    }
  };

  const handleRegenerate = async () => {
    if (!regeneratingApiKey) return;

    if (!confirm('Are you sure you want to regenerate this API key? The old key will be invalidated and will no longer work.')) return;

    setLoading(true);
    try {
      const response = await coreApi.post(`/admin/master/api-keys/${regeneratingApiKey.id}/regenerate`, {}, { requireAuth: true, adminApiKey: getAdminApiKey() });
      setNewApiKey(response.apiKey);
      setIsRegenerateDialogOpen(true);
      toast({
        title: 'Success',
        description: 'API key regenerated successfully. Please copy it now - it will not be shown again!'
      });
      loadApiKeys();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.response?.data?.message || 'Failed to regenerate API key'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied',
      description: 'API key copied to clipboard'
    });
  };

  const resetForm = () => {
    setFormData({ name: '' });
    setEditingApiKey(null);
    setRegeneratingApiKey(null);
    setNewApiKey('');
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never used';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredApiKeys = apiKeys.filter(apiKey => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return apiKey.name.toLowerCase().includes(searchLower);
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">API Key Management</h2>
          <p className="text-gray-400">
            Create and manage API keys to track usage of your APIs. Users can use these keys to authenticate their requests.
          </p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} className="bg-violet-600 hover:bg-violet-700">
          <Plus className="mr-2 h-4 w-4" />
          Create API Key
        </Button>
      </div>

      <Alert className="bg-gray-800/50 border-gray-700">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="text-gray-300">
          Use API keys to authenticate API requests from external applications like websites or mobile apps.
          Add the key in the request header as <code className="px-1 py-0.5 bg-gray-700 rounded">X-API-Key</code>.
          You can track which clients are using your APIs based on the API key name.
        </AlertDescription>
      </Alert>

      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-gray-800/50 border-gray-700 text-white"
          />
        </div>
      </div>

      <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-xl overflow-hidden">
        {loading && apiKeys.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
          </div>
        ) : filteredApiKeys.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Key className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p>No API keys found</p>
            <Button onClick={() => setIsDialogOpen(true)} className="mt-4 bg-violet-600 hover:bg-violet-700">
              <Plus className="mr-2 h-4 w-4" />
              Create First API Key
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-gray-700">
                <TableHead className="text-gray-300">Name</TableHead>
                <TableHead className="text-gray-300">Status</TableHead>
                <TableHead className="text-gray-300">Last Used</TableHead>
                <TableHead className="text-gray-300">Created</TableHead>
                <TableHead className="text-right text-gray-300">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredApiKeys.map((apiKey) => (
                <TableRow key={apiKey.id} className="border-gray-700 hover:bg-gray-800/50">
                  <TableCell className="font-medium text-white">{apiKey.name}</TableCell>
                  <TableCell>
                    <Badge variant={apiKey.isActive ? 'default' : 'secondary'} className={apiKey.isActive ? 'bg-green-600' : 'bg-gray-600'}>
                      {apiKey.isActive ? (
                        <>
                          <CheckCircle className="mr-1 h-3 w-3" />
                          Active
                        </>
                      ) : (
                        <>
                          <XCircle className="mr-1 h-3 w-3" />
                          Inactive
                        </>
                      )}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-gray-400">{formatDate(apiKey.lastUsedAt)}</TableCell>
                  <TableCell className="text-gray-400">{formatDate(apiKey.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleActive(apiKey)}
                        className="text-gray-400 hover:text-white"
                      >
                        {apiKey.isActive ? 'Disable' : 'Enable'}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setRegeneratingApiKey(apiKey);
                          handleRegenerate();
                        }}
                        className="text-gray-400 hover:text-white"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(apiKey)}
                        className="text-gray-400 hover:text-white"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(apiKey.id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-gray-800 border-gray-700">
            <DialogHeader>
            <DialogTitle className="text-white">{editingApiKey ? 'Edit API Key' : 'Create New API Key'}</DialogTitle>
            <DialogDescription className="text-gray-400">
              {editingApiKey
                ? 'Update the API key name'
                : 'Enter a descriptive name for the API key. The key will be auto-generated and you can copy it.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-gray-300">API Key Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Saeaa Website, Edara Mobile App, Mobile Client"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="bg-gray-700 border-gray-600 text-white"
                />
                <p className="text-xs text-gray-400">
                  Enter a descriptive name to identify which client or application will use this API key
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="border-gray-600 text-gray-300">
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="bg-violet-600 hover:bg-violet-700">
                {loading ? 'Saving...' : editingApiKey ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Show New/Regenerated API Key Dialog */}
      <Dialog open={isRegenerateDialogOpen} onOpenChange={setIsRegenerateDialogOpen}>
        <DialogContent className="bg-gray-800 border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white">
              {regeneratingApiKey ? 'API Key Regenerated' : 'API Key Created'}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              <Alert className="mt-4 bg-yellow-900/20 border-yellow-700">
                <AlertCircle className="h-4 w-4 text-yellow-500" />
                <AlertDescription className="text-yellow-200">
                  <strong>Important:</strong> Please copy the API key now. It will not be shown again after closing this dialog.
                </AlertDescription>
              </Alert>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-gray-300">API Key</Label>
              <div className="flex items-center gap-2">
                <Input
                  type={showApiKey['new'] ? 'text' : 'password'}
                  value={newApiKey}
                  readOnly
                  className="font-mono text-sm bg-gray-700 border-gray-600 text-white"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setShowApiKey({ ...showApiKey, new: !showApiKey['new'] })}
                  className="border-gray-600"
                >
                  {showApiKey['new'] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => handleCopy(newApiKey)}
                  className="border-gray-600"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="rounded-md bg-gray-700/50 p-4">
              <p className="text-sm font-medium text-gray-300 mb-2">Usage:</p>
              <code className="text-xs block text-gray-400">
                X-API-Key: {newApiKey.substring(0, 20)}...
              </code>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setIsRegenerateDialogOpen(false)} className="bg-violet-600 hover:bg-violet-700">
              I've Copied It
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

