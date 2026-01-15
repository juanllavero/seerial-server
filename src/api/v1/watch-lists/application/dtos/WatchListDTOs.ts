export interface UpdateWatchStateDTO {
  videoId: string;
  timeWatched: number;
  watched: boolean;
  userId: string;
}

export interface WatchListResponse {
  status: string;
  message: string;
  data?: any;
}
