import {
    type QueryKey,
    type UseMutationOptions,
    type UseMutationResult,
    type UseQueryOptions,
    type UseQueryResult,
    useMutation,
    useQuery,
} from '@tanstack/react-query'
import { apiClient } from './client'
import { API, type HttpMethod } from './endpoints'

type EndpointPathBuilder = (...args: readonly never[]) => string

type EndpointLeaf = string | EndpointPathBuilder

type EndpointTree = Record<string, unknown>

type EndpointLeafArgs<TLeaf> = TLeaf extends (...args: infer TArgs) => string ? TArgs : []

type QueryLeaf<TLeaf> = {
    useQuery: <TResponse = unknown>(
        ...args: [...EndpointLeafArgs<TLeaf>, QueryHookOptions<TResponse>?]
    ) => UseQueryResult<TResponse>
    useMutation: <TResponse = unknown, TBody = unknown>(
        options?: MutationHookOptions<TResponse, TBody>,
    ) => UseMutationResult<TResponse, Error, MutationVariables<TLeaf, TBody>>
    getPath: (...args: EndpointLeafArgs<TLeaf>) => string
}

type QueryTree<TTree> = {
    readonly [K in keyof TTree]: TTree[K] extends string
    ? QueryLeaf<TTree[K]>
    : TTree[K] extends (...args: readonly never[]) => string
    ? QueryLeaf<TTree[K]>
    : QueryTree<TTree[K]>
}

export type MutationVariables<TLeaf, TBody> = {
    args?: EndpointLeafArgs<TLeaf>
    method?: HttpMethod
    data?: TBody
    params?: Record<string, unknown>
}

export type QueryHookOptions<TResponse> = Omit<UseQueryOptions<TResponse, Error>, 'queryFn' | 'queryKey'> & {
    enabled?: boolean
    params?: Record<string, unknown>
    queryKey?: QueryKey
}

export type MutationHookOptions<TResponse, TBody> = Omit<
    UseMutationOptions<TResponse, Error, MutationVariables<EndpointLeaf, TBody>>,
    'mutationFn'
>

function isEndpointTree(value: unknown): value is EndpointTree {
    return typeof value === 'object' && value !== null
}

function isEndpointPathBuilder(value: unknown): value is EndpointPathBuilder {
    return typeof value === 'function'
}

function splitArgsAndOptions<TArgs extends readonly unknown[], TOptions>(
    values: readonly unknown[],
): [TArgs, TOptions | undefined] {
    if (values.length === 0) {
        return [[] as unknown as TArgs, undefined]
    }

    const lastValue = values[values.length - 1]

    if (typeof lastValue === 'object' && lastValue !== null && !Array.isArray(lastValue)) {
        return [values.slice(0, -1) as unknown as TArgs, lastValue as TOptions]
    }

    return [values as unknown as TArgs, undefined]
}

function buildPath<TLeaf extends EndpointLeaf>(endpoint: TLeaf, args: EndpointLeafArgs<TLeaf>): string {
    if (typeof endpoint === 'string') {
        return endpoint
    }

    if (isEndpointPathBuilder(endpoint)) {
        return endpoint(...(args as readonly never[]))
    }

    throw new Error('Invalid endpoint definition.')
}

