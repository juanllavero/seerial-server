import {
  AudioTrack,
  Chapter,
  MediaInfo,
  SubtitleTrack,
  VideoTrack,
} from './MediaInfo'
import { Album } from './Music'

export interface Cast {
  name: string
  character: string
  profileImage: string
}

export interface Library {
  id: string
  name: string
  language: string
  type: string
  order: number
  hidden: boolean
  folders: string[]
  preferAudioLan?: string
  preferSubLan?: string
  subsMode?: string
  analyzedFiles: Record<string, string>
  analyzedFolders: Record<string, string>
  backgroundSrc: string

  series: Series[]
  movies: Movie[]
  albums: Album[]
  collections: Collection[]
}

export interface Collection {
  id: string
  title: string
  description?: string
  backgroundSrc: string
  backgroundsUrls: string[]
  coverSrc: string
  coversUrls: string[]

  shows: Series[]
  movies: Movie[]
  albums: Album[]
}

export interface Series {
  id: string
  libraryId: string
  themdbId: number
  order: number
  name: string
  nameLock: boolean
  overview: string
  overviewLock: boolean
  year: string
  yearLock: boolean
  score: number
  tagline: string
  taglineLock: boolean

  logoSrc: string
  logosUrls: string[]
  coverSrc: string
  coversUrls: string[]

  productionStudios: string[]
  productionStudiosLock: boolean
  creator: string[]
  creatorLock: boolean
  musicComposer: string[]
  musicComposerLock: boolean
  genres: string[]
  genresLock: boolean
  cast: Cast[]

  preferAudioLan?: string
  preferSubLan?: string
  subsMode?: string

  folder: string
  episodeGroupId: string
  analyzingFiles: boolean
  currentlyWatchingEpisodeId: string
  watched: boolean

  seasons: Season[]
}

export interface Season {
  id: string
  seriesId: string
  order: number
  name: string
  nameLock: boolean
  year: string
  yearLock: boolean
  overview: string
  overviewLock: boolean
  seasonNumber: number

  coverSrc: string
  coversUrls: string[]
  backgroundSrc: string
  backgroundsUrls: string[]
  videoSrc: string
  musicSrc: string

  watched: boolean

  episodes: Episode[]
}

export interface Episode {
  id: string
  seasonId: string
  name: string
  nameLock: boolean
  year: string
  yearLock: boolean
  overview: string
  overviewLock: boolean
  score: number

  directedBy: string[]
  directedByLock: boolean
  writtenBy: string[]
  writtenByLock: boolean

  episodeNumber: number
  seasonNumber: number
  order: number

  video: Video
}

export interface Movie {
  id: string
  libraryId: string
  imdbId: string
  themdbId: number
  imdbScore: number
  score: number
  order: number
  name: string
  nameLock: boolean
  overview: string
  overviewLock: boolean
  year: string
  yearLock: boolean
  tagline: string
  taglineLock: boolean

  genres: string[]
  genresLock: boolean
  productionStudios: string[]
  productionStudiosLock: boolean
  directedBy: string[]
  directedByLock: boolean
  writtenBy: string[]
  writtenByLock: boolean
  creator: string[]
  creatorLock: boolean
  musicComposer: string[]
  musicComposerLock: boolean
  cast: Cast[]

  folder: string

  logoSrc: string
  logosUrls: string[]
  backgroundSrc: string
  backgroundsUrls: string[]
  coverSrc: string
  coversUrls: string[]
  watched: boolean

  videos: Video[]
  extras: Video[]
}

export interface Video {
  id: string
  title: string
  fileSrc: string
  runtime: number
  imgSrc: string
  imgUrls: string[]
  watched: boolean
  timeWatched: number
  lastWatched: string

  mediaInfo?: MediaInfo
  videoTracks?: VideoTrack[]
  subtitleTracks?: SubtitleTrack[]
  audioTracks?: AudioTrack[]
  chapters?: Chapter[]

  selectedAudioTrack?: number
  selectedSubtitleTrack?: number

  extraType?: string

  episodeId?: string
  movieId?: string
}
