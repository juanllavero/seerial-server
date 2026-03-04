// Map of 3-letter codes to 2-letter codes and translations
const languageMap = {
  spa: {
    code: 'es',
    translations: {
      es: 'Español',
      en: 'Spanish',
      fr: 'Espagnol',
      pt: 'Espanhol',
      it: 'Spagnolo',
      ru: 'Испанский',
      hi: 'स्पेनिश',
      de: 'Spanisch',
      pl: 'Hiszpański',
      ja: 'スペイン語',
      zh: '西班牙语',
      ko: '스페인어',
      ar: 'الإسبانية',
    },
  },
  eng: {
    code: 'en',
    translations: {
      es: 'Inglés',
      en: 'English',
      fr: 'Anglais',
      pt: 'Inglês',
      it: 'Inglese',
      ru: 'Английский',
      hi: 'अंग्रेजी',
      de: 'Englisch',
      pl: 'Angielski',
      ja: '英語',
      zh: '英语',
      ko: '영어',
      ar: 'الإنجليزية',
    },
  },
  fra: {
    code: 'fr',
    translations: {
      es: 'Francés',
      en: 'French',
      fr: 'Français',
      pt: 'Francês',
      it: 'Francese',
      ru: 'Французский',
      hi: 'फ्रेंच',
      de: 'Französisch',
      pl: 'Francuski',
      ja: 'フランス語',
      zh: '法语',
      ko: '프랑스어',
      ar: 'الفرنسية',
    },
  },
  por: {
    code: 'pt',
    translations: {
      es: 'Portugués',
      en: 'Portuguese',
      fr: 'Portugais',
      pt: 'Português',
      it: 'Portoghese',
      ru: 'Португальский',
      hi: 'पुर्तगाली',
      de: 'Portugiesisch',
      pl: 'Portugalski',
      ja: 'ポルトガル語',
      zh: '葡萄牙语',
      ko: '포르투갈어',
      ar: 'البرتغالية',
    },
  },
  ita: {
    code: 'it',
    translations: {
      es: 'Italiano',
      en: 'Italian',
      fr: 'Italien',
      pt: 'Italiano',
      it: 'Italiano',
      ru: 'Итальянский',
      hi: 'इटालियन',
      de: 'Italienisch',
      pl: 'Włoski',
      ja: 'イタリア語',
      zh: '意大利语',
      ko: '이탈리아어',
      ar: 'الإيطالية',
    },
  },
  rus: {
    code: 'ru',
    translations: {
      es: 'Ruso',
      en: 'Russian',
      fr: 'Russe',
      pt: 'Russo',
      it: 'Russo',
      ru: 'Русский',
      hi: 'रूसी',
      de: 'Russisch',
      pl: 'Rosyjski',
      ja: 'ロシア語',
      zh: '俄语',
      ko: '러시아어',
      ar: 'الروسية',
    },
  },
  hin: {
    code: 'hi',
    translations: {
      es: 'Hindú',
      en: 'Hindi',
      fr: 'Hindi',
      pt: 'Hindi',
      it: 'Hindi',
      ru: 'Хинди',
      hi: 'हिन्दी',
      de: 'Hindi',
      pl: 'Hindi',
      ja: 'ヒンディー語',
      zh: '印地语',
      ko: '힌디어',
      ar: 'الهندية',
    },
  },
  deu: {
    code: 'de',
    translations: {
      es: 'Alemán',
      en: 'German',
      fr: 'Allemand',
      pt: 'Alemão',
      it: 'Tedesco',
      ru: 'Немецкий',
      hi: 'जर्मन',
      de: 'Deutsch',
      pl: 'Niemiecki',
      ja: 'ドイツ語',
      zh: '德语',
      ko: '독일어',
      ar: 'الألمانية',
    },
  },
  pol: {
    code: 'pl',
    translations: {
      es: 'Polaco',
      en: 'Polish',
      fr: 'Polonais',
      pt: 'Polonês',
      it: 'Polacco',
      ru: 'Польский',
      hi: 'पोलिश',
      de: 'Polnisch',
      pl: 'Polski',
      ja: 'ポーランド語',
      zh: '波兰语',
      ko: '폴란드어',
      ar: 'البولندية',
    },
  },
  jpn: {
    code: 'ja',
    translations: {
      es: 'Japonés',
      en: 'Japanese',
      fr: 'Japonais',
      pt: 'Japonês',
      it: 'Giapponese',
      ru: 'Японский',
      hi: 'जापानी',
      de: 'Japanisch',
      pl: 'Japoński',
      ja: '日本語',
      zh: '日语',
      ko: '일본어',
      ar: 'اليابانية',
    },
  },
  zho: {
    code: 'zh',
    translations: {
      es: 'Chino',
      en: 'Chinese',
      fr: 'Chinois',
      pt: 'Chinês',
      it: 'Cinese',
      ru: 'Китайский',
      hi: 'चीनी',
      de: 'Chinesisch',
      pl: 'Chiński',
      ja: '中国語',
      zh: '中文',
      ko: '중국어',
      ar: 'الصينية',
    },
  },
  kor: {
    code: 'ko',
    translations: {
      es: 'Coreano',
      en: 'Korean',
      fr: 'Coréen',
      pt: 'Coreano',
      it: 'Coreano',
      ru: 'Корейский',
      hi: 'कोरियाई',
      de: 'Koreanisch',
      pl: 'Koreański',
      ja: '韓国語',
      zh: '韩语',
      ko: '한국어',
      ar: 'الكورية',
    },
  },
  ara: {
    code: 'ar',
    translations: {
      es: 'Árabe',
      en: 'Arabic',
      fr: 'Arabe',
      pt: 'Árabe',
      it: 'Arabo',
      ru: 'Арабский',
      hi: 'अरबी',
      de: 'Arabisch',
      pl: 'Arabski',
      ja: 'アラビア語',
      zh: '阿拉伯语',
      ko: '아랍어',
      ar: 'العربية',
    },
  },
}

// Function to get the language name
export const useLanguageName = (
  langCode3: string,
  userFullLanguage: string,
) => {
  // Get the user's current language from i18next
  const userLanguage = userFullLanguage.split('-')[0] // Example: 'es-MX' -> 'es'

  // Convert 3-letter code to lowercase for consistency
  const code3 = langCode3.toLowerCase()

  // Get the language entry from the map
  const languageEntry = languageMap[code3 as keyof typeof languageMap]

  if (!languageEntry) {
    return 'Unknown language'
  }

  // Return the 2-letter code and name in the user's language
  return (
    languageEntry.translations[
      userLanguage as keyof typeof languageEntry.translations
    ] || languageEntry.translations['en']
  ) // Fallback to English
}
