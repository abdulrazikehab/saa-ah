import React, { useEffect, useState } from 'react';
import { isMainDomain } from '@/lib/domain';
import { useTranslation } from 'react-i18next';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Paintbrush, RotateCcw, Check, Moon, Sun } from 'lucide-react';
import { toast } from 'sonner';

// --- Helper Functions ---

const hexToHSL = (hex: string) => {
  let r = 0, g = 0, b = 0;
  if (hex.length === 4) {
    r = parseInt("0x" + hex[1] + hex[1]);
    g = parseInt("0x" + hex[2] + hex[2]);
    b = parseInt("0x" + hex[3] + hex[3]);
  } else if (hex.length === 7) {
    r = parseInt("0x" + hex[1] + hex[2]);
    g = parseInt("0x" + hex[3] + hex[4]);
    b = parseInt("0x" + hex[5] + hex[6]);
  }
  
  r /= 255;
  g /= 255;
  b /= 255;
  
  const cmin = Math.min(r, g, b),
        cmax = Math.max(r, g, b),
        delta = cmax - cmin;
  let h = 0, s = 0, l = 0;

  if (delta === 0)
    h = 0;
  else if (cmax === r)
    h = ((g - b) / delta) % 6;
  else if (cmax === g)
    h = (b - r) / delta + 2;
  else
    h = (r - g) / delta + 4;

  h = Math.round(h * 60);

  if (h < 0)
    h += 360;

  l = (cmax + cmin) / 2;
  s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));
  
  s = +(s * 100).toFixed(1);
  l = +(l * 100).toFixed(1);

  return `${h} ${s}% ${l}%`;
};

// --- Types ---

interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  foreground: string;
  card: string;
  sidebar: string;
}

interface ThemeConfig {
  light: ThemeColors;
  dark: ThemeColors;
}

interface ThemeTemplate {
  name: string;
  config: ThemeConfig;
}

// --- Constants ---

const DEFAULT_THEME: ThemeConfig = {
  light: {
    primary: '#0091FF', // Brand Blue
    secondary: '#0066FF',
    accent: '#38BDF8',
    background: '#FCFCFD',
    foreground: '#14141F',
    card: '#FFFFFF',
    sidebar: '#0D162B',
  },
  dark: {
    primary: '#0091FF', // Brand Blue
    secondary: '#0066FF',
    accent: '#38BDF8',
    background: '#0D162B',
    foreground: '#F1F1F3',
    card: '#09101F',
    sidebar: '#09101F',
  }
};

