/**
 * Fetches data from a given URL and returns the parsed JSON response.
 *
 * @param url - The URL to fetch data from.
 * @returns A promise that resolves to the parsed JSON data.
 */
export const fetcher = (url: string) => fetch(url).then((res) => res.json())

/**
 * Fetches data from a given URL and returns the parsed JSON response.
 *
 * @param url - The URL to fetch data from.
 * @param token - The token to use for authentication.
 * @returns A promise that resolves to the parsed JSON data.
 */
export const authenticatedFetcher = async (url: string) => {
  const res = await fetch(url, {
    credentials: 'include',
  })
  return await res.json()
}

export const getLanguageName = (code: string, locale: string) => {
  if (typeof Intl.DisplayNames === 'function') {
    const displayNames = new Intl.DisplayNames([locale], { type: 'language' })
    return displayNames.of(code)
  }
  return code
}

export const iso1to3: Record<string, string> = {
  es: 'spa',
  en: 'eng',
  pt: 'por',
  fr: 'fre',
  de: 'ger',
  it: 'ita',
  ru: 'rus',
  ar: 'ara',
  ja: 'jpn',
  ko: 'kor',
  zh: 'zho',
  hi: 'hin',
  pl: 'pol',
  nl: 'dut',
  sv: 'swe',
  el: 'ell',
  cs: 'ces',
  ro: 'ron',
  fi: 'fin',
  tr: 'tur',
  th: 'tha',
  id: 'ind',
  ms: 'msa',
  ca: 'cat',
}
