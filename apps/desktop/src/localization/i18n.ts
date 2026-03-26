import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { en, es } from './languages/index';

i18n.use(initReactI18next).init({
  fallbackLng: 'en',
  resources: {
    en,
    'es-ES': es,
  },
});
