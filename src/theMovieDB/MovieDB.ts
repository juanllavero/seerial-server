import { FilesManager } from "@/managers/FilesManager";
import * as fs from "fs";
import {
  CreditsResponse,
  EpisodeGroupResponse,
  EpisodeImagesResponse,
  MovieImagesResponse,
  MovieResponse,
  MovieResult,
  ShowResponse,
  TvEpisodeGroupsResponse,
  TvImagesResponse,
  TvResult,
  TvSeasonImagesResponse,
  TvSeasonResponse,
} from "moviedb-promise";
import * as path from "path";
import propertiesReader from "properties-reader";

export class MovieDBWrapper {
  public static THEMOVIEDB_API_TOKEN: string = "";
  static BASE_URL: string = "https://image.tmdb.org/t/p/original";
  static connectionStatus: boolean = false;

  public static getAPIKeyStatus = async (): Promise<boolean> => {
    const url = `https://api.themoviedb.org/3/authentication`;
    const options = {
      method: "GET",
      headers: {
        accept: "application/json",
        Authorization:
          "Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI0YjQ2NTYwYWZmNWZhY2QxZDllZGUxOTZjZTdkNjc1ZiIsIm5iZiI6MTY0Mjk3ODQ4OC45Miwic3ViIjoiNjFlZGRjYjg0YTRiZmMwMDFiODdkMzdkIiwic2NvcGVzIjpbImFwaV9yZWFkIl0sInZlcnNpb24iOjF9.Zmj3Cco8C93gcTRmA-jJ3LNs0pe8TIzFY1_81x2S7q4",
      },
    };

    const response = await fetch(url, options);
    const data = await response.json();
    return data.success;
  };

  public static initConnection = async (): Promise<boolean> => {
    if (this.connectionStatus) return true;

    const propertiesFilePath = FilesManager.getExternalPath(
      path.join("resources", "config", "keys.properties")
    );

    if (!fs.existsSync(propertiesFilePath)) {
      console.warn(
        "keys.properties file not found, omitting connection with TMDB."
      );
      return false;
    }

    const properties = propertiesReader(propertiesFilePath);

    // Get API Key
    const THEMOVIEDB_API_KEY = properties.get("TMDB_API_KEY");

    if (THEMOVIEDB_API_KEY) {
      const apiKeyStatus = await this.getAPIKeyStatus();

      if (!apiKeyStatus) {
        console.error("Invalid API Key");
        return false;
      }

      this.THEMOVIEDB_API_TOKEN = String(THEMOVIEDB_API_KEY);

      console.log("[MovieDB] Connected to TheMovieDB");
      this.connectionStatus = true;

      return true;
    } else {
      console.error("This App needs an API Key from TheMovieDB");
      return false;
    }
  };

