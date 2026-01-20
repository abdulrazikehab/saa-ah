import { createContext, useContext, useEffect, useState, ReactNode, Context } from 'react';
import { coreApi } from '@/lib/api';
import { SiteSettings } from '@/services/types';

interface StoreSettingsContextType {
  settings: SiteSettings | null;
  loading: boolean;
  refreshSettings: () => Promise<void>;
}

declare global {
  interface Window {
    __StoreSettingsContext?: Context<StoreSettingsContextType | undefined>;
  }
}

const StoreSettingsContext: Context<StoreSettingsContextType | undefined> = (typeof window !== 'undefined' && window.__StoreSettingsContext) 
  ? window.__StoreSettingsContext 
  : createContext<StoreSettingsContextType | undefined>(undefined);

if (typeof window !== 'undefined') {
  window.__StoreSettingsContext = StoreSettingsContext;
}

export const useStoreSettings = () => {
  const context = useContext(StoreSettingsContext);
  if (!context) {
    throw new Error('useStoreSettings must be used within StoreSettingsProvider');
  }
  return context;
};

interface StoreSettingsProviderProps {
  children: ReactNode;
}

export const StoreSettingsProvider = ({ children }: StoreSettingsProviderProps) => {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await coreApi.get('/site-config');
      const settingsData = response?.settings || response || {};
      setSettings(settingsData as SiteSettings);
    } catch (error) {
      console.error('Failed to load store settings:', error);
      // Set default settings on error
      setSettings({
        currency: 'SAR',
        language: 'ar',
        taxEnabled: true,
        taxRate: 15,
        shippingEnabled: true,
        inventoryTracking: true,
        allowGuestCheckout: true,
        maintenanceMode: false,
        storeType: 'GENERAL',
        paymentMethods: [],
      } as SiteSettings);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  return (
    <StoreSettingsContext.Provider value={{ settings, loading, refreshSettings: loadSettings }}>
      {children}
    </StoreSettingsContext.Provider>
  );
};
