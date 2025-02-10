import { Cast } from "../objects/Cast";
import propertiesReader from "properties-reader";
import fs from "fs-extra";
import * as path from "path";
import {
  Episode,
  EpisodeGroupResponse,
  MovieDb,
  MovieResponse,
  ShowResponse,
  TvSeasonResponse,
} from "moviedb-promise";
import ffmetadata from "ffmetadata";
import ffmpegPath from "ffmpeg-static";
import os from "os";
import pLimit from "p-limit";
import { WebSocketManager } from "./WebSocketManager";
import { Library } from "../objects/Library";
import { Season } from "../objects/Season";
import { Episode as EpisodeLocal } from "../objects/Episode";
import { EpisodeData } from "../interfaces/EpisodeData";
import { Series } from "../objects/Series";
import { DataManager } from "./DataManager";
import { Utils } from "./Utils";

export class MovieDBWrapper {
  static BASE_URL: string = "https://image.tmdb.org/t/p/original";
  // Metadata attributes
  static moviedb: MovieDb | undefined;

  // Number of threads (2 are already being used by this app, so -4 to leave some space for other apps)
  static availableThreads = Math.max(os.cpus().length - 4, 1);

  public static initConnection = (): boolean => {
    if (this.moviedb) return true;

    const properties = propertiesReader(
      path.join("resources", "config", "keys.properties")
    );

    // Get API Key
    const apiKey = properties.get("TMDB_API_KEY");

    if (apiKey) {
      this.moviedb = new MovieDb(String(apiKey));

      if (!this.moviedb) {
        console.error("This App needs an API Key from TheMovieDB");
        return false;
      }

      ffmetadata.setFfmpegPath(Utils.getInternalPath(ffmpegPath || ""));

      return true;
    } else {
      console.error("This App needs an API Key from TheMovieDB");
      return false;
    }
  };

  public static async searchMovies(name: string, year: string, page: number) {
    try {
      const res = await this.moviedb?.searchMovie({
        query: `${name}`,
        year: Number.parseInt(year),
        page,
      });

      if (res && res.results) {
        return res.results;
      }

      return [];
    } catch (e) {
      console.log("searchMovies: search for movies has failed with error " + e);
      return [];
    }
  }

  public static async searchTVShows(name: string, year: string, page: number) {
    try {
      const res = await this.moviedb?.searchTv({
        query: name,
        year: Number.parseInt(year),
        page,
      });

      if (res && res.results) {
        return res.results;
      }

      return [];
    } catch (e) {
      console.log("searchTVShows: search for shows has failed with error " + e);
      return [];
    }
  }

  public static async getMovie(id: number) {
    return await this.moviedb?.movieInfo({
      id,
      language: DataManager.library.language,
    });
  }

  public static async getTVShow(id: number) {
    return await this.moviedb?.tvInfo({
      id,
      language: DataManager.library.getLanguage(),
    });
  }

  public static async getSeason(showID: number, seasonNumber: number) {
    return await this.moviedb?.seasonInfo({
      id: showID,
      season_number: seasonNumber,
      language: DataManager.library.getLanguage(),
    });
  }

  public static getEpisode(
    showID: number,
    seasonNumber: number,
    episodeNumber: number
  ) {}

  public static getEpisodeGroups(showID: number, seasonNumber: number) {}

  public static async getEpisodeGroup(id: string) {
    return await this.moviedb?.episodeGroup({
      id,
    });
  }

  public static async getCast(id: number) {}

  public static async getCrew(id: number) {}

  public static async getTVCredits(showID: number) {
    return await this.moviedb?.tvCredits({ id: showID });
  }

  public static async getMovieCredits(movieID: number) {
    return await this.moviedb?.movieCredits({
      id: movieID,
      language: DataManager.library.language,
    });
  }

  public static async getMovieImages(movieID: number) {
    return await this.moviedb?.movieImages({
      id: movieID,
    });
  }

  public static async getTVShowImages(showID: number) {
    return await this.moviedb?.tvImages({ id: showID });
  }

  public static async getSeasonImages(showID: number, seasonNumber: number) {
    return await this.moviedb?.seasonImages({
      id: showID,
      season_number: seasonNumber,
    });
  }

  public static async getEpisodeImages(
    showID: number,
    seasonNumber: number,
    episodeNumber: number
  ) {
    return await this.moviedb?.episodeImages({
      id: showID,
      season_number: seasonNumber,
      episode_number: episodeNumber,
    });
  }
}
