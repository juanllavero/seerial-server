// websocketStore.ts
import { Series } from '@/data/interfaces/Media'
import { create } from 'zustand'
import useDataStore from './data.context'
import { useServerStore } from './server.context'

const { serverIP } = useServerStore()
const {
  addLibrary,
  updateLibrary,
  addSeries,
  updateSeries,
  addSeason,
  addEpisode,
} = useDataStore()

interface WebSocketState {
  downloading: boolean
  downloadPercentage: number
  analyzing: boolean
  seriesReceived: Series | null
  ws: WebSocket | null
  wsConnected: boolean
  setDownloading: (value: boolean) => void
  setDownloadPercentage: (value: number) => void
  setAnalyzing: (value: boolean) => void
  setSeriesReceived: (value: Series | null) => void
  connectWS: (ip: string) => Promise<void>
  downloadAudio: (elementId: string, url: string) => Promise<void>
  downloadVideo: (elementId: string, url: string) => Promise<void>
}

export const useWebSocketStore = create<WebSocketState>((set, get) => ({
  downloading: false,
  downloadPercentage: 0,
  analyzing: false,
  seriesReceived: null,
  ws: null,
  wsConnected: false,

  setDownloading: (value) => set({ downloading: value }),
  setDownloadPercentage: (value) => set({ downloadPercentage: value }),
  setAnalyzing: (value) => set({ analyzing: value }),
  setSeriesReceived: (value) => set({ seriesReceived: value }),

  connectWS: async (ip: string) => {
    if (!get().wsConnected) {
      return new Promise((resolve, reject) => {
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
            downloading: false,
            analyzing: false,
          })
        }

        websocket.onmessage = (event) => {
          const message = JSON.parse(event.data)

          switch (message.header) {
            case 'DOWNLOAD_PROGRESS':
              set({ downloadPercentage: message.body })
              break
            case 'DOWNLOAD_ERROR':
              set({ downloading: false })
              break
            case 'DOWNLOAD_COMPLETE':
              set({ downloading: false })
              break
            case 'ADD_LIBRARY':
              addLibrary(message.body.library)
              break
            case 'UPDATE_LIBRARY':
              updateLibrary(message.body.library)
              break
            case 'ADD_SERIES':
              addSeries(message.body)
              break
            case 'UPDATE_SERIES':
              updateSeries(message.body)
              break
            case 'ADD_SEASON':
              addSeason(message.body)
              break
            case 'ADD_EPISODE':
              addEpisode(message.body)
              break
          }
        }
      })
    }
  },

  downloadVideo: async (elementId: string, url: string) => {
    set({ downloadPercentage: 0, downloading: true })

    const { connectWS } = get()
    await connectWS(serverIP) // Asegúrate de tener acceso a serverIP

    try {
      const response = await fetch(`https:${serverIP}/downloadVideo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: url,
          downloadFolder: 'resources/video/',
          fileName: elementId,
        }),
      })
      const data = await response.json()
      console.log('Download started:', data)
    } catch (error) {
      console.error('Error downloading media:', error)
    }
  },

  downloadAudio: async (elementId: string, url: string) => {
    set({ downloadPercentage: 0, downloading: true })

    const { connectWS } = get()
    await connectWS(serverIP) // Asegúrate de tener acceso a serverIP

    try {
      const response = await fetch(`https:${serverIP}/downloadMusic`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: url,
          downloadFolder: 'resources/music/',
          fileName: elementId,
        }),
      })
      const data = await response.json()
      console.log('Download started:', data)
    } catch (error) {
      console.error('Error downloading media:', error)
    }
  },
}))
