import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query'
import { API } from '../endpoints'
import { asBody, asVoid, type MutationHookOptions, type QueryHookOptions, useApiMutation, useApiQuery } from './common'

export const useGetLibraries = <TResponse = unknown>(
    options?: QueryHookOptions<TResponse>,
): UseQueryResult<TResponse> => useApiQuery<TResponse>(['libraries', 'getAll'], API.libraries.getAll, options)

export const useGetLibrary = <TResponse = unknown>(
    libraryId: string,
    options?: QueryHookOptions<TResponse>,
): UseQueryResult<TResponse> => useApiQuery<TResponse>(['libraries', 'getById', libraryId], API.libraries.getById(libraryId), options)

export const useGetLibraryContent = <TResponse = unknown>(
    libraryId: string,
    options?: QueryHookOptions<TResponse>,
): UseQueryResult<TResponse> =>
    useApiQuery<TResponse>(['libraries', 'content', libraryId], API.libraries.content(libraryId), options)

export const useCreateLibrary = <TResponse = unknown, TBody = unknown>(
    options?: MutationHookOptions<TResponse, TBody>,
): UseMutationResult<TResponse, Error, TBody> =>
    useApiMutation<TResponse, TBody>(['libraries', 'create'], API.libraries.create, 'POST', asBody, options)

export const useUpdateLibrary = <TResponse = unknown, TBody = unknown>(
    libraryId: string,
    options?: MutationHookOptions<TResponse, TBody>,
): UseMutationResult<TResponse, Error, TBody> =>
    useApiMutation<TResponse, TBody>(['libraries', 'update', libraryId], API.libraries.update(libraryId), 'PUT', asBody, options)

export const useDeleteLibrary = <TResponse = unknown>(
    libraryId: string,
    options?: MutationHookOptions<TResponse, void>,
): UseMutationResult<TResponse, Error, void> =>
    useApiMutation<TResponse, void>(['libraries', 'delete', libraryId], API.libraries.delete(libraryId), 'DELETE', asVoid, options)

export const useScanLibrary = <TResponse = unknown, TBody = unknown>(
    libraryId: string,
    options?: MutationHookOptions<TResponse, TBody>,
): UseMutationResult<TResponse, Error, TBody> =>
    useApiMutation<TResponse, TBody>(['libraries', 'scan', libraryId], API.libraries.scan(libraryId), 'POST', asBody, options)

export const useReorderLibraries = <TResponse = unknown, TBody = unknown>(
    options?: MutationHookOptions<TResponse, TBody>,
): UseMutationResult<TResponse, Error, TBody> =>
    useApiMutation<TResponse, TBody>(['libraries', 'reorder'], API.libraries.reorder, 'PATCH', asBody, options)

export const useReorderLibraryItems = <TResponse = unknown, TBody = unknown>(
    libraryId: string,
    options?: MutationHookOptions<TResponse, TBody>,
): UseMutationResult<TResponse, Error, TBody> =>
    useApiMutation<TResponse, TBody>(
        ['libraries', 'reorderItems', libraryId],
        API.libraries.reorderItems(libraryId),
        'PATCH',
        asBody,
        options,
    )

export const useGetPlaylists = <TResponse = unknown>(
    options?: QueryHookOptions<TResponse>,
): UseQueryResult<TResponse> => useApiQuery<TResponse>(['playlists', 'getAll'], API.playlists.getAll, options)

export const useGetPlaylist = <TResponse = unknown>(
    playlistId: string,
    options?: QueryHookOptions<TResponse>,
): UseQueryResult<TResponse> =>
    useApiQuery<TResponse>(['playlists', 'getById', playlistId], API.playlists.getById(playlistId), options)

export const useCreatePlaylist = <TResponse = unknown, TBody = unknown>(
    options?: MutationHookOptions<TResponse, TBody>,
): UseMutationResult<TResponse, Error, TBody> =>
    useApiMutation<TResponse, TBody>(['playlists', 'create'], API.playlists.create, 'POST', asBody, options)

export const useUpdatePlaylist = <TResponse = unknown, TBody = unknown>(
    playlistId: string,
    options?: MutationHookOptions<TResponse, TBody>,
): UseMutationResult<TResponse, Error, TBody> =>
    useApiMutation<TResponse, TBody>(['playlists', 'update', playlistId], API.playlists.update(playlistId), 'PUT', asBody, options)

