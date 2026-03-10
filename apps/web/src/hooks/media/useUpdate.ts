import { useState } from 'react'
import { apiClient } from '@/config/api'

interface ApiResponse<T> {
  success: boolean
  message: string
  data: T | null
  timestamp: string
}

interface UseUpdateReturn<T> {
  isLoading: boolean
  error: string | null
  update: (url: string, body: Partial<T>) => Promise<T | null>
}

export const useUpdate = <T>(): UseUpdateReturn<T> => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const update = async (url: string, body: Partial<T>): Promise<T | null> => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await apiClient.put(url, body)
      const apiResponse = response.data as ApiResponse<T>

      if (apiResponse.success) {
        return apiResponse.data
      } else {
        setError(apiResponse.message)
        return null
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'An error occurred'
      setError(errorMessage)
      return null
    } finally {
      setIsLoading(false)
    }
  }

  return { isLoading, error, update }
}
