import { AlbumModel } from "@/api/v0/albums/infrastructure/persistence/models/AlbumModel";
import { LibraryCollectionModel } from "@/api/v0/libraries/infrastructure/persistence/models/LibraryCollectionModel";
import { LibraryModel } from "@/api/v0/libraries/infrastructure/persistence/models/LibraryModel";
import { MovieModel } from "@/api/v0/movies/infrastructure/persistence/models/MovieModel";
import { SeriesModel } from "@/api/v0/series/infrastructure/persistence/models/SeriesModel";
import fs from "fs-extra";
import path from "path";
import {
  BeforeDestroy,
  BelongsToMany,
  Column,
  DataType,
  Model,
  PrimaryKey,
  Table,
} from "sequelize-typescript";
import { CollectionAlbumModel } from "./CollectionAlbum";
import { CollectionMovieModel } from "./CollectionMovie";
import { CollectionSeriesModel } from "./CollectionSeries";

@Table({ tableName: "Collection", timestamps: false })
export class CollectionModel extends Model {
  @PrimaryKey
  @Column({
    type: DataType.STRING,
    defaultValue: () => require("uuid").v4().split("-")[0], // Generates default UUID
    allowNull: false,
  })
  id!: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  title!: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    defaultValue: "",
  })
  description?: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    field: "poster_src",
    defaultValue: "",
  })
  posterSrc!: string;

  @Column({
    type: DataType.JSON,
    allowNull: false,
    field: "posters_urls",
    defaultValue: [],
  })
  postersUrls!: string[];

  @Column({
    type: DataType.STRING,
    allowNull: true,
    field: "music_poster_src",
    defaultValue: "",
  })
  musicPosterSrc!: string;

  @Column({
    type: DataType.JSON,
    allowNull: false,
    field: "music_posters_urls",
    defaultValue: [],
  })
  musicPostersUrls!: string[];

  @Column({
    type: DataType.STRING,
    allowNull: false,
    field: "background_src",
    defaultValue: "",
  })
  backgroundSrc!: string;

  @Column({
    type: DataType.JSON,
    allowNull: false,
    field: "background_urls",
    defaultValue: [],
  })
  backgroundsUrls!: string[];

  @BelongsToMany(() => LibraryModel, {
    through: () => LibraryCollectionModel,
    hooks: true,
  })
  libraries!: LibraryModel[];

  @BelongsToMany(() => MovieModel, {
    through: () => CollectionMovieModel,
    hooks: true,
  })
  movies!: MovieModel[];

  @BelongsToMany(() => SeriesModel, {
    through: () => CollectionSeriesModel,
    hooks: true,
  })
  shows!: SeriesModel[];

  @BelongsToMany(() => AlbumModel, {
    through: () => CollectionAlbumModel,
    hooks: true,
  })
  albums!: AlbumModel[];

  @BeforeDestroy
  static async beforeDestroyHook(instance: CollectionModel): Promise<void> {
    try {
      await fs.remove(
        path.join("resources", "img", "posters", instance.id ?? "")
      );
      await fs.remove(
        path.join("resources", "img", "backgrounds", instance.id ?? "")
      );
      console.log(`Cleaned data from collection ID=${instance.id}`);
    } catch (error) {
      console.error(
        `Error cleaning data for collection ID=${instance.id}:`,
        error
      );
    }
  }
}
