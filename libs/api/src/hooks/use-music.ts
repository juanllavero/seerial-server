import type { UseMutationResult } from '@tanstack/react-query'
import { API } from '../endpoints'
import { type ApiQueryResult, asBody, asVoid, type MutationHookOptions, type QueryHookOptions, useApiMutation, useApiQuery } from './common'

export const useGetSongLyrics = <TResponse = unknown>(
    songId: string,
    options?: QueryHookOptions<TResponse>,
): ApiQueryResult<TResponse> => useApiQuery<TResponse>(['songs', 'lyrics', songId], API.songs.lyrics(songId), options)

export const useStreamSong = <TResponse = unknown>(
    options?: QueryHookOptions<TResponse>,
): ApiQueryResult<TResponse> => useApiQuery<TResponse>(['songs', 'stream'], API.songs.stream, options)

export const useUpdateSong = <TResponse = unknown, TBody = unknown>(
    songId: string,
    options?: MutationHookOptions<TResponse, TBody>,
): UseMutationResult<TResponse, Error, TBody> =>
    useApiMutation<TResponse, TBody>(['songs', 'update', songId], API.songs.update(songId), 'PUT', asBody, options)

export const useDeleteSong = <TResponse = unknown>(
    songId: string,
    options?: MutationHookOptions<TResponse, void>,
): UseMutationResult<TResponse, Error, void> =>
    useApiMutation<TResponse, void>(['songs', 'delete', songId], API.songs.delete(songId), 'DELETE', asVoid, options)

export const useAddSongLyrics = <TResponse = unknown, TBody = unknown>(
    options?: MutationHookOptions<TResponse, TBody>,
): UseMutationResult<TResponse, Error, TBody> =>
    useApiMutation<TResponse, TBody>(['songs', 'addLyrics'], API.songs.addLyrics, 'POST', asBody, options)

export const useGetArtist = <TResponse = unknown>(
    artistId: string,
    options?: QueryHookOptions<TResponse>,
): ApiQueryResult<TResponse> =>
    useApiQuery<TResponse>(['artists', 'getById', artistId], API.artists.getById(artistId), options)

export const useCreateArtist = <TResponse = unknown, TBody = unknown>(
    options?: MutationHookOptions<TResponse, TBody>,
): UseMutationResult<TResponse, Error, TBody> =>
    useApiMutation<TResponse, TBody>(['artists', 'create'], API.artists.create, 'POST', asBody, options)

export const useUpdateArtist = <TResponse = unknown, TBody = unknown>(
    artistId: string,
    options?: MutationHookOptions<TResponse, TBody>,
): UseMutationResult<TResponse, Error, TBody> =>
    useApiMutation<TResponse, TBody>(['artists', 'update', artistId], API.artists.update(artistId), 'PUT', asBody, options)

export const useDeleteArtist = <TResponse = unknown>(
    artistId: string,
    options?: MutationHookOptions<TResponse, void>,
): UseMutationResult<TResponse, Error, void> =>
    useApiMutation<TResponse, void>(['artists', 'delete', artistId], API.artists.delete(artistId), 'DELETE', asVoid, options)

export const useGetAlbum = <TResponse = unknown>(
    albumId: string,
    options?: QueryHookOptions<TResponse>,
): ApiQueryResult<TResponse> => useApiQuery<TResponse>(['albums', 'get', albumId], API.albums.get(albumId), options)

export const useUpdateAlbum = <TResponse = unknown, TBody = unknown>(
    albumId: string,
    options?: MutationHookOptions<TResponse, TBody>,
): UseMutationResult<TResponse, Error, TBody> =>
    useApiMutation<TResponse, TBody>(['albums', 'update', albumId], API.albums.update(albumId), 'PUT', asBody, options)

export const useDeleteAlbum = <TResponse = unknown>(
    albumId: string,
    options?: MutationHookOptions<TResponse, void>,
): UseMutationResult<TResponse, Error, void> =>
    useApiMutation<TResponse, void>(['albums', 'delete', albumId], API.albums.delete(albumId), 'DELETE', asVoid, options)
