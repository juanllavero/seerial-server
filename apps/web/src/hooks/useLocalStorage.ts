import { useState, useEffect, useCallback } from 'react'

// Utility to safely parse JSON or return a default value
const parseJSON = <T>(value: string | null, defaultValue: T): T => {
  if (value === null) return defaultValue
  try {
    return JSON.parse(value) as T
  } catch {
    return defaultValue
  }
}

/**
 * Custom hook to manage localStorage and storage events
 * @param key key to store in localStorage
 * @param initialValue initial value
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
  // Initialize state with value from localStorage or initialValue
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue
    }
    return parseJSON<T>(window.localStorage.getItem(key), initialValue)
  })

  // Update localStorage and state
  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      const newValue = value instanceof Function ? value(storedValue) : value
      setStoredValue(newValue)
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(newValue))
        // Dispatch storage event to notify other tabs
        window.dispatchEvent(
          new StorageEvent('storage', {
            key,
            newValue: JSON.stringify(newValue),
            storageArea: window.localStorage,
          }),
        )
      }
    },
    [key, storedValue],
  )

  // Listen for storage changes from other tabs/windows
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === key && event.storageArea === window.localStorage) {
        setStoredValue(parseJSON<T>(event.newValue, initialValue))
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [key, initialValue])

  return [storedValue, setValue] as const
}