function createEndpointLeaf<TLeaf extends EndpointLeaf>(
    endpointPath: readonly string[],
    endpoint: TLeaf,
): QueryLeaf<TLeaf> {
    const getPath = (...args: EndpointLeafArgs<TLeaf>): string => buildPath(endpoint, args)

    const useQueryHook = <TResponse = unknown>(
        ...values: [...EndpointLeafArgs<TLeaf>, QueryHookOptions<TResponse>?]
    ): UseQueryResult<TResponse> => {
        const [args, options] = splitArgsAndOptions<EndpointLeafArgs<TLeaf>, QueryHookOptions<TResponse>>(values)
        const path = getPath(...args)
        const queryKey = options?.queryKey ?? [...endpointPath, ...args, options?.params]

        return useQuery<TResponse, Error>({
            queryKey,
            queryFn: async () => {
                const response = await apiClient.get<TResponse>(path, { params: options?.params })
                return response.data
            },
            ...options,
        })
    }

    const useMutationHook = <TResponse = unknown, TBody = unknown>(
        options?: MutationHookOptions<TResponse, TBody>,
    ): UseMutationResult<TResponse, Error, MutationVariables<TLeaf, TBody>> => {
        return useMutation<TResponse, Error, MutationVariables<TLeaf, TBody>>({
            mutationFn: async (variables: MutationVariables<TLeaf, TBody>) => {
                const args = variables?.args ?? ([] as unknown as EndpointLeafArgs<TLeaf>)
                const method = variables?.method ?? 'POST'
                const path = getPath(...args)
                const response = await apiClient.request<TResponse>({
                    url: path,
                    method,
                    params: variables?.params,
                    data: variables?.data,
                })

                return response.data
            },
            ...(options as UseMutationOptions<TResponse, Error, MutationVariables<TLeaf, TBody>>),
        })
    }

    return {
        useQuery: useQueryHook,
        useMutation: useMutationHook,
        getPath,
    }
}

function createApiHooksTree<TTree extends EndpointTree>(
    tree: TTree,
    currentPath: readonly string[] = [],
): QueryTree<TTree> {
    const entries = Object.entries(tree).map(([key, value]) => {
        if (typeof value === 'string' || isEndpointPathBuilder(value)) {
            return [key, createEndpointLeaf([...currentPath, key], value as EndpointLeaf)]
        }

        if (isEndpointTree(value)) {
            return [key, createApiHooksTree(value, [...currentPath, key])]
        }

        throw new Error(`Invalid endpoint value for ${[...currentPath, key].join('.')}`)
    })

    return Object.fromEntries(entries) as QueryTree<TTree>
}

export const endpointHooks = createApiHooksTree(API)

export const useGetLibraries = <TResponse = unknown>(
    options?: QueryHookOptions<TResponse>,
): UseQueryResult<TResponse> => endpointHooks.libraries.getAll.useQuery<TResponse>(options)

export const useGetLibraryById = <TResponse = unknown>(
    libraryId: string,
    options?: QueryHookOptions<TResponse>,
): UseQueryResult<TResponse> => endpointHooks.libraries.getById.useQuery<TResponse>(libraryId, options)

export const useGetLibraryContent = <TResponse = unknown>(
    libraryId: string,
    options?: QueryHookOptions<TResponse>,
): UseQueryResult<TResponse> => endpointHooks.libraries.content.useQuery<TResponse>(libraryId, options)

export const useGetMovieById = <TResponse = unknown>(
    movieId: string,
    options?: QueryHookOptions<TResponse>,
): UseQueryResult<TResponse> => endpointHooks.movies.get.useQuery<TResponse>(movieId, options)

export const useGetSeriesById = <TResponse = unknown>(
    seriesId: string,
    options?: QueryHookOptions<TResponse>,
): UseQueryResult<TResponse> => endpointHooks.series.get.useQuery<TResponse>(seriesId, options)

export const useGetEpisodeById = <TResponse = unknown>(
    episodeId: string,
    options?: QueryHookOptions<TResponse>,
): UseQueryResult<TResponse> => endpointHooks.episodes.get.useQuery<TResponse>(episodeId, options)

export const useGetSeasonById = <TResponse = unknown>(
    seasonId: string,
    include?: string,
    options?: QueryHookOptions<TResponse>,
): UseQueryResult<TResponse> =>
    endpointHooks.seasons.get.useQuery<TResponse>(seasonId, include, options)

export const useGetUsersPublic = <TResponse = unknown>(
    options?: QueryHookOptions<TResponse>,
): UseQueryResult<TResponse> => endpointHooks.users.findAllPublic.useQuery<TResponse>(options)

export const useGetContinueWatching = <TResponse = unknown>(
    options?: QueryHookOptions<TResponse>,
): UseQueryResult<TResponse> => endpointHooks.continueWatching.getVideos.useQuery<TResponse>(options)

export const useGetServerStatus = <TResponse = unknown>(
    options?: QueryHookOptions<TResponse>,
): UseQueryResult<TResponse> => endpointHooks.servers.status.useQuery<TResponse>(options)

export type EndpointHooks = typeof endpointHooks
