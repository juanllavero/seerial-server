import { Collection } from "@/api/v1/collections/domain/Collection";
import { Episode as EpisodeData } from "@/api/v1/episodes/domain/Episode";
import { Movie } from "@/api/v1/movies/domain/Movie";
import { Season } from "@/api/v1/seasons/domain/Season";
import { Series } from "@/api/v1/series/domain/Series";
import {
  CreditsResponse,
  Episode,
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
  Video,
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

  updateSeriesMetadata(
    series: Series,
    language: string
  ): Promise<Series | undefined>;
  updateMovieMetadata(
    movie: Movie,
    movieMetadata: MovieResponse,
    language: string,
    collection?: Collection
  ): Promise<void>;
  updateSeasonMetadata(season: Season, series: Series): Promise<Season>;
  updateEpisodeMetadata(
    episode: EpisodeData,
    video: Video,
    series: Series,
    episodeMetadata: Episode
  ): Promise<void>;

  updateVideoMetadataForMovie(video: Video, movie: Movie): Promise<void>;
}
