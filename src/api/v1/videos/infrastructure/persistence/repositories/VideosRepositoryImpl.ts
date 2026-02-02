import { BaseRepository } from "@/api/v1/base-repository/BaseRepository";
import { GenericRepositoryHelper } from "@/helpers/GenericRepositoryHelper";
import { RelationshipCreationHelper } from "@/helpers/RelationshipCreationHelper";
import { VideoRepositoryPort } from "../../../application/ports/VideosRepositoryPort";
import { Video } from "../../../domain/Video";
import { VideoModel } from "../models/VideoModel";

export class VideosRepositoryImpl
  extends BaseRepository
  implements VideoRepositoryPort
{
  // Generic helper for common CRUD operations
  private helper: GenericRepositoryHelper<VideoModel, Video>;

  // Helper for relationship-based creation
  private relationHelper: RelationshipCreationHelper<VideoModel, Video>;

  constructor() {
    super();

    // Initialize helpers
    this.helper = new GenericRepositoryHelper(VideoModel, {
      entityName: "Video",
      generateShortId: true,
    });

    this.relationHelper = new RelationshipCreationHelper(
      VideoModel,
      "Video",
      this.findById.bind(this),
      true
    );
  }

  //#region ==== BASIC CRUD OPERATIONS ====

  async findById(id: string): Promise<Video | null> {
    const validatedId = this.validateId(id, "Video ID");
    return this.helper.findById(validatedId);
  }

  async create(video: Video): Promise<Video> {
    this.validateData(video, "Video data");
    return this.helper.create(video, true);
  }

  async update(id: string, data: Partial<Video>): Promise<Video> {
    const validatedId = this.validateId(id, "Video ID");
    this.validateData(data, "Update data");
    return this.helper.update(validatedId, data);
  }

  async delete(id: string): Promise<void> {
    const validatedId = this.validateId(id, "Video ID");
    return this.helper.delete(validatedId);
  }

  //#endregion

  //#region ==== FIND BY SPECIFIC FIELDS ====

  async findByEpisodeId(episodeId: string): Promise<Video | null> {
    const validatedId = this.validateId(episodeId, "Episode ID");
    return this.helper.findByField("episodeId", validatedId, {
      relations: ["watchLists"],
    });
  }

  async findByMovieId(movieId: string): Promise<Video[]> {
    const validatedId = this.validateId(movieId, "Movie ID");
    return this.helper.findManyByField("movieId", validatedId);
  }

  async findByExtraId(extraId: string): Promise<Video | null> {
    const validatedId = this.validateId(extraId, "Extra ID");
    return this.helper.findByField("extraId", validatedId);
  }

  async findByPath(path: string): Promise<Video | null> {
    this.validateData(path, "Video path");
    return this.helper.findByField("fileSrc", path);
  }

  //#endregion

  //#region ==== RELATIONSHIP CREATION METHODS ====

  async addAsMovie(
    movieId: string,
    video?: Partial<Video>
  ): Promise<Video | null> {
    const validatedId = this.validateId(movieId, "Movie ID");
    return this.relationHelper.createWithRelation(
      "movieId",
      validatedId,
      video
    );
  }

  async addAsMovieExtra(
    movieId: string,
    video?: Partial<Video>
  ): Promise<Video | null> {
    const validatedId = this.validateId(movieId, "Movie ID");
    return this.relationHelper.createWithRelation(
      "extraId",
      validatedId,
      video
    );
  }

  async addAsEpisode(
    episodeId: string,
    video?: Partial<Video>
  ): Promise<Video | null> {
    const validatedId = this.validateId(episodeId, "Episode ID");
    return this.relationHelper.createWithRelation(
      "episodeId",
      validatedId,
      video
    );
  }

  //#endregion
}
