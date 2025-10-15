import { EpisodeData } from "@/api/v0/episodes/episodes.types";
import { WatchListData } from "@/api/v0/watch-lists/watch-lists.types";

export interface SeasonData {
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

  watchLists: WatchListData[];

  episodes: EpisodeData[];
}
