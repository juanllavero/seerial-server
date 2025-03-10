import { EpisodeData } from "../interfaces/EpisodeData";
import { CastData } from "../interfaces/Details";

export interface SeasonData {
  id: string;

  //Common data
  name: string;
  year: string;
  overview: string;
  nameLock: boolean;
  orderLock: boolean;
  yearLock: boolean;
  overviewLock: boolean;

  //Movie
  score?: number;
  tagline?: string;
  creator?: string[];
  genres?: string[];
  cast?: CastData[];
  musicComposer?: string[];
  productionStudios?: string[];
  directedBy?: string[];
  writtenBy?: string[];
  studioLock?: boolean;
  taglineLock?: boolean;
  creatorLock?: boolean;
  musicLock?: boolean;
  directedLock?: boolean;
  writtenLock?: boolean;
  genresLock?: boolean;
  extras?: EpisodeData[];

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
  episodes: EpisodeData[];
  currentlyWatchingEpisode: number;
  watched: boolean;
}
