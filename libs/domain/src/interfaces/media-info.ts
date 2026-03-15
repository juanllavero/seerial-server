export interface MediaInfoData {
    mediaInfo: MediaInfo | undefined;
    videoTracks: VideoTrack[];
    subtitleTracks: SubtitleTrack[];
    audioTracks: AudioTrack[];
    chapters: Chapter[];
    duration: number;
}

export interface AudioInfo {
    artist: string;
    album: string;
    genres: string[];
    composers: string[];
    artists: string[];
    trackNumber: number;
    discNumber: number;
    date: string;
    title: string;
    codec: string;
    duration: number;
}

export interface MediaInfo {
    file: string;
    location: string;
    bitrate: string;
    duration: string;
    size: string;
    container: string;
}

export interface Chapter {
    title: string;
    time: number;
    displayTime: string;
    thumbnailSrc: string;
}

export interface VideoTrack {
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

export interface AudioTrack {
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

export interface SubtitleTrack {
    displayTitle: string;
    id: number;
    language: string;
    languageTag: string;
    selected: boolean;
    codec: string;
    codecExt: string;
    title: string;
}
