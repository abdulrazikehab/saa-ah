/**
 * Currency utility functions for formatting and displaying currencies
 */

export interface Currency {
  code: string;
  name: string;
  nameAr?: string;
  symbol: string;
  isActive: boolean;
}

/**
 * Get currency symbol for a currency code
 */
export function getCurrencySymbol(currencyCode: string): string {
  const symbols: Record<string, string> = {
    SAR: 'ر.س',
    AED: 'د.إ',
    USD: '$',
    EUR: '€',
    GBP: '£',
    JPY: '¥',
    KWD: 'د.ك',
    BHD: '.د.ب',
    OMR: 'ر.ع.',
    QAR: 'ر.ق',
    EGP: 'ج.م',
    JOD: 'د.أ',
    LBP: 'ل.ل',
    TND: 'د.ت',
    DZD: 'د.ج',
    MAD: 'د.م',
  };

  return symbols[currencyCode] || currencyCode;
}


/**
 * Convert English digits to Arabic digits if locale is 'ar'
 */
export function localizeNumber(num: number | string, locale?: string): string {
  const str = num.toString();
  const currentLocale = locale || localStorage.getItem('i18nextLng') || 'ar';
  
  // Check if Arabic
  if (currentLocale.startsWith('ar')) {
    const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    return str.replace(/\d/g, (d) => arabicDigits[parseInt(d)]);
  }
  
  return str;
}

/**
 * Format a number with locale support
 */
export function formatNumber(
  amount: number | string,
  options?: {
    locale?: string;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  }
): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numAmount)) return typeof amount === 'string' ? amount : '0';

  const currentLocale = options?.locale || localStorage.getItem('i18nextLng') || 'ar';
  
  // Use browser's native formatting first
  const formatted = numAmount.toLocaleString(currentLocale === 'en' ? 'en-US' : 'ar-SA', {
    useGrouping: true,
    minimumFractionDigits: options?.minimumFractionDigits,
    maximumFractionDigits: options?.maximumFractionDigits,
  });

  // Force Arabic digits if locale is Arabic but browser didn't produce them (some browsers use Western digits for ar-SA)
  // or if we want to ensure consistency.
  if (currentLocale.startsWith('ar')) {
    return localizeNumber(formatted, 'ar');
  }

  return formatted;
}

/**
 * Format amount with currency symbol
 */