  // Aux function to make API requests
  private static async makeApiRequest(
    endpoint: string,
    queryParams: Record<string, string | number | boolean> = {}
  ): Promise<any> {
    try {
      // Build URL with query parameters
      const url = new URL(`https://api.themoviedb.org/3/${endpoint}`);

      // Add query parameters, filtering empty values
      Object.entries(queryParams).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== "") {
          url.searchParams.append(key, String(value));
        }
      });

      const options = {
        method: "GET",
        headers: {
          accept: "application/json",
          Authorization: `Bearer ${this.THEMOVIEDB_API_TOKEN}`,
        },
      };

      const response = await fetch(url.toString(), options);

      // Verify that the response is successful
      if (!response.ok) {
        console.log(
          `Error HTTP: ${response.status} - ${response.statusText} en ${endpoint}`
        );
        return null;
      }

      // Verify that the response has JSON content
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        console.log(`Error: The response of ${endpoint} is not valid JSON`);
        return null;
      }

      const data = await response.json();

      // Verify that the response has a valid JSON structure
      if (!data || typeof data !== "object") {
        console.log(`Error: The response of ${endpoint} is not valid JSON`);
        return null;
      }

      return data;
    } catch (error) {
      if (error instanceof Error) {
        console.log(`Error in request to ${endpoint}: ${error.message}`);
      } else {
        console.log(`Unknown error in request to ${endpoint}:`, error);
      }
      return null;
    }
  }

  public static async searchMovies(
    name: string,
    year: string,
    page: number
  ): Promise<MovieResult[]> {
    try {
      // Prepare query parameters
      const queryParams = {
        query: name.trim(),
        year: year.trim(),
        include_adult: false,
        page: page,
      };

      // Make API request
      const data = await this.makeApiRequest("search/movie", queryParams);

      if (!data) {
        return [];
      }

      // Verify that the results array exists
      if (!Array.isArray(data.results)) {
        console.log(
          "Error: The response does not contain a valid results array"
        );
        return [];
      }

      return data.results as MovieResult[];
    } catch (error: any) {
      if (error instanceof Error) {
        console.log(`Error in searchMovies: ${error.message}`);
      } else {
        console.log("Unknown error in searchMovies:", error);
      }
      return [];
    }
  }

  public static async searchTVShows(
    name: string,
    year: string,
    page: number
  ): Promise<TvResult[]> {
    try {
      // Prepare query parameters
      const queryParams = {
        query: name.trim(),
        first_air_date_year: year.trim(),
        include_adult: false,
        page: page,
      };

      // Make API request
      const data = await this.makeApiRequest("search/tv", queryParams);

      if (!data) {
        return [];
      }

      // Verify that the results array exists
      if (!Array.isArray(data.results)) {
        console.log(
          "Error: The response does not contain a valid results array"
        );
        return [];
      }

      return data.results as TvResult[];
    } catch (error: any) {
      if (error instanceof Error) {
        console.log(`Error in searchTVShows: ${error.message}`);
      } else {
        console.log("Unknown error in searchTVShows:", error);
      }
      return [];
    }
  }

  public static async searchEpisodeGroups(
    id: string
  ): Promise<TvEpisodeGroupsResponse | null> {
    try {
      const queryParams = {};
      const data = await this.makeApiRequest(
        `tv/${id}/episode_groups`,
        queryParams
      );

      if (!data || !Array.isArray(data.results)) {
        console.log(
          "Error: The response does not contain a valid results array"
        );
        return null;
      }

      return data.results as TvEpisodeGroupsResponse;
    } catch (error: any) {
      if (error instanceof Error) {
        console.log(`Error in searchEpisodeGroups: ${error.message}`);
      } else {
        console.log("Unknown error in searchEpisodeGroups:", error);
      }
      return null;
    }
  }

  public static async getMovie(
    id: number,
    language: string
  ): Promise<MovieResponse | null> {
    if (id < 1) return null;

    try {
      const queryParams = { language: language.trim() };
      const data = await this.makeApiRequest(`movie/${id}`, queryParams);

      if (!data) {
        console.log("Error: No data returned from API");
        return null;
      }

      return data as MovieResponse;
    } catch (error: any) {
      if (error instanceof Error) {
        console.log(`Error in getMovie: ${error.message}`);
      } else {
        console.log("Unknown error in getMovie:", error);
      }
      return null;
    }
  }

  public static async getTVShow(
    id: number,
    language: string
  ): Promise<ShowResponse | null> {
    if (id < 1) return null;

    try {
      const queryParams = { language: language.trim() };
      const data = await this.makeApiRequest(`tv/${id}`, queryParams);

      if (!data) {
        console.log("Error: No data returned from API");
        return null;
      }

      return data as ShowResponse;
    } catch (error: any) {
      if (error instanceof Error) {
        console.log(`Error in getTVShow: ${error.message}`);
      } else {
        console.log("Unknown error in getTVShow:", error);
      }
      return null;
    }
  }

  public static async getSeason(
    showID: number,
    seasonNumber: number,
    language: string
  ): Promise<TvSeasonResponse | null> {
    if (showID < 1 || seasonNumber < 0) return null;

    try {
      const queryParams = { language: language.trim() };
      const data = await this.makeApiRequest(
        `tv/${showID}/season/${seasonNumber}`,
        queryParams
      );

      if (!data) {
        console.log("Error: No data returned from API");
        return null;
      }

      return data as TvSeasonResponse;
    } catch (error: any) {
      if (error instanceof Error) {
        console.log(`Error in getSeason: ${error.message}`);
      } else {
        console.log("Unknown error in getSeason:", error);
      }
      return null;
    }
  }

  public static async getEpisodeGroups(
    showID: number
  ): Promise<EpisodeGroupResponse[] | null> {
    if (showID < 1) return null;

    try {
      const queryParams = {};
      const data = await this.makeApiRequest(
        `tv/${showID}/episode_groups`,
        queryParams
      );

      if (!data || !Array.isArray(data.results)) {
        console.log(
          "Error: The response does not contain a valid results array"
        );
        return null;
      }

      return data.results as EpisodeGroupResponse[];
    } catch (error: any) {
      if (error instanceof Error) {
        console.log(`Error in getEpisodeGroups: ${error.message}`);
      } else {
        console.log("Unknown error in getEpisodeGroups:", error);
      }
      return null;
    }
  }

  public static async getEpisodeGroup(
    id: string
  ): Promise<EpisodeGroupResponse | undefined> {
    if (!id) return undefined;

    try {
      const queryParams = {};
      const data = await this.makeApiRequest(
        `tv/episode_group/${id}`,
        queryParams
      );

      if (!data) {
        console.log("Error: No data returned from API");
        return undefined;
      }

      return data as EpisodeGroupResponse;
    } catch (error: any) {
      if (error instanceof Error) {
        console.log(`Error in getEpisodeGroup: ${error.message}`);
      } else {
        console.log("Unknown error in getEpisodeGroup:", error);
      }
      return undefined;
    }
  }

  public static async getTVCredits(
    showID: number
  ): Promise<CreditsResponse | null> {
    if (showID < 1) return null;

    try {
      const queryParams = {};
      const data = await this.makeApiRequest(
        `tv/${showID}/credits`,
        queryParams
      );

      if (!data || !Array.isArray(data.cast) || !Array.isArray(data.crew)) {
        console.log("Error: The response does not contain valid credits data");
        return null;
      }

      return data as CreditsResponse;
    } catch (error: any) {
      if (error instanceof Error) {
        console.log(`Error in getTVCredits: ${error.message}`);
      } else {
        console.log("Unknown error in getTVCredits:", error);
      }
      return null;
    }
  }

  public static async getMovieCredits(
    movieID: number,
    language: string
  ): Promise<CreditsResponse | null> {
    if (movieID < 1) return null;

    try {
      const queryParams = { language: language.trim() };
      const data = await this.makeApiRequest(
        `movie/${movieID}/credits`,
        queryParams
      );

      if (!data || !Array.isArray(data.cast) || !Array.isArray(data.crew)) {
        console.log("Error: The response does not contain valid credits data");
        return null;
      }

      return data as CreditsResponse;
    } catch (error: any) {
      if (error instanceof Error) {
        console.log(`Error in getMovieCredits: ${error.message}`);
      } else {
        console.log("Unknown error in getMovieCredits:", error);
      }
      return null;
    }
  }

  public static async getMovieImages(
    movieID: number
  ): Promise<MovieImagesResponse | null> {
    if (movieID < 1) return null;

    try {
      const queryParams = {
        include_image_language: "es,en,null,ja",
      };
      const data = await this.makeApiRequest(
        `movie/${movieID}/images`,
        queryParams
      );

      if (
        !data ||
        !Array.isArray(data.backdrops) ||
        !Array.isArray(data.posters)
      ) {
        console.log("Error: The response does not contain valid images data");
        return null;
      }

      return data as MovieImagesResponse;
    } catch (error: any) {
      if (error instanceof Error) {
        console.log(`Error in getMovieImages: ${error.message}`);
      } else {
        console.log("Unknown error in getMovieImages:", error);
      }
      return null;
    }
  }

  public static async getTVShowImages(
    showID: number
  ): Promise<TvImagesResponse | null> {
    if (showID < 1) return null;

    try {
      const queryParams = {
        include_image_language: "es,en,null,ja",
      };
      const data = await this.makeApiRequest(
        `tv/${showID}/images`,
        queryParams
      );

      if (
        !data ||
        !Array.isArray(data.backdrops) ||
        !Array.isArray(data.posters)
      ) {
        console.log("Error: The response does not contain valid images data");
        return null;
      }

      return data as TvImagesResponse;
    } catch (error: any) {
      if (error instanceof Error) {
        console.log(`Error in getTVShowImages: ${error.message}`);
      } else {
        console.log("Unknown error in getTVShowImages:", error);
      }
      return null;
    }
  }

  public static async getSeasonImages(
    showID: number,
    seasonNumber: number
  ): Promise<TvSeasonImagesResponse | null> {
    if (showID < 1 || seasonNumber < 0) return null;

    try {
      const queryParams = {
        include_image_language: "es,en,null,ja",
      };
      const data = await this.makeApiRequest(
        `tv/${showID}/season/${seasonNumber}/images`,
        queryParams
      );

      if (!data || !Array.isArray(data.posters)) {
        console.log("Error: The response does not contain valid images data");
        return null;
      }

      return data as TvSeasonImagesResponse;
    } catch (error: any) {
      if (error instanceof Error) {
        console.log(`Error in getSeasonImages: ${error.message}`);
      } else {
        console.log("Unknown error in getSeasonImages:", error);
      }
      return null;
    }
  }

  public static async getEpisodeImages(
    showID: number,
    seasonNumber: number,
    episodeNumber: number
  ): Promise<EpisodeImagesResponse | null> {
    if (showID < 1 || seasonNumber < 0 || episodeNumber < 1) return null;

    try {
      const queryParams = {
        include_image_language: "es,en,null,ja",
      };
      const data = await this.makeApiRequest(
        `tv/${showID}/season/${seasonNumber}/episode/${episodeNumber}/images`,
        queryParams
      );

      if (!data || !Array.isArray(data.stills)) {
        console.log("Error: The response does not contain valid images data");
        return null;
      }

      return data as EpisodeImagesResponse;
    } catch (error: any) {
      if (error instanceof Error) {
        console.log(`Error in getEpisodeImages: ${error.message}`);
      } else {
        console.log("Unknown error in getEpisodeImages:", error);
      }
      return null;
    }
  }
}
