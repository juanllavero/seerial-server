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
import { MetadataProviderPort } from "../../../application/ports/MetadataProviderPort";
import { TMDbApiClient } from "./TMDbApiClient";

export class MetadataProviderImpl implements MetadataProviderPort {
  constructor(private readonly apiClient: TMDbApiClient) {}

  //#region SEARCH
  public async searchMovies(
    name: string,
    year: string
  ): Promise<MovieResult[]> {
    try {
      // Prepare query parameters
      const queryParams = {
        query: name.trim(),
        year: year.trim(),
        include_adult: false,
      };

      // Make API request
      const data = await this.apiClient.makeRequest(
        "search/movie",
        queryParams
      );

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

  public async searchTVShows(name: string, year: string): Promise<TvResult[]> {
    try {
      // Prepare query parameters
      const queryParams = {
        query: name.trim(),
        first_air_date_year: year.trim(),
        include_adult: false,
      };

      // Make API request
      const data = await this.apiClient.makeRequest("search/tv", queryParams);

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

  public async searchEpisodeGroups(
    id: string
  ): Promise<TvEpisodeGroupsResponse | null> {
    try {
      const queryParams = {};
      const data = await this.apiClient.makeRequest(
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
  //#endregion

  //#region GET DATA
  public async getMovie(
    id: number,
    language: string
  ): Promise<MovieResponse | null> {
    if (id < 1) return null;

    try {
      const queryParams = { language: language.trim() };
      const data = await this.apiClient.makeRequest(`movie/${id}`, queryParams);

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

  public async getTVShow(
    id: number,
    language: string
  ): Promise<ShowResponse | null> {
    if (id < 1) return null;

    try {
      const queryParams = { language: language.trim() };
      const data = await this.apiClient.makeRequest(`tv/${id}`, queryParams);

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

  public async getSeason(
    showID: number,
    seasonNumber: number,
    language: string
  ): Promise<TvSeasonResponse | null> {
    if (showID < 1 || seasonNumber < 0) return null;

    try {
      const queryParams = { language: language.trim() };
      const data = await this.apiClient.makeRequest(
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
  //#endregion

  //#region EPISODE GROUPS
  public async getEpisodeGroups(
    showID: number
  ): Promise<EpisodeGroupResponse[] | null> {
    if (showID < 1) return null;

    try {
      const queryParams = {};
      const data = await this.apiClient.makeRequest(
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

  public async getEpisodeGroup(
    id: string
  ): Promise<EpisodeGroupResponse | undefined> {
    if (!id) return undefined;

    try {
      const queryParams = {};
      const data = await this.apiClient.makeRequest(
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
  //#endregion

  //#region CREDITS
  public async getMovieCredits(
    movieID: number,
    language: string
  ): Promise<CreditsResponse | null> {
    if (movieID < 1) return null;

    try {
      const queryParams = { language: language.trim() };
      const data = await this.apiClient.makeRequest(
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
  public async getTVCredits(showID: number): Promise<CreditsResponse | null> {
    if (showID < 1) return null;

    try {
      const queryParams = {};
      const data = await this.apiClient.makeRequest(
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
  //#endregion

  //#region IMAGES
  public async getMovieImages(
    movieID: number
  ): Promise<MovieImagesResponse | null> {
    if (movieID < 1) return null;

    try {
      const queryParams = {
        include_image_language: "es,en,null,ja",
      };
      const data = await this.apiClient.makeRequest(
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
  public async getTVShowImages(
    showID: number
  ): Promise<TvImagesResponse | null> {
    if (showID < 1) return null;

    try {
      const queryParams = {
        include_image_language: "es,en,null,ja",
      };
      const data = await this.apiClient.makeRequest(
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
  public async getSeasonImages(
    showID: number,
    seasonNumber: number
  ): Promise<TvSeasonImagesResponse | null> {
    if (showID < 1 || seasonNumber < 0) return null;

    try {
      const queryParams = {
        include_image_language: "es,en,null,ja",
      };
      const data = await this.apiClient.makeRequest(
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
  public async getEpisodeImages(
    showID: number,
    seasonNumber: number,
    episodeNumber: number
  ): Promise<EpisodeImagesResponse | null> {
    if (showID < 1 || seasonNumber < 0 || episodeNumber < 1) return null;

    try {
      const queryParams = {
        include_image_language: "es,en,null,ja",
      };
      const data = await this.apiClient.makeRequest(
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
  //#endregion
}
