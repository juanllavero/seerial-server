import { API, authenticatedFetch } from '@/config/api'
import { MessageType } from '@/data/enums/WSMessage'
import { Series } from '@/data/interfaces/Media'
import { mutate } from 'swr'
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
                // Revalidate affected keys after scan (optimal for batch updates)
                const scannedLibraryId = message.body // Assuming body is libraryId
                mutate(API.libraries.getAll) // List of libraries
                if (scannedLibraryId) {
                  mutate(API.libraries.getById(scannedLibraryId)) // Specific library
                  mutate(API.libraries.content(scannedLibraryId)) // Library content
                }
                break

              // Handle MUTATE_ messages with optimistic cache updates
              // Adjust based on actual message.body structure (e.g., assuming body is the entity object with 'id' and possibly 'libraryId')
              case MessageType.MUTATE_LIBRARIES:
                // Mutate the list of libraries
                mutate(
                  API.libraries.getAll,
                  (current: any[] | undefined) => {
                    if (!current) return current
                    return [
                      ...current,
                      ...(Array.isArray(message.body)
                        ? message.body
                        : [message.body]),
                    ]
                  },
                  { revalidate: false },
                )
                break

              case MessageType.MUTATE_LIBRARY:
                // Update libraries list
                mutate(
                  API.libraries.getAll,
                  (current: any[] | undefined) => {
                    if (!current) return current
                    const updated = current.map((item) =>
                      item.id === message.body.id ? message.body : item,
                    )
                    return updated.length === current.length
                      ? [...current, message.body]
                      : updated
                  },
                  { revalidate: false },
                )
                // Update specific library detail
                mutate(API.libraries.getById(message.body.id), message.body, {
                  revalidate: false,
                })
                // If content affected, revalidate content key
                mutate(API.libraries.content(message.body.id))
                break

              case MessageType.MUTATE_COLLECTION:
                // Collections might be fetched via library content or specific endpoints
                // Assuming no direct list, mutate detail and potentially parent library if body has libraryId
                mutate(API.collections.get(message.body.id), message.body, {
                  revalidate: false,
                })
                if (message.body.libraryId) {
                  mutate(API.libraries.content(message.body.libraryId))
                }
                break

              case MessageType.MUTATE_SERIES:
                set({ seriesReceived: message.body }) // Keep if needed for other logic
                // Mutate series detail
                mutate(API.series.get(message.body.id), message.body, {
                  revalidate: false,
                })
                // If part of a library, mutate library content (assuming body has libraryId)
                if (message.body.libraryId) {
                  mutate(API.libraries.content(message.body.libraryId))
                }
                // If there's a series list (e.g., via my-list), revalidate if applicable
                mutate(API.myList.series) // Example if relevant
                break

              case MessageType.MUTATE_SEASON:
                // Mutate season detail
                mutate(API.seasons.get(message.body.id), message.body, {
                  revalidate: false,
                })
                // Mutate parent series if body has seriesId
                if (message.body.seriesId) {
                  mutate(API.series.get(message.body.seriesId))
                }
                break

              case MessageType.MUTATE_EPISODE:
                // Mutate episode detail
                mutate(API.episodes.get(message.body.id), message.body, {
                  revalidate: false,
                })
                // Mutate parent season/series if available in body
                if (message.body.seasonId) {
                  mutate(API.seasons.get(message.body.seasonId))
                }
                if (message.body.seriesId) {
                  mutate(API.series.get(message.body.seriesId))
                }
                // Video-related if episode has video
                if (message.body.videoId) {
                  mutate(API.videos.getByEpisodeId(message.body.id))
                }
                break

              case MessageType.MUTATE_MOVIE:
                // Mutate movie detail
                mutate(API.movies.get(message.body.id), message.body, {
                  revalidate: false,
                })
                // If part of a library, mutate library content
                if (message.body.libraryId) {
                  mutate(API.libraries.content(message.body.libraryId))
                }
                // My-list if relevant
                mutate(API.myList.movies)
                break

              case MessageType.MUTATE_ALBUM:
                // Mutate album detail
                mutate(API.albums.get(message.body.id), message.body, {
                  revalidate: false,
                })
                // If part of a collection or library
                if (message.body.collectionId) {
                  mutate(API.collections.get(message.body.collectionId))
                }
                if (message.body.libraryId) {
                  mutate(API.libraries.content(message.body.libraryId))
                }
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
        if (!response || !response.data) {
          throw new Error()
        }
        const data = await response.data
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
        if (!response || !response.data) {
          throw new Error()
        }
        const data = await response.data
        console.log('Download started:', data)
      } catch (error) {
        console.error('Error downloading media:', error)
      }
    },
  }),
)
