import { SeasonData } from "@/api/v0/seasons/seasons.types";
import { WatchListData } from "@/api/v0/watch-lists/watch-lists.types";
import { Cast } from "moviedb-promise";

export interface SeriesData {
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

  watchLists: WatchListData[];

  seasons: SeasonData[];
}
