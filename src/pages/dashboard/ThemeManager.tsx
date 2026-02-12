
import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Palette, Type, Layout, Monitor, Smartphone, Moon, Sun, 
  RotateCcw, Save, Check, ExternalLink, RefreshCw, Sparkles 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { coreApi } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Define the configuration interface (simplified)
interface ThemeConfig {
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  theme: 'light' | 'dark';
  cornerRadius: string;
  buttonStyle: 'filled' | 'outline' | 'ghost';
  enableGlassEffect: boolean;
  // New additions
  accentColor: string;
  backgroundColor: string;
  headerStyle: 'solid' | 'transparent' | 'gradient';
  animationStyle: 'none' | 'subtle' | 'smooth' | 'dynamic';
  cardStyle: 'flat' | 'elevated' | 'bordered' | 'glass';
}

const DEFAULT_THEME_CONFIG: ThemeConfig = {
  primaryColor: '#2563eb',
  secondaryColor: '#1e40af',
  accentColor: '#f59e0b',
  backgroundColor: '#ffffff',
  fontFamily: 'Inter',
  theme: 'light',
  cornerRadius: '1rem',
  buttonStyle: 'filled',
  enableGlassEffect: false,
  headerStyle: 'solid',
  animationStyle: 'smooth',
  cardStyle: 'elevated',
};

const PREVIEW_PAGES = [
  { label: 'Home', value: '/' },
  { label: 'Products', value: '/products' },
  { label: 'Categories', value: '/categories' },
  { label: 'About Us', value: '/about' },
  { label: 'Contact Us', value: '/contact' },
  { label: 'Login', value: '/login' },
];

// Color palette presets
const COLOR_PALETTES = [
  { name: 'Default Blue', primary: '#2563eb', secondary: '#1e40af', accent: '#f59e0b' },
  { name: 'Forest Green', primary: '#059669', secondary: '#047857', accent: '#fbbf24' },
  { name: 'Royal Purple', primary: '#7c3aed', secondary: '#6d28d9', accent: '#ec4899' },
  { name: 'Sunset Orange', primary: '#ea580c', secondary: '#c2410c', accent: '#facc15' },
  { name: 'Midnight', primary: '#0f172a', secondary: '#1e293b', accent: '#38bdf8' },
  { name: 'Rose', primary: '#e11d48', secondary: '#be123c', accent: '#fef08a' },
  { name: 'Ocean', primary: '#0891b2', secondary: '#0e7490', accent: '#a3e635' },
  { name: 'Amber', primary: '#d97706', secondary: '#b45309', accent: '#7dd3fc' },
];

// Full theme templates with preview images
const THEME_TEMPLATES = [
  {
    id: 'modern-minimal',
    name: 'Modern Minimal',
    description: 'Clean design with subtle animations',
    preview: '🎨',
    config: {
      primaryColor: '#0f172a',
      secondaryColor: '#334155',
      accentColor: '#06b6d4',
      backgroundColor: '#ffffff',
      theme: 'light' as const,
      fontFamily: 'Inter',
      cornerRadius: '0.5rem',
      buttonStyle: 'filled' as const,
      enableGlassEffect: false,
      headerStyle: 'solid' as const,
      animationStyle: 'subtle' as const,
      cardStyle: 'flat' as const,
    },
  },
  {
    id: 'vibrant-gaming',
    name: 'Vibrant Gaming',
    description: 'Bold colors with dynamic effects',
    preview: '🎮',
    config: {
      primaryColor: '#7c3aed',
      secondaryColor: '#4f46e5',
      accentColor: '#f43f5e',
      backgroundColor: '#0f0f23',
      theme: 'dark' as const,
      fontFamily: 'Outfit',
      cornerRadius: '1rem',
      buttonStyle: 'filled' as const,
      enableGlassEffect: true,
      headerStyle: 'gradient' as const,
      animationStyle: 'dynamic' as const,
      cardStyle: 'glass' as const,
    },
  },
  {
    id: 'elegant-luxury',
    name: 'Elegant Luxury',
    description: 'Premium feel with gold accents',
    preview: '✨',
    config: {
      primaryColor: '#1c1917',
      secondaryColor: '#44403c',
      accentColor: '#d4af37',
      backgroundColor: '#fafaf9',
      theme: 'light' as const,
      fontFamily: 'Playfair Display',
      cornerRadius: '0.25rem',
      buttonStyle: 'outline' as const,
      enableGlassEffect: false,
      headerStyle: 'solid' as const,
      animationStyle: 'smooth' as const,
      cardStyle: 'bordered' as const,
    },
  },
  {
    id: 'fresh-nature',
    name: 'Fresh Nature',
    description: 'Organic greens with earthy tones',
    preview: '🌿',
    config: {
      primaryColor: '#059669',
      secondaryColor: '#065f46',
      accentColor: '#fbbf24',
      backgroundColor: '#f0fdf4',
      theme: 'light' as const,
      fontFamily: 'Poppins',
      cornerRadius: '1.5rem',
      buttonStyle: 'filled' as const,
      enableGlassEffect: false,
      headerStyle: 'transparent' as const,
      animationStyle: 'smooth' as const,
      cardStyle: 'elevated' as const,
    },
  },
  {
    id: 'tech-dark',
    name: 'Tech Dark',
    description: 'Sleek dark mode for tech stores',
    preview: '🚀',
    config: {
      primaryColor: '#3b82f6',
      secondaryColor: '#1d4ed8',
      accentColor: '#22d3ee',
      backgroundColor: '#0a0a0a',
      theme: 'dark' as const,
      fontFamily: 'Inter',
      cornerRadius: '0.75rem',
      buttonStyle: 'filled' as const,
      enableGlassEffect: true,
      headerStyle: 'gradient' as const,
      animationStyle: 'dynamic' as const,
      cardStyle: 'glass' as const,
    },
  },
];

