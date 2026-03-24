/**
 * Shared Axios clients and request helpers.
 */

import axios, { AxiosHeaders, type AxiosInstance } from 'axios'
import { API, type HttpMethod } from './endpoints'

export const DEFAULT_API_BASE_URL = '/api'

let apiBaseUrlResolver: (() => string) | null = null

type UnknownObject = Record<string, unknown>

interface ApiEnvelope<TData = unknown> {
    success?: boolean
    message?: string
    data?: TData
    timestamp?: string
}

function isObject(value: unknown): value is UnknownObject {
    return typeof value === 'object' && value !== null
}

function isApiEnvelope(value: unknown): value is ApiEnvelope {
    if (!isObject(value)) {
        return false
    }

    return 'success' in value || 'message' in value || 'timestamp' in value
}

export function getApiErrorMessage(error: unknown, fallback = 'Request failed'): string {
    if (axios.isAxiosError(error)) {
        const payload = error.response?.data

        if (isApiEnvelope(payload) && typeof payload.message === 'string' && payload.message.length > 0) {
            return payload.message
        }

        if (isObject(payload)) {
            const message = payload.message
            const altError = payload.error

            if (typeof message === 'string' && message.length > 0) {
                return message
            }

            if (typeof altError === 'string' && altError.length > 0) {
                return altError
            }
        }

        if (typeof error.message === 'string' && error.message.length > 0) {
            return error.message
        }

        return fallback
    }

    if (error instanceof Error) {
        return error.message
    }

    if (typeof error === 'string' && error.length > 0) {
        return error
    }

    return fallback
}

export function unwrapApiPayload<TResponse>(payload: unknown): TResponse {
    if (!isApiEnvelope(payload)) {
        return payload as TResponse
    }

    if (payload.success === false) {
        throw new Error(payload.message ?? 'Request failed')
    }

    return payload.data as TResponse
}

function safeGetCookieValue(name: string): string | null {
    if (typeof document === 'undefined') {
        return null
    }

    try {
        const target = `${name}=`
        const cookies = document.cookie.split(';')

        for (const entry of cookies) {
            const cookie = entry.trim()
            if (cookie.startsWith(target)) {
                return decodeURIComponent(cookie.slice(target.length))
            }
        }

        return null
    } catch {
        return null
    }
}

function getAuthToken(): string | null {
    const fromStorage = safeGetLocalStorageValue('auth:token')
    if (fromStorage) {
        return fromStorage
    }

    return safeGetCookieValue('token')
}

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

apiClient.interceptors.request.use((config) => {
    const token = getAuthToken()
    const headers = AxiosHeaders.from(config.headers)

    if (token && !headers.has('Authorization')) {
        headers.set('Authorization', `Bearer ${token}`)
    }

    config.headers = headers
    config.withCredentials = true
    return config
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
        return unwrapApiPayload<TResponse>(response.data)
    }

    const response = await apiClient.request<TResponse>(config)
    return unwrapApiPayload<TResponse>(response.data)
}

export const authenticatedFetcher = async <TResponse>(url: string): Promise<TResponse> => {
    const response = await apiClient.get<TResponse>(url)
    return unwrapApiPayload<TResponse>(response.data)
}

export const fetcherWithParams = async <TResponse, TParams>([
    url,
    params,
]: [string, TParams]): Promise<TResponse> => {
    const response = await apiClient.get<TResponse>(url, { params })
    return unwrapApiPayload<TResponse>(response.data)
}

export const api = {
    get: async <TResponse, TParams = Record<string, unknown>>(
        url: string,
        params?: TParams,
    ): Promise<TResponse> => {
        const response = await apiClient.get<TResponse>(url, { params })
        return unwrapApiPayload<TResponse>(response.data)
    },

    post: async <TResponse, TBody = unknown>(url: string, data?: TBody): Promise<TResponse> => {
        const response = await apiClient.post<TResponse>(url, data)
        return unwrapApiPayload<TResponse>(response.data)
    },

    put: async <TResponse, TBody = unknown>(url: string, data?: TBody): Promise<TResponse> => {
        const response = await apiClient.put<TResponse>(url, data)
        return unwrapApiPayload<TResponse>(response.data)
    },

    patch: async <TResponse, TBody = unknown>(url: string, data?: TBody): Promise<TResponse> => {
        const response = await apiClient.patch<TResponse>(url, data)
        return unwrapApiPayload<TResponse>(response.data)
    },

    delete: async <TResponse>(url: string): Promise<TResponse> => {
        const response = await apiClient.delete<TResponse>(url)
        return unwrapApiPayload<TResponse>(response.data)
    },
}

export async function getServerConfig<TConfig>(): Promise<TConfig> {
    return api.get<TConfig>(API.servers.config)
}

export async function getServerConfigValue<TValue>(
    key: string,
    defaultValue: TValue,
): Promise<TValue> {
    const response = await api.get<{ value?: TValue }>(API.servers.configKey(key))
    return response?.value ?? defaultValue
}

export async function patchServerConfig(
    key: string,
    value: unknown,
): Promise<void> {
    await api.patch(API.servers.config, { [key]: value })
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
    const response = await authenticatedFetch<string>(
        API.videoStreaming.signedUrl,
        'POST',
        request,
    )

    return response ? `/api${response}` : ''
}
