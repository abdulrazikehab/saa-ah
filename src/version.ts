export const APP_VERSION = '1.0.0';
export const BUILD_DATE = new Date().toISOString();
export const GIT_COMMIT = import.meta.env.VITE_GIT_COMMIT || 'dev';
export const GIT_BRANCH = import.meta.env.VITE_GIT_BRANCH || 'dev';
