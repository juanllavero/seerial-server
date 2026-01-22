import {
  AudioTrack,
  Chapter as ChapterData,
  MediaInfo,
  MediaInfoData,
  SubtitleTrack,
  VideoTrack,
} from "@/data/interfaces/MediaInfo";
import path from "path";
import logger from "../utils/logger";
import { executeFfprobe, executeFfprobeRaw } from "./nativeFfmpeg";
import {
  formatTime,
  processAudioData,
  processSubtitleData,
  processVideoData,
} from "./utils/ffmpegUtils";

/**
 * Retrieves the duration of a video/audio file.
 * @param mediaFile - The path to the media file to probe for duration.
 * @returns The duration or 0.
 */
export async function getOnlyRuntime(mediaFile: string): Promise<number> {
  if (!mediaFile || typeof mediaFile !== "string") {
    logger.error("getOnlyRuntime: Invalid media file path provided.");
    return 0;
  }

  try {
    const data = await executeFfprobe(mediaFile);
    const duration = data?.format?.duration;

    if (typeof duration === "number" && !isNaN(duration)) {
      return duration / 60;
    }

    return 0;
  } catch (err) {
    return 0;
  }
}

export async function getMediaInfo(
  videoPath: string,
  extractChapters: boolean = true
): Promise<MediaInfoData | undefined> {
  if (!videoPath || videoPath === "") {
    logger.error({
      message: "Video file does not exist or path is empty",
      videoPath,
    });
    return undefined;
  }

  try {
    const data = await executeFfprobe(videoPath);
    const format = data.format;
    const streams = data.streams;

    // Configura la información general del medio
    let fileSize = format.size ? format.size : 0;
    let sizeSufix = " GB";
    fileSize = fileSize / Math.pow(1024, 3);

    if (fileSize < 1) {
      fileSize = fileSize * Math.pow(1024, 1);
      sizeSufix = " MB";
    }

    const mediaInfo: MediaInfo = {
      file: path.basename(videoPath),
      location: videoPath,
      bitrate: format.bit_rate
        ? (format.bit_rate / Math.pow(10, 3)).toFixed(2) + " kbps"
        : "0",
      duration: format.duration ? formatTime(format.duration) : "0",
      size: fileSize.toFixed(2) + sizeSufix,
      container: path.extname(videoPath).replace(".", "").toUpperCase(),
    };

    // Get the duration
    const duration = format.duration ? format.duration / 60 : 0;

    // Limpia las listas anteriores de pistas
    let videoTracks: VideoTrack[] = [];
    let audioTracks: AudioTrack[] = [];
    let subtitleTracks: SubtitleTrack[] = [];

    for (const stream of streams) {
      const codecType = stream.codec_type;
      if (codecType === "video") {
        videoTracks.push(processVideoData(stream));
      } else if (codecType === "audio") {
        audioTracks.push(processAudioData(stream));
      } else if (codecType === "subtitle") {
        subtitleTracks.push(processSubtitleData(stream));
      }
    }

    const chapters = extractChapters ? await getChapters(videoPath) : [];

    return {
      mediaInfo,
      videoTracks,
      audioTracks,
      subtitleTracks,
      chapters,
      duration,
    };
  } catch (err) {
    logger.error(err, "Failed to get media info");
    throw err; // Re-lanzar para manejo externo si es necesario
  }
}

export async function getChapters(videoPath: string): Promise<ChapterData[]> {
  const chaptersArray: ChapterData[] = [];

  try {
    const stdout = await executeFfprobeRaw([
      "-v",
      "error",
      "-show_entries",
      "chapter",
      "-of",
      "json",
      "-i",
      videoPath,
    ]);

    const metadata = JSON.parse(stdout);
    const chapters = metadata.chapters || [];
    if (chapters.length > 0) {
      for (const chapter of chapters) {
        const chapterData: ChapterData = {
          title: chapter.title || "Sin título",
          time: chapter.start_time || 0,
          displayTime: formatTime(chapter.start_time || 0),
          thumbnailSrc: "",
        };
        chaptersArray.push(chapterData);
      }
      logger.info({
        message: "Chapters extracted",
        chapterCount: chaptersArray.length,
      });
    } else {
      logger.info({
        message: "No chapters found in the file",
        file: videoPath,
      });
    }
  } catch (error: any) {
    logger.error({
      err: error,
      message: "Error getting chapters",
      file: videoPath,
    });
  }

  return chaptersArray;
}
