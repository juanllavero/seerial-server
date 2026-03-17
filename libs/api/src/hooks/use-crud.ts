import { useMemo, useState } from 'react'
import { useApiMutation, useApiQuery } from './common'

interface ApiResponse<T> {
    success: boolean
    message: string
    data: T | null
    timestamp: string
}

interface CrudGetOptions {
    enabled?: boolean
    revalidateOnFocus?: boolean
    revalidateIfStale?: boolean
}

export const useGet = <T>(url: string | null, options?: CrudGetOptions) => {
    const isEnabled = Boolean(url) && (options?.enabled ?? true)

    const {
        data: response,
        isLoading,
        error,
        refetch,
    } = useApiQuery<ApiResponse<T>>(['crud', 'get', url ?? ''], url ?? '', {
        enabled: isEnabled,
        refetchOnWindowFocus: options?.revalidateOnFocus,
        staleTime: options?.revalidateIfStale === false ? Number.POSITIVE_INFINITY : undefined,
    })

    const { data, responseError } = useMemo(() => {
        if (!response) {
            return { data: null, responseError: null }
        }

        if (response.success) {
            return { data: response.data, responseError: null }
        }

        return { data: null, responseError: response.message }
    }, [response])

    return {
        data,
        isLoading,
        error: error || responseError,
        mutate: () => {
            void refetch()
        },
    }
}

interface UseCreateReturn<T> {
    data: T | null
    isLoading: boolean
    error: string | null
    create: (url: string, body: Partial<T>) => Promise<T | null>
}

export const useCreate = <T>(): UseCreateReturn<T> => {
    const [data, setData] = useState<T | null>(null)
    const [responseError, setResponseError] = useState<string | null>(null)

    const mutation = useApiMutation<ApiResponse<T>, { url: string; body: Partial<T> }>(
        ['crud', 'create'],
        '',
        'POST',
        ({ url, body }) => ({ url, data: body }),
    )

    const error = useMemo(() => responseError ?? mutation.error?.message ?? null, [responseError, mutation.error?.message])

    const create = async (url: string, body: Partial<T>): Promise<T | null> => {
        setResponseError(null)

        try {
            const apiResponse = await mutation.mutateAsync({ url, body })

            if (apiResponse.success) {
                setData(apiResponse.data)
                return apiResponse.data
            }

            setResponseError(apiResponse.message)
            return null
        } catch {
            return null
        }
    }

    return {
        data,
        isLoading: mutation.isPending,
        error,
        create,
    }
}

interface UseUpdateReturn<T> {
    isLoading: boolean
    error: string | null
    update: (url: string, body: Partial<T>) => Promise<T | null>
}

export const useUpdate = <T>(): UseUpdateReturn<T> => {
    const [responseError, setResponseError] = useState<string | null>(null)

    const mutation = useApiMutation<ApiResponse<T>, { url: string; body: Partial<T> }>(
        ['crud', 'update'],
        '',
        'PUT',
        ({ url, body }) => ({ url, data: body }),
    )

    const error = useMemo(() => responseError ?? mutation.error?.message ?? null, [responseError, mutation.error?.message])

    const update = async (url: string, body: Partial<T>): Promise<T | null> => {
        setResponseError(null)

        try {
            const apiResponse = await mutation.mutateAsync({ url, body })

            if (apiResponse.success) {
                return apiResponse.data
            }

            setResponseError(apiResponse.message)
            return null
        } catch {
            return null
        }
    }

    return {
        isLoading: mutation.isPending,
        error,
        update,
    }
}

interface UseDeleteReturn {
    isLoading: boolean
    error: string | null
    deleteRequest: (url: string) => Promise<boolean>
}

export const useDelete = (): UseDeleteReturn => {
    const [responseError, setResponseError] = useState<string | null>(null)

    const mutation = useApiMutation<ApiResponse<T>, string>(['crud', 'delete'], '', 'DELETE', (url) => ({ url }))

    const error = useMemo(() => responseError ?? mutation.error?.message ?? null, [responseError, mutation.error?.message])

    const deleteRequest = async (url: string): Promise<boolean> => {
        setResponseError(null)

        try {
            const apiResponse = await mutation.mutateAsync(url)

            if (apiResponse.success) {
                return true
            }

            setResponseError(apiResponse.message)
            return false
        } catch {
            return false
        }
    }

    return {
        isLoading: mutation.isPending,
        error,
        deleteRequest,
    }
}