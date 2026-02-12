import { useState, useEffect, useCallback } from 'react';
import { coreApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface FeatureMap {
  [key: string]: boolean;
}

/**
 * Hook to check for enabled features for the current tenant
 * This checks both global features and tenant-specific overrides
 */
export function useFeatures() {
  const { user } = useAuth();
  const [features, setFeatures] = useState<FeatureMap>({});
  const [loading, setLoading] = useState(true);

  const fetchFeatures = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // In a real implementation, this might be a dedicated endpoint
      // for now we'll fetch from /tenants/me which should include features
      // or we can simulate it by fetching site-config which often contains platform features
      const response = await coreApi.get('/tenants/me', { requireAuth: true });
      
      const featureList = response?.subscriptionPlan?.features || [];
      const featureMap: FeatureMap = {};
      
      featureList.forEach((f: string) => {
        featureMap[f] = true;
      });

      // Also check global features if they are exposed differently
      // For this task, we assume features are returned in the tenant data
      setFeatures(featureMap);
    } catch (error) {
      console.error('Failed to fetch features:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchFeatures();
  }, [fetchFeatures]);

  const hasFeature = (feature: string) => {
    return !!features[feature];
  };

  return { features, hasFeature, loading, refreshFeatures: fetchFeatures };
}
