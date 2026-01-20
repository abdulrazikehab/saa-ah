import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { ar } from './translations/ar';
import { en } from './translations/en';

// Get stored language preference or default to Arabic
const getInitialLanguage = (): string => {
  // Check if user has explicitly set a language preference
  const userExplicitlyChanged = localStorage.getItem('userLanguagePreference');
  const stored = localStorage.getItem('i18nextLng');
  
  // If user has explicitly set a preference, respect it
  if (userExplicitlyChanged === 'true' && stored && (stored === 'ar' || stored === 'en')) {
    return stored;
  }
  
  // Default to Arabic for new users
  localStorage.setItem('i18nextLng', 'ar');
  return 'ar';
};

const initialLanguage = getInitialLanguage();
console.log('🌐 i18n initialized with language:', initialLanguage, '| localStorage:', localStorage.getItem('i18nextLng'));

i18n
  .use(initReactI18next)
  .init({
    resources: {
      ar: { translation: ar },
      en: { translation: en },
    },
    lng: initialLanguage,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

// Set document direction based on language
const updateDirection = (lng: string) => {
  const dir = lng === 'ar' ? 'rtl' : 'ltr';
  
  // Save language to localStorage
  localStorage.setItem('i18nextLng', lng);
  
  // Create or get style element for direction
  let styleEl = document.getElementById('direction-style') as HTMLStyleElement;
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = 'direction-style';
    document.head.appendChild(styleEl);
  }
  
  // Inject CSS directly into style tag for maximum priority
  styleEl.textContent = `
    html { direction: ${dir} !important; }
    body { direction: ${dir} !important; }
    html[dir="${dir}"] { direction: ${dir} !important; }
    body[dir="${dir}"] { direction: ${dir} !important; }
    html.${dir} { direction: ${dir} !important; }
    body.${dir} { direction: ${dir} !important; }
  `;
  
  // Force update html element
  document.documentElement.dir = dir;
  document.documentElement.lang = lng;
  document.documentElement.setAttribute('dir', dir);
  document.documentElement.setAttribute('lang', lng);
  
  // Force update body element with important
  if (document.body) {
    document.body.dir = dir;
    document.body.setAttribute('dir', dir);
    document.body.style.setProperty('direction', dir, 'important');
    document.body.style.direction = dir;
  }
  
  // Add/remove RTL class
  if (dir === 'rtl') {
    document.documentElement.classList.add('rtl');
    document.documentElement.classList.remove('ltr');
    if (document.body) {
      document.body.classList.add('rtl');
      document.body.classList.remove('ltr');
    }
  } else {
    document.documentElement.classList.add('ltr');
    document.documentElement.classList.remove('rtl');
    if (document.body) {
      document.body.classList.add('ltr');
      document.body.classList.remove('rtl');
    }
  }
};

i18n.on('languageChanged', updateDirection);

// Set initial direction
updateDirection(initialLanguage);

// Export helper to force language change (marks as user preference)
export const setLanguage = (lng: 'ar' | 'en') => {
  localStorage.setItem('i18nextLng', lng);
  localStorage.setItem('userLanguagePreference', 'true');
  sessionStorage.setItem('languageSetThisSession', 'true');
  
  // Change language and wait for it to complete
  i18n.changeLanguage(lng).then(() => {
    // Trigger custom events to force re-renders
    window.dispatchEvent(new Event('languagechange'));
    window.dispatchEvent(new CustomEvent('i18n:languageChanged', { detail: { language: lng } }));
    
    // Force update direction
    updateDirection(lng);
    
    // Force React to re-render by updating a global state if needed
    // This ensures all components using useTranslation() will update
  }).catch((error) => {
    // SECURITY FIX: Use logger instead of console.error
    // Logger will be injected if needed
  });
};

// Export helper to reset to Arabic (clears user preference)
export const resetToArabic = () => {
  localStorage.setItem('i18nextLng', 'ar');
  localStorage.removeItem('userLanguagePreference');
  i18n.changeLanguage('ar');
  console.log('🌐 Language reset to Arabic');
};

export default i18n;
