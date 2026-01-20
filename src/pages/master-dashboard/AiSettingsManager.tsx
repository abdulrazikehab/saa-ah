import { useState, useEffect, useCallback } from 'react';
import { coreApi } from '@/lib/api';
import { Save, Loader2, Bot } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getAdminApiKey } from '@/lib/admin-config';

export default function AiSettingsManager() {
  const [script, setScript] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const loadScript = useCallback(async () => {
    try {
      setLoading(true);
      const response = await coreApi.get('/admin/master/ai-script', { requireAuth: true, adminApiKey: getAdminApiKey() });
      setScript(response.script || '');
    } catch (error) {
      console.error('Failed to load AI script:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load AI script'
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadScript();
  }, [loadScript]);

  const handleSave = async () => {
    try {
      setSaving(true);
      await coreApi.post('/admin/master/ai-script', { script }, { requireAuth: true, adminApiKey: getAdminApiKey() });
      toast({
        title: 'Success',
        description: 'AI script updated successfully'
      });
    } catch (error) {
      console.error('Failed to save AI script:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to save AI script'
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">AI Assistant Settings</h2>
          <p className="text-gray-400">Configure the global behavior and knowledge base for the AI assistant</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Changes
        </button>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="flex items-start gap-4 mb-6">
          <div className="p-3 bg-indigo-500/10 rounded-lg">
            <Bot className="w-6 h-6 text-indigo-500" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Global Training Script</h3>
            <p className="text-sm text-gray-400">
              This script will be injected into the system prompt for all AI interactions across the platform.
              Use this to define the AI's persona, general knowledge about Saeaa, and core policies.
            </p>
          </div>
        </div>

        <textarea
          value={script}
          onChange={(e) => setScript(e.target.value)}
          className="w-full h-[500px] px-4 py-4 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-indigo-500 resize-none"
          placeholder="Enter system instructions here..."
        />
      </div>
    </div>
  );
}
