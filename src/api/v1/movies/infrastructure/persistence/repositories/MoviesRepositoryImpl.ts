import { BaseRepository } from "@/api/v1/base-repository/BaseRepository";
import { VideoModel } from "@/api/v1/videos/infrastructure/persistence/models/VideoModel";
import { GenericRepositoryHelper } from "@/helpers/GenericRepositoryHelper";
import { MoviesRepositoryPort } from "../../../application/ports/MoviesRepositoryPort";
import { Movie } from "../../../domain/Movie";
import { MovieModel } from "../models/MovieModel";

export class MoviesRepositoryImpl
  extends BaseRepository
  implements MoviesRepositoryPort
{
  // Generic helper for common CRUD operations
  private helper: GenericRepositoryHelper<MovieModel, Movie>;

  constructor() {
    super();

    // Initialize helper
    this.helper = new GenericRepositoryHelper(MovieModel, {
      entityName: "Movie",
      generateShortId: true,
    });
  }

  async findAll(libraryId: string): Promise<Movie[]> {
    const validatedLibraryId = this.validateId(libraryId, "Library ID");
    return this.helper.findManyByField("libraryId", validatedLibraryId);
  }

  async findById(id: string): Promise<Movie | null> {
    const validatedId = this.validateId(id, "Movie ID");
    return this.helper.findById(validatedId, {
      relations: ["videos", "videos.watchLists", "extras", "watchLists"],
    });
  }

  async findByPath(videoSrc: string): Promise<Movie | null> {
    const validatedPath = this.validateData(videoSrc, "Video source path");

    const video = await VideoModel.findOne({
      where: { fileSrc: validatedPath },
    });

    if (!video || !video.movieId) {
      return null;
    }

    return this.helper.findById(video.movieId);
  }

  async create(data: Partial<Movie>): Promise<Movie> {
    this.validateData(data, "Create data");
    return this.helper.create(data, true);
  }

  async update(id: string, data: Partial<Movie>): Promise<Movie> {
    const validatedId = this.validateId(id, "Movie ID");
    this.validateData(data, "Update data");
    return this.helper.update(validatedId, data);
  }

  async delete(id: string): Promise<void> {
    const validatedId = this.validateId(id, "Movie ID");
    return this.helper.delete(validatedId);
  }
}
