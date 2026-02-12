import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { themeService } from '@/services/theme.service';
import { coreApi } from '@/lib/api';

interface ThemeSettings {
  colors?: {
    primary?: string;
    secondary?: string;
    accent?: string;
    background?: string;
    surface?: string;
    text?: string;
    textSecondary?: string;
    border?: string;
    success?: string;
    warning?: string;
    error?: string;
    info?: string;
  };
  typography?: {
    fontFamily?: string;
    headingFamily?: string;
    fontSize?: Record<string, string>;
    fontWeight?: Record<string, string>;
  };
  spacing?: Record<string, string>;
  borderRadius?: Record<string, string>;
  shadows?: Record<string, string>;
}

interface Theme {
  id: string;
  name: string;
  version: string;
  description?: string;
  settings?: ThemeSettings;
  isActive: boolean;
}

interface ThemeContextType {
  currentTheme: Theme | null;
  loading: boolean;
  applyTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// eslint-disable-next-line react-refresh/only-export-components
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  const [currentTheme, setCurrentTheme] = useState<Theme | null>(null);
  const [loading, setLoading] = useState(true);

  const applyThemeStyles = useCallback((theme: Theme) => {
    if (!theme.settings) {
      console.log('⚠️ Theme has no settings, using defaults');
      return;
    }

    const settings = theme.settings;
    const root = document.documentElement;

    console.log('🎨 Applying theme:', theme.name);

    // Apply colors
    if (settings.colors) {
      Object.entries(settings.colors).forEach(([key, value]) => {
        if (value) {
          root.style.setProperty(`--theme-${key}`, value);
          console.log(`  ✓ --theme-${key}: ${value}`);
        }
      });
    }

    // Apply typography
    if (settings.typography) {
      if (settings.typography.fontFamily) {
        root.style.setProperty('--theme-font-family', settings.typography.fontFamily);
      }
      if (settings.typography.headingFamily) {
        root.style.setProperty('--theme-heading-family', settings.typography.headingFamily);
      }
      
      // Font sizes
      if (settings.typography.fontSize) {
        Object.entries(settings.typography.fontSize).forEach(([key, value]) => {
          if (value) {
            root.style.setProperty(`--theme-font-size-${key}`, value);
          }
        });
      }

      // Font weights
      if (settings.typography.fontWeight) {
        Object.entries(settings.typography.fontWeight).forEach(([key, value]) => {
          if (value) {
            root.style.setProperty(`--theme-font-weight-${key}`, value);
          }
        });
      }
    }

    // Apply spacing
    if (settings.spacing) {
      Object.entries(settings.spacing).forEach(([key, value]) => {
        if (value) {
          root.style.setProperty(`--theme-spacing-${key}`, value);
        }
      });
    }

    // Apply border radius
    if (settings.borderRadius) {
      Object.entries(settings.borderRadius).forEach(([key, value]) => {
        if (value) {
          root.style.setProperty(`--theme-radius-${key}`, value);
        }
      });
    }

    // Apply shadows
    if (settings.shadows) {
      Object.entries(settings.shadows).forEach(([key, value]) => {
        if (value) {
          root.style.setProperty(`--theme-shadow-${key}`, value);
        }
      });
    }

    console.log('✅ Theme applied successfully');
  }, []);

  const applyTheme = useCallback((theme: Theme) => {
    setCurrentTheme(theme);
    applyThemeStyles(theme);
  }, [applyThemeStyles]);

