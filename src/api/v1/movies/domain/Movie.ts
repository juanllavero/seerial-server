import { CastData } from "@/data/interfaces/Media";
import { Video } from "../../videos/domain/Video";
import { WatchList } from "../../watch-lists/domain/WatchList";

export interface Movie {
  id: string;
  libraryId: string;
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
  cast: CastData[];

  videoSrc: string;
  musicSrc: string;

  folder: string;

  logoSrc: string;
  logosUrls: string[];
  backgroundSrc: string;
  backgroundsUrls: string[];
  coverSrc: string;
  coversUrls: string[];

  watchLists: WatchList[];

  videos: Video[];
  extras: Video[];
}
