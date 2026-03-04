import {
  AudioTrack,
  SubtitleTrack,
  VideoTrack,
} from "@/data/interfaces/MediaInfo";

// Process video data
export function processVideoData(stream: any): VideoTrack {
  const videoTrack: VideoTrack = {
    id: stream.index,
    codec: stream.codec_name?.toUpperCase() || "",
    displayTitle: "",
    selected: false,
    codecExt: "",
    bitrate: "",
    framerate: "",
    codedHeight: "",
    codedWidth: "",
    chromaLocation: "",
    colorSpace: "",
    aspectRatio: "",
    profile: "",
    refFrames: "",
    colorRange: "",
  };

  let resolution: string = "";
  let hdr: string = "";

  if (stream.codec_long_name) videoTrack.codecExt = stream.codec_long_name;

  if (stream.tags && stream.tags["BPS"])
    videoTrack.bitrate = Math.round(
      parseFloat(stream.tags["BPS"]) / Math.pow(10, 3)
    ).toString();

  if (stream.avg_frame_rate) {
    const [numerator, denominator] = stream.avg_frame_rate
      .split("/")
      .map(Number);
    if (denominator && denominator !== 0) {
      videoTrack.framerate = (numerator / denominator).toFixed(3) + " fps";
    } else {
      videoTrack.framerate = numerator.toFixed(3) + " fps";
    }
  }

  videoTrack.codedWidth = stream.width ? stream.width : stream.codedWidth;
  videoTrack.codedHeight = stream.height ? stream.height : stream.codedHeight;

  resolution = formatResolution(videoTrack.codedWidth, videoTrack.codedHeight);

  if (stream["chroma_location"])
    videoTrack.chromaLocation = stream["chroma_location"];

  if (stream["color_space"]) {
    if (stream["color_space"] == "bt2020nc") hdr = "HDR10";
    videoTrack.colorSpace = stream["color_space"];
  }

  if (stream["display_aspect_ratio"])
    videoTrack.aspectRatio = stream["display_aspect_ratio"];

  if (stream["profile"]) videoTrack.profile = stream["profile"];

  if (stream["refs"]) videoTrack.refFrames = stream["refs"];

  if (stream["color_range"]) videoTrack.colorRange = stream["color_range"];

  // Rellenar otros datos
  videoTrack.displayTitle = `${resolution} ${hdr} (${videoTrack.codec} ${videoTrack.profile})`;

  return videoTrack;
}

// Process audio data
export function processAudioData(stream: any): AudioTrack {
  const audioTrack: AudioTrack = {
    id: stream.index,
    codec: stream.codec_name?.toUpperCase() || "",
    displayTitle: "",
    language: "",
    languageTag: "",
    selected: false,
    codecExt: "",
    channels: "",
    channelLayout: "",
    bitrate: "",
    bitDepth: "",
    profile: "",
    samplingRate: "",
  };

  if (stream.codec_long_name) audioTrack.codecExt = stream.codec_long_name;

  if (stream.channels)
    audioTrack.channels = formatAudioChannels(stream.channels);

  if (stream["channel_layout"])
    audioTrack.channelLayout = stream["channel_layout"];

  if (stream.tags && stream.tags["BPS"])
    audioTrack.bitrate = Math.round(
      parseFloat(stream.tags["BPS"]) / Math.pow(10, 3)
    ).toString();

  if (stream.tags && stream.tags["language"]) {
    audioTrack.languageTag = stream.tags["language"];

    const languageNames = new Intl.DisplayNames(["en"], {
      type: "language",
      languageDisplay: "standard",
    });
    const languageName = languageNames.of(audioTrack.languageTag);

    if (languageName) audioTrack.language = languageName;
  }

  if (stream["bits_per_raw_sample"] != "N/A")
    audioTrack.bitDepth = stream["bits_per_raw_sample"];

  if (stream["profile"]) {
    if (stream["profile"] == "DTS-HD MA") audioTrack.profile = "ma";
    else if (stream.profile == "LC") audioTrack.profile = "lc";
  }

  if (stream["sample_rate"])
    audioTrack.samplingRate = stream["sample_rate"] + " hz";

  let codecDisplayName: string = "";
  if (stream.profile && stream.profile == "DTS-HD MA")
    codecDisplayName = stream.profile;
  else codecDisplayName = stream.codec_name.toUpperCase();

  audioTrack.displayTitle = `(${codecDisplayName} ${audioTrack.channels})`;

  return audioTrack;
}

// Process subtitle data
export function processSubtitleData(stream: any): SubtitleTrack {
  const subtitleTrack: SubtitleTrack = {
    id: stream.index,
    codec: stream.codec_name?.toUpperCase() || "",
    displayTitle: "",
    language: "",
    languageTag: "",
    selected: false,
    codecExt: "",
    title: "",
  };

  let codecDisplayName: string = "";
  codecDisplayName = stream.codec_name.toUpperCase();

  if (codecDisplayName == "HDMV_PGS_SUBTITLE") codecDisplayName = "PGS";
  else if (codecDisplayName == "SUBRIP") codecDisplayName = "SRT";

  if (stream.codec_long_name) {
    subtitleTrack.codecExt = stream.codec_long_name;
  }

  if (stream.tags && stream.tags["language"]) {
    subtitleTrack.languageTag = stream.tags["language"];
    subtitleTrack.language = stream.language;
  }

  if (stream.tags && stream.tags["title"]) {
    subtitleTrack.title = stream.tags["title"];
  }

  subtitleTrack.displayTitle = `${
    stream.disposition["forced"] === 1 ? "(Forced)" : ""
  } (${codecDisplayName})`;

  return subtitleTrack;
}

// Format video resolution
export function formatResolution(width: string, height: string): string {
  const widthNum = parseInt(width, 10); // Convertir a número
  switch (widthNum) {
    case 7680:
      return "8K";
    case 3840:
      return "4K";
    case 2560:
      return "QHD";
    case 1920:
      return "1080p";
    case 1280:
      return "720p";
    case 854:
      return "480p";
    case 640:
      return "360p";
    default:
      return `${height}p`;
  }
}

// Format audio channels
export function formatAudioChannels(channels: number): string {
  switch (channels) {
    case 1:
      return "MONO";
    case 2:
      return "STEREO";
    case 6:
      return "5.1";
    case 8:
      return "7.1";
    default:
      return `${channels} channels`;
  }
}

export function convertTime(milliseconds: number): string {
  const seconds = milliseconds / 1000;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s
    .toString()
    .padStart(2, "0")}`;
}

export function formatTime(time: number): string {
  const h = Math.floor(time / 3600);
  const m = Math.floor((time % 3600) / 60);
  const s = Math.floor(time % 60);

  if (h > 0) {
    return `${h.toString().padStart(2, "0")}:${m
      .toString()
      .padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }

  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}
