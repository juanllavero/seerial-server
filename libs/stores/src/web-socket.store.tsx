import { API, api, seerialQueryClient } from '@seerial/api';
import { type Library, MessageType } from '@seerial/domain';
import { createWithEqualityFn } from 'zustand/traditional';

function getBodyString(body: unknown, key: string): string | null {
  if (!body || typeof body !== 'object') {
    return null;
  }

  const value = (body as Record<string, unknown>)[key];
  return typeof value === 'string' ? value : null;
}

// Message interface
interface WebSocketMessage {
  header: MessageType;
  body: unknown;
}

type WebSocketSet = (
  partial: Partial<WebSocketState> | ((state: WebSocketState) => Partial<WebSocketState>),
) => void;
type WebSocketGet = () => WebSocketState;

function handleScanComplete(body: unknown, set: WebSocketSet): void {
  set({ analyzing: false, analyzingLibraryId: null });
  const scannedLibraryId = typeof body === 'string' ? body : null;

  void seerialQueryClient.invalidateQueries({ queryKey: ['libraries', 'getAll'] });
  if (!scannedLibraryId) {
    return;
  }

  void seerialQueryClient.invalidateQueries({
    queryKey: ['libraries', 'getById', scannedLibraryId],
  });
  void seerialQueryClient.invalidateQueries({
    queryKey: ['libraries', 'content', scannedLibraryId],
  });
}

function handleMutateLibraries(body: unknown): void {
  seerialQueryClient.setQueriesData(
    { queryKey: ['libraries', 'getAll'] },
    (current: unknown[] | undefined) => {
      if (!current) return current;
      return [...current, ...(Array.isArray(body) ? body : [body])];
    },
  );
}

function handleMutateLibrary(body: unknown): void {
  const libraryId = getBodyString(body, 'id');
  if (!libraryId) {
    return;
  }

  seerialQueryClient.setQueriesData(
    { queryKey: ['libraries', 'getAll'] },
    (current: Library[] | undefined) => {
      if (!current) return current;
      const updated = current.map((item: Library) =>
        item.id === libraryId ? (body as Library) : item,
      );
      return updated.length === current.length ? [...current, body] : updated;
    },
  );

  seerialQueryClient.setQueriesData({ queryKey: ['libraries', 'getById', libraryId] }, body);
  void seerialQueryClient.invalidateQueries({ queryKey: ['libraries', 'content', libraryId] });
}

function handleMutateCollection(body: unknown): void {
  const collectionId = getBodyString(body, 'id');
  const libraryId = getBodyString(body, 'libraryId');

  if (collectionId) {
    seerialQueryClient.setQueriesData({ queryKey: ['collections', 'get', collectionId] }, body);
  }

  if (libraryId) {
    void seerialQueryClient.invalidateQueries({ queryKey: ['libraries', 'content', libraryId] });
  }
}

function handleMutateSeries(body: unknown): void {
  const seriesId = getBodyString(body, 'id');
  const libraryId = getBodyString(body, 'libraryId');

  if (seriesId) {
    seerialQueryClient.setQueriesData({ queryKey: ['series', 'get', seriesId] }, body);
  }

  if (libraryId) {
    void seerialQueryClient.invalidateQueries({ queryKey: ['libraries', 'content', libraryId] });
  }

  void seerialQueryClient.invalidateQueries({ queryKey: ['myList', 'series'] });
}

function handleMutateSeason(body: unknown): void {
  const seasonId = getBodyString(body, 'id');
  const seriesId = getBodyString(body, 'seriesId');

  if (seasonId) {
    seerialQueryClient.setQueriesData({ queryKey: ['seasons', 'get', seasonId] }, body);
  }

  if (seriesId) {
    void seerialQueryClient.invalidateQueries({ queryKey: ['series', 'get', seriesId] });
  }
}