const PRESET_THEMES: ThemeTemplate[] = [
  {
    name: "Koun Blue (Default)",
    config: DEFAULT_THEME
  },
  {
    name: "Ocean Depths",
    config: {
      light: {
        primary: '#0EA5E9',
        secondary: '#0284C7',
        accent: '#38BDF8',
        background: '#F0F9FF',
        foreground: '#0C4A6E',
        card: '#FFFFFF',
        sidebar: '#0C4A6E',
      },
      dark: {
        primary: '#38BDF8',
        secondary: '#0EA5E9',
        accent: '#7DD3FC',
        background: '#0C4A6E',
        foreground: '#F0F9FF',
        card: '#082F49',
        sidebar: '#082F49',
      }
    }
  },
  {
    name: "Forest Whisper",
    config: {
      light: {
        primary: '#22C55E',
        secondary: '#16A34A',
        accent: '#86EFAC',
        background: '#F0FDF4',
        foreground: '#14532D',
        card: '#FFFFFF',
        sidebar: '#14532D',
      },
      dark: {
        primary: '#4ADE80',
        secondary: '#22C55E',
        accent: '#86EFAC',
        background: '#14532D',
        foreground: '#F0FDF4',
        card: '#052E16',
        sidebar: '#052E16',
      }
    }
  },
  {
    name: "Sunset Glow",
    config: {
      light: {
        primary: '#F97316',
        secondary: '#EA580C',
        accent: '#FDBA74',
        background: '#FFF7ED',
        foreground: '#7C2D12',
        card: '#FFFFFF',
        sidebar: '#7C2D12',
      },
      dark: {
        primary: '#FB923C',
        secondary: '#F97316',
        accent: '#FDBA74',
        background: '#7C2D12',
        foreground: '#FFF7ED',
        card: '#431407',
        sidebar: '#431407',
      }
    }
  },
  {
    name: "Royal Velvet",
    config: {
      light: {
        primary: '#8B5CF6',
        secondary: '#7C3AED',
        accent: '#C4B5FD',
        background: '#F5F3FF',
        foreground: '#4C1D95',
        card: '#FFFFFF',
        sidebar: '#4C1D95',
      },
      dark: {
        primary: '#A78BFA',
        secondary: '#8B5CF6',
        accent: '#C4B5FD',
        background: '#4C1D95',
        foreground: '#F5F3FF',
        card: '#2E1065',
        sidebar: '#2E1065',
      }
    }
  },
  {
    name: "Midnight Dreams",
    config: {
      light: {
        primary: '#6366F1',
        secondary: '#4F46E5',
        accent: '#818CF8',
        background: '#EEF2FF',
        foreground: '#1E1B4B',
        card: '#FFFFFF',
        sidebar: '#1E1B4B',
      },
      dark: {
        primary: '#818CF8',
        secondary: '#6366F1',
        accent: '#A5B4FC',
        background: '#1E1B4B',
        foreground: '#EEF2FF',
        card: '#1E1B4B',
        sidebar: '#0F0E24', // Slightly darker
      }
    }
  },
  {
    name: "Crimson Tide",
    config: {
      light: {
        primary: '#EF4444',
        secondary: '#DC2626',
        accent: '#FCA5A5',
        background: '#FEF2F2',
        foreground: '#7F1D1D',
        card: '#FFFFFF',
        sidebar: '#7F1D1D',
      },
      dark: {
        primary: '#F87171',
        secondary: '#EF4444',
        accent: '#FCA5A5',
        background: '#7F1D1D',
        foreground: '#FEF2F2',
        card: '#450A0A',
        sidebar: '#450A0A',
      }
    }
  },
  {
    name: "Corporate Slate",
    config: {
      light: {
        primary: '#64748B',
        secondary: '#475569',
        accent: '#94A3B8',
        background: '#F8FAFC',
        foreground: '#0F172A',
        card: '#FFFFFF',
        sidebar: '#0F172A',
      },
      dark: {
        primary: '#94A3B8',
        secondary: '#64748B',
        accent: '#CBD5E1',
        background: '#0F172A',
        foreground: '#F8FAFC',
        card: '#020617',
        sidebar: '#020617',
      }
    }
  },
  {
    name: "Cyberpunk",
    config: {
      light: {
        primary: '#D946EF', // Fuchsia
        secondary: '#8B5CF6', // Violet
        accent: '#06B6D4', // Cyan
        background: '#FDF4FF',
        foreground: '#2E1065',
        card: '#FFFFFF',
        sidebar: '#2E1065',
      },
      dark: {
        primary: '#E879F9',
        secondary: '#D946EF',
        accent: '#22D3EE',
        background: '#09090B', // Zinc 950
        foreground: '#FAFAFA',
        card: '#18181B', // Zinc 900
        sidebar: '#000000',
      }
    }
  },
  {
    name: "Lavender Mist",
    config: {
      light: {
        primary: '#D8B4FE',
        secondary: '#C084FC',
        accent: '#E9D5FF',
        background: '#FAF5FF',
        foreground: '#3B0764',
        card: '#FFFFFF',
        sidebar: '#3B0764',
      },
      dark: {
        primary: '#C084FC',
        secondary: '#A855F7',
        accent: '#D8B4FE',
        background: '#3B0764',
        foreground: '#FAF5FF',
        card: '#2E1065',
        sidebar: '#2E1065',
      }
    }
  }
];

// --- Component ---

