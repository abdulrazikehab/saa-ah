import { useEffect } from 'react';
import { coreApi } from '@/lib/api';

/**
 * Hook to dynamically update the favicon based on site configuration
 */
export const useDynamicFavicon = () => {
  useEffect(() => {
    const updateFavicon = async () => {
      try {
        const config = await coreApi.get('/site-config', { requireAuth: false });
        if (config?.settings?.storeLogoUrl) {
          const favicon = document.getElementById('favicon') as HTMLLinkElement;
          if (favicon) {
            favicon.href = config.settings.storeLogoUrl;
          }
          
          // Also update the document title if tenant name is available
          const title = config?.settings?.storeName || config?.settings?.tenantName;
          if (title) {
            document.title = title;
          }
        }
      } catch (error) {
        console.error('Failed to update favicon:', error);
      }
    };

    updateFavicon();
  }, []);
};