function handleMutateEpisode(body: unknown): void {
  const episodeId = getBodyString(body, 'id');
  const seasonId = getBodyString(body, 'seasonId');
  const seriesId = getBodyString(body, 'seriesId');
  const videoId = getBodyString(body, 'videoId');

  if (episodeId) {
    seerialQueryClient.setQueriesData({ queryKey: ['episodes', 'get', episodeId] }, body);
  }

  if (seasonId) {
    void seerialQueryClient.invalidateQueries({ queryKey: ['seasons', 'get', seasonId] });
  }

  if (seriesId) {
    void seerialQueryClient.invalidateQueries({ queryKey: ['series', 'get', seriesId] });
  }

  if (videoId && episodeId) {
    void seerialQueryClient.invalidateQueries({
      queryKey: ['videos', 'getByEpisodeId', episodeId],
    });
  }
}

function handleMutateMovie(body: unknown): void {
  const movieId = getBodyString(body, 'id');
  const libraryId = getBodyString(body, 'libraryId');

  if (movieId) {
    seerialQueryClient.setQueriesData({ queryKey: ['movies', 'get', movieId] }, body);
  }

  if (libraryId) {
    void seerialQueryClient.invalidateQueries({ queryKey: ['libraries', 'content', libraryId] });
  }

  void seerialQueryClient.invalidateQueries({ queryKey: ['myList', 'movies'] });
}

function handleMutateAlbum(body: unknown): void {
  const albumId = getBodyString(body, 'id');
  const collectionId = getBodyString(body, 'collectionId');
  const libraryId = getBodyString(body, 'libraryId');

  if (albumId) {
    seerialQueryClient.setQueriesData({ queryKey: ['albums', 'get', albumId] }, body);
  }

  if (collectionId) {
    void seerialQueryClient.invalidateQueries({ queryKey: ['collections', 'get', collectionId] });
  }

  if (libraryId) {
    void seerialQueryClient.invalidateQueries({ queryKey: ['libraries', 'content', libraryId] });
  }
}

function handleWebSocketMessage(
  message: WebSocketMessage,
  set: WebSocketSet,
  get: WebSocketGet,
): void {
  switch (message.header) {
    case MessageType.DOWNLOAD_PROGRESS:
      set({
        downloadPercentage: typeof message.body === 'number' ? message.body : 0,
      });
      break;
    case MessageType.DOWNLOAD_ERROR:
      set({
        downloading: false,
        downloaded: false,
        errorDownloading: true,
        downloadPercentage: 0,
      });
      break;
    case MessageType.DOWNLOAD_COMPLETE:
      set({
        downloading: false,
        downloaded: true,
        errorDownloading: false,
        downloadingElementId: null,
        downloadPercentage: 0,
      });
      break;
    case MessageType.SCAN_STARTED:
      set({
        analyzing: true,
        analyzingLibraryId: typeof message.body === 'string' ? message.body : null,
      });
      break;
    case MessageType.SCAN_COMPLETE:
      handleScanComplete(message.body, set);
      break;
    case MessageType.MUTATE_LIBRARIES:
      handleMutateLibraries(message.body);
      break;
    case MessageType.MUTATE_LIBRARY:
      handleMutateLibrary(message.body);
      break;
    case MessageType.MUTATE_COLLECTION:
      handleMutateCollection(message.body);
      break;
    case MessageType.MUTATE_SERIES:
      handleMutateSeries(message.body);
      break;
    case MessageType.MUTATE_SEASON:
      handleMutateSeason(message.body);
      break;
    case MessageType.MUTATE_EPISODE:
      handleMutateEpisode(message.body);
      break;
    case MessageType.MUTATE_MOVIE:
      handleMutateMovie(message.body);
      break;
    case MessageType.MUTATE_ALBUM:
      handleMutateAlbum(message.body);
      break;
    default:
      set({ wsMessage: message });
      break;
  }

  get().addMessageToQueue(message);
}

