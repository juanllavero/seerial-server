import { Episode } from "../../episodes/domain/Episode";
import { WatchList } from "../../watch-lists/domain/WatchList";

export interface Season {
  id: string;
  seriesId: string;
  order: number;
  name: string;
  nameLock: boolean;
  year: string;
  yearLock: boolean;
  overview: string;
  overviewLock: boolean;
  seasonNumber: number;

  backgroundSrc: string;
  backgroundsUrls: string[];
  videoSrc: string;
  musicSrc: string;

  watchLists: WatchList[];

  episodes: Episode[];
}
