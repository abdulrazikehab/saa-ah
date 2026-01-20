// SECURITY FIX: Admin API keys should NEVER be exposed to frontend
// All admin operations must use JWT authentication server-side
// This file is kept for backward compatibility but returns empty string

// SECURITY FIX: Removed all client-side admin key handling
// Admin API keys are now handled server-side only via JWT authentication

/**
 * @deprecated Admin API keys should not be used from frontend. Use JWT authentication instead.
 * This function returns empty string to prevent accidental use.
 */
export const getAdminApiKeySync = (): string => {
  console.warn('SECURITY: getAdminApiKeySync should not be used. Admin operations require JWT authentication.');
  return '';
};

/**
 * @deprecated Admin API keys should not be used from frontend. Use JWT authentication instead.
 */
export const getAdminApiKey = getAdminApiKeySync;

/**
 * @deprecated Admin API keys should not be used from frontend. Use JWT authentication instead.
 */
export const getAdminApiKeyAsync = async (): Promise<string> => {
  console.warn('SECURITY: getAdminApiKeyAsync should not be used. Admin operations require JWT authentication.');
  return '';
};

/**
 * @deprecated Admin API keys should not be used from frontend. Use JWT authentication instead.
 */
export const initializeAdminApiKey = async () => {
  console.warn('SECURITY: initializeAdminApiKey should not be used. Admin operations require JWT authentication.');
};

/**
 * @deprecated Admin API keys should not be used from frontend. Use JWT authentication instead.
 */
export const clearAdminApiKeyCache = () => {
  // No-op
};

/**
 * @deprecated Admin API keys should not be used from frontend. Use JWT authentication instead.
 */
export const setAdminApiKeyCache = (apiKey: string) => {
  console.warn('SECURITY: setAdminApiKeyCache should not be used. Admin operations require JWT authentication.');
};

