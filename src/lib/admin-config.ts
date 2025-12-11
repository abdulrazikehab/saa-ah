// Admin API Key configuration
// This should be set in .env file as VITE_ADMIN_API_KEY
export const getAdminApiKey = (): string => {
  return import.meta.env.VITE_ADMIN_API_KEY || 'Saeaa2025Admin!';
};

