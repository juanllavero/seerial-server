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

  @Column({ type: "varchar", nullable: true })
  preferAudioLan?: string;

  @Column({ type: "varchar", nullable: true })
  preferSubLan?: string;

  @Column({ type: "varchar", nullable: true })
  subsMode?: string;

  @Column({
    type: "simple-json",
    nullable: false,
    default: "{}",
  })
  analyzedFiles!: Record<string, string>;

  @Column({
    type: "simple-json",
    nullable: false,
    default: "{}",
  })
  analyzedFolders!: Record<string, string>;

  @Column({
    type: "varchar",
    nullable: false,
    default: "",
  })
  backgroundSrc!: string;

  // Relationships
  @OneToMany(() => SeriesModel, (series) => series.library, {
    onDelete: "CASCADE",
  })
  series!: SeriesModel[];

  @OneToMany(() => MovieModel, (movie) => movie.library, {
    onDelete: "CASCADE",
  })
  movies!: MovieModel[];

  @OneToMany(() => AlbumModel, (album) => album.library, {
    onDelete: "CASCADE",
  })
  albums!: AlbumModel[];

  @OneToMany(() => LibraryCollectionModel, (lc) => lc.library)
  libraryCollections!: LibraryCollectionModel[];

  @OneToMany(() => UserLibraryModel, (userLibrary) => userLibrary.library)
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
  }

  async removeAnalyzedFile(filePath: string): Promise<void> {
    const analyzedFiles = { ...this.analyzedFiles };
    delete analyzedFiles[filePath];
    this.analyzedFiles = analyzedFiles;
  }

  // Helper methods to add/remove analyzedFolders
  async addAnalyzedFolder(folderPath: string, videoId: string): Promise<void> {
    this.analyzedFolders = { ...this.analyzedFolders, [folderPath]: videoId };
  }

  async removeAnalyzedFolder(folderPath: string): Promise<void> {
    const analyzedFolders = { ...this.analyzedFolders };
    delete analyzedFolders[folderPath];
    this.analyzedFolders = analyzedFolders;
  }

  // Validation helper
  validateType(): boolean {
    return ["Shows", "Movies", "Music"].includes(this.type);
  }
}
