import { CastData } from "./Details";
import { MediaInfo } from "./MediaInfo";

export interface Video {
  id: string;
  src: string;
  duration: number;
  mediaInfo?: MediaInfo;
}

export interface Extras {
  id: string;
  videos: Video[];
}

export interface Episode {
  id: string;
  video: Video;

  name: string;
  overview: string;
  year: string;
  nameLock: boolean;
  yearLock: boolean;
  overviewLock: boolean;

  score: number;
  imdbScore: number;
  directedBy: string[];
  writtenBy: string[];
  directedLock: boolean;
  writtenLock: boolean;

  order: number;
  runtime: number;
  runtimeInSeconds: number;
  episodeNumber: number;
  seasonNumber: number;
  imgSrc: string;
  imgUrls: string[];
  seasonID: string;
  watched: boolean;
  timeWatched: number;
}

export interface Season {
  id: string;

  //Common data
  name: string;
  year: string;
  score: number;
  imdbScore: number;
  nameLock: boolean;
  yearLock: boolean;
  seasonNumber: number;

  logoSrc: string;
  logosUrls: string[];
  coverSrc: string;
  coversUrls: string[];
  backgroundSrc: string;
  backgroundsUrls: string[];

  seriesID: string;
  themdbID: number;
  imdbID: string;
  lastDisc: number;
  folder: string;
  showName: boolean;
  audioTrackLanguage: string;
  selectedAudioTrack: number;
  subtitleTrackLanguage: string;
  selectedSubtitleTrack: number;
  episodes: Episode[];
  currentlyWatchingEpisode: number;
  watched: boolean;
}

export interface Show {
  id: string;

  //Common data
  name: string;
  overview: string;
  coverSrc: string;
  coversUrls: string[];
  nameLock: boolean;
  overviewLock: boolean;

  year: string;
  score: number;
  tagline: string;
  logoSrc: string;
  logosUrls: string[];
  creator: string[];
  genres: string[];
  cast: CastData[];
  musicComposer: string[];
  productionStudios: string[];
  yearLock: boolean;
  studioLock: boolean;
  taglineLock: boolean;
  creatorLock: boolean;
  musicLock: boolean;
  genresLock: boolean;

  watched: boolean;
  themdbID: number;
  isCollection: boolean;
  order: number;
  numberOfSeasons: number;
  numberOfEpisodes: number;
  folder: string;
  videoZoom: number;
  episodeGroupID: string;
  seasons: Season[];
  playSameMusic: boolean;
  analyzingFiles: boolean;
  currentlyWatchingSeason: number;
}

export interface Movie {
  id: string;
  video: Video;
  extras?: Extras;

  //Common data
  name: string;
  year: string;
  overview: string;
  nameLock: boolean;
  orderLock: boolean;
  yearLock: boolean;
  overviewLock: boolean;

  //Moviecreator:
  score: number;
  tagline: string;
  creator: string[];
  genres: string[];
  cast: CastData[];
  musicComposer: string[];
  productionStudios: string[];
  directedBy: string[];
  writtenBy: string[];
  studioLock: boolean;
  taglineLock: boolean;
  creatorLock: boolean;
  musicLock: boolean;
  directedLock: boolean;
  writtenLock: boolean;
  genresLock: boolean;

  //Other
  order: number;
  seasonNumber: number;
  logoSrc: string;
  logosUrls: string[];
  coverSrc: string;
  coversUrls: string[];
  backgroundSrc: string;
  backgroundsUrls: string[];
  videoSrc: string;
  musicSrc: string;
  seriesID: string;
  themdbID: number;
  imdbID: string;
  lastDisc: number;
  folder: string;
  showName: boolean;
  audioTrackLanguage: string;
  selectedAudioTrack: number;
  subtitleTrackLanguage: string;
  selectedSubtitleTrack: number;
  currentlyWatchingEpisode: number;
  watched: boolean;
}
