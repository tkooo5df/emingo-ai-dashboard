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
  const storedLang = localStorage.getItem('i18nextLng');
  if (storedLang) {
    // Language stored in localStorage
  }

// Update document direction based on language
i18n.on('languageChanged', (lng) => {
  document.documentElement.dir = lng === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.lang = lng;
  // Force a small delay to ensure all components re-render
  setTimeout(() => {
    // Trigger a custom event that components can listen to
    window.dispatchEvent(new Event('languagechange'));
  }, 0);
});

// Set initial direction
if (i18n.language === 'ar') {
  document.documentElement.dir = 'rtl';
  document.documentElement.lang = 'ar';
}

export default i18n;