  useEffect(() => {
    const loadTheme = async () => {
      try {
        // 1. Load Custom Config (Colors/Fonts from AppBuilder/ThemeManager)
        let customConfig: Record<string, string> = {};
        
        // Check URL params first for live preview mode (highest priority)
        const searchParams = new URLSearchParams(window.location.search);
        const isLivePreview = searchParams.get('theme_preview') === 'live';
        const urlPrimaryColor = searchParams.get('primaryColor');
        const urlSecondaryColor = searchParams.get('secondaryColor');
        
        if (isLivePreview && (urlPrimaryColor || urlSecondaryColor)) {
            console.log('🎨 [ThemeContext] Live preview mode - applying URL colors:', { urlPrimaryColor, urlSecondaryColor });
            if (urlPrimaryColor) customConfig.primaryColor = urlPrimaryColor;
            if (urlSecondaryColor) customConfig.secondaryColor = urlSecondaryColor;
        } else {
            try {
                // 1a. Try to get from injected tenant.json (Capacitor/Native offline support)
                try {
                  const offlineRes = await fetch('/tenant.json');
                  if (offlineRes.ok) {
                    const offlineData = await offlineRes.json();
                    if (offlineData && offlineData.config) {
                      customConfig = { ...customConfig, ...offlineData.config };
                      console.log('🎨 [ThemeContext] Loaded config from offline tenant.json:', offlineData.config);
                    }
                  }
                } catch (e) {
                  // Ignore fetch errors
                }

                // 1b. Try to get from localStorage first for instant preview
                const local = localStorage.getItem('app_builder_config');
                if (local) {
                   const parsedLocal = JSON.parse(local);
                   customConfig = { ...customConfig, ...parsedLocal };
                   console.log('🎨 [ThemeContext] Loaded config from localStorage:', parsedLocal);
                }
                
                // 1c. Also fetch from API to be sure (async)
                console.log('🎨 [ThemeContext] Fetching config from API...');
                const res = await coreApi.get('/site-config/mobile', { requireAuth: false }).catch((err) => {
                    console.error('🎨 [ThemeContext] API fetch failed:', err);
                    return null;
                });
                
                if (res) {
                    const apiConfig = res.config || res;
                    if (apiConfig && typeof apiConfig === 'object' && Object.keys(apiConfig).length > 0) {
                        customConfig = { ...customConfig, ...apiConfig };
                        console.log('🎨 [ThemeContext] Loaded config from API:', apiConfig);
                    }
                }
            } catch (e) {
                console.error('Failed to load custom theme config', e);
            }
        }

        // 2. Load Active Theme (Base Styles)
        const themes = await themeService.getThemes();
        let activeTheme = themes.find((t: Theme) => t.isActive);
        
        // Check for theme ID preview override (reusing searchParams from above)
        const themePreviewId = searchParams.get('theme_preview');
        
        if (themePreviewId && themePreviewId !== 'live') {
             const previewTheme = themes.find((t: Theme) => t.id === themePreviewId);
             if (previewTheme) activeTheme = previewTheme;
        }

        if (activeTheme) {
            applyTheme(activeTheme);
        }
        
        // Helper to convert HEX to HSL for Tailwind
        const hexToHsl = (hex: string): string => {
            let c = hex.substring(1).split('');
            if (c.length === 3) {
                c = [c[0], c[0], c[1], c[1], c[2], c[2]];
            }
            const r = parseInt('0x' + c[0] + c[1]);
            const g = parseInt('0x' + c[2] + c[3]);
            const b = parseInt('0x' + c[4] + c[5]);

            const rNorm = r / 255;
            const gNorm = g / 255;
            const bNorm = b / 255;

            const max = Math.max(rNorm, gNorm, bNorm);
            const min = Math.min(rNorm, gNorm, bNorm);
            let h = 0, s = 0;
            const l = (max + min) / 2;

            if (max !== min) {
                const d = max - min;
                s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
                switch (max) {
                    case rNorm: h = (gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0); break;
                    case gNorm: h = (bNorm - rNorm) / d + 2; break;
                    case bNorm: h = (rNorm - gNorm) / d + 4; break;
                }
                h /= 6;
            }

            return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
        };

        // 3. Apply Overrides from Custom Config (Helper)
        const applyCustomConfig = (cfg: Record<string, string>) => {
            // Prevent applying global theme variables to Dashboard
            if (window.location.pathname.startsWith('/dashboard') && window.self === window.top) {
                console.log('🎨 [ThemeContext] Skipping theme apply - on Dashboard');
                return;
            }

            console.log('🎨 [ThemeContext] Applying saved theme config:', cfg);
            const root = document.documentElement;
            
            if (cfg.primaryColor) {
                root.style.setProperty('--theme-primary', cfg.primaryColor);
                root.style.setProperty('--primary', hexToHsl(cfg.primaryColor));
                root.style.setProperty('--ring', hexToHsl(cfg.primaryColor));
                console.log('🎨 [ThemeContext] Applied primary:', cfg.primaryColor, '→', hexToHsl(cfg.primaryColor));
            }
            if (cfg.secondaryColor) {
                root.style.setProperty('--theme-secondary', cfg.secondaryColor);
                root.style.setProperty('--secondary', hexToHsl(cfg.secondaryColor));
                console.log('🎨 [ThemeContext] Applied secondary:', cfg.secondaryColor, '→', hexToHsl(cfg.secondaryColor));
            }
            if (cfg.accentColor) {
                root.style.setProperty('--theme-accent', cfg.accentColor);
                root.style.setProperty('--accent', hexToHsl(cfg.accentColor));
                console.log('🎨 [ThemeContext] Applied accent:', cfg.accentColor, '→', hexToHsl(cfg.accentColor));
            }
            if (cfg.backgroundColor) {
                root.style.setProperty('--theme-background', cfg.backgroundColor);
                // Only override the global --background if not in dark mode 
                // to prevent breaking light/dark mode switching
                const isDarkMode = document.documentElement.classList.contains('dark');
                if (!isDarkMode) {
                  root.style.setProperty('--background', hexToHsl(cfg.backgroundColor));
                }
                console.log('🎨 [ThemeContext] Applied theme background:', cfg.backgroundColor);
            }
            if (cfg.fontFamily) {
                root.style.setProperty('--theme-font-family', cfg.fontFamily);
                root.style.setProperty('--font-sans', cfg.fontFamily);
            }
            if (cfg.cornerRadius) {
                root.style.setProperty('--radius', cfg.cornerRadius);
                root.style.setProperty('--theme-radius-base', cfg.cornerRadius);
            }
            // Animation settings
            if (cfg.animationStyle) {
                const animationDurations: Record<string, string> = {
                    none: '0ms',
                    subtle: '150ms',
                    smooth: '300ms',
                    dynamic: '500ms',
                };
                root.style.setProperty('--animation-duration', animationDurations[cfg.animationStyle] || '300ms');
                root.setAttribute('data-animation', cfg.animationStyle);
            }
            // Card and header styles as data attributes
            if (cfg.cardStyle) {
                root.setAttribute('data-card-style', cfg.cardStyle);
            }
            if (cfg.headerStyle) {
                root.setAttribute('data-header-style', cfg.headerStyle);
            }
        };

        if (customConfig) {
            applyCustomConfig(customConfig);
        }
        
      } catch (error) {
        console.error('❌ Failed to load theme:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTheme();
    
    // Listen for storage events (same-origin)
    const handleStorage = () => {
        loadTheme();
    };
    window.addEventListener('storage', handleStorage);

    // Listen for postMessage events (cross-origin live preview)
    const handleMessage = (event: MessageEvent) => {
        if (event.data?.type === 'THEME_UPDATE' && event.data.config) {
             // Prevent applying global theme variables to Dashboard
             if (window.location.pathname.startsWith('/dashboard') && window.self === window.top) {
                 return;
             }

             // Re-apply styles
             const cfg = event.data.config;
             // Reuse applyCustomConfig logic manually since we can't easily access the valid one from scope
             // Or better: define hexToHsl inside effect to reuse? 
             // Just duplicating for safety and speed. 
             // We can use the same hexToHsl logic here.
             
            const hexToHsl = (hex: string): string => {
                let c = hex.substring(1).split('');
                if (c.length === 3) {
                    c = [c[0], c[0], c[1], c[1], c[2], c[2]];
                }
                const r = parseInt('0x' + c[0] + c[1]);
                const g = parseInt('0x' + c[2] + c[3]);
                const b = parseInt('0x' + c[4] + c[5]);

                const rNorm = r / 255;
                const gNorm = g / 255;
                const bNorm = b / 255;

                const max = Math.max(rNorm, gNorm, bNorm);
                const min = Math.min(rNorm, gNorm, bNorm);
                let h = 0, s = 0;
                const l = (max + min) / 2;

                if (max !== min) {
                    const d = max - min;
                    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
                    switch (max) {
                        case rNorm: h = (gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0); break;
                        case gNorm: h = (bNorm - rNorm) / d + 2; break;
                        case bNorm: h = (rNorm - gNorm) / d + 4; break;
                    }
                    h /= 6;
                }

                return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
            };

             const root = document.documentElement;
             console.log('🎨 [ThemeContext] Received THEME_UPDATE message:', cfg);
            if (cfg.primaryColor) {
                console.log('🎨 [ThemeContext] Setting --theme-primary to:', cfg.primaryColor);
                root.style.setProperty('--theme-primary', cfg.primaryColor);
                root.style.setProperty('--primary', hexToHsl(cfg.primaryColor));
            }
            if (cfg.secondaryColor) {
                root.style.setProperty('--theme-secondary', cfg.secondaryColor);
                root.style.setProperty('--secondary', hexToHsl(cfg.secondaryColor));
            }
            if (cfg.backgroundColor) {
                root.style.setProperty('--theme-background', cfg.backgroundColor);
                const isDarkMode = document.documentElement.classList.contains('dark');
                if (!isDarkMode) {
                   root.style.setProperty('--background', hexToHsl(cfg.backgroundColor));
                }
            }
            if (cfg.fontFamily) {
                root.style.setProperty('--theme-font-family', cfg.fontFamily);
                root.style.setProperty('--font-sans', cfg.fontFamily);
            }
            if (cfg.cornerRadius) {
                root.style.setProperty('--radius', cfg.cornerRadius);
                root.style.setProperty('--theme-radius-base', cfg.cornerRadius);
            }
        }
    };
    window.addEventListener('message', handleMessage);
    console.log('🎧 [ThemeContext] Message listener registered for THEME_UPDATE');

    return () => {
        window.removeEventListener('storage', handleStorage);
        window.removeEventListener('message', handleMessage);
    };
  }, [applyTheme]);

  return (
    <ThemeContext.Provider value={{ currentTheme, loading, applyTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
