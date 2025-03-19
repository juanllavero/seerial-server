import ffmetadata from "ffmetadata";
import ffmpegPath from "ffmpeg-static";
import { MovieDb } from "moviedb-promise";
import * as path from "path";
import propertiesReader, { Value } from "properties-reader";
import { DataManager } from "./DataManager";

export class MovieDBWrapper {
  public static THEMOVIEDB_API_KEY: Value | null = "";
  static BASE_URL: string = "https://image.tmdb.org/t/p/original";
  // Metadata attributes
  static moviedb: MovieDb | undefined;

  public static initConnection = (): boolean => {
    if (this.moviedb) return true;

    const properties = propertiesReader(
      path.join("resources", "config", "keys.properties")
    );

    // Get API Key
    this.THEMOVIEDB_API_KEY = properties.get("TMDB_API_KEY");

    if (this.THEMOVIEDB_API_KEY) {
      this.moviedb = new MovieDb(String(this.THEMOVIEDB_API_KEY));

      if (!this.moviedb) {
        console.error("This App needs an API Key from TheMovieDB");
        return false;
      }

      ffmetadata.setFfmpegPath(ffmpegPath || "");

      return true;
    } else {
      console.error("This App needs an API Key from TheMovieDB");
      return false;
    }
  };

  public static async searchMovies(name: string, year: string, page: number) {
    if (!this.moviedb) return [];
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
    if (!this.moviedb) return [];

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

  public static searchEpisodeGroups = async (id: string) => {
    if (!this.moviedb) return;

    try {
      const episodeGroups = await this.moviedb.episodeGroups({ id });
      return episodeGroups.results;
    } catch (error) {
      console.error("Error searching movies", error);
      return [];
    }
  };

  public static async getMovie(id: number) {
    if (!this.moviedb) return;

    return await this.moviedb?.movieInfo({
      id,
      language: DataManager.library.language,
    });
  }

  public static async getTVShow(id: number) {
    if (!this.moviedb) return;

    return await this.moviedb?.tvInfo({
      id,
      language: DataManager.library.getLanguage(),
    });
  }

  public static async getSeason(showID: number, seasonNumber: number) {
    if (!this.moviedb) return;

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
  ) {
    if (!this.moviedb) return;
  }

  public static getEpisodeGroups(showID: number, seasonNumber: number) {
    if (!this.moviedb) return;
  }

  public static async getEpisodeGroup(id: string) {
    if (!this.moviedb) return;

    return await this.moviedb?.episodeGroup({
      id,
    });
  }

  public static async getTVCredits(showID: number) {
    if (!this.moviedb) return;

    return await this.moviedb?.tvCredits({ id: showID });
  }

  public static async getMovieCredits(movieID: number) {
    if (!this.moviedb) return;

    return await this.moviedb?.movieCredits({
      id: movieID,
      language: DataManager.library.language,
    });
  }

  public static async getMovieImages(movieID: number) {
    if (!this.moviedb) return;

    return await this.moviedb?.movieImages({
      id: movieID,
    });
  }

  public static async getTVShowImages(showID: number) {
    if (!this.moviedb) return;

    return await this.moviedb?.tvImages({ id: showID });
  }

  public static async getSeasonImages(showID: number, seasonNumber: number) {
    if (!this.moviedb) return;

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
    if (!this.moviedb) return;

    return await this.moviedb?.episodeImages({
      id: showID,
      season_number: seasonNumber,
      episode_number: episodeNumber,
    });
  }
}
