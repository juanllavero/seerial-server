import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import {
  ar,
  br,
  cn,
  de,
  en,
  es,
  fr,
  hi,
  it,
  ja,
  ko,
  pt,
  tw,
} from './languages/index'

i18n.use(initReactI18next).init({
  fallbackLng: 'en',
  resources: {
    en,
    'es-ES': es,
    'pt-BR': br,
    'pt-PT': pt,
    'zh-CN': cn,
    'zh-TW': tw,
    ja,
    ko,
    fr,
    de,
    it,
    hi,
    ar,
  },
})
