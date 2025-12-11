import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { ar } from './translations/ar';
import { en } from './translations/en';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      ar: { translation: ar },
      en: { translation: en },
    },
    lng: 'ar', // Default language is Arabic
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

// Set document direction based on language
const updateDirection = (lng: string) => {
  const dir = lng === 'ar' ? 'rtl' : 'ltr';
  
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
const currentLang = i18n.language || localStorage.getItem('language') || 'ar';
updateDirection(currentLang);

export default i18n;
