import { API } from '../endpoints'
import { type ApiMutationResult, asBody, type MutationHookOptions, useApiMutation } from './common'

interface UpdateWatchStateParams {
    videoId: string
    timeWatched: number
    watched: boolean
    userId: string
}

export const useUpdateVideoWatchState = <TResponse = unknown>(
    options?: MutationHookOptions<TResponse, UpdateWatchStateParams>,
): ApiMutationResult<TResponse, UpdateWatchStateParams> =>
    useApiMutation<TResponse, UpdateWatchStateParams>(
        ['watchLists', 'updateWatchState'],
        API.watchLists.updateWatchState,
        'PUT',
        asBody,
        options,
    )
