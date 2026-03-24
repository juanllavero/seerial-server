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
import { apiClient, getApiErrorMessage, unwrapApiPayload } from '../client'
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

export type ApiQueryResult<TResponse> = Omit<UseQueryResult<TResponse, Error>, 'error'> & {
    error: string | null
    mutate: () => Promise<QueryObserverResult<TResponse, Error>>
}

export type ApiMutationResult<TResponse, TVariables> = Omit<
    UseMutationResult<TResponse, Error, TVariables>,
    'error'
> & {
    error: string | null
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
            return unwrapApiPayload<TResponse>(response.data)
        },
        ...options,
    })

    return {
        ...query,
        error: query.error ? getApiErrorMessage(query.error) : null,
        mutate: () => query.refetch(),
    }
}

export function useApiMutation<TResponse, TVariables>(
    mutationKey: QueryKey,
    path: string,
    method: HttpMethod,
    mapVariablesToRequest: (variables: TVariables) => MutationRequestOptions,
    options?: MutationHookOptions<TResponse, TVariables>,
): ApiMutationResult<TResponse, TVariables> {
    const mutation = useMutation<TResponse, Error, TVariables>({
        mutationKey,
        mutationFn: async (variables: TVariables) => {
            const request = mapVariablesToRequest(variables)
            const response = await apiClient.request<TResponse>({
                url: request.url ?? path,
                method,
                data: request.data,
                params: request.params,
            })

            return unwrapApiPayload<TResponse>(response.data)
        },
        ...options,
    })

    return {
        ...mutation,
        error: mutation.error ? getApiErrorMessage(mutation.error) : null,
    }
}

export function asBody<TBody>(data: TBody): MutationRequestOptions {
    return { data }
}

export function asVoid(): MutationRequestOptions {
    return {}
}
