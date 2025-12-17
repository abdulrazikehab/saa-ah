// Admin API Key configuration
// Fetches from backend database (set via System Admin Panel)
let cachedApiKey: string | null = null;
let cacheExpiry: number = 0;
let fetchPromise: Promise<string> | null = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache

// Initialize cache on module load
const fallbackKey = import.meta.env.VITE_ADMIN_API_KEY || 'Saeaa2025Admin!';
cachedApiKey = fallbackKey;
cacheExpiry = Date.now() + CACHE_TTL;

// Async version - fetches from backend if cache expired
const getAdminApiKeyAsync = async (): Promise<string> => {
  const now = Date.now();
  
  // Return cached key if still valid
  if (cachedApiKey && now < cacheExpiry) {
    return cachedApiKey;
  }

  // If already fetching, return the same promise
  if (fetchPromise) {
    return fetchPromise;
  }

  // Start fetching
  fetchPromise = (async () => {
    try {
      // Fetch from backend - use cached/fallback API key for the request
      const currentKey = cachedApiKey || fallbackKey;
      
      const response = await fetch(`${import.meta.env.VITE_CORE_API_URL}/api/admin/master/admin-api-key`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-API-Key': currentKey,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.apiKey) {
          cachedApiKey = data.apiKey;
          cacheExpiry = now + CACHE_TTL;
          return cachedApiKey;
        }
      }
    } catch (error) {
      console.warn('Failed to fetch admin API key from backend, using cached/fallback:', error);
    }

    // Fallback to cached or environment variable
    const key = cachedApiKey || fallbackKey;
    cachedApiKey = key;
    cacheExpiry = now + CACHE_TTL;
    return key;
  })();

  const result = await fetchPromise;
  fetchPromise = null;
  return result;
};

// Synchronous version for backward compatibility (uses cached value or fallback)
// This is the main function used throughout the app - it uses cached value
export const getAdminApiKeySync = (): string => {
  return cachedApiKey || fallbackKey;
};

// Export sync version as default for backward compatibility
export const getAdminApiKey = getAdminApiKeySync;

// Initialize cache on app startup (call this in SystemAdminPanel)
export const initializeAdminApiKey = async () => {
  try {
    await getAdminApiKeyAsync();
  } catch (error) {
    console.warn('Failed to initialize admin API key:', error);
  }
};

// Clear cache (useful when API key is updated)
export const clearAdminApiKeyCache = () => {
  cachedApiKey = null;
  cacheExpiry = 0;
  fetchPromise = null;
};

