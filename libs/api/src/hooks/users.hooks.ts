import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query'
import { API } from '../endpoints'
import { asBody, asVoid, type MutationHookOptions, type QueryHookOptions, useApiMutation, useApiQuery } from './common'

export const useGetUsersPublic = <TResponse = unknown>(
    options?: QueryHookOptions<TResponse>,
): UseQueryResult<TResponse> => useApiQuery<TResponse>(['users', 'findAllPublic'], API.users.findAllPublic, options)

export const useCreateUser = <TResponse = unknown, TBody = unknown>(
    options?: MutationHookOptions<TResponse, TBody>,
): UseMutationResult<TResponse, Error, TBody> =>
    useApiMutation<TResponse, TBody>(['users', 'create'], API.users.create, 'POST', asBody, options)

export const useUpdateUser = <TResponse = unknown, TBody = unknown>(
    userId: string,
    options?: MutationHookOptions<TResponse, TBody>,
): UseMutationResult<TResponse, Error, TBody> =>
    useApiMutation<TResponse, TBody>(['users', 'update', userId], API.users.update(userId), 'PUT', asBody, options)

export const useDeleteUser = <TResponse = unknown>(
    userId: string,
    options?: MutationHookOptions<TResponse, void>,
): UseMutationResult<TResponse, Error, void> =>
    useApiMutation<TResponse, void>(['users', 'delete', userId], API.users.delete(userId), 'DELETE', asVoid, options)

export const useLogin = <TResponse = unknown, TBody = unknown>(
    options?: MutationHookOptions<TResponse, TBody>,
): UseMutationResult<TResponse, Error, TBody> =>
    useApiMutation<TResponse, TBody>(['users', 'login'], API.users.login, 'POST', asBody, options)
