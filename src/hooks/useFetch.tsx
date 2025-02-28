import { useState, useCallback } from 'react'

// Custom hook to fetch data from an API
const useFetch = <T,>() => {
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchData = useCallback(
    async (
      url: string,
      onSuccess: (data: T) => void,
      onError: (error: Error) => void = () => {},
      onFinally: () => void = () => {},
      options: RequestInit = {},
    ) => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch(url, options)

        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`)
        }

        const data: T = await response.json()
        onSuccess(data)
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err))
        setError(error)
        onError(error)
      } finally {
        setIsLoading(false)
        onFinally()
      }
    },
    [],
  )

  return { fetchData, isLoading, error }
}

export default useFetch
