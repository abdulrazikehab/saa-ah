// Logo configuration with version for cache-busting
// Increment this version when you update the logo file
export const LOGO_VERSION = '11';

// Koun logo - shopping cart with gradient colors
// Features Arabic text "كون" both inside the cart and below it
export const DEFAULT_LOGO_PATH = '/branding/koun-logo.png';

// Brand name in both languages
export const BRAND_NAME_AR = 'كون';
export const BRAND_NAME_EN = 'Koun';
export const BRAND_TAGLINE_AR = 'عالم التجارة متعدد الأبعاد';
export const BRAND_TAGLINE_EN = 'Multidimensional Commerce World';

export const getLogoUrl = (): string => {
  return `${DEFAULT_LOGO_PATH}?v=${LOGO_VERSION}`;
};

// Logo with fallback
export const LogoWithFallback = {
  src: getLogoUrl(),
  alt: `${BRAND_NAME_EN} - ${BRAND_NAME_AR}`,
  fallbackIcon: 'ShoppingCart',
};