export function formatCurrency(
  amount: number | string,
  currencyCode: string = 'SAR', // Default to SAR
  options?: {
    showCode?: boolean;
    locale?: string;
  }
): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  const currentLocale = options?.locale || localStorage.getItem('i18nextLng') || 'ar';
  const isArabic = currentLocale.startsWith('ar');

  if (isNaN(numAmount)) return formatNumber(0, options) + ' ' + (isArabic ? 'ر.س' : 'SAR');

  const config = getCurrencyIconConfig(currencyCode);
  let symbol = config?.symbol || currencyCode;
  
  // For Arabic locale, we might want the Arabic name of the currency if no specific symbol is found
  if (isArabic && config?.nameAr && !config.symbol.includes(config.nameAr)) {
    // If it's a code-like symbol (e.g. SAR), use the Arabic name instead (ر.س)
    // But CURRENCY_ICON_CONFIG already has the correct Arabic symbols for many.
    symbol = config.symbol;
  }

  // Use formatNumber for the value part
  const formattedValue = formatNumber(numAmount, {
    locale: currentLocale,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  if (options?.showCode) {
    return `${formattedValue} ${symbol} (${currencyCode})`;
  }

  // RTL handling: in Arabic, the symbol usually comes after the number
  return `${formattedValue} ${symbol}`;
}

/**
 * Format amount with currency code only (no symbol)
 */
export function formatCurrencyCode(
  amount: number | string,
  currencyCode: string
): string {
  const formattedValue = formatNumber(amount, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  return `${formattedValue} ${currencyCode}`;
}

/**
 * Get default currency from site config
 * This should be called after site config is loaded
 */
export async function getDefaultCurrency(): Promise<string> {
  try {
    // Try to get from localStorage first (cached)
    const cached = localStorage.getItem('defaultCurrency');
    if (cached) {
      return cached;
    }

    // Fetch from API
    // Note: This relies on global fetch which might need auth headers if site-config is protected
    // It's better to rely on what's passed to the component or context
    const response = await fetch('/api/site-config');
    if (response.ok) {
      const data = await response.json();
      const currency = data?.settings?.currency || 'SAR';
      localStorage.setItem('defaultCurrency', currency);
      return currency;
    }
  } catch (error) {
    console.error('Error fetching default currency:', error);
  }

  return 'SAR'; // Default fallback
}

/**
 * Format amount using default currency
 */
export async function formatDefaultCurrency(amount: number | string): Promise<string> {
  const currency = await getDefaultCurrency();
  return formatCurrency(amount, currency);
}

/**
 * Get currency flag/logo URL based on currency code
 * Maps currency codes to country codes for flag display
 */
export function getCurrencyFlagUrl(currencyCode: string): string {
  // Map currency codes to country codes for flags
  const currencyToCountry: Record<string, string> = {
    SAR: 'sa', // Saudi Arabia
    AED: 'ae', // UAE
    USD: 'us', // United States
    EUR: 'eu', // European Union
    GBP: 'gb', // United Kingdom
    JPY: 'jp', // Japan
    KWD: 'kw', // Kuwait
    BHD: 'bh', // Bahrain
    OMR: 'om', // Oman
    QAR: 'qa', // Qatar
    EGP: 'eg', // Egypt
    JOD: 'jo', // Jordan
    LBP: 'lb', // Lebanon
    TND: 'tn', // Tunisia
    DZD: 'dz', // Algeria
    MAD: 'ma', // Morocco
    CAD: 'ca', // Canada
    AUD: 'au', // Australia
    CHF: 'ch', // Switzerland
    CNY: 'cn', // China
    INR: 'in', // India
    TRY: 'tr', // Turkey
    RUB: 'ru', // Russia
    ZAR: 'za', // South Africa
    BRL: 'br', // Brazil
    MXN: 'mx', // Mexico
    SGD: 'sg', // Singapore
    HKD: 'hk', // Hong Kong
    NZD: 'nz', // New Zealand
    SEK: 'se', // Sweden
    NOK: 'no', // Norway
    DKK: 'dk', // Denmark
    PLN: 'pl', // Poland
  };

  const countryCode = currencyToCountry[currencyCode.toUpperCase()] || 'xx';
  
  // Using flagcdn.com for flag images (free, no API key needed)
  return `https://flagcdn.com/w20/${countryCode}.png`;
}

import { getCurrencyIconConfig, getAvailableCurrencyCodes, CURRENCY_ICON_CONFIG, type CurrencyIconConfig, type CurrencyIconType } from './currency-icon-config';

/**
 * Get currency icon URL or data based on configuration
 * Returns SVG path for SVG-based currencies, or null for Unicode-based
 */
export function getCurrencyIconUrl(currencyCode: string): string | null {
  const config = getCurrencyIconConfig(currencyCode);
  
  if (!config) {
    return null;
  }
  
  if (config.type === 'svg') {
    return config.value; // Return SVG path
  }
  
  // Unicode-based currencies don't need a URL
  return null;
}

/**
 * Get currency icon configuration
 */
export function getCurrencyIconData(currencyCode: string): CurrencyIconConfig | null {
  return getCurrencyIconConfig(currencyCode);
}

/**
 * Check if currency uses SVG icon
 */
export function isCurrencySvgIcon(currencyCode: string): boolean {
  const config = getCurrencyIconConfig(currencyCode);
  return config?.type === 'svg';
}

/**
 * Check if currency uses Unicode symbol
 */
export function isCurrencyUnicodeIcon(currencyCode: string): boolean {
  const config = getCurrencyIconConfig(currencyCode);
  return config?.type === 'unicode';
}

/**
 * List of all major currencies with their details for icon picker
 * Uses currency icon configuration
 */
export const CURRENCY_ICONS = Object.entries(CURRENCY_ICON_CONFIG).map(([code, config]) => ({
  code,
  name: config.name,
  nameAr: config.nameAr,
  symbol: config.symbol,
}));

