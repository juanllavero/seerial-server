import {
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
import { Collection } from "../Collections/Collection.model";
import { CollectionAlbum } from "../Collections/CollectionAlbum.model";
import { Library } from "../Media/Library.model";
import { AlbumArtist } from "./AlbumArtist.model";
import { Artist } from "./Artist.model";
import { Song } from "./Song.model";

@Table({ tableName: "Album", timestamps: false })
export class Album extends Model {
  @PrimaryKey
  @Column({
    type: DataType.STRING,
    defaultValue: () => require("uuid").v4().split("-")[0], // Generates default UUID
    allowNull: false,
  })
  id!: string;

  @ForeignKey(() => Library)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    onDelete: "CASCADE",
    field: "library_id",
  })
  libraryId!: string;

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

  @BelongsTo(() => Library, { onDelete: "CASCADE" })
  library!: Library;

  @BelongsToMany(() => Collection, {
    through: () => CollectionAlbum,
    onDelete: "CASCADE",
    hooks: true,
  })
  collections!: Collection[];

  @BelongsToMany(() => Artist, {
    through: () => AlbumArtist,
    onDelete: "CASCADE",
    hooks: true,
  })
  artists!: Artist[];

  @HasMany(() => Song)
  songs!: Song[];
}
