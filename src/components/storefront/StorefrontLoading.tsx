import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { coreApi } from '@/lib/api';
import { getLogoUrl, BRAND_NAME_AR } from '@/config/logo.config';
import { isMainDomain } from '@/lib/domain';

export const StorefrontLoading = () => {
  const [storeLogo, setStoreLogo] = useState<string | null>(null);
  const [storeName, setStoreName] = useState<string>('');
  const isMain = isMainDomain();

  useEffect(() => {
    const loadConfig = async () => {
      // If we're on the main domain, we don't need to fetch store-specific config
      if (isMain) return;
      
      try {
        // Try to get site config to show the correct logo during initial load
        const config = await coreApi.get('/site-config', { requireAuth: false });
        if (config?.settings?.storeLogoUrl) {
          setStoreLogo(config.settings.storeLogoUrl);
        }
        if (config?.settings?.storeName) {
          setStoreName(config.settings.storeName);
        }
      } catch (error) {
        // Silently fail, we'll use the default logo
        console.warn('Loading screen: Could not fetch store logo, using default.');
      }
    };
    loadConfig();
  }, [isMain]);

  const logoUrl = storeLogo || getLogoUrl();
  const name = storeName || BRAND_NAME_AR;

  return (
    <div className="fixed inset-0 z-[9999] bg-background flex items-center justify-center">
      <div className="text-center space-y-8 animate-fade-in">
        {/* Animated Loading Logo */}
        <div className="relative">
          <div className="absolute inset-0 rounded-full gradient-primary blur-3xl opacity-30 animate-pulse" />
          <div className="relative w-28 h-28 mx-auto rounded-2xl overflow-hidden bg-card border border-border shadow-2xl animate-float flex items-center justify-center">
            <img 
              src={logoUrl} 
              alt={name} 
              className="max-w-[80%] max-h-[80%] object-contain p-2" 
            />
          </div>
        </div>
        
        {/* Loading Spinner & Text */}
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <span className="text-lg font-medium text-foreground">
              {isMain ? 'جاري التحميل...' : 'جاري تحميل المتجر...'}
            </span>
          </div>
          
          {/* Animated Dots */}
          <div className="flex justify-center gap-2">
            {[0, 1, 2].map((i) => (
              <div 
                key={i} 
                className="w-2 h-2 rounded-full bg-primary animate-bounce"
                style={{ animationDelay: `${i * 150}ms` }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
