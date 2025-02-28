import { MediaInfo, VideoTrack, AudioTrack, SubtitleTrack } from './MediaInfo'
import { Cast, Chapter } from './Metadata'

export interface Library {
  id: string
  name: string
  language: string
  type: string
  isCollection: boolean
  order: number
  folders: string[]
  showOnFullscreen: boolean
  series: Series[]
  analyzedFiles: unknown
  analyzedFolders: unknown
  seasonFolders: unknown
}

export interface Series {
  id: string

  //Common data
  name: string
  overview: string
  coverSrc: string
  coversUrls: string[]
  nameLock: boolean
  overviewLock: boolean

  //Show
  year: string
  score: number
  tagline: string
  logoSrc: string
  logosUrls: string[]
  creator: string[]
  genres: string[]
  cast: Cast[]
  musicComposer: string[]
  productionStudios: string[]
  yearLock: boolean
  studioLock: boolean
  taglineLock: boolean
  creatorLock: boolean
  musicLock: boolean
  genresLock: boolean

  //Other
  watched: boolean
  themdbID: number
  isCollection: boolean
  order: number
  numberOfSeasons: number
  numberOfEpisodes: number
  folder: string
  videoZoom: number
  episodeGroupID: string
  seasons: Season[]
  playSameMusic: boolean
  analyzingFiles: boolean
  currentlyWatchingSeason: number
}

export interface Season {
  id: string

  //Common data
  name: string
  year: string
  overview: string
  nameLock: boolean
  orderLock: boolean
  yearLock: boolean
  overviewLock: boolean

  //Moviecreator:
  score: number
  tagline: string
  creator: string[]
  genres: string[]
  cast: Cast[]
  musicComposer: string[]
  productionStudios: string[]
  directedBy: string[]
  writtenBy: string[]
  studioLock: boolean
  taglineLock: boolean
  creatorLock: boolean
  musicLock: boolean
  directedLock: boolean
  writtenLock: boolean
  genresLock: boolean

  //Other
  order: number
  seasonNumber: number
  logoSrc: string
  logosUrls: string[]
  coverSrc: string
  coversUrls: string[]
  backgroundSrc: string
  backgroundsUrls: string[]
  videoSrc: string
  musicSrc: string
  seriesID: string
  themdbID: number
  imdbID: string
  lastDisc: number
  folder: string
  showName: boolean
  audioTrackLanguage: string
  selectedAudioTrack: number
  subtitleTrackLanguage: string
  selectedSubtitleTrack: number
  episodes: Episode[]
  currentlyWatchingEpisode: number
  watched: boolean
}

export interface Episode {
  id: string

  //Common data
  name: string
  overview: string
  year: string
  nameLock: boolean
  yearLock: boolean
  overviewLock: boolean

  //Show
  score: number
  imdbScore: number
  directedBy: string[]
  writtenBy: string[]
  directedLock: boolean
  writtenLock: boolean

  //Song
  album: string
  albumArtist: string

  order: number
  runtime: number
  runtimeInSeconds: number
  episodeNumber: number
  seasonNumber: number
  videoSrc: string
  imgSrc: string
  imgUrls: string[]
  seasonID: string
  watched: boolean
  timeWatched: number
  chapters: Chapter[]
  mediaInfo?: MediaInfo
  videoTracks: VideoTrack[]
  audioTracks: AudioTrack[]
  subtitleTracks: SubtitleTrack[]
}
