import {
  AudioTrack,
  Chapter,
  MediaInfo,
  SubtitleTrack,
  VideoTrack,
} from "./MediaInfo";

export interface Cast {
  name: string;
  character: string;
  profileImage: string;
}

export interface Library {
  id?: number;
  name: string;
  language: string;
  type: string;
  order: number;
  folders: string[];
  preferAudioLan?: string;
  preferSubLan?: string;
  subsMode?: string;
  analyzedFiles: any;
  analyzedFolders: any;
  seasonFolders: any;
}

export interface Collection {
  id?: number;
  title: string;
  description?: string;
}

export interface Series {
  id?: number;
  libraryId: number;
  themdbID: number;
  order: number;
  name: string;
  nameLock: boolean;
  overview: string;
  overviewLock: boolean;
  year: string;
  yearLock: boolean;
  score: number;
  tagline: string;
  taglineLock: boolean;

  logoSrc: string;
  logosUrls: string[];
  coverSrc: string;
  coversUrls: string[];

  productionStudios: string[];
  productionStudiosLock: boolean;
  creator: string[];
  creatorLock: boolean;
  musicComposer: string[];
  musicComposerLock: boolean;
  genres: string[];
  genresLock: boolean;
  cast: Cast[];

  folder: string;
  episodeGroupID: string;
  analyzingFiles: boolean;
  currentlyWatchingEpisodeID: number;
  watched: boolean;
}

export interface Season {
  id?: number;
  seriesID: number;
  themdbID: number;
  order: number;
  name: string;
  nameLock: boolean;
  year: string;
  yearLock: boolean;
  overview: string;
  overviewLock: boolean;
  seasonNumber: number;

  coverSrc: string;
  coversUrls: string[];
  backgroundSrc: string;
  backgroundsUrls: string[];
  videoSrc: string;
  musicSrc: string;
  folder: string;

  audioTrackLanguage: string;
  selectedAudioTrack: number;
  subtitleTrackLanguage: string;
  selectedSubtitleTrack: number;
  watched: boolean;
}

export interface Episode {
  id?: number;
  seasonID: number;
  name: string;
  nameLock: boolean;
  year: string;
  yearLock: boolean;
  overview: string;
  overviewLock: boolean;
  score: number;

  directedBy: string[];
  directedByLock: boolean;
  writtenBy: string[];
  writtenByLock: boolean;

  episodeNumber: number;
  seasonNumber: number;
  order: number;

  video: Video;
}

export interface Movie {
  id?: number;
  libraryId: number;
  imdbId: string;
  themdbId: number;
  imdbScore: number;
  score: number;
  order: number;
  name: string;
  nameLock: boolean;
  overview: string;
  overviewLock: boolean;
  year: string;
  yearLock: boolean;
  tagline: string;
  taglineLock: boolean;

  genres: string[];
  genresLock: boolean;
  productionStudios: string[];
  productionStudiosLock: boolean;
  directedBy: string[];
  directedByLock: boolean;
  writtenBy: string[];
  writtenByLock: boolean;
  creator: string[];
  creatorLock: boolean;
  musicComposer: string[];
  musicComposerLock: boolean;
  cast: Cast[];

  logoSrc: string;
  logosUrls: string[];
  coverSrc: string;
  coversUrls: string[];
  watched: boolean;
}

export interface Video {
  id?: number;
  fileSrc: string;
  runtime: number;
  imgSrc: string;
  imgUrls: string[];
  watched: boolean;
  timeWatched: number;
  lastWatched: string;

  mediaInfo?: MediaInfo;
  videoTracks?: VideoTrack[];
  subtitleTracks?: SubtitleTrack[];
  audioTracks?: AudioTrack[];
  chapters?: Chapter[];

  isMovieExtra: boolean;
  extra_type?: string;

  episodeId?: number;
  movieId?: number;
}
