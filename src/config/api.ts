/**
 * API Client Configuration
 */

import axios from 'axios'

// ============================================================================
// Base Configuration
// ============================================================================

export const API_BASE_URL = '/api'

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
})

// ============================================================================
// Authenticated Fetch Functions
// ============================================================================

/**
 * Authenticated fetch function using axios
 * Replaces the original authenticatedFetch but with axios
 *
 * @param url - Endpoint URL (relative to baseURL)
 * @param type - HTTP method (GET, POST, PUT, DELETE, etc.)
 * @param body - Request body for POST/PUT/PATCH
 */
export async function authenticatedFetch(
  url: string,
  type: string = 'GET',
  body?: any,
) {
  const config = {
    method: type,
    url,
  }

  if (body && type !== 'GET') {
    return await apiClient.request({ ...config, data: body })
  }

  return await apiClient.request(config)
}

/**
 * Fetcher for useSWR - automatically includes baseURL and credentials
 * Usage: useSWR(API.movies.myList('123'), authenticatedFetcher)
 */
export const authenticatedFetcher = async (url: string) => {
  const res = await apiClient.get(url)
  return res.data
}

/**
 * Fetcher with params for useSWR
 * Usage: useSWR([API.movies.search, { name: 'Inception' }], fetcherWithParams)
 */
export const fetcherWithParams = async ([url, params]: [string, any]) => {
  const res = await apiClient.get(url, { params })
  return res.data
}

// ============================================================================
// Convenience Methods
// ============================================================================

export const api = {
  get: <T = any>(url: string, params?: any) =>
    apiClient.get<T>(url, { params }).then((res) => res.data),

  post: <T = any>(url: string, data?: any) =>
    apiClient.post<T>(url, data).then((res) => res.data),

  put: <T = any>(url: string, data?: any) =>
    apiClient.put<T>(url, data).then((res) => res.data),

  patch: <T = any>(url: string, data?: any) =>
    apiClient.patch<T>(url, data).then((res) => res.data),

  delete: <T = any>(url: string) =>
    apiClient.delete<T>(url).then((res) => res.data),
}

// ============================================================================
// API Endpoints
// ============================================================================

