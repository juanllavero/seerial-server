import { ApiResponse } from "@/api/v0/shared/application/dtos/DTOs";

export interface UpdateEpisodeDTO {
  title?: string;
  episodeNumber?: number;
  description?: string;
  airDate?: string;
  duration?: number;
}

export interface SetWatchStateDTO {
  state: boolean;
}

export interface EpisodeResponse extends ApiResponse {}
