import {
  Album,
  CollectionAlbum,
  CollectionMovie,
  Library,
  LibraryCollection,
  Movie,
  Series,
} from "@/api/v0/index.models";
import {
  BeforeDestroy,
  BelongsToMany,
  Column,
  DataType,
  Model,
  PrimaryKey,
  Table,
} from "sequelize-typescript";
import { CollectionSeries } from "./collection-series.model";
import { deleteCollectionData } from "./collections.controller";

@Table({ tableName: "Collection", timestamps: false })
export class Collection extends Model {
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

  @BelongsToMany(() => Library, {
    through: () => LibraryCollection,
    hooks: true,
  })
  libraries!: Library[];

  @BelongsToMany(() => Movie, {
    through: () => CollectionMovie,
    hooks: true,
  })
  movies!: Movie[];

  @BelongsToMany(() => Series, {
    through: () => CollectionSeries,
    hooks: true,
  })
  shows!: Series[];

  @BelongsToMany(() => Album, {
    through: () => CollectionAlbum,
    hooks: true,
  })
  albums!: Album[];

  @BeforeDestroy
  static async beforeDestroyHook(instance: Collection): Promise<void> {
    try {
      await deleteCollectionData(instance);
      console.log(`Cleaned data from collection ID=${instance.id}`);
    } catch (error) {
      console.error(
        `Error cleaning data for collection ID=${instance.id}:`,
        error
      );
    }
  }
}
