import { VideoData } from "@/api/v0/videos/videos.types";
import { WatchListData } from "@/api/v0/watch-lists/watch-lists.types";
import { Cast } from "moviedb-promise";

export interface MovieData {
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
  cast: Cast[];

  videoSrc: string;
  musicSrc: string;

  folder: string;

  logoSrc: string;
  logosUrls: string[];
  backgroundSrc: string;
  backgroundsUrls: string[];
  coverSrc: string;
  coversUrls: string[];

  watchLists: WatchListData[];

  videos: VideoData[];
  extras: VideoData[];
}
