import { exec } from "child_process";
import { promisify } from "util";
import { AudioInfo } from "../data/interfaces/MediaInfo";
import { probeMediaFile } from "./execCommand";

const execAsync = promisify(exec);

export async function getAudioInfo(
  audioPath: string
): Promise<AudioInfo | undefined> {
  if (!audioPath || audioPath === "") {
    console.log("Audio file does not exist or path is empty", { audioPath });
    return undefined;
  }

  try {
    const data = await probeMediaFile(audioPath);
    const format = data.format;
    const tags = format.tags || {};
    const streams = data.streams;

    const codec =
      streams.find((s: any) => s.codec_type === "audio")?.codec_name ||
      "unknown";
    const duration = format.duration ? format.duration / 60 : 0;
    const artist = tags.album_artist || tags.artist || tags.ARTIST || "";
    const album = tags.album || tags.ALBUM || "";
    const date = tags.date || tags.DATE || tags.TYER || "";
    const genres =
      tags.genre?.split(",").map((g: string) => g.trim()) ??
      tags.GENRE?.split(",").map((g: string) => g.trim()) ??
      [];
    const title = tags.title || tags.TITLE || "";
    const discNumber = tags.disc ? Number.parseInt(tags.disc.split("/")[0]) : 0;
    const trackNumber = tags.track
      ? tags.track ?? 0
      : tags.TRACK
      ? tags.TRACK ?? 0
      : 0;
    const composers =
      tags.composer?.split(",").map((c: string) => c.trim()) ??
      tags.COMPOSER?.split(",").map((c: string) => c.trim()) ??
      [];
    const artists =
      tags.artist?.split(",").map((a: string) => a.trim()) ??
      tags.ARTIST?.split(",").map((a: string) => a.trim()) ??
      [];

    const hasEac3 = streams.some(
      (stream: any) =>
        stream.codec_type === "audio" && stream.codec_name === "eac3"
    );

    let hasDolbyAtmos = false;
    if (hasEac3) {
      hasDolbyAtmos = await checkForAtmos(audioPath);
    }

    return {
      codec,
      duration,
      artist,
      album,
      date,
      genres,
      title,
      discNumber,
      trackNumber,
      composers,
      artists,
      hasDolbyAtmos,
    };
  } catch (err) {
    console.log("Failed to get media info", { error: err });
    return undefined;
  }
}

async function checkForAtmos(filePath: string): Promise<boolean> {
  try {
    const { stderr } = await execAsync(`ffprobe -i "${filePath}"`);

    const output = stderr.toLowerCase();

    return output.includes("e-ac-3 joc") || output.includes("dolby atmos");
  } catch (error: any) {
    const stderr = error.stderr || "";
    const output = stderr.toLowerCase();
    return output.includes("e-ac-3 joc") || output.includes("dolby atmos");
  }
}
