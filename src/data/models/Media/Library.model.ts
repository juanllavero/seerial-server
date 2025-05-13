import {
  BelongsToMany,
  Column,
  DataType,
  HasMany,
  IsIn,
  Model,
  PrimaryKey,
  Table,
} from "sequelize-typescript";
import { Collection } from "../Collections/Collection.model";
import { LibraryCollection } from "../Collections/LibraryCollection";
import { Album } from "../music/Album.model";
import { Movie } from "./Movie.model";
import { Series } from "./Series.model";

@Table({ tableName: "Library", timestamps: false })
export class Library extends Model {
  @PrimaryKey
  @Column({
    type: DataType.STRING,
    defaultValue: () => require("uuid").v4().split("-")[0],
    allowNull: false,
  })
  id!: string;

  @Column({ type: DataType.STRING, allowNull: false })
  name!: string;

  @Column({ type: DataType.STRING, allowNull: false })
  language!: string;

  @IsIn([["Shows", "Movies", "Music"]])
  @Column({ type: DataType.STRING, allowNull: false })
  type!: string;

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 0 })
  order!: number;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
  hidden!: boolean;

  @Column({
    type: DataType.JSON,
    allowNull: false,
    defaultValue: [],
    field: "folders",
  })
  folders!: string[];

  @Column({ type: DataType.STRING, allowNull: true, field: "prefer_audio_lan" })
  preferAudioLan?: string;

  @Column({ type: DataType.STRING, allowNull: true, field: "prefer_sub_lan" })
  preferSubLan?: string;

  @Column({ type: DataType.STRING, allowNull: true, field: "subs_mode" })
  subsMode?: string;

  @Column({
    type: DataType.JSON,
    allowNull: false,
    defaultValue: {},
    field: "analyzed_files",
  })
  analyzedFiles!: Record<string, string>;

  @Column({
    type: DataType.JSON,
    allowNull: false,
    defaultValue: {},
    field: "analyzed_folders",
  })
  analyzedFolders!: Record<string, string>;

  // Helper methods to add/remove analyzedFiles
  async addAnalyzedFile(filePath: string, videoId: string): Promise<void> {
    const analyzedFiles = { ...this.analyzedFiles }; // Make a copy
    analyzedFiles[filePath] = videoId;
    this.analyzedFiles = analyzedFiles;

    if (this.changed("analyzedFiles")) {
      await this.save();
    }
  }

  async removeAnalyzedFile(filePath: string): Promise<void> {
    const analyzedFiles = { ...this.analyzedFiles };
    delete analyzedFiles[filePath];
    this.analyzedFiles = analyzedFiles;

    if (this.changed("analyzedFiles")) {
      await this.save();
    }
  }

  // Helper methods to add/remove analyzedFolders
  async addAnalyzedFolder(folderPath: string, videoId: string): Promise<void> {
    const analyzedFolders = { ...this.analyzedFolders };
    analyzedFolders[folderPath] = videoId;
    this.analyzedFolders = analyzedFolders;

    if (this.changed("analyzedFolders")) {
      await this.save();
    }
  }

  async removeAnalyzedFolder(folderPath: string): Promise<void> {
    const analyzedFolders = { ...this.analyzedFolders };
    delete analyzedFolders[folderPath];
    this.analyzedFolders = analyzedFolders;

    if (this.changed("analyzedFolders")) {
      await this.save();
    }
  }

  @Column({
    type: DataType.STRING,
    allowNull: false,
    field: "background_src",
    defaultValue: "",
  })
  backgroundSrc!: string;

  @HasMany(() => Series)
  series!: Series[];

  @HasMany(() => Movie)
  movies!: Movie[];

  @HasMany(() => Album)
  albums!: Album[];

  @BelongsToMany(() => Collection, {
    through: () => LibraryCollection,
    onDelete: "CASCADE",
    hooks: true,
  })
  collections!: Collection[];
}