export function ThemeCustomizer() {
  const { i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';
  const [theme, setTheme] = useState<ThemeConfig>(DEFAULT_THEME);
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("light");



  // Load saved theme on mount
  // Load saved theme on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('custom-theme-config-v2');
    if (savedTheme) {
      try {
        const parsed = JSON.parse(savedTheme);
        // Merge with default to ensure structure is correct
        const merged = {
          light: { ...DEFAULT_THEME.light, ...parsed.light },
          dark: { ...DEFAULT_THEME.dark, ...parsed.dark }
        };
        setTheme(merged);
        applyTheme(merged);
      } catch (e) {
        console.error("Failed to parse saved theme", e);
        applyTheme(DEFAULT_THEME);
      }
    } else {
      // Do not apply default theme if no saved theme exists, to allow ThemeContext to take precedence
      // applyTheme(DEFAULT_THEME); 
    }
  }, []);

  const applyTheme = (newTheme: ThemeConfig) => {
    const styleId = 'theme-customizer-styles';
    let styleEl = document.getElementById(styleId);
    
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }

    const generateCssVars = (colors: ThemeColors) => {
      const primaryHsl = hexToHSL(colors.primary);
      const secondaryHsl = hexToHSL(colors.secondary);
      const accentHsl = hexToHSL(colors.accent);
      const backgroundHsl = hexToHSL(colors.background);
      const foregroundHsl = hexToHSL(colors.foreground);
      const cardHsl = hexToHSL(colors.card);
      const sidebarHsl = hexToHSL(colors.sidebar);
      
      return `
        --primary: ${primaryHsl} !important;
        --secondary: ${secondaryHsl} !important;
        --accent: ${accentHsl} !important;
        --background: ${backgroundHsl} !important;
        --foreground: ${foregroundHsl} !important;
        --card: ${cardHsl} !important;
        --sidebar-background: ${sidebarHsl} !important;
        --ring: ${primaryHsl} !important;
        
        /* Derived Gradients */
        --gradient-primary: linear-gradient(135deg, hsl(${primaryHsl}) 0%, hsl(${secondaryHsl}) 100%) !important;
        --gradient-secondary: linear-gradient(135deg, hsl(${secondaryHsl}) 0%, hsl(0 84% 60%) 100%) !important;
        --gradient-accent: linear-gradient(135deg, hsl(${accentHsl}) 0%, hsl(${primaryHsl}) 100%) !important;
      `;
    };

    styleEl.textContent = `
      html {
        ${generateCssVars(newTheme.light)}
      }
      
      html.dark {
        ${generateCssVars(newTheme.dark)}
      }
    `;
  };

  const handleColorChange = (mode: 'light' | 'dark', key: keyof ThemeColors, value: string) => {
    const newTheme = {
      ...theme,
      [mode]: {
        ...theme[mode],
        [key]: value
      }
    };
    setTheme(newTheme);
    applyTheme(newTheme);
  };

  const handleTemplateSelect = (template: ThemeTemplate) => {
    setTheme(template.config);
    applyTheme(template.config);
    toast.success(`Applied ${template.name} theme!`);
  };

  const handleSave = () => {
    localStorage.setItem('custom-theme-config-v2', JSON.stringify(theme));
    toast.success("Theme saved successfully!");
    setIsOpen(false);
  };

  const handleReset = () => {
    setTheme(DEFAULT_THEME);
    applyTheme(DEFAULT_THEME);
    localStorage.removeItem('custom-theme-config-v2');
    
    // Remove the style element to revert to CSS file defaults
    const styleEl = document.getElementById('theme-customizer-styles');
    if (styleEl) {
      styleEl.remove();
    }
    
    toast.info("Theme reset to default.");
  };



  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button 
          variant="outline" 
          size="icon" 
          className={`fixed bottom-8 z-50 h-10 w-10 rounded-xl shadow-lg border-slate-500/50 bg-slate-800 hover:bg-slate-700 hover:border-primary transition-all duration-300 hover:scale-105 ${isArabic ? 'left-8' : 'right-8'}`}
        >
          <Paintbrush className="h-6 w-6 text-primary" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px] flex flex-col h-full p-0 gap-0">
        {/* Fixed Header */}
        <div className="p-6 pb-2 border-b">
          <SheetHeader>
            <SheetTitle>Theme Customizer</SheetTitle>
            <SheetDescription>
              Choose a preset theme or customize colors for Light and Dark modes.
            </SheetDescription>
          </SheetHeader>
        </div>
        
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="space-y-3">
            <Label className="text-base font-medium">Preset Themes</Label>
            <div className="grid grid-cols-2 gap-3">
              {PRESET_THEMES.map((t) => (
                <button
                  key={t.name}
                  onClick={() => handleTemplateSelect(t)}
                  className="group relative flex items-center gap-3 rounded-lg border p-2 hover:border-primary transition-all hover:bg-accent/5"
                >
                  <div className="flex shrink-0 -space-x-2">
                    <div className="h-6 w-6 rounded-full border shadow-sm z-30" style={{ backgroundColor: t.config.light.primary }} />
                    <div className="h-6 w-6 rounded-full border shadow-sm z-20" style={{ backgroundColor: t.config.light.secondary }} />
                    <div className="h-6 w-6 rounded-full border shadow-sm z-10" style={{ backgroundColor: t.config.light.background }} />
                  </div>
                  <span className="text-sm font-medium">{t.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or customize manually</span>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="light" className="flex items-center gap-2">
                <Sun className="h-4 w-4" /> Light Mode
              </TabsTrigger>
              <TabsTrigger value="dark" className="flex items-center gap-2">
                <Moon className="h-4 w-4" /> Dark Mode
              </TabsTrigger>
            </TabsList>
            
            {['light', 'dark'].map((mode) => (
              <TabsContent key={mode} value={mode} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Primary Color</Label>
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full border shadow-sm" style={{ backgroundColor: theme[mode as 'light'|'dark'].primary }} />
                    <Input 
                      type="color" 
                      value={theme[mode as 'light'|'dark'].primary} 
                      onChange={(e) => handleColorChange(mode as 'light'|'dark', 'primary', e.target.value)} 
                      className="h-10 w-full cursor-pointer"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Secondary Color</Label>
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full border shadow-sm" style={{ backgroundColor: theme[mode as 'light'|'dark'].secondary }} />
                    <Input 
                      type="color" 
                      value={theme[mode as 'light'|'dark'].secondary} 
                      onChange={(e) => handleColorChange(mode as 'light'|'dark', 'secondary', e.target.value)} 
                      className="h-10 w-full cursor-pointer"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Accent Color</Label>
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full border shadow-sm" style={{ backgroundColor: theme[mode as 'light'|'dark'].accent }} />
                    <Input 
                      type="color" 
                      value={theme[mode as 'light'|'dark'].accent} 
                      onChange={(e) => handleColorChange(mode as 'light'|'dark', 'accent', e.target.value)} 
                      className="h-10 w-full cursor-pointer"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Background Color</Label>
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full border shadow-sm" style={{ backgroundColor: theme[mode as 'light'|'dark'].background }} />
                    <Input 
                      type="color" 
                      value={theme[mode as 'light'|'dark'].background} 
                      onChange={(e) => handleColorChange(mode as 'light'|'dark', 'background', e.target.value)} 
                      className="h-10 w-full cursor-pointer"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Sidebar Background</Label>
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full border shadow-sm" style={{ backgroundColor: theme[mode as 'light'|'dark'].sidebar }} />
                    <Input 
                      type="color" 
                      value={theme[mode as 'light'|'dark'].sidebar} 
                      onChange={(e) => handleColorChange(mode as 'light'|'dark', 'sidebar', e.target.value)} 
                      className="h-10 w-full cursor-pointer"
                    />
                  </div>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>

        {/* Fixed Footer */}
        <div className="p-6 border-t bg-background/50 backdrop-blur-sm mt-auto">
          <div className="flex flex-col gap-3">
            <Button onClick={handleSave} className="w-full gap-2">
              <Check className="h-4 w-4" /> Save Changes
            </Button>
            <Button variant="outline" onClick={handleReset} className="w-full gap-2">
              <RotateCcw className="h-4 w-4" /> Reset to Default
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
