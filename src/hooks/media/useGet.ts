import { authenticatedFetcher } from '@/config/api'
import { useMemo } from 'react'
import useSWR, { SWRConfiguration } from 'swr'

interface ApiResponse<T> {
  success: boolean
  message: string
  data: T | null
  timestamp: string
}

export const useGet = <T>(
  url: string | null,
  swrOptions?: SWRConfiguration,
) => {
  const {
    data: response,
    isLoading,
    error,
    mutate,
  } = useSWR(url, authenticatedFetcher, swrOptions)

  const { data, responseError } = useMemo(() => {
    if (!response) {
      return { data: null, responseError: null }
    }

    const apiResponse = response as ApiResponse<T>

    if (apiResponse.success) {
      return { data: apiResponse.data, responseError: null }
    } else {
      return { data: null, responseError: apiResponse.message }
    }
  }, [response])

  return {
    data,
    isLoading,
    error: error || responseError,
    mutate,
  }
}