export default function ThemeManager() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  
  const [config, setConfig] = useState<ThemeConfig>(DEFAULT_THEME_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activePage, setActivePage] = useState('/');
  const [previewKey, setPreviewKey] = useState(0); // To force iframe reload
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [storefrontHost, setStorefrontHost] = useState('');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Load existing configuration
  useEffect(() => {
    const loadConfig = async () => {
      try {
        console.log('🎨 [ThemeManager] Loading saved config from API...');
        const res = await coreApi.get('/site-config/mobile', { requireAuth: true }).catch((err) => {
          console.error('🎨 [ThemeManager] API fetch failed:', err);
          return null;
        });
        console.log('🎨 [ThemeManager] API response:', res);
        
        // The API returns the config directly OR wrapped in a 'config' property
        // Handle both cases for backwards compatibility
        if (res) {
          const savedConfig = res.config || res;
          if (savedConfig && typeof savedConfig === 'object' && Object.keys(savedConfig).length > 0) {
            console.log('🎨 [ThemeManager] Loaded saved config:', savedConfig);
            setConfig(prev => ({ ...prev, ...savedConfig }));
            // Also save to localStorage for preview
            localStorage.setItem('app_builder_config', JSON.stringify(savedConfig));
          } else {
            console.log('🎨 [ThemeManager] No saved config found, using defaults');
          }
        }
      } catch (error) {
        console.error('Failed to load theme config:', error);
      } finally {
        setLoading(false);
      }
    };
    loadConfig();
  }, []);

  // Sync config to localStorage whenever it changes (for preview)
  useEffect(() => {
    // We save the FULL config, merging with existing if possible to avoid losing other settings
    try {
      const existing = localStorage.getItem('app_builder_config');
      const parsed = existing ? JSON.parse(existing) : {};
      const newConfig = { ...parsed, ...config };
      localStorage.setItem('app_builder_config', JSON.stringify(newConfig));
      
      // Dispatch event for local updates if needed?
      // window.dispatchEvent(new Event('storage'));
      
      // Reload iframe if auto-reload desired? 
      // Maybe not on every keystroke. Better to have a "Apply" button or debounce.
    } catch (e) {
      console.error(e);
    }
  }, [config]);

  useEffect(() => {
    // Send live update context to iframe
    if (iframeRef.current?.contentWindow) {
        console.log('📤 [ThemeManager] Sending THEME_UPDATE to iframe:', config);
        iframeRef.current.contentWindow.postMessage({ type: 'THEME_UPDATE', config }, '*');
    } else {
        console.log('📤 [ThemeManager] Cannot send - iframeRef not ready');
    }
  }, [config]);

  const loadDomain = useCallback(async () => {
    try {
      const domainData = await coreApi.getDomain();
      if (domainData) {
        const hostname = window.location.hostname;
        const protocol = window.location.protocol;
        let host = '';

        if (domainData.customDomain) {
            host = domainData.customDomain;
        } else {
            // Determine base domain
            if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
                 host = `${domainData.subdomain}.localhost:8080`;
            } else if (hostname.includes('kawn.com')) {
                 host = `${domainData.subdomain}.kawn.com`;
            } else if (hostname.includes('kawn.net')) {
                 host = `${domainData.subdomain}.kawn.net`;
            } else {
                 host = `${domainData.subdomain}.${hostname}`;
            }
        }
        
        console.log('📍 Storefront domain:', host);
        setStorefrontHost(`${protocol}//${host}`);
      }
    } catch (error) {
      console.error('Failed to fetch domain:', error);
    }
  }, []);

  useEffect(() => {
    // Assuming loadThemes is not needed or will be added separately
    loadDomain();
  }, [loadDomain]);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Fetch current full config to merge
      const currentRes = await coreApi.get('/site-config/mobile', { requireAuth: true }).catch(() => ({ config: {} }));
      const currentConfig = currentRes.config || {};
      
      const mergedConfig = { ...currentConfig, ...config };
      
      await coreApi.post('/site-config/mobile', { config: mergedConfig }, { requireAuth: true });
      
      toast({
        title: t('common.success', 'Saved Successfully'),
        description: t('theme.saveSuccess', 'Configuration has been updated and published.'),
      });
      
      // Reload preview
      setPreviewKey(prev => prev + 1);
      
    } catch (error) {
      toast({
        title: t('common.error', 'Error'),
        description: t('theme.saveError', 'Failed to save configuration.'),
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleRefreshPreview = () => {
    // Ensure localStorage is up to date
    localStorage.setItem('app_builder_config', JSON.stringify(config));
    setPreviewKey(prev => prev + 1);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full">Loading...</div>;
  }

  // Add timestamp to prevent caching and include theme colors in URL
  const themeParams = new URLSearchParams({
    _t: Date.now().toString(),
    theme_preview: 'live',
    primaryColor: config.primaryColor || '',
    secondaryColor: config.secondaryColor || '',
    accentColor: config.accentColor || '',
    backgroundColor: config.backgroundColor || '',
    animationStyle: config.animationStyle || 'smooth',
  }).toString();
  const previewUrl = `${storefrontHost || window.location.origin}${activePage}?${themeParams}`;

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-background">
      {/* Left Sidebar: Controls */}
      <div className="w-80 border-r bg-card flex flex-col h-full overflow-hidden shrink-0">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Palette className="w-5 h-5 text-primary" />
            {t('theme.title', 'Theme Editor')}
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            {t('theme.subtitle', 'Customize your store appearance')}
          </p>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4 space-y-6">
            
            {/* Colors */}
            <div className="space-y-4">
              <Label className="text-sm font-medium flex items-center gap-2">
                <div className="w-1 h-4 bg-primary rounded-full"></div>
                {t('theme.colors', 'Brand Colors')}
              </Label>
              
              
              {/* Presets */}
              <div className="space-y-2">
                 <Label className="text-xs text-muted-foreground">{t('theme.presets', 'Presets')}</Label>
                 <div className="grid grid-cols-4 gap-2">
                    {COLOR_PALETTES.map((palette) => (
                       <button
                         key={palette.name}
                         className="w-full aspect-square rounded-md overflow-hidden border shadow-sm hover:ring-2 ring-primary transition-all flex flex-col"
                         onClick={() => setConfig({ ...config, primaryColor: palette.primary, secondaryColor: palette.secondary, accentColor: palette.accent })}
                         title={palette.name}
                       >
                          <div className="h-1/3 w-full" style={{ backgroundColor: palette.primary }}></div>
                          <div className="h-1/3 w-full" style={{ backgroundColor: palette.secondary }}></div>
                          <div className="h-1/3 w-full" style={{ backgroundColor: palette.accent }}></div>
                       </button>
                    ))}
                 </div>
              </div>

              {/* Theme Templates */}
              <div className="space-y-2">
                 <Label className="text-xs text-muted-foreground">{t('theme.templates', 'Templates')}</Label>
                 <div className="grid grid-cols-1 gap-2">
                    {THEME_TEMPLATES.map((template) => (
                       <button
                         key={template.id}
                         className="w-full p-3 rounded-lg border shadow-sm hover:ring-2 ring-primary transition-all flex items-center gap-3 text-left"
                         onClick={() => setConfig({ ...config, ...template.config })}
                         title={template.name}
                       >
                          <div className="text-2xl">{template.preview}</div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">{template.name}</div>
                            <div className="text-xs text-muted-foreground truncate">{template.description}</div>
                          </div>
                          <div className="flex gap-1">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: template.config.primaryColor }}></div>
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: template.config.secondaryColor }}></div>
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: template.config.accentColor }}></div>
                          </div>
                       </button>
                    ))}
                 </div>
              </div>

              <div className="grid gap-3">
                <div>
                  <div className="flex justify-between mb-1">
                    <Label className="text-xs text-muted-foreground">{t('theme.primaryColor', 'Primary')}</Label>
                    <span className="text-xs font-mono">{config.primaryColor}</span>
                  </div>
                  <div className="flex gap-2">
                    <Input 
                      type="color" 
                      value={config.primaryColor}
                      onChange={(e) => setConfig({ ...config, primaryColor: e.target.value })}
                      className="w-10 h-10 p-1 rounded-lg cursor-pointer shrink-0"
                    />
                    <Input 
                      value={config.primaryColor}
                      onChange={(e) => setConfig({ ...config, primaryColor: e.target.value })}
                      className="flex-1 font-mono text-xs"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <Label className="text-xs text-muted-foreground">{t('theme.secondaryColor', 'Secondary')}</Label>
                    <span className="text-xs font-mono">{config.secondaryColor}</span>
                  </div>
                  <div className="flex gap-2">
                    <Input 
                      type="color" 
                      value={config.secondaryColor}
                      onChange={(e) => setConfig({ ...config, secondaryColor: e.target.value })}
                      className="w-10 h-10 p-1 rounded-lg cursor-pointer shrink-0"
                    />
                    <Input 
                      value={config.secondaryColor}
                      onChange={(e) => setConfig({ ...config, secondaryColor: e.target.value })}
                      className="flex-1 font-mono text-xs"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <Label className="text-xs text-muted-foreground">{t('theme.accentColor', 'Accent')}</Label>
                    <span className="text-xs font-mono">{config.accentColor}</span>
                  </div>
                  <div className="flex gap-2">
                    <Input 
                      type="color" 
                      value={config.accentColor}
                      onChange={(e) => setConfig({ ...config, accentColor: e.target.value })}
                      className="w-10 h-10 p-1 rounded-lg cursor-pointer shrink-0"
                    />
                    <Input 
                      value={config.accentColor}
                      onChange={(e) => setConfig({ ...config, accentColor: e.target.value })}
                      className="flex-1 font-mono text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Animation & Effects */}
            <div className="space-y-4">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                {t('theme.animations', 'Animations & Effects')}
              </Label>
              
              <div className="space-y-3">
                <div>
                  <Label className="text-xs text-muted-foreground mb-2 block">{t('theme.animationStyle', 'Animation Style')}</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['none', 'subtle', 'smooth', 'dynamic'] as const).map((style) => (
                      <button
                        key={style}
                        className={`p-2 rounded-lg border text-xs font-medium transition-all ${config.animationStyle === style ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-muted'}`}
                        onClick={() => setConfig({ ...config, animationStyle: style })}
                      >
                        {style.charAt(0).toUpperCase() + style.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground mb-2 block">{t('theme.cardStyle', 'Card Style')}</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['flat', 'elevated', 'bordered', 'glass'] as const).map((style) => (
                      <button
                        key={style}
                        className={`p-2 rounded-lg border text-xs font-medium transition-all ${config.cardStyle === style ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-muted'}`}
                        onClick={() => setConfig({ ...config, cardStyle: style })}
                      >
                        {style.charAt(0).toUpperCase() + style.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground mb-2 block">{t('theme.headerStyle', 'Header Style')}</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['solid', 'transparent', 'gradient'] as const).map((style) => (
                      <button
                        key={style}
                        className={`p-2 rounded-lg border text-xs font-medium transition-all ${config.headerStyle === style ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-muted'}`}
                        onClick={() => setConfig({ ...config, headerStyle: style })}
                      >
                        {style.charAt(0).toUpperCase() + style.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Typography */}
            <div className="space-y-4">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Type className="w-4 h-4" />
                {t('theme.typography', 'Typography')}
              </Label>
              
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">{t('theme.fontFamily', 'Font Family')}</Label>
                <Select 
                  value={config.fontFamily} 
                  onValueChange={(val) => setConfig({ ...config, fontFamily: val })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Inter">Inter (System)</SelectItem>
                    <SelectItem value="Cairo">Cairo (Arabic)</SelectItem>
                    <SelectItem value="Roboto">Roboto</SelectItem>
                    <SelectItem value="Poppins">Poppins</SelectItem>
                    <SelectItem value="Tajawal">Tajawal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            {/* Appearance */}
            <div className="space-y-4">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Layout className="w-4 h-4" />
                {t('theme.appearance', 'Appearance')}
              </Label>
              
              <div className="flex items-center justify-between">
                <Label className="text-xs">{t('theme.darkMode', 'Dark Mode')}</Label>
                <Switch 
                  checked={config.theme === 'dark'}
                  onCheckedChange={(c) => setConfig({ ...config, theme: c ? 'dark' : 'light' })}
                />
              </div>

              <div className="flex items-center justify-between">
                 <Label className="text-xs">{t('theme.glassEffect', 'Glassmorphism')}</Label>
                 <Switch 
                   checked={config.enableGlassEffect}
                   onCheckedChange={(c) => setConfig({ ...config, enableGlassEffect: c })}
                 />
              </div>

               <div className="space-y-2 pt-2">
                  <Label className="text-xs text-muted-foreground">{t('theme.cornerRadius', 'Corner Radius')}</Label>
                  <Select 
                    value={config.cornerRadius} 
                    onValueChange={(val) => setConfig({ ...config, cornerRadius: val })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0rem">Sharp (0px)</SelectItem>
                      <SelectItem value="0.5rem">Small (8px)</SelectItem>
                      <SelectItem value="1rem">Medium (16px)</SelectItem>
                      <SelectItem value="1.5rem">Large (24px)</SelectItem>
                      <SelectItem value="999px">Round (Pill)</SelectItem>
                    </SelectContent>
                  </Select>
               </div>
            </div>

          </div>
        </ScrollArea>

        <div className="p-4 border-t bg-muted/20 space-y-2">
          <Button className="w-full" onClick={handleSave} disabled={saving}>
             {saving ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
             {t('common.save', 'Save Changes')}
          </Button>
          <Button variant="outline" className="w-full" onClick={handleRefreshPreview}>
             <RefreshCw className="w-4 h-4 mr-2" />
             {t('common.refresh', 'Refresh Preview')}
          </Button>
        </div>
      </div>

      {/* Main Area: Preview */}
      <div className="flex-1 flex flex-col min-w-0 bg-muted/10">
        
        {/* Preview Toolbar */}
        <div className="h-14 border-b flex items-center justify-between px-4 bg-card">
          <div className="flex items-center gap-4">
             <div className="flex items-center border rounded-md overflow-hidden bg-background">
                <button 
                  onClick={() => setViewMode('desktop')}
                  className={`p-2 hover:bg-muted ${viewMode === 'desktop' ? 'bg-primary/10 text-primary' : 'text-muted-foreground'}`}
                  title="Desktop View"
                >
                   <Monitor className="w-4 h-4" />
                </button>
                <div className="w-px h-4 bg-border"></div>
                <button 
                  onClick={() => setViewMode('mobile')}
                  className={`p-2 hover:bg-muted ${viewMode === 'mobile' ? 'bg-primary/10 text-primary' : 'text-muted-foreground'}`}
                  title="Mobile View"
                >
                   <Smartphone className="w-4 h-4" />
                </button>
             </div>

             <div className="h-6 w-px bg-border mx-2"></div>

             <Select value={activePage} onValueChange={setActivePage}>
                <SelectTrigger className="w-[200px] h-9">
                  <SelectValue placeholder="Select Page" />
                </SelectTrigger>
                <SelectContent>
                   {PREVIEW_PAGES.map(page => (
                     <SelectItem key={page.value} value={page.value}>{page.label}</SelectItem>
                   ))}
                </SelectContent>
             </Select>
          </div>

          <div className="flex items-center gap-2">
             <a href={previewUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="ghost" size="sm" className="gap-2">
                   <ExternalLink className="w-4 h-4" />
                   {t('theme.openInNewTab', 'Open in New Tab')}
                </Button>
             </a>
          </div>
        </div>

        {/* Iframe Container */}
        <div className="flex-1 flex items-center justify-center p-8 overflow-hidden bg-grid-pattern">
           <div 
             className={`transition-all duration-300 shadow-2xl bg-white overflow-hidden border-8 border-gray-800 rounded-xl relative
                ${viewMode === 'mobile' ? 'w-[375px] h-[700px] rounded-[3rem]' : 'w-full h-full rounded-md'}
             `}
           >
              {viewMode === 'mobile' && (
                 <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-gray-800 rounded-b-xl z-10"></div>
              )}
              
              <iframe
                ref={iframeRef}
                onLoad={() => {
                    // Send initial config once loaded - add small delay to ensure listener is ready
                    console.log('🖼️ [ThemeManager] Iframe loaded, waiting before sending config...');
                    setTimeout(() => {
                        console.log('🖼️ [ThemeManager] Sending initial config:', config);
                        if (iframeRef.current?.contentWindow) {
                            iframeRef.current.contentWindow.postMessage({ type: 'THEME_UPDATE', config }, '*');
                        }
                    }, 500);
                }}
                key={`${activePage}-${previewKey}`} 
                src={previewUrl}
                className="w-full h-full bg-background"
                title="Preview"
                sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
              />
           </div>
        </div>

      </div>
    </div>
  );
}
