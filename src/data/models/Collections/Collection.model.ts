import { Library } from "@/data/models/Media/Library.model";
import { Movie } from "@/data/models/Media/Movie.model";
import { Series } from "@/data/models/Media/Series.model";
import { Album } from "@/data/models/music/Album.model";
import { deleteCollectionData } from "@/db/delete/deleteData";
import {
  BeforeDestroy,
  BelongsToMany,
  Column,
  DataType,
  Model,
  PrimaryKey,
  Table,
} from "sequelize-typescript";
import { CollectionAlbum } from "./CollectionAlbum.model";
import { CollectionMovie } from "./CollectionMovie.model";
import { CollectionSeries } from "./CollectionSeries.model";
import { LibraryCollection } from "./LibraryCollection";

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
