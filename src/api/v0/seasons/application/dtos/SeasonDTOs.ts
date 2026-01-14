import { ApiResponse } from "@/api/v0/shared/application/dtos/DTOs";

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

export interface SetWatchStateDTO {
  watched: boolean;
  userId: string;
}

export interface SeasonResponse extends ApiResponse {}
