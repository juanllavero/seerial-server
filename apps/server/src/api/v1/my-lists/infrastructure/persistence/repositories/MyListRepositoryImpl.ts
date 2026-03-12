import { In, Raw } from 'typeorm';
import { BaseRepository } from '@/api/v1/base-repository/BaseRepository';
import type { Movie } from '@/api/v1/movies/domain/Movie';
import { MovieModel } from '@/api/v1/movies/infrastructure/persistence/models/MovieModel';
import type { Series } from '@/api/v1/series/domain/Series';
import { SeriesModel } from '@/api/v1/series/infrastructure/persistence/models/SeriesModel';
import { GenericRepositoryHelper } from '@/helpers/GenericRepositoryHelper';
import logger from '@/utils/logger';
import type { MyListRepositoryPort } from '../../../application/ports/MyListRepositoryPort';
import type { MyListItem } from '../../../domain/MyList';
import { MyListModel } from '../models/MyListModel';

export class MyListRepositoryImpl extends BaseRepository implements MyListRepositoryPort {
  // Generic helper for common CRUD operations
  private helper: GenericRepositoryHelper<MyListModel, MyListModel>;

  constructor() {
    super();

    // Initialize helper
    this.helper = new GenericRepositoryHelper(MyListModel, {
      entityName: 'MyList',
      generateShortId: true,
    });
  }

  // Add
  async addMovieToMyList(movieId: string, userId: string): Promise<MyListItem | null> {
    const validated = this.validateIds({ movieId, userId });

    // Check if the movie is already in the list
    const existingElement = await MyListModel.findOne({
      where: {
        movieId: validated.movieId,
        userId: validated.userId,
      },
    });

    if (existingElement) {
      logger.info(`The movie with ID ${movieId} is already in My List`);
      return existingElement as unknown as MyListItem;
    }

    const newElementData = {
      movieId: validated.movieId,
      userId: validated.userId,
    };

    const createdElement = await this.helper.create(newElementData, true);
    return createdElement as unknown as MyListItem;
  }

  async addSeriesToMyList(seriesId: string, userId: string): Promise<MyListItem | null> {
    const validated = this.validateIds({ seriesId, userId });

    // Check if the series is already in the list
    const existingElement = await MyListModel.findOne({
      where: {
        seriesId: validated.seriesId,
        userId: validated.userId,
      },
    });

    if (existingElement) {
      logger.info(`Show with ID ${seriesId} is already in My List`);
      return existingElement as unknown as MyListItem;
    }

    const newElementData = {
      seriesId: validated.seriesId,
      userId: validated.userId,
    };

    const createdElement = await this.helper.create(newElementData, true);
    return createdElement as unknown as MyListItem;
  }

  // Remove
  async removeMovieFromMyList(movieId: string, userId: string) {
    const validated = this.validateIds({ movieId, userId });

    // Checks if the movie is in the list
    const existingElement = await MyListModel.findOne({
      where: {
        movieId: validated.movieId,
        userId: validated.userId,
      },
    });

    if (!existingElement) {
      logger.info(`The movie ID ${movieId} is not in My List`);
      return;
    }

    await existingElement.remove();
  }

  async removeSeriesFromMyList(seriesId: string, userId: string) {
    const validated = this.validateIds({ seriesId, userId });

    // Check if the series is in the list
    const existingElement = await MyListModel.findOne({
      where: {
        seriesId: validated.seriesId,
        userId: validated.userId,
      },
    });

    if (!existingElement) {
      logger.info(`Series with ID ${seriesId} is not in My List`);
      return;
    }

    await existingElement.remove();
  }

  async removeItemFromMyList(itemId: string) {
    const validatedId = this.validateId(itemId, 'MyList ID');
    return this.helper.delete(validatedId);
  }

  // Get
  async getMoviesFromMyList(userId: string) {
    const validatedId = this.validateId(userId, 'User ID');

    // Get the IDs of the movies saved in MyList
    const myListMovies = await MyListModel.find({
      where: {
        movieId: Raw((alias: string) => `${alias} IS NOT NULL`),
        userId: validatedId,
      },
      order: { addedAt: 'DESC' },
    });

    const movieIds = myListMovies.map((item) => item.movieId).filter(Boolean);

    if (movieIds.length === 0) return [];

    // Search the movies corresponding to those IDs
    const movies = await MovieModel.find({
      where: {
        id: In(movieIds),
      },
    });

    return movies as unknown as Movie[];
  }

  async getSeriesFromMyList(userId: string) {
    const validatedId = this.validateId(userId, 'User ID');

    // Get the IDs of the series saved in MyList
    const myListSeries = await MyListModel.find({
      where: {
        seriesId: Raw((alias: string) => `${alias} IS NOT NULL`),
        userId: validatedId,
      },
      order: { addedAt: 'DESC' },
    });

    const seriesIds = myListSeries.map((item) => item.seriesId).filter(Boolean);

    if (seriesIds.length === 0) return [];

    // Search the series corresponding to those IDs
    const series = await SeriesModel.find({
      where: {
        id: In(seriesIds),
      },
    });

    return series as unknown as Series[];
  }

  async isMovieInMyList(movieId: string, userId: string) {
    const validated = this.validateIds({ movieId, userId });

    const item = await MyListModel.findOne({
      where: {
        movieId: validated.movieId,
        userId: validated.userId,
      },
    });

    return Boolean(item);
  }

  async isSeriesInMyList(seriesId: string, userId: string) {
    const validated = this.validateIds({ seriesId, userId });

    const item = await MyListModel.findOne({
      where: {
        seriesId: validated.seriesId,
        userId: validated.userId,
      },
    });

    return Boolean(item);
  }
}
