import { useState, useEffect, useCallback } from 'react';
import { themeService } from '@/services/theme.service';
import { coreApi } from '@/lib/api';
import { Theme } from '@/services/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Palette, Loader2, Eye, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export default function ThemesStore() {
  const { t } = useTranslation();
  const [themes, setThemes] = useState<Theme[]>([]);
  const [loading, setLoading] = useState(true);
  const [domain, setDomain] = useState('');
  const { toast } = useToast();
  const [showAIDialog, setShowAIDialog] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);

  const loadDomain = useCallback(async () => {
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
  }, []);

  const loadThemes = useCallback(async () => {
    try {
      console.log('Loading themes...');
      const data = await themeService.getThemes();
      console.log('Themes received:', data);
      setThemes(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load themes:', error);
      setThemes([]);
      toast({
        title: t('dashboard.design.error'),
        description: t('dashboard.design.loadError'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast, t]);

  useEffect(() => {
    loadThemes();
    loadDomain();
  }, [loadThemes, loadDomain]);

  const handleActivate = async (id: string) => {
    try {
      await themeService.activateTheme(id);
      toast({ 
        title: t('dashboard.design.activateSuccess'), 
        description: t('dashboard.design.activateSuccessDesc') 
      });
      
      // Optimistic update
      setThemes(themes.map(t => ({
        ...t,
        isActive: t.id === id
      })));
      
      loadThemes();
    } catch (error) {
      toast({ 
        title: t('dashboard.design.error'), 
        description: t('dashboard.design.activateError'), 
        variant: 'destructive' 
      });
    }
  };

  const handleGenerateAITheme = async () => {
    if (!aiPrompt.trim()) {
      toast({ 
        title: t('dashboard.design.error'), 
        description: t('dashboard.design.enterPrompt'), 
        variant: 'destructive' 
      });
      return;
    }

    setAiGenerating(true);
    try {
      await coreApi.post('/themes/ai/generate', {
        prompt: aiPrompt,
        style: 'professional and modern'
      }, { requireAuth: true });

      toast({ 
        title: t('dashboard.design.themeGenerated'), 
        description: t('dashboard.design.themeGeneratedDesc') 
      });
      
      setShowAIDialog(false);
      setAiPrompt('');
      loadThemes();
    } catch (error) {
      console.error('Failed to generate AI theme:', error);
      toast({ 
        title: t('dashboard.design.error'), 
        description: t('dashboard.design.generateError'), 
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
          <h1 className="text-3xl font-bold">{t('dashboard.design.title')}</h1>
          <p className="text-gray-500">{t('dashboard.design.subtitle')}</p>
        </div>
        <Button onClick={() => setShowAIDialog(true)} className="gap-2">
          <Sparkles className="w-4 h-4" />
          {t('dashboard.design.generateAI')}
        </Button>
      </div>

      {themes.length === 0 && !loading ? (
        <div className="text-center py-12">
          <Palette className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold mb-2">{t('dashboard.design.noThemes')}</h3>
          <p className="text-gray-500 mb-4">
            {t('dashboard.design.seedHint')}
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
                {theme.isActive && <Badge className="bg-green-500">{t('dashboard.design.active')}</Badge>}
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
                  <Check className="mr-2 h-4 w-4" /> {t('dashboard.design.active')}
                </Button>
              ) : (
                <Button onClick={() => handleActivate(theme.id)} className="w-full">
                  {t('dashboard.design.activate')}
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
                <Eye className="mr-2 h-4 w-4" /> {t('dashboard.design.preview')}
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
              {t('dashboard.design.aiDialogTitle')}
            </DialogTitle>
            <DialogDescription>
              {t('dashboard.design.aiDialogDesc')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="ai-prompt">{t('dashboard.design.themeDesc')}</Label>
              <Textarea
                id="ai-prompt"
                placeholder={t('dashboard.design.themeDescPlaceholder')}
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                rows={6}
                className="mt-2"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAIDialog(false)} disabled={aiGenerating}>
                {t('common.cancel')}
              </Button>
              <Button onClick={handleGenerateAITheme} disabled={aiGenerating} className="gap-2">
                {aiGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t('dashboard.design.generating')}
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    {t('dashboard.design.generateTheme')}
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
