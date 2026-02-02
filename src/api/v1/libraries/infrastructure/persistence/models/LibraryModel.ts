import { AlbumModel } from "@/api/v1/albums/infrastructure/persistence/models/AlbumModel";
import { MovieModel } from "@/api/v1/movies/infrastructure/persistence/models/MovieModel";
import { SeriesModel } from "@/api/v1/series/infrastructure/persistence/models/SeriesModel";
import { UserLibraryModel } from "@/api/v1/users/infrastructure/persistence/models/UserLibraryModel";
import {
  BaseEntity,
  BeforeInsert,
  Column,
  Entity,
  OneToMany,
  PrimaryColumn,
} from "typeorm";
import { v4 as uuidv4 } from "uuid";
import { LibraryCollectionModel } from "./LibraryCollectionModel";

export type LibraryType = "Shows" | "Movies" | "Music";

@Entity({ name: "Library" })
export class LibraryModel extends BaseEntity {
  @PrimaryColumn({ type: "varchar", nullable: false })
  id!: string;

  @Column({ type: "varchar", nullable: false })
  name!: string;

  @Column({ type: "varchar", nullable: false })
  language!: string;

  @Column({ type: "varchar", nullable: false })
  type!: LibraryType;

  @Column({ type: "integer", nullable: false, default: 0 })
  order!: number;

  @Column({ type: "boolean", nullable: false, default: false })
  hidden!: boolean;

  @Column({ type: "simple-json", nullable: false, default: "[]" })
  folders!: string[];

  @Column({ type: "varchar", nullable: true, name: "prefer_audio_lan" })
  preferAudioLan?: string;

  @Column({ type: "varchar", nullable: true, name: "prefer_sub_lan" })
  preferSubLan?: string;

  @Column({ type: "varchar", nullable: true, name: "subs_mode" })
  subsMode?: string;

  @Column({
    type: "simple-json",
    nullable: false,
    default: "{}",
    name: "analyzed_files",
  })
  analyzedFiles!: Record<string, string>;

  @Column({
    type: "simple-json",
    nullable: false,
    default: "{}",
    name: "analyzed_folders",
  })
  analyzedFolders!: Record<string, string>;

  @Column({
    type: "varchar",
    nullable: false,
    name: "background_src",
    default: "",
  })
  backgroundSrc!: string;

  // Relationships
  @OneToMany(() => SeriesModel, (series) => series.library, {
    cascade: true,
    onDelete: "CASCADE",
  })
  series!: SeriesModel[];

  @OneToMany(() => MovieModel, (movie) => movie.library, {
    cascade: true,
    onDelete: "CASCADE",
  })
  movies!: MovieModel[];

  @OneToMany(() => AlbumModel, (album) => album.library, {
    cascade: true,
    onDelete: "CASCADE",
  })
  albums!: AlbumModel[];

  @OneToMany(() => LibraryCollectionModel, (lc) => lc.library, {
    cascade: true,
  })
  libraryCollections!: LibraryCollectionModel[];

  @OneToMany(() => UserLibraryModel, (userLibrary) => userLibrary.library, {
    cascade: true,
  })
  userLibraries!: UserLibraryModel[];

  // Lifecycle hooks
  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = uuidv4().split("-")[0];
    }
  }

  // Helper methods to add/remove analyzedFiles
  async addAnalyzedFile(filePath: string, videoId: string): Promise<void> {
    this.analyzedFiles = { ...this.analyzedFiles, [filePath]: videoId };
    await this.save();
  }

  async removeAnalyzedFile(filePath: string): Promise<void> {
    const analyzedFiles = { ...this.analyzedFiles };
    delete analyzedFiles[filePath];
    this.analyzedFiles = analyzedFiles;
    await this.save();
  }

  // Helper methods to add/remove analyzedFolders
  async addAnalyzedFolder(folderPath: string, videoId: string): Promise<void> {
    this.analyzedFolders = { ...this.analyzedFolders, [folderPath]: videoId };
    await this.save();
  }

  async removeAnalyzedFolder(folderPath: string): Promise<void> {
    const analyzedFolders = { ...this.analyzedFolders };
    delete analyzedFolders[folderPath];
    this.analyzedFolders = analyzedFolders;
    await this.save();
  }

  // Validation helper
  validateType(): boolean {
    return ["Shows", "Movies", "Music"].includes(this.type);
  }
}
