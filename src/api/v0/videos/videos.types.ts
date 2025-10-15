import { ContinueWatchingData } from "@/api/v0/continue-watching/continue-watching.types";
import { WatchListData } from "@/api/v0/watch-lists/watch-lists.types";
import {
  AudioTrack,
  Chapter,
  MediaInfo,
  SubtitleTrack,
  VideoTrack,
} from "@/data/interfaces/MediaInfo";

export interface VideoData {
  id: string;
  title: string;
  fileSrc: string;
  runtime: number;
  imgSrc: string;
  imgUrls: string[];

  continueWatching: ContinueWatchingData[];
  watchLists: WatchListData[];

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
