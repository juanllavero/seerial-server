import { BaseRepository } from "@/api/v1/base-repository/BaseRepository";
import { VideoModel } from "@/api/v1/videos/infrastructure/persistence/models/VideoModel";
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
      const movies = await MovieModel.find({
        where: { libraryId: validatedLibraryId },
      });
      return movies.map((m) => m as unknown as Movie);
    }, "Failed to retrieve movies");
  }

  async findById(id: string): Promise<Movie | null> {
    const validatedId = this.validateId(id, "Movie ID");

    return this.handleRepositoryError(async () => {
      const movie = await MovieModel.findOne({
        where: { id: validatedId },
        relations: ["videos", "videos.watchLists", "extras", "watchLists"],
      });
      return movie ? (movie as unknown as Movie) : null;
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

      const movie = await MovieModel.findOne({ where: { id: video.movieId } });
      return movie ? (movie as unknown as Movie) : null;
    }, `Failed to find movie with video source path ${videoSrc}`);
  }

  async create(data: Partial<Movie>): Promise<Movie> {
    this.validateData(data, "Create data");

    return this.handleRepositoryError(async () => {
      if (data.id) {
        const existingMovie = await MovieModel.findOne({
          where: { id: data.id },
        });
        if (existingMovie) {
          return existingMovie as unknown as Movie;
        }
      }

      const movie = MovieModel.create(data);
      await movie.save();

      return movie as unknown as Movie;
    }, "Failed to create movie");
  }

  async update(id: string, data: Partial<Movie>): Promise<Movie> {
    const validatedId = this.validateId(id, "Movie ID");
    this.validateData(data, "Update data");

    return this.handleRepositoryError(async () => {
      const result = await MovieModel.update({ id: validatedId }, data);

      this.ensureAffected(
        result.affected || 0,
        `Movie with ID ${id} not found`
      );

      const updatedMovie = await MovieModel.findOne({
        where: { id: validatedId },
      });
      if (!updatedMovie) {
        throw new Error(`Failed to retrieve updated movie with ID ${id}`);
      }

      return updatedMovie as unknown as Movie;
    }, `Failed to update movie with ID ${id}`);
  }

  async delete(id: string): Promise<void> {
    const validatedId = this.validateId(id, "Movie ID");

    await this.handleRepositoryError(async () => {
      const result = await MovieModel.delete({ id: validatedId });

      this.ensureAffected(
        result.affected || 0,
        `Movie with ID ${id} not found`
      );
    }, `Failed to delete movie with ID ${id}`);
  }
}
