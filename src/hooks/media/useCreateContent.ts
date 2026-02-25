import { apiClient } from '@/config/api'
import { useState } from 'react'

interface ApiResponse<T> {
  success: boolean
  message: string
  data: T | null
  timestamp: string
}

interface UseCreateReturn<T> {
  data: T | null
  isLoading: boolean
  error: string | null
  create: (url: string, body: Partial<T>) => Promise<T | null>
}

export const useCreate = <T>(): UseCreateReturn<T> => {
  const [data, setData] = useState<T | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const create = async (url: string, body: Partial<T>): Promise<T | null> => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await apiClient.post(url, body)
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

  return { data, isLoading, error, create }
}
