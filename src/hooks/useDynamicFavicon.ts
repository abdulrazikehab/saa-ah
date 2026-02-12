import { useEffect } from 'react';
import { coreApi } from '@/lib/api';
import { getLogoUrl, BRAND_NAME_AR, BRAND_TAGLINE_AR } from '@/config/logo.config';

/**
 * Hook to dynamically update the favicon based on site configuration
 */
export const useDynamicFavicon = () => {
  useEffect(() => {
    const updateFavicon = async () => {
      try {
        const config = await coreApi.get('/site-config', { requireAuth: false });
        const favicon = document.getElementById('favicon') as HTMLLinkElement;
        
        if (config?.settings?.storeLogoUrl) {
          if (favicon) {
            favicon.href = config.settings.storeLogoUrl;
          }
          
          // Also update the document title if tenant name is available
          const title = config?.settings?.storeName || config?.settings?.tenantName;
          if (title) {
            document.title = title;
          }
        } else {
          // Default Koun branding
          if (favicon) {
            favicon.href = getLogoUrl();
          }
          // document.title = `${BRAND_NAME_AR} - Koun | ${BRAND_TAGLINE_AR}`;
        }
      } catch (error) {
        console.error('Failed to update favicon:', error);
      }
    };

    updateFavicon();
  }, []);
};
