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
 * Format amount with currency symbol
 */
export function formatCurrency(
  amount: number | string,
  currencyCode: string,
  options?: {
    showCode?: boolean;
    locale?: string;
  }
): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  const symbol = getCurrencySymbol(currencyCode);
  const formattedAmount = numAmount.toLocaleString(options?.locale || 'ar-SA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  if (options?.showCode) {
    return `${formattedAmount} ${symbol} (${currencyCode})`;
  }

  return `${formattedAmount} ${symbol}`;
}

/**
 * Format amount with currency code only (no symbol)
 */
export function formatCurrencyCode(
  amount: number | string,
  currencyCode: string
): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  const formattedAmount = numAmount.toLocaleString('ar-SA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return `${formattedAmount} ${currencyCode}`;
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

