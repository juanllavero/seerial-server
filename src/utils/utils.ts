import { getToken } from '@/lib/auth'

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
  const token = getToken()
  if (!token) return 'No token'

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  })
  return await res.json()
}
