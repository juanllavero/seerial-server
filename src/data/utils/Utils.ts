import axios from "axios";
import { spawn } from "child_process";
import ffmpegPath from "ffmpeg-static";
import ffprobePath from "ffprobe-static";
import ffmpeg from "fluent-ffmpeg";
import * as fs from "fs";
import { Episode as MovieDBEpisode, TvSeasonResponse } from "moviedb-promise";
import path from "path";
import { EpisodeData } from "../interfaces/EpisodeData";
import {
  AudioTrackData,
  ChapterData,
  MediaInfoData,
  SubtitleTrackData,
  VideoTrackData,
} from "../interfaces/MediaInfo";
import { Episode } from "../objects/Episode";
import { Library } from "../objects/Library";
import { Season } from "../objects/Season";
import { Series } from "../objects/Series";
import { WebSocketManager } from "./WebSocketManager";

ffmpeg.setFfprobePath(ffprobePath.path);

export class Utils {
  static videoExtensions = [
    ".mp4",
    ".mkv",
    ".avi",
    ".mov",
    ".wmv",
    ".flv",
    ".mpeg",
    ".m2ts",
  ];
  static audioExtensions = [
    ".mp3",
    ".flac",
    ".wav",
    ".m4a",
    ".ogg",
    ".aac",
    ".wma",
  ];

  // Function to resize to 1080p
  public static resizeToMaxResolution = (
    inputPath: string,
    outputPath: string
  ) => {
    return new Promise<void>((resolve, reject) => {
      ffmpeg.setFfmpegPath(ffmpegPath || "");
      ffmpeg(inputPath)
        .outputOptions(
          "-vf",
          "scale='if(gt(iw,720),720,iw)':'if(gt(ih,480),480,ih)'"
        ) // Resize to 1080p if necessary
        .output(outputPath)
        .on("end", () => resolve())
        .on("error", (err) => reject(err))
        .run();
    });
  };

  //#region FILE SEARCH
  public static extractNameAndYear(source: string) {
    // Remove parentheses and extra spaces
    const cleanSource = source
      .replace(/[()]/g, "")
      .replace(/\s{2,}/g, " ")
      .trim();

    // Regex to get name and year
    const regex = /^(.*?)(?:[\s.-]*(\d{4}))?$/;
    const match = cleanSource.match(regex);

    let name = "";
    let year = "1";

    if (match) {
      name = match[1];
      year = match[2] || "1";
    } else {
      name = cleanSource;
    }

    // Clean and format the name
    name = name
      .replace(/[-_]/g, " ")
      .replace(/\s{2,}/g, " ")
      .trim();

    return [name, year];
  }

  /**
   * Function to detect episode and season numbers in a video file name
   * @param filename path to the video file
   * @returns array of 1 to 2 elements corresponding with the episode and season number detected, or NaN if no episode was found
   */
  public static extractEpisodeSeason(filename: string): [number, number?] {
    const regexPatterns = [
      /[Ss](\d{1,4})[Ee](\d{1,4})/i, // S01E02, s1e2, S1.E2
      /[Ss](\d{1,4})[\.]?E(\d{1,4})/i, // S1.E2
      /[Ss](\d{1,4})[\s\-]+Ep?(\d{1,4})/i, // S01 E02, S1 E2
      /(?:\b|^)(\d{1,4})(?:[^\d]+(\d{1,4}))?/i, // General case, exclude the first number for episodes
    ];

    for (const regex of regexPatterns) {
      const match = filename.match(regex);
      if (match) {
        let episode, season;
        if (regex === regexPatterns[3] && match[2]) {
          // Only consider the second number as the episode if two numbers are present
          episode = parseInt(match[2], 10);
          season = undefined;
        } else {
          episode = parseInt(match[2] ?? match[1], 10);
          season = match[2] ? parseInt(match[1], 10) : undefined;
        }
        return season ? [episode, season] : [episode];
      }
    }

    return [NaN]; // Return NaN if no episode found
  }

  // Index episodes and seasons of a show to quicker access
  public static indexSeasons(
    seasonsMetadata: TvSeasonResponse[]
  ): Map<
    number,
    { season: TvSeasonResponse; episodesMap: Map<number, MovieDBEpisode> }
  > {
    const index = new Map<
      number,
      { season: TvSeasonResponse; episodesMap: Map<number, MovieDBEpisode> }
    >();

    for (const season of seasonsMetadata) {
      if (season.season_number != null) {
        const episodesMap = new Map<number, MovieDBEpisode>();
        if (season.episodes) {
          for (const episode of season.episodes) {
            if (episode.episode_number != null) {
              episodesMap.set(episode.episode_number, episode);
            }
          }
        }
        index.set(season.season_number, { season, episodesMap });
      }
    }
    return index;
  }

