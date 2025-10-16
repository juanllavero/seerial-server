import { BasicServer, BasicUser } from '@/data/interfaces/Users'
import { authenticatedFetch } from '@/lib/auth'
import { createWithEqualityFn } from 'zustand/traditional'

interface ServerState {
	users: BasicUser[]
	currentUser: BasicUser | null
	servers: BasicServer[]
	server: BasicServer | null
	serverUrl: string
	gettingServerStatus: boolean
	apiKeyStatus: boolean
	gettingApiKeyStatus: boolean
	addServer: (server: BasicServer) => Promise<void>
	removeServer: (serverId: string) => void
	getServerStatus: (url: string) => Promise<void>
	setServerUrl: (serverUrl: string) => void
	setCurrentUser: (user: BasicUser | null) => void
	setApiKey: (apiKey: string) => Promise<void>
	resetServerSelection: () => void
	logout: () => void
}

/**
 * Pings a server URL with a short timeout to see if it's reachable.
 * Resolves with the URL if successful, otherwise rejects.
 * @param url The URL to ping.
 * @param timeout Milliseconds to wait before aborting.
 */
const pingServer = (url: string, timeout: number = 3000): Promise<string> => {
	return new Promise((resolve, reject) => {
		const controller = new AbortController()
		const timeoutId = setTimeout(() => {
			controller.abort()
			reject(new Error(`Timeout after ${timeout}ms`))
		}, timeout)

		fetch(url, { signal: controller.signal, cache: 'no-store' })
			.then((res) => {
				// Any response, even an error status code, means the server is reachable.
				// We just need to know if we can talk to it.
				if (res) {
					clearTimeout(timeoutId)
					resolve(url)
				} else {
					throw new Error('Empty response')
				}
			})
			.catch((err) => {
				clearTimeout(timeoutId)
				// This will catch network errors, timeouts, and SSL certificate errors.
				reject(err)
			})
	})
}

export const useServerStore = createWithEqualityFn<ServerState>((set, get) => ({
	users: [],
	currentUser: localStorage.getItem('user')
		? JSON.parse(localStorage.getItem('user')!)
		: null,
	servers: localStorage.getItem('servers')
		? JSON.parse(localStorage.getItem('servers')!)
		: [],
	serverUrl: localStorage.getItem('serverUrl') || '',
	server: localStorage.getItem('server')
		? JSON.parse(localStorage.getItem('server')!)
		: null,
	gettingServerStatus: true,
	apiKeyStatus: false,
	gettingApiKeyStatus: false,

	addServer: async (server) => {
		const servers = get().servers
		if (!servers.find((s) => s.id === server.id)) {
			set({ servers: [...servers, server], serverUrl: server.url })
			localStorage.setItem('serverUrl', server.url)
			localStorage.setItem('servers', JSON.stringify([...servers, server]))
		}
		await get().getServerStatus(server.url)
	},

	removeServer: (serverId) => {
		const servers = get().servers
		set({ servers: servers.filter((s) => s.id !== serverId) })
		localStorage.setItem('servers', JSON.stringify(servers))
	},

	setServerUrl: (serverUrl) => {
		set({ serverUrl })
		localStorage.setItem('serverUrl', serverUrl)
		get().getServerStatus(serverUrl)
	},

	getServerStatus: async (url: string) => {
		set({ gettingServerStatus: true })

		try {
			// Use a standard 10-second timeout for regular requests
			const response = await pingServer(`${url}`, 10000)
			// We need to actually get the data this time
			const data = await (await fetch(response)).json()

			const server = { ...data, url }
			localStorage.setItem('server', JSON.stringify(server))
			set({
				server: server,
				apiKeyStatus: data.status === 'VALID_API_KEY',
				gettingApiKeyStatus: false,
			})
		} catch {
			set({ server: null })
		} finally {
			set({ gettingServerStatus: false })
		}
	},

	setCurrentUser: (user: BasicUser | null) => {
		set({ currentUser: user })
		localStorage.setItem('user', JSON.stringify(user))
	},

	setApiKey: async (apiKey) => {
		// Use the dynamically set serverUrl from the state
		const { serverUrl } = get()
		if (!serverUrl) return

		set({ gettingApiKeyStatus: true })

		try {
			const response = await authenticatedFetch(
				`${serverUrl}/api/api-key`,
				'POST',
				{ apiKey }
			)
			if (!response || !response.ok) {
				throw new Error()
			}
			const data = await response.json()

			set({
				apiKeyStatus: data.status === 'VALID_API_KEY',
				gettingApiKeyStatus: false,
			})
		} catch (error) {
			console.error('Failed to set API Key', error)
			set({ apiKeyStatus: false, gettingApiKeyStatus: false })
		}
	},

	resetServerSelection: () => {
		set({ serverUrl: '', server: null, apiKeyStatus: false })
		localStorage.removeItem('serverUrl')
		localStorage.removeItem('server')
	},

	logout: () => {
		set({ currentUser: null, apiKeyStatus: false })
		localStorage.removeItem('user')
	},
}))
