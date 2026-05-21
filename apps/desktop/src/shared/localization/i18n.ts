import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { en } from './languages/en';
import { es } from './languages/es-ES';

i18n.use(initReactI18next).init({
  fallbackLng: 'en',
  resources: {
    en,
    'es-ES': es,
  },
});
