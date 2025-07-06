import { spawn } from "child_process";
import ffprobePath from "ffprobe-static";
import path from "path";
import {
  AudioTrack,
  Chapter as ChapterData,
  MediaInfo,
  MediaInfoData,
  SubtitleTrack,
  VideoTrack,
} from "../data/interfaces/MediaInfo";
import { probeMediaFile } from "./execCommand";
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
    console.error("getOnlyRuntime: Invalid media file path provided.");
    return 0;
  }

  try {
    const data = await probeMediaFile(mediaFile);
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
    console.log("Video file does not exist or path is empty", { videoPath });
    return undefined;
  }

  try {
    const data = await probeMediaFile(videoPath);
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
    console.log("Failed to get media info", { error: err });
    throw err; // Re-lanzar para manejo externo si es necesario
  }
}

export async function getChapters(videoPath: string): Promise<ChapterData[]> {
  const chaptersArray: ChapterData[] = [];

  const timeoutMs = 10000;

  return new Promise((resolve) => {
    const process = spawn(ffprobePath.path, [
      "-v",
      "error",
      "-show_entries",
      "chapter",
      "-of",
      "json",
      "-i",
      videoPath,
    ]);

    let stdout = "";
    let stderr = "";

    process.stdout.on("data", (data) => (stdout += data));
    process.stderr.on("data", (data) => (stderr += data));

    const timeout = setTimeout(() => {
      process.kill("SIGTERM");
      console.log(`ffprobe timed out after ${timeoutMs}ms`, {
        file: videoPath,
      });
      resolve(chaptersArray);
    }, timeoutMs);

    process.on("close", (code) => {
      clearTimeout(timeout);
      if (code !== 0) {
        console.log("ffprobe exited with error", {
          code,
          stderr,
          file: videoPath,
        });
        resolve(chaptersArray);
        return;
      }

      try {
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
          console.log("Chapters extracted", {
            chapterCount: chaptersArray.length,
          });
        } else {
          console.log("No chapters found in the file", {
            file: videoPath,
          });
        }
      } catch (error: any) {
        console.log("Error parsing chapters", {
          error: error.message,
          file: videoPath,
        });
      }
      resolve(chaptersArray);
    });
  });
}
