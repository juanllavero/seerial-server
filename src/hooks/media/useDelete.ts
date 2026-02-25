import { apiClient } from '@/config/api'
import { useState } from 'react'

interface ApiResponse<T> {
  success: boolean
  message: string
  data: T | null
  timestamp: string
}

interface UseDeleteReturn<T> {
  data: T | null
  isLoading: boolean
  error: string | null
  delete: (url: string) => Promise<T | null>
}

export const useDelete = <T>(): UseDeleteReturn<T> => {
  const [data, setData] = useState<T | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const deleteRequest = async (url: string): Promise<T | null> => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await apiClient.delete(url)
      const apiResponse = response.data as ApiResponse<T>

      if (apiResponse.success) {
        setData(apiResponse.data)
        return apiResponse.data
      } else {
        setError(apiResponse.message)
        return null
      }
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || err.message || 'An error occurred'
      setError(errorMessage)
      return null
    } finally {
      setIsLoading(false)
    }
  }

  return { data, isLoading, error, delete: deleteRequest }
}
