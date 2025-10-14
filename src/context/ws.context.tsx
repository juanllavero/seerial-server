import { MessageType } from '@/data/enums/WSMessage'
import { Series } from '@/data/interfaces/Media'
import { authenticatedFetch } from '@/lib/auth'
import { createWithEqualityFn } from 'zustand/traditional'

// Message interface
interface WebSocketMessage {
  header: MessageType
  body: any
}

interface WebSocketState {
  ws: WebSocket | null
  wsMessage: WebSocketMessage | null
  errorDownloading: boolean
  downloading: boolean
  downloaded: boolean
  downloadingElementId: string | null
  downloadPercentage: number
  analyzing: boolean
  analyzingLibraryId: string | null
  seriesReceived: Series | null
  wsConnected: boolean
  messageQueue: WebSocketMessage[]
  setDownloading: (value: boolean) => void
  setDownloaded: (value: boolean) => void
  setDownloadPercentage: (value: number) => void
  setAnalyzing: (value: boolean, libraryId: string) => void
  setSeriesReceived: (value: Series | null) => void
  connectWS: () => Promise<void>
  downloadAudio: (
    elementId: string,
    url: string,
    libraryId: string,
    fileName: string,
  ) => Promise<void>
  downloadVideo: (
    elementId: string,
    url: string,
    libraryId: string,
    fileName: string,
  ) => Promise<void>
  addMessageToQueue: (message: WebSocketMessage) => void
  clearMessageQueue: () => void
}

export const useWebSocketStore = createWithEqualityFn<WebSocketState>(
  (set, get) => ({
    ws: null,
    wsMessage: null,
    wsConnected: false,
    messageQueue: [],
    analyzing: false,
    downloaded: false,
    downloadingElementId: null,
    analyzingLibraryId: null,
    errorDownloading: false,
    downloading: false,
    downloadPercentage: 0,
    seriesReceived: null,

    setDownloaded: (value) => set({ downloaded: value }),
    setDownloading: (value) => set({ downloading: value }),
    setDownloadPercentage: (value) => set({ downloadPercentage: value }),
    setAnalyzing: (value, libraryId) =>
      set({ analyzing: value, analyzingLibraryId: libraryId }),
    setSeriesReceived: (value) => set({ seriesReceived: value }),
    addMessageToQueue: (message) =>
      set((state) => ({
        messageQueue: [...state.messageQueue, message],
      })),
    clearMessageQueue: () => set({ messageQueue: [] }),

    connectWS: async () => {
      set({ downloaded: false })
      if (!get().wsConnected) {
        return new Promise<void>((resolve, reject) => {
          // Determine the protocol (http or https) based on the current location
          const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
          // Get the hostname
          const host = window.location.host
          // Reconstruct the WebSocket URL
          const wsUrl = `${protocol}://${host}/api`

          const websocket = new WebSocket(wsUrl)

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
              case MessageType.SCAN_STARTED:
                set({ analyzing: true, analyzingLibraryId: message.body })
                break
              case MessageType.SCAN_COMPLETE:
                set({ analyzing: false, analyzingLibraryId: null })
                break
              default:
                set({ wsMessage: message })
            }

            // Add all messages to queue for external processing
            get().addMessageToQueue(wsMessage)
          }
        })
      }
    },

    downloadVideo: async (elementId, url, libraryId, fileName) => {
      set({
        downloadingElementId: elementId,
        downloadPercentage: 0,
        downloading: true,
      })

      const { connectWS } = get()
      await connectWS()

      try {
        const response = await authenticatedFetch(
          `/api/downloadVideo`,
          'POST',
          {
            url,
            downloadFolder: `resources/video/${libraryId}/`,
            fileName,
          },
        )
        if (!response || !response.ok) {
          throw new Error()
        }
        const data = await response.json()
        console.log('Download started:', data)
      } catch (error) {
        console.error('Error downloading media:', error)
      }
    },

    downloadAudio: async (elementId, url, libraryId, fileName) => {
      set({
        downloadingElementId: elementId,
        downloadPercentage: 0,
        downloading: true,
      })

      const { connectWS } = get()
      await connectWS()

      try {
        const response = await authenticatedFetch(
          `/api/downloadMusic`,
          'POST',
          {
            url,
            downloadFolder: `resources/music/${libraryId}/`,
            fileName,
          },
        )
        if (!response || !response.ok) {
          throw new Error()
        }
        const data = await response.json()
        console.log('Download started:', data)
      } catch (error) {
        console.error('Error downloading media:', error)
      }
    },
  }),
)
