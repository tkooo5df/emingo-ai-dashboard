import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enTranslations from './locales/en.json';
import arTranslations from './locales/ar.json';
import frTranslations from './locales/fr.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: enTranslations,
      },
      ar: {
        translation: arTranslations,
      },
      fr: {
        translation: frTranslations,
      },
    },
    fallbackLng: 'en',
    debug: false,
    react: {
      useSuspense: false,
    },
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      // Don't auto-detect on init - we'll load from database
      lookupLocalStorage: 'i18nextLng',
    },
  });

// Log i18n initialization
console.log('🌐 [i18n] Initialized with language:', i18n.language);
console.log('🌐 [i18n] Available languages:', Object.keys(i18n.options.resources || {}));
const storedLang = localStorage.getItem('i18nextLng');
if (storedLang) {
  console.log('🌐 [i18n] Found language in localStorage:', storedLang);
} else {
  console.log('🌐 [i18n] No language in localStorage, using default:', i18n.language);
}

// Update document direction based on language
i18n.on('languageChanged', (lng) => {
  const previousLang = document.documentElement.lang || i18n.language;
  console.log('🌐 [i18n] Language changed event triggered:', {
    from: previousLang,
    to: lng,
    timestamp: new Date().toISOString()
  });
  
  document.documentElement.dir = lng === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.lang = lng;
  
  console.log('🌐 [i18n] Document direction updated:', {
    dir: document.documentElement.dir,
    lang: document.documentElement.lang
  });
  
  // Force a small delay to ensure all components re-render
  setTimeout(() => {
    // Trigger a custom event that components can listen to
    window.dispatchEvent(new Event('languagechange'));
    console.log('🌐 [i18n] Language change event dispatched to window');
  }, 0);
});

// Set initial direction
if (i18n.language === 'ar') {
  document.documentElement.dir = 'rtl';
  document.documentElement.lang = 'ar';
}

export default i18n;

