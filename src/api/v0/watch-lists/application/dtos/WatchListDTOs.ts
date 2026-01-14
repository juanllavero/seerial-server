import { ApiResponse } from "@/api/v0/shared/application/dtos/DTOs";

export interface UpdateWatchStateDTO {
  videoId: string;
  timeWatched: number;
  watched: boolean;
  userId: string;
}

export interface WatchListResponse extends ApiResponse {}
