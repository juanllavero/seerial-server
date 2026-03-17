import {
    type QueryKey,
    type QueryObserverResult,
    type UseMutationOptions,
    type UseMutationResult,
    type UseQueryOptions,
    type UseQueryResult,
    useMutation,
    useQuery,
} from '@tanstack/react-query'
import { apiClient } from '../client'
import type { HttpMethod } from '../endpoints'

type QueryParams = Record<string, unknown>

type MutationRequestOptions = {
    url?: string
    data?: unknown
    params?: QueryParams
}

export type QueryHookOptions<TResponse> = Omit<UseQueryOptions<TResponse, Error>, 'queryFn' | 'queryKey'> & {
    enabled?: boolean
    params?: QueryParams
    queryKey?: QueryKey
}

export type MutationHookOptions<TResponse, TVariables> = Omit<
    UseMutationOptions<TResponse, Error, TVariables>,
    'mutationFn'
>

export type ApiQueryResult<TResponse> = UseQueryResult<TResponse, Error> & {
    mutate: () => Promise<QueryObserverResult<TResponse, Error>>
}

export function useApiQuery<TResponse>(
    queryKey: QueryKey,
    path: string,
    options?: QueryHookOptions<TResponse>,
): ApiQueryResult<TResponse> {
    const query = useQuery<TResponse, Error>({
        queryKey: options?.queryKey ?? [...queryKey, options?.params],
        queryFn: async () => {
            const response = await apiClient.get<TResponse>(path, { params: options?.params })
            return response.data
        },
        ...options,
    })

    return {
        ...query,
        mutate: () => query.refetch(),
    }
}

export function useApiMutation<TResponse, TVariables>(
    mutationKey: QueryKey,
    path: string,
    method: HttpMethod,
    mapVariablesToRequest: (variables: TVariables) => MutationRequestOptions,
    options?: MutationHookOptions<TResponse, TVariables>,
): UseMutationResult<TResponse, Error, TVariables> {
    return useMutation<TResponse, Error, TVariables>({
        mutationKey,
        mutationFn: async (variables: TVariables) => {
            const request = mapVariablesToRequest(variables)
            const response = await apiClient.request<TResponse>({
                url: request.url ?? path,
                method,
                data: request.data,
                params: request.params,
            })

            return response.data
        },
        ...options,
    })
}

export function asBody<TBody>(data: TBody): MutationRequestOptions {
    return { data }
}

export function asVoid(): MutationRequestOptions {
    return {}
}
