import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { themeService } from '@/services/theme.service';

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
        // Check for theme preview parameter
        const searchParams = new URLSearchParams(window.location.search);
        const themePreviewId = searchParams.get('theme_preview');
        
        if (themePreviewId) {
          // Load specific theme for preview
          console.log('🎨 Loading theme preview:', themePreviewId);
          const themes = await themeService.getThemes();
          const previewTheme = themes.find((t: Theme) => t.id === themePreviewId);
          
          if (previewTheme) {
            console.log('✅ Preview theme found:', previewTheme.name);
            applyTheme(previewTheme);
          } else {
            console.warn('⚠️ Preview theme not found, loading active theme');
            const activeTheme = themes.find((t: Theme) => t.isActive);
            if (activeTheme) {
              applyTheme(activeTheme);
            }
          }
        } else {
          // Load active theme normally
          const themes = await themeService.getThemes();
          const activeTheme = themes.find((t: Theme) => t.isActive);
          
          if (activeTheme) {
            console.log('✅ Active theme loaded:', activeTheme.name);
            applyTheme(activeTheme);
          } else {
            console.log('ℹ️ No active theme found, using defaults');
          }
        }
      } catch (error) {
        console.error('❌ Failed to load theme:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTheme();
  }, [applyTheme]);

  return (
    <ThemeContext.Provider value={{ currentTheme, loading, applyTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
