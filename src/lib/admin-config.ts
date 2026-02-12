// SECURITY: This key is stored in memory only and cleared on refresh/logout
// It allows sub-components to access the key authenticated by the parent panel
let cachedAdminApiKey = '';

/**
 * Synchronously get the admin API key from memory cache
 */
export const getAdminApiKeySync = (): string => {
  return cachedAdminApiKey;
};

/**
 * @deprecated alias for getAdminApiKeySync
 */
export const getAdminApiKey = getAdminApiKeySync;

/**
 * Async wrapper for compatibility
 */
export const getAdminApiKeyAsync = async (): Promise<string> => {
  return cachedAdminApiKey;
};

/**
 * Initialize - checks for env var first
 */
export const initializeAdminApiKey = async () => {
  const envKey = import.meta.env.VITE_ADMIN_API_KEY;
  if (envKey) {
    cachedAdminApiKey = envKey;
  }
};

/**
 * Clear the cached key (on logout)
 */
export const clearAdminApiKeyCache = () => {
  cachedAdminApiKey = '';
  // Also clear session storage for consistency
  sessionStorage.removeItem('systemAdminKey');
};

/**
 * Set the cached key (on login)
 */
export const setAdminApiKeyCache = (apiKey: string) => {
  if (apiKey) {
    cachedAdminApiKey = apiKey;
    // We already sync to session storage in SystemAdminPanel, but this ensures global access
  }
};

