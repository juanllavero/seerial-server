import { apiClient } from '@/config/api'
import { useState } from 'react'

interface ApiResponse<T> {
  success: boolean
  message: string
  data: T | null
  timestamp: string
}

interface UseDeleteReturn<T> {
  isLoading: boolean
  error: string | null
  deleteRequest: (url: string) => Promise<boolean>
}

export const useDelete = <T>(): UseDeleteReturn<T> => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const deleteRequest = async (url: string): Promise<boolean> => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await apiClient.delete(url)
      const apiResponse = response.data as ApiResponse<T>

      if (apiResponse.success) {
        return true
      } else {
        setError(apiResponse.message)
        return false
      }
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || err.message || 'An error occurred'
      setError(errorMessage)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  return { isLoading, error, deleteRequest }
}
