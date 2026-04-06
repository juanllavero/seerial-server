import { API } from '../endpoints'
import { type ApiMutationResult, type ApiQueryResult, asBody, asVoid, type MutationHookOptions, type QueryHookOptions, useApiMutation, useApiQuery } from './common'

export const useGetVideo = <TResponse = unknown>(
    videoId: string,
    options?: QueryHookOptions<TResponse>,
): ApiQueryResult<TResponse> => useApiQuery<TResponse>(['videos', 'get', videoId], API.videos.get(videoId), options)

export const useGetVideoPlaybackInfo = <TResponse = unknown>(
    videoId: string,
    options?: QueryHookOptions<TResponse>,
): ApiQueryResult<TResponse> =>
    useApiQuery<TResponse>(['videos', 'getPlaybackInfo', videoId], API.videos.getPlaybackInfo(videoId), options)

export const useGetVideoByEpisodeId = <TResponse = unknown>(
    episodeId: string,
    options?: QueryHookOptions<TResponse>,
): ApiQueryResult<TResponse> =>
    useApiQuery<TResponse>(['videos', 'getByEpisodeId', episodeId], API.videos.getByEpisodeId(episodeId), options)

export const useGetVideoMediaInfo = <TResponse = unknown>(
    videoId: string,
    options?: QueryHookOptions<TResponse>,
): ApiQueryResult<TResponse> =>
    useApiQuery<TResponse>(['videos', 'getMediaInfo', videoId], API.videos.getMediaInfo(videoId), options)

export const useGetVideoThumbnail = <TResponse = unknown>(
    options?: QueryHookOptions<TResponse>,
): ApiQueryResult<TResponse> => useApiQuery<TResponse>(['videos', 'thumbnail'], API.videos.thumbnail, options)

export const useGetVideoSubtitles = <TResponse = unknown>(
    options?: QueryHookOptions<TResponse>,
): ApiQueryResult<TResponse> => useApiQuery<TResponse>(['videos', 'subtitles'], API.videos.subtitles, options)

export const useUpdateVideo = <TResponse = unknown, TBody = unknown>(
    videoId: string,
    options?: MutationHookOptions<TResponse, TBody>,
): ApiMutationResult<TResponse, TBody> =>
    useApiMutation<TResponse, TBody>(['videos', 'update', videoId], API.videos.update(videoId), 'PATCH', asBody, options)

export const useDeleteVideo = <TResponse = unknown>(
    videoId: string,
    options?: MutationHookOptions<TResponse, void>,
): ApiMutationResult<TResponse, void> =>
    useApiMutation<TResponse, void>(['videos', 'delete', videoId], API.videos.delete(videoId), 'DELETE', asVoid, options)

export const useUpdateVideoMediaInfo = <TResponse = unknown>(
    videoId: string,
    options?: MutationHookOptions<TResponse, void>,
): ApiMutationResult<TResponse, void> =>
    useApiMutation<TResponse, void>(
        ['videos', 'updateMediaInfo', videoId],
        API.videos.updateMediaInfo(videoId),
        'GET',
        asVoid,
        options,
    )

export const useSetVideoWatchState = <TResponse = unknown, TBody = unknown>(
    videoId: string,
    options?: MutationHookOptions<TResponse, TBody>,
): ApiMutationResult<TResponse, TBody> =>
    useApiMutation<TResponse, TBody>(
        ['videos', 'setWatchState', videoId],
        API.videos.setWatchState(videoId),
        'POST',
        asBody,
        options,
    )

export const useGetVideoTranscodedUrl = <TResponse = unknown>(
    options?: QueryHookOptions<TResponse>,
): ApiQueryResult<TResponse> =>
    useApiQuery<TResponse>(['videoStreaming', 'transcodedUrl'], API.videoStreaming.transcodedUrl, options)

export const useGetVideoPassthroughUrl = <TResponse = unknown>(
    options?: QueryHookOptions<TResponse>,
): ApiQueryResult<TResponse> =>
    useApiQuery<TResponse>(['videoStreaming', 'passthroughUrl'], API.videoStreaming.passthroughUrl, options)

export const useGetVideoTranscodedStream = <TResponse = unknown>(
    options?: QueryHookOptions<TResponse>,
): ApiQueryResult<TResponse> =>
    useApiQuery<TResponse>(['videoStreaming', 'transcoded'], API.videoStreaming.transcoded, options)

export const useGetVideoPassthroughStream = <TResponse = unknown>(
    options?: QueryHookOptions<TResponse>,
): ApiQueryResult<TResponse> =>
    useApiQuery<TResponse>(['videoStreaming', 'passthrough'], API.videoStreaming.passthrough, options)
