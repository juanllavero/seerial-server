import { useQuery } from '@tanstack/react-query'
import { apiClient, getApiErrorMessage } from '../client'
import { API } from '../endpoints'
import { type ApiMutationResult, type ApiQueryResult, asBody, type MutationHookOptions, type QueryHookOptions, useApiMutation, useApiQuery } from './common'

export const useSearchMedia = <TResponse = unknown>(
    options?: QueryHookOptions<TResponse>,
): ApiQueryResult<TResponse> => useApiQuery<TResponse>(['search', 'media'], API.search.media, options)

export const useSearchLibrary = <TResponse = unknown>(
    query: string,
    options?: QueryHookOptions<TResponse>,
): ApiQueryResult<TResponse> => {
    const mergedParams = { ...(options?.params ?? {}), query }

    return useApiQuery<TResponse>(['search', 'library'], API.search.library, {
        ...options,
        params: mergedParams,
        enabled: (options?.enabled ?? true) && query.trim().length > 0,
    })
}

export const useGetMediaDetails = <TResponse = unknown>(
    mediaType: string,
    options?: QueryHookOptions<TResponse>,
): ApiQueryResult<TResponse> =>
    useApiQuery<TResponse>(['media', 'details', mediaType], API.media.details(mediaType), options)

export const useGetMediaBackground = <TResponse = unknown>(
    itemType: string,
    mediaType: string,
    options?: QueryHookOptions<TResponse>,
): ApiQueryResult<TResponse> =>
    useApiQuery<TResponse>(
        ['media', 'background', itemType, mediaType],
        API.media.background(itemType, mediaType),
        options,
    )

export const useGetFileDrives = <TResponse = unknown>(
    options?: QueryHookOptions<TResponse>,
): ApiQueryResult<TResponse> => useApiQuery<TResponse>(['files', 'drives'], API.files.drives, options)

export const useGetFileFolder = <TResponse = unknown>(
    options?: QueryHookOptions<TResponse>,
): ApiQueryResult<TResponse> => useApiQuery<TResponse>(['files', 'folder'], API.files.folder, options)

export const useDownloadVideo = <TResponse = unknown>(
    options?: QueryHookOptions<TResponse>,
): ApiQueryResult<TResponse> => useApiQuery<TResponse>(['downloads', 'video'], API.downloads.video, options)

export const useDownloadMusic = <TResponse = unknown>(
    options?: QueryHookOptions<TResponse>,
): ApiQueryResult<TResponse> => useApiQuery<TResponse>(['downloads', 'music'], API.downloads.music, options)

export const useDownloadImage = <TResponse = unknown>(
    options?: QueryHookOptions<TResponse>,
): ApiQueryResult<TResponse> => useApiQuery<TResponse>(['downloads', 'image'], API.downloads.image, options)

export const useGetApiKeyConfiguration = <TResponse = unknown>(
    options?: QueryHookOptions<TResponse>,
): ApiQueryResult<TResponse> =>
    useApiQuery<TResponse>(['configuration', 'apiKey'], API.configuration.apiKey, options)

export const useGetServerStatus = <TResponse = unknown>(
    options?: QueryHookOptions<TResponse>,
): ApiQueryResult<TResponse> => useApiQuery<TResponse>(['servers', 'status'], API.servers.status, options)

export const useGetServerConfig = <TResponse = unknown>(
    options?: QueryHookOptions<TResponse>,
): ApiQueryResult<TResponse> => useApiQuery<TResponse>(['servers', 'config'], API.servers.config, options)

export const useGetServerConfigByKey = <TResponse = unknown>(
    key: string,
    options?: QueryHookOptions<TResponse>,
): ApiQueryResult<TResponse> =>
    useApiQuery<TResponse>(['servers', 'configKey', key], API.servers.configKey(key), options)

export const useUpdateServer = <TResponse = unknown, TBody = unknown>(
    serverId: string,
    options?: MutationHookOptions<TResponse, TBody>,
): ApiMutationResult<TResponse, TBody> =>
    useApiMutation<TResponse, TBody>(['servers', 'update', serverId], API.servers.update(serverId), 'PATCH', asBody, options)

export const useUpdateServerConfig = <TResponse = unknown, TBody = unknown>(
    options?: MutationHookOptions<TResponse, TBody>,
): ApiMutationResult<TResponse, TBody> =>
    useApiMutation<TResponse, TBody>(['servers', 'config'], API.servers.config, 'PATCH', asBody, options)