  // Función para construir un arreglo con la cuenta acumulada de episodios por temporada.
  public static buildCumulativeEpisodes(
    seasonsMetadata: TvSeasonResponse[]
  ): number[] {
    const cumulative: number[] = [];
    let total = 0;

    // Se consideran temporadas con número válido y que tengan episodios.
    for (const season of seasonsMetadata) {
      if (
        season.season_number != null &&
        season.season_number >= 1 &&
        season.episodes
      ) {
        total += season.episodes.length;
        cumulative.push(total);
      }
    }
    return cumulative;
  }

  // Returns the season and episode by absolute number
  public static getSeasonEpisodeByAbsoluteNumber(
    absoluteNumber: number,
    seasonsMetadata: TvSeasonResponse[],
    cumulative: number[]
  ): { season: TvSeasonResponse; episode: MovieDBEpisode } | null {
    for (let i = 0; i < cumulative.length; i++) {
      if (absoluteNumber <= cumulative[i]) {
        const season = seasonsMetadata[i];
        const previousCount = i > 0 ? cumulative[i - 1] : 0;
        const episodeIndex = absoluteNumber - previousCount - 1; // índice basado en 0
        if (season.episodes && season.episodes[episodeIndex]) {
          return { season, episode: season.episodes[episodeIndex] };
        }
      }
    }
    return null;
  }
  //#endregion

