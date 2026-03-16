import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query'
import { API } from '../endpoints'
import { asBody, asVoid, type MutationHookOptions, type QueryHookOptions, useApiMutation, useApiQuery } from './common'

export const useGetSeries = <TResponse = unknown>(
    seriesId: string,
    options?: QueryHookOptions<TResponse>,
): UseQueryResult<TResponse> => useApiQuery<TResponse>(['series', 'get', seriesId], API.series.get(seriesId), options)

export const useSearchSeries = <TResponse = unknown>(
    options?: QueryHookOptions<TResponse>,
): UseQueryResult<TResponse> => useApiQuery<TResponse>(['series', 'search'], API.series.search, options)

export const useSearchSeriesEpisodeGroups = <TResponse = unknown>(
    options?: QueryHookOptions<TResponse>,
): UseQueryResult<TResponse> =>
    useApiQuery<TResponse>(['series', 'searchEpisodeGroups'], API.series.searchEpisodeGroups, options)

export const useGetSeriesRemainingEpisodes = <TResponse = unknown>(
    seriesId: string,
    options?: QueryHookOptions<TResponse>,
): UseQueryResult<TResponse> =>
    useApiQuery<TResponse>(['series', 'remainingEpisodes', seriesId], API.series.remainingEpisodes(seriesId), options)

export const useRefreshSeriesMetadata = <TResponse = unknown, TBody = unknown>(
    options?: MutationHookOptions<TResponse, TBody>,
): UseMutationResult<TResponse, Error, TBody> =>
    useApiMutation<TResponse, TBody>(['series', 'refreshMetadata'], API.series.refreshMetadata, 'POST', asBody, options)

export const useUpdateSeriesShowId = <TResponse = unknown, TBody = unknown>(
    options?: MutationHookOptions<TResponse, TBody>,
): UseMutationResult<TResponse, Error, TBody> =>
    useApiMutation<TResponse, TBody>(['series', 'updateShowId'], API.series.updateShowId, 'PATCH', asBody, options)

export const useUpdateSeriesEpisodeGroup = <TResponse = unknown, TBody = unknown>(
    seriesId: string,
    options?: MutationHookOptions<TResponse, TBody>,
): UseMutationResult<TResponse, Error, TBody> =>
    useApiMutation<TResponse, TBody>(
        ['series', 'updateEpisodeGroup', seriesId],
        API.series.updateEpisodeGroup(seriesId),
        'PATCH',
        asBody,
        options,
    )

export const useUpdateSeries = <TResponse = unknown, TBody = unknown>(
    seriesId: string,
    options?: MutationHookOptions<TResponse, TBody>,
): UseMutationResult<TResponse, Error, TBody> =>
    useApiMutation<TResponse, TBody>(['series', 'update', seriesId], API.series.update(seriesId), 'PUT', asBody, options)

export const useDeleteSeries = <TResponse = unknown>(
    seriesId: string,
    options?: MutationHookOptions<TResponse, void>,
): UseMutationResult<TResponse, Error, void> =>
    useApiMutation<TResponse, void>(['series', 'delete', seriesId], API.series.delete(seriesId), 'DELETE', asVoid, options)

export const useSetSeriesWatchState = <TResponse = unknown, TBody = unknown>(
    seriesId: string,
    options?: MutationHookOptions<TResponse, TBody>,
): UseMutationResult<TResponse, Error, TBody> =>
    useApiMutation<TResponse, TBody>(
        ['series', 'setWatchState', seriesId],
        API.series.setWatchState(seriesId),
        'POST',
        asBody,
        options,
    )

export const useSetSeriesMyListState = <TResponse = unknown, TBody = unknown>(
    seriesId: string,
    options?: MutationHookOptions<TResponse, TBody>,
): UseMutationResult<TResponse, Error, TBody> =>
    useApiMutation<TResponse, TBody>(['series', 'myList', seriesId], API.series.myList(seriesId), 'POST', asBody, options)

export const useGetSeason = <TResponse = unknown>(
    seasonId: string,
    include?: string,
    options?: QueryHookOptions<TResponse>,
): UseQueryResult<TResponse> =>
    useApiQuery<TResponse>(['seasons', 'get', seasonId, include], API.seasons.get(seasonId, include), options)

export const useUpdateSeason = <TResponse = unknown, TBody = unknown>(
    seasonId: string,
    options?: MutationHookOptions<TResponse, TBody>,
): UseMutationResult<TResponse, Error, TBody> =>
    useApiMutation<TResponse, TBody>(['seasons', 'update', seasonId], API.seasons.update(seasonId), 'PUT', asBody, options)

export const useDeleteSeason = <TResponse = unknown>(
    seasonId: string,
    options?: MutationHookOptions<TResponse, void>,
): UseMutationResult<TResponse, Error, void> =>
    useApiMutation<TResponse, void>(['seasons', 'delete', seasonId], API.seasons.delete(seasonId), 'DELETE', asVoid, options)

export const useSetSeasonWatchState = <TResponse = unknown, TBody = unknown>(
    seasonId: string,
    options?: MutationHookOptions<TResponse, TBody>,
): UseMutationResult<TResponse, Error, TBody> =>
    useApiMutation<TResponse, TBody>(
        ['seasons', 'setWatchState', seasonId],
        API.seasons.setWatchState(seasonId),
        'POST',
        asBody,
        options,
    )

export const useGetEpisode = <TResponse = unknown>(
    episodeId: string,
    options?: QueryHookOptions<TResponse>,
): UseQueryResult<TResponse> => useApiQuery<TResponse>(['episodes', 'get', episodeId], API.episodes.get(episodeId), options)

export const useUpdateEpisode = <TResponse = unknown, TBody = unknown>(
    episodeId: string,
    options?: MutationHookOptions<TResponse, TBody>,
): UseMutationResult<TResponse, Error, TBody> =>
    useApiMutation<TResponse, TBody>(['episodes', 'update', episodeId], API.episodes.update(episodeId), 'PUT', asBody, options)

export const useDeleteEpisode = <TResponse = unknown>(
    episodeId: string,
    options?: MutationHookOptions<TResponse, void>,
): UseMutationResult<TResponse, Error, void> =>
    useApiMutation<TResponse, void>(['episodes', 'delete', episodeId], API.episodes.delete(episodeId), 'DELETE', asVoid, options)

export const useSetEpisodeWatchState = <TResponse = unknown, TBody = unknown>(
    episodeId: string,
    options?: MutationHookOptions<TResponse, TBody>,
): UseMutationResult<TResponse, Error, TBody> =>
    useApiMutation<TResponse, TBody>(
        ['episodes', 'setWatchState', episodeId],
        API.episodes.setWatchState(episodeId),
        'POST',
        asBody,
        options,
    )
