import { API } from '../endpoints'
import { type ApiMutationResult, type ApiQueryResult, asBody, asVoid, type MutationHookOptions, type QueryHookOptions, useApiMutation, useApiQuery } from './common'

export const useGetMovie = <TResponse = unknown>(
    movieId: string,
    options?: QueryHookOptions<TResponse>,
): ApiQueryResult<TResponse> => useApiQuery<TResponse>(['movies', 'get', movieId], API.movies.get(movieId), options)

export const useSearchMovies = <TResponse = unknown>(
    options?: QueryHookOptions<TResponse>,
): ApiQueryResult<TResponse> => useApiQuery<TResponse>(['movies', 'search'], API.movies.search, options)

export const useGetMoviesImdbScore = <TResponse = unknown>(
    options?: QueryHookOptions<TResponse>,
): ApiQueryResult<TResponse> => useApiQuery<TResponse>(['movies', 'imdbScore'], API.movies.imdbScore, options)

export const useGetMovieRemainingVideos = <TResponse = unknown>(
    movieId: string,
    options?: QueryHookOptions<TResponse>,
): ApiQueryResult<TResponse> =>
    useApiQuery<TResponse>(['movies', 'remainingVideos', movieId], API.movies.remainingVideos(movieId), options)

export const useRefreshMovieMetadata = <TResponse = unknown>(
    movieId: string,
    options?: MutationHookOptions<TResponse, void>,
): ApiMutationResult<TResponse, void> =>
    useApiMutation<TResponse, void>(
        ['movies', 'refreshMetadata', movieId],
        API.movies.refreshMetadata(movieId),
        'POST',
        asVoid,
        options,
    )

export const useChangeMovieIdentification = <TResponse = unknown, TBody = unknown>(
    movieId: string,
    options?: MutationHookOptions<TResponse, TBody>,
): ApiMutationResult<TResponse, TBody> =>
    useApiMutation<TResponse, TBody>(
        ['movies', 'changeIdentification', movieId],
        API.movies.changeIdentification(movieId),
        'POST',
        asBody,
        options,
    )

export const useUpdateMovie = <TResponse = unknown, TBody = unknown>(
    movieId: string,
    options?: MutationHookOptions<TResponse, TBody>,
): ApiMutationResult<TResponse, TBody> =>
    useApiMutation<TResponse, TBody>(['movies', 'update', movieId], API.movies.update(movieId), 'PATCH', asBody, options)

export const useDeleteMovie = <TResponse = unknown>(
    movieId: string,
    options?: MutationHookOptions<TResponse, void>,
): ApiMutationResult<TResponse, void> =>
    useApiMutation<TResponse, void>(['movies', 'delete', movieId], API.movies.delete(movieId), 'DELETE', asVoid, options)

export const useSetMovieWatchState = <TResponse = unknown, TBody = unknown>(
    movieId: string,
    options?: MutationHookOptions<TResponse, TBody>,
): ApiMutationResult<TResponse, TBody> =>
    useApiMutation<TResponse, TBody>(
        ['movies', 'setWatchState', movieId],
        API.movies.setWatchState(movieId),
        'POST',
        asBody,
        options,
    )