  //#region FFPROBE
  public static async probeMediaFile(
    filePath: string,
    timeoutMs: number = 10000
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      // Create a timeout to stop execution
      const timeout = setTimeout(() => {
        reject(new Error("ffprobe timed out"));
      }, timeoutMs);

      // Exec ffprobe
      ffmpeg.ffprobe(filePath, (err, data) => {
        clearTimeout(timeout); // Clear timeout if ffprobe resolves

        if (err) {
          reject(err);
          return;
        }

        resolve(data);
      });
    });
  }
  //#endregion

  //#region MEDIA INFO
  public static async getOnlyRuntime(
    song: Episode,
    musicFile: string
  ): Promise<void> {
    try {
      const data = await this.probeMediaFile(musicFile);
      const format = data?.format;

      if (format && format.duration) {
        song.runtimeInSeconds = format.duration;
        song.runtime = song.runtimeInSeconds / 60;
      } else {
        console.log("Failed to get runtime for song:", musicFile);
      }
    } catch (err) {
      console.log("Failed to get runtime", { error: err });
      throw err; // Re-lanzar el error para que el llamador lo maneje si es necesario
    }
  }

  public static async getMediaInfo(
    episode: EpisodeData | undefined,
    getChapters: boolean = true
  ): Promise<EpisodeData | undefined> {
    if (!episode) {
      console.log("Episode is undefined, skipping media info retrieval");
      return undefined;
    }

    const videoPath = episode.videoSrc;

    if (!videoPath || videoPath === "") {
      console.log("Video file does not exist or path is empty", { videoPath });
      return undefined;
    }

    try {
      const data = await this.probeMediaFile(videoPath);
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

      const mediaInfo: MediaInfoData = {
        file: path.basename(videoPath),
        location: videoPath,
        bitrate: format.bit_rate
          ? (format.bit_rate / Math.pow(10, 3)).toFixed(2) + " kbps"
          : "0",
        duration: format.duration ? Utils.formatTime(format.duration) : "0",
        size: fileSize.toFixed(2) + sizeSufix,
        container: path.extname(videoPath).replace(".", "").toUpperCase(),
      };
      episode.mediaInfo = mediaInfo;

      // Establece la duración real del video
      if (format.duration) {
        episode.runtimeInSeconds = format.duration;
        episode.runtime = episode.runtimeInSeconds / 60;
      }

      // Limpia las listas anteriores de pistas
      episode.videoTracks = [];
      episode.audioTracks = [];
      episode.subtitleTracks = [];

      for (const stream of streams) {
        const codecType = stream.codec_type;
        if (codecType === "video") {
          Utils.processVideoData(stream, episode);
        } else if (codecType === "audio") {
          Utils.processAudioData(stream, episode);
        } else if (codecType === "subtitle") {
          Utils.processSubtitleData(stream, episode);
        }
      }

      if (getChapters) {
        episode.chapters = await this.getChapters(episode);
      }

      return episode;
    } catch (err) {
      console.log("Failed to get media info", { error: err });
      throw err; // Re-lanzar para manejo externo si es necesario
    }
  }

  // Procesa datos de video
  private static processVideoData(stream: any, episode: EpisodeData) {
    const videoTrack: VideoTrackData = {
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

    resolution = Utils.formatResolution(
      videoTrack.codedWidth,
      videoTrack.codedHeight
    );

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
    episode.videoTracks.push(videoTrack);
  }

  // Procesa datos de audio
  private static processAudioData(stream: any, episode: EpisodeData) {
    const audioTrack: AudioTrackData = {
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
      audioTrack.channels = Utils.formatAudioChannels(stream.channels);

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
    episode.audioTracks.push(audioTrack);
  }

  // Procesa datos de subtítulos
  private static processSubtitleData(stream: any, episode: EpisodeData) {
    const subtitleTrack: SubtitleTrackData = {
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
    episode.subtitleTracks.push(subtitleTrack);
  }

  // Formato de la resolución del video
  private static formatResolution(width: string, height: string): string {
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

  // Formato de los canales de audio
  private static formatAudioChannels(channels: number): string {
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

  public static convertTime(milliseconds: number): string {
    const seconds = milliseconds / 1000;
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);

    return `${h.toString().padStart(2, "0")}:${m
      .toString()
      .padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }

  public static formatTime(time: number): string {
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

  public static async getChapters(
    episode: EpisodeData
  ): Promise<ChapterData[]> {
    const chaptersArray: ChapterData[] = [];
    if (!episode.videoSrc || episode.videoSrc === "") {
      console.log("No video source provided for chapters extraction", {
        episode,
      });
      return chaptersArray;
    }

    const ffprobeCommand = `${ffprobePath.path} -v error -show_entries chapter -of json -i "${episode.videoSrc}"`;
    const timeoutMs = 10000;

    return new Promise((resolve) => {
      console.log(`Extracting chapters for episode: ${episode.videoSrc}`, {
        command: ffprobeCommand,
      });

      const process = spawn(ffprobePath.path, [
        "-v",
        "error",
        "-show_entries",
        "chapter",
        "-of",
        "json",
        "-i",
        episode.videoSrc,
      ]);

      let stdout = "";
      let stderr = "";

      process.stdout.on("data", (data) => (stdout += data));
      process.stderr.on("data", (data) => (stderr += data));

      const timeout = setTimeout(() => {
        process.kill("SIGTERM");
        console.log(`ffprobe timed out after ${timeoutMs}ms`, {
          file: episode.videoSrc,
        });
        resolve(chaptersArray);
      }, timeoutMs);

      process.on("close", (code) => {
        clearTimeout(timeout);
        if (code !== 0) {
          console.log("ffprobe exited with error", {
            code,
            stderr,
            file: episode.videoSrc,
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
                displayTime: Utils.formatTime(chapter.start_time || 0),
                thumbnailSrc: "",
              };
              chaptersArray.push(chapterData);
            }
            console.log("Chapters extracted", {
              chapterCount: chaptersArray.length,
            });
          } else {
            console.log("No chapters found in the file", {
              file: episode.videoSrc,
            });
          }
        } catch (error: any) {
          console.log("Error parsing chapters", {
            error: error.message,
            file: episode.videoSrc,
          });
        }
        resolve(chaptersArray);
      });
    });
  }
  //#endregion

  public static createFolder = async (folderDir: string) => {
    if (!fs.existsSync(folderDir)) {
      fs.mkdirSync(folderDir);
    }
  };

  public static getImages = async (dirPath: string) => {
    try {
      const files = fs.readdirSync(dirPath);
      const images = files.filter((file) =>
        [".png", ".jpg", ".jpeg", ".gif"].includes(
          path.extname(file).toLowerCase()
        )
      );
      return images.map((image) => path.join(dirPath, image));
    } catch (error) {
      console.log(
        "DataManager.getImages: Error getting images for path " + dirPath
      );
      return [];
    }
  };

  public static getExternalPath(relativePath: string): string {
    const basePath = "/";
    return path.join(basePath, relativePath);
  }

  public static getInternalPath(relativePath: string): string {
    const filePath = path.join(__dirname, "../../src/", relativePath); // In development
    return filePath;
  }

  public static downloadImage = async (url: string, filePath: string) => {
    try {
      const response = await axios({
        url,
        method: "GET",
        responseType: "stream",
      });

      return new Promise<void>((resolve, reject) => {
        const writer = fs.createWriteStream(filePath);
        response.data.pipe(writer);
        writer.on("finish", resolve);
        writer.on("error", reject);
      });
    } catch (error: any) {
      throw new Error(`Error downloading image: ${error.message}`);
    }
  };

  public static getFileName(filePath: string) {
    const fileNameWithExtension = filePath.split(/[/\\]/).pop() || "";
    const fileName =
      fileNameWithExtension.split(".").slice(0, -1).join(".") ||
      fileNameWithExtension;
    return fileName;
  }

  public static isFolder = async (folderPath: string): Promise<boolean> => {
    try {
      const stats = await fs.promises.stat(folderPath);
      return stats.isDirectory();
    } catch (error) {
      console.error(
        `isFolder: Error al acceder a la ruta ${folderPath}:`,
        error
      );
      return false;
    }
  };

  public static getFilesInFolder = async (folderPath: string) => {
    try {
      const stats = await fs.promises.stat(folderPath);

      if (!stats.isDirectory()) {
        return [];
      }

      return await fs.promises.readdir(folderPath, { withFileTypes: true });
    } catch (error) {
      console.error(
        `getFilesInFolder: Error al acceder a la ruta ${folderPath}:`,
        error
      );
      return [];
    }
  };

  public static getValidVideoFiles = async (folderPath: string) => {
    const videoFiles: string[] = [];
    const filesAndFolders = await this.getFilesInFolder(folderPath);

    // Get video files in folder dir and subfolders (only 1 step of depth)
    for (const fileOrFolder of filesAndFolders) {
      const fullPath = path.join(folderPath, fileOrFolder.name);

      if (fileOrFolder.isFile() && this.isVideoFile(fullPath)) {
        videoFiles.push(fullPath);
      } else if (fileOrFolder.isDirectory()) {
        const subFiles = await fs.promises.readdir(fullPath);
        for (const subFile of subFiles) {
          const subFilePath = path.join(fullPath, subFile);
          if (
            fs.lstatSync(subFilePath).isFile() &&
            this.isVideoFile(subFilePath)
          ) {
            videoFiles.push(subFilePath);
          }
        }
      }
    }

    return videoFiles;
  };

  public static isVideoFile(filePath: string): boolean {
    const ext = path.extname(filePath).toLowerCase();
    return this.videoExtensions.includes(ext);
  }

  public static isAudioFile(filePath: string): boolean {
    const ext = path.extname(filePath).toLowerCase();
    return this.audioExtensions.includes(ext);
  }

  public static fileExists(filePath: string): boolean {
    return fs.existsSync(filePath);
  }

  public static createJSONFileIfNotExists(filePath: string, content: any) {
    if (!this.fileExists(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(content));
    }
  }

  public static getMusicFiles = async (
    folderPath: string
  ): Promise<string[]> => {
    const musicFiles: string[] = [];
    const searchDepth: number = 4;

    // Recursive function to explore subfolders
    const exploreDirectory = async (
      currentPath: string,
      currentDepth: number
    ): Promise<void> => {
      const entries = await this.getFilesInFolder(currentPath);

      for (const entry of entries) {
        const entryPath = path.join(currentPath, entry.name);

        if (entry.isFile() && this.isAudioFile(entryPath)) {
          musicFiles.push(entryPath);
        } else if (entry.isDirectory() && currentDepth < searchDepth) {
          await exploreDirectory(entryPath, currentDepth + 1);
        }
      }
    };

    await exploreDirectory(folderPath, 0);

    return musicFiles;
  };

  /**
   * Function to search for an image in a folder
   * @param folderPath string that represents the folder path
   * @returns string representing the image path if found or null if not
   */
  public static findImageInFolder = async (
    folderPath: string
  ): Promise<string | null> => {
    const files = await fs.promises.readdir(folderPath);
    const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".bmp"];

    for (const file of files) {
      const fileExt = path.extname(file).toLowerCase();
      if (
        imageExtensions.includes(fileExt) &&
        file.toLowerCase().includes("cover")
      ) {
        return path.join(folderPath, file);
      }
    }

    return null;
  };

  /**
   * Checks if a string is a valid URL
   * @param urlString string representing the URL
   * @returns
   */
  public static isValidURL = (urlString: string) => {
    try {
      const url = new URL(urlString);
      return url.protocol === "http:" || url.protocol === "https:";
    } catch (err) {
      return false;
    }
  };

  //#region WEBSOCKET CONTENT MESSAGES
  public static addLibrary = (ws: WebSocketManager, library: Library) => {
    const message = {
      header: "ADD_LIBRARY",
      body: {
        library: library.toJSON(),
      },
    };
    ws.broadcast(JSON.stringify(message));
  };

  public static updateLibrary = (ws: WebSocketManager, library: Library) => {
    const message = {
      header: "UPDATE_LIBRARY",
      body: {
        library: library.toJSON(),
      },
    };
    ws.broadcast(JSON.stringify(message));
  };

  public static addSeries = (
    ws: WebSocketManager,
    libraryId: string,
    series: Series
  ) => {
    const message = {
      header: "ADD_SERIES",
      body: {
        libraryId: libraryId,
        series: series.toJSON(),
      },
    };
    ws.broadcast(JSON.stringify(message));
  };

  public static updateSeries = (
    ws: WebSocketManager,
    libraryId: string,
    series: Series
  ) => {
    const message = {
      header: "UPDATE_SERIES",
      body: {
        libraryId: libraryId,
        series: series.toJSON(),
      },
    };
    ws.broadcast(JSON.stringify(message));
  };

  public static addSeason = (
    ws: WebSocketManager,
    libraryId: string,
    season: Season
  ) => {
    const message = {
      header: "ADD_SEASON",
      body: {
        libraryId: libraryId,
        season: season.toJSON(),
      },
    };
    ws.broadcast(JSON.stringify(message));
  };

  public static addEpisode = (
    ws: WebSocketManager,
    libraryId: string,
    showId: string,
    episode: Episode
  ) => {
    const message = {
      header: "ADD_EPISODE",
      body: {
        libraryId: libraryId,
        showId: showId,
        episode: episode.toJSON(),
      },
    };
    ws.broadcast(JSON.stringify(message));
  };

  public static deleteSeason = (
    ws: WebSocketManager,
    libraryId: string,
    seriesId: string,
    seasonId: string
  ) => {
    const message = {
      header: "DELETE_SEASON",
      body: {
        libraryId,
        seriesId,
        seasonId,
      },
    };
    ws.broadcast(JSON.stringify(message));
  };

  public static deleteSeries = (
    ws: WebSocketManager,
    libraryId: string,
    seriesId: string
  ) => {
    const message = {
      header: "DELETE_SERIES",
      body: {
        libraryId,
        seriesId,
      },
    };
    ws.broadcast(JSON.stringify(message));
  };
  //#endregion

  //#region BACKGROUND PROCESSING
  // public static async saveBackground(season: Season, imageToCopy: string) {
  // 	const baseDir = `resources/img/backgrounds/${season.getId()}/`;
  // 	await fsExtra.ensureDir(baseDir);

  // 	try {
  // 		// Copy the original image
  // 		await fsExtra.copy(imageToCopy, path.join(baseDir, "background.jpg"));
  // 		season.setBackgroundSrc(path.join(baseDir, "background.jpg"));

  // 		// Process blur and save
  // 		this.processBlurAndSave(
  // 			this.getExternalPath(season.getBackgroundSrc()),
  // 			path.join(baseDir, "fullBlur.jpg")
  // 		);
  // 	} catch (e) {
  // 		console.error("saveBackground: error processing image with blur");
  // 	}
  // }

  // public static async saveBackgroundNoSeason(
  // 	seasonId: string,
  // 	imageToCopy: string
  // ) {
  // 	const baseDir = `resources/img/backgrounds/${seasonId}/`;
  // 	await fsExtra.ensureDir(baseDir);

  // 	try {
  // 		// Copy the original image
  // 		await fsExtra.copy(imageToCopy, path.join(baseDir, "background.jpg"));

  // 		// Process blur and save
  // 		await this.processBlurAndSave(
  // 			this.getExternalPath(baseDir + "background.jpg"),
  // 			path.join(baseDir, "fullBlur.jpg")
  // 		);
  // 	} catch (e) {
  // 		console.error("saveBackground: error processing image with blur");
  // 	}
  // }

  // public static processBlurAndSave = async (
  // 	imagePath: string,
  // 	outputPath: string
  // ) => {
  // 	return new Promise<void>(async (resolve, reject) => {
  // 		let imageMagickPath = await this.getInternalPath("lib/magick.exe");
  // 		// Comando de ImageMagick usando la versión portable, añadiendo compresión
  // 		const command = `"${imageMagickPath}" "${imagePath}" -blur 0x${25} -quality ${75} "${outputPath}"`;

  // 		exec(command, (error, _stdout, stderr) => {
  // 			if (error) {
  // 				console.error(
  // 					`Error al aplicar blur a la imagen: ${error.message}`
  // 				);
  // 				reject(error);
  // 			} else if (stderr) {
  // 				console.error(`stderr: ${stderr}`);
  // 				reject();
  // 			} else {
  // 				resolve();
  // 			}
  // 		});
  // 	});
  // };
  //#endregion
}
