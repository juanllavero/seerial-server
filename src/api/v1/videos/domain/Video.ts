import {
  AudioTrack,
  Chapter,
  MediaInfo,
  SubtitleTrack,
  VideoTrack,
} from "@/data/interfaces/MediaInfo";
import { ContinueWatching } from "../../continue-watching/domain/ContinueWatching";
import { WatchList } from "../../watch-lists/domain/WatchList";

export interface Video {
  id: string;
  title: string;
  fileSrc: string;
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