export const useUpdateServerConfigByKey = <TResponse = unknown, TBody = unknown>(
    key: string,
    options?: MutationHookOptions<TResponse, TBody>,
): ApiMutationResult<TResponse, TBody> =>
    useApiMutation<TResponse, TBody>(['servers', 'configKey', key], API.servers.configKey(key), 'PATCH', asBody, options)

export const useGetImageDirectoryListing = <TResponse = unknown>(
    options?: QueryHookOptions<TResponse>,
): ApiQueryResult<TResponse> =>
    useApiQuery<TResponse>(['images', 'directoryListing'], API.images.directoryListing, options)

export const useGetLocalImage = (
    options?: QueryHookOptions<Blob>,
): ApiQueryResult<Blob> => {
    const { enabled, params, queryKey: customQueryKey, ...queryOptions } = options ?? {}

    const query = useQuery<Blob, Error>({
        queryKey: customQueryKey ?? ['images', 'local', params],
        queryFn: async () => {
            const response = await apiClient.get<Blob>(API.images.local, {
                params,
                responseType: 'blob',
            })

            const contentType = response.headers['content-type']
            if (typeof contentType !== 'string' || !contentType.startsWith('image/')) {
                const errorBody = await response.data.text().catch(() => '')
                throw new Error(errorBody || 'Local image endpoint did not return an image')
            }

            return response.data
        },
        enabled: enabled ?? true,
        ...queryOptions,
    })

    return {
        ...query,
        error: query.error ? getApiErrorMessage(query.error) : null,
        mutate: () => query.refetch(),
    }
}

export const useGetCompressedImage = <TResponse = unknown>(
    options?: QueryHookOptions<TResponse>,
): ApiQueryResult<TResponse> => useApiQuery<TResponse>(['images', 'compressed'], API.images.compressed, options)

export const useGetImageColors = <TResponse = unknown>(
    options?: QueryHookOptions<TResponse>,
): ApiQueryResult<TResponse> => useApiQuery<TResponse>(['images', 'colors'], API.images.colors, options)

export const useGetAnimatedArtwork = (
    options?: QueryHookOptions<Blob>,
): ApiQueryResult<Blob> => {
    const { enabled, params, queryKey: customQueryKey, ...queryOptions } = options ?? {}

    const query = useQuery<Blob, Error>({
        queryKey: customQueryKey ?? ['images', 'animatedArtwork', params],
        queryFn: async () => {
            const response = await apiClient.get<Blob>(API.images.animatedArtwork, {
                params,
                responseType: 'blob',
            })

            const contentType = response.headers['content-type']
            if (typeof contentType !== 'string' || !contentType.startsWith('video/')) {
                throw new Error('Animated artwork endpoint did not return a video')
            }

            return response.data
        },
        enabled: enabled ?? true,
        retry: false,
        ...queryOptions,
    })

    return {
        ...query,
        error: query.error ? getApiErrorMessage(query.error) : null,
        mutate: () => query.refetch(),
    }
}

export const useGetTransparentImage = (
    options?: QueryHookOptions<Blob>,
): ApiQueryResult<Blob> => {
    const { enabled, params, queryKey: customQueryKey, ...queryOptions } = options ?? {}

    const query = useQuery<Blob, Error>({
        queryKey: customQueryKey ?? ['images', 'transparent', params],
        queryFn: async () => {
            const response = await apiClient.get<Blob>(API.images.transparent, {
                params,
                responseType: 'blob',
            })

            return response.data
        },
        enabled: enabled ?? true,
        ...queryOptions,
    })

    return {
        ...query,
        error: query.error ? getApiErrorMessage(query.error) : null,
        mutate: () => query.refetch(),
    }
}

export const useUploadImage = <TResponse = unknown, TBody = unknown>(
    options?: MutationHookOptions<TResponse, TBody>,
): ApiMutationResult<TResponse, TBody> =>
    useApiMutation<TResponse, TBody>(['images', 'upload'], API.images.upload, 'POST', asBody, options)

export const useApplyImageTransparency = <TResponse = unknown, TBody = unknown>(
    options?: MutationHookOptions<TResponse, TBody>,
): ApiMutationResult<TResponse, TBody> =>
    useApiMutation<TResponse, TBody>(['images', 'transparent'], API.images.transparent, 'POST', asBody, options)