export const useDeletePlaylist = <TResponse = unknown>(
    playlistId: string,
    options?: MutationHookOptions<TResponse, void>,
): UseMutationResult<TResponse, Error, void> =>
    useApiMutation<TResponse, void>(['playlists', 'delete', playlistId], API.playlists.delete(playlistId), 'DELETE', asVoid, options)

export const useAddSongToPlaylist = <TResponse = unknown, TBody = unknown>(
    playlistId: string,
    options?: MutationHookOptions<TResponse, TBody>,
): UseMutationResult<TResponse, Error, TBody> =>
    useApiMutation<TResponse, TBody>(
        ['playlists', 'addSong', playlistId],
        API.playlists.addSong(playlistId),
        'POST',
        asBody,
        options,
    )

export const useRemoveSongFromPlaylist = <TResponse = unknown>(
    playlistId: string,
    songId: string,
    options?: MutationHookOptions<TResponse, void>,
): UseMutationResult<TResponse, Error, void> =>
    useApiMutation<TResponse, void>(
        ['playlists', 'removeSong', playlistId, songId],
        API.playlists.removeSong(playlistId, songId),
        'DELETE',
        asVoid,
        options,
    )

export const useGetMyListMovies = <TResponse = unknown>(
    options?: QueryHookOptions<TResponse>,
): UseQueryResult<TResponse> => useApiQuery<TResponse>(['myList', 'movies'], API.myList.movies, options)

export const useGetMyListSeries = <TResponse = unknown>(
    options?: QueryHookOptions<TResponse>,
): UseQueryResult<TResponse> => useApiQuery<TResponse>(['myList', 'series'], API.myList.series, options)

export const useIsMovieInMyList = <TResponse = unknown>(
    movieId: string,
    options?: QueryHookOptions<TResponse>,
): UseQueryResult<TResponse> =>
    useApiQuery<TResponse>(['myList', 'isMovieInList', movieId], API.myList.isMovieInList(movieId), options)

export const useIsSeriesInMyList = <TResponse = unknown>(
    seriesId: string,
    options?: QueryHookOptions<TResponse>,
): UseQueryResult<TResponse> =>
    useApiQuery<TResponse>(['myList', 'isSeriesInList', seriesId], API.myList.isSeriesInList(seriesId), options)

export const useGetContinueWatching = <TResponse = unknown>(
    options?: QueryHookOptions<TResponse>,
): UseQueryResult<TResponse> =>
    useApiQuery<TResponse>(['continueWatching', 'getVideos'], API.continueWatching.getVideos, options)

export const useGetCollection = <TResponse = unknown>(
    collectionId: string,
    options?: QueryHookOptions<TResponse>,
): UseQueryResult<TResponse> =>
    useApiQuery<TResponse>(['collections', 'get', collectionId], API.collections.get(collectionId), options)

export const useGetCollectionMusicExtras = <TResponse = unknown>(
    collectionId: string,
    options?: QueryHookOptions<TResponse>,
): UseQueryResult<TResponse> =>
    useApiQuery<TResponse>(
        ['collections', 'musicExtras', collectionId],
        API.collections.musicExtras(collectionId),
        options,
    )

export const useReorderCollectionContent = <TResponse = unknown, TBody = unknown>(
    collectionId: string,
    options?: MutationHookOptions<TResponse, TBody>,
): UseMutationResult<TResponse, Error, TBody> =>
    useApiMutation<TResponse, TBody>(
        ['collections', 'reorderContent', collectionId],
        API.collections.reorderContent(collectionId),
        'PATCH',
        asBody,
        options,
    )

export const useUpdateCollection = <TResponse = unknown, TBody = unknown>(
    collectionId: string,
    options?: MutationHookOptions<TResponse, TBody>,
): UseMutationResult<TResponse, Error, TBody> =>
    useApiMutation<TResponse, TBody>(
        ['collections', 'update', collectionId],
        API.collections.update(collectionId),
        'PUT',
        asBody,
        options,
    )

export const useDeleteCollection = <TResponse = unknown>(
    collectionId: string,
    options?: MutationHookOptions<TResponse, void>,
): UseMutationResult<TResponse, Error, void> =>
    useApiMutation<TResponse, void>(
        ['collections', 'delete', collectionId],
        API.collections.delete(collectionId),
        'DELETE',
        asVoid,
        options,
    )

export const useUpdateWatchListState = <TResponse = unknown, TBody = unknown>(
    options?: MutationHookOptions<TResponse, TBody>,
): UseMutationResult<TResponse, Error, TBody> =>
    useApiMutation<TResponse, TBody>(['watchLists', 'updateWatchState'], API.watchLists.updateWatchState, 'POST', asBody, options)
