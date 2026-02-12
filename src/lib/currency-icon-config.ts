/**
 * Currency Icon Configuration
 * 
 * Defines how each currency icon should be rendered:
 * - "unicode": Use Unicode text symbol
 * - "svg": Use SVG/image asset (for official logos like SAR)
 */

export type CurrencyIconType = 'unicode' | 'svg';

export interface CurrencyIconConfig {
  type: CurrencyIconType;
  value: string; // Unicode character or SVG path
  name: string;
  nameAr?: string;
  symbol: string; // Display symbol for formatting
}

/**
 * Currency icon configuration
 * Currencies with official logos (like SAR) use SVG
 * Others use Unicode symbols
 */
export const CURRENCY_ICON_CONFIG: Record<string, CurrencyIconConfig> = {
  // Unicode-based currencies
  USD: {
    type: 'unicode',
    value: '$',
    name: 'US Dollar',
    nameAr: 'دولار أمريكي',
    symbol: '$',
  },
  EUR: {
    type: 'unicode',
    value: '€',
    name: 'Euro',
    nameAr: 'يورو',
    symbol: '€',
  },
  GBP: {
    type: 'unicode',
    value: '£',
    name: 'British Pound',
    nameAr: 'جنيه إسترليني',
    symbol: '£',
  },
  JPY: {
    type: 'unicode',
    value: '¥',
    name: 'Japanese Yen',
    nameAr: 'ين ياباني',
    symbol: '¥',
  },
  CNY: {
    type: 'unicode',
    value: '¥',
    name: 'Chinese Yuan',
    nameAr: 'يوان صيني',
    symbol: '¥',
  },
  INR: {
    type: 'unicode',
    value: '₹',
    name: 'Indian Rupee',
    nameAr: 'روبية هندية',
    symbol: '₹',
  },
  TRY: {
    type: 'unicode',
    value: '₺',
    name: 'Turkish Lira',
    nameAr: 'ليرة تركية',
    symbol: '₺',
  },
  RUB: {
    type: 'unicode',
    value: '₽',
    name: 'Russian Ruble',
    nameAr: 'روبل روسي',
    symbol: '₽',
  },
  BRL: {
    type: 'unicode',
    value: 'R$',
    name: 'Brazilian Real',
    nameAr: 'ريال برازيلي',
    symbol: 'R$',
  },
  CAD: {
    type: 'unicode',
    value: 'C$',
    name: 'Canadian Dollar',
    nameAr: 'دولار كندي',
    symbol: 'C$',
  },
  AUD: {
    type: 'unicode',
    value: 'A$',
    name: 'Australian Dollar',
    nameAr: 'دولار أسترالي',
    symbol: 'A$',
  },
  NZD: {
    type: 'unicode',
    value: 'NZ$',
    name: 'New Zealand Dollar',
    nameAr: 'دولار نيوزيلندي',
    symbol: 'NZ$',
  },
  SGD: {
    type: 'unicode',
    value: 'S$',
    name: 'Singapore Dollar',
    nameAr: 'دولار سنغافوري',
    symbol: 'S$',
  },
  HKD: {
    type: 'unicode',
    value: 'HK$',
    name: 'Hong Kong Dollar',
    nameAr: 'دولار هونغ كونغ',
    symbol: 'HK$',
  },
  MXN: {
    type: 'unicode',
    value: '$',
    name: 'Mexican Peso',
    nameAr: 'بيزو مكسيكي',
    symbol: '$',
  },
  ZAR: {
    type: 'unicode',
    value: 'R',
    name: 'South African Rand',
    nameAr: 'راند جنوب أفريقي',
    symbol: 'R',
  },
  SEK: {
    type: 'unicode',
    value: 'kr',
    name: 'Swedish Krona',
    nameAr: 'كرونا سويدية',
    symbol: 'kr',
  },
  NOK: {
    type: 'unicode',
    value: 'kr',
    name: 'Norwegian Krone',
    nameAr: 'كرونة نرويجية',
    symbol: 'kr',
  },
  DKK: {
    type: 'unicode',
    value: 'kr',
    name: 'Danish Krone',
    nameAr: 'كرونة دنماركية',
    symbol: 'kr',
  },
  PLN: {
    type: 'unicode',
    value: 'zł',
    name: 'Polish Zloty',
    nameAr: 'زلوتي بولندي',
    symbol: 'zł',
  },
  CHF: {
    type: 'unicode',
    value: 'CHF',
    name: 'Swiss Franc',
    nameAr: 'فرنك سويسري',
    symbol: 'CHF',
  },

  // SVG-based currencies (official logos)
  SAR: {
    type: 'svg',
    value: '/assets/currencies/sar.svg',
    name: 'Saudi Riyal',
    nameAr: 'ريال سعودي',
    symbol: 'ر.س',
  },

  // Arabic currencies with Unicode symbols
  AED: {
    type: 'unicode',
    value: 'د.إ',
    name: 'UAE Dirham',
    nameAr: 'درهم إماراتي',
    symbol: 'د.إ',
  },
  KWD: {
    type: 'unicode',
    value: 'د.ك',
    name: 'Kuwaiti Dinar',
    nameAr: 'دينار كويتي',
    symbol: 'د.ك',
  },
  BHD: {
    type: 'unicode',
    value: '.د.ب',
    name: 'Bahraini Dinar',
    nameAr: 'دينار بحريني',
    symbol: '.د.ب',
  },
  OMR: {
    type: 'unicode',
    value: 'ر.ع.',
    name: 'Omani Rial',
    nameAr: 'ريال عماني',
    symbol: 'ر.ع.',
  },
  QAR: {
    type: 'unicode',
    value: 'ر.ق',
    name: 'Qatari Riyal',
    nameAr: 'ريال قطري',
    symbol: 'ر.ق',
  },
  EGP: {
    type: 'unicode',
    value: 'ج.م',
    name: 'Egyptian Pound',
    nameAr: 'جنيه مصري',
    symbol: 'ج.م',
  },
  JOD: {
    type: 'unicode',
    value: 'د.أ',
    name: 'Jordanian Dinar',
    nameAr: 'دينار أردني',
    symbol: 'د.أ',
  },
  LBP: {
    type: 'unicode',
    value: 'ل.ل',
    name: 'Lebanese Pound',
    nameAr: 'ليرة لبنانية',
    symbol: 'ل.ل',
  },
  TND: {
    type: 'unicode',
    value: 'د.ت',
    name: 'Tunisian Dinar',
    nameAr: 'دينار تونسي',
    symbol: 'د.ت',
  },
  DZD: {
    type: 'unicode',
    value: 'د.ج',
    name: 'Algerian Dinar',
    nameAr: 'دينار جزائري',
    symbol: 'د.ج',
  },
  MAD: {
    type: 'unicode',
    value: 'د.م',
    name: 'Moroccan Dirham',
    nameAr: 'درهم مغربي',
    symbol: 'د.م',
  },
};

/**
 * Get currency icon configuration
 */
export function getCurrencyIconConfig(currencyCode: string): CurrencyIconConfig | null {
  const code = currencyCode.toUpperCase();
  return CURRENCY_ICON_CONFIG[code] || null;
}

/**
 * Get all available currency codes
 */
export function getAvailableCurrencyCodes(): string[] {
  return Object.keys(CURRENCY_ICON_CONFIG);
}

