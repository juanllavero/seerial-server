import { useState } from 'react'
import { useApiMutation, useApiQuery } from './common'

interface CrudGetOptions {
    enabled?: boolean
    revalidateOnFocus?: boolean
    revalidateIfStale?: boolean
}

export const useGet = <T>(url: string | null, options?: CrudGetOptions) => {
    const isEnabled = Boolean(url) && (options?.enabled ?? true)

    const {
        data,
        isLoading,
        error,
        refetch,
    } = useApiQuery<T>(['crud', 'get', url ?? ''], url ?? '', {
        enabled: isEnabled,
        refetchOnWindowFocus: options?.revalidateOnFocus,
        staleTime: options?.revalidateIfStale === false ? Number.POSITIVE_INFINITY : undefined,
    })

    return {
        data: data ?? null,
        isLoading,
        error,
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

    const mutation = useApiMutation<T, { url: string; body: Partial<T> }>(
        ['crud', 'create'],
        '',
        'POST',
        ({ url, body }) => ({ url, data: body }),
    )

    const create = async (url: string, body: Partial<T>): Promise<T | null> => {
        try {
            const apiResponse = await mutation.mutateAsync({ url, body })
            setData(apiResponse ?? null)
            return apiResponse ?? null
        } catch {
            return null
        }
    }

    return {
        data,
        isLoading: mutation.isPending,
        error: mutation.error,
        create,
    }
}

interface UseUpdateReturn<T> {
    isLoading: boolean
    error: string | null
    update: (url: string, body: Partial<T>) => Promise<T | null>
}

export const useUpdate = <T>(): UseUpdateReturn<T> => {
    const mutation = useApiMutation<T, { url: string; body: Partial<T> }>(
        ['crud', 'update'],
        '',
        'PATCH',
        ({ url, body }) => ({ url, data: body }),
    )

    const update = async (url: string, body: Partial<T>): Promise<T | null> => {
        try {
            return await mutation.mutateAsync({ url, body })
        } catch {
            return null
        }
    }

    return {
        isLoading: mutation.isPending,
        error: mutation.error,
        update,
    }
}

interface UseDeleteReturn {
    isLoading: boolean
    error: string | null
    deleteRequest: (url: string) => Promise<boolean>
}

export const useDelete = (): UseDeleteReturn => {
    const mutation = useApiMutation<unknown, string>(['crud', 'delete'], '', 'DELETE', (url) => ({ url }))

    const deleteRequest = async (url: string): Promise<boolean> => {
        try {
            await mutation.mutateAsync(url)
            return true
        } catch {
            return false
        }
    }

    return {
        isLoading: mutation.isPending,
        error: mutation.error,
        deleteRequest,
    }
}