/**
 * Shared Axios clients and request helpers.
 */

import axios, { type AxiosInstance } from 'axios'
import { API, type HttpMethod } from './endpoints'

export const DEFAULT_API_BASE_URL = '/api'

let apiBaseUrlResolver: (() => string) | null = null

function safeGetLocalStorageValue(key: string): string | null {
    if (typeof window === 'undefined' || !window.localStorage) {
        return null
    }

    try {
        return window.localStorage.getItem(key)
    } catch {
        return null
    }
}

export function getInitialBaseUrl(): string {
    if (apiBaseUrlResolver) {
        return apiBaseUrlResolver()
    }

    const raw = safeGetLocalStorageValue('auth:server')
    if (!raw) {
        return DEFAULT_API_BASE_URL
    }

    try {
        const server = JSON.parse(raw) as { url?: string }
        return server.url ? `${server.url}/api` : DEFAULT_API_BASE_URL
    } catch {
        return DEFAULT_API_BASE_URL
    }
}

export function setApiBaseUrlResolver(resolver: (() => string) | null): void {
    apiBaseUrlResolver = resolver
    const baseUrl = getInitialBaseUrl()
    apiClient.defaults.baseURL = baseUrl
    publicApiClient.defaults.baseURL = baseUrl
}

export const apiClient: AxiosInstance = axios.create({
    baseURL: getInitialBaseUrl(),
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true,
})

export const publicApiClient: AxiosInstance = axios.create({
    baseURL: getInitialBaseUrl(),
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: false,
})

export function setApiBaseUrl(serverUrl: string): void {
    const baseUrl = `${serverUrl}/api`
    apiClient.defaults.baseURL = baseUrl
    publicApiClient.defaults.baseURL = baseUrl
}

export function setPublicApiBaseUrl(serverUrl: string): void {
    publicApiClient.defaults.baseURL = `${serverUrl}/api`
}

export function createServerClient(serverUrl: string): AxiosInstance {
    return axios.create({
        baseURL: `${serverUrl}/api`,
        headers: { 'Content-Type': 'application/json' },
        withCredentials: false,
    })
}

export function createAbsoluteServerClient(serverUrl: string): AxiosInstance {
    return createServerClient(serverUrl)
}

export async function authenticatedFetch<TResponse>(
    url: string,
    method: HttpMethod = 'GET',
    body?: unknown,
): Promise<TResponse> {
    const config = { method, url }

    if (body && method !== 'GET') {
        const response = await apiClient.request<TResponse>({ ...config, data: body })
        return response.data
    }

    const response = await apiClient.request<TResponse>(config)
    return response.data
}

export const authenticatedFetcher = async <TResponse>(url: string): Promise<TResponse> => {
    const response = await apiClient.get<TResponse>(url)
    return response.data
}

export const fetcherWithParams = async <TResponse, TParams>([
    url,
    params,
]: [string, TParams]): Promise<TResponse> => {
    const response = await apiClient.get<TResponse>(url, { params })
    return response.data
}

export const api = {
    get: async <TResponse, TParams = Record<string, unknown>>(
        url: string,
        params?: TParams,
    ): Promise<TResponse> => {
        const response = await apiClient.get<TResponse>(url, { params })
        return response.data
    },

    post: async <TResponse, TBody = unknown>(url: string, data?: TBody): Promise<TResponse> => {
        const response = await apiClient.post<TResponse>(url, data)
        return response.data
    },

    put: async <TResponse, TBody = unknown>(url: string, data?: TBody): Promise<TResponse> => {
        const response = await apiClient.put<TResponse>(url, data)
        return response.data
    },

    patch: async <TResponse, TBody = unknown>(url: string, data?: TBody): Promise<TResponse> => {
        const response = await apiClient.patch<TResponse>(url, data)
        return response.data
    },

    delete: async <TResponse>(url: string): Promise<TResponse> => {
        const response = await apiClient.delete<TResponse>(url)
        return response.data
    },
}

type ServerConfigResponse<TConfig> = { data?: TConfig } | TConfig

type ServerConfigValueResponse<TValue> = { data?: { value?: TValue } } | { value?: TValue }

export async function getServerConfig<TConfig>(): Promise<TConfig> {
    const response = await api.get<ServerConfigResponse<TConfig>>(API.servers.config)
    return ((response as { data?: TConfig })?.data ?? response) as TConfig
}

export async function getServerConfigValue<TValue>(
    key: string,
    defaultValue: TValue,
): Promise<TValue> {
    const response = await api.get<ServerConfigValueResponse<TValue>>(API.servers.configKey(key))
    const payload =
        (response as { data?: { value?: TValue } })?.data ??
        (response as { value?: TValue })

    return payload?.value ?? defaultValue
}

export async function patchServerConfig(
    key: string,
    value: unknown,
): Promise<void> {
    await api.patch(API.servers.config, { [key]: value })
}

interface SignedStreamUrlResponse {
    data?: string
}

interface SignedStreamUrlRequest {
    filePath: string
    start?: number
    audio?: number
    expiresIn?: string
}

export async function getSignedVideoStreamUrl(
    request: SignedStreamUrlRequest,
): Promise<string> {
    const response = await authenticatedFetch<SignedStreamUrlResponse>(
        API.videoStreaming.signedUrl,
        'POST',
        request,
    )

    return response.data ? `/api${response.data}` : ''
}
