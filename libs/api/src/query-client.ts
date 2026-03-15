import { QueryClient } from '@tanstack/react-query'

export function createSeerialQueryClient(): QueryClient {
    return new QueryClient({
        defaultOptions: {
            queries: {
                refetchOnWindowFocus: false,
                staleTime: 30_000,
            },
            mutations: {
                retry: 1,
            },
        },
    })
}
