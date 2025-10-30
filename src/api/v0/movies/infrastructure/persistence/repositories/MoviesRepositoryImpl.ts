import { BaseRepository } from "@/api/v0/base-repository/BaseRepository";
import { VideoModel } from "@/api/v0/videos/infrastructure/persistence/models/VideoModel";
import { WatchListModel } from "@/api/v0/watch-lists/infrastructure/persistence/models/WatchListModel";
import { MoviesRepositoryPort } from "../../../application/ports/MoviesRepositoryPort";
import { Movie } from "../../../domain/Movie";
import { MovieModel } from "../models/MovieModel";

export class MoviesRepositoryImpl
  extends BaseRepository
  implements MoviesRepositoryPort
{
  async findAll(libraryId: string): Promise<Movie[]> {
    const validatedLibraryId = this.validateId(libraryId, "Library ID");

    return this.handleRepositoryError(async () => {
      const movies = await MovieModel.findAll({
        where: { libraryId: validatedLibraryId },
      });
      return movies;
    }, "Failed to retrieve movies");
  }

  async findById(id: string): Promise<Movie | null> {
    const validatedId = this.validateId(id, "Movie ID");

    return this.handleRepositoryError(async () => {
      const movie = await MovieModel.findByPk(validatedId, {
        include: [
          {
            model: VideoModel,
            as: "videos",
            include: [{ model: WatchListModel, as: "watchLists" }],
          },
          { model: VideoModel, as: "extras" },
          { model: WatchListModel, as: "watchLists" },
        ],
      });
      return movie;
    }, `Failed to find movie with ID ${id}`);
  }

  async findByPath(videoSrc: string): Promise<Movie | null> {
    const validatedPath = this.validateData(videoSrc, "Video source path");

    return this.handleRepositoryError(async () => {
      const video = await VideoModel.findOne({
        where: { fileSrc: validatedPath },
      });

      if (!video || !video.movieId) {
        return null;
      }

      const movie = await MovieModel.findByPk(video.movieId);
      return movie;
    }, `Failed to find movie with video source path ${videoSrc}`);
  }

  async create(data: Partial<Movie>): Promise<Movie> {
    this.validateData(data, "Create data");

    return this.handleRepositoryError(async () => {
      if (data.id) {
        const existingMovie = await MovieModel.findByPk(data.id);
        if (existingMovie) {
          return existingMovie;
        }
      }

      const movie = await MovieModel.create(data as any);
      await movie.save();

      return movie.toJSON() as Movie;
    }, "Failed to create movie");
  }

  async update(id: string, data: Partial<Movie>): Promise<Movie> {
    const validatedId = this.validateId(id, "Movie ID");
    this.validateData(data, "Update data");

    return this.handleRepositoryError(async () => {
      const [affectedCount] = await MovieModel.update(data as any, {
        where: { id: validatedId },
      });

      this.ensureAffected(affectedCount, `Movie with ID ${id} not found`);

      const updatedMovie = await MovieModel.findByPk(id);
      if (!updatedMovie) {
        throw new Error(`Failed to retrieve updated movie with ID ${id}`);
      }

      return updatedMovie;
    }, `Failed to update movie with ID ${id}`);
  }

  async delete(id: string): Promise<void> {
    const validatedId = this.validateId(id, "Movie ID");

    await this.handleRepositoryError(async () => {
      const affectedCount = await MovieModel.destroy({
        where: { id: validatedId },
      });

      this.ensureAffected(affectedCount, `Movie with ID ${id} not found`);
    }, `Failed to delete movie with ID ${id}`);
  }
}
