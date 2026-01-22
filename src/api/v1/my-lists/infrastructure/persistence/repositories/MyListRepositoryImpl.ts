import { BaseRepository } from "@/api/v1/base-repository/BaseRepository";
import { MovieModel } from "@/api/v1/movies/infrastructure/persistence/models/MovieModel";
import { SeriesModel } from "@/api/v1/series/infrastructure/persistence/models/SeriesModel";
import logger from "@/utils/logger";
import { Op } from "sequelize";
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
    try {
      // Check if the movie is already in the list
      const existingElement = await MyListModel.findOne({
        where: {
          movieId,
          userId,
        },
      });

      if (existingElement) {
        logger.info(`The movie with ID ${movieId} is already in My List`);
        return existingElement.toJSON();
      }

      const newElementData = {
        id: uuidv4().split("-")[0],
        movieId,
        userId,
      };

      const newElement = new MyListModel(newElementData);
      await newElement.save();
      return newElement.toJSON();
    } catch (error) {
      myListRepositoryLogger.error(
        error,
        "Error trying to add the movie to My List"
      );
      return null;
    }
  }
  async addSeriesToMyList(seriesId: string, userId: string) {
    try {
      // Check if the series is already in the list
      const existingElement = await MyListModel.findOne({
        where: {
          seriesId,
          userId,
        },
      });

      if (existingElement) {
        logger.info(`Show with ID ${seriesId} is already in My List`);
        return existingElement.toJSON();
      }

      const newElementData = {
        id: uuidv4().split("-")[0],
        seriesId,
        userId,
      };

      const newElement = new MyListModel(newElementData);
      await newElement.save();
      return newElement.toJSON();
    } catch (error) {
      myListRepositoryLogger.error(
        error,
        "Error trying to add the series to My List"
      );
      return null;
    }
  }

  // Remove
  async removeMovieFromMyList(movieId: string, userId: string) {
    try {
      // Checks if the movie is in the list
      const existingElement = await MyListModel.findOne({
        where: {
          movieId,
          userId,
        },
      });

      if (!existingElement) {
        logger.info(`The movie ID ${movieId} is not in My List`);
        return;
      }

      await existingElement.destroy();
    } catch (error) {
      myListRepositoryLogger.error(
        error,
        "Error trying to remove the movie from My List"
      );
      return;
    }
  }
  async removeSeriesFromMyList(seriesId: string, userId: string) {
    try {
      // Check if the series is in the list
      const existingElement = await MyListModel.findOne({
        where: {
          seriesId,
          userId,
        },
      });

      if (!existingElement) {
        logger.info(`Series with ID ${seriesId} is not in My List`);
        return;
      }

      await existingElement.destroy();
    } catch (error) {
      myListRepositoryLogger.error(
        error,
        "Error trying to remove the series from My List"
      );
      return;
    }
  }
  async removeItemFromMyList(itemId: string) {
    const affectedCount = await MyListModel.destroy({
      where: { itemId },
    });

    if (affectedCount === 0) {
      throw new Error(`MyList with ID ${itemId} not found`);
    }
  }

  // Get
  async getMoviesFromMyList(userId: string) {
    try {
      // Get the IDs of the movies saved in MyList
      const myListMovies = await MyListModel.findAll({
        where: {
          movieId: {
            [Op.not]: null,
          },
          userId: userId, // Filter by user ID if provided
        },
        attributes: ["movieId"], // Only the ID
        order: [["addedAt", "DESC"]],
      });

      const movieIds = myListMovies.map((item) => item.movieId);

      if (movieIds.length === 0) return [];

      // Search the movies corresponding to those IDs
      const movies = await MovieModel.findAll({
        where: {
          id: {
            [Op.in]: movieIds,
          },
        },
      });

      return movies.map((m) => m.toJSON());
    } catch (error: any) {
      logger.error(error, "Error fetching Movies in My_List");
      return [];
    }
  }
  async getSeriesFromMyList(userId: string) {
    try {
      // Get the IDs of the series saved in MyList
      const myListSeries = await MyListModel.findAll({
        where: {
          seriesId: {
            [Op.not]: null,
          },
          userId: userId, // Filter by user ID if provided
        },
        attributes: ["seriesId"], // Only the ID
        order: [["addedAt", "DESC"]],
      });

      const seriesIds = myListSeries.map((item) => item.seriesId);

      if (seriesIds.length === 0) return [];

      // Search the series corresponding to those IDs
      const series = await SeriesModel.findAll({
        where: {
          id: {
            [Op.in]: seriesIds,
          },
        },
      });

      return series.map((s) => s.toJSON());
    } catch (error: any) {
      logger.error(error, "Error fetching Series in My_List");
      return [];
    }
  }

  async isMovieInMyList(movieId: string, userId: string) {
    try {
      const item = await MyListModel.findOne({
        where: {
          movieId,
          userId,
        },
      });

      return item ? item.toJSON() : null;
    } catch (error: any) {
      logger.error(error, "Error fetching My_List items");
      return null;
    }
  }
  async isSeriesInMyList(seriesId: string, userId: string) {
    try {
      const item = await MyListModel.findOne({
        where: {
          seriesId,
          userId,
        },
      });

      return item ? item.toJSON() : null;
    } catch (error: any) {
      logger.error(error, "Error fetching My_List items");
      return null;
    }
  }
}
