// Logo configuration with version for cache-busting
// Increment this version when you update the logo file
export const LOGO_VERSION = '5';

// Saeaa shopping cart gaming logo - the colorful cart with controller, dice, phone
export const DEFAULT_LOGO_PATH = '/branding/saeaa-logo.png';

// Brand name in both languages
export const BRAND_NAME_AR = 'سعة';
export const BRAND_NAME_EN = 'Saeaa';
export const BRAND_TAGLINE_AR = 'منصة أسواقك الرقمية';
export const BRAND_TAGLINE_EN = 'Your Digital Markets Platform';

export const getLogoUrl = (): string => {
  return `${DEFAULT_LOGO_PATH}?v=${LOGO_VERSION}`;
};

// Logo with fallback
export const LogoWithFallback = {
  src: getLogoUrl(),
  alt: `${BRAND_NAME_EN} - ${BRAND_NAME_AR}`,
  fallbackIcon: 'ShoppingCart',
};
