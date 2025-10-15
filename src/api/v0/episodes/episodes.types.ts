import { VideoData } from "@/api/v0/videos/videos.types";

export interface EpisodeData {
  id: string;
  seasonId: string;
  name: string;
  nameLock: boolean;
  year: string;
  yearLock: boolean;
  overview: string;
  overviewLock: boolean;
  score: number;

  directedBy: string[];
  directedByLock: boolean;
  writtenBy: string[];
  writtenByLock: boolean;

  episodeNumber: number;
  seasonNumber: number;
  order: number;

  video: VideoData;
}
