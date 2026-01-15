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

export interface MetadataProviderPort {
  // Search
  searchMovies(name: string, year: string): Promise<MovieResult[]>;
  searchTVShows(name: string, year: string): Promise<TvResult[]>;
  searchEpisodeGroups(id: string): Promise<TvEpisodeGroupsResponse | null>;

  // Get Data
  getMovie(id: number, language: string): Promise<MovieResponse | null>;
  getTVShow(id: number, language: string): Promise<ShowResponse | null>;
  getSeason(
    showID: number,
    seasonNumber: number,
    language: string
  ): Promise<TvSeasonResponse | null>;

  // Get Episode Groups
  getEpisodeGroups(showID: number): Promise<EpisodeGroupResponse[] | null>;
  getEpisodeGroup(id: string): Promise<EpisodeGroupResponse | undefined>;

  // Get credits
  getMovieCredits(
    movieID: number,
    language: string
  ): Promise<CreditsResponse | null>;
  getTVCredits(showID: number): Promise<CreditsResponse | null>;

  // Get Images
  getMovieImages(movieID: number): Promise<MovieImagesResponse | null>;
  getTVShowImages(showID: number): Promise<TvImagesResponse | null>;
  getSeasonImages(
    showID: number,
    seasonNumber: number
  ): Promise<TvSeasonImagesResponse | null>;
  getEpisodeImages(
    showID: number,
    seasonNumber: number,
    episodeNumber: number
  ): Promise<EpisodeImagesResponse | null>;
}
