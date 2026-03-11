import fs from 'node:fs';
import type { MovieResponse } from 'moviedb-promise';
import type { CollectionsRepositoryPort } from '@/api/v1/collections/application/ports/CollectionsRepositoryPort';
import type { CollectionModel } from '@/api/v1/collections/infrastructure/persistence/models/CollectionModel';
import type { FileSystemServicePort } from '@/api/v1/shared/application/ports/FileSystemServicePort';
import type { MetadataProviderPort } from '@/api/v1/shared/application/ports/MetadataProviderPort';
import { imdbScoreService } from '@/api/v1/shared/infrastructure/adapters/di/container';
import type { MovieModel } from '../../infrastructure/persistence/models/MovieModel';
import type { MoviesRepositoryPort } from '../ports/MoviesRepositoryPort';

export class UpdateMovieMetadataUseCase {
  constructor(
    private readonly metadataProvider: MetadataProviderPort,
    private readonly movieRepository: MoviesRepositoryPort,
    private readonly collectionRepository: CollectionsRepositoryPort,
    private readonly fileSystemService: FileSystemServicePort,
  ) { }

  async execute(
    movie: MovieModel,
    movieMetadata: MovieResponse,
    language: string,
    collection?: CollectionModel,
  ): Promise<void> {
    // Update basic metadata
    if (!movie.nameLock) movie.name = movieMetadata.title ?? '';
    if (!movie.yearLock) movie.year = movieMetadata.release_date ?? '';
    if (!movie.overviewLock) movie.overview = movieMetadata.overview ?? '';
    if (!movie.taglineLock) movie.tagline = movieMetadata.tagline ?? '';

    movie.themdbId = movieMetadata.id ?? -1;
    movie.imdbId = movieMetadata.imdb_id ?? '-1';
    movie.score = movieMetadata.vote_average ? (movieMetadata.vote_average * 10) / 10 : 0;

    if (!movie.genresLock) {
      movie.genres = movieMetadata.genres?.map((genre) => genre.name ?? '') ?? [];
    }
    if (!movie.productionStudiosLock) {
      movie.productionStudios =
        movieMetadata.production_companies?.map((company) => company.name ?? '') ?? [];
    }

    // Get IMDB Score
    movie.imdbScore = await imdbScoreService.getIMDBScore(movie.imdbId);

    // Update cast and crew
    await this.updateMovieCredits(movie, movieMetadata.id ?? 0, language);

    // Download images (logos, backgrounds and posters)
    await this.downloadMovieImages(movie, collection);

    await this.movieRepository.update(movie.id, movie);
  }

  private async updateMovieCredits(
    movie: MovieModel,
    themdbId: number,
    language: string,
  ): Promise<void> {
    const credits = await this.metadataProvider.getMovieCredits(themdbId, language);
    if (!credits) return;

    if (credits.crew) {
      if (!movie.directedByLock) {
        movie.directedBy.splice(0, movie.directedBy.length);
        for (const person of credits.crew) {
          if (person.name && person.job === 'Director' && movie.directedBy)
            movie.directedBy = [...movie.directedBy, person.name];
        }
      }

      if (!movie.writtenByLock) {
        movie.writtenBy.splice(0, movie.writtenBy.length);
        for (const person of credits.crew) {
          if (person.name && (person.job === 'Writer' || person.job === 'Novel') && movie.writtenBy)
            movie.writtenBy = [...movie.writtenBy, person.name];
        }
      }

      if (!movie.creatorLock) movie.creator.splice(0, movie.creator.length);
      if (!movie.musicComposerLock) movie.musicComposer.splice(0, movie.musicComposer.length);

      for (const person of credits.crew) {
        if (
          person.job &&
          (person.job === 'Author' ||
            person.job === 'Novel' ||
            person.job === 'Original Series Creator' ||
            person.job === 'Comic Book' ||
            person.job === 'Idea' ||
            person.job === 'Original Story' ||
            person.job === 'Story' ||
            person.job === 'Story by' ||
            person.job === 'Book' ||
            person.job === 'Original Concept') &&
          !movie.creatorLock &&
          person.name
        ) {
          movie.creator = [...movie.creator, person.name];
        }

        if (
          person.job &&
          person.job === 'Original Music Composer' &&
          !movie.musicComposerLock &&
          person.name
        ) {
          movie.musicComposer = [...movie.musicComposer, person.name];
        }
      }
    }

    if (credits.cast) {
      movie.cast = credits.cast.map((person) => ({
        name: person.name ?? '',
        character: person.character ?? '',
        profileImage: person.profile_path
          ? `https://image.tmdb.org/t/p/original${person.profile_path}`
          : '',
      }));
    }
  }

  private async downloadMovieImages(
    movie: MovieModel,
    collection?: CollectionModel,
  ): Promise<void> {
    const images = await this.metadataProvider.getMovieImages(movie.themdbId);
    if (!images) return;

    // Create folders if they do not exist
    const outputLogosDir = this.fileSystemService.getExternalPath(
      `resources/img/logos/${movie.id}`,
    );
    if (!fs.existsSync(outputLogosDir)) {
      fs.mkdirSync(outputLogosDir);
    }

    const outputPostersDir = this.fileSystemService.getExternalPath(
      `resources/img/posters/${movie.id}`,
    );
    if (!fs.existsSync(outputPostersDir)) {
      fs.mkdirSync(outputPostersDir);
    }

    const outputPostersCollectionDir = this.fileSystemService.getExternalPath(
      `resources/img/posters/${collection?.id}`,
    );

    if (collection && !fs.existsSync(outputPostersCollectionDir)) {
      fs.mkdirSync(outputPostersCollectionDir);
    }

    const outputImageDir = this.fileSystemService.getExternalPath(
      `resources/img/backgrounds/${movie.id}`,
    );
    if (!fs.existsSync(outputImageDir)) {
      fs.mkdirSync(outputImageDir);
    }

    const baseUrl = 'https://image.tmdb.org/t/p/original';

    // Backdrops
    if (images.backdrops && images.backdrops.length > 0) {
      movie.backgroundsUrls = images.backdrops.map((img) => `${baseUrl}${img.file_path}`);
      movie.backgroundSrc = movie.backgroundsUrls[0];
    }

    // Logos
    if (images.logos && images.logos.length > 0) {
      movie.logosUrls = images.logos.map((img) => `${baseUrl}${img.file_path}`);
      movie.logoSrc = movie.logosUrls[0];
    }

    // Posters
    if (images.posters && images.posters.length > 0) {
      movie.coversUrls = images.posters.map((img) => `${baseUrl}${img.file_path}`);
      movie.coverSrc = movie.coversUrls[0];

      // If there is a collection, add poster to collection
      if (collection) {
        collection.postersUrls.push(movie.coversUrls[0]);
        if (!collection.posterSrc) {
          collection.posterSrc = movie.coversUrls[0];
        }
      }
    }
  }
}
