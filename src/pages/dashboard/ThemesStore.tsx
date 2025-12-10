import { useState, useEffect } from 'react';
import { themeService } from '@/services/theme.service';
import { coreApi } from '@/lib/api';
import { Theme } from '@/services/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Palette, Loader2, Eye, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export default function ThemesStore() {
  const [themes, setThemes] = useState<Theme[]>([]);
  const [loading, setLoading] = useState(true);
  const [domain, setDomain] = useState('');
  const { toast } = useToast();
  const [showAIDialog, setShowAIDialog] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);

  useEffect(() => {
    loadThemes();
    loadDomain();
  }, []);

  const loadDomain = async () => {
    try {
      const domainData = await coreApi.getDomain();
      if (domainData) {
        // Use custom domain if available, otherwise use subdomain
        const storefrontDomain = domainData.customDomain || `${domainData.subdomain}.localhost:8080`;
        console.log('📍 Storefront domain:', storefrontDomain);
        setDomain(storefrontDomain);
      }
    } catch (error) {
      console.error('Failed to fetch domain:', error);
    }
  };

  const loadThemes = async () => {
    try {
      console.log('Loading themes...');
      const data = await themeService.getThemes();
      console.log('Themes received:', data);
      setThemes(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load themes:', error);
      setThemes([]);
      toast({
        title: 'Error',
        description: 'Failed to load themes. Please check console for details.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async (id: string) => {
    try {
      await themeService.activateTheme(id);
      toast({ title: 'Theme Activated', description: 'The theme has been applied to your store.' });
      
      // Optimistic update
      setThemes(themes.map(t => ({
        ...t,
        isActive: t.id === id
      })));
      
      loadThemes();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to activate theme', variant: 'destructive' });
    }
  };

  const handleGenerateAITheme = async () => {
    if (!aiPrompt.trim()) {
      toast({ title: 'Error', description: 'Please enter a theme description', variant: 'destructive' });
      return;
    }

    setAiGenerating(true);
    try {
      const response = await coreApi.post('/themes/ai/generate', {
        prompt: aiPrompt,
        style: 'professional and modern'
      }, { requireAuth: true });

      toast({ 
        title: 'Theme Generated!', 
        description: 'AI has created a custom theme for your store.' 
      });
      
      setShowAIDialog(false);
      setAiPrompt('');
      loadThemes();
    } catch (error) {
      console.error('Failed to generate AI theme:', error);
      toast({ 
        title: 'Error', 
        description: 'Failed to generate theme. Please try again.', 
        variant: 'destructive' 
      });
    } finally {
      setAiGenerating(false);
    }
  };

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin h-8 w-8" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Themes Store</h1>
          <p className="text-gray-500">Choose a theme for your store</p>
        </div>
        <Button onClick={() => setShowAIDialog(true)} className="gap-2">
          <Sparkles className="w-4 h-4" />
          Generate AI Theme
        </Button>
      </div>

      {themes.length === 0 && !loading ? (
        <div className="text-center py-12">
          <Palette className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold mb-2">No Themes Found</h3>
          <p className="text-gray-500 mb-4">
            Run the seed script to add default themes:
          </p>
          <code className="bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded">
            node prisma/seed-theme.js
          </code>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {themes.map((theme) => (
          <Card key={theme.id} className={`transition-all ${theme.isActive ? 'border-primary border-2 shadow-md' : 'hover:shadow-md'}`}>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                {theme.name}
                {theme.isActive && <Badge className="bg-green-500">Active</Badge>}
              </CardTitle>
              <CardDescription>{theme.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-40 bg-gray-100 dark:bg-gray-800 rounded-md flex items-center justify-center">
                <Palette className="h-10 w-10 text-gray-400" />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-2">
              {theme.isActive ? (
                <Button disabled className="w-full variant-secondary">
                  <Check className="mr-2 h-4 w-4" /> Active
                </Button>
              ) : (
                <Button onClick={() => handleActivate(theme.id)} className="w-full">
                  Activate
                </Button>
              )}
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => {
                  // Build correct preview URL
                  let previewUrl = '';
                  
                  if (domain) {
                    // Use the tenant domain
                    previewUrl = `http://${domain}/?theme_preview=${theme.id}`;
                  } else {
                    // Fallback to current origin
                    previewUrl = `${window.location.origin}/?theme_preview=${theme.id}`;
                  }
                  
                  console.log('🎨 Opening theme preview:', previewUrl);
                  window.open(previewUrl, '_blank');
                }}
              >
                <Eye className="mr-2 h-4 w-4" /> Preview
              </Button>
            </CardFooter>
          </Card>
        ))}
        </div>
      )}

      {/* AI Theme Generation Dialog */}
      <Dialog open={showAIDialog} onOpenChange={setShowAIDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              Generate AI Theme
            </DialogTitle>
            <DialogDescription>
              Describe your ideal theme and AI will create a custom design for your store.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="ai-prompt">Theme Description</Label>
              <Textarea
                id="ai-prompt"
                placeholder="Example: Modern e-commerce theme with dark mode, vibrant purple and blue gradients, clean typography, and smooth animations..."
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                rows={6}
                className="mt-2"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAIDialog(false)} disabled={aiGenerating}>
                Cancel
              </Button>
              <Button onClick={handleGenerateAITheme} disabled={aiGenerating} className="gap-2">
                {aiGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generate Theme
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
