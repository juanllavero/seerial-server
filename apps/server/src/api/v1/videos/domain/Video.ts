import type {
  AudioTrack,
  Chapter,
  MediaInfo,
  SubtitleTrack,
  VideoTrack,
} from '@/data/interfaces/MediaInfo';
import type { ContinueWatching } from '../../continue-watching/domain/ContinueWatching';
import type { WatchList } from '../../watch-lists/domain/WatchList';

export interface Video {
  id: string;
  title: string;
  fileSrc: string;
  hash: string;
  runtime: number;
  imgSrc: string;
  imgUrls: string[];

  continueWatching: ContinueWatching[];
  watchLists: WatchList[];

  mediaInfo?: MediaInfo;
  videoTracks?: VideoTrack[];
  subtitleTracks?: SubtitleTrack[];
  audioTracks?: AudioTrack[];
  chapters?: Chapter[];

  selectedAudioTrack?: number;
  selectedSubtitleTrack?: number;

  extraType?: string;

  episodeId?: string;
  movieId?: string;
}

export enum VideoType {
  MAIN = 'MAIN',
  EXTRA = 'EXTRA',
}
