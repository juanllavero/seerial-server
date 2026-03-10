import type { Cast } from 'moviedb-promise';
import type { Season } from '../../seasons/domain/Season';
import type { WatchList } from '../../watch-lists/domain/WatchList';

export interface Series {
  id: string;
  libraryId: string;
  themdbId: number;
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

  preferAudioLan?: string;
  preferSubLan?: string;
  subsMode?: string;

  folder: string;
  episodeGroupId: string | null;
  analyzingFiles: boolean;

  watchLists: WatchList[];

  seasons: Season[];
}
