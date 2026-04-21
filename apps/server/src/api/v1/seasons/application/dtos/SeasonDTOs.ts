export interface UpdateSeasonDTO {
  name?: string;
  nameLock?: boolean;
  year?: string;
  yearLock?: boolean;
  overview?: string;
  overviewLock?: boolean;
  seasonNumber?: number;
  backgroundSrc?: string;
  backgroundsUrls?: string[];
  videoSrc?: string;
  musicSrc?: string;
}

export interface SetSeasonWatchStateDTO {
  watched: boolean;
  userId: string;
}
