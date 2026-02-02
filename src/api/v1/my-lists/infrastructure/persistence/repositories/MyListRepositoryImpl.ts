import { BaseRepository } from "@/api/v1/base-repository/BaseRepository";
import { MovieModel } from "@/api/v1/movies/infrastructure/persistence/models/MovieModel";
import { SeriesModel } from "@/api/v1/series/infrastructure/persistence/models/SeriesModel";
import logger from "@/utils/logger";
import { In, Not, Raw } from "typeorm";
import { v4 as uuidv4 } from "uuid";
import { MyListRepositoryPort } from "../../../application/ports/MyListRepositoryPort";
import { MyListModel } from "../models/MyListModel";

const myListRepositoryLogger = logger.child({ category: "My List Repository" });

export class MyListRepositoryImpl
  extends BaseRepository
  implements MyListRepositoryPort
{
  // Add
  async addMovieToMyList(movieId: string, userId: string) {
    const validated = this.validateIds({ movieId, userId });

    return this.handleRepositoryError(async () => {
      // Check if the movie is already in the list
      const existingElement = await MyListModel.findOne({
        where: {
          movieId: validated.movieId,
          userId: validated.userId,
        },
      });

      if (existingElement) {
        logger.info(`The movie with ID ${movieId} is already in My List`);
        return existingElement as unknown as any;
      }

      const newElementData = {
        id: uuidv4().split("-")[0],
        movieId: validated.movieId,
        userId: validated.userId,
      };

      const newElement = MyListModel.create(newElementData);
      await newElement.save();
      return newElement as unknown as any;
    }, "Error trying to add the movie to My List");
  }

  async addSeriesToMyList(seriesId: string, userId: string) {
    const validated = this.validateIds({ seriesId, userId });

    return this.handleRepositoryError(async () => {
      // Check if the series is already in the list
      const existingElement = await MyListModel.findOne({
        where: {
          seriesId: validated.seriesId,
          userId: validated.userId,
        },
      });

      if (existingElement) {
        logger.info(`Show with ID ${seriesId} is already in My List`);
        return existingElement as unknown as any;
      }

      const newElementData = {
        id: uuidv4().split("-")[0],
        seriesId: validated.seriesId,
        userId: validated.userId,
      };

      const newElement = MyListModel.create(newElementData);
      await newElement.save();
      return newElement as unknown as any;
    }, "Error trying to add the series to My List");
  }

  // Remove
  async removeMovieFromMyList(movieId: string, userId: string) {
    const validated = this.validateIds({ movieId, userId });

    return this.handleRepositoryError(async () => {
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
    }, "Error trying to remove the movie from My List");
  }

  async removeSeriesFromMyList(seriesId: string, userId: string) {
    const validated = this.validateIds({ seriesId, userId });

    return this.handleRepositoryError(async () => {
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
    }, "Error trying to remove the series from My List");
  }

  async removeItemFromMyList(itemId: string) {
    const validatedId = this.validateId(itemId, "MyList ID");

    return this.handleRepositoryError(async () => {
      const result = await MyListModel.delete({ id: validatedId });

      this.ensureAffected(
        result.affected || 0,
        `MyList with ID ${itemId} not found`
      );
    }, `Failed to remove MyList item with ID ${itemId}`);
  }

  // Get
  async getMoviesFromMyList(userId: string) {
    const validatedId = this.validateId(userId, "User ID");

    return this.handleRepositoryError(async () => {
      // Get the IDs of the movies saved in MyList
      const myListMovies = await MyListModel.find({
        where: {
          movieId: Raw((alias: string) => `${alias} IS NOT NULL`),
          userId: validatedId,
        },
        order: { addedAt: "DESC" },
      });

      const movieIds = myListMovies.map((item) => item.movieId).filter(Boolean);

      if (movieIds.length === 0) return [];

      // Search the movies corresponding to those IDs
      const movies = await MovieModel.find({
        where: {
          id: In(movieIds),
        },
      });

      return movies.map((m) => m as unknown as any);
    }, "Error fetching Movies in My List");
  }

  async getSeriesFromMyList(userId: string) {
    const validatedId = this.validateId(userId, "User ID");

    return this.handleRepositoryError(async () => {
      // Get the IDs of the series saved in MyList
      const myListSeries = await MyListModel.find({
        where: {
          seriesId: Not(null),
          userId: validatedId,
        },
        order: { addedAt: "DESC" },
      });

      const seriesIds = myListSeries
        .map((item) => item.seriesId)
        .filter(Boolean);

      if (seriesIds.length === 0) return [];

      // Search the series corresponding to those IDs
      const series = await SeriesModel.find({
        where: {
          id: In(seriesIds),
        },
      });

      return series.map((s) => s as unknown as any);
    }, "Error fetching Series in My List");
  }

  async isMovieInMyList(movieId: string, userId: string) {
    const validated = this.validateIds({ movieId, userId });

    return this.handleRepositoryError(async () => {
      const item = await MyListModel.findOne({
        where: {
          movieId: validated.movieId,
          userId: validated.userId,
        },
      });

      return item ? (item as unknown as any) : null;
    }, "Error fetching My List items");
  }

  async isSeriesInMyList(seriesId: string, userId: string) {
    const validated = this.validateIds({ seriesId, userId });

    return this.handleRepositoryError(async () => {
      const item = await MyListModel.findOne({
        where: {
          seriesId: validated.seriesId,
          userId: validated.userId,
        },
      });

      return item ? (item as unknown as any) : null;
    }, "Error fetching My List items");
  }
}
