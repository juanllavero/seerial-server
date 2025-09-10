import axios from "axios";
import * as fs from "fs";
import { Episode as MovieDBEpisode, TvSeasonResponse } from "moviedb-promise";
import path from "path";
import { WebSocketManager } from "../WebSockets/WebSocketManager";
import { Episode, Season } from "../data/models";
import {
  getEpisodeById,
  getSeasonById,
  getSeriesById,
  getVideoByEpisodeId,
} from "../db/get/getData";
import {
  addVideoToContinueWatching,
  removeVideoFromContinueWatching,
} from "../db/post/postData";

export class Utils {
  static extraTypes = [
    "behindthescenes",
    "concert",
    "interview",
    "live",
    "lyrics",
    "video",
  ];
  static videoExtensions = [
    ".mp4",
    ".mkv",
    ".avi",
    ".mov",
    ".wmv",
    ".flv",
    ".mpeg",
    ".m2ts",
    ".webm",
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
  static webCompatibleAudioCodecs = [
    ".mp3",
    ".flac",
    ".wav",
    ".mp4",
    ".ogg",
    ".aac",
    ".wma",
    ".webm",
    ".caf",
  ];
  static imageExtensions = [
    ".jpg",
    ".jpeg",
    ".png",
    ".gif",
    ".bmp",
    ".webp",
    ".svg",
  ];

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
      /[Ss](\d{1,4})[Ee](\d{1,4})(?:v\d+)?/i, // S01E02, s1e2, S1.E2, S01E01v2
      /[Ss](\d{1,4})[\.]?E(\d{1,4})(?:v\d+)?/i, // S1.E2, S1.E2v1
      /[Ss](\d{1,4})[\s\-]+Ep?(\d{1,4})(?:v\d+)?/i, // S01 E02, S1 E2, con v2 opcional
      /-\s?(\d{1,4})(?:v\d+)?(?!p)/, // - 01, - 01v1 (anime style)
      /(?:\b|^)(\d{1,4})(?:[^\d]+(\d{1,4}))?/i, // General case
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

  //#region EPISODE WATCH STATE
  public static setEpisodeWatchState = async (
    season: Season,
    episodeToUpdate: Episode,
    state: boolean
  ) => {
    const series = await getSeriesById(season.seriesId);
    if (!series || series.seasons.length === 0) return;

    // Store previous episode marked as 'currently watching'
    const previousEpisodeId = series.currentlyWatchingEpisodeId;
    let nextEpisodeId: string | null = null;

    // Sort seasons
    const seasons = (
      await Promise.all(series.seasons.map((s) => getSeasonById(s.id)))
    )
      .filter((s): s is Season => !!s)
      .sort((a, b) => a.seasonNumber - b.seasonNumber);

    for (const s of seasons) {
      const episodes = (
        await Promise.all(s.episodes.map((e) => getEpisodeById(e.id)))
      )
        .filter((e): e is Episode => !!e)
        .sort((a, b) => a.episodeNumber - b.episodeNumber);

      if (s.seasonNumber < season.seasonNumber) {
        for (const e of episodes) {
          const video = await getVideoByEpisodeId(e.id);
          if (!video) continue;
          video.watched = true;
          video.lastWatched = "";
          video.timeWatched = 0;
          await video.save();
        }
        s.watched = true;
        await s.save();
        continue;
      }

      if (s.seasonNumber > season.seasonNumber) {
        for (const e of episodes) {
          const video = await getVideoByEpisodeId(e.id);
          if (!video) continue;
          video.watched = false;
          video.lastWatched = "";
          video.timeWatched = 0;
          await video.save();
        }
        s.watched = false;
        await s.save();
        continue;
      }

      // Current season
      let allWatchedThisSeason = true;

      for (let i = 0; i < episodes.length; i++) {
        const e = episodes[i];
        const video = await getVideoByEpisodeId(e.id);
        if (!video) continue;

        if (e.episodeNumber < episodeToUpdate.episodeNumber) {
          video.watched = true;
        } else if (e.episodeNumber === episodeToUpdate.episodeNumber) {
          video.watched = state;

          if (state === false) {
            nextEpisodeId = e.id;
          } else {
            if (i < episodes.length - 1) {
              nextEpisodeId = episodes[i + 1].id;
            } else {
              const seasonIdx = seasons.findIndex((ss) => ss.id === s.id);
              if (seasonIdx < seasons.length - 1) {
                const nextSeason = await getSeasonById(
                  seasons[seasonIdx + 1].id
                );
                if (nextSeason) {
                  const nextSeasonEpisodes = (
                    await Promise.all(
                      nextSeason.episodes.map((ne) => getEpisodeById(ne.id))
                    )
                  )
                    .filter((ne): ne is Episode => !!ne)
                    .sort((a, b) => a.episodeNumber - b.episodeNumber);
                  nextEpisodeId = nextSeasonEpisodes[0]?.id ?? null;
                }
              } else {
                nextEpisodeId = null; // last episode
              }
            }
          }
        } else {
          video.watched = false;
        }

        video.lastWatched = "";
        video.timeWatched = 0;
        await video.save();

        if (!video.watched) allWatchedThisSeason = false;
      }

      s.watched = allWatchedThisSeason;
      await s.save();
    }

    // Update series and continue watching
    if (previousEpisodeId) {
      const prevVideo = await getVideoByEpisodeId(previousEpisodeId);
      if (prevVideo) {
        await removeVideoFromContinueWatching(prevVideo.id);
      }
    }

    series.currentlyWatchingEpisodeId = nextEpisodeId ?? "";
    series.watched = !nextEpisodeId;
    await series.save();

    if (nextEpisodeId) {
      const nextVideo = await getVideoByEpisodeId(nextEpisodeId);
      if (nextVideo) {
        await addVideoToContinueWatching(nextVideo.id);
      }
    }
  };
  //#endregion

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
        } else if (
          entry.isDirectory() &&
          currentDepth < searchDepth &&
          !entry.name.startsWith("[")
        ) {
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

    for (const file of files) {
      const fileExt = path.extname(file).toLowerCase();
      if (
        this.imageExtensions.includes(fileExt) &&
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

  public static getFileInFolder = (folder: string, fileName: string) => {
    try {
      const files = fs.readdirSync(folder);

      const matchedFile = files.find((file) => {
        const fileNameWithoutExt = path.parse(file).name;
        return fileNameWithoutExt === fileName;
      });

      if (!matchedFile) {
        return "";
      }

      return path.join(folder, matchedFile);
    } catch (err) {
      return "";
    }
  };

  //#region WEBSOCKET CONTENT MESSAGES
  public static mutateLibraries = (ws: WebSocketManager) => {
    const message = {
      header: "MUTATE_LIBRARIES",
      body: {},
    };
    ws.broadcast(JSON.stringify(message));
  };

  public static mutateLibrary = (ws: WebSocketManager) => {
    const message = {
      header: "MUTATE_LIBRARY",
      body: {},
    };
    ws.broadcast(JSON.stringify(message));
  };

  public static mutateSeries = (ws: WebSocketManager) => {
    const message = {
      header: "MUTATE_SERIES",
      body: {},
    };
    ws.broadcast(JSON.stringify(message));
  };

  public static mutateSeason = (ws: WebSocketManager) => {
    const message = {
      header: "MUTATE_SEASON",
      body: {},
    };
    ws.broadcast(JSON.stringify(message));
  };

  public static mutateEpisode = (ws: WebSocketManager) => {
    const message = {
      header: "MUTATE_EPISODE",
      body: {},
    };
    ws.broadcast(JSON.stringify(message));
  };

  public static mutateMovie = (ws: WebSocketManager) => {
    const message = {
      header: "MUTATE_MOVIE",
      body: {},
    };
    ws.broadcast(JSON.stringify(message));
  };

  public static mutateAlbum = (ws: WebSocketManager) => {
    const message = {
      header: "MUTATE_ALBUM",
      body: {},
    };
    ws.broadcast(JSON.stringify(message));
  };
  //#endregion
}
