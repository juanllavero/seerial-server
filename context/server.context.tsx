import { Server } from '@/data/interfaces/Users'
import { createWithEqualityFn } from 'zustand/traditional'

interface ServerState {
	selectedServer: Server | null
	// The final, reachable URL of the server (can be local or public)
	serverUrl: string
	serverStatus: boolean
	serverVersion: string
	gettingServerStatus: boolean
	apiKeyStatus: boolean
	gettingApiKeyStatus: boolean
	selectServer: (server: Server | null) => Promise<void>
	getServerStatus: () => Promise<void>
	setApiKey: (apiKey: string) => Promise<void>
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
	selectedServer: null,
	serverStatus: false,
	serverUrl: '', // Changed from serverUrl to serverUrl for clarity
	serverVersion: '',
	gettingServerStatus: false,
	apiKeyStatus: false,
	gettingApiKeyStatus: false,

	selectServer: async (server) => {
		if (server?.id === get().selectedServer?.id) {
			return
		}

		// Reset state immediately for better UX
		set({
			selectedServer: server,
			serverUrl: '',
			serverStatus: false,
			apiKeyStatus: false,
		})

		if (!server) {
			return
		}

		// For development purposes only
		set({ serverUrl: `https://server.sirjohn.es` })
		await get().getServerStatus()

		// IMPORTANT: Your API must return the server's local IP in the 'ip' field.
		// const localUrl = `https://${server.ip}:${server.port}/`
		// const publicUrl = `https://${server.id}.seerial.es:${server.port}/`

		// console.log(`[Connection]: Pinging local URL: ${localUrl}`)
		// console.log(`[Connection]: Pinging public URL: ${publicUrl}`)

		// try {
		//   // Promise.any resolves as soon as the FIRST promise resolves.
		//   // We race the local connection against the public one.
		//   const reachableUrl = await Promise.any([
		//     pingServer(localUrl),
		//     pingServer(publicUrl),
		//   ])

		//   console.log(`[Connection]: Success! Using reachable URL: ${reachableUrl}`)
		//   // Set the URL that won the race. Remove the trailing slash.
		//   set({ serverUrl: reachableUrl.slice(0, -1) })
		//   // Now get the full status from the confirmed reachable URL.
		//   await get().getServerStatus()
		// } catch (error) {
		//   console.error(
		//     '[Connection]: Server is unreachable on both local and public URLs.',
		//     error,
		//   )
		//   set({ serverStatus: false, serverUrl: '' })
		// }
	},

	getServerStatus: async () => {
		// Use the dynamically set serverUrl from the state
		const { serverUrl } = get()
		if (!serverUrl) return

		set({ gettingServerStatus: true })

		try {
			// Use a standard 10-second timeout for regular requests
			const response = await pingServer(`${serverUrl}/`, 10000)
			// We need to actually get the data this time
			const data = await (await fetch(response)).json()

			set({
				serverStatus: data.status !== undefined,
				apiKeyStatus: data.status === 'VALID_API_KEY',
				serverVersion: data.version || '', // Assuming your server returns a version
				gettingApiKeyStatus: false,
			})
		} catch {
			set({ serverStatus: false })
		} finally {
			set({ gettingServerStatus: false })
		}
	},

	setApiKey: async (apiKey) => {
		// Use the dynamically set serverUrl from the state
		const { serverUrl } = get()
		if (!serverUrl) return

		set({ gettingApiKeyStatus: true })

		try {
			const response = await fetch(`${serverUrl}/api-key`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ apiKey }),
			})
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
}))
