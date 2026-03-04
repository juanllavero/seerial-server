import { createWithEqualityFn } from 'zustand/traditional'
import { MessageType } from '../data/enums/WSMessage'
import { Series } from '../data/interfaces/Media'

// Message interface
interface WebSocketMessage {
	header: MessageType
	body: any
}

interface WebSocketState {
	ws: WebSocket | null
	wsMessage: MessageType
	errorDownloading: boolean
	downloading: boolean
	downloaded: boolean
	downloadingElementId: string | null
	downloadPercentage: number
	analyzing: boolean
	seriesReceived: Series | null
	wsConnected: boolean
	messageQueue: WebSocketMessage[]
	setDownloading: (value: boolean) => void
	setDownloaded: (value: boolean) => void
	setDownloadPercentage: (value: number) => void
	setAnalyzing: (value: boolean) => void
	setSeriesReceived: (value: Series | null) => void
	connectWS: (ip: string) => Promise<void>
	downloadAudio: (
		elementId: string,
		url: string,
		serverIP: string,
		libraryId: string,
		fileName: string
	) => Promise<void>
	downloadVideo: (
		elementId: string,
		url: string,
		serverIP: string,
		libraryId: string,
		fileName: string
	) => Promise<void>
	addMessageToQueue: (message: WebSocketMessage) => void
	clearMessageQueue: () => void
}

export const useWebSocketStore = createWithEqualityFn<WebSocketState>(
	(set, get) => ({
		ws: null,
		wsMessage: MessageType.NO_MESSAGE,
		wsConnected: false,
		messageQueue: [],
		analyzing: false,
		downloaded: false,
		downloadingElementId: null,
		errorDownloading: false,
		downloading: false,
		downloadPercentage: 0,
		seriesReceived: null,

		setDownloaded: (value) => set({ downloaded: value }),
		setDownloading: (value) => set({ downloading: value }),
		setDownloadPercentage: (value) => set({ downloadPercentage: value }),
		setAnalyzing: (value) => set({ analyzing: value }),
		setSeriesReceived: (value) => set({ seriesReceived: value }),
		addMessageToQueue: (message) =>
			set((state) => ({
				messageQueue: [...state.messageQueue, message],
			})),
		clearMessageQueue: () => set({ messageQueue: [] }),

		connectWS: async (ip: string) => {
			set({ downloaded: false })
			if (!get().wsConnected) {
				return new Promise<void>((resolve, reject) => {
					const websocket = new WebSocket(`ws://${ip}/ws`)

					websocket.onopen = () => {
						set({
							wsConnected: true,
							ws: websocket,
						})
						resolve()
					}

					websocket.onerror = (err) => {
						reject(err)
					}

					websocket.onclose = () => {
						set({
							wsConnected: false,
							ws: null,
							downloaded: true,
							errorDownloading: false,
							downloading: false,
							downloadingElementId: null,
							analyzing: false,
						})
					}

					websocket.onmessage = (event) => {
						const message = JSON.parse(event.data)
						const wsMessage: WebSocketMessage = {
							header: message.header as MessageType,
							body: message.body,
						}

						// Handle immediate state updates
						switch (message.header) {
							case MessageType.DOWNLOAD_PROGRESS:
								set({ downloadPercentage: message.body })
								break
							case MessageType.DOWNLOAD_ERROR:
								set({
									downloading: false,
									downloaded: false,
									errorDownloading: true,
									downloadPercentage: 0,
								})
								break
							case MessageType.DOWNLOAD_COMPLETE:
								set({
									downloading: false,
									downloaded: true,
									errorDownloading: false,
									downloadingElementId: null,
									downloadPercentage: 0,
								})
								break
							default:
								set({ wsMessage: message.header })
						}

						// Add all messages to queue for external processing
						get().addMessageToQueue(wsMessage)
					}
				})
			}
		},

		downloadVideo: async (elementId, url, serverIP, libraryId, fileName) => {
			set({
				downloadingElementId: elementId,
				downloadPercentage: 0,
				downloading: true,
			})

			const { connectWS } = get()
			await connectWS(serverIP)

			try {
				const response = await fetch(`https://${serverIP}/downloadVideo`, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						url,
						downloadFolder: `resources/video/${libraryId}/`,
						fileName,
					}),
				})
				const data = await response.json()
				console.log('Download started:', data)
			} catch (error) {
				console.error('Error downloading media:', error)
			}
		},

		downloadAudio: async (elementId, url, serverIP, libraryId, fileName) => {
			set({
				downloadingElementId: elementId,
				downloadPercentage: 0,
				downloading: true,
			})

			const { connectWS } = get()
			await connectWS(serverIP)

			try {
				const response = await fetch(`https://${serverIP}/downloadMusic`, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						url,
						downloadFolder: `resources/music/${libraryId}/`,
						fileName,
					}),
				})
				const data = await response.json()
				console.log('Download started:', data)
			} catch (error) {
				console.error('Error downloading media:', error)
			}
		},
	})
)