export const API = {
  // Movies
  movies: {
    get: (id: string) => `/movies/${id}`,
    refreshMetadata: (id: string) => `/movies/${id}/metadata`,
    changeIdentification: (id: string) => `/movies/${id}/identification`,
    update: (id: string) => `/movies/${id}`,
    delete: (id: string) => `/movies/${id}`,
    setWatchState: (id: string) => `/movies/${id}/watch-state`,
    search: '/movies/search',
    imdbScore: '/movies/imdb-score',
    remainingVideos: (id: string) => `/movies/${id}/remaining-videos`,
    myList: (id: string) => `/movies/${id}/my-list`,
  },

  // Video Streaming
  videoStreaming: {
    transcodedUrl: '/video-streaming/transcoded-url',
    passthroughUrl: '/video-streaming/passthrough-url',
    transcoded: '/video-streaming/transcoded',
    passthrough: '/video-streaming/passthrough',
  },

  // Videos
  videos: {
    get: (id: string) => `/videos/${id}`,
    getByEpisodeId: (episodeId: string) => `/videos/by-episode/${episodeId}`,
    update: (id: string) => `/videos/${id}`,
    delete: (id: string) => `/videos/${id}`,
    getMediaInfo: (id: string) => `/videos/${id}/media-info`,
    updateMediaInfo: (id: string) => `/videos/${id}/media-info`,
    setWatchState: (id: string) => `/videos/${id}/watch-state`,
    thumbnail: '/videos/thumbnail',
    subtitles: '/videos/subtitles',
  },

  // Users
  users: {
    create: '/users',
    update: (id: string) => `/users/${id}`,
    delete: (id: string) => `/users/${id}`,
    findAllPublic: '/users/public',
    login: '/users/login',
  },

  // Songs
  songs: {
    update: (id: string) => `/songs/${id}`,
    delete: (id: string) => `/songs/${id}`,
    lyrics: (id: string) => `/songs/${id}/lyrics`,
    addLyrics: '/songs/lyrics',
    stream: '/songs/stream',
  },

  // Search
  search: {
    media: '/search/media',
  },

  // Media
  media: {
    details: (type: string) => `/media/details/${type}`,
    background: (itemType: string, mediaType: string) =>
      `/media/${itemType}/${mediaType}`,
  },

  // Files
  files: {
    drives: '/files/drives',
    folder: '/files/folder',
  },

  // Downloads
  downloads: {
    video: '/downloads/video',
    music: '/downloads/music',
    image: '/downloads/image',
  },

  // Configuration
  configuration: {
    apiKey: '/configuration/api-key',
  },

  // Servers
  servers: {
    status: '/servers',
    update: (id: string) => `/servers/${id}`,
    configKey: (key: string) => `/servers/config/${key}`,
    config: '/servers/config',
  },

  // Series
  series: {
    get: (id: string) => `/series/${id}`,
    refreshMetadata: '/series/metadata',
    updateShowId: '/series/tmdb-id',
    updateEpisodeGroup: (id: string) => `/series/${id}/episode-group`,
    update: (id: string) => `/series/show/${id}`,
    delete: (id: string) => `/series/${id}`,
    setWatchState: (id: string) => `/series/${id}/watch-state`,
    search: '/series/search',
    searchEpisodeGroups: '/series/episode-groups/search',
    remainingEpisodes: (id: string) => `/series/${id}/remaining-episodes`,
    myList: (id: string) => `/series/${id}/my-list`,
  },

  // Seasons
  seasons: {
    get: (id: string) => `/seasons/${id}`,
    update: (id: string) => `/seasons/${id}`,
    delete: (id: string) => `/seasons/${id}`,
    setWatchState: (id: string) => `/seasons/${id}/watch-state`,
  },

  // Playlists
  playlists: {
    getAll: '/playlists',
    create: '/playlists',
    getById: (id: string) => `/playlists/${id}`,
    update: (id: string) => `/playlists/${id}`,
    delete: (id: string) => `/playlists/${id}`,
    addSong: (id: string) => `/playlists/${id}/songs`,
    removeSong: (id: string, songId: string) =>
      `/playlists/${id}/songs/${songId}`,
  },

  // My List
  myList: {
    movies: '/my-list/movies',
    series: '/my-list/series',
    isMovieInList: (id: string) => `/my-list/movies/${id}/check`,
    isSeriesInList: (id: string) => `/my-list/series/${id}/check`,
  },

  // Libraries
  libraries: {
    getAll: '/libraries',
    create: '/libraries',
    getById: (id: string) => `/libraries/${id}`,
    update: (id: string) => `/libraries/${id}`,
    delete: (id: string) => `/libraries/${id}`,
    content: (id: string) => `/libraries/${id}/content`,
    scan: (id: string) => `/libraries/${id}/scan`,
    reorder: '/libraries/order',
    reorderItems: (id: string) => `/libraries/${id}/order`,
  },

  // Images
  images: {
    upload: '/images',
    directoryListing: '/images',
    local: '/images/local',
    compressed: '/images/compressed',
    colors: '/images/colors',
    transparent: '/images/effects/transparent',
  },

  // Episodes
  episodes: {
    get: (id: string) => `/episodes/${id}`,
    update: (id: string) => `/episodes/${id}`,
    delete: (id: string) => `/episodes/${id}`,
    setWatchState: (id: string) => `/episodes/${id}/watch-state`,
  },

  // Continue Watching
  continueWatching: {
    getVideos: '/continue-watching',
  },

  // Collections
  collections: {
    get: (id: string) => `/collections/${id}`,
    musicExtras: (collectionId: string) =>
      `/collections/${collectionId}/music-extras`,
    reorderContent: (id: string) => `/collections/${id}/items/order`,
    update: (id: string) => `/collections/${id}`,
    delete: (id: string) => `/collections/${id}`,
  },

  // Artists
  artists: {
    create: '/artists',
    getById: (id: string) => `/artists/${id}`,
    update: (id: string) => `/artists/${id}`,
    delete: (id: string) => `/artists/${id}`,
  },

  // Albums
  albums: {
    get: (id: string) => `/albums/${id}`,
    update: (id: string) => `/albums/${id}`,
    delete: (id: string) => `/albums/${id}`,
  },

  // Watch Lists
  watchLists: {
    updateWatchState: '/watch-lists/watch-state',
  },
} as const
