// websocketStore.ts
import { Series } from '@/data/interfaces/Media'
import { create } from 'zustand'
import { MessageType } from '@/data/enums/WSMessage'

// Message interface
interface WebSocketMessage {
  header: MessageType;
  body: any;
}

interface WebSocketState {
  downloading: boolean;
  downloadPercentage: number;
  analyzing: boolean;
  seriesReceived: Series | null;
  ws: WebSocket | null;
  wsConnected: boolean;
  messageQueue: WebSocketMessage[];
  setDownloading: (value: boolean) => void;
  setDownloadPercentage: (value: number) => void;
  setAnalyzing: (value: boolean) => void;
  setSeriesReceived: (value: Series | null) => void;
  connectWS: (ip: string) => Promise<void>;
  downloadAudio: (elementId: string, url: string, serverIP: string) => Promise<void>;
  downloadVideo: (elementId: string, url: string, serverIP: string) => Promise<void>;
  addMessageToQueue: (message: WebSocketMessage) => void;
  clearMessageQueue: () => void;
}

export const useWebSocketStore = create<WebSocketState>((set, get) => ({
  downloading: false,
  downloadPercentage: 0,
  analyzing: false,
  seriesReceived: null,
  ws: null,
  wsConnected: false,
  messageQueue: [],

  setDownloading: (value) => set({ downloading: value }),
  setDownloadPercentage: (value) => set({ downloadPercentage: value }),
  setAnalyzing: (value) => set({ analyzing: value }),
  setSeriesReceived: (value) => set({ seriesReceived: value }),
  addMessageToQueue: (message) => set((state) => ({
    messageQueue: [...state.messageQueue, message]
  })),
  clearMessageQueue: () => set({ messageQueue: [] }),

  connectWS: async (ip: string) => {
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
            downloading: false,
            analyzing: false,
          })
        }
  
        websocket.onmessage = (event) => {
          const message = JSON.parse(event.data)
          const wsMessage: WebSocketMessage = {
            header: message.header as MessageType,
            body: message.body
          }
          
          // Handle immediate state updates
          switch (message.header) {
            case MessageType.DOWNLOAD_PROGRESS:
              set({ downloadPercentage: message.body })
              break
            case MessageType.DOWNLOAD_ERROR:
              set({ downloading: false })
              break
            case MessageType.DOWNLOAD_COMPLETE:
              set({ downloading: false })
              break
          }
          
          // Add all messages to queue for external processing
          get().addMessageToQueue(wsMessage)
        }
      })
    }
  },

  downloadVideo: async (elementId, url, serverIP) => {
    set({ downloadPercentage: 0, downloading: true })

    const { connectWS } = get()
    await connectWS(serverIP)

    try {
      const response = await fetch(`https://${serverIP}/downloadVideo`, {
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

  downloadAudio: async (elementId, url, serverIP) => {
    set({ downloadPercentage: 0, downloading: true })

    const { connectWS } = get()
    await connectWS(serverIP)

    try {
      const response = await fetch(`https://${serverIP}/downloadMusic`, {
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