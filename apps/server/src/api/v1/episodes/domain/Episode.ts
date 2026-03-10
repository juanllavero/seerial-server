import type { Video } from '../../videos/domain/Video';

export interface Episode {
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

  video: Video;
}
