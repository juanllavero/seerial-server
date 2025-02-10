export interface MediaInfo {
  mediaInfo: MediaInfoData;
  videoTracks: VideoTrackData[];
  audioTracks: AudioTrackData[];
  subtitleTracks: SubtitleTrackData[];
  chapters: ChapterData[];
}

export interface MediaInfoData {
  file: string;
  location: string;
  bitrate: string;
  duration: string;
  size: string;
  container: string;
}

export interface ChapterData {
  title: string;
  time: number;
  displayTime: string;
  thumbnailSrc: string;
}

export interface VideoTrackData {
  displayTitle: string;
  id: number;
  selected: boolean;
  codec: string;
  codecExt: string;
  bitrate: string;
  framerate: string;
  codedHeight: string;
  codedWidth: string;
  chromaLocation: string;
  colorSpace: string;
  aspectRatio: string;
  profile: string;
  refFrames: string;
  colorRange: string;
}

export interface AudioTrackData {
  displayTitle: string;
  id: number;
  language: string;
  languageTag: string;
  selected: boolean;
  codec: string;
  codecExt: string;
  channels: string;
  channelLayout: string;
  bitrate: string;
  bitDepth: string;
  profile: string;
  samplingRate: string;
}

export interface SubtitleTrackData {
  displayTitle: string;
  id: number;
  language: string;
  languageTag: string;
  selected: boolean;
  codec: string;
  codecExt: string;
  title: string;
}