interface WebSocketState {
  ws: WebSocket | null;
  wsMessage: WebSocketMessage | null;
  errorDownloading: boolean;
  downloading: boolean;
  downloaded: boolean;
  downloadingElementId: string | null;
  downloadPercentage: number;
  analyzing: boolean;
  analyzingLibraryId: string | null;
  wsConnected: boolean;
  messageQueue: WebSocketMessage[];
  setDownloading: (value: boolean) => void;
  setDownloaded: (value: boolean) => void;
  setDownloadPercentage: (value: number) => void;
  setAnalyzing: (value: boolean, libraryId: string) => void;
  connectWS: () => Promise<void>;
  downloadAudio: (
    elementId: string,
    url: string,
    libraryId: string,
    fileName: string,
  ) => Promise<void>;
  downloadVideo: (
    elementId: string,
    url: string,
    libraryId: string,
    fileName: string,
  ) => Promise<void>;
  addMessageToQueue: (message: WebSocketMessage) => void;
  clearMessageQueue: () => void;
}

export const useWebSocketStore = createWithEqualityFn<WebSocketState>((set, get) => ({
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

  setDownloaded: (value: boolean) => set({ downloaded: value }),
  setDownloading: (value: boolean) => set({ downloading: value }),
  setDownloadPercentage: (value: number) => set({ downloadPercentage: value }),
  setAnalyzing: (value: boolean, libraryId: string) =>
    set({ analyzing: value, analyzingLibraryId: libraryId }),
  addMessageToQueue: (message: WebSocketMessage) =>
    set((state: WebSocketState) => ({
      messageQueue: [...state.messageQueue, message],
    })),
  clearMessageQueue: () => set({ messageQueue: [] }),

  connectWS: async () => {
    set({ downloaded: false });
    if (!get().wsConnected) {
      return new Promise<void>((resolve, reject) => {
        // Determine the protocol (http or https) based on the current location
        const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
        // Get the hostname
        const host = window.location.host;
        // Reconstruct the WebSocket URL
        const wsUrl = `${protocol}://${host}/api`;

        const websocket = new WebSocket(wsUrl);

        websocket.onopen = () => {
          set({
            wsConnected: true,
            ws: websocket,
          });
          resolve();
        };

        websocket.onerror = (err) => {
          reject(err);
        };

        websocket.onclose = () => {
          set({
            wsConnected: false,
            ws: null,
            downloaded: true,
            errorDownloading: false,
            downloading: false,
            downloadingElementId: null,
            analyzing: false,
          });
        };

        websocket.onmessage = (event) => {
          const message = JSON.parse(event.data);
          const wsMessage: WebSocketMessage = {
            header: message.header as MessageType,
            body: message.body,
          };

          handleWebSocketMessage(wsMessage, set, get);
        };
      });
    }
  },

  downloadVideo: async (elementId, url, libraryId, fileName) => {
    set({
      downloadingElementId: elementId,
      downloadPercentage: 0,
      downloading: true,
    });

    const { connectWS } = get();
    await connectWS();

    try {
      const response = await api.post<{ data?: unknown }>(API.downloads.video, {
        url,
        downloadFolder: `resources/video/${libraryId}/`,
        fileName,
      });
      if (!response || !response.data) {
        throw new Error();
      }
      const data = response.data;
      console.log('Download started:', data);
    } catch (error) {
      console.error('Error downloading media:', error);
    }
  },

  downloadAudio: async (elementId, url, libraryId, fileName) => {
    set({
      downloadingElementId: elementId,
      downloadPercentage: 0,
      downloading: true,
    });

    const { connectWS } = get();
    await connectWS();

    try {
      const response = await api.post<{ data?: unknown }>(API.downloads.music, {
        url,
        downloadFolder: `resources/music/${libraryId}/`,
        fileName,
      });
      if (!response || !response.data) {
        throw new Error();
      }
      const data = response.data;
      console.log('Download started:', data);
    } catch (error) {
      console.error('Error downloading media:', error);
    }
  },
}));
