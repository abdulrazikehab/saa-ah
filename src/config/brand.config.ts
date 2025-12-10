// Saa'ah Brand Configuration
// Based on official brand guidelines

export const brandConfig = {
  // Brand Name
  name: {
    en: "Saa'ah",
    ar: "سِعَة"
  },

  // Brand Colors
  colors: {
    primary: {
      deepSlateBlue: '#1E293B',
      electricCyan: '#06B6D4',
      lightGray: '#F1F5F9'
    },
    // Extended palette for UI
    slate: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a'
    },
    cyan: {
      50: '#ecfeff',
      100: '#cffafe',
      200: '#a5f3fc',
      300: '#67e8f9',
      400: '#22d3ee',
      500: '#06b6d4',
      600: '#0891b2',
      700: '#0e7490',
      800: '#155e75',
      900: '#164e63'
    }
  },

  // Typography
  typography: {
    fontFamily: {
      primary: 'Inter, sans-serif',
      arabic: 'Cairo, sans-serif'
    },
    weights: {
      light: 300,
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700
    }
  },

  // Logo Paths
  logo: {
    full: '/branding/saaah-logo-full.png',
    icon: '/branding/saaah-icon.png',
    horizontal: '/branding/saaah-horizontal.png',
    white: '/branding/saaah-logo-white.png'
  },

  // Tagline
  tagline: {
    en: 'Your E-Commerce Platform',
    ar: 'منصتك للتجارة الإلكترونية'
  },

  // Social Media
  social: {
    twitter: '@saaah',
    instagram: '@saaah',
    linkedin: 'saaah',
    facebook: 'saaah'
  },

  // Contact
  contact: {
    email: 'info@saa-ah.com',
    phone: '+966 XX XXX XXXX',
    website: 'https://saa-ah.com'
  }
};

export default brandConfig;
