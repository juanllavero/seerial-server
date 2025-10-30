import { ArtistModel } from "@/api/v0/artists/infrastructure/persistence/models/ArtistModel";
import { CollectionAlbumModel } from "@/api/v0/collections/infrastructure/persistence/models/CollectionAlbum";
import { CollectionModel } from "@/api/v0/collections/infrastructure/persistence/models/CollectionModel";
import { LibraryModel } from "@/api/v0/libraries/infrastructure/persistence/models/LibraryModel";
import { SongModel } from "@/api/v0/songs/infrastructure/persistence/models/SongModel";
import fs from "fs-extra";
import path from "path";
import {
  BeforeDestroy,
  BelongsTo,
  BelongsToMany,
  Column,
  DataType,
  ForeignKey,
  HasMany,
  Model,
  PrimaryKey,
  Table,
} from "sequelize-typescript";
import { AlbumArtistModel } from "./AlbumArtistModel";

@Table({ tableName: "Album", timestamps: false })
export class AlbumModel extends Model {
  @PrimaryKey
  @Column({
    type: DataType.STRING,
    defaultValue: () => require("uuid").v4().split("-")[0],
    allowNull: false,
  })
  id!: string;

  @ForeignKey(() => LibraryModel)
  @Column({
    type: DataType.STRING,
    allowNull: false,
    onDelete: "CASCADE",
    field: "library_id",
  })
  libraryId!: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
  })
  order!: number;

  @Column({
    type: DataType.STRING,
    defaultValue: "",
    allowNull: false,
  })
  title!: string;

  @Column({
    type: DataType.STRING,
    defaultValue: "",
    allowNull: true,
  })
  year?: string;

  @Column({
    type: DataType.JSON,
    defaultValue: [],
    allowNull: true,
  })
  genres!: string[];

  @Column({
    type: DataType.TEXT,
    defaultValue: "",
    allowNull: true,
  })
  description?: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    defaultValue: "",
    field: "cover_src",
  })
  coverSrc!: string;

  @Column({
    type: DataType.STRING,
    defaultValue: "",
    allowNull: false,
  })
  folder!: string;

  @BelongsTo(() => LibraryModel, { onDelete: "CASCADE" })
  library!: LibraryModel;

  @BelongsToMany(() => CollectionModel, {
    through: () => CollectionAlbumModel,
    onDelete: "CASCADE",
    hooks: true,
  })
  collections!: CollectionModel[];

  @BelongsToMany(() => ArtistModel, {
    through: () => AlbumArtistModel,
    onDelete: "CASCADE",
    hooks: true,
  })
  artists!: ArtistModel[];

  @HasMany(() => SongModel)
  songs!: SongModel[];

  CollectionAlbum?: {
    custom_order: number;
  };

  @BeforeDestroy
  static async beforeDestroyHook(instance: AlbumModel): Promise<void> {
    try {
      await fs.remove(
        path.join("resources", "img", "posters", instance.id ?? "")
      );
      console.log(`Cleaned data from album ID=${instance.id}`);
    } catch (error) {
      console.error(`Error cleaning data for album ID=${instance.id}:`, error);
    }
  }
}
